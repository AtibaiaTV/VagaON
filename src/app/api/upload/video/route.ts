import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { PASTA_VIDEOS } from "@/constants/upload";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload/video — assinatura para upload direto navegador → Cloudinary.
 * O vídeo não passa pela Vercel (limite de 4,5 MB por requisição). O cliente
 * envia exatamente os parâmetros assinados (timestamp, folder) mais o arquivo.
 */
export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "profissional") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Upload de vídeo não configurado." }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: PASTA_VIDEOS }, apiSecret);

  return NextResponse.json({ cloudName, apiKey, timestamp, folder: PASTA_VIDEOS, signature });
}
