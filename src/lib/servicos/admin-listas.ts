import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Match from "@/models/Match";
import Mensagem from "@/models/Mensagem";
import Notificacao from "@/models/Notificacao";
import Profissional from "@/models/Profissional";
import Swipe from "@/models/Swipe";
import User from "@/models/User";
import Vaga from "@/models/Vaga";

/**
 * Listas nominais por trás dos números do /admin: o dashboard diz "1 match,
 * 0 viraram conversa"; aqui o admin vê QUAL match, entre quem, e o que
 * aconteceu depois. Mesmas regras do painel de liquidez (só mensagem de
 * pessoa conta como resposta; conversão do alerta = like ou candidatura
 * naquela vaga depois do aviso).
 */

const DIA_MS = 86_400_000;

function desdeDias(dias: number | null, agora: Date): Date | null {
  return dias ? new Date(agora.getTime() - dias * DIA_MS) : null;
}

// ─── Matches ─────────────────────────────────────────────────────────────────

export interface MatchDetalhado {
  id: string;
  em: Date;
  status: string;
  vagaId: string;
  vagaTitulo: string;
  empresaId: string;
  empresaNome: string;
  profissionalId: string;
  profissionalNome: string;
  cidade: string;
  score: number;
  /** Primeira mensagem de pessoa (não do sistema). */
  primeiraMensagem: { autor: "profissional" | "empresa"; em: Date; horasDepois: number } | null;
  totalMensagens: number;
  alertaParadoEm: Date | null;
  /** Depois do alerta, alguém falou. */
  reagiuAoAlerta: boolean;
  contratadoEm: Date | null;
  ultimaMensagemEm: Date | null;
}

export type FiltroMatch =
  | "todos"
  | "conversa"
  | "sem-mensagem"
  | "48h"
  | "alerta-parado"
  | "contratados"
  | "empresa-primeiro"
  | "profissional-primeiro";

export const FILTROS_MATCH: { value: FiltroMatch; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "conversa", label: "Viraram conversa" },
  { value: "sem-mensagem", label: "Sem nenhuma mensagem" },
  { value: "48h", label: "Resposta em 48 h" },
  { value: "empresa-primeiro", label: "Empresa falou primeiro" },
  { value: "profissional-primeiro", label: "Profissional falou primeiro" },
  { value: "alerta-parado", label: "Receberam alerta de match parado" },
  { value: "contratados", label: "Contratados" },
];

export async function matchesDetalhados(dias: number | null, agora: Date = new Date()): Promise<MatchDetalhado[]> {
  await connectDB();
  const desde = desdeDias(dias, agora);
  const matches = await Match.find(desde ? { createdAt: { $gte: desde } } : {})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  if (!matches.length) return [];

  const ids = matches.map((m) => m._id);
  const agregado = (await Mensagem.aggregate([
    { $match: { matchId: { $in: ids }, autorTipo: { $in: ["profissional", "empresa"] } } },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$matchId",
        em: { $first: "$createdAt" },
        autor: { $first: "$autorTipo" },
        total: { $sum: 1 },
        ultima: { $last: "$createdAt" },
      },
    },
  ])) as { _id: Types.ObjectId; em: Date; autor: "profissional" | "empresa"; total: number; ultima: Date }[];
  const por = new Map(agregado.map((a) => [String(a._id), a]));

  return matches.map((m) => {
    const a = por.get(String(m._id));
    const primeira = a
      ? { autor: a.autor, em: a.em, horasDepois: (new Date(a.em).getTime() - new Date(m.createdAt).getTime()) / 3_600_000 }
      : null;
    return {
      id: String(m._id),
      em: m.createdAt,
      status: m.status,
      vagaId: String(m.vagaId),
      vagaTitulo: m.snapshot?.vagaTitulo ?? "",
      empresaId: String(m.empresaId),
      empresaNome: m.snapshot?.empresaNome ?? "",
      profissionalId: String(m.profissionalId),
      profissionalNome: m.snapshot?.profissionalNome ?? "",
      cidade: [m.snapshot?.cidade, m.snapshot?.estado].filter(Boolean).join("/"),
      score: m.score ?? 0,
      primeiraMensagem: primeira,
      totalMensagens: a?.total ?? 0,
      alertaParadoEm: m.alertaParadoEm ?? null,
      reagiuAoAlerta: Boolean(m.alertaParadoEm && primeira && new Date(primeira.em) > new Date(m.alertaParadoEm)),
      contratadoEm: m.contratadoEm ?? null,
      ultimaMensagemEm: a?.ultima ?? null,
    };
  });
}

