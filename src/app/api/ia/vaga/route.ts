import { NextRequest, NextResponse } from "next/server";
import { SETORES } from "@/constants/setores";
import { iaConfigurada } from "@/lib/ia/cliente";
import { estruturarVaga } from "@/lib/ia/vaga";
import { exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/ia/vaga { frase } — empresa descreve a vaga em linguagem natural
export async function POST(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);
    if (!iaConfigurada()) throw new ErroAtor(503, "Criação por IA não está ativada neste ambiente.");

    const body = await req.json().catch(() => ({}));
    const frase = typeof body?.frase === "string" ? body.frase.trim() : "";
    if (frase.length < 8) throw new ErroAtor(400, "Descreva a vaga com um pouco mais de detalhe.");
    if (frase.length > 2000) throw new ErroAtor(400, "Descrição longa demais (máx. 2000 caracteres).");

    const { dados, uso } = await estruturarVaga(frase, {
      nomeFantasia: empresa.nomeFantasia,
      setor: SETORES.find((s) => s.value === empresa.setor)?.label ?? empresa.setor,
      cidade: empresa.cidade,
      estado: empresa.estado,
    });
    return NextResponse.json({ vaga: dados, uso });
  } catch (err) {
    return responderErro(err);
  }
}
