import { labelEspecialidade } from "@/constants/especialidades";
import { NIVEIS_IDIOMA, TIPO_CONTRATO_LABEL } from "@/constants/match";

/**
 * Currículo para impressão: três modelos visuais sobre os mesmos dados do
 * perfil. Este módulo é puro (roda no servidor e no cliente) — quem sabe de
 * banco é a página.
 */

export const MODELOS_CURRICULO = [
  {
    value: "executivo",
    label: "Moderno Executivo",
    descricao: "Duas colunas, lateral escura e foto redonda. Sóbrio e marcante.",
  },
  {
    value: "minimalista",
    label: "Minimalista Contemporâneo",
    descricao: "Cabeçalho suave, foto quadrada e uma coluna corrida. Leve e fácil de ler.",
  },
  {
    value: "criativo",
    label: "Criativo",
    descricao: "Barra azul, seções numeradas e foto no canto. Identidade visual moderna.",
  },
] as const;

export type ModeloCurriculo = (typeof MODELOS_CURRICULO)[number]["value"];
export const MODELO_PADRAO: ModeloCurriculo = "executivo";
export const MODELO_VALUES: ModeloCurriculo[] = MODELOS_CURRICULO.map((m) => m.value);

export function ehModeloCurriculo(v: unknown): v is ModeloCurriculo {
  return typeof v === "string" && (MODELO_VALUES as string[]).includes(v);
}

// ─── Cor de detalhe ──────────────────────────────────────────────────────────
// Cada modelo tem uma cor de destaque; a pessoa escolhe na paleta ou digita
// qualquer hex. O padrão de cada modelo reproduz o mockup original.

export const CORES_DETALHE = [
  { value: "#1abc9c", label: "Verde-água" },
  { value: "#0066cc", label: "Azul" },
  { value: "#57606f", label: "Ardósia" },
  { value: "#2db87a", label: "Verde VagaON" },
  { value: "#8e2a3b", label: "Vinho" },
  { value: "#d35400", label: "Terracota" },
  { value: "#6c3fb5", label: "Roxo" },
  { value: "#b8860b", label: "Dourado" },
] as const;

export const COR_PADRAO: Record<ModeloCurriculo, string> = {
  executivo: "#1abc9c",
  minimalista: "#57606f",
  criativo: "#0066cc",
};

/** Cor escolhida por modelo (hex). Ausente = padrão do modelo. */
export type CoresCurriculo = Partial<Record<ModeloCurriculo, string>>;

export function corValida(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
}

export function corDoModelo(modelo: ModeloCurriculo, cores?: CoresCurriculo | null): string {
  const c = cores?.[modelo];
  return corValida(c) ? c.toLowerCase() : COR_PADRAO[modelo];
}

/** Map do Mongoose ou objeto simples → CoresCurriculo só com valores válidos. */
export function normalizarCores(bruto: unknown): CoresCurriculo {
  const entradas: [string, unknown][] =
    bruto instanceof Map ? Array.from(bruto.entries()) : bruto && typeof bruto === "object" ? Object.entries(bruto) : [];
  const saida: CoresCurriculo = {};
  for (const [k, v] of entradas) {
    if (ehModeloCurriculo(k) && corValida(v)) saida[k] = v.toLowerCase();
  }
  return saida;
}

function hexParaRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbParaHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mistura `a` com `b`; `pesoB` = 0 devolve `a`, 1 devolve `b`. */
export function misturar(a: string, b: string, pesoB: number): string {
  const [r1, g1, b1] = hexParaRgb(a);
  const [r2, g2, b2] = hexParaRgb(b);
  const p = Math.max(0, Math.min(1, pesoB));
  return rgbParaHex(r1 + (r2 - r1) * p, g1 + (g2 - g1) * p, b1 + (b2 - b1) * p);
}