export function filtrarMatches(lista: MatchDetalhado[], f: FiltroMatch): MatchDetalhado[] {
  switch (f) {
    case "conversa": return lista.filter((m) => m.primeiraMensagem);
    case "sem-mensagem": return lista.filter((m) => !m.primeiraMensagem);
    case "48h": return lista.filter((m) => m.primeiraMensagem && m.primeiraMensagem.horasDepois <= 48);
    case "empresa-primeiro": return lista.filter((m) => m.primeiraMensagem?.autor === "empresa");
    case "profissional-primeiro": return lista.filter((m) => m.primeiraMensagem?.autor === "profissional");
    case "alerta-parado": return lista.filter((m) => m.alertaParadoEm);
    case "contratados": return lista.filter((m) => m.status === "contratado");
    default: return lista;
  }
}

// ─── Candidaturas ────────────────────────────────────────────────────────────

export interface CandidaturaDetalhada {
  id: string;
  em: Date;
  status: string;
  vagaId: string;
  vagaTitulo: string;
  vagaStatus: string;
  empresaId: string;
  empresaNome: string;
  profissionalId: string;
  profissionalNome: string;
  cidade: string;
  /** Veio do match (interesse mútuo) ou do botão "Candidatar-se". */
  viaMatch: boolean;
  triagemRespondida: boolean;
}

export async function candidaturasDetalhadas(dias: number | null, agora: Date = new Date()): Promise<CandidaturaDetalhada[]> {
  await connectDB();
  const desde = desdeDias(dias, agora);
  const cands = await Candidatura.find(desde ? { createdAt: { $gte: desde } } : {})
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  if (!cands.length) return [];

  const [vagas, empresas, profs, matches] = await Promise.all([
    Vaga.find({ _id: { $in: cands.map((c) => c.vagaId) } }).select("titulo status").lean(),
    Empresa.find({ _id: { $in: cands.map((c) => c.empresaId) } }).select("nomeFantasia").lean(),
    Profissional.find({ _id: { $in: cands.map((c) => c.profissionalId) } }).select("nomeCompleto cidade estado").lean(),
    Match.find({ candidaturaId: { $in: cands.map((c) => c._id) } }).select("candidaturaId").lean(),
  ]);
  const vaga = new Map(vagas.map((v) => [String(v._id), v]));
  const empresa = new Map(empresas.map((e) => [String(e._id), e.nomeFantasia]));
  const prof = new Map(profs.map((p) => [String(p._id), p]));
  const comMatch = new Set(matches.map((m) => String(m.candidaturaId)));

  return cands.map((c) => {
    const v = vaga.get(String(c.vagaId));
    const p = prof.get(String(c.profissionalId));
    return {
      id: String(c._id),
      em: c.createdAt,
      status: c.status,
      vagaId: String(c.vagaId),
      vagaTitulo: v?.titulo ?? "(vaga excluída)",
      vagaStatus: v?.status ?? "—",
      empresaId: String(c.empresaId),
      empresaNome: empresa.get(String(c.empresaId)) ?? "—",
      profissionalId: String(c.profissionalId),
      profissionalNome: p?.nomeCompleto ?? c.snapshotProfissional?.nomeCompleto ?? "—",
      cidade: [p?.cidade ?? c.snapshotProfissional?.cidade, p?.estado ?? c.snapshotProfissional?.estado].filter(Boolean).join("/"),
      viaMatch: comMatch.has(String(c._id)) || (c.mensagem ?? "").startsWith("Match VagaON"),
      triagemRespondida: Boolean(c.triagem?.respostas?.length),
    };
  });
}

// ─── Alertas enviados ────────────────────────────────────────────────────────

