import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { convidarGerente, listarEquipe, papelNaEmpresa } from "@/lib/servicos/equipe";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";

// GET /api/empresa/equipe — membros e convites pendentes da minha empresa
export async function GET() {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);
    const { membros, convites } = await listarEquipe(empresa);
    return NextResponse.json({
      papel: papelNaEmpresa(empresa, ator.userId),
      empresa: { id: String(empresa._id), nome: empresa.nomeFantasia },
      membros,
      convites,
    });
  } catch (err) {
    return responderErro(err);
  }
}

// POST /api/empresa/equipe { email, nome? } — dono convida um gerente
export async function POST(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);
    const body = await req.json().catch(() => ({}));
    if (typeof body?.email !== "string") throw new ErroAtor(400, "Informe o e-mail.");
    const r = await convidarGerente(empresa, ator.userId, {
      email: body.email,
      nome: typeof body?.nome === "string" ? body.nome : "",
    });
    return NextResponse.json(r, { status: 201 });
  } catch (err) {
    return responderErro(err);
  }
}