/** Luminância relativa (WCAG), 0 = preto, 1 = branco. */
export function luminancia(hex: string): number {
  const [r, g, b] = hexParaRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Escurece cores claras demais para servirem de texto sobre fundo branco. */
export function paraTexto(hex: string): string {
  let c = hex.toLowerCase();
  for (let i = 0; i < 12 && luminancia(c) > 0.45; i++) c = misturar(c, "#000000", 0.15);
  return c;
}

export interface CoresExecutivo {
  destaque: string;
  lateral: string;
  fotoFundo: string;
}
export function coresExecutivo(cor: string): CoresExecutivo {
  const c = cor.toLowerCase();
  if (c === COR_PADRAO.executivo) return { destaque: c, lateral: "#2c3e50", fotoFundo: "#34495e" };
  const lateral = misturar(c, "#111827", 0.72);
  return { destaque: paraTexto(c), lateral, fotoFundo: misturar(lateral, "#ffffff", 0.12) };
}

export interface CoresMinimalista {
  destaque: string;
  faixa: string;
  fotoFundo: string;
  linha: string;
}
export function coresMinimalista(cor: string): CoresMinimalista {
  const c = cor.toLowerCase();
  if (c === COR_PADRAO.minimalista) return { destaque: c, faixa: "#eaeff2", fotoFundo: "#ced6e0", linha: "#ced6e0" };
  return {
    destaque: paraTexto(c),
    faixa: misturar(c, "#ffffff", 0.9),
    fotoFundo: misturar(c, "#ffffff", 0.75),
    linha: misturar(c, "#ffffff", 0.75),
  };
}

export interface CoresCriativo {
  destaque: string;
  linha: string;
}
export function coresCriativo(cor: string): CoresCriativo {
  const c = cor.toLowerCase();
  if (c === COR_PADRAO.criativo) return { destaque: c, linha: "#e1e8ed" };
  return { destaque: paraTexto(c), linha: misturar(c, "#ffffff", 0.85) };
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Date/ISO → "mar/2021". Vazio quando não há data válida. */
export function formatarMesAno(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return "";
  return `${MESES[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}

export interface ExperienciaCV {
  cargo: string;
  empresa: string;
  local: string;
  periodo: string;
  descricao: string;
}

export interface FormacaoCV {
  curso: string;
  instituicao: string;
  ano: string;
}

export interface DadosCurriculo {
  nome: string;
  iniciais: string;
  /** Cargo alvo: a especialidade principal (e a segunda, se houver). */
  titulo: string;
  foto: string | null;
  telefone: string;
  email: string;
  local: string;
  /** Sem protocolo, para caber na lateral. */
  linkedin: string | null;
  resumo: string;
  especialidades: string[];
  habilidades: string[];
  /** "Inglês — Avançado". */
  idiomas: string[];
  /** "CLT · Temporário — disponível imediatamente". */
  disponibilidade: string | null;
  experiencias: ExperienciaCV[];
  formacao: FormacaoCV[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function montarDadosCurriculo(p: Doc, email: string | null): DadosCurriculo {
  const nome = texto(p.nomeCompleto) || "Seu nome";
  const especialidades: string[] = (Array.isArray(p.especialidades) ? p.especialidades : []).map((e: string) => labelEspecialidade(e));

  const experiencias: ExperienciaCV[] = (Array.isArray(p.experiencias) ? (p.experiencias as Doc[]) : [])
    .filter((e) => texto(e.cargo) || texto(e.empresa))
    .slice()
    .sort((a, b) => new Date(b.dataInicio ?? 0).getTime() - new Date(a.dataInicio ?? 0).getTime())
    .map((e) => ({
      cargo: texto(e.cargo),
      empresa: texto(e.empresa),
      local: [texto(e.cidade), texto(e.estado)].filter(Boolean).join(", "),
      periodo: `${formatarMesAno(e.dataInicio) || "—"} – ${e.dataFim ? formatarMesAno(e.dataFim) : "atual"}`,
      descricao: texto(e.descricao),
    }));

  const formacao: FormacaoCV[] = (Array.isArray(p.formacao) ? (p.formacao as Doc[]) : [])
    .filter((f) => texto(f.curso))
    .map((f) => ({ curso: texto(f.curso), instituicao: texto(f.instituicao), ano: texto(String(f.ano ?? "")) }));

  const idiomas: string[] = (Array.isArray(p.idiomas) ? (p.idiomas as Doc[]) : [])
    .filter((i) => texto(i.idioma))
    .map((i) => {
      const nivel = NIVEIS_IDIOMA.find((n) => n.value === i.nivel)?.label;
      return nivel ? `${texto(i.idioma)} — ${nivel}` : texto(i.idioma);
    });

  const disp: Doc = p.disponibilidade ?? {};
  const tipos: string[] = (Array.isArray(disp.tipo) ? disp.tipo : []).map((t: string) => TIPO_CONTRATO_LABEL[t] ?? t);
  let disponibilidade: string | null = null;
  if (tipos.length) {
    const quando =
      disp.imediata !== false
        ? "disponível imediatamente"
        : disp.dataDisponivel
          ? `a partir de ${formatarMesAno(disp.dataDisponivel)}`
          : "";
    disponibilidade = [tipos.join(" · "), quando].filter(Boolean).join(" — ");
  }

  const linkedinBruto = texto(p.linkedinUrl);

  return {
    nome,
    iniciais: iniciaisDe(nome),
    titulo: especialidades.slice(0, 2).join(" · "),
    foto: texto(p.fotoPerfil) || null,
    telefone: texto(p.telefone),
    email: texto(email),
    local: [texto(p.cidade), texto(p.estado)].filter(Boolean).join(", "),
    linkedin: linkedinBruto ? linkedinBruto.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : null,
    resumo: texto(p.resumoProfissional),
    especialidades,
    habilidades: (Array.isArray(p.habilidades) ? p.habilidades : []).map(texto).filter(Boolean),
    idiomas,
    disponibilidade,
    experiencias,
    formacao,
  };
}
