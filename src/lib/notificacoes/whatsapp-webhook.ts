import { createHmac, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import MensagemWhatsApp from "@/models/MensagemWhatsApp";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import { enviarTextoWhatsApp, mesmoTelefoneBR, normalizarTelefoneBR } from "./canais/whatsapp";
import { urlAbsoluta } from "./tipos";

/**
 * Webhook da Cloud API da Meta (WhatsApp). Recebe duas coisas:
 *
 * 1. STATUS dos avisos que enviamos (sent → delivered → read, ou failed)
 *    e grava em MensagemWhatsApp, casando pelo id da mensagem.
 * 2. MENSAGENS que o usuário manda para o número do VagaON. O número só
 *    envia avisos, então a resposta é curta: PARAR desliga o canal,
 *    VOLTAR religa, qualquer outra coisa recebe uma orientação (no máximo
 *    uma por dia por telefone, para não virar eco).
 *
 * Env: WHATSAPP_VERIFY_TOKEN (handshake do GET) e WHATSAPP_APP_SECRET
 * (assinatura X-Hub-Signature-256 do POST).
 */

export const PALAVRAS_PARAR = ["parar", "pare", "sair", "cancelar", "stop", "descadastrar"];
export const PALAVRAS_VOLTAR = ["voltar", "ativar", "start", "continuar"];

// ─── Assinatura ────────────────────────────────────────────────────────────

export function assinaturaValida(corpoBruto: string, cabecalho: string | null): boolean {
  const segredo = process.env.WHATSAPP_APP_SECRET;
  if (!segredo || !cabecalho) return false;
  const [algo, hexRecebido] = cabecalho.split("=");
  if (algo !== "sha256" || !hexRecebido) return false;
  const esperado = createHmac("sha256", segredo).update(corpoBruto, "utf8").digest("hex");
  if (esperado.length !== hexRecebido.length) return false;
  return timingSafeEqual(Buffer.from(esperado, "hex"), Buffer.from(hexRecebido, "hex"));
}

// ─── Formato que a Meta envia ──────────────────────────────────────────────

interface StatusMeta {
  id: string;
  status: "sent" | "delivered" | "read" | "failed" | string;
  recipient_id?: string;
  errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
}

interface MensagemMeta {
  id: string;
  from: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
}

interface ValorMeta {
  messaging_product?: string;
  /** Número que recebeu/enviou. Um app assinado numa WABA recebe eventos de todos os números dela. */
  metadata?: { phone_number_id?: string; display_phone_number?: string };
  statuses?: StatusMeta[];
  messages?: MensagemMeta[];
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
}

export interface CorpoWebhookMeta {
  object?: string;
  entry?: { changes?: { field?: string; value?: ValorMeta }[] }[];
}

export interface ResumoProcessamento {
  status: number;
  mensagens: number;
  ignorados: number;
}

const STATUS_MAP: Record<string, "enviada" | "entregue" | "lida" | "falhou"> = {
  sent: "enviada",
  delivered: "entregue",
  read: "lida",
  failed: "falhou",
};

// Nunca regride: um "delivered" atrasado não apaga um "read".
const ORDEM = { enviada: 1, entregue: 2, lida: 3, falhou: 4, recebida: 0 } as const;

// ─── Identificação do usuário pelo telefone ────────────────────────────────

/**
 * Procura o dono do telefone entre profissionais e empresas. Os telefones
 * são gravados como o usuário digitou, então a busca é por regex dos
 * dígitos locais (tolerante a máscara) e a confirmação por comparação
 * normalizada, aceitando com e sem o nono dígito.
 */
export async function acharUsuarioPorTelefone(numeroMeta: string): Promise<{ userId: string; nome: string } | null> {
  const local = numeroMeta.startsWith("55") ? numeroMeta.slice(2) : numeroMeta;
  // Últimos 8 dígitos existem com ou sem o 9; DDD confere depois.
  const sufixo = local.slice(-8);
  if (sufixo.length < 8) return null;
  const regex = new RegExp(sufixo.split("").join("\\D*") + "\\D*$");

  const [profissionais, empresas] = await Promise.all([
    Profissional.find({ telefone: regex }).select("userId nomeCompleto telefone").limit(20).lean(),
    Empresa.find({ telefone: regex }).select("userId nomeFantasia telefone").limit(20).lean(),
  ]);

  for (const p of profissionais) {
    if (mesmoTelefoneBR(normalizarTelefoneBR(p.telefone), numeroMeta)) {
      return { userId: String(p.userId), nome: p.nomeCompleto };
    }
  }
  for (const e of empresas) {
    if (mesmoTelefoneBR(normalizarTelefoneBR(e.telefone), numeroMeta)) {
      return { userId: String(e.userId), nome: e.nomeFantasia };
    }
  }
  return null;
}

// ─── Processamento ─────────────────────────────────────────────────────────

function textoDaMensagem(m: MensagemMeta): string {
  return (
    m.text?.body ??
    m.button?.text ??
    m.interactive?.button_reply?.title ??
    m.interactive?.list_reply?.title ??
    ""
  ).trim();
}

function classificar(texto: string): "parar" | "voltar" | "outro" {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .trim();
  if (PALAVRAS_PARAR.includes(t)) return "parar";
  if (PALAVRAS_VOLTAR.includes(t)) return "voltar";
  return "outro";
}

async function processarStatus(s: StatusMeta): Promise<void> {
  const novo = STATUS_MAP[s.status];
  if (!novo || !s.id) return;
  const erro = s.errors?.[0];
  const detalheErro = erro
    ? [erro.code, erro.title, erro.error_data?.details ?? erro.message].filter(Boolean).join(" · ").slice(0, 500)
    : null;

  const atual = await MensagemWhatsApp.findOne({ waId: s.id }).select("status").lean();
  if (!atual) {
    // Envio que não passou por aqui (ex.: teste manual no painel da Meta). Registra mesmo assim.
    await MensagemWhatsApp.create({
      direcao: "saida",
      waId: s.id,
      telefone: s.recipient_id ?? "desconhecido",
      tipo: "externo",
      texto: "",
      status: novo,
      erro: detalheErro,
    }).catch(() => {});
    return;
  }
  if (ORDEM[novo] < ORDEM[atual.status]) return;
  await MensagemWhatsApp.updateOne({ waId: s.id }, { $set: { status: novo, erro: detalheErro } });
}

async function jaRespondeuHoje(telefone: string): Promise<boolean> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const n = await MensagemWhatsApp.countDocuments({
    telefone,
    direcao: "saida",
    tipo: "auto",
    createdAt: { $gte: desde },
  });
  return n > 0;
}

