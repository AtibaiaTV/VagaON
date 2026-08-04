import { NextRequest, NextResponse } from "next/server";
import { verifyCrossPlatformToken } from "@/lib/cross-platform-auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Vaga, { IVaga } from "@/models/Vaga";

// Apenas os campos de negócio que a Redesa conhece — sem metadados do Mongoose
function toRedesaShape(vaga: IVaga) {
  return {
    vagaonId:    vaga._id.toString(),
    titulo:      vaga.titulo,
    descricao:   vaga.descricao,
    requisitos:  vaga.requisitos,
    tipo:        vaga.tipo,
    especialidade: vaga.especialidade,
    salario:     vaga.salario,
    periodo:     vaga.periodo,
    cidade:      vaga.cidade,
    estado:      vaga.estado,
    remoto:      vaga.remoto,
    status:      vaga.status,
  };
}

// Campos editáveis pela Redesa (evita que _id, ownerId, etc. do body da Redesa sejam gravados)
const CAMPOS_EDITAVEIS = [
  "titulo", "descricao", "requisitos", "tipo", "especialidade",
  "salario", "periodo", "cidade", "estado", "remoto",
] as const;

// GET /api/redesa/vagas/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    const empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const vaga = await Vaga.findOne({ _id: params.id, empresaId: empresa._id });
    if (!vaga) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(toRedesaShape(vaga));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// PUT /api/redesa/vagas/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    const empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    const body = await req.json();

    // Filtra apenas campos permitidos; mantém status e aprovação
    const update: Record<string, unknown> = { status: "ativa", aprovadaPorAdmin: true };
    for (const campo of CAMPOS_EDITAVEIS) {
      if (body[campo] !== undefined) update[campo] = body[campo];
    }

    const vaga = await Vaga.findOneAndUpdate(
      { _id: params.id, empresaId: empresa._id },
      { $set: update },
      { new: true }
    );
    if (!vaga) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(toRedesaShape(vaga));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// DELETE /api/redesa/vagas/[id] — encerra a vaga (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    const empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });

    await Vaga.findOneAndUpdate(
      { _id: params.id, empresaId: empresa._id },
      { status: "encerrada" }
    );

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
