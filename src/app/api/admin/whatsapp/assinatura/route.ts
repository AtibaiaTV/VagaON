import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { whatsappConfigurado } from "@/lib/notificacoes/canais/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/assinatura { wabaId }
 *
 * O webhook configurado no app só recebe eventos de uma conta do WhatsApp
 * Business (WABA) se o app estiver ASSINADO nela (`/{waba}/subscribed_apps`).
 * O assistente da Meta nem sempre faz isso. Aqui: consulta, assina se
 * faltar, e devolve os dois resultados como a Meta respondeu.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!whatsappConfigurado()) {
    return NextResponse.json({ ok: false, detalhe: "WHATSAPP_TOKEN não está definido." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const wabaId = String(body?.wabaId ?? process.env.WHATSAPP_WABA_ID ?? "").replace(/\D/g, "");
  if (!wabaId) return NextResponse.json({ ok: false, detalhe: "Informe o ID da conta do WhatsApp Business (WABA)." }, { status: 400 });

  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${versao}/${wabaId}/subscribed_apps`;
  const cab = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" };

  const antes = await fetch(url, { headers: cab, signal: AbortSignal.timeout(15000) });
  const antesTexto = await antes.text().catch(() => "");

  const assinar = await fetch(url, { method: "POST", headers: cab, signal: AbortSignal.timeout(15000) });
  const assinarTexto = await assinar.text().catch(() => "");

  const depois = await fetch(url, { headers: cab, signal: AbortSignal.timeout(15000) });
  const depoisTexto = await depois.text().catch(() => "");

  return NextResponse.json(
    {
      ok: assinar.ok,
      antes: antesTexto.slice(0, 500),
      assinar: `${assinar.status} ${assinarTexto.slice(0, 300)}`,
      depois: depoisTexto.slice(0, 500),
    },
    { status: assinar.ok ? 200 : 502 }
  );
}
