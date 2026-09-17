import { isValidObjectId, Types } from "mongoose";
import {
  JANELA_DUPLO_CEGO_DIAS,
  MAX_TEXTO,
  MINIMO_PUBLICO,
  NOTA_MAX,
  NOTA_MIN,
  NOTA_PONTO_FORTE,
  PRAZO_AVALIACAO_DIAS,
  criteriosPara,
  labelCriterio,
} from "@/constants/avaliacao";
import { connectDB } from "@/lib/db";
import { msgAvaliacaoPublicada, msgConviteAvaliacao, msgDisputaAvaliacao, notificar } from "@/lib/notificacoes";
import Avaliacao, { type AutorAvaliacao, type IAvaliacao } from "@/models/Avaliacao";
import Empresa from "@/models/Empresa";
import Match, { type IMatch } from "@/models/Match";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Vaga from "@/models/Vaga";
import type { Ator } from "./ator";
import { ErroAtor } from "./erros";
import { carregarMatchDoAtor } from "./matches";

/**
 * Avaliação mútua pós-contratação. Regras em constants/avaliacao.ts.
 *
 * Só quem contratou pela plataforma (match em "contratado") avalia, uma vez
 * por vínculo. Publicação duplo-cega. A reputação agregada é recalculada a
 * cada publicação/exclusão e vive em Profissional.reputacao / Empresa.reputacao.
 */

const DIA_MS = 24 * 60 * 60 * 1000;

type Lado = "profissional" | "empresa";

function outroLado(lado: Lado): Lado {
  return lado === "profissional" ? "empresa" : "profissional";
}

function dataContratacao(m: IMatch): Date {
  return m.contratadoEm ?? m.updatedAt;
}

function prazoDias(tipoVinculo: string): number {
  return PRAZO_AVALIACAO_DIAS[tipoVinculo] ?? 30;
}

