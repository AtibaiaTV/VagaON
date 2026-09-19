import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import Swipe from "@/models/Swipe";
import Vaga from "@/models/Vaga";

/**
 * "Interesse" nos dois sentidos, contado por pessoa/empresa (não por evento):
 *
 * - Na vaga: profissionais que curtiram no Descobrir OU se candidataram pelo
 *   board. Quem fez as duas coisas conta uma vez.
 * - No profissional: empresas que curtiram o perfil no Descobrir, em qualquer
 *   vaga. Uma empresa que curtiu em três vagas conta uma vez.
 *
 * Tudo sai do que já é gravado (Swipe e Candidatura); não há contador novo.
 */

const LIKE = { $in: ["like", "super"] };

function oid(v: unknown): Types.ObjectId {
  return new Types.ObjectId(String(v));
}

export interface InteressadoNaVaga {
  profissionalId: string;
  nome: string;
  cidade: string;
  estado: string;
  via: "descobrir" | "candidatura" | "ambos";
  /** Primeira demonstração de interesse. */
  em: Date;
}

/** Lista nominal de quem se interessou pela vaga, mais recente primeiro. */
export async function interessadosNaVaga(vagaId: unknown): Promise<InteressadoNaVaga[]> {
  await connectDB();
  const id = oid(vagaId);
  const [swipes, cands] = await Promise.all([
    Swipe.find({ vagaId: id, autorTipo: "profissional", direcao: LIKE }).select("profissionalId createdAt").lean(),
    Candidatura.find({ vagaId: id }).select("profissionalId createdAt snapshotProfissional").lean(),
  ]);

  const mapa = new Map<string, InteressadoNaVaga>();
  for (const s of swipes) {
    mapa.set(String(s.profissionalId), {
      profissionalId: String(s.profissionalId),
      nome: "",
      cidade: "",
      estado: "",
      via: "descobrir",
      em: s.createdAt,
    });
  }
  for (const c of cands) {
    const k = String(c.profissionalId);
    const atual = mapa.get(k);
    if (atual) {
      atual.via = "ambos";
      if (c.createdAt < atual.em) atual.em = c.createdAt;
    } else {
      mapa.set(k, {
        profissionalId: k,
        nome: c.snapshotProfissional?.nomeCompleto ?? "",
        cidade: c.snapshotProfissional?.cidade ?? "",
        estado: c.snapshotProfissional?.estado ?? "",
        via: "candidatura",
        em: c.createdAt,
      });
    }
  }

  if (mapa.size) {
    const profs = await Profissional.find({ _id: { $in: Array.from(mapa.keys()).map(oid) } })
      .select("nomeCompleto cidade estado")
      .lean();
    for (const p of profs) {
      const i = mapa.get(String(p._id));
      if (!i) continue;
      i.nome = p.nomeCompleto || i.nome;
      i.cidade = p.cidade || i.cidade;
      i.estado = p.estado || i.estado;
    }
  }

  return Array.from(mapa.values()).sort((a, b) => b.em.getTime() - a.em.getTime());
}

/** Quantos profissionais distintos se interessaram, por vaga (para listas). */
export async function contarInteressadosPorVaga(vagaIds: unknown[]): Promise<Map<string, number>> {
  await connectDB();
  const ids = vagaIds.map(oid);
  const conjuntos = new Map<string, Set<string>>();
  const juntar = (linhas: { _id: Types.ObjectId; profs: Types.ObjectId[] }[]) => {
    for (const l of linhas) {
      const k = String(l._id);
      const s = conjuntos.get(k) ?? new Set<string>();
      for (const p of l.profs) s.add(String(p));
      conjuntos.set(k, s);
    }
  };
  const [swipes, cands] = await Promise.all([
    Swipe.aggregate<{ _id: Types.ObjectId; profs: Types.ObjectId[] }>([
      { $match: { vagaId: { $in: ids }, autorTipo: "profissional", direcao: LIKE } },
      { $group: { _id: "$vagaId", profs: { $addToSet: "$profissionalId" } } },
    ]),
    Candidatura.aggregate<{ _id: Types.ObjectId; profs: Types.ObjectId[] }>([
      { $match: { vagaId: { $in: ids } } },
      { $group: { _id: "$vagaId", profs: { $addToSet: "$profissionalId" } } },
    ]),
  ]);
  juntar(swipes);
  juntar(cands);
  return new Map(Array.from(conjuntos).map(([k, s]) => [k, s.size]));
}

export interface EmpresaInteressada {
  empresaId: string;
  nome: string;
  /** Vagas em que a empresa curtiu o perfil. */
  vagas: { vagaId: string; titulo: string }[];
  /** Curtida mais recente. */
  em: Date;
}

/** Empresas que curtiram o perfil no Descobrir, mais recente primeiro. */
export async function empresasInteressadas(profissionalId: unknown): Promise<EmpresaInteressada[]> {
  await connectDB();
  const swipes = await Swipe.find({ profissionalId: oid(profissionalId), autorTipo: "empresa", direcao: LIKE })
    .select("empresaId vagaId createdAt")
    .sort({ createdAt: -1 })
    .lean();
  if (!swipes.length) return [];

  const mapa = new Map<string, EmpresaInteressada>();
  for (const s of swipes) {
    const k = String(s.empresaId);
    const atual = mapa.get(k) ?? { empresaId: k, nome: "", vagas: [], em: s.createdAt };
    atual.vagas.push({ vagaId: String(s.vagaId), titulo: "" });
    mapa.set(k, atual);
  }

  const [empresas, vagas] = await Promise.all([
    Empresa.find({ _id: { $in: Array.from(mapa.keys()).map(oid) } }).select("nomeFantasia").lean(),
    Vaga.find({ _id: { $in: swipes.map((s) => s.vagaId) } }).select("titulo").lean(),
  ]);
  const titulo = new Map(vagas.map((v) => [String(v._id), v.titulo]));
  for (const e of empresas) {
    const i = mapa.get(String(e._id));
    if (i) i.nome = e.nomeFantasia;
  }
  for (const i of Array.from(mapa.values())) {
    for (const v of i.vagas) v.titulo = titulo.get(v.vagaId) ?? "(vaga excluída)";
  }
  return Array.from(mapa.values()).sort((a, b) => b.em.getTime() - a.em.getTime());
}

/** Quantas empresas distintas curtiram cada profissional (para listas). */
export async function contarEmpresasPorProfissional(profissionalIds?: unknown[]): Promise<Map<string, number>> {
  await connectDB();
  const match: Record<string, unknown> = { autorTipo: "empresa", direcao: LIKE };
  if (profissionalIds) match.profissionalId = { $in: profissionalIds.map(oid) };
  const linhas = await Swipe.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: match },
    { $group: { _id: { p: "$profissionalId", e: "$empresaId" } } },
    { $group: { _id: "$_id.p", n: { $sum: 1 } } },
  ]);
  return new Map(linhas.map((l) => [String(l._id), l.n]));
}
