import type { VagaEstruturada } from "./vaga";

/**
 * Converte a vaga estruturada pela IA no estado do formulário de nova vaga.
 * Pura — roda no cliente. Como a vaga é nova, substitui o que estava no
 * formulário; a empresa revisa tudo antes de publicar.
 */

export interface FormVaga {
  titulo: string;
  descricao: string;
  requisitos: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  remoto: boolean;
  salarioTipo: string;
  salarioMin: string;
  salarioMax: string;
  salarioPeriodo: string;
  periodoInicio: string;
  periodoFim: string;
  anosExperienciaMin: string;
  habilidadesDesejadas: string;
  turno: string;
  escala: string;
  posicoes: string;
}

export interface EstadoNovaVaga {
  form: FormVaga;
  especialidadesAceitas: string[];
  afirmativa: string[];
  perguntasTriagem: string[];
}

const numero = (n: number | null) => (n && n > 0 ? String(n) : "");

export function vagaParaFormulario(v: VagaEstruturada, atual: FormVaga): EstadoNovaVaga {
  const fixo = v.salario.tipo === "fixo";
  return {
    form: {
      ...atual,
      titulo: v.titulo,
      descricao: v.descricao,
      requisitos: v.requisitos,
      tipo: v.tipo,
      especialidade: v.especialidade || atual.especialidade,
      cidade: v.cidade ?? atual.cidade,
      estado: v.estado ?? atual.estado,
      remoto: v.remoto,
      salarioTipo: v.salario.tipo,
      // O formulário usa só "máximo" para valor fixo.
      salarioMin: fixo ? "" : numero(v.salario.min),
      salarioMax: fixo ? numero(v.salario.max ?? v.salario.min) : numero(v.salario.max),
      salarioPeriodo: v.salario.periodo,
      periodoInicio: v.periodo.dataInicio ?? "",
      periodoFim: v.periodo.dataFim ?? "",
      anosExperienciaMin: v.anosExperienciaMin > 0 ? String(v.anosExperienciaMin) : "",
      habilidadesDesejadas: v.habilidadesDesejadas.join(", "),
      turno: v.turno ?? "",
      escala: v.escala ?? "",
      posicoes: String(v.posicoes || 1),
    },
    especialidadesAceitas: v.especialidadesAceitas,
    afirmativa: v.afirmativa,
    perguntasTriagem: v.perguntasTriagem,
  };
}