export type TipoAlerta = "vaga-nova" | "match-parado" | "resumo" | "sem-cidade" | "todos";

export const TIPOS_ALERTA: { value: TipoAlerta; label: string; regex: RegExp }[] = [
  { value: "todos", label: "Todos os avisos do sistema", regex: /./ },
  { value: "vaga-nova", label: "Vaga nova que combina", regex: /^Vaga nova que combina/ },
  { value: "match-parado", label: "Match parado", regex: /^Seu match está esperando uma mensagem/ },
  { value: "resumo", label: "Resumo semanal", regex: /^(Resumo da semana|\d+ vagas? novas? para você esta semana)/ },
  { value: "sem-cidade", label: "Perfil sem cidade", regex: /^Seu perfil está sem cidade/ },
];

export interface AlertaDetalhado {
  id: string;
  em: Date;
  userId: string;
  nome: string;
  role: string;
  titulo: string;
  url: string;
  lidaEm: Date | null;
  /** Só para "vaga nova": o avisado curtiu ou se candidatou àquela vaga depois. */
  converteu: boolean | null;
  vagaId: string | null;
}

export async function alertasDetalhados(dias: number | null, tipo: TipoAlerta, agora: Date = new Date()): Promise<AlertaDetalhado[]> {
  await connectDB();
  const desde = desdeDias(dias, agora);
  const def = TIPOS_ALERTA.find((t) => t.value === tipo) ?? TIPOS_ALERTA[0];
  const filtro: Record<string, unknown> = { categoria: "sistema" };
  if (desde) filtro.createdAt = { $gte: desde };
  if (tipo !== "todos") filtro.titulo = { $regex: def.regex.source, $options: def.regex.flags };

  const avisos = await Notificacao.find(filtro).sort({ createdAt: -1 }).limit(500).lean();
  if (!avisos.length) return [];

  const userIds = Array.from(new Set(avisos.map((a) => String(a.userId))));
  const [users, profs] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("name role").lean(),
    Profissional.find({ userId: { $in: userIds } }).select("_id userId").lean(),
  ]);
  const user = new Map(users.map((u) => [String(u._id), u]));
  const profPorUser = new Map(profs.map((p) => [String(p.userId), p._id]));

  // Conversão do alerta de vaga nova: like ou candidatura naquela vaga depois do aviso.
  const pares = avisos
    .filter((a) => /^Vaga nova que combina/.test(a.titulo))
    .map((a) => {
      const vagaId = a.url.match(/\/vagas\/([a-f0-9]{24})/)?.[1];
      const profissionalId = profPorUser.get(String(a.userId));
      return vagaId && profissionalId ? { avisoId: String(a._id), vagaId: new Types.ObjectId(vagaId), profissionalId, depois: a.createdAt } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  const converteu = new Set<string>();
  if (pares.length) {
    const cond = pares.map((p) => ({ vagaId: p.vagaId, profissionalId: p.profissionalId, createdAt: { $gte: p.depois } }));
    const [likes, cands] = await Promise.all([
      Swipe.find({ autorTipo: "profissional", direcao: { $in: ["like", "super"] }, $or: cond }).select("vagaId profissionalId").lean(),
      Candidatura.find({ $or: cond }).select("vagaId profissionalId").lean(),
    ]);
    const chaves = new Set([...likes, ...cands].map((x) => `${x.vagaId}:${x.profissionalId}`));
    for (const p of pares) if (chaves.has(`${p.vagaId}:${p.profissionalId}`)) converteu.add(p.avisoId);
  }

  return avisos.map((a) => {
    const u = user.get(String(a.userId));
    const ehVagaNova = /^Vaga nova que combina/.test(a.titulo);
    return {
      id: String(a._id),
      em: a.createdAt,
      userId: String(a.userId),
      nome: u?.name ?? "(usuário removido)",
      role: u?.role ?? "—",
      titulo: a.titulo,
      url: a.url,
      lidaEm: a.lidaEm ?? null,
      converteu: ehVagaNova ? converteu.has(String(a._id)) : null,
      vagaId: a.url.match(/\/vagas\/([a-f0-9]{24})/)?.[1] ?? null,
    };
  });
}
