import slugify from "slugify";
import { connectDB } from "@/lib/db";
import { ESPECIALIDADES, labelEspecialidade } from "@/constants/especialidades";
import Vaga from "@/models/Vaga";

/**
 * Páginas de vagas por cidade e por função ("garçom em Atibaia"), para o
 * Google. Só existem para combinações com vaga ativa: página vazia não
 * ajuda ninguém e o Google penaliza. Tudo é derivado das vagas ativas, sem
 * tabela extra; um cache curto em memória evita agregar a cada request.
 */

export interface CidadeComVagas {
  cidade: string;
  uf: string;
  slug: string;
  total: number;
  funcoes: { especialidade: string; slug: string; label: string; total: number }[];
}

const TTL_MS = 10 * 60_000;
const ESPECIALIDADES_VALIDAS = new Set(ESPECIALIDADES.map((e) => e.value));
let cache: { em: number; lista: CidadeComVagas[] } | null = null;

export function slugCidade(cidade: string, uf: string): string {
  return slugify(`${cidade} ${uf}`, { lower: true, strict: true, locale: "pt", trim: true });
}

export function slugFuncao(especialidade: string): string {
  return especialidade.replace(/_/g, "-");
}

export function especialidadeDoSlug(slug: string): string | null {
  const valor = slug.replace(/-/g, "_");
  return ESPECIALIDADES.some((e) => e.value === valor) ? valor : null;
}

/** Cidades com vaga ativa, com as funções de cada uma. Ordem: mais vagas primeiro. */
export async function cidadesComVagas(): Promise<CidadeComVagas[]> {
  const agora = Date.now();
  if (cache && agora - cache.em < TTL_MS) return cache.lista;

  await connectDB();
  const linhas = (await Vaga.aggregate([
    { $match: { status: "ativa", aprovadaPorAdmin: true, cidade: { $nin: ["", null] } } },
    { $group: { _id: { cidade: "$cidade", uf: "$estado", especialidade: "$especialidade" }, n: { $sum: 1 } } },
  ])) as { _id: { cidade: string; uf: string; especialidade: string }; n: number }[];

  const porCidade = new Map<string, CidadeComVagas>();
  for (const l of linhas) {
    const cidade = String(l._id.cidade ?? "").trim();
    const uf = String(l._id.uf ?? "").trim().toUpperCase();
    if (!cidade) continue;
    const slug = slugCidade(cidade, uf);
    let c = porCidade.get(slug);
    if (!c) {
      c = { cidade, uf, slug, total: 0, funcoes: [] };
      porCidade.set(slug, c);
    }
    c.total += l.n;
    // Só funções da tabela viram página: vagas importadas trazem texto livre
    // ("Hotelaria / Governança") que não dá URL nem tem página para resolver.
    const esp = String(l._id.especialidade ?? "");
    if (esp && ESPECIALIDADES_VALIDAS.has(esp)) {
      const f = c.funcoes.find((x) => x.especialidade === esp);
      if (f) f.total += l.n;
      else c.funcoes.push({ especialidade: esp, slug: slugFuncao(esp), label: labelEspecialidade(esp), total: l.n });
    }
  }

  const lista = Array.from(porCidade.values())
    .map((c) => ({ ...c, funcoes: c.funcoes.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "pt-BR")) }))
    .sort((a, b) => b.total - a.total || a.cidade.localeCompare(b.cidade, "pt-BR"));

  cache = { em: agora, lista };
  return lista;
}

export async function cidadePorSlug(slug: string): Promise<CidadeComVagas | null> {
  const lista = await cidadesComVagas();
  return lista.find((c) => c.slug === slug) ?? null;
}

/** Vagas ativas da cidade (e função, se houver), já com a empresa para o card. */
export async function vagasDaCidade(c: CidadeComVagas, especialidade?: string | null) {
  await connectDB();
  return Vaga.find({
    status: "ativa",
    aprovadaPorAdmin: true,
    cidade: { $regex: `^${c.cidade.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    ...(c.uf ? { estado: c.uf } : {}),
    ...(especialidade ? { especialidade } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("empresaId", "nomeFantasia slug")
    .lean();
}
