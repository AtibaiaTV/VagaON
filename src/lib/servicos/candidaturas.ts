import { isValidObjectId } from "mongoose";
import { labelEspecialidade } from "@/constants/especialidades";
import { connectDB } from "@/lib/db";
import { avaliarMatch, faixaDoScore, foiEliminado, paraProfissionalMatch, paraVagaMatch } from "@/lib/match";
import { msgStatusCandidatura, notificar } from "@/lib/notificacoes";
import Candidatura, { type ICandidatura } from "@/models/Candidatura";
import Match from "@/models/Match";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";
import { ErroAtor } from "./erros";
import {
  CANDIDATURA_PARA_MATCH,
  STATUS_CANDIDATURA,
  aplicarStatusMatch,
  type StatusCandidatura,
} from "./status";
import { triagemParaKanban, type TriagemKanban } from "./triagem";
import { registrarContratacao } from "./vagas";

/**
 * Funil de candidatos de uma vaga (Kanban da empresa).
 * Entram documentos `.lean()` de formatos variados, por isso Record<string, any>.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

/** Colunas em que o modo às cegas ainda esconde quem é. */
const STATUS_AS_CEGAS: StatusCandidatura[] = ["enviada", "visualizada", "em_analise"];

export interface CandidatoKanban {
  id: string;
  status: StatusCandidatura;
  criadoEm: string;
  mensagem: string | null;
  notaEmpresa: string | null;
  profissionalId: string;
  nome: string;
  foto: string | null;
  cidade: string;
  estado: string;
  especialidades: string[];
  anosExperiencia: number;
  score: { total: number; faixa: string; explicacao: string | null } | null;
  /** Presente quando o par já deu match — abre o chat. */
  matchId: string | null;
  /** true quando o modo às cegas escondeu nome e foto. */
  oculto: boolean;
  /** Respostas às perguntas da vaga + leitura da IA (null se não respondeu). */
  triagem: TriagemKanban | null;
  /** Vídeo de apresentação — escondido junto com a foto no modo às cegas. */
  video: { url: string; duracao: number } | null;
}

export async function candidatosDaVaga(
  empresa: Doc,
  vaga: Doc,
  opcoes: { marcarVisualizadas?: boolean } = {}
): Promise<CandidatoKanban[]> {
  await connectDB();

  // Abrir o funil é "ver": o candidato ganha o sinal de "visualizada".
  if (opcoes.marcarVisualizadas !== false) {
    await Candidatura.updateMany({ vagaId: vaga._id, status: "enviada" }, { $set: { status: "visualizada" } });
  }

  const candidaturas = await Candidatura.find({ vagaId: vaga._id }).sort({ createdAt: -1 }).lean();
  if (!candidaturas.length) return [];

  const ids = candidaturas.map((c) => c.profissionalId);
  const [profissionais, matches] = await Promise.all([
    Profissional.find({ _id: { $in: ids } }).lean(),
    Match.find({ vagaId: vaga._id }).select("profissionalId").lean(),
  ]);
  const porId = new Map(profissionais.map((p) => [String(p._id), p]));
  const matchPorProfissional = new Map(matches.map((m) => [String(m.profissionalId), String(m._id)]));

  const alvo = paraVagaMatch(vaga, Boolean(empresa.verificada));
  const cego = empresa.match?.modoCego === true;

  const saida: CandidatoKanban[] = candidaturas.map((c, i) => {
    const p = porId.get(String(c.profissionalId));
    const status = c.status as StatusCandidatura;
    const oculto = cego && STATUS_AS_CEGAS.includes(status);

    let score: CandidatoKanban["score"] = null;
    if (p) {
      const r = avaliarMatch(paraProfissionalMatch(p), alvo);
      if (!foiEliminado(r)) {
        score = { total: r.total, faixa: faixaDoScore(r.total).label, explicacao: r.explicacoes[0] ?? null };
      }
    }

    const nome = p?.nomeCompleto ?? c.snapshotProfissional?.nomeCompleto ?? "Candidato";
    return {
      id: String(c._id),
      status,
      criadoEm: new Date(c.createdAt).toISOString(),
      mensagem: c.mensagem ?? null,
      notaEmpresa: c.notaEmpresa ?? null,
      profissionalId: String(c.profissionalId),
      nome: oculto ? `Candidato ${candidaturas.length - i}` : nome,
      foto: oculto ? null : (p?.fotoPerfil ?? c.snapshotProfissional?.fotoPerfil ?? null),
      cidade: p?.cidade ?? c.snapshotProfissional?.cidade ?? "",
      estado: p?.estado ?? c.snapshotProfissional?.estado ?? "",
      especialidades: (p?.especialidades ?? c.snapshotProfissional?.especialidades ?? []).map(labelEspecialidade),
      anosExperiencia: p?.anosExperiencia ?? 0,
      score,
      matchId: matchPorProfissional.get(String(c.profissionalId)) ?? null,
      oculto,
      triagem: triagemParaKanban(c.triagem),
      video: !oculto && p?.videoApresentacao?.url ? { url: p.videoApresentacao.url, duracao: p.videoApresentacao.duracao ?? 0 } : null,
    };
  });

  // Melhor aderência primeiro; sem score vai para o fim.
  return saida.sort((a, b) => (b.score?.total ?? -1) - (a.score?.total ?? -1));
}

