/** Vocabulário compartilhado entre perfil, vaga e motor de match. */

export const TURNOS = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "madrugada", label: "Madrugada" },
] as const;

export const ESCALAS = [
  { value: "5x2", label: "5x2" },
  { value: "6x1", label: "6x1" },
  { value: "12x36", label: "12x36" },
  { value: "4x2", label: "4x2" },
  { value: "intermitente", label: "Intermitente / por evento" },
  { value: "flexivel", label: "Flexível" },
] as const;

export const NIVEIS_IDIOMA = [
  { value: "basico", label: "Básico" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "fluente", label: "Fluente / nativo" },
] as const;

export const TURNO_VALUES = TURNOS.map((t) => t.value);
export const ESCALA_VALUES = ESCALAS.map((e) => e.value);
export const NIVEL_IDIOMA_VALUES = NIVEIS_IDIOMA.map((n) => n.value);

export const TIPO_CONTRATO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};

/** Raio padrão de deslocamento, em km, quando o profissional não definiu. */
export const RAIO_PADRAO_KM = 40;

/** Likes por dia por profissional. Segura spam e força escolha. */
export const LIMITE_LIKES_DIA = 50;

/** Multiplicador do raio para quem marcou que está disposto a viajar. */
export const MULTIPLICADOR_DISPOSTO_VIAJAR = 3;

/** Horas/dias por mês usados para comparar salários de períodos diferentes. */
export const HORAS_MES = 220;
export const DIAS_MES = 22;

/** Converte um valor salarial para base mensal, para permitir comparação. */
export function paraSalarioMensal(
  valor: number | null | undefined,
  periodo: string | null | undefined
): number | null {
  if (valor == null || !Number.isFinite(valor) || valor <= 0) return null;
  if (periodo === "hora") return valor * HORAS_MES;
  if (periodo === "dia") return valor * DIAS_MES;
  return valor;
}
