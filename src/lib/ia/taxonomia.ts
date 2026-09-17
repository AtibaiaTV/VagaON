import { CATEGORIAS, ESPECIALIDADES } from "@/constants/especialidades";
import { ESTADOS } from "@/constants/estados";
import { AFIRMATIVAS, ESCALAS, NIVEIS_IDIOMA, TURNOS } from "@/constants/match";

/**
 * Vocabulário do VagaON em texto, para os prompts. É estável — entra no
 * `system` com cache, então custa quase nada nas chamadas seguintes.
 */

export function textoTaxonomiaEspecialidades(): string {
  const linhas: string[] = [];
  for (const cat of CATEGORIAS) {
    linhas.push(`\n## ${cat.label}`);
    for (const e of ESPECIALIDADES.filter((x) => x.categoria === cat.value)) {
      linhas.push(`- ${e.value}: ${e.label}`);
    }
  }
  return linhas.join("\n");
}

export function textoVocabulario(): string {
  return [
    `UFs válidas: ${ESTADOS.map((e) => e.value).join(", ")}.`,
    `Tipos de contrato: clt (carteira assinada), temporario (bico/diária), sazonal (temporada/evento).`,
    `Turnos: ${TURNOS.map((t) => `${t.value} (${t.label})`).join(", ")}.`,
    `Escalas: ${ESCALAS.map((e) => `${e.value} (${e.label})`).join(", ")}.`,
    `Níveis de idioma: ${NIVEIS_IDIOMA.map((n) => n.value).join(", ")}.`,
    `Grupos de vaga afirmativa: ${AFIRMATIVAS.map((a) => `${a.value} (${a.label})`).join(", ")}.`,
  ].join("\n");
}

const VALORES_ESPECIALIDADE = new Set(ESPECIALIDADES.map((e) => e.value));
const VALORES_UF = new Set(ESTADOS.map((e) => e.value));

/** Mantém só chaves existentes na taxonomia (o modelo pode inventar uma). */
export function filtrarEspecialidades(valores: string[] | null | undefined, max = 8): string[] {
  const vistos = new Set<string>();
  for (const v of valores ?? []) {
    const chave = String(v).trim().toLowerCase();
    if (VALORES_ESPECIALIDADE.has(chave)) vistos.add(chave);
    if (vistos.size >= max) break;
  }
  return Array.from(vistos);
}

export function normalizarUF(v: string | null | undefined): string | null {
  const uf = (v ?? "").trim().toUpperCase();
  return VALORES_UF.has(uf) ? uf : null;
}

export function dataHojeBR(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export function isoHoje(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