export interface MudancaCandidatura {
  status?: StatusCandidatura;
  notaEmpresa?: string | null;
}

/**
 * Move um card do funil (e/ou anota). Reflete no match ligado e avisa o
 * profissional das transições que importam.
 */
export async function moverCandidatura(
  empresa: Doc,
  candidaturaId: string,
  mudanca: MudancaCandidatura
): Promise<ICandidatura> {
  await connectDB();
  if (!isValidObjectId(candidaturaId)) throw new ErroAtor(400, "Candidatura inválida.");

  const candidatura = await Candidatura.findById(candidaturaId);
  if (!candidatura) throw new ErroAtor(404, "Candidatura não encontrada.");
  if (String(candidatura.empresaId) !== String(empresa._id)) throw new ErroAtor(403, "Sem permissão.");

  if (mudanca.status !== undefined && !STATUS_CANDIDATURA.includes(mudanca.status)) {
    throw new ErroAtor(400, "Status inválido.");
  }

  const statusAnterior = candidatura.status;
  if (mudanca.notaEmpresa !== undefined) {
    candidatura.notaEmpresa = mudanca.notaEmpresa ? String(mudanca.notaEmpresa).slice(0, 1000) : null;
  }
  const mudouStatus = mudanca.status !== undefined && mudanca.status !== statusAnterior;
  if (mudouStatus) candidatura.status = mudanca.status!;
  await candidatura.save();

  if (!mudouStatus) return candidatura;

  // Kanban → chat.
  const statusMatch = CANDIDATURA_PARA_MATCH[candidatura.status];
  if (statusMatch) {
    const match = await Match.findOne({ vagaId: candidatura.vagaId, profissionalId: candidatura.profissionalId });
    if (match) {
      await aplicarStatusMatch(match, statusMatch, "empresa"); // com match, ele conta a contratação
    } else if (candidatura.status === "aprovada") {
      await registrarContratacao(candidatura.vagaId); // candidato do site, sem match
    }
  }

  const vaga = await Vaga.findById(candidatura.vagaId).select("titulo").lean();
  const msg = msgStatusCandidatura({
    status: candidatura.status,
    vagaTitulo: vaga?.titulo ?? "sua vaga",
    empresaNome: empresa.nomeFantasia ?? "A empresa",
  });
  if (msg) await notificar({ tipo: "profissional", perfilId: candidatura.profissionalId }, msg);

  return candidatura;
}