function elegivel(m: IMatch, tipoVinculo: string, agora = new Date()): boolean {
  if (m.status !== "contratado") return false;
  return agora.getTime() >= dataContratacao(m).getTime() + prazoDias(tipoVinculo) * DIA_MS;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface ConvitePendente {
  matchId: string;
  vagaTitulo: string;
  outroNome: string;
  tipoVinculo: string;
  contratadoEm: string;
}

export interface AvaliacaoDTO {
  id: string;
  matchId: string;
  autorTipo: AutorAvaliacao;
  autorNome: string;
  avaliadoNome: string;
  vagaTitulo: string;
  tipoVinculo: string;
  criterios: { chave: string; label: string; nota: number }[];
  media: number;
  recomendaria: boolean;
  /** Presente só para o avaliado e para o autor. */
  comentario: string | null;
  publicadaEm: string | null;
  resposta: { texto: string; em: string } | null;
  disputa: { motivo: string; status: string; em: string; notaAdmin: string | null } | null;
  excluida: boolean;
  criadaEm: string;
}

function paraDTO(a: IAvaliacao, m: IMatch): AvaliacaoDTO {
  const autorNome = a.autorTipo === "empresa" ? m.snapshot.empresaNome : m.snapshot.profissionalNome;
  const avaliadoNome = a.autorTipo === "empresa" ? m.snapshot.profissionalNome : m.snapshot.empresaNome;
  return {
    id: String(a._id),
    matchId: String(a.matchId),
    autorTipo: a.autorTipo,
    autorNome,
    avaliadoNome,
    vagaTitulo: m.snapshot.vagaTitulo,
    tipoVinculo: a.tipoVinculo,
    criterios: Array.from(a.criterios.entries()).map(([chave, nota]) => ({ chave, label: labelCriterio(chave), nota })),
    media: a.media,
    recomendaria: a.recomendaria,
    comentario: a.comentario ?? null,
    publicadaEm: a.publicadaEm ? a.publicadaEm.toISOString() : null,
    resposta: a.resposta ? { texto: a.resposta.texto, em: a.resposta.em.toISOString() } : null,
    disputa: a.disputa
      ? { motivo: a.disputa.motivo, status: a.disputa.status, em: a.disputa.em.toISOString(), notaAdmin: a.disputa.notaAdmin ?? null }
      : null,
    excluida: Boolean(a.excluidaEm),
    criadaEm: a.createdAt.toISOString(),
  };
}

// ─── Reputação agregada ───────────────────────────────────────────────────────

export { resumoReputacaoPublico, type ReputacaoPublica } from "@/lib/reputacao";

export async function recomputarReputacao(lado: Lado, id: Types.ObjectId | string): Promise<void> {
  await connectDB();
  // A reputação do profissional vem das avaliações feitas pela empresa, e vice-versa.
  const filtro = lado === "profissional"
    ? { profissionalId: id, autorTipo: "empresa" }
    : { empresaId: id, autorTipo: "profissional" };

  const publicadas = await Avaliacao.find({ ...filtro, publicadaEm: { $ne: null }, excluidaEm: null })
    .select("media recomendaria criterios")
    .lean();

  const total = publicadas.length;
  const somaPorCriterio = new Map<string, { soma: number; n: number }>();
  let somaMedia = 0;
  let recomendacoes = 0;

  for (const a of publicadas) {
    somaMedia += a.media;
    if (a.recomendaria) recomendacoes++;
    const criterios = a.criterios instanceof Map ? Array.from(a.criterios.entries()) : Object.entries(a.criterios ?? {});
    for (const [chave, nota] of criterios) {
      const acc = somaPorCriterio.get(chave) ?? { soma: 0, n: 0 };
      acc.soma += Number(nota);
      acc.n++;
      somaPorCriterio.set(chave, acc);
    }
  }

  const porCriterio: Record<string, number> = {};
  for (const [chave, { soma, n }] of Array.from(somaPorCriterio.entries())) {
    porCriterio[chave] = Math.round((soma / n) * 10) / 10;
  }

  const pontosFortes =
    total >= MINIMO_PUBLICO
      ? Object.entries(porCriterio)
          .filter(([, media]) => media >= NOTA_PONTO_FORTE)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([chave]) => chave)
      : [];

  const reputacao = {
    media: total ? Math.round((somaMedia / total) * 10) / 10 : null,
    total,
    recomendacoes,
    porCriterio,
    pontosFortes,
    atualizadoEm: new Date(),
  };

  // Dois models distintos: a união dos tipos não é chamável, por isso o if.
  if (lado === "profissional") await Profissional.updateOne({ _id: id }, { $set: { reputacao } });
  else await Empresa.updateOne({ _id: id }, { $set: { reputacao } });
}

// ─── Convites / pendências ────────────────────────────────────────────────────

export async function pendentesParaAvaliar(ator: Ator): Promise<ConvitePendente[]> {
  await connectDB();
  const filtro = ator.tipo === "profissional"
    ? { profissionalId: ator.profissional._id }
    : { empresaId: ator.empresa._id };

  const matches = await Match.find({ ...filtro, status: "contratado" }).sort({ contratadoEm: -1 });
  if (!matches.length) return [];

  const [vagas, feitas] = await Promise.all([
    Vaga.find({ _id: { $in: matches.map((m) => m.vagaId) } }).select("tipo").lean(),
    Avaliacao.find({ matchId: { $in: matches.map((m) => m._id) }, autorTipo: ator.tipo }).select("matchId").lean(),
  ]);
  const tipoPorVaga = new Map(vagas.map((v) => [String(v._id), v.tipo]));
  const jaAvaliados = new Set(feitas.map((a) => String(a.matchId)));

  return matches
    .filter((m) => !jaAvaliados.has(String(m._id)))
    .filter((m) => elegivel(m, tipoPorVaga.get(String(m.vagaId)) ?? "clt"))
    .map((m) => ({
      matchId: String(m._id),
      vagaTitulo: m.snapshot.vagaTitulo,
      outroNome: ator.tipo === "profissional" ? m.snapshot.empresaNome : m.snapshot.profissionalNome,
      tipoVinculo: tipoPorVaga.get(String(m.vagaId)) ?? "clt",
      contratadoEm: dataContratacao(m).toISOString(),
    }));
}

// ─── Criar ────────────────────────────────────────────────────────────────────

