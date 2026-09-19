import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { msgPosicoesPreenchidas, msgVagaFechadaParaCandidato, notificar } from "@/lib/notificacoes";
import { proximoStatus, type AcaoVaga, type StatusVaga } from "@/lib/vagas-estado";
import Candidatura from "@/models/Candidatura";
import Vaga, { type IVaga } from "@/models/Vaga";
import { ErroAtor } from "./erros";
import { registrarHistoricoVaga, type Autor } from "./historico-vaga";

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
export async function alterarStatusVaga(empresa: Doc, vagaId: string, acao: AcaoVaga, por?: Autor): Promise<ResumoVaga> {
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
    // Reabrir: volta ao ar sem prazo — a vaga só sai quando a empresa decidir.
    vaga.expiresAt = null;
    vaga.expiraAvisoEm = null;
    vaga.encerradaEm = null;
  } else if (novo === "preenchida" || novo === "encerrada") {
    vaga.encerradaEm = agora;
  }
  await vaga.save();
  await registrarHistoricoVaga(
    vaga._id,
    "status",
    por ?? { tipo: "empresa", nome: empresa.nomeFantasia ?? "" },
    `${anterior} → ${novo} (${acao})`
  );

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

export interface ResultadoManutencaoVagas {
  validadeRemovida: number;
}

/**
 * Cron diário. A vaga não expira mais por prazo (decisão de 18/09/2026: fica
 * no ar até a empresa pausar, encerrar ou excluir). Este passo só garante que
 * nenhuma vaga carregue validade herdada da regra antiga — idempotente, e
 * zero na maioria dos dias.
 */
export async function manutencaoVagas(): Promise<ResultadoManutencaoVagas> {
  await connectDB();
  const r = await Vaga.updateMany(
    { $or: [{ expiresAt: { $ne: null } }, { expiraAvisoEm: { $ne: null } }] },
    { $set: { expiresAt: null, expiraAvisoEm: null } }
  );
  return { validadeRemovida: r.modifiedCount };
}
