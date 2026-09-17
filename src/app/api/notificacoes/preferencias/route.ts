import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

const CANAIS = ["email", "whatsapp", "push"] as const;

// PATCH /api/notificacoes/preferencias { email?: bool, whatsapp?: bool, push?: bool }
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const set: Record<string, boolean> = {};
  for (const canal of CANAIS) {
    if (typeof body?.[canal] === "boolean") set[`notificacoes.${canal}`] = body[canal];
  }
  if (!Object.keys(set).length) return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });

  await connectDB();
  const user = await User.findByIdAndUpdate(session.user.id, { $set: set }, { new: true })
    .select("notificacoes")
    .lean();

  return NextResponse.json({ preferencias: user?.notificacoes ?? null });
}
