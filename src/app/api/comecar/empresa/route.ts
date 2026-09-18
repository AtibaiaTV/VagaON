import { NextRequest, NextResponse } from "next/server";
import { criarEmpresaRapida, normalizarOrigem, texto } from "@/lib/servicos/cadastro-rapido";
import { ErroAtor } from "@/lib/servicos/erros";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a IA pode levar alguns segundos para montar a vaga

/** POST /api/comecar/empresa — conta + empresa + primeira vaga em uma chamada (entrada por QR/link). */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    if (texto(body.site, 50)) return NextResponse.json({ ok: true }, { status: 201 });

    const r = await criarEmpresaRapida({
      nome: texto(body.nome, 120),
      telefone: texto(body.telefone, 30),
      email: texto(body.email, 160).toLowerCase(),
      senha: typeof body.senha === "string" ? body.senha : "",
      cidade: texto(body.cidade, 80),
      estado: texto(body.estado, 2).toUpperCase(),
      origem: normalizarOrigem(body.origem),
      vaga: {
        texto: texto(body.vagaTexto, 2000),
        especialidade: texto(body.especialidade, 60),
        tipo: texto(body.tipo, 20),
      },
    });
    return NextResponse.json({ ok: true, ...r }, { status: 201 });
  } catch (err) {
    if (err instanceof ErroAtor) return NextResponse.json({ error: err.message, existente: err.status === 409 }, { status: err.status });
    if ((err as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Este e-mail já tem conta. Entre para continuar.", existente: true }, { status: 409 });
    }
    console.error("[comecar/empresa]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
