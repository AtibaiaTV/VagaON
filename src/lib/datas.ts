const FUSO = "America/Sao_Paulo";

/** "sábado, 20 de setembro às 14:30" — para textos de notificação (servidor). */
export function formatarDataHoraBR(d: Date | string): string {
  const data = d instanceof Date ? d : new Date(d);
  const parte = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(data);
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(data);
  return `${parte} às ${hora}`;
}

/** Formato básico UTC do iCalendar / Google Agenda: 20260920T173000Z */
export function paraFormatoICS(d: Date | string): string {
  const data = d instanceof Date ? d : new Date(d);
  return data.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escapa texto para campos iCalendar (RFC 5545). */
export function escaparICS(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
