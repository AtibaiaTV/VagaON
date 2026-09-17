import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Notificacao from "@/models/Notificacao";

export const dynamic = "force-dynamic";

// GET /api/notificacoes?limite=30 — últimas notificações + contagem de não lidas
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const limite = Math.min(100, Math.max(1, parseInt(new URL(req.url).searchParams.get("limite") ?? "30") || 30));

  await connectDB();
  const [docs, naoLidas] = await Promise.all([
    Notificacao.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(limite).lean(),
    Notificacao.countDocuments({ userId: session.user.id, lidaEm: null }),
  ]);

  return NextResponse.json({
    naoLidas,
    notificacoes: docs.map((n) => ({
      id: String(n._id),
      categoria: n.categoria,
      titulo: n.titulo,
      corpo: n.corpo,
      url: n.url,
      lida: Boolean(n.lidaEm),
      em: new Date(n.createdAt).toISOString(),
    })),
  });
}

// PATCH /api/notificacoes { ids?: string[], todas?: true } — marca como lidas
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const filtro: Record<string, unknown> = { userId: session.user.id, lidaEm: null };

  if (!body?.todas) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter((i: unknown) => typeof i === "string" && isValidObjectId(i)) : [];
    if (!ids.length) return NextResponse.json({ error: "Informe ids ou todas: true." }, { status: 400 });
    filtro._id = { $in: ids };
  }

  await connectDB();
  const r = await Notificacao.updateMany(filtro, { $set: { lidaEm: new Date() } });
  return NextResponse.json({ marcadas: r.modifiedCount });
}
