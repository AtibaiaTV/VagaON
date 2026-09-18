/**
 * Planos para empresas — a base, desligada por padrão.
 *
 * Regra de ouro: o que o candidato fez pela empresa nunca fica atrás do
 * paywall (candidaturas às vagas dela, matches, chat, funil, vídeo de quem se
 * candidatou). O plano cobra a BUSCA ATIVA e as ferramentas: banco de
 * currículos, Descobrir ilimitado, vagas ilimitadas, triagem por IA,
 * multiusuário e selo.
 *
 * Com `PLANOS_ATIVOS` diferente de "1", toda empresa é tratada como Pro e
 * nada muda para ninguém. Ligar é uma variável de ambiente; o resto (trial,
 * assinatura manual pelo admin, página de planos) já fica pronto.
 */

export type PlanoId = "gratis" | "pro";

export interface LimitesPlano {
  /** null = ilimitado. */
  vagasAtivas: number | null;
  /** Decisões no deck da empresa por dia. null = ilimitado. */
  swipesDia: number | null;
  bancoCurriculos: boolean;
  triagemIA: boolean;
  multiusuario: boolean;
  selo: boolean;
}

export type RecursoPlano = "bancoCurriculos" | "triagemIA" | "multiusuario" | "selo";

export interface DefinicaoPlano {
  id: PlanoId;
  nome: string;
  descricao: string;
  /** Reais por mês; null no grátis. */
  precoMensal: number | null;
  /** Passe de 30 dias para buffet, hotel e evento (demanda sazonal). */
  precoTemporada: number | null;
  limites: LimitesPlano;
}

export const PLANOS: Record<PlanoId, DefinicaoPlano> = {
  gratis: {
    id: "gratis",
    nome: "Grátis",
    descricao: "Para publicar uma vaga e receber candidatos.",
    precoMensal: null,
    precoTemporada: null,
    limites: { vagasAtivas: 1, swipesDia: 10, bancoCurriculos: false, triagemIA: false, multiusuario: false, selo: false },
  },
  pro: {
    id: "pro",
    nome: "Pro",
    descricao: "Para quem contrata sempre: busca ativa e ferramentas de seleção.",
    precoMensal: 149,
    precoTemporada: 199,
    limites: { vagasAtivas: null, swipesDia: null, bancoCurriculos: true, triagemIA: true, multiusuario: true, selo: true },
  },
};

/** O que cada plano inclui, na ordem em que aparece na página de planos. */
export const RECURSOS_PLANO: { chave: string; rotulo: string; gratis: string; pro: string }[] = [
  { chave: "vagas", rotulo: "Vagas ativas", gratis: "1", pro: "Ilimitadas" },
  { chave: "candidaturas", rotulo: "Ver quem se candidatou às suas vagas", gratis: "Sempre", pro: "Sempre" },
  { chave: "funil", rotulo: "Funil de candidatos, chat e entrevista", gratis: "Sim", pro: "Sim" },
  { chave: "descobrir", rotulo: "Descobrir (deck de candidatos)", gratis: "10 por dia", pro: "Ilimitado" },
  { chave: "banco", rotulo: "Banco de currículos com filtros", gratis: "—", pro: "Sim" },
  { chave: "triagem", rotulo: "Resumo das respostas de triagem por IA", gratis: "—", pro: "Sim" },
  { chave: "multi", rotulo: "Vários usuários na mesma empresa", gratis: "—", pro: "Em breve" },
  { chave: "selo", rotulo: "Selo de empresa verificada", gratis: "—", pro: "Em breve" },
];

export type StatusAssinatura = "nenhuma" | "trial" | "ativa" | "inadimplente" | "cancelada";

export interface Assinatura {
  plano: PlanoId;
  status: StatusAssinatura;
  /** Fim do período pago. */
  ativoAte: Date | null;
  /** Fim do período de teste gratuito. */
  trialAte: Date | null;
  /** "manual" (admin) ou o provedor de pagamento, quando integrado. */
  provedor: string | null;
  referenciaExterna: string | null;
  /** Empresa clicou em "Quero o Pro" na página de planos. */
  interesseEm: Date | null;
  atualizadoEm: Date | null;
}

export const ASSINATURA_VAZIA: Assinatura = {
  plano: "gratis",
  status: "nenhuma",
  ativoAte: null,
  trialAte: null,
  provedor: null,
  referenciaExterna: null,
  interesseEm: null,
  atualizadoEm: null,
};

/** Interruptor geral. Lido no servidor; o cliente recebe por prop. */
export function planosAtivos(): boolean {
  return process.env.PLANOS_ATIVOS === "1";
}

export type MotivoPlano = "desligado" | "assinatura" | "trial" | "gratis";

export interface PlanoResolvido {
  plano: PlanoId;
  motivo: MotivoPlano;
  /** Quando o acesso Pro acaba (assinatura ou trial); null se não se aplica. */
  ate: Date | null;
  limites: LimitesPlano;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

function data(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Qual plano vale para a empresa agora. Pura: recebe a assinatura (documento
 * ou objeto simples), a data e o interruptor — testável sem banco.
 */
export function resolverPlano(assinatura: Doc | null | undefined, agora: Date = new Date(), ativos: boolean = planosAtivos()): PlanoResolvido {
  if (!ativos) return { plano: "pro", motivo: "desligado", ate: null, limites: PLANOS.pro.limites };

  const ativoAte = data(assinatura?.ativoAte);
  const trialAte = data(assinatura?.trialAte);
  const statusPago = assinatura?.status === "ativa" || assinatura?.status === "inadimplente";

  if (assinatura?.plano === "pro" && statusPago && ativoAte && ativoAte > agora) {
    return { plano: "pro", motivo: "assinatura", ate: ativoAte, limites: PLANOS.pro.limites };
  }
  if (trialAte && trialAte > agora) {
    return { plano: "pro", motivo: "trial", ate: trialAte, limites: PLANOS.pro.limites };
  }
  return { plano: "gratis", motivo: "gratis", ate: null, limites: PLANOS.gratis.limites };
}

export function excedeuLimite(limite: number | null, uso: number): boolean {
  return limite !== null && uso >= limite;
}

/** Mensagens que a pessoa vê quando esbarra no limite. */
export const MENSAGENS_LIMITE = {
  vagasAtivas: (limite: number) =>
    `O plano Grátis permite ${limite} vaga ativa por vez. Encerre uma vaga ou assine o Pro para publicar quantas quiser.`,
  swipesDia: (limite: number) =>
    `Você usou as ${limite} avaliações de hoje do plano Grátis. Assine o Pro para continuar descobrindo candidatos.`,
  bancoCurriculos: "O banco de currículos faz parte do plano Pro. Quem se candidatou às suas vagas continua visível no funil.",
  triagemIA: "O resumo das respostas por IA faz parte do plano Pro. As respostas completas continuam no funil.",
  multiusuario: "Vários usuários por empresa fazem parte do plano Pro.",
  selo: "O selo de verificação faz parte do plano Pro.",
} as const;

export function formatarPreco(v: number | null): string {
  return v === null ? "R$ 0" : `R$ ${v.toLocaleString("pt-BR")}`;
}

/** Datas de fim para o admin conceder Pro ou trial com um clique. */
export function diasAFrente(dias: number, base: Date = new Date()): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  d.setHours(23, 59, 59, 999);
  return d;
}
