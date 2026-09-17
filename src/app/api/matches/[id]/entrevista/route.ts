import { NextRequest, NextResponse } from "next/server";
import { resolverAtor } from "@/lib/servicos/ator";
import { cancelarEntrevista, escolherHorario, proporEntrevista } from "@/lib/servicos/entrevistas";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// POST /api/matches/[id]/entrevista { propostas: ISO[], local?, observacao? } — empresa propõe
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => ({}));
    const entrevista = await proporEntrevista(ator, params.id, {
      propostas: body?.propostas,
      local: body?.local,
      observacao: body?.observacao,
    });
    return NextResponse.json({ entrevista }, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}

// PATCH /api/matches/[id]/entrevista { escolhida: ISO } — profissional confirma
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => ({}));
    const entrevista = await escolherHorario(ator, params.id, body?.escolhida);
    return NextResponse.json({ entrevista });
  } catch (err) {
    return responderErro(err);
  }
}

// DELETE /api/matches/[id]/entrevista — qualquer lado cancela
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    await cancelarEntrevista(ator, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderErro(err);
  }
}
