import { connectDB } from "@/lib/db";
import { escaparICS, formatarDataHoraBR, paraFormatoICS } from "@/lib/datas";
import {
  msgEntrevistaCancelada,
  msgEntrevistaConfirmada,
  msgEntrevistaProposta,
  msgLembreteEntrevista,
  notificar,
  urlAbsoluta,
  type AlvoNotificacao,
} from "@/lib/notificacoes";
import Match, { type IMatch } from "@/models/Match";
import type { Ator } from "./ator";
import { ErroAtor } from "./erros";
import { carregarMatchDoAtor, resumirEntrevista, type EntrevistaDTO } from "./matches";
import { aplicarStatusMatch, registrarMensagemSistema, sincronizarCandidaturaComMatch } from "./status";

/**
 * Agendamento de entrevista dentro do chat: a empresa propõe até 3 horários,
 * o profissional escolhe um, os dois recebem confirmação, .ics e lembrete.
 * Nenhum calendário externo é integrado — o .ics e o link do Google Agenda
 * resolvem sem OAuth.
 */

const MAX_PROPOSTAS = 3;
const DURACAO_MIN = 60;
const HORA_MS = 60 * 60 * 1000;

function outro(match: IMatch, ator: Ator): { alvo: AlvoNotificacao; nome: string; meuNome: string } {
  return ator.tipo === "empresa"
    ? {
        alvo: { tipo: "profissional", perfilId: match.profissionalId },
        nome: match.snapshot.profissionalNome,
        meuNome: match.snapshot.empresaNome,
      }
    : {
        alvo: { tipo: "empresa", perfilId: match.empresaId },
        nome: match.snapshot.empresaNome,
        meuNome: match.snapshot.profissionalNome,
      };
}

function paraData(v: unknown): Date | null {
  if (typeof v !== "string" && !(v instanceof Date)) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function proporEntrevista(
  ator: Ator,
  matchId: string,
  entrada: { propostas: unknown; local?: unknown; observacao?: unknown }
): Promise<EntrevistaDTO> {
  await connectDB();
  if (ator.tipo !== "empresa") throw new ErroAtor(403, "Só a empresa propõe horários.");

  const match = await carregarMatchDoAtor(ator, matchId);
  if (match.status === "encerrado") throw new ErroAtor(409, "Esta conversa foi encerrada.");

  const brutas = Array.isArray(entrada.propostas) ? entrada.propostas : [];
  const agora = Date.now();
  const propostas = brutas
    .map(paraData)
    .filter((d): d is Date => d !== null && d.getTime() > agora + 30 * 60 * 1000)
    .sort((a, b) => a.getTime() - b.getTime())
    .filter((d, i, arr) => i === 0 || d.getTime() !== arr[i - 1].getTime())
    .slice(0, MAX_PROPOSTAS);

  if (!propostas.length) throw new ErroAtor(400, "Informe pelo menos um horário futuro.");

  match.entrevista = {
    propostas,
    escolhida: null,
    local: typeof entrada.local === "string" && entrada.local.trim() ? entrada.local.trim().slice(0, 300) : null,
    observacao:
      typeof entrada.observacao === "string" && entrada.observacao.trim() ? entrada.observacao.trim().slice(0, 500) : null,
    propostaEm: new Date(),
    lembreteEnviadoEm: null,
  };
  await match.save();

  const lista = propostas.map((d) => formatarDataHoraBR(d)).join("; ");
  await registrarMensagemSistema(
    match,
    `${match.snapshot.empresaNome} propôs ${propostas.length === 1 ? "um horário" : `${propostas.length} horários`} de entrevista: ${lista}.`
  );

  const { alvo } = outro(match, ator);
  await notificar(
    alvo,
    msgEntrevistaProposta({
      empresaNome: match.snapshot.empresaNome,
      vagaTitulo: match.snapshot.vagaTitulo,
      quantidade: propostas.length,
      matchId: String(match._id),
    })
  );

  return resumirEntrevista(match)!;
}

export async function escolherHorario(ator: Ator, matchId: string, escolhida: unknown): Promise<EntrevistaDTO> {
  await connectDB();
  if (ator.tipo !== "profissional") throw new ErroAtor(403, "Só o profissional escolhe o horário.");

  const match = await carregarMatchDoAtor(ator, matchId);
  if (match.status === "encerrado") throw new ErroAtor(409, "Esta conversa foi encerrada.");
  if (!match.entrevista?.propostas?.length) throw new ErroAtor(409, "Não há horários propostos.");

  const data = paraData(escolhida);
  const valida = data && match.entrevista.propostas.some((p) => new Date(p).getTime() === data.getTime());
  if (!valida) throw new ErroAtor(400, "Escolha um dos horários propostos.");

  match.entrevista.escolhida = data;
  match.entrevista.lembreteEnviadoEm = null;
  match.markModified("entrevista");
  await match.save();

  await registrarMensagemSistema(match, `Entrevista confirmada: ${formatarDataHoraBR(data)}${match.entrevista.local ? ` · ${match.entrevista.local}` : ""}.`);

  // Entrevista marcada é status do match — e do card no funil.
  if (match.status !== "entrevista") {
    await aplicarStatusMatch(match, "entrevista", "profissional");
    await sincronizarCandidaturaComMatch(match, "entrevista");
  }

  const { alvo, meuNome } = outro(match, ator);
  await notificar(
    alvo,
    msgEntrevistaConfirmada({
      outroNome: meuNome,
      vagaTitulo: match.snapshot.vagaTitulo,
      quando: formatarDataHoraBR(data),
      matchId: String(match._id),
    })
  );

  return resumirEntrevista(match)!;
}

export async function cancelarEntrevista(ator: Ator, matchId: string): Promise<void> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);
  if (!match.entrevista) return;

  match.entrevista = null;
  await match.save();

  const { alvo, meuNome } = outro(match, ator);
  await registrarMensagemSistema(match, `${meuNome} cancelou a entrevista. Combinem um novo horário.`);
  await notificar(alvo, msgEntrevistaCancelada({ outroNome: meuNome, vagaTitulo: match.snapshot.vagaTitulo, matchId: String(match._id) }));
}

