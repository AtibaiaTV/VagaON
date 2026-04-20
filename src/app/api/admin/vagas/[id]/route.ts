import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { status, aprovadaPorAdmin, motivoRejeicao } = await req.json();

    await connectDB();

    const atualizacao: Record<string, unknown> = {};
    if (status) atualizacao.status = status;
    if (aprovadaPorAdmin !== undefined) atualizacao.aprovadaPorAdmin = aprovadaPorAdmin;
    if (motivoRejeicao !== undefined) atualizacao.motivoRejeicao = motivoRejeicao;

    const vaga = await Vaga.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    );

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    }

    return NextResponse.json(vaga);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
