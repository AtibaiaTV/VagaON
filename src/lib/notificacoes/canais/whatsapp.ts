import { urlAbsoluta, type MensagemNotificacao, type ResultadoEnvio } from "../tipos";

/**
 * WhatsApp via API oficial da Meta (Cloud API).
 *
 * Mensagem iniciada pela empresa fora da janela de 24 h precisa ser um
 * TEMPLATE aprovado. Usamos um único template utilitário para simplificar
 * a aprovação — cadastre no Gerenciador do WhatsApp (categoria "Utilidade",
 * idioma pt_BR) com este corpo:
 *
 *   Olá, {{1}}! {{2}}
 *   Acesse: {{3}}
 *
 * Env: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
 *      WHATSAPP_TEMPLATE (padrão "vagaon_aviso"), WHATSAPP_API_VERSION (v21.0).
 */

const VERSAO_PADRAO = "v21.0";
const TEMPLATE_PADRAO = "vagaon_aviso";

export function whatsappConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Telefone brasileiro em E.164 sem "+": 55 + DDD + número. */
export function normalizarTelefoneBR(telefone: string | null | undefined): string | null {
  const digitos = (telefone ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) return digitos;
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  return null;
}

/** Parâmetros de template não aceitam quebras de linha nem 4+ espaços seguidos. */
function parametro(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, 1000);
}

export async function enviarWhatsApp(
  telefone: string,
  nome: string,
  msg: MensagemNotificacao
): Promise<ResultadoEnvio> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { canal: "whatsapp", ok: false, detalhe: "não configurado" };

  const numero = normalizarTelefoneBR(telefone);
  if (!numero) return { canal: "whatsapp", ok: false, detalhe: "telefone inválido" };

  const versao = process.env.WHATSAPP_API_VERSION || VERSAO_PADRAO;
  const template = process.env.WHATSAPP_TEMPLATE || TEMPLATE_PADRAO;

  const corpo = {
    messaging_product: "whatsapp",
    to: numero,
    type: "template",
    template: {
      name: template,
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: parametro(nome.split(" ")[0] || nome) },
            { type: "text", text: parametro(`${msg.titulo}. ${msg.corpo}`) },
            { type: "text", text: urlAbsoluta(msg.url) },
          ],
        },
      ],
    },
  };

  const res = await fetch(`https://graph.facebook.com/${versao}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    return { canal: "whatsapp", ok: false, detalhe: `${res.status} ${detalhe.slice(0, 300)}` };
  }
  return { canal: "whatsapp", ok: true };
}
