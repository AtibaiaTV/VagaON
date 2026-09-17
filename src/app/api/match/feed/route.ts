import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { feedParaEmpresa, feedParaProfissional } from "@/lib/servicos/feed";
import { responderErro } from "@/lib/servicos/http";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

const LIMITE_MAX = 30;

// GET /api/match/feed            — profissional: próximas vagas do deck
// GET /api/match/feed?vagaId=... — empresa: próximos candidatos para a vaga
export async function GET(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const { searchParams } = new URL(req.url);
    const limite = Math.min(LIMITE_MAX, Math.max(1, parseInt(searchParams.get("limite") ?? "20") || 20));

    if (ator.tipo === "profissional") {
      const feed = await feedParaProfissional(ator.profissional, limite);
      return NextResponse.json({ modo: "vagas", ...feed });
    }

    const vagaId = searchParams.get("vagaId");
    if (!vagaId || !isValidObjectId(vagaId)) {
      throw new ErroAtor(400, "Informe a vaga (vagaId) para ver candidatos.");
    }

    const vaga = await Vaga.findById(vagaId);
    if (!vaga || String(vaga.empresaId) !== String(ator.empresa._id)) {
      throw new ErroAtor(403, "Essa vaga não é da sua empresa.");
    }
    if (vaga.status !== "ativa") throw new ErroAtor(409, "A vaga precisa estar ativa.");

    const feed = await feedParaEmpresa(ator.empresa, vaga, limite);
    return NextResponse.json({ modo: "candidatos", vagaId, ...feed });
  } catch (err) {
    return responderErro(err);
  }
}
