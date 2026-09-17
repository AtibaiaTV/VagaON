/**
 * Perguntas de triagem: até 3 perguntas curtas que a empresa faz a quem se
 * candidata. Puro (sem banco) — usado no cliente e nas rotas.
 */

export const MAX_PERGUNTAS = 3;
export const MAX_PERGUNTA_CHARS = 200;
export const MAX_RESPOSTA_CHARS = 600;

export interface TriagemRespondida {
  perguntas: string[];
  respostas: string[];
  respondidaEm: Date;
  ia: null;
}

export function sanitizarPerguntas(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const saida: string[] = [];
  for (const p of v) {
    const t = typeof p === "string" ? p.replace(/\s+/g, " ").trim().slice(0, MAX_PERGUNTA_CHARS) : "";
    if (t) saida.push(t);
    if (saida.length >= MAX_PERGUNTAS) break;
  }
  return saida;
}

/** Alinha as respostas às perguntas (mesmo tamanho; vazio = não respondeu). */
export function sanitizarRespostas(v: unknown, total: number): string[] {
  const lista = Array.isArray(v) ? v : [];
  return Array.from({ length: total }, (_, i) => {
    const r = lista[i];
    return typeof r === "string" ? r.trim().slice(0, MAX_RESPOSTA_CHARS) : "";
  });
}

/**
 * Snapshot da triagem para gravar na candidatura. null quando a vaga não
 * pergunta nada ou quando nada foi respondido.
 */
export function montarTriagem(
  vaga: { perguntasTriagem?: string[] | null },
  respostas: unknown
): TriagemRespondida | null {
  const perguntas = sanitizarPerguntas(vaga.perguntasTriagem);
  if (!perguntas.length) return null;
  const r = sanitizarRespostas(respostas, perguntas.length);
  if (!r.some(Boolean)) return null;
  return { perguntas, respostas: r, respondidaEm: new Date(), ia: null };
}
