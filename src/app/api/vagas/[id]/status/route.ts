import { NextRequest, NextResponse } from "next/server";
import { exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";
import { alterarStatusVaga } from "@/lib/servicos/vagas";
import { TRANSICOES_VAGA, type AcaoVaga } from "@/lib/vagas-estado";

export const dynamic = "force-dynamic";

// PATCH /api/vagas/[id]/status { acao: pausar | reativar | preencher | encerrar | renovar }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const empresa = exigirEmpresa(await resolverAtor());
    const body = await req.json().catch(() => ({}));
    const acao = body?.acao;
    if (typeof acao !== "string" || !(acao in TRANSICOES_VAGA)) throw new ErroAtor(400, "Ação inválida.");
    const vaga = await alterarStatusVaga(empresa, params.id, acao as AcaoVaga);
    return NextResponse.json(vaga);
  } catch (err) {
    return responderErro(err);
  }
}
