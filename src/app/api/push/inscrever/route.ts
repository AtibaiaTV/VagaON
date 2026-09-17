import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export const dynamic = "force-dynamic";

interface Inscricao {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

function validar(sub: Inscricao | null) {
  if (!sub || typeof sub.endpoint !== "string" || !sub.endpoint.startsWith("https://")) return null;
  const p256dh = sub.keys?.p256dh;
  const authKey = sub.keys?.auth;
  if (typeof p256dh !== "string" || typeof authKey !== "string") return null;
  return { endpoint: sub.endpoint, keys: { p256dh, auth: authKey } };
}

// POST /api/push/inscrever { subscription } — idempotente por endpoint
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sub = validar(body?.subscription ?? null);
  if (!sub) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });

  await connectDB();
  await PushSubscription.updateOne(
    { endpoint: sub.endpoint },
    {
      $set: {
        userId: session.user.id,
        keys: sub.keys,
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
        ultimoUso: new Date(),
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/inscrever { endpoint }
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Endpoint inválido." }, { status: 400 });

  await connectDB();
  await PushSubscription.deleteOne({ endpoint: body.endpoint, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