async function processarMensagem(m: MensagemMeta, nomeContato?: string): Promise<void> {
  const telefone = (m.from ?? "").replace(/\D/g, "");
  if (!telefone || !m.id) return;

  // Dedupe: a Meta reenvia se não recebeu 200 a tempo.
  const repetida = await MensagemWhatsApp.exists({ waId: m.id });
  if (repetida) return;

  const texto = textoDaMensagem(m);
  const dono = await acharUsuarioPorTelefone(telefone);

  await MensagemWhatsApp.create({
    direcao: "entrada",
    waId: m.id,
    telefone,
    userId: dono?.userId ?? null,
    tipo: m.type || "text",
    texto: texto || `[${m.type}]`,
    status: "recebida",
  }).catch(() => {});

  const intencao = classificar(texto);
  const primeiroNome = (dono?.nome ?? nomeContato ?? "").split(" ")[0];
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}! ` : "Olá! ";

  if (intencao === "parar") {
    if (dono) await User.updateOne({ _id: dono.userId }, { $set: { "notificacoes.whatsapp": false } });
    await enviarTextoWhatsApp(
      telefone,
      `${saudacao}Pronto, você não vai mais receber avisos do VagaON por WhatsApp. ` +
        `Seus avisos continuam no site. Para voltar a receber, responda VOLTAR.`,
      { tipo: "auto", userId: dono?.userId }
    );
    return;
  }

  if (intencao === "voltar") {
    if (dono) await User.updateOne({ _id: dono.userId }, { $set: { "notificacoes.whatsapp": true } });
    await enviarTextoWhatsApp(
      telefone,
      dono
        ? `${saudacao}Avisos por WhatsApp religados. Você vai receber novos matches, mensagens e candidaturas por aqui.`
        : `${saudacao}Não achei uma conta do VagaON com este número. Cadastre-se ou atualize seu telefone em ${urlAbsoluta("/perfil")}.`,
      { tipo: "auto", userId: dono?.userId }
    );
    return;
  }

  if (await jaRespondeuHoje(telefone)) return;

  const orientacao = dono
    ? `${saudacao}Este número só envia avisos do VagaON e não é acompanhado por uma pessoa. ` +
      `Para conversar com a empresa ou o candidato, entre em ${urlAbsoluta("/matches")}. ` +
      `Responda PARAR se não quiser mais receber avisos por aqui.`
    : `${saudacao}Este é o número de avisos do VagaON, a plataforma de vagas da gastronomia, hospedagem e turismo. ` +
      `Não achei uma conta com este telefone. Crie a sua em ${urlAbsoluta("/")}.`;

  await enviarTextoWhatsApp(telefone, orientacao, { tipo: "auto", userId: dono?.userId });
}

/**
 * Percorre o payload e trata cada status e mensagem. Nunca lança: qualquer
 * erro interno é registrado e o webhook responde 200 mesmo assim, senão a
 * Meta reenvia o mesmo evento por horas.
 */
export async function processarWebhookWhatsApp(corpo: CorpoWebhookMeta): Promise<ResumoProcessamento> {
  const resumo: ResumoProcessamento = { status: 0, mensagens: 0, ignorados: 0 };
  if (corpo?.object !== "whatsapp_business_account") {
    resumo.ignorados++;
    return resumo;
  }

  await connectDB();

  for (const entrada of corpo.entry ?? []) {
    for (const mudanca of entrada.changes ?? []) {
      if (mudanca.field !== "messages" || !mudanca.value) {
        resumo.ignorados++;
        continue;
      }
      const v = mudanca.value;
      // Evento de outro número da mesma WABA (ex.: o da RedeSA): não é nosso.
      // Sem isso, um PARAR mandado ao número da RedeSA desligaria avisos aqui.
      const meuNumero = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (meuNumero && v.metadata?.phone_number_id && v.metadata.phone_number_id !== meuNumero) {
        resumo.ignorados++;
        continue;
      }
      for (const s of v.statuses ?? []) {
        try {
          await processarStatus(s);
          resumo.status++;
        } catch (e) {
          console.warn("[whatsapp-webhook] status falhou:", e);
        }
      }
      for (const m of v.messages ?? []) {
        try {
          const contato = v.contacts?.find((c) => c.wa_id === m.from);
          await processarMensagem(m, contato?.profile?.name);
          resumo.mensagens++;
        } catch (e) {
          console.warn("[whatsapp-webhook] mensagem falhou:", e);
        }
      }
    }
  }
  return resumo;
}
