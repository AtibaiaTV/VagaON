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
