import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { corValida, ehModeloCurriculo } from "@/lib/curriculo";
import Profissional from "@/models/Profissional";

export const dynamic = "force-dynamic";

/**
 * POST /api/perfil/curriculo-modelo
 * { modelo } → guarda o modelo preferido do currículo
 * { modelo, cor } → guarda a cor de detalhe daquele modelo (hex)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "profissional") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!ehModeloCurriculo(body?.modelo)) {
    return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
  }

  const set: Record<string, string> = {};
  if (body.cor !== undefined) {
    if (!corValida(body.cor)) return NextResponse.json({ error: "Cor inválida." }, { status: 400 });
    set[`curriculoCores.${body.modelo}`] = body.cor.toLowerCase();
  } else {
    set.curriculoModelo = body.modelo;
  }

  await connectDB();
  await Profissional.updateOne({ userId: session.user.id }, { $set: set });
  return NextResponse.json({ ok: true, ...set });
}
