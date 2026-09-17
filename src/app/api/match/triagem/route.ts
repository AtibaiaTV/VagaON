import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import { responderTriagemDeck } from "@/lib/servicos/triagem";

export const dynamic = "force-dynamic";

// POST /api/match/triagem { vagaId, respostas: string[] } — profissional responde depois do like
export async function POST(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.vagaId !== "string") {
      throw new ErroAtor(400, "Informe vagaId e respostas.");
    }
    const saida = await responderTriagemDeck(ator, body.vagaId, body.respostas);
    return NextResponse.json(saida, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
