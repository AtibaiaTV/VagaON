import type { MensagemNotificacao } from "./tipos";

/** Textos de cada evento, em um só lugar. Curtos: viram título de push e assunto de e-mail. */

function trecho(texto: string, max = 90): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1)}…` : limpo;
}

export function msgNovoMatch(p: {
  lado: "profissional" | "empresa";
  outroNome: string;
  vagaTitulo: string;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Deu match! 🎉",
    corpo:
      p.lado === "profissional"
        ? `${p.outroNome} também tem interesse em você para a vaga "${p.vagaTitulo}". Comece a conversa.`
        : `${p.outroNome} também tem interesse na vaga "${p.vagaTitulo}". Comece a conversa.`,
    url: `/matches/${p.matchId}`,
  };
}

export function msgNovaMensagem(p: {
  autorNome: string;
  texto: string;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "mensagem",
    titulo: `Nova mensagem de ${p.autorNome}`,
    corpo: trecho(p.texto),
    url: `/matches/${p.matchId}`,
  };
}

export function msgStatusMatch(p: {
  status: "entrevista" | "contratado" | "encerrado";
  lado: "profissional" | "empresa";
  outroNome: string;
  vagaTitulo: string;
  matchId: string;
}): MensagemNotificacao {
  const corpo =
    p.status === "entrevista"
      ? `${p.outroNome} marcou entrevista para a vaga "${p.vagaTitulo}". Combine os detalhes no chat.`
      : p.status === "contratado"
        ? p.lado === "profissional"
          ? `Parabéns! ${p.outroNome} marcou você como contratado(a) para "${p.vagaTitulo}".`
          : `Você marcou ${p.outroNome} como contratado(a) para "${p.vagaTitulo}".`
        : `${p.outroNome} encerrou a conversa sobre a vaga "${p.vagaTitulo}".`;

  return {
    categoria: "match",
    titulo:
      p.status === "entrevista" ? "Entrevista marcada" : p.status === "contratado" ? "Contratação confirmada" : "Conversa encerrada",
    corpo,
    url: `/matches/${p.matchId}`,
  };
}

export function msgStatusCandidatura(p: {
  status: "enviada" | "visualizada" | "em_analise" | "entrevista" | "aprovada" | "recusada";
  vagaTitulo: string;
  empresaNome: string;
}): MensagemNotificacao | null {
  const textos: Record<string, { titulo: string; corpo: string }> = {
    em_analise: {
      titulo: "Sua candidatura está em análise",
      corpo: `${p.empresaNome} está analisando seu perfil para a vaga "${p.vagaTitulo}".`,
    },
    entrevista: {
      titulo: "Você foi chamado(a) para entrevista! 🎉",
      corpo: `${p.empresaNome} quer entrevistar você para "${p.vagaTitulo}". Combine os detalhes no chat ou aguarde o contato.`,
    },
    aprovada: {
      titulo: "Candidatura aprovada! 🎉",
      corpo: `${p.empresaNome} aprovou sua candidatura para "${p.vagaTitulo}". Fique atento ao contato da empresa.`,
    },
    recusada: {
      titulo: "Atualização da sua candidatura",
      corpo: `${p.empresaNome} seguiu com outros candidatos para "${p.vagaTitulo}". Continue no Descobrir — novas vagas entram todo dia.`,
    },
  };
  const t = textos[p.status];
  if (!t) return null; // "visualizada" não vale um aviso
  return { categoria: "candidatura", titulo: t.titulo, corpo: t.corpo, url: "/candidaturas" };
}

export function msgEntrevistaProposta(p: {
  empresaNome: string;
  vagaTitulo: string;
  quantidade: number;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Horários de entrevista propostos",
    corpo: `${p.empresaNome} propôs ${p.quantidade === 1 ? "um horário" : `${p.quantidade} horários`} de entrevista para "${p.vagaTitulo}". Escolha o melhor para você.`,
    url: `/matches/${p.matchId}`,
  };
}

export function msgEntrevistaConfirmada(p: {
  outroNome: string;
  vagaTitulo: string;
  quando: string;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Entrevista confirmada ✅",
    corpo: `${p.outroNome} confirmou a entrevista para "${p.vagaTitulo}": ${p.quando}.`,
    url: `/matches/${p.matchId}`,
  };
}

export function msgEntrevistaCancelada(p: {
  outroNome: string;
  vagaTitulo: string;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Entrevista cancelada",
    corpo: `${p.outroNome} cancelou a entrevista de "${p.vagaTitulo}". Combinem um novo horário no chat.`,
    url: `/matches/${p.matchId}`,
  };
}

export function msgLembreteEntrevista(p: {
  outroNome: string;
  vagaTitulo: string;
  quando: string;
  local: string | null;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Lembrete: entrevista em breve",
    corpo: `Entrevista com ${p.outroNome} para "${p.vagaTitulo}": ${p.quando}${p.local ? ` · ${p.local}` : ""}.`,
    url: `/matches/${p.matchId}`,
  };
}

export function msgConviteAvaliacao(p: {
  outroNome: string;
  vagaTitulo: string;
  matchId: string;
}): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Como foi trabalhar com " + p.outroNome + "?",
    corpo: `Avalie a experiência em "${p.vagaTitulo}". Leva 1 minuto e só é publicada quando os dois lados avaliam — ou em 14 dias.`,
    url: `/avaliacoes?match=${p.matchId}`,
  };
}

export function msgAvaliacaoPublicada(p: { outroNome: string; vagaTitulo: string }): MensagemNotificacao {
  return {
    categoria: "match",
    titulo: "Você recebeu uma avaliação",
    corpo: `${p.outroNome} avaliou a experiência em "${p.vagaTitulo}". Veja os critérios e, se quiser, responda.`,
    url: "/avaliacoes",
  };
}

export function msgDisputaAvaliacao(p: { quem: string; vagaTitulo: string }): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: "Avaliação contestada",
    corpo: `${p.quem} contestou uma avaliação sobre "${p.vagaTitulo}". Revise em Admin → Avaliações.`,
    url: "/admin/avaliacoes",
  };
}

export function msgNovaCandidatura(p: {
  profissionalNome: string;
  vagaTitulo: string;
  vagaId: string;
}): MensagemNotificacao {
  return {
    categoria: "candidatura",
    titulo: "Nova candidatura",
    corpo: `${p.profissionalNome} se candidatou à vaga "${p.vagaTitulo}".`,
    url: `/vagas/${p.vagaId}`,
  };
}

// ─── Ciclo de vida da vaga e do perfil ──────────────────────────────────────

export function msgPosicoesPreenchidas(p: { vagaTitulo: string; vagaId: string; posicoes: number }): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: p.posicoes === 1 ? "Vaga preenchida?" : `As ${p.posicoes} posições foram preenchidas?`,
    corpo: `Você registrou ${p.posicoes === 1 ? "a contratação" : `${p.posicoes} contratações`} em "${p.vagaTitulo}". Marque a vaga como preenchida para parar de receber candidatos, ou deixe ativa para continuar.`,
    url: `/vagas/${p.vagaId}`,
  };
}

export function msgVagaExpirando(p: { vagaTitulo: string; vagaId: string; dias: number }): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: `Sua vaga expira em ${p.dias} dia${p.dias === 1 ? "" : "s"}`,
    corpo: `"${p.vagaTitulo}" sai do ar em ${p.dias} dia${p.dias === 1 ? "" : "s"}. Se ainda está contratando, renove por mais 30 dias com um clique.`,
    url: `/vagas/${p.vagaId}`,
  };
}

export function msgVagaExpirada(p: { vagaTitulo: string; vagaId: string }): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: "Vaga expirada",
    corpo: `"${p.vagaTitulo}" saiu do ar por prazo. Os candidatos e conversas continuam no funil; reative se ainda estiver contratando.`,
    url: `/vagas/${p.vagaId}`,
  };
}

export function msgVagaFechadaParaCandidato(p: {
  vagaTitulo: string;
  empresaNome: string;
  status: "preenchida" | "encerrada";
}): MensagemNotificacao {
  return {
    categoria: "candidatura",
    titulo: p.status === "preenchida" ? "Vaga preenchida" : "Vaga encerrada",
    corpo:
      p.status === "preenchida"
        ? `${p.empresaNome} preencheu a vaga "${p.vagaTitulo}". Obrigado por participar — continue no Descobrir, novas vagas entram todo dia.`
        : `${p.empresaNome} encerrou a vaga "${p.vagaTitulo}". Continue no Descobrir — novas vagas entram todo dia.`,
    url: "/candidaturas",
  };
}

export function msgPerfilInativoAviso(p: { dias: number }): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: "Seu perfil vai ser pausado",
    corpo: `Você não usa o VagaON há ${p.dias} dias. Para continuar aparecendo para as empresas, é só abrir o app. Sem atividade em 7 dias, pausamos seu perfil.`,
    url: "/perfil",
  };
}

export function msgPerfilPausadoInatividade(): MensagemNotificacao {
  return {
    categoria: "sistema",
    titulo: "Perfil pausado por inatividade",
    corpo: "Seu perfil saiu do Descobrir das empresas. Reative em um toque quando quiser voltar a receber vagas.",
    url: "/perfil",
  };
}
