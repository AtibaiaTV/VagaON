import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario, papelNaEmpresa } from "@/lib/servicos/equipe";

export const dynamic = "force-dynamic";

// POST /api/planos/interesse — empresa quer o Pro; fica registrado para a equipe comercial
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "empresa") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await connectDB();
  const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).select("_id userId membros").lean();
  if (!empresa) return NextResponse.json({ error: "Perfil de empresa não encontrado." }, { status: 404 });
  // Plano é assunto do dono.
  if (papelNaEmpresa(empresa, session.user.id) !== "dono") {
    return NextResponse.json({ error: "Só o dono da empresa decide sobre o plano." }, { status: 403 });
  }
  await Empresa.updateOne({ _id: empresa._id }, { $set: { "assinatura.interesseEm": new Date() } });
  return NextResponse.json({ ok: true });
}
