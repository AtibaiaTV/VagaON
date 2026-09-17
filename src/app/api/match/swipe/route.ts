import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import { registrarSwipe } from "@/lib/servicos/swipe";

export const dynamic = "force-dynamic";

// POST /api/match/swipe { vagaId, profissionalId?, direcao: like|pass|super }
export async function POST(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") throw new ErroAtor(400, "Corpo inválido.");

    const { vagaId, profissionalId, direcao } = body as Record<string, unknown>;
    if (typeof vagaId !== "string" || typeof direcao !== "string") {
      throw new ErroAtor(400, "Informe vagaId e direcao.");
    }

    const saida = await registrarSwipe(ator, {
      vagaId,
      profissionalId: typeof profissionalId === "string" ? profissionalId : undefined,
      direcao: direcao as "like" | "pass" | "super",
    });

    return NextResponse.json(saida, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
