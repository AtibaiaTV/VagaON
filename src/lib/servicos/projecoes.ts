import { labelEspecialidade } from "@/constants/especialidades";
import type { ResultadoMatch } from "@/lib/match";
import { faixaDoScore } from "@/lib/match";
import { resumoReputacaoPublico, type ReputacaoPublica } from "@/lib/reputacao";

/**
 * O que cada lado pode ver do outro ANTES do match.
 *
 * Isto é a fronteira LGPD do produto: nada de CPF, telefone, e-mail, data de
 * nascimento, CEP, currículo ou LinkedIn no card. Contato só se revela depois
 * do interesse mútuo, em `contatoProfissional`.
 *
 * Usamos Record<string, any> porque entram aqui documentos `.lean()` de
 * formatos ligeiramente diferentes (populados ou não, antigos ou novos).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

export interface ResumoScore {
  total: number;
  faixa: string;
  explicacoes: string[];
  alertas: string[];
  distanciaKm: number | null;
}

export function resumirScore(r: ResultadoMatch): ResumoScore {
  return {
    total: r.total,
    faixa: faixaDoScore(r.total).label,
    explicacoes: r.explicacoes,
    alertas: r.alertas,
    distanciaKm: r.distanciaKm,
  };
}

export interface CardVaga {
  id: string;
  titulo: string;
  descricao: string;
  requisitos: string;
  tipo: string;
  especialidade: string;
  especialidadeLabel: string;
  especialidadesAceitas: string[];
  cidade: string;
  estado: string;
  remoto: boolean;
  salario: { tipo: string; min: number | null; max: number | null; periodo: string };
  periodo: { dataInicio: string | null; dataFim: string | null };
  turno: string | null;
  escala: string | null;
  habilidadesDesejadas: string[];
  anosExperienciaMin: number;
  posicoes: number;
  afirmativa: string[];
  empresa: {
    id: string;
    nome: string;
    logo: string | null;
    setor: string;
    verificada: boolean;
    /** Como os profissionais avaliaram a empresa (null com < 3 avaliações). */
    reputacao: ReputacaoPublica | null;
  };
  criadaEm: string | null;
}

export function paraCardVaga(v: Doc): CardVaga {
  const emp: Doc = v.empresaId && typeof v.empresaId === "object" ? v.empresaId : {};
  return {
    id: String(v._id),
    titulo: v.titulo ?? "",
    descricao: v.descricao ?? "",
    requisitos: v.requisitos ?? "",
    tipo: v.tipo ?? "clt",
    especialidade: v.especialidade ?? "",
    especialidadeLabel: labelEspecialidade(v.especialidade ?? ""),
    especialidadesAceitas: v.especialidadesAceitas ?? [],
    cidade: v.cidade ?? "",
    estado: v.estado ?? "",
    remoto: Boolean(v.remoto),
    salario: {
      tipo: v.salario?.tipo ?? "a_combinar",
      min: v.salario?.min ?? null,
      max: v.salario?.max ?? null,
      periodo: v.salario?.periodo ?? "mes",
    },
    periodo: {
      dataInicio: v.periodo?.dataInicio ? new Date(v.periodo.dataInicio).toISOString() : null,
      dataFim: v.periodo?.dataFim ? new Date(v.periodo.dataFim).toISOString() : null,
    },
    turno: v.turno ?? null,
    escala: v.escala ?? null,
    habilidadesDesejadas: v.habilidadesDesejadas ?? [],
    anosExperienciaMin: v.anosExperienciaMin ?? 0,
    posicoes: v.posicoes ?? 1,
    afirmativa: v.afirmativa ?? [],
    empresa: {
      id: String(emp._id ?? v.empresaId ?? ""),
      nome: emp.nomeFantasia ?? "",
      logo: emp.logo ?? null,
      setor: emp.setor ?? "outros",
      verificada: Boolean(emp.verificada),
      reputacao: resumoReputacaoPublico(emp.reputacao),
    },
    criadaEm: v.createdAt ? new Date(v.createdAt).toISOString() : null,
  };
}

export interface CardProfissional {
  id: string;
  nome: string;
  foto: string | null;
  cidade: string;
  estado: string;
  especialidades: string[];
  especialidadesLabels: string[];
  resumo: string;
  anosExperiencia: number;
  habilidades: string[];
  idiomas: { idioma: string; nivel: string }[];
  disponibilidade: { tipo: string[]; imediata: boolean };
  dispostoViajar: boolean;
  turnos: string[];
  escalas: string[];
  /** Cargos mais recentes, sem nome de empresa — contexto sem expor histórico inteiro. */
  ultimosCargos: string[];
  completude: number;
  /** Modo às cegas da empresa: nome e foto escondidos até o match. */
  oculto: boolean;
  /** Como as empresas avaliaram (null com < 3 avaliações). */
  reputacao: ReputacaoPublica | null;
}

export function paraCardProfissional(p: Doc, opcoes: { oculto?: boolean } = {}): CardProfissional {
  const oculto = opcoes.oculto === true;
  const experiencias: Doc[] = Array.isArray(p.experiencias) ? p.experiencias : [];
  const ultimosCargos = experiencias
    .slice()
    .sort((a, b) => new Date(b.dataInicio ?? 0).getTime() - new Date(a.dataInicio ?? 0).getTime())
    .slice(0, 3)
    .map((e) => e.cargo)
    .filter(Boolean);

  return {
    id: String(p._id),
    nome: oculto ? "Candidato(a)" : (p.nomeCompleto ?? ""),
    foto: oculto ? null : (p.fotoPerfil ?? null),
    oculto,
    reputacao: resumoReputacaoPublico(p.reputacao),
    cidade: p.cidade ?? "",
    estado: p.estado ?? "",
    especialidades: p.especialidades ?? [],
    especialidadesLabels: (p.especialidades ?? []).map(labelEspecialidade),
    resumo: p.resumoProfissional ?? "",
    anosExperiencia: p.anosExperiencia ?? 0,
    habilidades: p.habilidades ?? [],
    idiomas: p.idiomas ?? [],
    disponibilidade: {
      tipo: p.disponibilidade?.tipo ?? [],
      imediata: p.disponibilidade?.imediata ?? true,
    },
    dispostoViajar: Boolean(p.dispostoViajar),
    turnos: p.turnos ?? [],
    escalas: p.escalas ?? [],
    ultimosCargos,
    completude: p.completude ?? 0,
  };
}

/** Contato — só depois do match. */
export interface ContatoProfissional {
  telefone: string;
  email: string;
  linkedinUrl: string | null;
  curriculoUrl: string | null;
}

export function paraContatoProfissional(p: Doc, email: string | null): ContatoProfissional {
  return {
    telefone: p.telefone ?? "",
    email: email ?? "",
    linkedinUrl: p.linkedinUrl ?? null,
    curriculoUrl: p.curriculoUrl ?? null,
  };
}

export interface ContatoEmpresa {
  telefone: string;
  email: string;
  website: string | null;
  endereco: string;
}

export function paraContatoEmpresa(e: Doc): ContatoEmpresa {
  return {
    telefone: e.telefone ?? "",
    email: e.email ?? "",
    website: e.website ?? null,
    endereco: [e.endereco, e.cidade, e.estado].filter(Boolean).join(", "),
  };
}
