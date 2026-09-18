import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";

export const dynamic = "force-dynamic";

const ACOES = ["criar", "ativar", "desativar", "renovar"] as const;
type Acao = (typeof ACOES)[number];

/**
 * POST /api/perfil/curriculo-link { acao }
 * - criar: gera o token se ainda não existe (e liga)
 * - ativar / desativar: liga/desliga o link sem trocar o token
 * - renovar: troca o token (o link antigo para de funcionar)
 * Devolve { token, ativo }; o cliente monta a URL /cv/[token].
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "profissional") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const acao: Acao = ACOES.includes(body?.acao) ? body.acao : "criar";

  await connectDB();
  const prof = await Profissional.findOne({ userId: session.user.id }).select("curriculoPublico");
  if (!prof) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

  const atual = prof.curriculoPublico;
  let novo: { token: string; ativo: boolean; criadoEm: Date };

  if (acao === "renovar" || !atual?.token) {
    novo = { token: randomBytes(16).toString("base64url"), ativo: true, criadoEm: new Date() };
  } else if (acao === "desativar") {
    novo = { ...atual, ativo: false };
  } else {
    novo = { ...atual, ativo: true };
  }

  await Profissional.updateOne({ _id: prof._id }, { $set: { curriculoPublico: novo } });
  return NextResponse.json({ token: novo.token, ativo: novo.ativo });
}
