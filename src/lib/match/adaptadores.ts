import { MINIMO_PUBLICO } from "@/constants/avaliacao";
import { RAIO_PADRAO_KM } from "@/constants/match";
import { geocodificarCidade } from "@/constants/municipios";
import { paraCoords } from "./geo";
import type { ProfissionalMatch, VagaMatch } from "./tipos";

/**
 * Converte documentos do Mongo nas projeções que o motor entende.
 * Concentrar isso aqui mantém o motor livre de Mongoose e tolerante a
 * documentos antigos que ainda não têm os campos novos.
 *
 * Os parâmetros são `unknown` de propósito: entra tanto o `.lean()` cru quanto
 * o documento hidratado, e cada um tipa os subdocumentos de um jeito.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

function id(v: unknown): string {
  return v == null ? "" : String(v);
}

/** Coordenadas reais ou null — nunca centroide (ver municipios.ts). */
function coordsDe(doc: Doc): { lat: number; lng: number } | null {
  return paraCoords(doc.localizacao) ?? geocodificarCidade(doc.cidade, doc.estado);
}

/** Reputação só conta com o mínimo público de avaliações. */
function reputacaoDe(rep: Doc | null | undefined): { media: number; total: number } | null {
  if (!rep || typeof rep.media !== "number" || !rep.total || rep.total < MINIMO_PUBLICO) return null;
  return { media: rep.media, total: rep.total };
}

export function paraProfissionalMatch(entrada: unknown): ProfissionalMatch {
  const doc = entrada as Doc;
  return {
    _id: id(doc._id),
    especialidades: doc.especialidades ?? [],
    cidade: doc.cidade ?? "",
    estado: doc.estado ?? "",
    coords: coordsDe(doc),
    raioKm: doc.raioKm ?? RAIO_PADRAO_KM,
    dispostoViajar: Boolean(doc.dispostoViajar),
    disponibilidade: {
      tipo: doc.disponibilidade?.tipo ?? [],
      imediata: doc.disponibilidade?.imediata ?? true,
      dataDisponivel: doc.disponibilidade?.dataDisponivel ?? null,
    },
    anosExperiencia: doc.anosExperiencia ?? 0,
    habilidades: doc.habilidades ?? [],
    idiomas: doc.idiomas ?? [],
    pretensaoSalarial: {
      min: doc.pretensaoSalarial?.min ?? null,
      periodo: doc.pretensaoSalarial?.periodo ?? "mes",
    },
    turnos: doc.turnos ?? [],
    escalas: doc.escalas ?? [],
    completude: doc.completude ?? 0,
    ultimaAtividade: doc.match?.ultimaAtividade ?? doc.updatedAt ?? null,
    reputacao: reputacaoDe(doc.reputacao),
  };
}

export function paraVagaMatch(entrada: unknown, empresaVerificada = false): VagaMatch {
  const doc = entrada as Doc;
  // `empresaId` pode vir populado (objeto) ou como ObjectId.
  const empresa =
    doc.empresaId && typeof doc.empresaId === "object" && "verificada" in doc.empresaId
      ? (doc.empresaId as Doc)
      : null;

  return {
    _id: id(doc._id),
    especialidade: doc.especialidade ?? "",
    especialidadesAceitas: doc.especialidadesAceitas ?? [],
    cidade: doc.cidade ?? "",
    estado: doc.estado ?? "",
    coords: coordsDe(doc),
    remoto: Boolean(doc.remoto),
    tipo: doc.tipo ?? "clt",
    periodo: {
      dataInicio: doc.periodo?.dataInicio ?? null,
      dataFim: doc.periodo?.dataFim ?? null,
    },
    anosExperienciaMin: doc.anosExperienciaMin ?? 0,
    habilidadesDesejadas: doc.habilidadesDesejadas ?? [],
    idiomasDesejados: doc.idiomasDesejados ?? [],
    salario: {
      tipo: doc.salario?.tipo ?? "a_combinar",
      min: doc.salario?.min ?? null,
      max: doc.salario?.max ?? null,
      periodo: doc.salario?.periodo ?? "mes",
    },
    turno: doc.turno ?? null,
    escala: doc.escala ?? null,
    empresaVerificada: empresa ? Boolean(empresa.verificada) : empresaVerificada,
    empresaReputacao: reputacaoDe(empresa?.reputacao),
  };
}
