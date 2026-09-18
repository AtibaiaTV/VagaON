import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";

export const dynamic = "force-dynamic";

// POST /api/planos/interesse — empresa quer o Pro; fica registrado para a equipe comercial
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "empresa") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await connectDB();
  const r = await Empresa.updateOne({ userId: session.user.id }, { $set: { "assinatura.interesseEm": new Date() } });
  if (!r.matchedCount) return NextResponse.json({ error: "Perfil de empresa não encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
