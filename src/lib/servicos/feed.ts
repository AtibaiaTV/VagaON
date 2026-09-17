import { geocodificarCidade } from "@/constants/municipios";
import { connectDB } from "@/lib/db";
import {
  SCORE_MINIMO_FEED,
  especialidadesRelacionadas,
  paraCoords,
  paraProfissionalMatch,
  paraVagaMatch,
  raioEfetivoKm,
  ranquearProfissionais,
  ranquearVagas,
} from "@/lib/match";
import type { IEmpresa } from "@/models/Empresa";
import Profissional, { type IProfissional } from "@/models/Profissional";
import Swipe from "@/models/Swipe";
import User from "@/models/User";
import Vaga, { type IVaga } from "@/models/Vaga";
import {
  paraCardProfissional,
  paraCardVaga,
  resumirScore,
  type CardProfissional,
  type CardVaga,
  type ResumoScore,
} from "./projecoes";

/**
 * Monta o deck de cada lado.
 *
 * Estratégia: pré-filtro barato no Mongo (geo + especialidade relacionada +
 * exclusão do que já foi visto) → até LOTE_CANDIDATOS documentos → pontuação
 * em memória → corte pelo score mínimo → ordenação por prioridade.
 *
 * Na escala atual isso responde em dezenas de ms e é trivial de depurar. Se
 * o volume crescer, o passo seguinte é uma coleção de scores pré-computados,
 * não mexer aqui.
 */

const RAIO_TERRA_KM = 6371;
/** Quantos documentos pré-filtrados entram na pontuação em memória. */
const LOTE_CANDIDATOS = 300;
/**
 * Raio de busca de candidatos para a empresa. É generoso porque o raio que
 * vale é o de cada profissional — o motor aplica esse na eliminatória.
 */
const RAIO_BUSCA_EMPRESA_KM = 200;
/** Margem sobre o raio do profissional — mesma da eliminatória do motor. */
const MARGEM_RAIO = 1.5;

export interface FeedVagaItem {
  score: ResumoScore;
  vaga: CardVaga;
}

export interface FeedProfissionalItem {
  score: ResumoScore;
  /** O profissional já curtiu esta vaga — o like da empresa vira match na hora. */
  jaCurtiu: boolean;
  profissional: CardProfissional;
}

function dentroDoRaio(coords: { lat: number; lng: number }, km: number) {
  return {
    localizacao: {
      $geoWithin: { $centerSphere: [[coords.lng, coords.lat], km / RAIO_TERRA_KM] },
    },
  };
}

/** Documentos antigos ou de cidade não mapeada — entram pelo estado. */
const SEM_GEO = { "localizacao.coordinates": { $exists: false } };

export async function feedParaProfissional(
  p: IProfissional,
  limite = 20
): Promise<{ cards: FeedVagaItem[]; restantes: number }> {
  await connectDB();

  const jaVistas = await Swipe.distinct("vagaId", {
    profissionalId: p._id,
    autorTipo: "profissional",
  });

  const coords = paraCoords(p.localizacao) ?? geocodificarCidade(p.cidade, p.estado);
  const condicoes: Record<string, unknown>[] = [];

  if (coords) {
    const km = raioEfetivoKm(p.raioKm, p.dispostoViajar) * MARGEM_RAIO;
    condicoes.push({
      $or: [{ remoto: true }, dentroDoRaio(coords, km), { ...SEM_GEO, estado: p.estado }],
    });
  } else if (p.estado) {
    condicoes.push({ $or: [{ remoto: true }, { estado: p.estado }] });
  }

  if (p.especialidades?.length) {
    const relacionadas = especialidadesRelacionadas(p.especialidades);
    condicoes.push({
      $or: [
        { especialidade: { $in: relacionadas } },
        { especialidadesAceitas: { $in: relacionadas } },
      ],
    });
  }

  const filtro: Record<string, unknown> = {
    status: "ativa",
    aprovadaPorAdmin: true,
    "match.ativo": { $ne: false },
    _id: { $nin: jaVistas },
    ...(condicoes.length ? { $and: condicoes } : {}),
  };

  const docs = await Vaga.find(filtro)
    .sort({ createdAt: -1 })
    .limit(LOTE_CANDIDATOS)
    .populate("empresaId", "nomeFantasia logo setor verificada reputacao")
    .lean();

  const perfil = paraProfissionalMatch(p);
  const porId = new Map(docs.map((d) => [String(d._id), d]));

  const aptos = ranquearVagas(perfil, docs.map((d) => paraVagaMatch(d))).filter(
    (r) => r.resultado.total >= SCORE_MINIMO_FEED
  );

  const cards = aptos.slice(0, limite).map(({ vaga, resultado }) => ({
    score: resumirScore(resultado),
    vaga: paraCardVaga(porId.get(vaga._id)!),
  }));

  return { cards, restantes: Math.max(0, aptos.length - cards.length) };
}

