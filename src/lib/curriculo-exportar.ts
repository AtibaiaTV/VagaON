import {
  coresCriativo,
  coresExecutivo,
  coresMinimalista,
  type DadosCurriculo,
  type ModeloCurriculo,
} from "./curriculo";

/**
 * Exportação do currículo no navegador — nada passa pelo servidor.
 *
 * - PNG/JPEG/PDF: fotografia fiel da página renderizada (html-to-image +
 *   jsPDF). O PDF é fatiado em folhas A4; currículo de uma página = 1 folha.
 * - Word: documento de texto editável montado a partir dos dados (docx),
 *   com as cores do modelo escolhido — não é uma imagem colada.
 *
 * As bibliotecas são carregadas sob demanda (import dinâmico) no primeiro
 * clique, então a página não fica mais pesada para quem só imprime.
 */

export type FormatoExportacao = "pdf" | "docx" | "png" | "jpeg";

export const FORMATOS_EXPORTACAO: { value: FormatoExportacao; label: string; descricao: string; ext: string }[] = [
  { value: "pdf", label: "PDF", descricao: "Para enviar por e-mail ou WhatsApp", ext: "pdf" },
  { value: "docx", label: "Word (.docx)", descricao: "Para editar no Word ou no Google Docs", ext: "docx" },
  { value: "png", label: "Imagem PNG", descricao: "Qualidade máxima", ext: "png" },
  { value: "jpeg", label: "Imagem JPEG", descricao: "Arquivo menor", ext: "jpg" },
];

const LARGURA_A4_MM = 210;
const ALTURA_A4_MM = 297;
/** 2× = ~150 dpi na folha A4: nítido na tela e na impressão. */
const ESCALA_CAPTURA = 2;

function slug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function nomeArquivo(nome: string, modelo: ModeloCurriculo, ext: string): string {
  return `curriculo-${slug(nome) || "vagaon"}-${modelo}.${ext}`;
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function capturar(no: HTMLElement): Promise<HTMLCanvasElement> {
  const { toCanvas } = await import("html-to-image");
  // skipFonts: o currículo usa Arial (fonte do sistema); não precisa embutir as webfonts do site.
  return toCanvas(no, { pixelRatio: ESCALA_CAPTURA, backgroundColor: "#ffffff", skipFonts: true, cacheBust: true });
}

export async function exportarImagem(no: HTMLElement, formato: "png" | "jpeg"): Promise<Blob> {
  const canvas = await capturar(no);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar a imagem."))),
      formato === "png" ? "image/png" : "image/jpeg",
      0.92
    );
  });
}

export async function exportarPdf(no: HTMLElement): Promise<Blob> {
  const [{ jsPDF }, canvas] = await Promise.all([import("jspdf"), capturar(no)]);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });

  const larguraPx = canvas.width;
  const alturaFolhaPx = Math.round((larguraPx * ALTURA_A4_MM) / LARGURA_A4_MM);

  let y = 0;
  let primeira = true;
  while (y < canvas.height) {
    const h = Math.min(alturaFolhaPx, canvas.height - y);
    const fatia = document.createElement("canvas");
    fatia.width = larguraPx;
    fatia.height = h;
    const ctx = fatia.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, larguraPx, h);
    ctx.drawImage(canvas, 0, y, larguraPx, h, 0, 0, larguraPx, h);

    if (!primeira) pdf.addPage();
    pdf.addImage(fatia.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, LARGURA_A4_MM, (h * LARGURA_A4_MM) / larguraPx);
    primeira = false;
    y += alturaFolhaPx;
  }
  return pdf.output("blob");
}

