import { isValidObjectId, type Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { avaliarMatch, foiEliminado, paraProfissionalMatch, paraVagaMatch } from "@/lib/match";
import { msgNovoMatch, notificar } from "@/lib/notificacoes";
import { notifyRedesaCandidatura } from "@/lib/redesa-webhook";
import Candidatura from "@/models/Candidatura";
import Empresa, { type IEmpresa } from "@/models/Empresa";
import Match, { type IMatch } from "@/models/Match";
import Mensagem from "@/models/Mensagem";
import Profissional, { type IProfissional } from "@/models/Profissional";
import Swipe, { type DirecaoSwipe } from "@/models/Swipe";
import User from "@/models/User";
import Vaga, { type IVaga } from "@/models/Vaga";
import { LIMITE_LIKES_DIA } from "@/constants/match";
import { montarTriagem } from "@/lib/triagem";
import type { Ator } from "./ator";
import { ErroAtor } from "./erros";

export { LIMITE_LIKES_DIA };

const DIRECOES: DirecaoSwipe[] = ["like", "pass", "super"];

export interface EntradaSwipe {
  vagaId: string;
  /** Obrigatório quando quem desliza é a empresa. */
  profissionalId?: string;
  direcao: DirecaoSwipe;
}

export interface SaidaSwipe {
  swipeId: string;
  score: number;
  match: {
    id: string;
    score: number;
    snapshot: IMatch["snapshot"];
  } | null;
}

function ehDuplicado(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

async function verificarLimiteDiario(profissionalId: Types.ObjectId) {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const usados = await Swipe.countDocuments({
    profissionalId,
    autorTipo: "profissional",
    direcao: { $in: ["like", "super"] },
    createdAt: { $gte: inicioDia },
  });

  if (usados >= LIMITE_LIKES_DIA) {
    throw new ErroAtor(429, `Você usou seus ${LIMITE_LIKES_DIA} likes de hoje. Volte amanhã!`);
  }
}

/**
 * Registra uma decisão no deck e, se o outro lado já tinha curtido, fecha o
 * match — criando a candidatura formal para o painel e o webhook continuarem
 * funcionando como sempre.
 */
export async function registrarSwipe(ator: Ator, entrada: EntradaSwipe): Promise<SaidaSwipe> {
  await connectDB();

  if (!DIRECOES.includes(entrada.direcao)) throw new ErroAtor(400, "Direção inválida.");
  if (!isValidObjectId(entrada.vagaId)) throw new ErroAtor(400, "Vaga inválida.");

  const vaga = await Vaga.findById(entrada.vagaId);
  if (!vaga || vaga.status !== "ativa") throw new ErroAtor(404, "Vaga não disponível.");

  let profissional: IProfissional;
  let empresa: IEmpresa;

  if (ator.tipo === "profissional") {
    profissional = ator.profissional;
    const dona = await Empresa.findById(vaga.empresaId);
    if (!dona) throw new ErroAtor(404, "Empresa da vaga não encontrada.");
    empresa = dona;
    if (entrada.direcao !== "pass") await verificarLimiteDiario(profissional._id);
  } else {
    empresa = ator.empresa;
    if (String(vaga.empresaId) !== String(empresa._id)) {
      throw new ErroAtor(403, "Essa vaga não é da sua empresa.");
    }
    if (!entrada.profissionalId || !isValidObjectId(entrada.profissionalId)) {
      throw new ErroAtor(400, "Profissional inválido.");
    }
    const alvo = await Profissional.findById(entrada.profissionalId);
    if (!alvo) throw new ErroAtor(404, "Profissional não encontrado.");
    profissional = alvo;
  }

  // Score no momento da decisão — fica gravado para análise, mesmo que o perfil mude.
  const avaliacao = avaliarMatch(
    paraProfissionalMatch(profissional),
    paraVagaMatch(vaga, empresa.verificada)
  );
  const score = foiEliminado(avaliacao) ? 0 : avaliacao.total;
  const explicacoes = foiEliminado(avaliacao) ? [] : avaliacao.explicacoes;

  let swipeId: string;
  try {
    const swipe = await Swipe.create({
      vagaId: vaga._id,
      profissionalId: profissional._id,
      empresaId: empresa._id,
      autorTipo: ator.tipo,
      direcao: entrada.direcao,
      score,
    });
    swipeId = String(swipe._id);
  } catch (err) {
    if (ehDuplicado(err)) throw new ErroAtor(409, "Você já decidiu sobre este par.");
    throw err;
  }

  const efeitos: Promise<unknown>[] = [];
  if (ator.tipo === "profissional") {
    efeitos.push(
      Profissional.updateOne(
        { _id: profissional._id },
        { $set: { "match.ultimaAtividade": new Date() } }
      )
    );
    if (entrada.direcao !== "pass") {
      efeitos.push(Vaga.updateOne({ _id: vaga._id }, { $inc: { "match.totalLikesRecebidos": 1 } }));
    }
  }
  await Promise.all(efeitos);

  if (entrada.direcao === "pass") return { swipeId, score, match: null };

  const outroLado = ator.tipo === "profissional" ? "empresa" : "profissional";
  const reciproco = await Swipe.exists({
    vagaId: vaga._id,
    profissionalId: profissional._id,
    autorTipo: outroLado,
    direcao: { $in: ["like", "super"] },
  });
  if (!reciproco) return { swipeId, score, match: null };

  const match = await criarMatch({ vaga, profissional, empresa, score, explicacoes });
  return {
    swipeId,
    score,
    match: { id: String(match._id), score: match.score, snapshot: match.snapshot },
  };
}

interface DadosMatch {
  vaga: IVaga;
  profissional: IProfissional;
  empresa: IEmpresa;
  score: number;
  explicacoes: string[];
}

async function criarMatch({ vaga, profissional, empresa, score, explicacoes }: DadosMatch): Promise<IMatch> {
  const existente = await Match.findOne({ vagaId: vaga._id, profissionalId: profissional._id });
  if (existente) return existente;

  // Candidatura formal. Reaproveita se o profissional já tinha se candidatado
  // pelo board — o match só muda o status para "em análise".
  let candidatura = await Candidatura.findOne({
    vagaId: vaga._id,
    profissionalId: profissional._id,
  });
  let candidaturaNova = false;

  // Respostas de triagem dadas no deck viajam no swipe até aqui.
  const swipeProfissional = await Swipe.findOne({
    vagaId: vaga._id,
    profissionalId: profissional._id,
    autorTipo: "profissional",
  })
    .select("respostasTriagem")
    .lean();
  const triagem = montarTriagem(vaga, swipeProfissional?.respostasTriagem);

  if (candidatura) {
    let mudou = false;
    if (candidatura.status === "enviada" || candidatura.status === "visualizada") {
      candidatura.status = "em_analise";
      mudou = true;
    }
    if (!candidatura.triagem && triagem) {
      candidatura.triagem = triagem;
      mudou = true;
    }
    if (mudou) await candidatura.save();
  } else {
    try {
      candidatura = await Candidatura.create({
        vagaId: vaga._id,
        profissionalId: profissional._id,
        empresaId: empresa._id,
        status: "em_analise",
        mensagem: `Match VagaON — aderência de ${score}%`,
        triagem,
        snapshotProfissional: {
          nomeCompleto: profissional.nomeCompleto,
          especialidades: profissional.especialidades,
          cidade: profissional.cidade,
          estado: profissional.estado,
          fotoPerfil: profissional.fotoPerfil ?? null,
        },
      });
      candidaturaNova = true;
      await Vaga.updateOne({ _id: vaga._id }, { $inc: { totalCandidaturas: 1 } });
    } catch (err) {
      if (!ehDuplicado(err)) throw err;
      candidatura = await Candidatura.findOne({ vagaId: vaga._id, profissionalId: profissional._id });
    }
  }

  let match: IMatch;
  try {
    match = await Match.create({
      vagaId: vaga._id,
      profissionalId: profissional._id,
      empresaId: empresa._id,
      score,
      explicacoes,
      candidaturaId: candidatura?._id ?? null,
      snapshot: {
        vagaTitulo: vaga.titulo,
        empresaNome: empresa.nomeFantasia,
        empresaLogo: empresa.logo ?? null,
        profissionalNome: profissional.nomeCompleto,
        profissionalFoto: profissional.fotoPerfil ?? null,
        cidade: vaga.cidade,
        estado: vaga.estado,
      },
      naoLidas: { profissional: 1, empresa: 1 },
    });
  } catch (err) {
    // Dois swipes simultâneos: o índice único garante um match só.
    if (!ehDuplicado(err)) throw err;
    const corrida = await Match.findOne({ vagaId: vaga._id, profissionalId: profissional._id });
    if (!corrida) throw err;
    return corrida;
  }

  await Vaga.updateOne({ _id: vaga._id }, { $inc: { "match.totalMatches": 1 } });

  const texto = `Vocês deram match! ${empresa.nomeFantasia} e ${profissional.nomeCompleto} têm interesse mútuo na vaga "${vaga.titulo}". Que tal começar a conversa?`;
  const abertura = await Mensagem.create({
    matchId: match._id,
    autorTipo: "sistema",
    autorUserId: null,
    texto,
  });
  await Match.updateOne(
    { _id: match._id },
    { $set: { ultimaMensagem: { texto, autorTipo: "sistema", em: abertura.createdAt } } }
  );

  // Os dois lados ficam sabendo na hora — é o que faz alguém voltar ao app.
  const matchId = String(match._id);
  await Promise.all([
    notificar(
      { tipo: "profissional", perfilId: profissional._id },
      msgNovoMatch({ lado: "profissional", outroNome: empresa.nomeFantasia, vagaTitulo: vaga.titulo, matchId })
    ),
    notificar(
      { tipo: "empresa", perfilId: empresa._id },
      msgNovoMatch({ lado: "empresa", outroNome: profissional.nomeCompleto, vagaTitulo: vaga.titulo, matchId })
    ),
  ]);

  // Mesmo contrato do fluxo de candidatura manual — aguardado, pois na Vercel
  // a função encerra assim que a resposta sai.
  if (candidaturaNova && candidatura && empresa.redesaId) {
    const user = await User.findById(profissional.userId).lean();
    await notifyRedesaCandidatura({
      vagaonId: String(vaga._id),
      vagaonCandidaturaId: String(candidatura._id),
      nome: profissional.nomeCompleto,
      email: user?.email || undefined,
      telefone: profissional.telefone || undefined,
      linkedin: profissional.linkedinUrl || undefined,
      curriculoUrl: profissional.curriculoUrl || undefined,
      mensagem: `Match VagaON — aderência de ${score}%`,
    });
  }

  return match;
}
