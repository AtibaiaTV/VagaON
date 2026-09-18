import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { buscarMunicipios, normalizarCidade } from "@/constants/municipios";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

/**
 * GET /api/geo/cidades?q=ati&contexto=todas|profissionais|vagas&uf=SP
 *
 * Sugestões para campos de cidade.
 * - `todas` (padrão, público): os 5.571 municípios do IBGE com nome oficial,
 *   para cadastro e formulários — quem mora numa cidade sem ninguém ainda
 *   precisa conseguir escolhê-la.
 * - `profissionais` (empresa/admin) e `vagas`: só o que existe no banco, com
 *   contagem, para os filtros — a sugestão nunca leva a uma lista vazia.
 * Cache de 5 minutos por contexto de banco.
 */

interface Sugestao {
  cidade: string;
  uf: string;
  n: number;
}

const TTL_MS = 5 * 60_000;
const cache = new Map<string, { em: number; lista: Sugestao[] }>();

function chave(cidade: string, uf: string) {
  return `${uf.toUpperCase()}:${normalizarCidade(cidade)}`;
}

async function listar(contexto: "profissionais" | "vagas"): Promise<Sugestao[]> {
  const agora = Date.now();
  const c = cache.get(contexto);
  if (c && agora - c.em < TTL_MS) return c.lista;

  await connectDB();
  const contagem = new Map<string, Sugestao>();
  const somar = (cidade: unknown, uf: unknown) => {
    if (typeof cidade !== "string" || !cidade.trim()) return;
    const ufStr = typeof uf === "string" ? uf.trim().toUpperCase() : "";
    const k = chave(cidade, ufStr);
    const atual = contagem.get(k);
    if (atual) atual.n++;
    else contagem.set(k, { cidade: cidade.trim(), uf: ufStr, n: 1 });
  };

  if (contexto === "profissionais") {
    const docs = await Profissional.find({ "match.ativo": { $ne: false } }).select("cidade estado cidadesInteresse").lean();
    for (const d of docs) {
      somar(d.cidade, d.estado);
      for (const ci of d.cidadesInteresse ?? []) somar(ci.cidade, ci.estado);
    }
  } else {
    const docs = await Vaga.find({ status: "ativa", aprovadaPorAdmin: true }).select("cidade estado").lean();
    for (const d of docs) somar(d.cidade, d.estado);
  }

  const lista = Array.from(contagem.values()).sort((a, b) => b.n - a.n || a.cidade.localeCompare(b.cidade, "pt-BR"));
  cache.set(contexto, { em: agora, lista });
  return lista;
}

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("contexto");
  const contexto = param === "vagas" ? "vagas" : param === "profissionais" ? "profissionais" : "todas";
  const qBruto = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 60);
  const ufBruto = (req.nextUrl.searchParams.get("uf") ?? "").trim().toUpperCase().slice(0, 2);

  if (contexto === "todas") {
    const sugestoes = buscarMunicipios(qBruto, ufBruto || null, 8).map((m) => ({ cidade: m.cidade, uf: m.uf, n: 0 }));
    return NextResponse.json({ sugestoes }, { headers: { "Cache-Control": "public, max-age=86400" } });
  }

  // Onde há profissionais é informação de quem busca gente (empresa/admin); vagas são públicas.
  if (contexto === "profissionais") {
    const session = await auth();
    if (!session || (session.user.role !== "empresa" && session.user.role !== "admin")) {
      return NextResponse.json({ sugestoes: [] }, { status: 401 });
    }
  }

  const q = normalizarCidade(qBruto);
  const uf = ufBruto;

  const todas = await listar(contexto);
  const sugestoes = todas
    .filter((s) => (!uf || s.uf === uf) && (!q || normalizarCidade(s.cidade).includes(q)))
    .sort((a, b) => {
      // Começa com o que foi digitado primeiro; depois quem tem mais gente.
      const ia = q ? Number(!normalizarCidade(a.cidade).startsWith(q)) : 0;
      const ib = q ? Number(!normalizarCidade(b.cidade).startsWith(q)) : 0;
      return ia - ib || b.n - a.n;
    })
    .slice(0, 8);

  return NextResponse.json({ sugestoes });
}