export async function exportarWord(d: DadosCurriculo, modelo: ModeloCurriculo, cor: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle } = await import("docx");

  const hex = (c: string) => c.replace("#", "").toUpperCase();

  // Esquema de cores por modelo: mesma lógica das páginas.
  let destaque: string;
  let cabecalhoFundo: string | null;
  let cabecalhoTexto: string;
  if (modelo === "executivo") {
    const c = coresExecutivo(cor);
    destaque = c.destaque;
    cabecalhoFundo = c.lateral;
    cabecalhoTexto = "#ffffff";
  } else if (modelo === "minimalista") {
    const c = coresMinimalista(cor);
    destaque = c.destaque;
    cabecalhoFundo = c.faixa;
    cabecalhoTexto = "#2f3542";
  } else {
    const c = coresCriativo(cor);
    destaque = c.destaque;
    cabecalhoFundo = null;
    cabecalhoTexto = "#111111";
  }
  const corTextoCabecalhoSecundario = modelo === "executivo" ? "#dfe6e9" : "#57606f";

  const run = (text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
    new TextRun({ text, font: "Arial", size: opts.size ?? 20, bold: opts.bold, color: hex(opts.color ?? "#333333") });

  const tituloSecao = (texto: string) =>
    new Paragraph({
      spacing: { before: 320, after: 100 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: hex(destaque), space: 2 } },
      children: [run(texto, { bold: true, size: 24, color: destaque })],
    });
  const paragrafo = (texto: string, opts: { bold?: boolean; size?: number; color?: string; depois?: number } = {}) =>
    new Paragraph({ spacing: { after: opts.depois ?? 60 }, children: [run(texto, opts)] });
  const marcador = (texto: string) =>
    new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [run(texto)] });

  const semBorda = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const contato = [d.telefone, d.email, d.local, d.linkedin].filter(Boolean).join("  |  ");

  const cabecalho = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: semBorda, bottom: semBorda, left: semBorda, right: semBorda, insideHorizontal: semBorda, insideVertical: semBorda },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: cabecalhoFundo ? { type: ShadingType.CLEAR, fill: hex(cabecalhoFundo), color: "auto" } : undefined,
            borders: modelo === "criativo" ? { left: { style: BorderStyle.SINGLE, size: 48, color: hex(destaque) } } : undefined,
            margins: { top: 260, bottom: 260, left: 280, right: 280 },
            children: [
              new Paragraph({ children: [run(d.nome.toUpperCase(), { bold: true, size: 40, color: cabecalhoTexto })] }),
              ...(d.titulo ? [new Paragraph({ spacing: { before: 60 }, children: [run(d.titulo, { bold: true, size: 26, color: destaque })] })] : []),
              ...(contato ? [new Paragraph({ spacing: { before: 120 }, children: [run(contato, { size: 18, color: corTextoCabecalhoSecundario })] })] : []),
            ],
          }),
        ],
      }),
    ],
  });

  const corpo: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [cabecalho];

  if (d.resumo) {
    corpo.push(tituloSecao("PERFIL PROFISSIONAL"));
    d.resumo.split(/\n+/).filter(Boolean).forEach((l) => corpo.push(paragrafo(l)));
  }

  if (d.experiencias.length) {
    corpo.push(tituloSecao("EXPERIÊNCIA PROFISSIONAL"));
    for (const e of d.experiencias) {
      corpo.push(paragrafo([e.empresa, e.cargo].filter(Boolean).join(" | "), { bold: true, size: 22, color: "#111111", depois: 20 }));
      corpo.push(paragrafo([e.periodo, e.local].filter(Boolean).join(" · "), { size: 18, color: destaque, depois: 60 }));
      e.descricao
        .split(/\n+/)
        .map((l) => l.trim().replace(/^[•\-–*]\s*/, ""))
        .filter(Boolean)
        .forEach((l) => corpo.push(marcador(l)));
      corpo.push(paragrafo("", { depois: 80 }));
    }
  }

  if (d.formacao.length) {
    corpo.push(tituloSecao("FORMAÇÃO"));
    for (const f of d.formacao) {
      corpo.push(paragrafo(f.curso, { bold: true, size: 22, color: "#111111", depois: 20 }));
      const linha = [f.instituicao, f.ano].filter(Boolean).join(" | ");
      if (linha) corpo.push(paragrafo(linha, { size: 18, color: "#57606f", depois: 100 }));
    }
  }

  if (d.habilidades.length) {
    corpo.push(tituloSecao("COMPETÊNCIAS"));
    corpo.push(paragrafo(d.habilidades.join(", ")));
  }
  if (d.idiomas.length) {
    corpo.push(tituloSecao("IDIOMAS"));
    corpo.push(paragrafo(d.idiomas.join(" · ")));
  }
  if (d.disponibilidade) {
    corpo.push(tituloSecao("DISPONIBILIDADE"));
    corpo.push(paragrafo(d.disponibilidade));
  }

  const doc = new Document({
    creator: "VagaON",
    title: `Currículo — ${d.nome}`,
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 em twips
            margin: { top: 900, bottom: 900, left: 1000, right: 1000 },
          },
        },
        children: corpo,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Gera o arquivo no formato pedido. `no` é o elemento `.cv-pagina` renderizado. */
export async function exportarCurriculo(
  formato: FormatoExportacao,
  no: HTMLElement,
  dados: DadosCurriculo,
  modelo: ModeloCurriculo,
  cor: string
): Promise<Blob> {
  switch (formato) {
    case "pdf":
      return exportarPdf(no);
    case "docx":
      return exportarWord(dados, modelo, cor);
    case "png":
    case "jpeg":
      return exportarImagem(no, formato);
  }
}
