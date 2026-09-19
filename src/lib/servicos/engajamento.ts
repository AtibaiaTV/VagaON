import { connectDB } from "@/lib/db";
import {
  msgMatchParado,
  msgResumoSemanalEmpresa,
  msgResumoSemanalProfissional,
  notificar,
} from "@/lib/notificacoes";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Match from "@/models/Match";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";
import { feedParaProfissional } from "./feed";

/**
 * Puxa as pessoas de volta para o app nos dois momentos em que a liquidez
 * mais vaza: o match que ninguém abre e a semana em que ninguém entrou.
 * Tudo roda no cron diário de manutenção; cada passo é idempotente.
 */

/** Match "novo" sem mensagem humana há mais que isso recebe o alerta (uma vez). */
export const HORAS_MATCH_PARADO = 48;
/** Dia do resumo semanal, no horário de Brasília (1 = segunda). */
export const DIA_RESUMO_SEMANAL = 1;
/** Quantas vagas entram no resumo do profissional. */
const VAGAS_NO_RESUMO = 4;
const FUSO_BRT_MS = -3 * 3_600_000;

export function ehDiaDoResumo(agora: Date): boolean {
  return new Date(agora.getTime() + FUSO_BRT_MS).getUTCDay() === DIA_RESUMO_SEMANAL;
}

// ─── Match parado ──────────────────────────────────────────────────────────

export interface ResultadoMatchesParados {
  alertados: number;
}

/**
 * Match ainda "novo" (ninguém mandou mensagem) há mais de 48 h: avisa os
 * dois lados, uma vez só. Mensagem do sistema (proposta de entrevista etc.)
 * não conta como conversa — mas nesse caso o status já não é "novo".
 */
export async function alertarMatchesParados(agora: Date = new Date()): Promise<ResultadoMatchesParados> {
  await connectDB();
  const limite = new Date(agora.getTime() - HORAS_MATCH_PARADO * 3_600_000);
  const parados = await Match.find({
    status: "novo",
    alertaParadoEm: null,
    createdAt: { $lte: limite },
    $or: [{ ultimaMensagem: null }, { "ultimaMensagem.autorTipo": "sistema" }],
  })
    .select("profissionalId empresaId snapshot createdAt")
    .limit(200)
    .lean();

  let alertados = 0;
  for (const m of parados) {
    const horas = Math.max(HORAS_MATCH_PARADO, Math.floor((agora.getTime() - new Date(m.createdAt).getTime()) / 3_600_000));
    const base = { vagaTitulo: m.snapshot?.vagaTitulo || "a vaga", matchId: String(m._id), horas };
    await notificar(
      { tipo: "profissional", perfilId: m.profissionalId },
      msgMatchParado({ ...base, lado: "profissional", outroNome: m.snapshot?.empresaNome || "a empresa" })
    );
    await notificar(
      { tipo: "empresa", perfilId: m.empresaId },
      msgMatchParado({ ...base, lado: "empresa", outroNome: m.snapshot?.profissionalNome || "o candidato" })
    );
    await Match.updateOne({ _id: m._id }, { $set: { alertaParadoEm: agora } });
    alertados++;
  }
  return { alertados };
}

// ─── Resumo semanal ────────────────────────────────────────────────────────

export interface ResultadoResumoSemanal {
  dia: boolean;
  profissionais: number;
  empresas: number;
}

/**
 * Segunda-feira (BRT): profissional recebe as vagas novas que combinam com
 * ele; empresa recebe candidaturas, matches e matches parados. Quem não tem
 * nada de novo não recebe nada. Reexecutar no mesmo dia não duplica.
 */
export async function enviarResumoSemanal(agora: Date = new Date()): Promise<ResultadoResumoSemanal> {
  const r: ResultadoResumoSemanal = { dia: ehDiaDoResumo(agora), profissionais: 0, empresas: 0 };
  if (!r.dia) return r;

  await connectDB();
  const semanaAtras = new Date(agora.getTime() - 7 * 86_400_000);
  const ontem = new Date(agora.getTime() - 86_400_000);

  // Profissionais ativos que ainda não receberam o resumo desta semana.
  const profissionais = await Profissional.find({
    "match.ativo": { $ne: false },
    $or: [{ "match.resumoSemanalEm": null }, { "match.resumoSemanalEm": { $lt: ontem } }],
  }).limit(500);

  for (const p of profissionais) {
    try {
      const desde = p.match?.resumoSemanalEm ? new Date(Math.max(new Date(p.match.resumoSemanalEm).getTime(), semanaAtras.getTime())) : semanaAtras;
      const { cards, restantes } = await feedParaProfissional(p, VAGAS_NO_RESUMO, { criadasDesde: desde });
      if (cards.length) {
        await notificar(
          { tipo: "profissional", perfilId: p._id },
          msgResumoSemanalProfissional({
            vagas: cards.map((c) => ({
              titulo: c.vaga.titulo,
              empresa: c.vaga.empresa.nome,
              cidade: c.vaga.remoto ? "remoto" : c.vaga.cidade,
              score: c.score.total,
            })),
            restantes,
          })
        );
        r.profissionais++;
      }
      await Profissional.updateOne({ _id: p._id }, { $set: { "match.resumoSemanalEm": agora } });
    } catch (err) {
      console.warn("[resumo-semanal] profissional", String(p._id), err);
    }
  }

  // Empresas com vaga ativa.
  const empresasComVaga = await Vaga.distinct("empresaId", { status: "ativa" });
  const empresas = await Empresa.find({
    _id: { $in: empresasComVaga },
    $or: [{ "match.resumoSemanalEm": null }, { "match.resumoSemanalEm": { $lt: ontem } }],
  })
    .select("_id match")
    .lean();

  for (const e of empresas) {
    try {
      const [vagasAtivas, candidaturas, matchesNovos, matchesParados] = await Promise.all([
        Vaga.countDocuments({ empresaId: e._id, status: "ativa" }),
        Candidatura.countDocuments({ empresaId: e._id, createdAt: { $gte: semanaAtras } }),
        Match.countDocuments({ empresaId: e._id, createdAt: { $gte: semanaAtras } }),
        Match.countDocuments({
          empresaId: e._id,
          status: "novo",
          $or: [{ ultimaMensagem: null }, { "ultimaMensagem.autorTipo": { $in: ["sistema", "profissional"] } }],
        }),
      ]);
      if (candidaturas || matchesNovos || matchesParados) {
        await notificar(
          { tipo: "empresa", perfilId: e._id },
          msgResumoSemanalEmpresa({
            candidaturas,
            matchesNovos,
            matchesParados,
            vagasAtivas,
          })
        );
        r.empresas++;
      }
      await Empresa.updateOne({ _id: e._id }, { $set: { "match.resumoSemanalEm": agora } });
    } catch (err) {
      console.warn("[resumo-semanal] empresa", String(e._id), err);
    }
  }

  return r;
}
