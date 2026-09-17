import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import { atualizarStatusMatch, obterMatch } from "@/lib/servicos/matches";
import type { StatusMatch } from "@/models/Match";

export const dynamic = "force-dynamic";

const STATUS_ALTERAVEIS = new Set<StatusMatch>(["entrevista", "contratado", "encerrado"]);

// GET /api/matches/[id] — detalhe com contato do outro lado
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const detalhe = await obterMatch(ator, params.id);
    return NextResponse.json(detalhe);
  } catch (err) {
    return responderErro(err);
  }
}

// PATCH /api/matches/[id] { status }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => null);
    const status = body?.status;

    if (typeof status !== "string" || !STATUS_ALTERAVEIS.has(status as StatusMatch)) {
      throw new ErroAtor(400, "Status inválido.");
    }

    const match = await atualizarStatusMatch(ator, params.id, status as StatusMatch);
    return NextResponse.json({ match });
  } catch (err) {
    return responderErro(err);
  }
}
