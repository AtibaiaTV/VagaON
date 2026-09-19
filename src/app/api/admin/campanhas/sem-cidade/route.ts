import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enviarLoteSemCidade, simularCampanhaSemCidade, LOTE_PADRAO } from "@/lib/servicos/campanha-cidade";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function admin() {
  const session = await auth();
  return Boolean(session && session.user.role === "admin");
}

// GET — simulação: quem receberia e quem está bloqueado (e por quê)
export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json(await simularCampanhaSemCidade());
}

// POST { limite } — envia um lote e marca cada perfil
export async function POST(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const limite = Number(body?.limite) || LOTE_PADRAO;
  return NextResponse.json(await enviarLoteSemCidade(limite));
}
