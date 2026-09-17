import { NextRequest, NextResponse } from "next/server";
import { resolverAtor } from "@/lib/servicos/ator";
import { responderAvaliacao } from "@/lib/servicos/avaliacoes";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// POST /api/avaliacoes/[id]/resposta { texto } — o avaliado responde (uma vez)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => ({}));
    const avaliacao = await responderAvaliacao(ator, params.id, body?.texto);
    return NextResponse.json({ avaliacao });
  } catch (err) {
    return responderErro(err);
  }
}
