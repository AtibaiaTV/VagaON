import { NextRequest, NextResponse } from "next/server";
import { enviarLembretesEntrevista } from "@/lib/servicos/entrevistas";

export const dynamic = "force-dynamic";

/**
 * Cron da Vercel (vercel.json): lembrete das entrevistas das próximas 24 h.
 * A Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando
 * a variável existe; sem ela configurada, a rota recusa tudo.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const r = await enviarLembretesEntrevista();
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    console.error("[cron/lembretes-entrevista]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
