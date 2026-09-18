import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Match from "@/models/Match";
import Mensagem from "@/models/Mensagem";
import Notificacao from "@/models/Notificacao";
import Profissional from "@/models/Profissional";
import Swipe from "@/models/Swipe";
import Vaga from "@/models/Vaga";

/**
 * Os números que dizem se o match está virando conversa e contratação — e
 * se os avisos (match parado, vaga nova, resumo semanal) mexem nisso. É o
 * que decide, com dado e não com "acho", se o WhatsApp vale o custo.
 *
 * Tudo em janela de N dias (padrão 30), calculado na hora: a base é pequena.
 */

export interface MetricasLiquidez {
  dias: number;
  matches: {
    total: number;
    comMensagem: number;
    respondidosEm48h: number;
    semMensagem: number;
    /** Horas até a primeira mensagem humana (mediana e média), só entre os que tiveram. */
    horasAtePrimeiraMensagemMediana: number | null;
    horasAtePrimeiraMensagemMedia: number | null;
    /** Quem falou primeiro. */
    primeiroFalou: { profissional: number; empresa: number };
    contratados: number;
    diasAteContratacaoMedia: number | null;
  };
  alertaMatchParado: {
    enviados: number;
    /** Depois do alerta, o match ganhou uma mensagem humana. */
    reagiram: number;
  };
  alertaVagaNova: {
    vagasComAlerta: number;
    profissionaisAvisados: number;
    /** Avisados que depois curtiram ou se candidataram àquela vaga. */
    converteram: number;
  };
  resumoSemanal: {
    enviados: number;
  };
}

function mediana(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function media(v: number[]): number | null {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export async function metricasLiquidez(dias = 30, agora: Date = new Date()): Promise<MetricasLiquidez> {
  await connectDB();
  const desde = new Date(agora.getTime() - dias * 86_400_000);

  // ── Matches da janela e a primeira mensagem humana de cada um ────────────
  const matches = await Match.find({ createdAt: { $gte: desde } })
    .select("_id createdAt status contratadoEm alertaParadoEm")
    .lean();
  const ids = matches.map((m) => m._id);

  const primeiras = ids.length
    ? ((await Mensagem.aggregate([
        { $match: { matchId: { $in: ids }, autorTipo: { $in: ["profissional", "empresa"] } } },
        { $sort: { createdAt: 1 } },
        { $group: { _id: "$matchId", em: { $first: "$createdAt" }, autor: { $first: "$autorTipo" } } },
      ])) as { _id: Types.ObjectId; em: Date; autor: "profissional" | "empresa" }[])
    : [];
  const primeiraPor = new Map(primeiras.map((p) => [String(p._id), p]));

  const horas: number[] = [];
  let respondidosEm48h = 0;
  const primeiroFalou = { profissional: 0, empresa: 0 };
  let contratados = 0;
  const diasContratacao: number[] = [];
  let alertasEnviados = 0;
  let reagiram = 0;

  for (const m of matches) {
    const p = primeiraPor.get(String(m._id));
    if (p) {
      const h = (new Date(p.em).getTime() - new Date(m.createdAt).getTime()) / 3_600_000;
      horas.push(h);
      if (h <= 48) respondidosEm48h++;
      primeiroFalou[p.autor]++;
    }
    if (m.status === "contratado" && m.contratadoEm) {
      contratados++;
      diasContratacao.push((new Date(m.contratadoEm).getTime() - new Date(m.createdAt).getTime()) / 86_400_000);
    }
    if (m.alertaParadoEm) {
      alertasEnviados++;
      if (p && new Date(p.em) > new Date(m.alertaParadoEm)) reagiram++;
    }
  }

  // ── Alerta de vaga nova: avisos e conversão em like/candidatura ──────────
  const avisos = await Notificacao.find({
    categoria: "sistema",
    titulo: { $regex: "^Vaga nova que combina" },
    createdAt: { $gte: desde },
  })
    .select("userId url createdAt")
    .lean();

  let converteram = 0;
  if (avisos.length) {
    const userIds = Array.from(new Set(avisos.map((a) => String(a.userId))));
    const profs = await Profissional.find({ userId: { $in: userIds } }).select("_id userId").lean();
    const profPorUser = new Map(profs.map((p) => [String(p.userId), p._id]));

    const pares = avisos
      .map((a) => {
        const vagaId = a.url.match(/\/vagas\/([a-f0-9]{24})/)?.[1];
        const profissionalId = profPorUser.get(String(a.userId));
        return vagaId && profissionalId ? { vagaId: new Types.ObjectId(vagaId), profissionalId, depois: a.createdAt } : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (pares.length) {
      const [likes, candidaturas] = await Promise.all([
        Swipe.find({
          autorTipo: "profissional",
          direcao: { $in: ["like", "super"] },
          $or: pares.map((p) => ({ vagaId: p.vagaId, profissionalId: p.profissionalId, createdAt: { $gte: p.depois } })),
        })
          .select("vagaId profissionalId")
          .lean(),
        Candidatura.find({
          $or: pares.map((p) => ({ vagaId: p.vagaId, profissionalId: p.profissionalId, createdAt: { $gte: p.depois } })),
        })
          .select("vagaId profissionalId")
          .lean(),
      ]);
      const chaves = new Set([...likes, ...candidaturas].map((x) => `${x.vagaId}:${x.profissionalId}`));
      converteram = pares.filter((p) => chaves.has(`${p.vagaId}:${p.profissionalId}`)).length;
    }
  }

  const [vagasComAlerta, resumosEnviados] = await Promise.all([
    Vaga.countDocuments({ alertaVagaNovaEm: { $gte: desde } }),
    Notificacao.countDocuments({
      categoria: "sistema",
      titulo: { $regex: "^(Resumo da semana|\\d+ vagas? novas? para você esta semana)" },
      createdAt: { $gte: desde },
    }),
  ]);

  return {
    dias,
    matches: {
      total: matches.length,
      comMensagem: horas.length,
      respondidosEm48h,
      semMensagem: matches.length - horas.length,
      horasAtePrimeiraMensagemMediana: mediana(horas),
      horasAtePrimeiraMensagemMedia: media(horas),
      primeiroFalou,
      contratados,
      diasAteContratacaoMedia: media(diasContratacao),
    },
    alertaMatchParado: { enviados: alertasEnviados, reagiram },
    alertaVagaNova: { vagasComAlerta, profissionaisAvisados: avisos.length, converteram },
    resumoSemanal: { enviados: resumosEnviados },
  };
}
