import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Match, { type IMatch, type StatusMatch } from "@/models/Match";
import Mensagem from "@/models/Mensagem";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Vaga from "@/models/Vaga";
import { ErroAtor, type Ator } from "./ator";
import {
  paraCardProfissional,
  paraCardVaga,
  paraContatoEmpresa,
  paraContatoProfissional,
  type CardProfissional,
  type CardVaga,
  type ContatoEmpresa,
  type ContatoProfissional,
} from "./projecoes";

const LIMITE_MENSAGEM = 2000;
const LOTE_MENSAGENS = 200;

function outroLado(ator: Ator): "profissional" | "empresa" {
  return ator.tipo === "profissional" ? "empresa" : "profissional";
}

/** Carrega o match e garante que o ator é uma das partes. */
async function carregarMatchDoAtor(ator: Ator, matchId: string): Promise<IMatch> {
  if (!isValidObjectId(matchId)) throw new ErroAtor(400, "Match inválido.");

  const match = await Match.findById(matchId);
  if (!match) throw new ErroAtor(404, "Match não encontrado.");

  const meuId =
    ator.tipo === "profissional" ? String(ator.profissional._id) : String(ator.empresa._id);
  const idNoMatch =
    ator.tipo === "profissional" ? String(match.profissionalId) : String(match.empresaId);

  if (meuId !== idNoMatch) throw new ErroAtor(403, "Este match não é seu.");
  return match;
}

export interface MatchResumo {
  id: string;
  status: StatusMatch;
  score: number;
  explicacoes: string[];
  snapshot: IMatch["snapshot"];
  ultimaMensagem: IMatch["ultimaMensagem"];
  naoLidas: number;
  vagaId: string;
  profissionalId: string;
  empresaId: string;
  criadoEm: string;
  atualizadoEm: string;
}

function resumir(m: IMatch, lado: "profissional" | "empresa"): MatchResumo {
  return {
    id: String(m._id),
    status: m.status,
    score: m.score,
    explicacoes: m.explicacoes ?? [],
    snapshot: m.snapshot,
    ultimaMensagem: m.ultimaMensagem ?? null,
    naoLidas: m.naoLidas?.[lado] ?? 0,
    vagaId: String(m.vagaId),
    profissionalId: String(m.profissionalId),
    empresaId: String(m.empresaId),
    criadoEm: m.createdAt.toISOString(),
    atualizadoEm: m.updatedAt.toISOString(),
  };
}

export async function listarMatches(
  ator: Ator,
  opcoes: { status?: StatusMatch | "todos"; vagaId?: string } = {}
): Promise<MatchResumo[]> {
  await connectDB();

  const filtro: Record<string, unknown> =
    ator.tipo === "profissional"
      ? { profissionalId: ator.profissional._id }
      : { empresaId: ator.empresa._id };

  if (opcoes.status && opcoes.status !== "todos") filtro.status = opcoes.status;
  else if (!opcoes.status) filtro.status = { $ne: "encerrado" };

  if (opcoes.vagaId && isValidObjectId(opcoes.vagaId)) filtro.vagaId = opcoes.vagaId;

  const docs = await Match.find(filtro).sort({ updatedAt: -1 }).limit(100);
  return docs.map((m) => resumir(m, ator.tipo));
}

export interface MatchDetalhe {
  match: MatchResumo;
  vaga: CardVaga;
  profissional: CardProfissional;
  /** Contato do OUTRO lado — só existe porque houve interesse mútuo. */
  contato: ContatoProfissional | ContatoEmpresa | null;
}

export async function obterMatch(ator: Ator, matchId: string): Promise<MatchDetalhe> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);

  const [vaga, profissional, empresa] = await Promise.all([
    Vaga.findById(match.vagaId).populate("empresaId", "nomeFantasia logo setor verificada").lean(),
    Profissional.findById(match.profissionalId).lean(),
    Empresa.findById(match.empresaId).lean(),
  ]);
  if (!vaga || !profissional || !empresa) throw new ErroAtor(404, "Dados do match não encontrados.");

  let contato: ContatoProfissional | ContatoEmpresa | null = null;
  if (match.status !== "encerrado") {
    if (ator.tipo === "empresa") {
      const user = await User.findById(profissional.userId).select("email").lean();
      contato = paraContatoProfissional(profissional, user?.email ?? null);
    } else {
      contato = paraContatoEmpresa(empresa);
    }
  }

  return {
    match: resumir(match, ator.tipo),
    vaga: paraCardVaga(vaga),
    profissional: paraCardProfissional(profissional),
    contato,
  };
}

