import QRCode from "qrcode";
import { LOGO_MIOLO_PNG_BASE64 } from "./qr-miolo-logo";

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

/**
 * Selo central: o miolo oficial da marca (MIOLO_QRCODE.svg, CorelDRAW):
 * círculo verde #0E513A com o logo em PNG recortado em duas faixas — o check
 * em cima, VAGAON embaixo, cada um com sua escala. As medidas abaixo são as
 * do arquivo original (viewBox 18.91) e só recebem uma transformação para o
 * tamanho do QR. Um anel branco fino separa o selo dos módulos.
 */
const MIOLO_VIEWBOX = 18.91;

function selo(tamanho: number): string {
  const c = tamanho / 2;
  const r = tamanho * 0.15;
  const anel = r * 0.12;
  const escala = (2 * r) / MIOLO_VIEWBOX;
  return (
    `<defs>` +
    // symbol com viewBox: assim o <use> consegue dar tamanho à imagem (numa <image> solta ele não consegue).
    `<symbol id="qr-miolo-logo" viewBox="0 0 1024 1024"><image width="1024" height="1024" href="data:image/png;base64,${LOGO_MIOLO_PNG_BASE64}"/></symbol>` +
    `<clipPath id="qr-miolo-check"><rect x="3.7" y="3.14" width="11.5" height="6.15"/></clipPath>` +
    `<clipPath id="qr-miolo-texto"><rect x="1.1" y="9.54" width="16.72" height="4.37"/></clipPath>` +
    `</defs>` +
    `<circle cx="${c.toFixed(2)}" cy="${c.toFixed(2)}" r="${(r + anel).toFixed(2)}" fill="#ffffff"/>` +
    `<g transform="translate(${(c - r).toFixed(3)} ${(c - r).toFixed(3)}) scale(${escala.toFixed(5)})">` +
    `<circle cx="9.455" cy="9.455" r="9.455" fill="#0E513A"/>` +
    // clip no <g>, não no <use>: no <use>, x/y viram translate e arrastariam o recorte junto.
    `<g clip-path="url(#qr-miolo-check)"><use href="#qr-miolo-logo" x="-2.39" y="-1.47" width="23.6" height="23.6"/></g>` +
    `<g clip-path="url(#qr-miolo-texto)"><use href="#qr-miolo-logo" x="-4.53" y="-4.68" width="28.19" height="28.19"/></g>` +
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
