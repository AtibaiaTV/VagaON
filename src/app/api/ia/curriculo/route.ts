import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extrairPerfilDeCurriculo, type EntradaCurriculo } from "@/lib/ia/curriculo";
import { iaConfigurada } from "@/lib/ia/cliente";
import { ErroAtor } from "@/lib/servicos/erros";
import { responderErro } from "@/lib/servicos/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ARQUIVO = 4 * 1024 * 1024; // limite prático do corpo em serverless
const IMAGENS = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/ia/curriculo — multipart: `arquivo` (PDF/JPG/PNG/WebP ≤ 4 MB) e/ou `texto`.
 * Devolve uma sugestão de perfil; nada é gravado — a pessoa revisa e salva.
 * O arquivo não é armazenado em lugar nenhum.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "profissional") throw new ErroAtor(401, "Não autorizado.");
    if (!iaConfigurada()) throw new ErroAtor(503, "Importação por IA não está ativada neste ambiente.");

    const form = await req.formData().catch(() => null);
    if (!form) throw new ErroAtor(400, "Envie um arquivo ou um texto.");

    const arquivo = form.get("arquivo");
    const texto = typeof form.get("texto") === "string" ? String(form.get("texto")).trim() : "";
    const entrada: EntradaCurriculo = {};

    if (arquivo instanceof File && arquivo.size > 0) {
      if (arquivo.size > MAX_ARQUIVO) throw new ErroAtor(400, "Arquivo acima de 4 MB. Envie um PDF menor ou cole o texto.");
      const base64 = Buffer.from(await arquivo.arrayBuffer()).toString("base64");
      if (arquivo.type === "application/pdf") entrada.pdfBase64 = base64;
      else if (IMAGENS.has(arquivo.type)) entrada.imagem = { base64, mediaType: arquivo.type as "image/jpeg" | "image/png" | "image/webp" };
      else throw new ErroAtor(400, "Formato não suportado. Envie PDF, JPG, PNG ou WebP — ou cole o texto.");
    }
    if (texto) entrada.texto = texto.slice(0, 20000);

    if (!entrada.pdfBase64 && !entrada.imagem && !entrada.texto) throw new ErroAtor(400, "Envie um arquivo ou cole o texto do currículo.");

    const { dados, uso } = await extrairPerfilDeCurriculo(entrada);
    return NextResponse.json({ perfil: dados, uso });
  } catch (err) {
    return responderErro(err);
  }
}
