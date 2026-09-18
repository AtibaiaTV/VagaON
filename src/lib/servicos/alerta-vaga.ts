import { connectDB } from "@/lib/db";
import { msgVagaNovaCombina, notificar } from "@/lib/notificacoes";
import Empresa from "@/models/Empresa";
import Vaga from "@/models/Vaga";
import { feedParaEmpresa } from "./feed";

/**
 * Vaga publicada → avisa na hora os profissionais que mais combinam.
 *
 * É o motor do Descobrir rodando ao contrário: em vez de esperar a empresa
 * deslizar e o candidato abrir o app, a vaga procura quem serve. Fecha o
 * ciclo "vaga entra, quem combina fica sabendo em minutos" sem depender de
 * ninguém abrir o VagaON. Uma vez por vaga (`Vaga.alertaVagaNovaEm`).
 *
 * Só quem tem aderência alta recebe: aviso de vaga fraca é o que ensina a
 * pessoa a ignorar o VagaON.
 */

export const ALERTA_SCORE_MINIMO = 55;
export const ALERTA_MAX_PROFISSIONAIS = 10;

export interface ResultadoAlertaVaga {
  avisados: number;
  motivo?: string;
}

export async function alertarProfissionaisParaVaga(vagaId: unknown): Promise<ResultadoAlertaVaga> {
  await connectDB();
  const vaga = await Vaga.findById(vagaId);
  if (!vaga) return { avisados: 0, motivo: "vaga não encontrada" };
  if (vaga.status !== "ativa" || !vaga.aprovadaPorAdmin) return { avisados: 0, motivo: "vaga não está ativa" };
  if (vaga.match?.ativo === false) return { avisados: 0, motivo: "vaga fora do match" };
  if (vaga.alertaVagaNovaEm) return { avisados: 0, motivo: "já avisada" };

  const empresa = await Empresa.findById(vaga.empresaId);
  if (!empresa) return { avisados: 0, motivo: "empresa não encontrada" };

  // Marca antes de enviar: duas chamadas simultâneas não avisam duas vezes.
  const marcada = await Vaga.updateOne({ _id: vaga._id, alertaVagaNovaEm: null }, { $set: { alertaVagaNovaEm: new Date() } });
  if (marcada.modifiedCount === 0) return { avisados: 0, motivo: "já avisada" };

  const { cards } = await feedParaEmpresa(empresa, vaga, ALERTA_MAX_PROFISSIONAIS * 2);
  const aderentes = cards.filter((c) => c.score.total >= ALERTA_SCORE_MINIMO).slice(0, ALERTA_MAX_PROFISSIONAIS);

  let avisados = 0;
  for (const c of aderentes) {
    const r = await notificar(
      { tipo: "profissional", perfilId: c.profissional.id },
      msgVagaNovaCombina({
        vagaTitulo: vaga.titulo,
        empresaNome: empresa.nomeFantasia,
        cidade: vaga.cidade,
        remoto: vaga.remoto,
        score: c.score.total,
        vagaId: String(vaga._id),
      })
    );
    if (r.length) avisados++;
  }
  return { avisados };
}

/** Versão para chamar depois de criar a vaga: nunca lança, só registra. */
export async function alertarSemFalhar(vagaId: unknown, origem: string): Promise<void> {
  try {
    const r = await alertarProfissionaisParaVaga(vagaId);
    if (r.avisados) console.info(`[alerta-vaga] ${origem}: ${r.avisados} profissional(is) avisado(s) da vaga ${String(vagaId)}`);
  } catch (err) {
    console.warn(`[alerta-vaga] ${origem} falhou para ${String(vagaId)}:`, err);
  }
}
