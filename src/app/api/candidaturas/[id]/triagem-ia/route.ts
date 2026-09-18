import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { iaConfigurada } from "@/lib/ia/cliente";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";
import { exigirRecurso } from "@/lib/servicos/planos";
import { gerarResumoTriagem } from "@/lib/servicos/triagem";
import Empresa from "@/models/Empresa";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/candidaturas/[id]/triagem-ia — empresa dona pede o resumo das respostas
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") throw new ErroAtor(401, "Não autorizado.");
    if (!iaConfigurada()) throw new ErroAtor(503, "Resumo por IA não está ativado neste ambiente.");

    await connectDB();
    const empresa = await Empresa.findOne({ userId: session.user.id }).select("_id assinatura").lean();
    if (!empresa) throw new ErroAtor(404, "Perfil de empresa não encontrado.");
    exigirRecurso(empresa, "triagemIA");

    const body = await req.json().catch(() => ({}));
    const ia = await gerarResumoTriagem(empresa, params.id, { forcar: body?.forcar === true });
    return NextResponse.json({ ia });
  } catch (err) {
    return responderErro(err);
  }
}