export async function feedParaEmpresa(
  empresa: IEmpresa,
  vaga: IVaga,
  limite = 20
): Promise<{ cards: FeedProfissionalItem[]; restantes: number }> {
  await connectDB();

  const [jaVistos, curtiram] = await Promise.all([
    Swipe.distinct("profissionalId", { vagaId: vaga._id, autorTipo: "empresa" }),
    Swipe.distinct("profissionalId", {
      vagaId: vaga._id,
      autorTipo: "profissional",
      direcao: { $in: ["like", "super"] },
    }),
  ]);
  const curtiuSet = new Set(curtiram.map(String));

  const coords = paraCoords(vaga.localizacao) ?? geocodificarCidade(vaga.cidade, vaga.estado);
  const condicoes: Record<string, unknown>[] = [];

  if (!vaga.remoto) {
    if (coords) {
      condicoes.push({
        $or: [
          dentroDoRaio(coords, RAIO_BUSCA_EMPRESA_KM),
          { dispostoViajar: true },
          { ...SEM_GEO, estado: vaga.estado },
        ],
      });
    } else if (vaga.estado) {
      condicoes.push({ $or: [{ dispostoViajar: true }, { estado: vaga.estado }] });
    }
  }

  const relacionadas = especialidadesRelacionadas([
    vaga.especialidade,
    ...(vaga.especialidadesAceitas ?? []),
  ]);
  if (relacionadas.length) condicoes.push({ especialidades: { $in: relacionadas } });

  const filtro: Record<string, unknown> = {
    "match.ativo": { $ne: false },
    _id: { $nin: jaVistos },
    ...(condicoes.length ? { $and: condicoes } : {}),
  };

  const docs = await Profissional.find(filtro)
    .sort({ "match.ultimaAtividade": -1, updatedAt: -1 })
    .limit(LOTE_CANDIDATOS)
    .lean();

  // Conta suspensa não aparece para empresa nenhuma.
  const suspensos = new Set(
    (
      await User.distinct("_id", {
        _id: { $in: docs.map((d) => d.userId) },
        status: "suspenso",
      })
    ).map(String)
  );
  const ativos = docs.filter((d) => !suspensos.has(String(d.userId)));

  const alvo = paraVagaMatch(vaga, empresa.verificada);
  const porId = new Map(ativos.map((d) => [String(d._id), d]));

  const aptos = ranquearProfissionais(alvo, ativos.map(paraProfissionalMatch)).filter(
    (r) => r.resultado.total >= SCORE_MINIMO_FEED
  );

  // Quem já curtiu a vaga vai primeiro: um like da empresa fecha o match agora.
  aptos.sort(
    (a, b) =>
      Number(curtiuSet.has(b.profissional._id)) - Number(curtiuSet.has(a.profissional._id)) ||
      b.resultado.prioridade - a.resultado.prioridade
  );

  // Modo às cegas: o deck decide pelo perfil, não pelo rosto ou pelo nome.
  const oculto = empresa.match?.modoCego === true;

  const cards = aptos.slice(0, limite).map(({ profissional, resultado }) => ({
    score: resumirScore(resultado),
    jaCurtiu: curtiuSet.has(profissional._id),
    profissional: paraCardProfissional(porId.get(profissional._id)!, { oculto }),
  }));

  return { cards, restantes: Math.max(0, aptos.length - cards.length) };
}
