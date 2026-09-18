import QRCode from "qrcode";

/**
 * QR Codes de entrada: cada um aponta para uma página de cadastro rápido e
 * carrega `?origem=` (cartaz do balcão, adesivo, Instagram…) para medir de
 * onde vêm os cadastros. Nível de correção H permite o selo no centro.
 */

export const DESTINOS_QR = {
  comecar: { caminho: "/comecar", rotulo: "Geral", descricao: "A pessoa escolhe: sou profissional ou sou empresa." },
  curriculo: { caminho: "/curriculo", rotulo: "Profissional", descricao: "Cadastrar currículo em 1 minuto." },
  anunciar: { caminho: "/anunciar", rotulo: "Empresa", descricao: "Publicar a primeira vaga em 1 minuto." },
} as const;

export type DestinoQr = keyof typeof DESTINOS_QR;

export function ehDestinoQr(v: unknown): v is DestinoQr {
  return typeof v === "string" && v in DESTINOS_QR;
}

export function baseDoSite(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function urlDestino(destino: DestinoQr, origem?: string | null, base: string = baseDoSite()): string {
  const url = `${base}${DESTINOS_QR[destino].caminho}`;
  return origem ? `${url}?origem=${encodeURIComponent(origem)}` : url;
}

/** Selo central: círculo verde-escuro com o "V" e VAGAON, como no material da marca. */
function selo(tamanho: number): string {
  const c = tamanho / 2;
  const r = tamanho * 0.15;
  const traco = r * 0.16;
  return (
    `<g transform="translate(${c} ${c})">` +
    `<circle r="${(r + traco * 0.9).toFixed(2)}" fill="#ffffff"/>` +
    `<circle r="${r.toFixed(2)}" fill="#1a5c38"/>` +
    `<path d="M ${(-r * 0.42).toFixed(2)} ${(-r * 0.12).toFixed(2)} L ${(-r * 0.1).toFixed(2)} ${(r * 0.18).toFixed(2)} L ${(r * 0.5).toFixed(2)} ${(-r * 0.48).toFixed(2)}" fill="none" stroke="#4ade80" stroke-width="${traco.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<text y="${(r * 0.66).toFixed(2)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${(r * 0.4).toFixed(2)}" fill="#ffffff" letter-spacing="${(r * 0.02).toFixed(2)}">VAGA<tspan fill="#4ade80">ON</tspan></text>` +
    `</g>`
  );
}

export interface OpcoesQr {
  /** Selo VagaON no centro. */
  selo?: boolean;
  /** Largura/altura em px do SVG (o viewBox continua em módulos). */
  tamanho?: number;
}

/** SVG do QR (string), com ou sem o selo. Vetorial: serve para adesivo, cartaz e tela. */
export async function gerarQrSvg(url: string, opcoes: OpcoesQr = {}): Promise<string> {
  const { selo: comSelo = true, tamanho = 512 } = opcoes;
  let svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 2 });
  svg = svg.replace("<svg ", `<svg width="${tamanho}" height="${tamanho}" `);
  if (!comSelo) return svg;
  const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!m) return svg;
  return svg.replace("</svg>", `${selo(Number(m[1]))}</svg>`);
}

/** PNG sem selo (o selo em PNG é gerado no navegador, a partir do SVG). */
export async function gerarQrPng(url: string, tamanho = 1024): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "H", margin: 2, width: tamanho });
}