export interface EntradaAvaliacao {
  criterios: unknown;
  recomendaria: unknown;
  comentario?: unknown;
}

async function publicar(a: IAvaliacao, m: IMatch): Promise<void> {
  if (a.publicadaEm) return;
  a.publicadaEm = new Date();
  await a.save();

  const avaliado: Lado = outroLado(a.autorTipo);
  await recomputarReputacao(avaliado, avaliado === "profissional" ? a.profissionalId : a.empresaId);

  const autorNome = a.autorTipo === "empresa" ? m.snapshot.empresaNome : m.snapshot.profissionalNome;
  await notificar(
    avaliado === "profissional"
      ? { tipo: "profissional", perfilId: a.profissionalId }
      : { tipo: "empresa", perfilId: a.empresaId },
    msgAvaliacaoPublicada({ outroNome: autorNome, vagaTitulo: m.snapshot.vagaTitulo })
  );
}

export async function criarAvaliacao(ator: Ator, matchId: string, entrada: EntradaAvaliacao): Promise<AvaliacaoDTO> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);
  if (match.status !== "contratado") throw new ErroAtor(409, "Só é possível avaliar depois da contratação.");

  const vaga = await Vaga.findById(match.vagaId).select("tipo").lean();
  const tipoVinculo = vaga?.tipo ?? "clt";
  if (!elegivel(match, tipoVinculo)) {
    throw new ErroAtor(409, `A avaliação abre ${prazoDias(tipoVinculo)} dias depois da contratação.`);
  }

  // Critérios: exatamente os do lado que avalia, todos entre 1 e 5.
  const esperados = criteriosPara(ator.tipo);
  const brutos = entrada.criterios && typeof entrada.criterios === "object" ? (entrada.criterios as Record<string, unknown>) : {};
  const criterios = new Map<string, number>();
  for (const c of esperados) {
    const nota = Number(brutos[c.chave]);
    if (!Number.isInteger(nota) || nota < NOTA_MIN || nota > NOTA_MAX) {
      throw new ErroAtor(400, `Dê uma nota de ${NOTA_MIN} a ${NOTA_MAX} em "${c.label}".`);
    }
    criterios.set(c.chave, nota);
  }
  if (typeof entrada.recomendaria !== "boolean") throw new ErroAtor(400, "Responda se recomendaria.");

  const comentario =
    typeof entrada.comentario === "string" && entrada.comentario.trim()
      ? entrada.comentario.trim().slice(0, MAX_TEXTO)
      : null;
  const media = Math.round((Array.from(criterios.values()).reduce((a, b) => a + b, 0) / criterios.size) * 10) / 10;

  let avaliacao: IAvaliacao;
  try {
    avaliacao = await Avaliacao.create({
      matchId: match._id,
      vagaId: match.vagaId,
      empresaId: match.empresaId,
      profissionalId: match.profissionalId,
      autorTipo: ator.tipo,
      tipoVinculo,
      criterios,
      media,
      recomendaria: entrada.recomendaria,
      comentario,
    });
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) throw new ErroAtor(409, "Você já avaliou esta experiência.");
    throw err;
  }

  // Duplo-cego: se o outro lado já avaliou, publica os dois agora.
  const daOutraParte = await Avaliacao.findOne({ matchId: match._id, autorTipo: outroLado(ator.tipo) });
  if (daOutraParte) {
    await publicar(daOutraParte, match);
    await publicar(avaliacao, match);
  }

  return paraDTO(avaliacao, match);
}

// ─── Listar / responder / contestar ───────────────────────────────────────────

