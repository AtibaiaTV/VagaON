import { NextRequest, NextResponse } from "next/server";
import { exigirProfissional, resolverAtor } from "@/lib/servicos/ator";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";
import { definirVisibilidade } from "@/lib/servicos/visibilidade";

export const dynamic = "force-dynamic";

// POST /api/perfil/visibilidade { ativo: boolean, motivo?: "manual" | "contratado" }
export async function POST(req: NextRequest) {
  try {
    const profissional = exigirProfissional(await resolverAtor());
    const body = await req.json().catch(() => ({}));
    if (typeof body?.ativo !== "boolean") throw new ErroAtor(400, "Informe ativo (true/false).");
    const motivo = body.motivo === "contratado" ? "contratado" : "manual";
    await definirVisibilidade(profissional._id, body.ativo, motivo);
    return NextResponse.json({ ok: true, ativo: body.ativo });
  } catch (err) {
    return responderErro(err);
  }
}
