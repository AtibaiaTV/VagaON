import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listarDisputas } from "@/lib/servicos/avaliacoes";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// GET /api/admin/avaliacoes — fila de contestações
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") throw new ErroAtor(401, "Não autorizado.");
    return NextResponse.json({ disputas: await listarDisputas() });
  } catch (err) {
    return responderErro(err);
  }
}