/** Arquivo .ics da entrevista confirmada, para qualquer calendário. */
export async function icsDaEntrevista(ator: Ator, matchId: string): Promise<string> {
  await connectDB();
  const match = await carregarMatchDoAtor(ator, matchId);
  const e = match.entrevista;
  if (!e?.escolhida) throw new ErroAtor(404, "Nenhuma entrevista confirmada.");

  const inicio = new Date(e.escolhida);
  const fim = new Date(inicio.getTime() + DURACAO_MIN * 60 * 1000);
  const { nome } = outro(match, ator);
  const url = urlAbsoluta(`/matches/${match._id}`);
  const descricao = [e.observacao, `Conversa no VagaON: ${url}`].filter(Boolean).join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VagaON//Entrevista//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:entrevista-${match._id}@vagaon`,
    `DTSTAMP:${paraFormatoICS(new Date())}`,
    `DTSTART:${paraFormatoICS(inicio)}`,
    `DTEND:${paraFormatoICS(fim)}`,
    `SUMMARY:${escaparICS(`Entrevista — ${match.snapshot.vagaTitulo} (${nome})`)}`,
    ...(e.local ? [`LOCATION:${escaparICS(e.local)}`] : []),
    `DESCRIPTION:${escaparICS(descricao)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/**
 * Lembretes das entrevistas confirmadas nas próximas 24 h (cron diário).
 * Idempotente por `lembreteEnviadoEm`.
 */
export async function enviarLembretesEntrevista(): Promise<{ enviados: number }> {
  await connectDB();
  const agora = new Date();
  const limite = new Date(agora.getTime() + 24 * HORA_MS);

  const matches = await Match.find({
    status: { $ne: "encerrado" },
    "entrevista.escolhida": { $gte: agora, $lte: limite },
    "entrevista.lembreteEnviadoEm": null,
  });

  let enviados = 0;
  for (const match of matches) {
    const e = match.entrevista!;
    const quando = formatarDataHoraBR(e.escolhida!);
    const matchId = String(match._id);
    await Promise.all([
      notificar(
        { tipo: "profissional", perfilId: match.profissionalId },
        msgLembreteEntrevista({ outroNome: match.snapshot.empresaNome, vagaTitulo: match.snapshot.vagaTitulo, quando, local: e.local, matchId })
      ),
      notificar(
        { tipo: "empresa", perfilId: match.empresaId },
        msgLembreteEntrevista({ outroNome: match.snapshot.profissionalNome, vagaTitulo: match.snapshot.vagaTitulo, quando, local: e.local, matchId })
      ),
    ]);
    await Match.updateOne({ _id: match._id }, { $set: { "entrevista.lembreteEnviadoEm": new Date() } });
    enviados++;
  }
  return { enviados };
}
