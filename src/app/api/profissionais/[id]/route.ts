import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import { notifyRedesaTalento } from "@/lib/redesa-webhook";
import { calcularCompletude } from "@/lib/completude";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const profissional = await Profissional.findById(params.id).lean();
    if (!profissional) {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    return NextResponse.json(profissional);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const profissional = await Profissional.findById(params.id);
    if (!profissional) {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    if (profissional.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json();

    const camposPermitidos = [
      "nomeCompleto", "telefone", "fotoPerfil", "dataNascimento",
      "cidade", "estado", "cep", "dispostoViajar",
      "especialidades", "resumoProfissional", "habilidades",
      "disponibilidade", "experiencias",
      "linkedinUrl", "curriculoUrl",
      // Preferências do match
      "raioKm", "pretensaoSalarial", "turnos", "escalas", "idiomas",
    ];

    const atualizacao: Record<string, unknown> = {};
    for (const campo of camposPermitidos) {
      if (body[campo] !== undefined) {
        atualizacao[campo] = body[campo];
      }
    }
    // Liga/desliga a presença no deck das empresas sem expor o resto de `match`.
    if (typeof body.matchAtivo === "boolean") {
      atualizacao["match.ativo"] = body.matchAtivo;
    }

    // Recalcula completude
    const dadosAtuais = { ...profissional.toObject(), ...atualizacao };
    atualizacao.completude = calcularCompletude(dadosAtuais);

    const atualizado = await Profissional.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    );

    // Notifica o banco de talentos da Redesa com os dados atualizados —
    // mesmo vagaonCandidatoId do cadastro inicial, para que a Redesa
    // atualize o registro em vez de duplicar. Aguardado (não fire-and-
    // forget): funções serverless da Vercel encerram a execução assim que
    // a resposta é enviada, então um `void` aqui corre risco de a chamada
    // nunca completar.
    if (atualizado) {
      const user = await User.findById(atualizado.userId).lean();
      await notifyRedesaTalento({
        vagaonCandidatoId: atualizado._id.toString(),
        nome: atualizado.nomeCompleto,
        email: user?.email || undefined,
        telefone: atualizado.telefone || undefined,
        linkedin: atualizado.linkedinUrl || undefined,
        curriculoUrl: atualizado.curriculoUrl || undefined,
        mensagem: atualizado.resumoProfissional || undefined,
        categoria: atualizado.especialidades?.[0] || undefined,
        cidade: atualizado.cidade || undefined,
        estado: atualizado.estado || undefined,
      });
    }

    return NextResponse.json(atualizado);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
