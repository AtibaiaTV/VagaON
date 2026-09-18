import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ErroAtor } from "@/lib/servicos/ator";
import { moverCandidatura } from "@/lib/servicos/candidaturas";
import { responderErro } from "@/lib/servicos/http";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";

export const dynamic = "force-dynamic";

// PATCH /api/candidaturas/[id] { status?, notaEmpresa? } — empresa move o card / anota
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "empresa") throw new ErroAtor(401, "Não autorizado.");

    await connectDB();
    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).lean();
    if (!empresa) throw new ErroAtor(404, "Perfil de empresa não encontrado.");

    const body = await req.json().catch(() => ({}));
    const atualizada = await moverCandidatura(empresa, params.id, {
      status: typeof body?.status === "string" ? body.status : undefined,
      notaEmpresa: body?.notaEmpresa !== undefined ? (body.notaEmpresa === null ? null : String(body.notaEmpresa)) : undefined,
    });

    return NextResponse.json(atualizada);
  } catch (err) {
    return responderErro(err);
  }
}
