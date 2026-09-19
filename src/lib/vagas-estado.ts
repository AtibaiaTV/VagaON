/**
 * Ciclo de vida da vaga e visibilidade do perfil — a parte pura (sem banco).
 *
 * Vaga: rascunho → ativa ⇄ pausada → preenchida | encerrada → ativa (reabrir)
 * Só `ativa` aparece no Descobrir, no site e no Google. Os outros estados
 * mantêm funil, chats e candidaturas: nada some, só para de receber gente.
 *
 * A vaga NÃO expira sozinha: fica no ar até a empresa pausar, encerrar,
 * marcar como preenchida ou excluir. `expirada` só existe por legado (o cron
 * expirava por prazo até 18/09/2026) e continua reativável.
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

export type AcaoVaga = "pausar" | "reativar" | "preencher" | "encerrar";

/** De quais estados cada ação parte, e para onde leva. */
export const TRANSICOES_VAGA: Record<AcaoVaga, { de: StatusVaga[]; para: StatusVaga }> = {
  pausar: { de: ["ativa"], para: "pausada" },
  reativar: { de: ["pausada", "preenchida", "encerrada", "expirada"], para: "ativa" },
  preencher: { de: ["ativa", "pausada"], para: "preenchida" },
  encerrar: { de: ["ativa", "pausada"], para: "encerrada" },
};

export function proximoStatus(atual: StatusVaga, acao: AcaoVaga): StatusVaga | null {
  const t = TRANSICOES_VAGA[acao];
  return t.de.includes(atual) ? t.para : null;
}

/** Ações que fazem sentido no estado atual, na ordem dos botões. */
export function acoesDisponiveis(atual: StatusVaga): AcaoVaga[] {
  return (["pausar", "reativar", "preencher", "encerrar"] as AcaoVaga[]).filter((a) => proximoStatus(atual, a) !== null);
}

export const LABEL_ACAO_VAGA: Record<AcaoVaga, string> = {
  pausar: "Pausar",
  reativar: "Reativar",
  preencher: "Marcar como preenchida",
  encerrar: "Encerrar",
};

// ─── Datas ───────────────────────────────────────────────────────────────────

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
