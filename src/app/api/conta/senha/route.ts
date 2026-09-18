import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

/**
 * PUT /api/conta/senha — define ou troca a senha da conta logada.
 *
 * Conta sem senha (criada pelo SSO da RedeSA) define a primeira sem pedir
 * nada além da sessão: quem garantiu a identidade foi o backoffice. Conta
 * com senha precisa informar a atual, para que uma sessão esquecida aberta
 * num aparelho alheio não vire troca de senha.
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const novaSenha = typeof body.novaSenha === "string" ? body.novaSenha : "";
  const senhaAtual = typeof body.senhaAtual === "string" ? body.senhaAtual : "";

  if (novaSenha.length < 8) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  if (novaSenha.length > 128) {
    return NextResponse.json({ error: "Senha longa demais." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("password");
  if (!user) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

  if (user.password) {
    if (!senhaAtual) {
      return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
    }
    if (!(await bcrypt.compare(senhaAtual, user.password))) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
    }
  }

  await User.updateOne({ _id: user._id }, { $set: { password: await bcrypt.hash(novaSenha, 12) } });
  return NextResponse.json({ ok: true });
}
