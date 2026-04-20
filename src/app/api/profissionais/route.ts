import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";

// GET /api/profissionais — empresa busca profissionais
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const especialidade = searchParams.get("especialidade");
    const disponibilidade = searchParams.get("disponibilidade");
    const pagina = parseInt(searchParams.get("pagina") ?? "1");
    const limite = 12;

    const filtro: Record<string, unknown> = {};
    if (estado) filtro.estado = estado;
    if (especialidade) filtro.especialidades = especialidade;
    if (disponibilidade) filtro["disponibilidade.tipo"] = disponibilidade;

    const total = await Profissional.countDocuments(filtro);
    const profissionais = await Profissional.find(filtro)
      .select("-cpf") // nunca expõe CPF
      .sort({ completude: -1, createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .lean();

    return NextResponse.json({
      profissionais,
      total,
      paginas: Math.ceil(total / limite),
      paginaAtual: pagina,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
