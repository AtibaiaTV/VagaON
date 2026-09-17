import { ESPECIALIDADES } from "@/constants/especialidades";
import { CATEGORIAS_ADJACENTES, PROXIMIDADE } from "./pesos";

/**
 * Proximidade entre cargos derivada da taxonomia existente de especialidades.
 *
 * É o que impede o match de tratar "Sous Chef" e "Camareira" como igualmente
 * distantes de "Chef de Cozinha" — sem precisar de embeddings ou treino.
 */

const INDICE = new Map(ESPECIALIDADES.map((e) => [e.value, e]));

export function labelDe(value: string): string {
  return INDICE.get(value)?.label ?? value;
}

/** 0 a 1. Quanto o cargo `a` aproveita a experiência de quem atua em `b`. */
export function proximidadeEspecialidade(a: string, b: string): number {
  if (!a || !b) return PROXIMIDADE.semRelacao;
  if (a === b) return PROXIMIDADE.identica;

  const ea = INDICE.get(a);
  const eb = INDICE.get(b);
  if (!ea || !eb) return PROXIMIDADE.semRelacao;

  if (ea.subcategoria && eb.subcategoria && ea.subcategoria === eb.subcategoria) {
    return PROXIMIDADE.mesmaSubcategoria;
  }
  if (ea.categoria === eb.categoria) {
    return PROXIMIDADE.mesmaCategoria;
  }
  if (CATEGORIAS_ADJACENTES[ea.categoria]?.includes(eb.categoria)) {
    return PROXIMIDADE.categoriaAdjacente;
  }
  return PROXIMIDADE.semRelacao;
}

/**
 * Todas as especialidades com alguma relação (> 0) com as informadas.
 * Usada como pré-filtro no Mongo: corta o grosso antes de pontuar em memória.
 */
export function especialidadesRelacionadas(base: string[]): string[] {
  const saida = new Set<string>();
  for (const b of base ?? []) {
    if (!b) continue;
    for (const e of ESPECIALIDADES) {
      if (proximidadeEspecialidade(b, e.value) > 0) saida.add(e.value);
    }
  }
  return Array.from(saida);
}

export interface MelhorAderencia {
  nota: number;
  /** Especialidade do profissional que gerou a melhor nota. */
  especialidadeProfissional: string | null;
  /** Especialidade da vaga correspondente. */
  especialidadeVaga: string | null;
}

/**
 * Melhor par entre as especialidades do profissional e as aceitas pela vaga.
 * Usa o máximo (e não a média): ter outras especialidades não deve diluir a
 * aderência de quem é exatamente o cargo procurado.
 */
export function melhorAderencia(
  especialidadesProfissional: string[],
  especialidadesVaga: string[]
): MelhorAderencia {
  let melhor: MelhorAderencia = {
    nota: PROXIMIDADE.semRelacao,
    especialidadeProfissional: null,
    especialidadeVaga: null,
  };

  for (const ep of especialidadesProfissional ?? []) {
    for (const ev of especialidadesVaga ?? []) {
      const nota = proximidadeEspecialidade(ep, ev);
      if (nota > melhor.nota) {
        melhor = { nota, especialidadeProfissional: ep, especialidadeVaga: ev };
      }
      if (melhor.nota === PROXIMIDADE.identica) return melhor;
    }
  }

  return melhor;
}

/** Frase para o card explicando de onde veio a aderência de cargo. */
export function explicarAderencia(m: MelhorAderencia): string | null {
  if (!m.especialidadeProfissional || !m.especialidadeVaga) return null;

  if (m.nota === PROXIMIDADE.identica) {
    return `Cargo exato: ${labelDe(m.especialidadeVaga)}`;
  }
  if (m.nota === PROXIMIDADE.mesmaSubcategoria) {
    return `Experiência próxima: ${labelDe(m.especialidadeProfissional)} → ${labelDe(m.especialidadeVaga)}`;
  }
  if (m.nota === PROXIMIDADE.mesmaCategoria) {
    return `Mesma área: ${labelDe(m.especialidadeProfissional)}`;
  }
  if (m.nota === PROXIMIDADE.categoriaAdjacente) {
    return `Área correlata: ${labelDe(m.especialidadeProfissional)}`;
  }
  return null;
}

/** Normaliza texto livre de habilidade para comparação tolerante. */
export function normalizarHabilidade(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Proporção das habilidades desejadas que o profissional possui.
 * Não é Jaccard: ter habilidades extras não pode reduzir a nota.
 */
export function coberturaHabilidades(
  possuidas: string[],
  desejadas: string[]
): { nota: number; atendidas: string[] } {
  if (!desejadas?.length) return { nota: 1, atendidas: [] };

  const tenho = Array.from(
    new Set((possuidas ?? []).map(normalizarHabilidade).filter(Boolean))
  );
  const atendidas: string[] = [];

  for (const d of desejadas) {
    const alvo = normalizarHabilidade(d);
    if (!alvo) continue;
    // Correspondência exata ou por conter o termo (ex.: "confeitaria fina" ⊃ "confeitaria").
    const bate = tenho.some((t) => t === alvo || t.includes(alvo) || alvo.includes(t));
    if (bate) atendidas.push(d);
  }

  return { nota: atendidas.length / desejadas.length, atendidas };
}
