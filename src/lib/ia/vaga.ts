import { z } from "zod";
import { AFIRMATIVA_VALUES, ESCALA_VALUES, TURNO_VALUES } from "@/constants/match";
import { extrairEstruturado } from "./cliente";
import { dataHojeBR, filtrarEspecialidades, isoHoje, normalizarUF, textoTaxonomiaEspecialidades, textoVocabulario } from "./taxonomia";

/**
 * "preciso de 2 garçons pro sábado, 6x1, 150 por dia, Jaguariúna" → vaga
 * estruturada para o formulário. A empresa revisa antes de publicar.
 */

export const VagaEstruturadaSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  requisitos: z.string(),
  tipo: z.enum(["clt", "temporario", "sazonal"]),
  especialidade: z.string(),
  especialidadesAceitas: z.array(z.string()),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  remoto: z.boolean(),
  salario: z.object({
    tipo: z.enum(["fixo", "faixa", "a_combinar"]),
    min: z.number().nullable(),
    max: z.number().nullable(),
    periodo: z.enum(["hora", "dia", "mes"]),
  }),
  periodo: z.object({
    /** AAAA-MM-DD ou null. */
    dataInicio: z.string().nullable(),
    dataFim: z.string().nullable(),
  }),
  anosExperienciaMin: z.number(),
  habilidadesDesejadas: z.array(z.string()),
  turno: z.string().nullable(),
  escala: z.string().nullable(),
  posicoes: z.number(),
  afirmativa: z.array(z.string()),
  /** Até 3 perguntas de triagem curtas, específicas para esta vaga. */
  perguntasTriagem: z.array(z.string()),
  /** O que foi assumido por falta de informação — a empresa confere. */
  suposicoes: z.array(z.string()),
});

export type VagaEstruturada = z.infer<typeof VagaEstruturadaSchema>;

const SYSTEM = `Você transforma um pedido informal de um dono de restaurante, hotel, bar ou buffet no Brasil em uma vaga estruturada para o VagaON, uma plataforma de vagas de gastronomia, hotelaria e eventos.

Regras:
- Use SOMENTE as chaves da taxonomia abaixo em "especialidade" (a principal) e "especialidadesAceitas" (outras que também servem, até 3, sem repetir a principal).
- "titulo": curto e específico, começando pelo cargo (ex.: "Garçom para sábado — evento"). "descricao": 3 a 6 frases em português claro, tom profissional e acolhedor, com o que a pessoa vai fazer e o contexto — sem inventar benefícios ou valores que não foram ditos. "requisitos": uma linha por item, só o que foi pedido ou é padrão inegociável do cargo (ex.: experiência mínima citada).
- "tipo": bico/diária/um dia/fim de semana → temporario; temporada/evento/alta estação/festas → sazonal; fixo/carteira/mensal → clt. Na dúvida, temporario.
- Salário: "150 por dia" → tipo fixo, max 150, periodo dia. "de 2 a 3 mil" → faixa. Sem valor → a_combinar com min/max null. Valores em reais, número puro.
- Datas: "sábado" é o próximo sábado a partir de hoje; "dezembro a fevereiro" é o próximo intervalo futuro. Use AAAA-MM-DD. Sem data → null.
- "posicoes": quantidade pedida (padrão 1). "anosExperienciaMin": só se citado, senão 0.
- "turno"/"escala": chaves do vocabulário ou null. "afirmativa": só se o pedido citar um grupo (ex.: "vaga PCD").
- "cidade"/"estado": se o pedido não diz, use os dados da empresa informados; se nem isso, null.
- "perguntasTriagem": até 3 perguntas curtas e objetivas que ajudem a filtrar candidatos PARA ESTA vaga (ex.: "Você tem disponibilidade neste sábado das 18h à 1h?"). Nada genérico, nada sobre idade, saúde, família, religião ou aparência.
- "suposicoes": liste em português tudo que você decidiu por falta de informação (ex.: "assumi que é presencial em Jaguariúna", "assumi 1 posição").

${textoVocabulario()}

# Taxonomia de especialidades (chave: nome)
${textoTaxonomiaEspecialidades()}`;

export interface ContextoEmpresa {
  nomeFantasia?: string | null;
  setor?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export async function estruturarVaga(frase: string, empresa: ContextoEmpresa) {
  const contexto = [
    `Hoje é ${dataHojeBR()} (${isoHoje()}).`,
    empresa.nomeFantasia ? `Empresa: ${empresa.nomeFantasia}${empresa.setor ? ` (${empresa.setor})` : ""}.` : null,
    empresa.cidade || empresa.estado ? `Local da empresa: ${[empresa.cidade, empresa.estado].filter(Boolean).join("/")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const r = await extrairEstruturado(VagaEstruturadaSchema, {
    system: SYSTEM,
    conteudo: [{ type: "text", text: `${contexto}\n\nPedido da empresa:\n"""${frase.trim()}"""\n\nEstruture a vaga.` }],
    esforco: "medium",
  });

  const d = r.dados;
  const [especialidade] = filtrarEspecialidades([d.especialidade], 1);
  const aceitas = filtrarEspecialidades(d.especialidadesAceitas, 3).filter((e) => e !== especialidade);
  const data = (v: string | null) => (/^\d{4}-\d{2}-\d{2}$/.test(v ?? "") ? v : null);

  return {
    ...r,
    dados: {
      ...d,
      titulo: d.titulo.trim().slice(0, 120),
      especialidade: especialidade ?? "",
      especialidadesAceitas: aceitas,
      estado: normalizarUF(d.estado) ?? normalizarUF(empresa.estado),
      cidade: d.cidade?.trim() || empresa.cidade || null,
      turno: d.turno && (TURNO_VALUES as readonly string[]).includes(d.turno) ? d.turno : null,
      escala: d.escala && (ESCALA_VALUES as readonly string[]).includes(d.escala) ? d.escala : null,
      afirmativa: d.afirmativa.filter((a) => (AFIRMATIVA_VALUES as readonly string[]).includes(a)),
      posicoes: Math.max(1, Math.min(100, Math.round(d.posicoes || 1))),
      anosExperienciaMin: Math.max(0, Math.min(40, Math.round(d.anosExperienciaMin || 0))),
      habilidadesDesejadas: d.habilidadesDesejadas.map((h) => h.trim()).filter(Boolean).slice(0, 10),
      perguntasTriagem: d.perguntasTriagem.map((p) => p.trim()).filter(Boolean).slice(0, 3),
      periodo: { dataInicio: data(d.periodo.dataInicio), dataFim: data(d.periodo.dataFim) },
      salario: {
        ...d.salario,
        min: d.salario.min && d.salario.min > 0 ? d.salario.min : null,
        max: d.salario.max && d.salario.max > 0 ? d.salario.max : null,
      },
    },
  };
}
