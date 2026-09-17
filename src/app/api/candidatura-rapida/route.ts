import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isValidObjectId } from "mongoose";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { ESTADOS } from "@/constants/estados";
import { calcularCompletude } from "@/lib/completude";
import { connectDB } from "@/lib/db";
import { msgNovaCandidatura, notificar } from "@/lib/notificacoes";
import { notifyRedesaCandidatura, notifyRedesaTalento } from "@/lib/redesa-webhook";
import { montarTriagem } from "@/lib/triagem";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

/**
 * Candidatura rápida para quem ainda não tem conta: cria usuário + perfil
 * mínimo (o que o motor de match precisa) + candidatura numa chamada só.
 * O cliente faz o login em seguida com o mesmo e-mail/senha.
 */

const UF_VALIDAS = new Set(ESTADOS.map((e) => e.value));
const ESPECIALIDADES_VALIDAS = new Set(ESPECIALIDADES.map((e) => e.value));

function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    // Honeypot: humanos não preenchem; robôs preenchem. Finge sucesso e sai.
    if (texto(body.site, 50)) return NextResponse.json({ ok: true }, { status: 201 });

    const vagaId = texto(body.vagaId, 40);
    const nome = texto(body.nome, 120);
    const email = texto(body.email, 160).toLowerCase();
    const senha = typeof body.senha === "string" ? body.senha : "";
    const telefone = texto(body.telefone, 30);
    const cidade = texto(body.cidade, 80);
    const estado = texto(body.estado, 2).toUpperCase();
    const especialidade = texto(body.especialidade, 60);

    if (!isValidObjectId(vagaId)) return NextResponse.json({ error: "Vaga inválida." }, { status: 400 });
    if (nome.length < 2) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    if (senha.length < 8) return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    const digitos = telefone.replace(/\D/g, "");
    if (digitos.length < 10 || digitos.length > 13) return NextResponse.json({ error: "Informe um telefone com DDD." }, { status: 400 });
    if (!cidade) return NextResponse.json({ error: "Informe sua cidade." }, { status: 400 });
    if (!UF_VALIDAS.has(estado)) return NextResponse.json({ error: "Informe o estado." }, { status: 400 });

    await connectDB();

    const vaga = await Vaga.findById(vagaId);
    if (!vaga || vaga.status !== "ativa") return NextResponse.json({ error: "Vaga não disponível." }, { status: 404 });

    const especialidadeFinal = ESPECIALIDADES_VALIDAS.has(especialidade) ? especialidade : vaga.especialidade;

    if (await User.exists({ email })) {
      return NextResponse.json(
        { error: "Este e-mail já tem conta. Entre para se candidatar.", existente: true },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: nome,
      email,
      password: await bcrypt.hash(senha, 12),
      role: "profissional",
      status: "ativo",
    });

    const dadosPerfil = {
      userId: user._id,
      nomeCompleto: nome,
      telefone,
      cidade,
      estado,
      especialidades: [especialidadeFinal],
      disponibilidade: { tipo: [vaga.tipo], imediata: true, dataDisponivel: null },
      experiencias: [],
      habilidades: [],
    };
    const profissional = await Profissional.create({ ...dadosPerfil, completude: calcularCompletude(dadosPerfil) });
    await User.updateOne({ _id: user._id }, { $set: { profileId: profissional._id } });

    const candidatura = await Candidatura.create({
      vagaId: vaga._id,
      profissionalId: profissional._id,
      empresaId: vaga.empresaId,
      status: "enviada",
      mensagem: "Candidatura rápida pelo site",
      triagem: montarTriagem(vaga, body.respostasTriagem),
      snapshotProfissional: {
        nomeCompleto: nome,
        especialidades: [especialidadeFinal],
        cidade,
        estado,
        fotoPerfil: null,
      },
    });
    await Vaga.updateOne({ _id: vaga._id }, { $inc: { totalCandidaturas: 1 } });

    // Mesmos efeitos do cadastro normal + da candidatura pelo board.
    await notifyRedesaTalento({ vagaonCandidatoId: String(profissional._id), nome, email, telefone });
    const empresa = await Empresa.findById(vaga.empresaId).select("redesaId").lean();
    if (empresa?.redesaId) {
      await notifyRedesaCandidatura({
        vagaonId: String(vaga._id),
        vagaonCandidaturaId: String(candidatura._id),
        nome,
        email,
        telefone,
        mensagem: "Candidatura rápida pelo site",
      });
    }
    await notificar(
      { tipo: "empresa", perfilId: vaga.empresaId },
      msgNovaCandidatura({ profissionalNome: nome, vagaTitulo: vaga.titulo, vagaId: String(vaga._id) })
    );

    return NextResponse.json({ ok: true, email }, { status: 201 });
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: "Este e-mail já tem conta. Entre para se candidatar.", existente: true }, { status: 409 });
    }
    console.error("[candidatura-rapida]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
