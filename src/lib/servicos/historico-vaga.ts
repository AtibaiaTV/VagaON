import { connectDB } from "@/lib/db";
import HistoricoVaga, { type AutorHistorico } from "@/models/HistoricoVaga";
import User from "@/models/User";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

export interface Autor {
  tipo: AutorHistorico;
  userId?: unknown;
  /** Se faltar e houver userId, o nome é buscado no User. */
  nome?: string;
}

export const SISTEMA: Autor = { tipo: "sistema", nome: "Cron / sistema" };
export const REDESA: Autor = { tipo: "redesa", nome: "API da RedeSA" };

/** Campos que valem a pena mostrar num diff de edição, com rótulo. */
export const CAMPOS_AUDITADOS: Record<string, string> = {
  titulo: "Título",
  descricao: "Descrição",
  requisitos: "Requisitos",
  tipo: "Tipo",
  especialidade: "Função",
  salario: "Salário",
  periodo: "Período",
  cidade: "Cidade",
  estado: "UF",
  remoto: "Remoto",
  raioKm: "Raio (km)",
  status: "Status",
  especialidadesAceitas: "Funções aceitas",
  anosExperienciaMin: "Experiência mínima",
  habilidadesDesejadas: "Habilidades",
  turno: "Turno",
  escala: "Escala",
  idiomasDesejados: "Idiomas",
  posicoes: "Posições",
  afirmativa: "Afirmativa",
  perguntasTriagem: "Perguntas de triagem",
  aprovadaPorAdmin: "Aprovada",
  motivoRejeicao: "Motivo da rejeição",
  expiresAt: "Validade",
};

function texto(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Diferenças entre o documento antes e o objeto de atualização. */
export function diffVaga(antes: Doc, atualizacao: Doc): { campo: string; de: string; para: string }[] {
  const mudancas: { campo: string; de: string; para: string }[] = [];
  for (const campo of Object.keys(atualizacao)) {
    if (!(campo in CAMPOS_AUDITADOS)) continue;
    const de = texto(antes?.[campo]);
    const para = texto(atualizacao[campo]);
    if (de !== para) mudancas.push({ campo: CAMPOS_AUDITADOS[campo], de: de.slice(0, 300), para: para.slice(0, 300) });
  }
  return mudancas;
}

/** Nunca lança: histórico não pode derrubar a ação que registra. */
export async function registrarHistoricoVaga(
  vagaId: unknown,
  acao: string,
  por: Autor,
  detalhes = "",
  mudancas: { campo: string; de: string; para: string }[] = []
): Promise<void> {
  try {
    await connectDB();
    let nome = por.nome ?? "";
    const userId = por.userId ? String(por.userId) : null;
    if (!nome && userId) {
      const u = await User.findById(userId).select("name").lean();
      nome = u?.name ?? "";
    }
    await HistoricoVaga.create({
      vagaId: String(vagaId),
      em: new Date(),
      acao,
      por: { tipo: por.tipo, userId, nome },
      detalhes: detalhes.slice(0, 1000),
      mudancas,
    });
  } catch (err) {
    console.warn("[historico-vaga] não registrou:", err);
  }
}

export async function historicoDaVaga(vagaId: unknown) {
  await connectDB();
  return HistoricoVaga.find({ vagaId: String(vagaId) }).sort({ em: -1 }).limit(500).lean();
}
