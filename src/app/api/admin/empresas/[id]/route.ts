import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
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

    const { verificada, userStatus } = await req.json();

    await connectDB();

    const atualizacao: Record<string, unknown> = {};
    if (verificada !== undefined) atualizacao.verificada = verificada;

    const empresa = await Empresa.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    ).lean();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    // Optionally update the linked user's status (ativo/suspenso)
    if (userStatus && ["ativo", "suspenso", "pendente"].includes(userStatus)) {
      await User.findByIdAndUpdate(empresa.userId, { $set: { status: userStatus } });
    }

    return NextResponse.json(empresa);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
