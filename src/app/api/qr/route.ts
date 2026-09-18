import { NextRequest, NextResponse } from "next/server";
import { normalizarOrigem } from "@/lib/servicos/cadastro-rapido";
import { ehDestinoQr, gerarQrPng, gerarQrSvg, urlDestino } from "@/lib/qr";

export const dynamic = "force-dynamic";

/**
 * GET /api/qr?destino=curriculo|anunciar|comecar&origem=cartaz&selo=1&formato=svg|png&tamanho=1024
 * Só gera QR para as páginas de entrada do próprio site.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const destino = p.get("destino");
  if (!ehDestinoQr(destino)) return NextResponse.json({ error: "Destino inválido." }, { status: 400 });

  const url = urlDestino(destino, normalizarOrigem(p.get("origem")));
  const tamanho = Math.min(2048, Math.max(128, Number(p.get("tamanho")) || 512));
  const nome = `qr-vagaon-${destino}${p.get("origem") ? `-${normalizarOrigem(p.get("origem"))}` : ""}`;

  if (p.get("formato") === "png") {
    const png = await gerarQrPng(url, tamanho);
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Content-Disposition": `inline; filename="${nome}.png"`, "Cache-Control": "public, max-age=3600" },
    });
  }

  const svg = await gerarQrSvg(url, { selo: p.get("selo") !== "0", tamanho });
  return new NextResponse(svg, {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Content-Disposition": `inline; filename="${nome}.svg"`, "Cache-Control": "public, max-age=3600" },
  });
}
