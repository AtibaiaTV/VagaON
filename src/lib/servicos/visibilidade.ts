import type { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { msgPerfilInativoAviso, msgPerfilPausadoInatividade, notificar } from "@/lib/notificacoes";
import { DIAS_APOS_AVISO_INATIVIDADE, DIAS_INATIVIDADE, type MotivoPausaPerfil } from "@/lib/vagas-estado";
import Profissional from "@/models/Profissional";

/**
 * Visibilidade do perfil do profissional para as empresas (Descobrir e banco
 * de currículos). Candidaturas, matches e chats nunca dependem disso.
 */

export async function definirVisibilidade(
  profissionalId: Types.ObjectId | string,
  ativo: boolean,
  motivo: MotivoPausaPerfil = "manual"
) {
  await connectDB();
  await Profissional.updateOne(
    { _id: profissionalId },
    {
      $set: ativo
        ? { "match.ativo": true, "match.motivoPausa": null, "match.pausadoEm": null, "match.avisoInatividadeEm": null, "match.ultimaAtividade": new Date() }
        : { "match.ativo": false, "match.motivoPausa": motivo, "match.pausadoEm": new Date() },
    }
  );
}

/**
 * Marca que a pessoa usou o app. Chamado em páginas de entrada (painel,
 * Descobrir) — barato e suficiente para o cron de inatividade.
 */
export async function registrarAtividadeProfissional(userId: string) {
  await connectDB();
  await Profissional.updateOne(
    { userId },
    { $set: { "match.ultimaAtividade": new Date(), "match.avisoInatividadeEm": null } }
  ).catch(() => {});
}

export interface ResultadoManutencaoInatividade {
  avisados: number;
  pausados: number;
}

/**
 * Cron diário: sem nenhuma atividade por DIAS_INATIVIDADE, avisa; passados
 * DIAS_APOS_AVISO_INATIVIDADE sem reação, pausa. Atividade = última vez no
 * app, ou a última edição do perfil para quem nunca usou o Descobrir.
 */
export async function manutencaoInatividade(agora: Date = new Date()): Promise<ResultadoManutencaoInatividade> {
  await connectDB();
  const r: ResultadoManutencaoInatividade = { avisados: 0, pausados: 0 };
  const limiteInativo = new Date(agora.getTime() - DIAS_INATIVIDADE * 86_400_000);
  const limiteAviso = new Date(agora.getTime() - DIAS_APOS_AVISO_INATIVIDADE * 86_400_000);

  const candidatos = await Profissional.find({ "match.ativo": { $ne: false } })
    .select("match updatedAt")
    .lean();

  for (const p of candidatos) {
    const ultima = new Date(p.match?.ultimaAtividade ?? p.updatedAt ?? 0);
    if (ultima > limiteInativo) continue; // ativo — nada a fazer

    const aviso = p.match?.avisoInatividadeEm ? new Date(p.match.avisoInatividadeEm) : null;
    if (!aviso) {
      const dias = Math.floor((agora.getTime() - ultima.getTime()) / 86_400_000);
      await notificar({ tipo: "profissional", perfilId: p._id }, msgPerfilInativoAviso({ dias }));
      await Profissional.updateOne({ _id: p._id }, { $set: { "match.avisoInatividadeEm": agora } });
      r.avisados++;
    } else if (aviso <= limiteAviso) {
      await definirVisibilidade(p._id, false, "inatividade");
      await notificar({ tipo: "profissional", perfilId: p._id }, msgPerfilPausadoInatividade());
      r.pausados++;
    }
  }
  return r;
}
