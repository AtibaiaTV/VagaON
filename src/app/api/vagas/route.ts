import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";

// GET /api/vagas — busca pública de vagas com filtros
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const especialidade = searchParams.get("especialidade");
    const tipo = searchParams.get("tipo");
    const empresaId = searchParams.get("empresaId");
    const pagina = parseInt(searchParams.get("pagina") ?? "1");
    const limite = 12;

    const filtro: Record<string, unknown> = { status: "ativa", aprovadaPorAdmin: true };

    if (estado) filtro.estado = estado;
    if (especialidade) filtro.especialidade = especialidade;
    if (tipo) filtro.tipo = tipo;
    if (empresaId) {
      // Empresa vendo suas próprias vagas (sem filtro de status)
      delete filtro.status;
      delete filtro.aprovadaPorAdmin;
      filtro.empresaId = empresaId;
    }

    const total = await Vaga.countDocuments(filtro);
    const vagas = await Vaga.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .populate("empresaId", "nomeFantasia cidade estado logo setor")
      .lean();

    return NextResponse.json({
      vagas,
      total,
      paginas: Math.ceil(total / limite),
      paginaAtual: pagina,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// POST /api/vagas — criar nova vaga (empresa)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const empresa = await Empresa.findOne({ userId: session.user.id });
    if (!empresa) {
      return NextResponse.json({ error: "Perfil de empresa não encontrado." }, { status: 404 });
    }

    const body = await req.json();
    const { titulo, descricao, requisitos, tipo, especialidade, salario, periodo, cidade, estado, remoto } = body;

    if (!titulo || !descricao || !tipo || !especialidade || !cidade || !estado) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    const vaga = await Vaga.create({
      empresaId: empresa._id,
      titulo,
      descricao,
      requisitos: requisitos ?? "",
      tipo,
      especialidade,
      salario: salario ?? { tipo: "a_combinar", min: null, max: null, moeda: "BRL", periodo: "mes" },
      periodo: periodo ?? { dataInicio: null, dataFim: null },
      cidade,
      estado,
      remoto: remoto ?? false,
      status: "ativa",
      aprovadaPorAdmin: true,
    });

    return NextResponse.json(vaga, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
