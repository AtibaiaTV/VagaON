import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { whatsappConfigurado } from "@/lib/notificacoes/canais/whatsapp";
import MensagemWhatsApp from "@/models/MensagemWhatsApp";
import User from "@/models/User";

export const dynamic = "force-dynamic";

interface InfoTemplate {
  categoria: string | null;
  status: string | null;
  detalhe: string | null;
}

/**
 * Categoria e status do template na Meta. Importa porque a Meta reclassifica
 * templates de Utilidade como Marketing quando acha o texto promocional, e
 * Marketing sofre limite por usuário (#131049) e experimento (#130472).
 * Precisa de WHATSAPP_WABA_ID.
 */
async function infoTemplate(nome: string): Promise<InfoTemplate> {
  const token = process.env.WHATSAPP_TOKEN;
  const waba = process.env.WHATSAPP_WABA_ID?.replace(/\D/g, "");
  if (!token || !waba) return { categoria: null, status: null, detalhe: "Defina WHATSAPP_WABA_ID para ver a categoria." };
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  try {
    const url = `https://graph.facebook.com/${versao}/${waba}/message_templates?name=${encodeURIComponent(nome)}&fields=name,category,status,language`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { categoria: null, status: null, detalhe: `${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}` };
    const json = (await res.json()) as { data?: { name: string; category?: string; status?: string; language?: string }[] };
    const t = json.data?.find((d) => d.name === nome && d.language === "pt_BR") ?? json.data?.find((d) => d.name === nome);
    if (!t) return { categoria: null, status: null, detalhe: "Template não encontrado nesta WABA." };
    return { categoria: t.category ?? null, status: t.status ?? null, detalhe: null };
  } catch (e) {
    return { categoria: null, status: null, detalhe: e instanceof Error ? e.message : "erro ao consultar a Meta" };
  }
}

/**
 * GET /api/admin/whatsapp?telefone=&direcao=&status=&limite=
 * Log das mensagens trocadas com a Cloud API (enviadas, entregues, lidas,
 * falhas e respostas). Telefone é busca por sufixo (aceita com/sem 55).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await connectDB();

  const sp = req.nextUrl.searchParams;
  const filtro: Record<string, unknown> = {};
  const telefone = (sp.get("telefone") ?? "").replace(/\D/g, "");
  if (telefone) filtro.telefone = { $regex: `${telefone.replace(/^55/, "")}$` };
  const direcao = sp.get("direcao");
  if (direcao === "saida" || direcao === "entrada") filtro.direcao = direcao;
  const status = sp.get("status");
  if (status) filtro.status = status;
  const limite = Math.min(500, Math.max(1, Number(sp.get("limite")) || 200));

  const mensagens = await MensagemWhatsApp.find(filtro).sort({ createdAt: -1 }).limit(limite).lean();
  const userIds = Array.from(new Set(mensagens.map((m) => (m.userId ? String(m.userId) : null)).filter(Boolean)));
  const users = await User.find({ _id: { $in: userIds } }).select("name role").lean();
  const nomes = new Map(users.map((u) => [String(u._id), `${u.name} (${u.role})`]));

  const template = process.env.WHATSAPP_TEMPLATE || "vagaon_aviso";
  const [totais, ultimas24h, templateInfo] = await Promise.all([
    MensagemWhatsApp.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    MensagemWhatsApp.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86_400_000) } }),
    infoTemplate(template),
  ]);

  return NextResponse.json({
    configurado: whatsappConfigurado(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
    template,
    templateInfo,
    totais: Object.fromEntries((totais as { _id: string; n: number }[]).map((t) => [t._id, t.n])),
    ultimas24h,
    mensagens: mensagens.map((m) => ({
      id: String(m._id),
      direcao: m.direcao,
      telefone: m.telefone,
      usuario: m.userId ? nomes.get(String(m.userId)) ?? null : null,
      tipo: m.tipo,
      texto: m.texto,
      status: m.status,
      erro: m.erro,
      waId: m.waId,
      em: new Date(m.createdAt).toISOString(),
      atualizadoEm: new Date(m.updatedAt).toISOString(),
    })),
  });
}
