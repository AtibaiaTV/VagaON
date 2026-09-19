import { connectDB } from "@/lib/db";
import { msgPerfilSemCidade, notificar } from "@/lib/notificacoes";
import { normalizarTelefoneBR } from "@/lib/notificacoes/canais/whatsapp";
import { mascararTelefone } from "./whatsapp-verificacao";
import Profissional from "@/models/Profissional";
import User from "@/models/User";

/**
 * Campanha única: chamar de volta quem se cadastrou sem cidade. Sem cidade
 * o perfil não entra em raio nem distância e quase não aparece para as
 * empresas. Uma mensagem por pessoa (Profissional.avisoSemCidadeEm), em
 * lotes pequenos, porque o número de WhatsApp é novo e a Meta mede a
 * qualidade pelas reações. O admin vê a simulação e decide o disparo.
 */

export const LOTE_PADRAO = 10;

export interface AlvoCampanha {
  profissionalId: string;
  nome: string;
  telefoneMascarado: string;
  cadastradoEm: string;
  /** Por que não recebe, quando não recebe. */
  bloqueio: "sem-telefone" | "suspenso" | "whatsapp-desligado" | "ja-avisado" | null;
}

export interface SimulacaoCampanha {
  semCidade: number;
  elegiveis: number;
  jaAvisados: number;
  alvos: AlvoCampanha[];
}

async function carregarAlvos(): Promise<AlvoCampanha[]> {
  await connectDB();
  const profs = await Profissional.find({ $or: [{ cidade: "" }, { cidade: null }, { cidade: { $exists: false } }] })
    .select("userId nomeCompleto telefone createdAt match.avisoSemCidadeEm")
    .sort({ createdAt: -1 })
    .lean();
  const users = await User.find({ _id: { $in: profs.map((p) => p.userId) } }).select("status notificacoes").lean();
  const porUser = new Map(users.map((u) => [String(u._id), u]));

  return profs.map((p) => {
    const u = porUser.get(String(p.userId));
    const tel = normalizarTelefoneBR(p.telefone);
    let bloqueio: AlvoCampanha["bloqueio"] = null;
    if (p.match?.avisoSemCidadeEm) bloqueio = "ja-avisado";
    else if (!u || u.status === "suspenso") bloqueio = "suspenso";
    else if (!tel) bloqueio = "sem-telefone";
    else if (u.notificacoes?.whatsapp === false) bloqueio = "whatsapp-desligado";
    return {
      profissionalId: String(p._id),
      nome: p.nomeCompleto,
      telefoneMascarado: tel ? mascararTelefone(tel) : "—",
      cadastradoEm: new Date(p.createdAt).toISOString(),
      bloqueio,
    };
  });
}

export async function simularCampanhaSemCidade(): Promise<SimulacaoCampanha> {
  const alvos = await carregarAlvos();
  return {
    semCidade: alvos.length,
    elegiveis: alvos.filter((a) => a.bloqueio === null).length,
    jaAvisados: alvos.filter((a) => a.bloqueio === "ja-avisado").length,
    alvos,
  };
}

export interface ResultadoLote {
  enviados: { nome: string; telefoneMascarado: string; whatsapp: "ok" | string }[];
  restantes: number;
}

/** Envia para os próximos N elegíveis (mais recentes primeiro) e marca cada um. */
export async function enviarLoteSemCidade(limite = LOTE_PADRAO): Promise<ResultadoLote> {
  const alvos = (await carregarAlvos()).filter((a) => a.bloqueio === null);
  const lote = alvos.slice(0, Math.max(1, Math.min(50, limite)));
  const enviados: ResultadoLote["enviados"] = [];
  const msg = msgPerfilSemCidade();

  for (const a of lote) {
    // Marca antes: se a função da Vercel cair no meio, ninguém recebe duas vezes.
    await Profissional.updateOne({ _id: a.profissionalId }, { $set: { "match.avisoSemCidadeEm": new Date() } });
    const r = await notificar({ tipo: "profissional", perfilId: a.profissionalId }, msg);
    const wa = r.find((x) => x.canal === "whatsapp");
    enviados.push({ nome: a.nome, telefoneMascarado: a.telefoneMascarado, whatsapp: wa ? (wa.ok ? "ok" : wa.detalhe ?? "falhou") : "canal desligado" });
  }
  return { enviados, restantes: alvos.length - lote.length };
}
