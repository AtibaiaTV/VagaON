import { NextRequest, NextResponse } from "next/server";
import { aceitarConvite, consultarConvite } from "@/lib/servicos/equipe";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// GET /api/convite/[token] — estado do convite (público: só o que a página precisa)
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const c = await consultarConvite(params.token);
    if (c.estado !== "valido") return NextResponse.json({ estado: c.estado });
    return NextResponse.json({
      estado: "valido",
      empresa: c.empresa.nomeFantasia,
      email: c.convite.email,
      nome: c.convite.nome,
      contaExiste: c.contaExiste,
      expiraEm: c.convite.expiraEm.toISOString(),
    });
  } catch (err) {
    return responderErro(err);
  }
}

// POST /api/convite/[token] { nome?, senha? } — aceita: cria a conta ou vincula a existente
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const r = await aceitarConvite(params.token, {
      nome: typeof body?.nome === "string" ? body.nome : undefined,
      senha: typeof body?.senha === "string" ? body.senha : undefined,
    });
    return NextResponse.json(r, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
