import { paraSalarioMensal } from "@/constants/match";
import { menorDistancia, notaDistancia, raioEfetivoKm, type PontoDoProfissional } from "./geo";
import { CONFIANCA, MULTIPLICADOR, PESOS, TETO_ESPECIALIDADE, fatorAmplitude } from "./pesos";
import {
  coberturaHabilidades,
  explicarAderencia,
  melhorAderencia,
} from "./proximidade";
import type {
  Avaliacao,
  DimensaoId,
  ProfissionalMatch,
  ResultadoDimensao,
  ResultadoMatch,
  VagaMatch,
} from "./tipos";

/**
 * Motor de pontuação profissional × vaga.
 *
 * Função pura: mesmos argumentos, mesmo resultado. Toda a calibragem vive em
 * `pesos.ts`, e cada dimensão devolve também a frase que justifica a nota —
 * a interface nunca mostra um número sem explicar de onde ele veio.
 *
 * Dimensão que não pode ser avaliada devolve `nota: null` e tem o peso
 * redistribuído. Sem isso, uma vaga com salário "a combinar" e sem lista de
 * habilidades teria teto de 82/100 contra qualquer candidato do mundo.
 */

const DIA_MS = 1000 * 60 * 60 * 24;

function paraData(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function limitar(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
}

function dim(
  id: DimensaoId,
  nota: number | null,
  explicacao: string | null = null,
  alerta: string | null = null
): ResultadoDimensao {
  return { id, nota, peso: PESOS[id], explicacao, alerta };
}

// ─── Dimensões ────────────────────────────────────────────────────────────────

function avaliarEspecialidade(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  if (!p.especialidades?.length) {
    return dim("especialidade", null, null, "Perfil sem especialidade definida");
  }

  const aceitas = [v.especialidade, ...(v.especialidadesAceitas ?? [])].filter(Boolean);
  const m = melhorAderencia(p.especialidades, aceitas);

  // Perfil com especialidades demais diz pouco sobre o cargo — desconta.
  const amplitude = fatorAmplitude(p.especialidades.length);
  const nota = m.nota * amplitude;

  const alerta =
    m.nota < 0.45
      ? "Cargo fora da sua área principal"
      : amplitude < 1
        ? `Perfil lista ${p.especialidades.length} especialidades — aderência de cargo reduzida`
        : null;

  return dim("especialidade", nota, m.nota >= 0.45 ? explicarAderencia(m) : null, alerta);
}

/** Cidade onde mora + cidades de interesse, só as que têm coordenadas. */
function pontosDe(p: ProfissionalMatch): PontoDoProfissional[] {
  const pontos: PontoDoProfissional[] = [];
  if (p.coords) pontos.push({ coords: p.coords, cidadeInteresse: null });
  for (const c of p.cidadesInteresse ?? []) pontos.push({ coords: c.coords, cidadeInteresse: c.cidade });
  return pontos;
}

function avaliarLocalizacao(
  p: ProfissionalMatch,
  v: VagaMatch
): { dimensao: ResultadoDimensao; distancia: number | null } {
  if (v.remoto) {
    return { dimensao: dim("localizacao", 1, "Vaga remota"), distancia: null };
  }

  // Perfil sem cidade nem estado: para trabalho presencial isso é um
  // negativo real, não uma lacuna neutra — a empresa não sabe se dá para ir.
  if (!p.coords && !p.estado) {
    return {
      dimensao: dim("localizacao", 0.3, null, "Localização não informada no perfil"),
      distancia: null,
    };
  }

  const pontos = pontosDe(p);
  if (!pontos.length || !v.coords) {
    // Sem coordenadas, o melhor que dá para afirmar é "mesmo estado".
    if (p.estado && v.estado) {
      const mesmo = p.estado.toUpperCase() === v.estado.toUpperCase();
      return {
        dimensao: dim(
          "localizacao",
          mesmo ? 0.6 : 0.15,
          mesmo ? `Mesma UF (${v.estado})` : null,
          mesmo ? null : "Em outro estado"
        ),
        distancia: null,
      };
    }
    return { dimensao: dim("localizacao", null), distancia: null };
  }

  // Menor distância entre a vaga e qualquer cidade do profissional (a de casa
  // ou uma de interesse): quem quer mudar para a cidade da vaga não é penalizado.
  const melhor = menorDistancia(pontos, v.coords)!;
  const d = melhor.km;
  const raio = raioEfetivoKm(p.raioKm, p.dispostoViajar);
  let nota = notaDistancia(d, raio);
  const deInteresse = melhor.ponto.cidadeInteresse;

  let explicacao: string | null = null;
  if (deInteresse) {
    explicacao = d <= 5 ? `Em ${deInteresse}, cidade de interesse` : `A ${d} km de ${deInteresse}, cidade de interesse`;
  } else if (d <= 5) explicacao = "Na sua região";
  else if (nota >= 0.55) explicacao = `A ${d} km de distância`;

  let alerta =
    nota < 0.35 ? `A ${d} km — além do seu raio de ${Math.round(raio)} km` : null;

  // Raio da vaga: a empresa disse até onde aceita candidatos. Além dele a
  // nota cai pela metade (a eliminação dura fica em `eliminar`, a 1,5×).
  if (v.raioKm && d > v.raioKm) {
    nota *= 0.5;
    alerta = `A ${d} km — a vaga aceita candidatos até ${v.raioKm} km`;
  }

  return { dimensao: dim("localizacao", nota, explicacao, alerta), distancia: d };
}

function avaliarExperiencia(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  const exigido = v.anosExperienciaMin ?? 0;

  // Vaga sem exigência não diferencia candidatos — redistribui o peso.
  if (exigido <= 0) return dim("experiencia", null);

  const anos = p.anosExperiencia ?? 0;
  const nota = limitar(anos / exigido);

  if (nota >= 1) {
    return dim("experiencia", 1, `${anos} anos de experiência (vaga pede ${exigido})`);
  }
  return dim(
    "experiencia",
    nota,
    null,
    `Vaga pede ${exigido} anos; seu perfil registra ${anos}`
  );
}

function avaliarDisponibilidade(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  const tipos = p.disponibilidade?.tipo ?? [];
  const notaTipo = tipos.length ? (tipos.includes(v.tipo) ? 1 : 0.25) : null;

  const inicio = paraData(v.periodo?.dataInicio);
  const disponivel = paraData(p.disponibilidade?.dataDisponivel);

  // Sem tipo de contrato nem data, o perfil nunca preencheu disponibilidade:
  // o `imediata: true` é só o default do schema e não pode valer nota cheia.
  if (!tipos.length && !disponivel) return dim("disponibilidade", null);

  let notaData: number | null;
  if (p.disponibilidade?.imediata) notaData = 1;
  else if (!disponivel) notaData = null;
  else if (!inicio) notaData = 0.8; // vaga sem data definida: quase sempre negociável
  else if (disponivel.getTime() <= inicio.getTime()) notaData = 1;
  else {
    const diasAtraso = (disponivel.getTime() - inicio.getTime()) / DIA_MS;
    notaData = limitar(1 - diasAtraso / 60);
  }

  const partes = [
    { nota: notaTipo, peso: 0.6 },
    { nota: notaData, peso: 0.4 },
  ].filter((x): x is { nota: number; peso: number } => x.nota !== null);

  if (!partes.length) return dim("disponibilidade", null);

  const somaPesos = partes.reduce((a, x) => a + x.peso, 0);
  const nota = partes.reduce((a, x) => a + x.nota * x.peso, 0) / somaPesos;

  const tipoBate = notaTipo === 1;
  const explicacao = tipoBate && notaData !== null && notaData >= 1
    ? "Disponível para o formato e a data da vaga"
    : tipoBate
      ? "Aceita esse tipo de contrato"
      : null;

  const alerta = notaTipo !== null && notaTipo < 1
    ? "Formato de contrato diferente do que você marcou"
    : notaData !== null && notaData < 0.6
      ? "Vaga começa antes da sua disponibilidade"
      : null;

  return dim("disponibilidade", nota, explicacao, alerta);
}

function avaliarSalario(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  if (v.salario?.tipo === "a_combinar") return dim("salario", null);

  const pretensao = paraSalarioMensal(p.pretensaoSalarial?.min, p.pretensaoSalarial?.periodo);
  const teto = paraSalarioMensal(v.salario?.max ?? v.salario?.min, v.salario?.periodo);

  if (pretensao === null || teto === null) return dim("salario", null);

  if (teto >= pretensao) {
    return dim("salario", 1, "Salário dentro da sua pretensão");
  }

  const nota = limitar(teto / pretensao);
  const faltam = Math.round(((pretensao - teto) / pretensao) * 100);
  return dim("salario", nota, null, `Oferta ~${faltam}% abaixo da sua pretensão`);
}

function avaliarHabilidades(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  const desejadas = v.habilidadesDesejadas ?? [];
  if (!desejadas.length) return dim("habilidades", null);

  const { nota, atendidas } = coberturaHabilidades(p.habilidades ?? [], desejadas);

  if (nota >= 0.99) {
    return dim("habilidades", nota, "Tem todas as habilidades pedidas");
  }
  if (atendidas.length) {
    return dim(
      "habilidades",
      nota,
      `${atendidas.length} de ${desejadas.length} habilidades pedidas: ${atendidas.slice(0, 3).join(", ")}`
    );
  }
  return dim("habilidades", nota, null, "Nenhuma das habilidades pedidas está no seu perfil");
}

function avaliarTurnoEscala(p: ProfissionalMatch, v: VagaMatch): ResultadoDimensao {
  const notaTurno =
    v.turno && p.turnos?.length ? (p.turnos.includes(v.turno) ? 1 : 0.3) : null;

  const notaEscala =
    v.escala && p.escalas?.length
      ? p.escalas.includes("flexivel") || p.escalas.includes(v.escala)
        ? 1
        : 0.4
      : null;

  const partes = [notaTurno, notaEscala].filter((n): n is number => n !== null);
  if (!partes.length) return dim("turnoEscala", null);

  const nota = partes.reduce((a, b) => a + b, 0) / partes.length;

  return dim(
    "turnoEscala",
    nota,
    nota >= 0.99 ? "Turno e escala compatíveis" : null,
    nota < 0.5 ? "Turno ou escala diferente da sua preferência" : null
  );
}

// ─── Eliminatórias ────────────────────────────────────────────────────────────

/**
 * Filtros duros aplicados antes de pontuar. Só entram aqui casos em que
 * mostrar o card seria desperdício de swipe para os dois lados.
 */
function eliminar(p: ProfissionalMatch, v: VagaMatch): string | null {
  // Sem especialidade não há o que comparar — e é o que o /descobrir também exige.
  if (!p.especialidades?.length) return "Perfil sem especialidade definida";

  if (!v.remoto && v.coords) {
    const melhor = menorDistancia(pontosDe(p), v.coords);
    const limite = raioEfetivoKm(p.raioKm, p.dispostoViajar) * 1.5;
    if (melhor && melhor.km > limite) return `Distância de ${melhor.km} km excede o limite de deslocamento`;
    // O raio da vaga vale mesmo para quem se diz disposto a viajar: é a empresa quem decide.
    if (melhor && v.raioKm && melhor.km > v.raioKm * 1.5) {
      return `Distância de ${melhor.km} km — a vaga aceita candidatos até ${v.raioKm} km`;
    }
  }

  if (p.especialidades?.length) {
    const aceitas = [v.especialidade, ...(v.especialidadesAceitas ?? [])].filter(Boolean);
    if (melhorAderencia(p.especialidades, aceitas).nota === 0) {
      return "Nenhuma relação entre as especialidades";
    }
  }

  return null;
}

// ─── Motor ────────────────────────────────────────────────────────────────────

function calcularMultiplicador(p: ProfissionalMatch, v: VagaMatch): number {
  let m = 1;

  // Completude puxa levemente para os dois lados: perfil vazio rende menos.
  const c = limitar((p.completude ?? 0) / 100);
  m += MULTIPLICADOR.completude * (c * 2 - 1);

  if (v.empresaVerificada) m += MULTIPLICADOR.empresaVerificada;

  const ultima = paraData(p.ultimaAtividade);
  if (ultima) {
    const dias = (Date.now() - ultima.getTime()) / DIA_MS;
    const frescor = limitar(1 - dias / MULTIPLICADOR.diasAtividade);
    m += MULTIPLICADOR.atividadeRecente * frescor;
  }

  // Reputação dos dois lados, simétrica: (média − 3) / 2 vai de −1 a +1.
  if (p.reputacao) m += MULTIPLICADOR.reputacao * ((p.reputacao.media - 3) / 2);
  if (v.empresaReputacao) m += MULTIPLICADOR.reputacao * ((v.empresaReputacao.media - 3) / 2);

  return limitar(m, MULTIPLICADOR.min, MULTIPLICADOR.max);
}

export function avaliarMatch(p: ProfissionalMatch, v: VagaMatch): Avaliacao {
  const motivo = eliminar(p, v);
  if (motivo) return { eliminado: true, motivo };

  const local = avaliarLocalizacao(p, v);
  const especialidade = avaliarEspecialidade(p, v);

  const dimensoes: ResultadoDimensao[] = [
    especialidade,
    local.dimensao,
    avaliarExperiencia(p, v),
    avaliarDisponibilidade(p, v),
    avaliarSalario(p, v),
    avaliarHabilidades(p, v),
    avaliarTurnoEscala(p, v),
  ];

  // Redistribuição: só as dimensões avaliáveis dividem os 100 pontos.
  const avaliaveis = dimensoes.filter(
    (d): d is ResultadoDimensao & { nota: number } => d.nota !== null
  );
  const pesoTotal = avaliaveis.reduce((a, d) => a + d.peso, 0);

  const media = pesoTotal
    ? avaliaveis.reduce((a, d) => a + d.nota * d.peso, 0) / pesoTotal
    : 0;

  // O cargo limita o teto: nada além dele leva um garçom a "match forte" para chef.
  const teto = especialidade.nota === null
    ? 1
    : TETO_ESPECIALIDADE.base + TETO_ESPECIALIDADE.escala * especialidade.nota;

  // Confiança: quanto do peso total deu para avaliar. Redistribuir sem piso
  // fazia perfil vazio pontuar 100 só com o default de disponibilidade — o
  // score exibido precisa dizer "só consigo confirmar parte da aderência".
  const pesoMaximo = Object.values(PESOS).reduce((a, b) => a + b, 0);
  const confianca = CONFIANCA.minimo + (1 - CONFIANCA.minimo) * (pesoTotal / pesoMaximo);
  const base = Math.min(media, teto) * confianca;

  const total = Math.round(limitar(base) * 100);

  // Ordenação: boost de perfil sobre a mesma base. Não altera o número exibido
  // — só quem aparece antes. Sem clamp em 100 de propósito: é aqui que os
  // empates do topo precisam se resolver.
  const prioridade = Math.round(base * calcularMultiplicador(p, v) * 1000) / 10;

  const explicacoes = avaliaveis
    .filter((d) => d.explicacao && d.nota >= 0.7)
    .sort((a, b) => b.nota * b.peso - a.nota * a.peso)
    .slice(0, 3)
    .map((d) => d.explicacao as string);

  const alertas = dimensoes
    .map((d) => d.alerta)
    .filter((a): a is string => Boolean(a));

  return { total, prioridade, dimensoes, explicacoes, alertas, distanciaKm: local.distancia };
}

/** Ordena pela prioridade (com boost); empate resolve pela aderência pura. */
function porPrioridade(a: ResultadoMatch, b: ResultadoMatch): number {
  return b.prioridade - a.prioridade || b.total - a.total;
}

/** Avalia um profissional contra várias vagas, já ordenado do melhor ao pior. */
export function ranquearVagas(
  p: ProfissionalMatch,
  vagas: VagaMatch[]
): { vaga: VagaMatch; resultado: ResultadoMatch }[] {
  const saida: { vaga: VagaMatch; resultado: ResultadoMatch }[] = [];
  for (const vaga of vagas) {
    const r = avaliarMatch(p, vaga);
    if (!("eliminado" in r)) saida.push({ vaga, resultado: r });
  }
  return saida.sort((a, b) => porPrioridade(a.resultado, b.resultado));
}

/** Avalia vários profissionais contra uma vaga, já ordenado do melhor ao pior. */
export function ranquearProfissionais(
  vaga: VagaMatch,
  profissionais: ProfissionalMatch[]
): { profissional: ProfissionalMatch; resultado: ResultadoMatch }[] {
  const saida: { profissional: ProfissionalMatch; resultado: ResultadoMatch }[] = [];
  for (const profissional of profissionais) {
    const r = avaliarMatch(profissional, vaga);
    if (!("eliminado" in r)) saida.push({ profissional, resultado: r });
  }
  return saida.sort((a, b) => porPrioridade(a.resultado, b.resultado));
}
