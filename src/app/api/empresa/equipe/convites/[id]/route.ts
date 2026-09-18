import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { cancelarConvite } from "@/lib/servicos/equipe";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// DELETE /api/empresa/equipe/convites/[id] — dono cancela um convite pendente
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);
    await cancelarConvite(empresa, ator.userId, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderErro(err);
  }
}
