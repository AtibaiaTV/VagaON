/**
 * Ciclo de vida da vaga e visibilidade do perfil — a parte pura (sem banco).
 *
 * Vaga: rascunho → ativa ⇄ pausada → preenchida | encerrada | expirada → ativa (reabrir)
 * Só `ativa` aparece no Descobrir, no site e no Google. Os outros estados
 * mantêm funil, chats e candidaturas: nada some, só para de receber gente.
 */

export type StatusVaga = "rascunho" | "ativa" | "pausada" | "preenchida" | "encerrada" | "expirada" | "rejeitada";

export const LABEL_STATUS_VAGA: Record<StatusVaga, string> = {
  rascunho: "Rascunho",
  ativa: "Ativa",
  pausada: "Pausada",
  preenchida: "Preenchida",
  encerrada: "Encerrada",
  expirada: "Expirada",
  rejeitada: "Rejeitada",
};

/** Cor da etiqueta de status (Tailwind). Aqui, e não num componente cliente, para a página de vagas (servidor) poder ler. */
export const COR_STATUS_VAGA: Record<StatusVaga, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-amber-100 text-amber-700",
  preenchida: "bg-emerald-100 text-emerald-800",
  encerrada: "bg-gray-100 text-gray-600",
  expirada: "bg-gray-100 text-gray-600",
  rascunho: "bg-blue-100 text-blue-600",
  rejeitada: "bg-red-100 text-red-700",
};

/** Como o candidato vê uma vaga que não está mais recebendo gente. */
export const AVISO_STATUS_VAGA: Partial<Record<StatusVaga, string>> = {
  pausada: "Esta vaga está pausada pela empresa.",
  preenchida: "Esta vaga já foi preenchida.",
  encerrada: "Esta vaga foi encerrada.",
  expirada: "Esta vaga expirou.",
  rejeitada: "Esta vaga não está disponível.",
  rascunho: "Esta vaga ainda não foi publicada.",
};

export type AcaoVaga = "pausar" | "reativar" | "preencher" | "encerrar" | "renovar";

/** De quais estados cada ação parte, e para onde leva. */
export const TRANSICOES_VAGA: Record<AcaoVaga, { de: StatusVaga[]; para: StatusVaga }> = {
  pausar: { de: ["ativa"], para: "pausada" },
  reativar: { de: ["pausada", "preenchida", "encerrada", "expirada"], para: "ativa" },
  preencher: { de: ["ativa", "pausada"], para: "preenchida" },
  encerrar: { de: ["ativa", "pausada"], para: "encerrada" },
  /** Estende a validade; numa vaga expirada também reabre. */
  renovar: { de: ["ativa", "expirada"], para: "ativa" },
};

export function proximoStatus(atual: StatusVaga, acao: AcaoVaga): StatusVaga | null {
  const t = TRANSICOES_VAGA[acao];
  return t.de.includes(atual) ? t.para : null;
}

/** Ações que fazem sentido no estado atual, na ordem dos botões. */
export function acoesDisponiveis(atual: StatusVaga): AcaoVaga[] {
  return (["pausar", "reativar", "preencher", "encerrar", "renovar"] as AcaoVaga[]).filter((a) => proximoStatus(atual, a) !== null);
}

export const LABEL_ACAO_VAGA: Record<AcaoVaga, string> = {
  pausar: "Pausar",
  reativar: "Reativar",
  preencher: "Marcar como preenchida",
  encerrar: "Encerrar",
  renovar: "Renovar por 30 dias",
};

// ─── Validade ────────────────────────────────────────────────────────────────

/** Vaga CLT vale 60 dias; temporária/sazonal vale até a data de término. */
export const DIAS_VALIDADE_VAGA = 60;
export const DIAS_RENOVACAO_VAGA = 30;
export const DIAS_AVISO_EXPIRACAO = 3;
/** Vagas antigas sem validade ganham pelo menos este prazo antes de expirar. */
export const DIAS_CARENCIA_LEGADO = 7;

function fimDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function somarDias(d: Date, dias: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + dias);
  return x;
}

/** Validade natural de uma vaga a partir do tipo, do período e da data de criação. */
export function calcularExpiracao(
  vaga: { tipo: string; periodo?: { dataFim?: Date | string | null } | null; createdAt?: Date | string | null },
  agora: Date = new Date()
): Date {
  const base = vaga.createdAt ? new Date(vaga.createdAt) : agora;
  const fim = vaga.periodo?.dataFim ? new Date(vaga.periodo.dataFim) : null;
  if ((vaga.tipo === "temporario" || vaga.tipo === "sazonal") && fim && !Number.isNaN(fim.getTime())) {
    return fimDoDia(fim);
  }
  return fimDoDia(somarDias(base, DIAS_VALIDADE_VAGA));
}

/** Para vagas antigas sem `expiresAt`: nunca expira de imediato, dá carência. */
export function expiracaoLegado(
  vaga: { tipo: string; periodo?: { dataFim?: Date | string | null } | null; createdAt?: Date | string | null },
  agora: Date = new Date()
): Date {
  const natural = calcularExpiracao(vaga, agora);
  const minimo = fimDoDia(somarDias(agora, DIAS_CARENCIA_LEGADO));
  return natural > minimo ? natural : minimo;
}

/** Renovar: +30 dias a partir do que for maior, hoje ou a validade atual. */
export function renovarExpiracao(atual: Date | string | null | undefined, agora: Date = new Date()): Date {
  const a = atual ? new Date(atual) : null;
  const base = a && !Number.isNaN(a.getTime()) && a > agora ? a : agora;
  return fimDoDia(somarDias(base, DIAS_RENOVACAO_VAGA));
}

export function diasAte(data: Date | string | null | undefined, agora: Date = new Date()): number | null {
  if (!data) return null;
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - agora.getTime()) / 86_400_000);
}

// ─── Visibilidade do perfil ──────────────────────────────────────────────────

export type MotivoPausaPerfil = "manual" | "contratado" | "inatividade";

/** Sem nenhuma atividade por este tempo, o perfil recebe aviso; 7 dias depois, pausa. */
export const DIAS_INATIVIDADE = 180;
export const DIAS_APOS_AVISO_INATIVIDADE = 7;

export const TEXTO_PAUSA_PERFIL: Record<MotivoPausaPerfil, string> = {
  manual: "Você pausou seu perfil. As empresas não veem você no Descobrir nem no banco de currículos.",
  contratado: "Perfil pausado depois da contratação. Reative quando quiser voltar a receber vagas.",
  inatividade: "Pausamos seu perfil por inatividade. Reative para voltar a aparecer para as empresas.",
};
