import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import { resumirTriagem } from "@/lib/ia/triagem";
import { montarTriagem } from "@/lib/triagem";
import Candidatura, { type ITriagem, type ITriagemIA } from "@/models/Candidatura";
import Swipe from "@/models/Swipe";
import Vaga from "@/models/Vaga";
import type { Ator } from "./ator";
import { ErroAtor } from "./erros";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

/**
 * Respostas dadas no deck, logo depois do like. Se já existe candidatura
 * para o par (a pessoa se candidatou pelo site antes), grava nela; senão
 * fica no swipe e vai para a candidatura quando o match fechar.
 */
export async function responderTriagemDeck(
  ator: Ator,
  vagaId: string,
  respostas: unknown
): Promise<{ destino: "candidatura" | "swipe" }> {
  if (ator.tipo !== "profissional") throw new ErroAtor(403, "Disponível apenas para profissionais.");
  if (!isValidObjectId(vagaId)) throw new ErroAtor(400, "Vaga inválida.");
  await connectDB();

  const vaga = await Vaga.findById(vagaId).select("perguntasTriagem status").lean();
  if (!vaga) throw new ErroAtor(404, "Vaga não encontrada.");
  const triagem = montarTriagem(vaga, respostas);
  if (!triagem) throw new ErroAtor(400, "Responda pelo menos uma pergunta.");

  const profissionalId = ator.profissional._id;
  const candidatura = await Candidatura.findOne({ vagaId: vaga._id, profissionalId });
  if (candidatura) {
    candidatura.triagem = triagem;
    await candidatura.save();
    return { destino: "candidatura" };
  }

  const swipe = await Swipe.findOneAndUpdate(
    { vagaId: vaga._id, profissionalId, autorTipo: "profissional", direcao: { $in: ["like", "super"] } },
    { $set: { respostasTriagem: triagem.respostas } }
  );
  if (!swipe) throw new ErroAtor(404, "Demonstre interesse na vaga antes de responder.");
  return { destino: "swipe" };
}

/**
 * Gera (ou devolve, se já existe) o resumo das respostas para o card do funil.
 * Chamado sob demanda pelo Kanban — nada é gerado enquanto a empresa não abre
 * a vaga, e cada candidatura é resumida uma vez só.
 */
export async function gerarResumoTriagem(
  empresa: Doc,
  candidaturaId: string,
  opcoes: { forcar?: boolean } = {}
): Promise<ITriagemIA> {
  await connectDB();
  if (!isValidObjectId(candidaturaId)) throw new ErroAtor(400, "Candidatura inválida.");

  const candidatura = await Candidatura.findById(candidaturaId);
  if (!candidatura) throw new ErroAtor(404, "Candidatura não encontrada.");
  if (String(candidatura.empresaId) !== String(empresa._id)) throw new ErroAtor(403, "Sem permissão.");

  const triagem = candidatura.triagem;
  if (!triagem || !triagem.respostas.some(Boolean)) throw new ErroAtor(400, "Este candidato não respondeu à triagem.");
  if (triagem.ia && !opcoes.forcar) return triagem.ia;

  const vaga = await Vaga.findById(candidatura.vagaId).select("titulo descricao tipo").lean();
  const { dados, uso } = await resumirTriagem({
    vagaTitulo: vaga?.titulo ?? "",
    vagaDescricao: vaga?.descricao ?? "",
    tipo: vaga?.tipo ?? "",
    perguntas: triagem.perguntas,
    respostas: triagem.respostas,
  });

  const ia: ITriagemIA = { ...dados, modelo: uso.modelo, geradoEm: new Date() };
  candidatura.triagem = { ...triagem, ia } as ITriagem;
  candidatura.markModified("triagem");
  await candidatura.save();
  return ia;
}

export interface TriagemKanban {
  perguntas: string[];
  respostas: string[];
  ia: {
    resumo: string;
    pontosFortes: string[];
    ressalvas: string[];
    nota: number;
    recomendaEntrevista: boolean;
  } | null;
}

export function triagemParaKanban(t: Doc | null | undefined): TriagemKanban | null {
  if (!t || !Array.isArray(t.perguntas) || !t.perguntas.length) return null;
  return {
    perguntas: t.perguntas,
    respostas: Array.isArray(t.respostas) ? t.respostas : [],
    ia: t.ia
      ? {
          resumo: t.ia.resumo ?? "",
          pontosFortes: t.ia.pontosFortes ?? [],
          ressalvas: t.ia.ressalvas ?? [],
          nota: t.ia.nota ?? 3,
          recomendaEntrevista: Boolean(t.ia.recomendaEntrevista),
        }
      : null,
  };
}
