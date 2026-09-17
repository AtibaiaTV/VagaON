import { NextRequest, NextResponse } from "next/server";
import { resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import { listarMatches } from "@/lib/servicos/matches";
import type { StatusMatch } from "@/models/Match";

export const dynamic = "force-dynamic";

const STATUS_VALIDOS = new Set(["novo", "conversando", "entrevista", "contratado", "encerrado", "todos"]);

// GET /api/matches?status=novo|conversando|entrevista|contratado|encerrado|todos&vagaId=
export async function GET(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const vagaId = searchParams.get("vagaId") ?? undefined;

    const matches = await listarMatches(ator, {
      status: status && STATUS_VALIDOS.has(status) ? (status as StatusMatch | "todos") : undefined,
      vagaId,
    });

    return NextResponse.json({ matches });
  } catch (err) {
    return responderErro(err);
  }
}
