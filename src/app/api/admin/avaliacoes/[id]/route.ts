import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolverDisputa } from "@/lib/servicos/avaliacoes";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// PATCH /api/admin/avaliacoes/[id] { decisao: "aceita"|"rejeitada", notaAdmin? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") throw new ErroAtor(401, "Não autorizado.");
    const body = await req.json().catch(() => ({}));
    if (body?.decisao !== "aceita" && body?.decisao !== "rejeitada") throw new ErroAtor(400, "Decisão inválida.");
    await resolverDisputa(params.id, body.decisao, body?.notaAdmin);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderErro(err);
  }
}
