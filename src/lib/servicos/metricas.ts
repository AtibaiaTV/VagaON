import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Match from "@/models/Match";
import Swipe from "@/models/Swipe";
import Vaga from "@/models/Vaga";
import { LIMITE_LIKES_DIA } from "@/constants/match";
import { contarInteressadosPorVaga } from "./interesse";

/**
 * Números do painel. Tudo vem do que já é gravado (Swipe, Match, Candidatura,
 * contadores da Vaga) — nenhum evento novo foi criado para isso.
 */

const DIA_MS = 1000 * 60 * 60 * 24;

export interface LinhaVaga {
  id: string;
  titulo: string;
  cidade: string;
  status: string;
  visualizacoes: number;
  likes: number;
  /** Profissionais distintos que curtiram ou se candidataram. */
  interessados: number;
  matches: number;
  candidaturas: number;
}

export interface MetricasEmpresa {
  vagasAtivas: number;
  visualizacoes: number;
  candidaturas: number;
  likesRecebidos: number;
  /** Soma de interessados por vaga (quem se interessou por duas vagas conta duas vezes). */
  interessados: number;
  matches: number;
  contratacoes: number;
  /** Do match ao "contratado", em dias. null sem contratações. */
  tempoMedioContratacaoDias: number | null;
  porVaga: LinhaVaga[];
}

export async function metricasEmpresa(empresaId: Types.ObjectId | string): Promise<MetricasEmpresa> {
  await connectDB();

  const [vagas, matchesPorVaga, contratados, totalMatches, candidaturas] = await Promise.all([
    Vaga.find({ empresaId }).select("titulo cidade status visualizacoes match totalCandidaturas createdAt").lean(),
    // aggregate não converte string em ObjectId sozinho, ao contrário do find.
    Match.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { empresaId: new Types.ObjectId(String(empresaId)) } },
      { $group: { _id: "$vagaId", n: { $sum: 1 } } },
    ]).then((r) => new Map(r.map((x) => [String(x._id), x.n]))),
    Match.find({ empresaId, status: "contratado" }).select("createdAt updatedAt").lean(),
    Match.countDocuments({ empresaId }),
    Candidatura.countDocuments({ empresaId }),
  ]);
  const interessadosPorVaga = await contarInteressadosPorVaga(vagas.map((v) => v._id));

  const porVaga: LinhaVaga[] = vagas
    .map((v) => ({
      id: String(v._id),
      titulo: v.titulo,
      cidade: v.cidade,
      status: v.status,
      visualizacoes: v.visualizacoes ?? 0,
      likes: v.match?.totalLikesRecebidos ?? 0,
      interessados: interessadosPorVaga.get(String(v._id)) ?? 0,
      matches: matchesPorVaga.get(String(v._id)) ?? 0,
      candidaturas: v.totalCandidaturas ?? 0,
    }))
    // Ativas primeiro; dentro, por interesse recebido.
    .sort((a, b) => Number(b.status === "ativa") - Number(a.status === "ativa") || b.interessados - a.interessados || b.visualizacoes - a.visualizacoes);

  const tempoMedio = contratados.length
    ? Math.round(
        contratados.reduce((acc, m) => acc + (new Date(m.updatedAt).getTime() - new Date(m.createdAt).getTime()), 0) /
          contratados.length /
          DIA_MS
      )
    : null;

  return {
    vagasAtivas: vagas.filter((v) => v.status === "ativa").length,
    visualizacoes: porVaga.reduce((a, v) => a + v.visualizacoes, 0),
    candidaturas,
    likesRecebidos: porVaga.reduce((a, v) => a + v.likes, 0),
    interessados: porVaga.reduce((a, v) => a + v.interessados, 0),
    matches: totalMatches,
    contratacoes: contratados.length,
    tempoMedioContratacaoDias: tempoMedio,
    porVaga: porVaga.slice(0, 8),
  };
}

export interface MetricasProfissional {
  /** Empresas que viram e decidiram sobre o perfil no deck. */
  avaliadoPorEmpresas: number;
  curtidoPorEmpresas: number;
  matchesAtivos: number;
  candidaturas: number;
  likesUsadosHoje: number;
  limiteLikesDia: number;
  completude: number;
}

export async function metricasProfissional(
  profissionalId: Types.ObjectId | string,
  completude: number
): Promise<MetricasProfissional> {
  await connectDB();

  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const [avaliado, curtido, matchesAtivos, candidaturas, likesHoje] = await Promise.all([
    Swipe.countDocuments({ profissionalId, autorTipo: "empresa" }),
    // Empresas distintas: uma empresa que curtiu em três vagas conta uma vez.
    Swipe.distinct("empresaId", { profissionalId, autorTipo: "empresa", direcao: { $in: ["like", "super"] } }).then((r) => r.length),
    Match.countDocuments({ profissionalId, status: { $ne: "encerrado" } }),
    Candidatura.countDocuments({ profissionalId }),
    Swipe.countDocuments({
      profissionalId,
      autorTipo: "profissional",
      direcao: { $in: ["like", "super"] },
      createdAt: { $gte: inicioDia },
    }),
  ]);

  return {
    avaliadoPorEmpresas: avaliado,
    curtidoPorEmpresas: curtido,
    matchesAtivos,
    candidaturas,
    likesUsadosHoje: likesHoje,
    limiteLikesDia: LIMITE_LIKES_DIA,
    completude,
  };
}
