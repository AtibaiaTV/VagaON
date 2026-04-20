import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";

// PATCH — empresa atualiza status da candidatura
export async function PATCH(
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
    const candidatura = await Candidatura.findById(params.id);

    if (!candidatura) {
      return NextResponse.json({ error: "Candidatura não encontrada." }, { status: 404 });
    }
    if (!empresa || candidatura.empresaId.toString() !== empresa._id.toString()) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { status, notaEmpresa } = await req.json();

    const statusValidos = ["visualizada", "em_analise", "aprovada", "recusada"];
    if (status && !statusValidos.includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const atualizada = await Candidatura.findByIdAndUpdate(
      params.id,
      { $set: { ...(status && { status }), ...(notaEmpresa !== undefined && { notaEmpresa }) } },
      { new: true }
    );

    return NextResponse.json(atualizada);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