export async function minhasAvaliacoes(ator: Ator): Promise<{ recebidas: AvaliacaoDTO[]; enviadas: AvaliacaoDTO[] }> {
  await connectDB();
  const meuCampo = ator.tipo === "profissional" ? "profissionalId" : "empresaId";
  const meuId = ator.tipo === "profissional" ? ator.profissional._id : ator.empresa._id;

  const todas = await Avaliacao.find({ [meuCampo]: meuId }).sort({ createdAt: -1 });
  const matches = await Match.find({ _id: { $in: todas.map((a) => a.matchId) } });
  const porMatch = new Map(matches.map((m) => [String(m._id), m]));

  const recebidas: AvaliacaoDTO[] = [];
  const enviadas: AvaliacaoDTO[] = [];
  for (const a of todas) {
    const m = porMatch.get(String(a.matchId));
    if (!m) continue;
    if (a.autorTipo === ator.tipo) enviadas.push(paraDTO(a, m));
    // Recebida só aparece depois de publicada (duplo-cego).
    else if (a.publicadaEm && !a.excluidaEm) recebidas.push(paraDTO(a, m));
  }
  return { recebidas, enviadas };
}

async function carregarRecebida(ator: Ator, avaliacaoId: string): Promise<{ a: IAvaliacao; m: IMatch }> {
  if (!isValidObjectId(avaliacaoId)) throw new ErroAtor(400, "Avaliação inválida.");
  const a = await Avaliacao.findById(avaliacaoId);
  if (!a || !a.publicadaEm || a.excluidaEm) throw new ErroAtor(404, "Avaliação não encontrada.");
  if (a.autorTipo === ator.tipo) throw new ErroAtor(403, "Esta avaliação é sua, não sobre você.");
  const meuId = ator.tipo === "profissional" ? String(ator.profissional._id) : String(ator.empresa._id);
  const alvo = ator.tipo === "profissional" ? String(a.profissionalId) : String(a.empresaId);
  if (meuId !== alvo) throw new ErroAtor(403, "Sem permissão.");
  const m = await Match.findById(a.matchId);
  if (!m) throw new ErroAtor(404, "Vínculo não encontrado.");
  return { a, m };
}

export async function responderAvaliacao(ator: Ator, avaliacaoId: string, texto: unknown): Promise<AvaliacaoDTO> {
  await connectDB();
  const { a, m } = await carregarRecebida(ator, avaliacaoId);
  if (a.resposta) throw new ErroAtor(409, "Você já respondeu esta avaliação.");
  const t = typeof texto === "string" ? texto.trim().slice(0, MAX_TEXTO) : "";
  if (!t) throw new ErroAtor(400, "Escreva a resposta.");
  a.resposta = { texto: t, em: new Date() };
  await a.save();
  return paraDTO(a, m);
}

