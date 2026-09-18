import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import { enviarCodigoWhatsApp, normalizarTelefoneBR, whatsappConfigurado } from "@/lib/notificacoes/canais/whatsapp";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import { filtroEmpresaDoUsuario } from "./equipe";
import { ErroAtor } from "./erros";

/**
 * Confirmação do WhatsApp por código de 6 dígitos.
 *
 * Por que existe: telefone digitado errado é silencioso — o aviso de match
 * "sai" e ninguém recebe. Confirmar uma vez garante que o número é da pessoa
 * e que ela recebe mensagens do VagaON. Não bloqueia nada: perfil sem
 * confirmação continua funcionando; o código só sobe a qualidade do dado.
 *
 * Limites: 1 envio por minuto, 5 por dia, 5 tentativas por código, validade
 * de 10 minutos. O código nunca é guardado em claro.
 */

export const VALIDADE_CODIGO_MIN = 10;
export const INTERVALO_ENVIO_S = 60;
export const MAX_ENVIOS_DIA = 5;
export const MAX_TENTATIVAS = 5;

export interface EstadoVerificacao {
  /** Canal ligado no ambiente (sem token, não há o que confirmar). */
  disponivel: boolean;
  telefone: string | null;
  /** Telefone mascarado para a tela: (11) •••••-1234. */
  telefoneMascarado: string | null;
  verificado: boolean;
  /** O número confirmado é o mesmo do perfil hoje. */
  numeroConfere: boolean;
  enviadoEm: string | null;
  podeEnviarEm: string | null;
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function hash(codigo: string): string {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${codigo}`).digest("hex");
}

export function mascararTelefone(numero: string): string {
  const d = numero.replace(/\D/g, "");
  const local = d.startsWith("55") ? d.slice(2) : d;
  const ddd = local.slice(0, 2);
  const fim = local.slice(-4);
  return `(${ddd}) •••••-${fim}`;
}

/** Telefone do perfil (profissional ou empresa) do usuário, já normalizado. */
async function telefoneDoUsuario(userId: string, role: string): Promise<{ telefone: string | null; nome: string }> {
  if (role === "profissional") {
    const p = await Profissional.findOne({ userId }).select("telefone nomeCompleto").lean();
    return { telefone: normalizarTelefoneBR(p?.telefone), nome: p?.nomeCompleto ?? "" };
  }
  if (role === "empresa") {
    const e = await Empresa.findOne(filtroEmpresaDoUsuario(userId)).select("telefone nomeFantasia").lean();
    return { telefone: normalizarTelefoneBR(e?.telefone), nome: e?.nomeFantasia ?? "" };
  }
  return { telefone: null, nome: "" };
}

export async function estadoVerificacao(userId: string, role: string): Promise<EstadoVerificacao> {
  await connectDB();
  const [user, { telefone }] = await Promise.all([
    User.findById(userId).select("whatsapp").lean(),
    telefoneDoUsuario(userId, role),
  ]);
  const w = user?.whatsapp;
  const enviadoEm = w?.enviadoEm ? new Date(w.enviadoEm) : null;
  const podeEnviarEm = enviadoEm ? new Date(enviadoEm.getTime() + INTERVALO_ENVIO_S * 1000) : null;
  return {
    disponivel: whatsappConfigurado(),
    telefone,
    telefoneMascarado: telefone ? mascararTelefone(telefone) : null,
    verificado: Boolean(w?.verificadoEm),
    numeroConfere: Boolean(w?.numeroVerificado && telefone && w.numeroVerificado === telefone),
    enviadoEm: enviadoEm?.toISOString() ?? null,
    podeEnviarEm: podeEnviarEm && podeEnviarEm > new Date() ? podeEnviarEm.toISOString() : null,
  };
}

/**
 * Gera e envia um código novo. Silencioso quando o canal está desligado ou
 * o perfil não tem telefone (quem chama decide se avisa a pessoa).
 */
export async function enviarCodigoVerificacao(
  userId: string,
  role: string,
  opcoes: { silencioso?: boolean } = {}
): Promise<{ enviado: boolean; motivo?: string }> {
  await connectDB();
  if (!whatsappConfigurado()) return { enviado: false, motivo: "WhatsApp não está ligado neste ambiente." };

  const [user, { telefone, nome }] = await Promise.all([
    User.findById(userId).select("name whatsapp"),
    telefoneDoUsuario(userId, role),
  ]);
  if (!user) throw new ErroAtor(404, "Usuário não encontrado.");
  if (!telefone) return { enviado: false, motivo: "Seu perfil não tem um telefone válido. Informe o WhatsApp com DDD no perfil." };

  const agora = new Date();
  const w = user.whatsapp ?? ({} as typeof user.whatsapp);
  if (w.enviadoEm && agora.getTime() - new Date(w.enviadoEm).getTime() < INTERVALO_ENVIO_S * 1000) {
    if (opcoes.silencioso) return { enviado: false, motivo: "aguarde" };
    throw new ErroAtor(429, "Espere um minuto antes de pedir outro código.");
  }
  const dia = hoje();
  const envios = w.enviosDia === dia ? w.envios ?? 0 : 0;
  if (envios >= MAX_ENVIOS_DIA) {
    if (opcoes.silencioso) return { enviado: false, motivo: "limite" };
    throw new ErroAtor(429, "Limite de códigos por hoje. Tente amanhã ou confira o número no perfil.");
  }

  const codigo = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const r = await enviarCodigoWhatsApp(telefone, nome || user.name, codigo, String(user._id));
  if (!r.ok) {
    if (opcoes.silencioso) return { enviado: false, motivo: r.detalhe };
    throw new ErroAtor(502, `Não consegui enviar pelo WhatsApp: ${r.detalhe ?? "erro"}. Confira o número no perfil.`);
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        "whatsapp.codigoHash": hash(codigo),
        "whatsapp.codigoExpiraEm": new Date(agora.getTime() + VALIDADE_CODIGO_MIN * 60_000),
        "whatsapp.tentativas": 0,
        "whatsapp.enviadoEm": agora,
        "whatsapp.envios": envios + 1,
        "whatsapp.enviosDia": dia,
      },
    }
  );
  return { enviado: true };
}

export async function confirmarCodigoVerificacao(userId: string, role: string, codigo: string): Promise<void> {
  await connectDB();
  const limpo = (codigo ?? "").replace(/\D/g, "");
  if (limpo.length !== 6) throw new ErroAtor(400, "O código tem 6 dígitos.");

  const [user, { telefone }] = await Promise.all([
    User.findById(userId).select("whatsapp"),
    telefoneDoUsuario(userId, role),
  ]);
  if (!user) throw new ErroAtor(404, "Usuário não encontrado.");
  const w = user.whatsapp;
  if (!w?.codigoHash || !w.codigoExpiraEm) throw new ErroAtor(400, "Peça um código primeiro.");
  if (new Date(w.codigoExpiraEm) < new Date()) throw new ErroAtor(400, "Este código venceu. Peça outro.");
  if ((w.tentativas ?? 0) >= MAX_TENTATIVAS) throw new ErroAtor(429, "Muitas tentativas. Peça um código novo.");

  const esperado = Buffer.from(w.codigoHash, "hex");
  const recebido = Buffer.from(hash(limpo), "hex");
  const confere = esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
  if (!confere) {
    await User.updateOne({ _id: user._id }, { $inc: { "whatsapp.tentativas": 1 } });
    throw new ErroAtor(400, "Código incorreto.");
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        "whatsapp.numeroVerificado": telefone,
        "whatsapp.verificadoEm": new Date(),
        "whatsapp.codigoHash": null,
        "whatsapp.codigoExpiraEm": null,
        "whatsapp.tentativas": 0,
      },
    }
  );
}
