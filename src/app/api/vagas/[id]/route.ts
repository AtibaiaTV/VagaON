import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const vaga = await Vaga.findById(params.id)
      .populate("empresaId", "nomeFantasia cidade estado logo setor descricao")
      .lean();

    if (!vaga) {
      return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    }

    // Incrementa visualizações
    await Vaga.findByIdAndUpdate(params.id, { $inc: { visualizacoes: 1 } });

    return NextResponse.json(vaga);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const empresa = await Empresa.findOne({ userId: session.user.id });
    const vaga = await Vaga.findById(params.id);

    if (!vaga) return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    if (!empresa || vaga.empresaId.toString() !== empresa._id.toString()) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json();
    const campos = ["titulo", "descricao", "requisitos", "tipo", "especialidade",
      "salario", "periodo", "cidade", "estado", "remoto", "status"];

    const atualizacao: Record<string, unknown> = {};
    for (const c of campos) {
      if (body[c] !== undefined) atualizacao[c] = body[c];
    }

    const atualizada = await Vaga.findByIdAndUpdate(params.id, { $set: atualizacao }, { new: true });
    return NextResponse.json(atualizada);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();
    const empresa = await Empresa.findOne({ userId: session.user.id });
    const vaga = await Vaga.findById(params.id);

    if (!vaga) return NextResponse.json({ error: "Vaga não encontrada." }, { status: 404 });
    if (!empresa || vaga.empresaId.toString() !== empresa._id.toString()) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    await Vaga.findByIdAndUpdate(params.id, { status: "encerrada" });
    return NextResponse.json({ message: "Vaga encerrada." });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
