import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { cancelarConviteDaEmpresa, listarEquipe, removerMembroDaEmpresa } from "@/lib/servicos/equipe";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";
import Empresa from "@/models/Empresa";

export const dynamic = "force-dynamic";

async function empresaDoAdmin(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "admin") throw new ErroAtor(401, "Não autorizado.");
  if (!isValidObjectId(id)) throw new ErroAtor(400, "Empresa inválida.");
  await connectDB();
  const empresa = await Empresa.findById(id);
  if (!empresa) throw new ErroAtor(404, "Empresa não encontrada.");
  return empresa;
}

// GET /api/admin/empresas/[id]/equipe — dono, gerentes e convites pendentes
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const empresa = await empresaDoAdmin(params.id);
    const { membros, convites } = await listarEquipe(empresa);
    return NextResponse.json({ empresa: { id: String(empresa._id), nome: empresa.nomeFantasia }, membros, convites });
  } catch (err) {
    return responderErro(err);
  }
}

// DELETE /api/admin/empresas/[id]/equipe?membro=<userId> | ?convite=<conviteId>
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const empresa = await empresaDoAdmin(params.id);
    const membro = req.nextUrl.searchParams.get("membro");
    const convite = req.nextUrl.searchParams.get("convite");
    if (membro) {
      await removerMembroDaEmpresa(empresa, membro);
    } else if (convite) {
      await cancelarConviteDaEmpresa(empresa._id, convite);
    } else {
      throw new ErroAtor(400, "Informe membro ou convite.");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return responderErro(err);
  }
}
