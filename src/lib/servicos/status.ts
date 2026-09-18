import Candidatura from "@/models/Candidatura";
import Match, { type IMatch, type StatusMatch } from "@/models/Match";
import Mensagem from "@/models/Mensagem";
import { registrarContratacao } from "./vagas";

/**
 * Candidatura e Match são duas visões do mesmo par (vaga, profissional):
 * o Kanban da empresa move a Candidatura; o chat move o Match. Este módulo
 * mantém os dois coerentes sem que um serviço importe o outro.
 */

export type StatusCandidatura = "enviada" | "visualizada" | "em_analise" | "entrevista" | "aprovada" | "recusada";

export const STATUS_CANDIDATURA: StatusCandidatura[] = [
  "enviada",
  "visualizada",
  "em_analise",
  "entrevista",
  "aprovada",
  "recusada",
];

/** Kanban → chat. `null` = não mexe no match. */
export const CANDIDATURA_PARA_MATCH: Record<StatusCandidatura, StatusMatch | null> = {
  enviada: null,
  visualizada: null,
  em_analise: null,
  entrevista: "entrevista",
  aprovada: "contratado",
  recusada: "encerrado",
};

/** Chat → Kanban. */
export const MATCH_PARA_CANDIDATURA: Partial<Record<StatusMatch, StatusCandidatura>> = {
  entrevista: "entrevista",
  contratado: "aprovada",
  encerrado: "recusada",
};

const TEXTO_SISTEMA: Record<string, (autor: "empresa" | "profissional") => string> = {
  entrevista: () => "A empresa marcou este match como em entrevista.",
  contratado: () => "A empresa marcou este match como contratado. Parabéns!",
  encerrado: (autor) => `${autor === "empresa" ? "A empresa" : "O profissional"} encerrou esta conversa.`,
};

export async function registrarMensagemSistema(match: IMatch, texto: string) {
  const msg = await Mensagem.create({
    matchId: match._id,
    autorTipo: "sistema",
    autorUserId: null,
    texto,
  });
  await Match.updateOne(
    { _id: match._id },
    {
      $set: { ultimaMensagem: { texto, autorTipo: "sistema", em: msg.createdAt } },
      $inc: { "naoLidas.profissional": 1, "naoLidas.empresa": 1 },
    }
  );
}

/**
 * Aplica um status ao match (salva + mensagem de sistema). Idempotente:
 * mesmo status ou match já encerrado → não faz nada e devolve false.
 */
export async function aplicarStatusMatch(
  match: IMatch,
  status: StatusMatch,
  autor: "empresa" | "profissional"
): Promise<boolean> {
  if (match.status === status || match.status === "encerrado") return false;

  match.status = status;
  if (status === "encerrado") match.encerradoPor = autor;
  // Abre o prazo da avaliação mútua.
  if (status === "contratado" && !match.contratadoEm) match.contratadoEm = new Date();
  await match.save();

  const texto = TEXTO_SISTEMA[status]?.(autor);
  if (texto) await registrarMensagemSistema(match, texto);

  // Conta a posição preenchida na vaga (e avisa a empresa ao completar).
  if (status === "contratado") await registrarContratacao(match.vagaId);
  return true;
}

/** Chat mudou → reflete na candidatura ligada (sem notificar: o chat já avisou). */
export async function sincronizarCandidaturaComMatch(match: IMatch, status: StatusMatch): Promise<void> {
  const alvo = MATCH_PARA_CANDIDATURA[status];
  if (!alvo) return;
  // "encerrado" pelo profissional não é recusa da empresa.
  if (status === "encerrado" && match.encerradoPor !== "empresa") return;

  const filtro = match.candidaturaId
    ? { _id: match.candidaturaId }
    : { vagaId: match.vagaId, profissionalId: match.profissionalId };

  await Candidatura.updateOne({ ...filtro, status: { $nin: ["aprovada", "recusada"] } }, { $set: { status: alvo } });
}
