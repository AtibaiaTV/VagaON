import { NextRequest, NextResponse } from "next/server";
import { ErroAtor, exigirEmpresa, resolverAtor } from "@/lib/servicos/ator";
import { responderErro } from "@/lib/servicos/http";
import Empresa from "@/models/Empresa";

export const dynamic = "force-dynamic";

// PATCH /api/match/preferencias { modoCego: boolean } — empresa
export async function PATCH(req: NextRequest) {
  try {
    const ator = await resolverAtor();
    const empresa = exigirEmpresa(ator);

    const body = await req.json().catch(() => ({}));
    if (typeof body?.modoCego !== "boolean") throw new ErroAtor(400, "Informe modoCego (true/false).");

    await Empresa.updateOne({ _id: empresa._id }, { $set: { "match.modoCego": body.modoCego } });
    return NextResponse.json({ modoCego: body.modoCego });
  } catch (err) {
    return responderErro(err);
  }
}
