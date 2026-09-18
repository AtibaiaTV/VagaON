import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { removerGerente } from "@/lib/servicos/equipe";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// DELETE /api/empresa/equipe/membros/[userId] — dono remove um gerente
export async function DELETE(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);
    await removerGerente(empresa, ator.userId, params.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderErro(err);
  }
}
