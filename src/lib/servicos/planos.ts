import { connectDB } from "@/lib/db";
import {
  MENSAGENS_LIMITE,
  excedeuLimite,
  planosAtivos,
  resolverPlano,
  type PlanoResolvido,
  type RecursoPlano,
} from "@/lib/planos";
import Swipe from "@/models/Swipe";
import Vaga from "@/models/Vaga";
import { ErroAtor } from "./erros";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

/** HTTP 402: o cliente mostra a mensagem e o link para /planos. */
export const STATUS_UPGRADE = 402;

export function acessoDaEmpresa(empresa: Doc | null | undefined): PlanoResolvido {
  return resolverPlano(empresa?.assinatura, new Date(), planosAtivos());
}

/** Lança 402 se o recurso não está no plano da empresa. No-op com planos desligados. */
export function exigirRecurso(empresa: Doc, recurso: RecursoPlano) {
  const acesso = acessoDaEmpresa(empresa);
  if (!acesso.limites[recurso]) throw new ErroAtor(STATUS_UPGRADE, MENSAGENS_LIMITE[recurso]);
}

/** Vagas ativas: conta antes de criar mais uma. */
export async function verificarLimiteVagas(empresa: Doc) {
  const { limites } = acessoDaEmpresa(empresa);
  if (limites.vagasAtivas === null) return;
  await connectDB();
  const ativas = await Vaga.countDocuments({ empresaId: empresa._id, status: "ativa" });
  if (excedeuLimite(limites.vagasAtivas, ativas)) {
    throw new ErroAtor(STATUS_UPGRADE, MENSAGENS_LIMITE.vagasAtivas(limites.vagasAtivas));
  }
}

/** Decisões da empresa no deck, por dia (like, pass e super contam igual). */
export async function verificarLimiteSwipesEmpresa(empresa: Doc) {
  const { limites } = acessoDaEmpresa(empresa);
  if (limites.swipesDia === null) return;
  await connectDB();
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);
  const usados = await Swipe.countDocuments({ empresaId: empresa._id, autorTipo: "empresa", createdAt: { $gte: inicioDia } });
  if (excedeuLimite(limites.swipesDia, usados)) {
    throw new ErroAtor(STATUS_UPGRADE, MENSAGENS_LIMITE.swipesDia(limites.swipesDia));
  }
}
