import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  msgPosicoesPreenchidas,
  msgVagaExpirada,
  msgVagaExpirando,
  msgVagaFechadaParaCandidato,
  notificar,
} from "@/lib/notificacoes";
import {
  DIAS_AVISO_EXPIRACAO,
  calcularExpiracao,
  diasAte,
  expiracaoLegado,
  proximoStatus,
  renovarExpiracao,
  type AcaoVaga,
  type StatusVaga,
} from "@/lib/vagas-estado";
import Candidatura from "@/models/Candidatura";
import Vaga, { type IVaga } from "@/models/Vaga";
import { ErroAtor } from "./erros";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

/** Candidaturas ainda em andamento quando a vaga fecha — quem recebe o aviso. */
const STATUS_EM_ANDAMENTO = ["enviada", "visualizada", "em_analise", "entrevista"];
const MAX_AVISOS_FECHAMENTO = 200;

export interface ResumoVaga {
  id: string;
  status: StatusVaga;
  expiresAt: string | null;
  preenchidas: number;
  posicoes: number;
}

function resumo(v: IVaga): ResumoVaga {
  return {
    id: String(v._id),
    status: v.status,
    expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
    preenchidas: v.preenchidas ?? 0,
    posicoes: v.posicoes ?? 1,
  };
}

/**
 * Empresa muda o estado da própria vaga. Transições em vagas-estado.ts.
 * Fechar (preenchida/encerrada) avisa quem ainda estava no funil.
 */
export async function alterarStatusVaga(empresa: Doc, vagaId: string, acao: AcaoVaga): Promise<ResumoVaga> {
  await connectDB();
  if (!isValidObjectId(vagaId)) throw new ErroAtor(400, "Vaga inválida.");

  const vaga = await Vaga.findById(vagaId);
  if (!vaga) throw new ErroAtor(404, "Vaga não encontrada.");
  if (String(vaga.empresaId) !== String(empresa._id)) throw new ErroAtor(403, "Sem permissão.");

  const novo = proximoStatus(vaga.status, acao);
  if (!novo) throw new ErroAtor(400, `Não dá para "${acao}" uma vaga ${vaga.status}.`);

  const agora = new Date();
  const anterior = vaga.status;
  vaga.status = novo;

  if (novo === "ativa") {
    // Reabrir ou renovar: validade nova, aviso zerado.
    vaga.expiresAt = acao === "renovar" ? renovarExpiracao(vaga.expiresAt, agora) : calcularExpiracao({ ...vaga.toObject(), createdAt: agora }, agora);
    vaga.expiraAvisoEm = null;
    vaga.encerradaEm = null;
  } else if (novo === "preenchida" || novo === "encerrada") {
    vaga.encerradaEm = agora;
  }
  await vaga.save();

  if ((novo === "preenchida" || novo === "encerrada") && anterior !== novo) {
    await avisarCandidatosFechamento(vaga, novo, empresa.nomeFantasia ?? "A empresa");
  }
  return resumo(vaga);
}

async function avisarCandidatosFechamento(vaga: IVaga, status: "preenchida" | "encerrada", empresaNome: string) {
  const candidaturas = await Candidatura.find({ vagaId: vaga._id, status: { $in: STATUS_EM_ANDAMENTO } })
    .select("profissionalId")
    .limit(MAX_AVISOS_FECHAMENTO)
    .lean();
  const msg = msgVagaFechadaParaCandidato({ vagaTitulo: vaga.titulo, empresaNome, status });
  for (const c of candidaturas) {
    await notificar({ tipo: "profissional", perfilId: c.profissionalId }, msg);
  }
}

/**
 * Uma contratação aconteceu nesta vaga (chat "contratado" ou funil
 * "aprovada"). Conta a posição e, ao completar, pergunta à empresa se quer
 * fechar — nunca fecha sozinho.
 */
export async function registrarContratacao(vagaId: unknown): Promise<void> {
  await connectDB();
  const vaga = await Vaga.findByIdAndUpdate(vagaId, { $inc: { preenchidas: 1 } }, { new: true })
    .select("titulo empresaId posicoes preenchidas status")
    .lean();
  if (!vaga || vaga.status !== "ativa") return;
  if ((vaga.preenchidas ?? 0) >= (vaga.posicoes ?? 1)) {
    await notificar(
      { tipo: "empresa", perfilId: vaga.empresaId },
      msgPosicoesPreenchidas({ vagaTitulo: vaga.titulo, vagaId: String(vaga._id), posicoes: vaga.posicoes ?? 1 })
    );
  }
}

/** Validade inicial de uma vaga recém-criada. */
export function expiracaoInicial(vaga: { tipo: string; periodo?: { dataFim?: Date | string | null } | null }): Date {
  return calcularExpiracao({ ...vaga, createdAt: new Date() });
}

export interface ResultadoManutencaoVagas {
  validadeAtribuida: number;
  avisadas: number;
  expiradas: number;
}

/**
 * Cron diário: dá validade a vagas antigas (com carência), avisa 3 dias
 * antes e expira o que venceu. Cada passo é idempotente.
 */
export async function manutencaoVagas(agora: Date = new Date()): Promise<ResultadoManutencaoVagas> {
  await connectDB();
  const r: ResultadoManutencaoVagas = { validadeAtribuida: 0, avisadas: 0, expiradas: 0 };

  // 1. Vagas ativas sem validade (anteriores a esta regra).
  const semValidade = await Vaga.find({ status: "ativa", expiresAt: null }).select("tipo periodo createdAt").lean();
  for (const v of semValidade) {
    await Vaga.updateOne({ _id: v._id }, { $set: { expiresAt: expiracaoLegado(v, agora) } });
    r.validadeAtribuida++;
  }

  // 2. Expira o que venceu.
  const vencidas = await Vaga.find({ status: "ativa", expiresAt: { $lte: agora } }).select("titulo empresaId").lean();
  for (const v of vencidas) {
    await Vaga.updateOne({ _id: v._id }, { $set: { status: "expirada", encerradaEm: agora } });
    await notificar({ tipo: "empresa", perfilId: v.empresaId }, msgVagaExpirada({ vagaTitulo: v.titulo, vagaId: String(v._id) }));
    r.expiradas++;
  }

  // 3. Avisa quem expira em breve (uma vez por validade).
  const limite = new Date(agora.getTime() + DIAS_AVISO_EXPIRACAO * 86_400_000);
  const proximas = await Vaga.find({ status: "ativa", expiresAt: { $gt: agora, $lte: limite }, expiraAvisoEm: null })
    .select("titulo empresaId expiresAt")
    .lean();
  for (const v of proximas) {
    const dias = Math.max(1, diasAte(v.expiresAt, agora) ?? 1);
    await notificar({ tipo: "empresa", perfilId: v.empresaId }, msgVagaExpirando({ vagaTitulo: v.titulo, vagaId: String(v._id), dias }));
    await Vaga.updateOne({ _id: v._id }, { $set: { expiraAvisoEm: agora } });
    r.avisadas++;
  }

  return r;
}
