import { NextRequest, NextResponse } from "next/server";
import { resolverAtor } from "@/lib/servicos/ator";
import { contestarAvaliacao } from "@/lib/servicos/avaliacoes";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// POST /api/avaliacoes/[id]/disputa { motivo } — o avaliado contesta; vai para a moderação
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => ({}));
    const avaliacao = await contestarAvaliacao(ator, params.id, body?.motivo);
    return NextResponse.json({ avaliacao });
  } catch (err) {
    return responderErro(err);
  }
}
