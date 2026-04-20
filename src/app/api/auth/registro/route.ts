import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Profissional from "@/models/Profissional";
import Empresa from "@/models/Empresa";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, senha, role, nomeFantasia } = body;

    if (!nome || !email || !senha || !role) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (!["profissional", "empresa"].includes(role)) {
      return NextResponse.json({ error: "Perfil inválido." }, { status: 400 });
    }

    if (senha.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const novoUsuario = await User.create({
      name: nome,
      email: email.toLowerCase(),
      password: senhaHash,
      role,
      status: "ativo",
    });

    // Cria o perfil vinculado ao usuário
    if (role === "profissional") {
      const perfil = await Profissional.create({
        userId: novoUsuario._id,
        nomeCompleto: nome,
        especialidades: [],
        disponibilidade: { tipo: [], imediata: true, dataDisponivel: null },
        experiencias: [],
        habilidades: [],
      });
      await User.findByIdAndUpdate(novoUsuario._id, { profileId: perfil._id });
    } else if (role === "empresa") {
      const perfil = await Empresa.create({
        userId: novoUsuario._id,
        nomeFantasia: nomeFantasia || nome,
      });
      await User.findByIdAndUpdate(novoUsuario._id, { profileId: perfil._id });
    }

    return NextResponse.json(
      { message: "Cadastro realizado com sucesso!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
