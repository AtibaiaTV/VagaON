import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";
import {
  confirmarCodigoVerificacao,
  enviarCodigoVerificacao,
  estadoVerificacao,
} from "@/lib/servicos/whatsapp-verificacao";

export const dynamic = "force-dynamic";

// GET /api/whatsapp/verificacao — situação do número do usuário logado
export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new ErroAtor(401, "Não autorizado.");
    return NextResponse.json(await estadoVerificacao(session.user.id, session.user.role));
  } catch (err) {
    return responderErro(err);
  }
}

// POST /api/whatsapp/verificacao { acao: "enviar" } | { acao: "confirmar", codigo }
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) throw new ErroAtor(401, "Não autorizado.");
    const body = await req.json().catch(() => ({}));

    if (body?.acao === "confirmar") {
      await confirmarCodigoVerificacao(session.user.id, session.user.role, String(body?.codigo ?? ""));
      return NextResponse.json({ ok: true, verificado: true });
    }

    const r = await enviarCodigoVerificacao(session.user.id, session.user.role);
    if (!r.enviado) throw new ErroAtor(400, r.motivo ?? "Não foi possível enviar o código.");
    return NextResponse.json({ ok: true, enviado: true });
  } catch (err) {
    return responderErro(err);
  }
}
