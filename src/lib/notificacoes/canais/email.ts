import { Resend } from "resend";
import { urlAbsoluta, type MensagemNotificacao, type ResultadoEnvio } from "../tipos";

/**
 * E-mail via Resend. Sem RESEND_API_KEY o canal fica desligado.
 * Enquanto o domínio não estiver verificado no Resend, use o remetente de
 * testes deles (só entrega para o e-mail da conta): EMAIL_REMETENTE em branco.
 */

const REMETENTE_PADRAO = "VagaON <onboarding@resend.dev>";

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function html(msg: MensagemNotificacao, link: string, nome: string): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f4f7f5;font-family:Inter,Segoe UI,Arial,sans-serif;color:#171717">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="background:#1a5c38;padding:22px 28px">
  <p style="margin:0;color:#4ade80;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">VagaON</p>
  <h1 style="margin:6px 0 0;color:#fff;font-size:20px;line-height:1.3">${escapar(msg.titulo)}</h1>
</td></tr>
<tr><td style="padding:24px 28px">
  <p style="margin:0 0 8px;font-size:15px">Olá, ${escapar(nome)}!</p>
  <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#374151">${escapar(msg.corpo)}</p>
  <a href="${escapar(link)}" style="display:inline-block;background:#2DB87A;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:15px">Abrir no VagaON</a>
  <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">Você recebe este e-mail porque tem uma conta no VagaON. Para ajustar seus avisos, acesse seu perfil.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function enviarEmail(
  para: string,
  nome: string,
  msg: MensagemNotificacao
): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { canal: "email", ok: false, detalhe: "não configurado" };

  const link = urlAbsoluta(msg.url);
  const resend = new Resend(chave);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_REMETENTE || REMETENTE_PADRAO,
    to: para,
    subject: msg.titulo,
    html: html(msg, link, nome),
    text: `Olá, ${nome}!\n\n${msg.corpo}\n\nAbrir no VagaON: ${link}`,
  });

  if (error) return { canal: "email", ok: false, detalhe: error.message };
  return { canal: "email", ok: true };
}
