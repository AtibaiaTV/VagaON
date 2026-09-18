import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import { notifyRedesaTalento } from "@/lib/redesa-webhook";
import { calcularCompletude } from "@/lib/completude";
import { PASTA_VIDEOS } from "@/constants/upload";
import { geocodificarCidade, normalizarCidade } from "@/constants/municipios";

/**
 * Só aceita vídeo que veio do nosso Cloudinary, na pasta de vídeos — o
 * cliente manda a URL, mas não pode apontar para qualquer lugar.
 */
function validarVideo(v: unknown): { url: string; publicId: string; duracao: number; enviadoEm: Date } | null | undefined {
  if (v === null) return null;
  if (!v || typeof v !== "object") return undefined;
  const { url, publicId, duracao } = v as Record<string, unknown>;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud || typeof url !== "string" || typeof publicId !== "string") return undefined;
  if (!url.startsWith(`https://res.cloudinary.com/${cloud}/video/upload/`)) return undefined;
  if (!publicId.startsWith(`${PASTA_VIDEOS}/`) || publicId.length > 200) return undefined;
  const seg = Number(duracao);
  return { url, publicId, duracao: Number.isFinite(seg) ? Math.max(0, Math.min(600, Math.round(seg))) : 0, enviadoEm: new Date() };
}

async function apagarVideo(publicId: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch((err) => {
    console.error("[profissionais] falha ao apagar vídeo antigo:", err);
  });
}

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
      "cidade", "estado", "cep", "logradouro", "numero", "complemento", "bairro", "dispostoViajar",
      "especialidades", "resumoProfissional", "habilidades",
      "disponibilidade", "experiencias", "formacao",
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
    // Cidades de interesse: só as que a tabela de municípios reconhece, no
    // máximo 5, sem repetir e sem a própria cidade. Coordenadas gravadas aqui
    // (o hook de geo do modelo só cuida da cidade principal).
    if (body.cidadesInteresse !== undefined) {
      const lista = Array.isArray(body.cidadesInteresse) ? body.cidadesInteresse : [];
      const vistas = new Set<string>();
      const saida: { cidade: string; estado: string; localizacao: { type: "Point"; coordinates: [number, number] } }[] = [];
      const propria = `${String(atualizacao.estado ?? profissional.estado ?? "").toUpperCase()}:${normalizarCidade(String(atualizacao.cidade ?? profissional.cidade ?? ""))}`;
      for (const item of lista) {
        if (saida.length >= 5 || !item || typeof item !== "object") break;
        const cidade = String((item as Record<string, unknown>).cidade ?? "").trim().slice(0, 80);
        const estado = String((item as Record<string, unknown>).estado ?? "").trim().toUpperCase().slice(0, 2);
        const chave = `${estado}:${normalizarCidade(cidade)}`;
        if (!cidade || !estado || vistas.has(chave) || chave === propria) continue;
        const coords = geocodificarCidade(cidade, estado);
        if (!coords) continue;
        vistas.add(chave);
        saida.push({ cidade, estado, localizacao: { type: "Point", coordinates: [coords.lng, coords.lat] } });
      }
      atualizacao.cidadesInteresse = saida;
    }

    // Liga/desliga a presença no deck das empresas sem expor o resto de `match`.
    if (typeof body.matchAtivo === "boolean") {
      atualizacao["match.ativo"] = body.matchAtivo;
    }

    // Vídeo de apresentação: valida a origem e apaga o anterior se trocou/removeu.
    let videoAntigoParaApagar: string | null = null;
    if (body.videoApresentacao !== undefined) {
      const video = validarVideo(body.videoApresentacao);
      if (video === undefined) {
        return NextResponse.json({ error: "Vídeo inválido." }, { status: 400 });
      }
      const atualId = profissional.videoApresentacao?.publicId ?? null;
      if (atualId && atualId !== video?.publicId) videoAntigoParaApagar = atualId;
      atualizacao.videoApresentacao = video;
    }

    // Recalcula completude
    const dadosAtuais = { ...profissional.toObject(), ...atualizacao };
    atualizacao.completude = calcularCompletude(dadosAtuais);

    const atualizado = await Profissional.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    );
    if (videoAntigoParaApagar) await apagarVideo(videoAntigoParaApagar);

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
