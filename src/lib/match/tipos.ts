/** Contratos do motor de match. Nada aqui depende de Mongoose ou do Next. */

export type TipoContrato = "clt" | "temporario" | "sazonal";
export type PeriodoSalario = "hora" | "dia" | "mes";

/** Projeção mínima de um profissional para pontuar. */
export interface ProfissionalMatch {
  _id: string;
  especialidades: string[];
  cidade: string;
  estado: string;
  coords: { lat: number; lng: number } | null;
  raioKm: number;
  dispostoViajar: boolean;
  disponibilidade: {
    tipo: string[];
    imediata: boolean;
    dataDisponivel: Date | string | null;
  };
  anosExperiencia: number;
  habilidades: string[];
  idiomas: { idioma: string; nivel: string }[];
  pretensaoSalarial: { min: number | null; periodo: PeriodoSalario };
  turnos: string[];
  escalas: string[];
  completude: number;
  ultimaAtividade: Date | string | null;
}

/** Projeção mínima de uma vaga para pontuar. */
export interface VagaMatch {
  _id: string;
  especialidade: string;
  especialidadesAceitas: string[];
  cidade: string;
  estado: string;
  coords: { lat: number; lng: number } | null;
  remoto: boolean;
  tipo: TipoContrato;
  periodo: { dataInicio: Date | string | null; dataFim: Date | string | null };
  anosExperienciaMin: number;
  habilidadesDesejadas: string[];
  idiomasDesejados: string[];
  salario: {
    tipo: "fixo" | "faixa" | "a_combinar";
    min: number | null;
    max: number | null;
    periodo: PeriodoSalario;
  };
  turno: string | null;
  escala: string | null;
  empresaVerificada: boolean;
}

export type DimensaoId =
  | "especialidade"
  | "localizacao"
  | "experiencia"
  | "disponibilidade"
  | "salario"
  | "habilidades"
  | "turnoEscala";

/**
 * Resultado de uma dimensão.
 * `nota: null` significa "não dá para avaliar" — o peso é redistribuído entre
 * as demais em vez de penalizar. Sem isso, uma vaga que não preencheu
 * habilidades desejadas teria teto de score para todo mundo.
 */
export interface ResultadoDimensao {
  id: DimensaoId;
  nota: number | null;
  peso: number;
  /** Frase curta em 1ª pessoa mostrada no card quando a nota é alta. */
  explicacao: string | null;
  /** Frase de ressalva mostrada quando a nota é baixa mas não elimina. */
  alerta: string | null;
}

export interface ResultadoMatch {
  /** Aderência pura, 0–100. É o número exibido no card. */
  total: number;
  /**
   * `total` ajustado por completude, verificação e atividade recente.
   * Serve SÓ para ordenar o feed — nunca é exibido, para não mascarar
   * lacunas reais de aderência com bônus de perfil.
   */
  prioridade: number;
  dimensoes: ResultadoDimensao[];
  /** Até 3 frases explicando a favor do match, da mais forte para a mais fraca. */
  explicacoes: string[];
  /** Ressalvas relevantes (salário abaixo da pretensão, distância etc.). */
  alertas: string[];
  /** Distância em km, quando ambos os lados têm coordenadas. */
  distanciaKm: number | null;
}

export interface ResultadoEliminacao {
  eliminado: true;
  motivo: string;
}

export type Avaliacao = ResultadoMatch | ResultadoEliminacao;

export function foiEliminado(a: Avaliacao): a is ResultadoEliminacao {
  return (a as ResultadoEliminacao).eliminado === true;
}
