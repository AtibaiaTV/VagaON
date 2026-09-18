import { NextRequest, NextResponse } from "next/server";
import {
  assinaturaValida,
  processarWebhookWhatsApp,
  type CorpoWebhookMeta,
} from "@/lib/notificacoes/whatsapp-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/whatsapp — handshake de verificação da Meta.
 * No painel do app: Webhooks → WhatsApp → Callback URL + Verify token
 * (o mesmo valor de WHATSAPP_VERIFY_TOKEN). Assine o campo "messages".
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (
    esperado &&
    q.get("hub.mode") === "subscribe" &&
    q.get("hub.verify_token") === esperado &&
    q.get("hub.challenge")
  ) {
    return new NextResponse(q.get("hub.challenge"), {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Verificação recusada" }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp — status de entrega e mensagens recebidas.
 * A assinatura HMAC (X-Hub-Signature-256, com WHATSAPP_APP_SECRET) é
 * obrigatória: sem ela qualquer um poderia desligar avisos alheios.
 */
export async function POST(req: NextRequest) {
  const bruto = await req.text();

  if (!process.env.WHATSAPP_APP_SECRET) {
    console.warn("[whatsapp-webhook] WHATSAPP_APP_SECRET ausente; evento descartado.");
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 503 });
  }
  if (!assinaturaValida(bruto, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  let corpo: CorpoWebhookMeta;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Sempre 200 depois de validar: erro interno aqui faria a Meta reenviar
  // o mesmo evento repetidamente. O que falhar fica no log.
  try {
    const resumo = await processarWebhookWhatsApp(corpo);
    return NextResponse.json({ ok: true, ...resumo });
  } catch (err) {
    console.error("[whatsapp-webhook] erro inesperado:", err);
    return NextResponse.json({ ok: false });
  }
}
