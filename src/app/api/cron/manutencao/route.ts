import { NextRequest, NextResponse } from "next/server";
import { convidarParaAvaliar, publicarPendentes } from "@/lib/servicos/avaliacoes";
import { alertarMatchesParados, enviarResumoSemanal } from "@/lib/servicos/engajamento";
import { manutencaoVagas } from "@/lib/servicos/vagas";
import { manutencaoInatividade } from "@/lib/servicos/visibilidade";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diário único (o plano Hobby da Vercel permite dois crons; o outro é
 * o lembrete de entrevista). Roda em sequência, cada passo isolado:
 * avaliações (convites + publicação), limpeza de validade herdada, inatividade,
 * match parado (48 h sem mensagem) e resumo semanal (segunda-feira).
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const saida: Record<string, unknown> = { ok: true };
  const passos: [string, () => Promise<unknown>][] = [
    ["avaliacoesConvites", convidarParaAvaliar],
    ["avaliacoesPublicadas", publicarPendentes],
    ["vagas", () => manutencaoVagas()],
    ["inatividade", () => manutencaoInatividade()],
    ["matchesParados", () => alertarMatchesParados()],
    ["resumoSemanal", () => enviarResumoSemanal()],
  ];

  for (const [nome, passo] of passos) {
    try {
      saida[nome] = await passo();
    } catch (err) {
      console.error(`[cron/manutencao] ${nome}:`, err);
      saida[nome] = { erro: String(err) };
      saida.ok = false;
    }
  }

  return NextResponse.json(saida, { status: saida.ok ? 200 : 500 });
}
