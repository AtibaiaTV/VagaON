import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json() as {
      name?: string;
      email?: string;
      status?: string;
      role?: string;
      novaSenha?: string;
    };

    await connectDB();

    const atualizacao: Record<string, string> = {};

    if (body.name?.trim()) atualizacao.name = body.name.trim();

    if (body.email?.trim()) {
      const emailLower = body.email.trim().toLowerCase();
      const jaExiste = await User.findOne({ email: emailLower, _id: { $ne: params.id } });
      if (jaExiste) {
        return NextResponse.json({ error: "E-mail já está em uso por outro usuário." }, { status: 409 });
      }
      atualizacao.email = emailLower;
    }

    if (body.status && ["ativo", "suspenso", "pendente"].includes(body.status)) {
      atualizacao.status = body.status;
    }

    if (body.role && ["profissional", "empresa", "admin"].includes(body.role)) {
      atualizacao.role = body.role;
    }

    if (body.novaSenha && body.novaSenha.length >= 6) {
      atualizacao.password = await bcrypt.hash(body.novaSenha, 10);
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
