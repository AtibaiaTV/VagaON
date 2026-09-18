import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { whatsappConfigurado } from "@/lib/notificacoes/canais/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/registrar { pin }
 *
 * Registra o número na Cloud API. Depois de adicionar o número na conta do
 * WhatsApp Business, a Meta ainda exige este passo — sem ele todo envio
 * responde "(#133010) Account not registered". O PIN de 6 dígitos vira a
 * verificação em duas etapas do número: guarde-o, ele é pedido de novo se
 * o número for migrado.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!whatsappConfigurado()) {
    return NextResponse.json({ ok: false, detalhe: "WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID não estão definidos." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const pin = String(body?.pin ?? "").replace(/\D/g, "");
  if (pin.length !== 6) return NextResponse.json({ ok: false, detalhe: "O PIN tem 6 dígitos." }, { status: 400 });

  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  const res = await fetch(`https://graph.facebook.com/${versao}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/register`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", pin }),
    signal: AbortSignal.timeout(15000),
  }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }) as Response);

  const texto = await res.text().catch(() => "");
  return NextResponse.json({ ok: res.ok, status: res.status, detalhe: texto.slice(0, 400) }, { status: res.ok ? 200 : 502 });
}
