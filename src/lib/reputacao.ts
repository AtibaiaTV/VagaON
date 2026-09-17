import { MEDIA_SELO_CONFIAVEL, MINIMO_PUBLICO, labelCriterio } from "@/constants/avaliacao";

/** Módulo puro (sem Mongoose) — pode ser importado por componentes de cliente. */

export interface ReputacaoPublica {
  media: number;
  total: number;
  recomendacoes: number;
  pontosFortes: string[];
  confiavel: boolean;
}

/** O que terceiros veem. null enquanto não há avaliações suficientes. */
export function resumoReputacaoPublico(rep: unknown): ReputacaoPublica | null {
  const r = rep as
    | { media?: number | null; total?: number; recomendacoes?: number; pontosFortes?: string[] }
    | null
    | undefined;
  if (!r || !r.total || r.total < MINIMO_PUBLICO || r.media == null) return null;
  return {
    media: r.media,
    total: r.total,
    recomendacoes: r.recomendacoes ?? 0,
    pontosFortes: (r.pontosFortes ?? []).map(labelCriterio),
    confiavel: r.media >= MEDIA_SELO_CONFIAVEL,
  };
}
