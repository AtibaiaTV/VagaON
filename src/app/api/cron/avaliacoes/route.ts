import { NextRequest, NextResponse } from "next/server";
import { convidarParaAvaliar, publicarPendentes } from "@/lib/servicos/avaliacoes";

export const dynamic = "force-dynamic";

/**
 * Cron diário (vercel.json): convida a avaliar quem já abriu o prazo e
 * publica as avaliações cuja janela duplo-cega venceu.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const [convites, publicadas] = await Promise.all([convidarParaAvaliar(), publicarPendentes()]);
    return NextResponse.json({ ok: true, convites, publicadas });
  } catch (err) {
    console.error("[cron/avaliacoes]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
