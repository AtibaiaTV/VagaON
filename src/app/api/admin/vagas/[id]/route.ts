import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import { diffVaga, registrarHistoricoVaga } from "@/lib/servicos/historico-vaga";

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

    const antes = await Vaga.findById(params.id).lean();
    if (!antes) {
      return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    }

    const vaga = await Vaga.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    );

    await registrarHistoricoVaga(
      params.id,
      "moderacao",
      { tipo: "admin", userId: session.user.id, nome: session.user.name ?? "" },
      status ? `${antes.status} → ${status}${motivoRejeicao ? ` (${motivoRejeicao})` : ""}` : "moderação",
      diffVaga(antes, atualizacao)
    );

    return NextResponse.json(vaga);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
