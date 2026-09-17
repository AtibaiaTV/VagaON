import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ehModeloCurriculo } from "@/lib/curriculo";
import Profissional from "@/models/Profissional";

export const dynamic = "force-dynamic";

// POST /api/perfil/curriculo-modelo { modelo } — guarda o modelo preferido do currículo
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "profissional") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!ehModeloCurriculo(body?.modelo)) {
    return NextResponse.json({ error: "Modelo inválido." }, { status: 400 });
  }

  await connectDB();
  await Profissional.updateOne({ userId: session.user.id }, { $set: { curriculoModelo: body.modelo } });
  return NextResponse.json({ ok: true, modelo: body.modelo });
}
