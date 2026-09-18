import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const usuarios = await User.find()
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    return NextResponse.json(usuarios);
  } catch (err) {
    // Rota só de admin: a mensagem real ajuda a diagnosticar e não vaza para usuário comum.
    console.error("[admin/usuarios]", err);
    const detalhe = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro interno: ${detalhe}` }, { status: 500 });
  }
}
