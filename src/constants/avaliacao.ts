/**
 * Avaliação mútua pós-contratação.
 *
 * Regras que protegem os dois lados (e a plataforma) juridicamente:
 *  - só quem contratou PELA PLATAFORMA avalia, uma vez por vínculo;
 *  - critérios estruturados e profissionais; comentário livre é privado ao avaliado;
 *  - publicação duplo-cega: sai quando os dois avaliam ou após 14 dias;
 *  - nota agregada só aparece com 3+ avaliações;
 *  - o avaliado vê tudo, responde e contesta (LGPD, art. 20).
 */

export interface Criterio {
  chave: string;
  label: string;
  /** Uma linha explicando o que está sendo avaliado — evita subjetividade. */
  descricao: string;
}

/** Empresa → profissional. Tudo observável no trabalho; nada de aparência ou personalidade. */
export const CRITERIOS_PROFISSIONAL: Criterio[] = [
  { chave: "pontualidade", label: "Pontualidade", descricao: "Chegou nos horários combinados." },
  { chave: "assiduidade", label: "Assiduidade", descricao: "Compareceu aos turnos; avisou com antecedência quando não pôde." },
  { chave: "apresentacao_higiene", label: "Apresentação e higiene", descricao: "Uniforme e higiene conforme as boas práticas do setor (BPF)." },
  { chave: "comunicacao", label: "Comunicação", descricao: "Clareza com a equipe e com clientes." },
  { chave: "equipe", label: "Trabalho em equipe", descricao: "Colaborou e ajudou nos picos." },
  { chave: "responsabilidade", label: "Responsabilidade", descricao: "Cumpriu o que assumiu; cuidou de material e processos." },
  { chave: "iniciativa", label: "Iniciativa", descricao: "Resolveu problemas sem precisar ser mandado." },
];

/** Profissional → empresa. */
export const CRITERIOS_EMPRESA: Criterio[] = [
  { chave: "pagamento", label: "Pagamento em dia", descricao: "Pagou o combinado, na data combinada." },
  { chave: "respeito", label: "Respeito", descricao: "Tratamento digno pela liderança e pela equipe." },
  { chave: "organizacao", label: "Organização", descricao: "Escalas, funções e combinados claros." },
  { chave: "condicoes", label: "Condições de trabalho", descricao: "Estrutura, equipamentos, pausas e segurança." },
  { chave: "comunicacao", label: "Comunicação", descricao: "Instruções e feedback claros." },
];

export function criteriosPara(autorTipo: "empresa" | "profissional"): Criterio[] {
  return autorTipo === "empresa" ? CRITERIOS_PROFISSIONAL : CRITERIOS_EMPRESA;
}

export function labelCriterio(chave: string): string {
  return [...CRITERIOS_PROFISSIONAL, ...CRITERIOS_EMPRESA].find((c) => c.chave === chave)?.label ?? chave;
}

export const NOTA_MIN = 1;
export const NOTA_MAX = 5;

/** Avaliações necessárias para a média aparecer publicamente. */
export const MINIMO_PUBLICO = 3;

/** Sem a outra parte avaliar, a avaliação é publicada depois deste prazo. */
export const JANELA_DUPLO_CEGO_DIAS = 14;

/** Dias após a contratação a partir dos quais dá para avaliar. */
export const PRAZO_AVALIACAO_DIAS: Record<string, number> = {
  clt: 30,
  temporario: 3,
  sazonal: 3,
};

/** Nota mínima em um critério para ele contar como "ponto forte". */
export const NOTA_PONTO_FORTE = 4.5;

/** Tamanho máximo do comentário privado e da resposta. */
export const MAX_TEXTO = 400;

/** Selo "Confiável": média mínima com o mínimo de avaliações. */
export const MEDIA_SELO_CONFIAVEL = 4.5;
