import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { sanitizarPerguntas } from "@/lib/triagem";
import { ErroAtor } from "@/lib/servicos/erros";
import { verificarLimiteVagas } from "@/lib/servicos/planos";
import { expiracaoInicial } from "@/lib/servicos/vagas";
import { alertarSemFalhar } from "@/lib/servicos/alerta-vaga";
import { especialidadeValida } from "@/lib/especialidade-inferida";

const SUPER_CATEGORIAS_MAP: Record<string, string[]> = {
  gastronomia: ["cozinha", "bar", "salao"],
  hotelaria: ["hospedagem", "governanca", "lazer_hospede", "transporte"],
  eventos: ["eventos_catering", "audiovisual", "beleza", "decoracao", "entretenimento"],
};

// GET /api/vagas — busca pública de vagas com filtros
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const especialidade = searchParams.get("especialidade");
    const tipo = searchParams.get("tipo");
    const empresaId = searchParams.get("empresaId");
    const cidade = searchParams.get("cidade");
    const superCategoria = searchParams.get("superCategoria");
    const busca = searchParams.get("busca");
    const pagina = parseInt(searchParams.get("pagina") ?? "1");
    const limite = 12;

    const filtro: Record<string, unknown> = { status: "ativa", aprovadaPorAdmin: true };

    if (estado) filtro.estado = estado;
    if (especialidade) filtro.especialidade = especialidade;
    if (tipo) filtro.tipo = tipo;
    if (cidade) filtro.cidade = { $regex: new RegExp(cidade.trim(), "i") };
    if (busca) filtro.titulo = { $regex: new RegExp(busca.trim(), "i") };
    if (superCategoria && SUPER_CATEGORIAS_MAP[superCategoria]) {
      const cats = SUPER_CATEGORIAS_MAP[superCategoria];
      const vals = ESPECIALIDADES.filter((e) => cats.includes(e.categoria)).map((e) => e.value);
      if (vals.length > 0) filtro.especialidade = { $in: vals };
    }
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

    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id));
    if (!empresa) {
      return NextResponse.json({ error: "Perfil de empresa não encontrado." }, { status: 404 });
    }

    // Limite de vagas ativas do plano (no-op com planos desligados).
    try {
      await verificarLimiteVagas(empresa);
    } catch (err) {
      if (err instanceof ErroAtor) return NextResponse.json({ error: err.message, upgrade: true }, { status: err.status });
      throw err;
    }

    const body = await req.json();
    const {
      titulo, descricao, requisitos, tipo, especialidade, salario, periodo, cidade, estado, remoto, raioKm,
      // Sinais do match (todos opcionais)
      especialidadesAceitas, anosExperienciaMin, habilidadesDesejadas, turno, escala, idiomasDesejados, posicoes, afirmativa,
      perguntasTriagem,
    } = body;

    if (!titulo || !descricao || !tipo || !especialidade || !cidade || !estado) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }
    // O formulário manda o value da tabela; qualquer outra coisa é recusada,
    // porque especialidade fora da tabela some do Descobrir.
    if (!especialidadeValida(especialidade)) {
      return NextResponse.json({ error: "Escolha a função da vaga na lista." }, { status: 400 });
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
      // Raio da empresa para esta vaga; vazio/0 = sem limite.
      raioKm: Number.isFinite(Number(raioKm)) && Number(raioKm) > 0 ? Math.min(1000, Math.round(Number(raioKm))) : null,
      status: "ativa",
      aprovadaPorAdmin: true,
      // 60 dias (CLT) ou a data de término; o cron avisa e expira.
      expiresAt: expiracaoInicial({ tipo, periodo: periodo ?? null }),
      especialidadesAceitas: Array.isArray(especialidadesAceitas) ? especialidadesAceitas : [],
      anosExperienciaMin: Number(anosExperienciaMin) || 0,
      habilidadesDesejadas: Array.isArray(habilidadesDesejadas) ? habilidadesDesejadas : [],
      turno: turno || null,
      escala: escala || null,
      idiomasDesejados: Array.isArray(idiomasDesejados) ? idiomasDesejados : [],
      posicoes: Math.max(1, Number(posicoes) || 1),
      afirmativa: Array.isArray(afirmativa) ? afirmativa : [],
      perguntasTriagem: sanitizarPerguntas(perguntasTriagem),
    });

    // Aguardado: a função da Vercel encerra ao responder. Nunca lança.
    await alertarSemFalhar(vaga._id, "publicacao");

    return NextResponse.json(vaga, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