export async function contestarAvaliacao(ator: Ator, avaliacaoId: string, motivo: unknown): Promise<AvaliacaoDTO> {
  await connectDB();
  const { a, m } = await carregarRecebida(ator, avaliacaoId);
  if (a.disputa) throw new ErroAtor(409, "Esta avaliação já foi contestada.");
  const t = typeof motivo === "string" ? motivo.trim().slice(0, MAX_TEXTO) : "";
  if (!t) throw new ErroAtor(400, "Explique o motivo da contestação.");
  a.disputa = { motivo: t, em: new Date(), status: "aberta", notaAdmin: null, resolvidaEm: null };
  await a.save();

  const quem = ator.tipo === "profissional" ? m.snapshot.profissionalNome : m.snapshot.empresaNome;
  const admins = await User.find({ role: "admin", status: { $ne: "suspenso" } }).select("_id").lean();
  await Promise.all(
    admins.map((u) => notificar({ tipo: "user", userId: u._id }, msgDisputaAvaliacao({ quem, vagaTitulo: m.snapshot.vagaTitulo })))
  );
  return paraDTO(a, m);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function listarDisputas(): Promise<(AvaliacaoDTO & { avaliadoTipo: Lado })[]> {
  await connectDB();
  const abertas = await Avaliacao.find({ disputa: { $ne: null } }).sort({ "disputa.status": 1, "disputa.em": -1 }).limit(100);
  const matches = await Match.find({ _id: { $in: abertas.map((a) => a.matchId) } });
  const porMatch = new Map(matches.map((m) => [String(m._id), m]));
  return abertas
    .filter((a) => porMatch.has(String(a.matchId)))
    .map((a) => ({ ...paraDTO(a, porMatch.get(String(a.matchId))!), avaliadoTipo: outroLado(a.autorTipo) }));
}

export async function resolverDisputa(avaliacaoId: string, decisao: "aceita" | "rejeitada", notaAdmin: unknown): Promise<void> {
  await connectDB();
  if (!isValidObjectId(avaliacaoId)) throw new ErroAtor(400, "Avaliação inválida.");
  const a = await Avaliacao.findById(avaliacaoId);
  if (!a?.disputa) throw new ErroAtor(404, "Disputa não encontrada.");
  if (a.disputa.status !== "aberta") throw new ErroAtor(409, "Disputa já resolvida.");

  a.disputa.status = decisao;
  a.disputa.notaAdmin = typeof notaAdmin === "string" && notaAdmin.trim() ? notaAdmin.trim().slice(0, MAX_TEXTO) : null;
  a.disputa.resolvidaEm = new Date();
  if (decisao === "aceita") a.excluidaEm = new Date();
  a.markModified("disputa");
  await a.save();

  const avaliado: Lado = outroLado(a.autorTipo);
  if (decisao === "aceita") await recomputarReputacao(avaliado, avaliado === "profissional" ? a.profissionalId : a.empresaId);

  await notificar(
    avaliado === "profissional" ? { tipo: "profissional", perfilId: a.profissionalId } : { tipo: "empresa", perfilId: a.empresaId },
    {
      categoria: "sistema",
      titulo: decisao === "aceita" ? "Contestação aceita" : "Contestação analisada",
      corpo:
        decisao === "aceita"
          ? "A avaliação contestada foi removida da sua reputação."
          : `A avaliação foi mantida após análise.${a.disputa.notaAdmin ? ` Nota da moderação: ${a.disputa.notaAdmin}` : ""}`,
      url: "/avaliacoes",
    }
  );
}

// ─── Cron ─────────────────────────────────────────────────────────────────────

/** Publica avaliações cuja janela duplo-cega venceu sem resposta da outra parte. */
export async function publicarPendentes(): Promise<number> {
  await connectDB();
  const limite = new Date(Date.now() - JANELA_DUPLO_CEGO_DIAS * DIA_MS);
  const vencidas = await Avaliacao.find({ publicadaEm: null, createdAt: { $lte: limite } });
  let n = 0;
  for (const a of vencidas) {
    const m = await Match.findById(a.matchId);
    if (!m) continue;
    await publicar(a, m);
    n++;
  }
  return n;
}

/** Convida os dois lados de cada contratação que já abriu o prazo e ainda não foi lembrada. */
export async function convidarParaAvaliar(): Promise<number> {
  await connectDB();
  const candidatos = await Match.find({ status: "contratado", "avaliacoes.lembradaEm": null });
  if (!candidatos.length) return 0;

  const vagas = await Vaga.find({ _id: { $in: candidatos.map((m) => m.vagaId) } }).select("tipo").lean();
  const tipoPorVaga = new Map(vagas.map((v) => [String(v._id), v.tipo]));

  let n = 0;
  for (const m of candidatos) {
    const tipo = tipoPorVaga.get(String(m.vagaId)) ?? "clt";
    if (!elegivel(m, tipo)) continue;

    const matchId = String(m._id);
    const feitas = await Avaliacao.find({ matchId: m._id }).select("autorTipo").lean();
    const jaFez = new Set(feitas.map((a) => a.autorTipo));

    const envios: Promise<unknown>[] = [];
    if (!jaFez.has("profissional")) {
      envios.push(
        notificar({ tipo: "profissional", perfilId: m.profissionalId }, msgConviteAvaliacao({ outroNome: m.snapshot.empresaNome, vagaTitulo: m.snapshot.vagaTitulo, matchId }))
      );
    }
    if (!jaFez.has("empresa")) {
      envios.push(
        notificar({ tipo: "empresa", perfilId: m.empresaId }, msgConviteAvaliacao({ outroNome: m.snapshot.profissionalNome, vagaTitulo: m.snapshot.vagaTitulo, matchId }))
      );
    }
    await Promise.all(envios);
    await Match.updateOne({ _id: m._id }, { $set: { "avaliacoes.lembradaEm": new Date() } });
    n++;
  }
  return n;
}
