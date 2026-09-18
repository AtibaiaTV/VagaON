import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import { papelNaEmpresa } from "@/lib/servicos/equipe";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const empresa = await Empresa.findById(params.id).lean();
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }
    return NextResponse.json(empresa);
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
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    // Dono ou gerente da empresa podem editar o perfil dela.
    const empresa = await Empresa.findById(params.id);
    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }
    if (!papelNaEmpresa(empresa, session.user.id)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json();

    // Campos permitidos para atualização
    const camposPermitidos = [
      "nomeFantasia", "razaoSocial", "cnpj", "telefone", "email",
      "website", "logo", "setor", "descricao", "cidade", "estado",
      "cep", "endereco",
    ];

    const atualizacao: Record<string, unknown> = {};
    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        atualizacao[campo] = body[campo];
      }
    }

    const atualizada = await Empresa.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    );

    return NextResponse.json(atualizada);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
