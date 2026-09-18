import MensagemWhatsApp from "@/models/MensagemWhatsApp";
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
 *
 * Cada envio é gravado em MensagemWhatsApp com o id que a Meta devolve; o
 * webhook (/api/webhooks/whatsapp) atualiza o status depois.
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

/**
 * Dois telefones BR são o mesmo número mesmo que um tenha o nono dígito e o
 * outro não (a Meta ainda devolve wa_id sem o 9 para linhas antigas).
 */
export function mesmoTelefoneBR(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const semNove = (n: string) => (n.length === 13 && n[4] === "9" ? n.slice(0, 4) + n.slice(5) : n);
  return semNove(a) === semNove(b);
}

/** Parâmetros de template não aceitam quebras de linha nem 4+ espaços seguidos. */
function parametro(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, 1000);
}

interface RespostaMeta {
  messages?: { id: string }[];
}

async function chamarApi(corpo: Record<string, unknown>): Promise<{ ok: true; waId: string | null } | { ok: false; detalhe: string }> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, detalhe: "não configurado" };
  const versao = process.env.WHATSAPP_API_VERSION || VERSAO_PADRAO;

  const res = await fetch(`https://graph.facebook.com/${versao}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...corpo }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    return { ok: false, detalhe: `${res.status} ${detalhe.slice(0, 300)}` };
  }
  const json = (await res.json().catch(() => ({}))) as RespostaMeta;
  return { ok: true, waId: json.messages?.[0]?.id ?? null };
}

async function registrar(
  numero: string,
  tipo: string,
  texto: string,
  resultado: Awaited<ReturnType<typeof chamarApi>>,
  userId?: string | null
): Promise<void> {
  try {
    await MensagemWhatsApp.create({
      direcao: "saida",
      waId: resultado.ok ? resultado.waId : null,
      telefone: numero,
      userId: userId ?? null,
      tipo,
      texto,
      status: resultado.ok ? "enviada" : "falhou",
      erro: resultado.ok ? null : resultado.detalhe,
    });
  } catch (e) {
    console.warn("[whatsapp] não gravou o registro do envio:", e);
  }
}

/** Aviso por template (pode ser enviado a qualquer hora). */
export async function enviarWhatsApp(
  telefone: string,
  nome: string,
  msg: MensagemNotificacao,
  userId?: string | null
): Promise<ResultadoEnvio> {
  if (!whatsappConfigurado()) return { canal: "whatsapp", ok: false, detalhe: "não configurado" };

  const numero = normalizarTelefoneBR(telefone);
  if (!numero) return { canal: "whatsapp", ok: false, detalhe: "telefone inválido" };

  const template = process.env.WHATSAPP_TEMPLATE || TEMPLATE_PADRAO;
  const texto = `${msg.titulo}. ${msg.corpo}`;

  const resultado = await chamarApi({
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
            { type: "text", text: parametro(texto) },
            { type: "text", text: urlAbsoluta(msg.url) },
          ],
        },
      ],
    },
  });

  await registrar(numero, "template", texto, resultado, userId);
  return resultado.ok ? { canal: "whatsapp", ok: true } : { canal: "whatsapp", ok: false, detalhe: resultado.detalhe };
}

/**
 * Texto livre. Só chega se o usuário falou com o número nas últimas 24 h
 * (janela de atendimento da Meta); fora dela a API recusa. Usado pelo
 * webhook para responder a quem escreveu.
 */
export async function enviarTextoWhatsApp(
  numero: string,
  texto: string,
  opcoes: { tipo?: string; userId?: string | null } = {}
): Promise<ResultadoEnvio> {
  if (!whatsappConfigurado()) return { canal: "whatsapp", ok: false, detalhe: "não configurado" };
  const resultado = await chamarApi({
    to: numero,
    type: "text",
    text: { preview_url: false, body: texto.slice(0, 4096) },
  });
  await registrar(numero, opcoes.tipo ?? "texto", texto, resultado, opcoes.userId);
  return resultado.ok ? { canal: "whatsapp", ok: true } : { canal: "whatsapp", ok: false, detalhe: resultado.detalhe };
}
