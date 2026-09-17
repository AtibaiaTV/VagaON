import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import { enviarMensagem, listarMensagens } from "@/lib/servicos/matches";

export const dynamic = "force-dynamic";

// GET /api/matches/[id]/mensagens?depois=<ISO> — histórico, ou só o que chegou depois (polling)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const depoisParam = new URL(req.url).searchParams.get("depois");
    const depois = depoisParam ? new Date(depoisParam) : null;

    const resultado = await listarMensagens(ator, params.id, depois);
    return NextResponse.json(resultado);
  } catch (err) {
    return responderErro(err);
  }
}

// POST /api/matches/[id]/mensagens { texto }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ator = await resolverAtor();
    const body = await req.json().catch(() => null);
    if (typeof body?.texto !== "string") throw new ErroAtor(400, "Informe o texto.");

    const mensagem = await enviarMensagem(ator, params.id, body.texto);
    return NextResponse.json({ mensagem }, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
