import { NextRequest, NextResponse } from "next/server";
import { verifyCrossPlatformToken } from "@/lib/cross-platform-auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Vaga from "@/models/Vaga";

// GET /api/redesa/vagas/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    const empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const vaga = await Vaga.findOne({ _id: params.id, empresaId: empresa._id }).lean();
    if (!vaga) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(vaga);
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
    const vaga = await Vaga.findOneAndUpdate(
      { _id: params.id, empresaId: empresa._id },
      body,
      { new: true }
    );
    if (!vaga) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json(vaga);
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
