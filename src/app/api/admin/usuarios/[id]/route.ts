import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { status, role } = await req.json();

    await connectDB();

    const atualizacao: Record<string, string> = {};
    if (status && ["ativo", "suspenso", "pendente"].includes(status)) {
      atualizacao.status = status;
    }
    if (role && ["profissional", "empresa", "admin"].includes(role)) {
      atualizacao.role = role;
    }

    const usuario = await User.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    ).select("-password");

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
