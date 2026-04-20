import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Vaga from "@/models/Vaga";
import Profissional from "@/models/Profissional";
import Empresa from "@/models/Empresa";

// GET — empresa lista candidatos da vaga
export async function GET(
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

    if (!vaga || !empresa || vaga.empresaId.toString() !== empresa._id.toString()) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const candidaturas = await Candidatura.find({ vagaId: params.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(candidaturas);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// POST — profissional se candidata
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "profissional") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const vaga = await Vaga.findById(params.id);
    if (!vaga || vaga.status !== "ativa") {
      return NextResponse.json({ error: "Vaga não disponível." }, { status: 404 });
    }

    const profissional = await Profissional.findOne({ userId: session.user.id });
    if (!profissional) {
      return NextResponse.json({ error: "Complete seu perfil antes de se candidatar." }, { status: 400 });
    }

    // Verifica candidatura duplicada
    const jaExiste = await Candidatura.findOne({
      vagaId: params.id,
      profissionalId: profissional._id,
    });
    if (jaExiste) {
      return NextResponse.json({ error: "Você já se candidatou a esta vaga." }, { status: 409 });
    }

    const { mensagem } = await req.json().catch(() => ({ mensagem: null }));

    const candidatura = await Candidatura.create({
      vagaId: vaga._id,
      profissionalId: profissional._id,
      empresaId: vaga.empresaId,
      mensagem: mensagem ?? null,
      snapshotProfissional: {
        nomeCompleto: profissional.nomeCompleto,
        especialidades: profissional.especialidades,
        cidade: profissional.cidade,
        estado: profissional.estado,
        fotoPerfil: profissional.fotoPerfil ?? null,
      },
    });

    // Incrementa contador de candidaturas na vaga
    await Vaga.findByIdAndUpdate(params.id, { $inc: { totalCandidaturas: 1 } });

    return NextResponse.json(candidatura, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Você já se candidatou a esta vaga." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
