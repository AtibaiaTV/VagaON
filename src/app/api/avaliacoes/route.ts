import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { criarAvaliacao, minhasAvaliacoes, pendentesParaAvaliar } from "@/lib/servicos/avaliacoes";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// GET /api/avaliacoes — convites pendentes + recebidas (publicadas) + enviadas
export async function GET() {
  try {
    const ator = await resolverAtor();
    const [pendentes, minhas] = await Promise.all([pendentesParaAvaliar(ator), minhasAvaliacoes(ator)]);
    return NextResponse.json({ pendentes, ...minhas });
  } catch (err) {
    return responderErro(err);
  }
}

// POST /api/avaliacoes { matchId, criterios: {chave: 1..5}, recomendaria, comentario? }
export async function POST(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => null);
    if (!body || typeof body.matchId !== "string") throw new ErroAtor(400, "Informe o match.");
    const avaliacao = await criarAvaliacao(ator, body.matchId, {
      criterios: body.criterios,
      recomendaria: body.recomendaria,
      comentario: body.comentario,
    });
    return NextResponse.json({ avaliacao }, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
