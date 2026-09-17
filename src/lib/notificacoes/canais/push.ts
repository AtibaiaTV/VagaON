import webpush from "web-push";
import type { MensagemNotificacao, ResultadoEnvio } from "../tipos";

/**
 * Web Push (PWA). Precisa do par VAPID:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:)
 * Gere com: npx web-push generate-vapid-keys
 */

export function pushConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export interface InscricaoPush {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export type ResultadoPush = ResultadoEnvio & {
  /** 404/410: o navegador cancelou a inscrição — apagar do banco. */
  expirada?: boolean;
};

export async function enviarPush(
  inscricao: InscricaoPush,
  msg: MensagemNotificacao
): Promise<ResultadoPush> {
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  if (!publica || !privada) return { canal: "push", ok: false, detalhe: "não configurado" };

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@vagaon.app", publica, privada);

  const payload = JSON.stringify({
    titulo: msg.titulo,
    corpo: msg.corpo,
    url: msg.url,
    categoria: msg.categoria,
  });

  try {
    await webpush.sendNotification(inscricao, payload, { TTL: 60 * 60 * 24, urgency: "high" });
    return { canal: "push", ok: true };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return {
      canal: "push",
      ok: false,
      detalhe: status ? `status ${status}` : String(err),
      expirada: status === 404 || status === 410,
    };
  }
}