/** Quem pode levar o match a cada status. */
const TRANSICOES: Record<"profissional" | "empresa", StatusMatch[]> = {
  profissional: ["encerrado"],
  empresa: ["entrevista", "contratado", "encerrado"],
};

export async function atualizarStatusMatch(
  ator: Ator,
  matchId: string,
  status: StatusMatch
): Promise<MatchResumo> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);

  if (!TRANSICOES[ator.tipo].includes(status)) {
    throw new ErroAtor(403, "Você não pode mover o match para esse status.");
  }
  if (match.status === "encerrado") throw new ErroAtor(409, "Match já encerrado.");

  match.status = status;
  if (status === "encerrado") match.encerradoPor = ator.tipo;
  await match.save();

  const aviso =
    status === "encerrado"
      ? `${ator.tipo === "empresa" ? "A empresa" : "O profissional"} encerrou esta conversa.`
      : status === "entrevista"
        ? "A empresa marcou este match como em entrevista."
        : "A empresa marcou este match como contratado. Parabéns!";
  await registrarMensagemSistema(match, aviso);

  return resumir(match, ator.tipo);
}

async function registrarMensagemSistema(match: IMatch, texto: string) {
  const msg = await Mensagem.create({
    matchId: match._id,
    autorTipo: "sistema",
    autorUserId: null,
    texto,
  });
  await Match.updateOne(
    { _id: match._id },
    {
      $set: { ultimaMensagem: { texto, autorTipo: "sistema", em: msg.createdAt } },
      $inc: { "naoLidas.profissional": 1, "naoLidas.empresa": 1 },
    }
  );
}

export interface MensagemDTO {
  id: string;
  autorTipo: "profissional" | "empresa" | "sistema";
  /** true quando quem lê é o autor. */
  minha: boolean;
  texto: string;
  lidaEm: string | null;
  em: string;
}

/**
 * Mensagens em ordem cronológica. Com `depois`, devolve só o que chegou
 * após aquele instante — é o que o polling do cliente usa. Ler marca como
 * lidas as mensagens do outro lado.
 */
export async function listarMensagens(
  ator: Ator,
  matchId: string,
  depois?: Date | null
): Promise<{ mensagens: MensagemDTO[]; agora: string; status: StatusMatch }> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);

  const filtro: Record<string, unknown> = { matchId: match._id };
  if (depois && !Number.isNaN(depois.getTime())) filtro.createdAt = { $gt: depois };

  const docs = await Mensagem.find(filtro).sort({ createdAt: 1 }).limit(LOTE_MENSAGENS).lean();

  await Promise.all([
    Mensagem.updateMany(
      { matchId: match._id, autorTipo: { $ne: ator.tipo }, lidaEm: null },
      { $set: { lidaEm: new Date() } }
    ),
    Match.updateOne({ _id: match._id }, { $set: { [`naoLidas.${ator.tipo}`]: 0 } }),
  ]);

  return {
    status: match.status,
    agora: new Date().toISOString(),
    mensagens: docs.map((m) => ({
      id: String(m._id),
      autorTipo: m.autorTipo,
      minha: m.autorTipo === ator.tipo,
      texto: m.texto,
      lidaEm: m.lidaEm ? new Date(m.lidaEm).toISOString() : null,
      em: new Date(m.createdAt).toISOString(),
    })),
  };
}

export async function enviarMensagem(
  ator: Ator,
  matchId: string,
  textoBruto: string
): Promise<MensagemDTO> {
  await connectDB();

  const texto = (textoBruto ?? "").trim();
  if (!texto) throw new ErroAtor(400, "Mensagem vazia.");
  if (texto.length > LIMITE_MENSAGEM) {
    throw new ErroAtor(400, `Mensagem acima de ${LIMITE_MENSAGEM} caracteres.`);
  }

  const match = await carregarMatchDoAtor(ator, matchId);
  if (match.status === "encerrado") throw new ErroAtor(409, "Esta conversa foi encerrada.");

  const msg = await Mensagem.create({
    matchId: match._id,
    autorTipo: ator.tipo,
    autorUserId: ator.userId,
    texto,
  });

  await Match.updateOne(
    { _id: match._id },
    {
      $set: {
        ultimaMensagem: { texto, autorTipo: ator.tipo, em: msg.createdAt },
        ...(match.status === "novo" ? { status: "conversando" } : {}),
      },
      $inc: { [`naoLidas.${outroLado(ator)}`]: 1 },
    }
  );

  return {
    id: String(msg._id),
    autorTipo: ator.tipo,
    minha: true,
    texto,
    lidaEm: null,
    em: msg.createdAt.toISOString(),
  };
}
