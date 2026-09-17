/**
 * Fonte única de verdade dos pesos do match.
 *
 * Mexer aqui muda o ranking inteiro — use /admin/match-lab para ver o efeito
 * sobre dados reais antes de subir. Os pesos somam 100 por convenção, mas o
 * motor normaliza de qualquer forma (dimensões não avaliáveis são redistribuídas).
 */

import type { DimensaoId } from "./tipos";

export const PESOS: Record<DimensaoId, number> = {
  especialidade: 30,
  localizacao: 20,
  experiencia: 15,
  disponibilidade: 12,
  salario: 10,
  habilidades: 8,
  turnoEscala: 5,
};

/** Proximidade entre especialidades, derivada da taxonomia de categorias. */
export const PROXIMIDADE = {
  identica: 1.0,
  mesmaSubcategoria: 0.7,
  mesmaCategoria: 0.45,
  categoriaAdjacente: 0.3,
  semRelacao: 0,
} as const;

/**
 * Categorias que compartilham perfil de profissional na prática do setor.
 * Ex.: quem trabalha no bar frequentemente transita para o salão.
 */
export const CATEGORIAS_ADJACENTES: Record<string, string[]> = {
  cozinha: ["bar", "salao", "eventos_catering", "compras_estoque"],
  bar: ["cozinha", "salao", "eventos_catering"],
  salao: ["bar", "cozinha", "caixa_financeiro", "eventos_catering", "hospedagem"],
  caixa_financeiro: ["salao", "gestao_admin"],
  compras_estoque: ["cozinha", "gestao_admin"],
  limpeza_manutencao: ["governanca"],
  seguranca: ["hospedagem"],
  gestao_admin: ["caixa_financeiro", "compras_estoque"],
  eventos_catering: ["cozinha", "bar", "salao", "decoracao", "audiovisual"],
  hospedagem: ["salao", "governanca", "lazer_hospede", "seguranca"],
  governanca: ["hospedagem", "limpeza_manutencao"],
  lazer_hospede: ["hospedagem", "entretenimento"],
};

/**
 * O cargo define o teto do score: teto = base + escala × notaEspecialidade.
 *   exato 1.0 → 100 · subcategoria 0.7 → 85 · categoria 0.45 → 72 · adjacente 0.3 → 65
 * Sem isso, uma vaga de garçom perfeita em tudo mais aparecia como "Match forte"
 * para um sous chef — as outras seis dimensões somadas engoliam o cargo errado.
 */
export const TETO_ESPECIALIDADE = { base: 0.5, escala: 0.5 } as const;

/**
 * Fator de confiança aplicado só à `prioridade` (ordenação): quanto menos
 * dimensões a vaga permitiu avaliar, menos ela sobe no feed — sem alterar o
 * score exibido, que continua sendo aderência sobre o que dá para medir.
 */
export const CONFIANCA = { minimo: 0.9 } as const;

/**
 * Ajuste fino aplicado ao score final. Mantido deliberadamente estreito:
 * o match deve ser decidido pela aderência à vaga, não por quem preencheu
 * mais campos do perfil.
 */
export const MULTIPLICADOR = {
  min: 0.95,
  max: 1.05,
  /** Contribuição máxima da completude do perfil. */
  completude: 0.03,
  /** Bônus por empresa verificada (visto pelo profissional). */
  empresaVerificada: 0.02,
  /** Contribuição máxima da atividade recente do profissional. */
  atividadeRecente: 0.02,
  /** Dias sem atividade a partir dos quais o bônus zera. */
  diasAtividade: 30,
} as const;

/**
 * Score mínimo para um card entrar no feed. Abaixo disso o par é ruído —
 * mostrar gera swipe negativo e polui as métricas.
 */
export const SCORE_MINIMO_FEED = 35;

/** Faixas usadas nos rótulos da interface. */
export const FAIXAS = [
  { min: 85, label: "Match excelente", cor: "esmeralda" },
  { min: 70, label: "Match forte", cor: "verde" },
  { min: 55, label: "Bom match", cor: "lima" },
  { min: 0, label: "Match parcial", cor: "cinza" },
] as const;

export function faixaDoScore(score: number) {
  return FAIXAS.find((f) => score >= f.min) ?? FAIXAS[FAIXAS.length - 1];
}
