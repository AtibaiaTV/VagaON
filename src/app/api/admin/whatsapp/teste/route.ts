import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enviarWhatsApp, normalizarTelefoneBR, whatsappConfigurado } from "@/lib/notificacoes/canais/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/teste { telefone }
 * Envia o template de aviso para um número e devolve a resposta da Meta
 * como veio — é o jeito de descobrir, no dia de ligar, se token, número e
 * template estão certos sem esperar um match acontecer.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!whatsappConfigurado()) {
    return NextResponse.json(
      { ok: false, detalhe: "WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID não estão definidos neste ambiente." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const numero = normalizarTelefoneBR(String(body?.telefone ?? ""));
  if (!numero) return NextResponse.json({ ok: false, detalhe: "Telefone inválido. Use DDD + número." }, { status: 400 });

  await connectDB();
  const inicio = Date.now();
  const r = await enviarWhatsApp(
    numero,
    session.user.name ?? "Admin",
    {
      categoria: "sistema",
      titulo: "Teste do VagaON",
      corpo: `Mensagem de teste enviada pelo painel do admin em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}. Se chegou, o WhatsApp está ligado.`,
      url: "/admin/whatsapp",
    },
    session.user.id
  );

  return NextResponse.json(
    { ok: r.ok, detalhe: r.detalhe ?? null, numero, ms: Date.now() - inicio },
    { status: r.ok ? 200 : 502 }
  );
}
