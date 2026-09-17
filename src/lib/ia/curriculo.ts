import { z } from "zod";
import { NIVEL_IDIOMA_VALUES } from "@/constants/match";
import { extrairEstruturado, type BlocoEntrada } from "./cliente";
import { filtrarEspecialidades, normalizarUF, textoTaxonomiaEspecialidades, textoVocabulario } from "./taxonomia";

/**
 * Currículo (PDF, foto ou texto colado) → campos do perfil profissional.
 * O resultado é uma SUGESTÃO: a pessoa revisa e salva. Nada é gravado aqui.
 */

const ExperienciaSchema = z.object({
  cargo: z.string(),
  empresa: z.string(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  /** AAAA-MM. null quando não dá para saber. */
  dataInicio: z.string().nullable(),
  /** AAAA-MM; null = emprego atual ou desconhecido. */
  dataFim: z.string().nullable(),
  atual: z.boolean(),
  descricao: z.string().nullable(),
});

export const PerfilExtraidoSchema = z.object({
  nomeCompleto: z.string().nullable(),
  telefone: z.string().nullable(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  resumoProfissional: z.string().nullable(),
  /** Chaves da taxonomia, da mais relevante para a menos. */
  especialidades: z.array(z.string()),
  habilidades: z.array(z.string()),
  experiencias: z.array(ExperienciaSchema),
  /** Graduações, cursos técnicos e cursos livres relevantes. */
  formacao: z.array(z.object({ curso: z.string(), instituicao: z.string().nullable(), ano: z.string().nullable() })),
  idiomas: z.array(z.object({ idioma: z.string(), nivel: z.string() })),
  confianca: z.enum(["alta", "media", "baixa"]),
  /** O que não deu para determinar ou ficou ambíguo — mostrado à pessoa. */
  observacoes: z.array(z.string()),
});

export type PerfilExtraido = z.infer<typeof PerfilExtraidoSchema>;

const SYSTEM = `Você extrai dados de currículos de profissionais de gastronomia, hotelaria e eventos no Brasil para preencher um perfil no VagaON, uma plataforma de vagas do setor.

Regras:
- Extraia só o que está no currículo. Não invente. Campo desconhecido = null (ou lista vazia).
- "especialidades": escolha as chaves da taxonomia abaixo que correspondem aos cargos que a pessoa exerceu ou declara. Use SOMENTE chaves da lista, no máximo 6, da mais relevante para a menos. Se um cargo não tem equivalente exato, use o mais próximo da mesma área; se não há nada próximo, não inclua.
- "resumoProfissional": até 400 caracteres, em primeira pessoa, tom profissional e direto, baseado no que o currículo diz. Se o currículo já tem um resumo, reescreva-o mais curto sem acrescentar fatos.
- "habilidades": termos curtos e concretos do setor (ex.: "cozinha italiana", "coquetelaria clássica", "BPF", "Excel"). Até 12.
- "experiencias": em ordem da mais recente para a mais antiga. Datas em AAAA-MM; "atual" = true quando não há data de fim. "descricao" curta (1–2 frases) ou null.
- "formacao": graduações, cursos técnicos e cursos livres relevantes para o setor, do mais recente para o mais antigo, com instituição e ano de conclusão (AAAA) quando houver. Até 8. Ensino fundamental/médio só se for a única formação.
- "telefone": só dígitos com DDD, se houver. "estado": sigla da UF.
- "confianca": "baixa" quando o documento está ilegível/incompleto ou não parece um currículo.
- "observacoes": liste em português o que ficou ambíguo (ex.: "não encontrei cidade", "datas da experiência na Pousada X não estavam claras"). Vazio se nada.

${textoVocabulario()}

# Taxonomia de especialidades (chave: nome)
${textoTaxonomiaEspecialidades()}`;

export interface EntradaCurriculo {
  pdfBase64?: string;
  imagem?: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" };
  texto?: string;
}

export async function extrairPerfilDeCurriculo(entrada: EntradaCurriculo) {
  const conteudo: BlocoEntrada[] = [];
  if (entrada.pdfBase64) {
    conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: entrada.pdfBase64 } });
  }
  if (entrada.imagem) {
    conteudo.push({ type: "image", source: { type: "base64", media_type: entrada.imagem.mediaType, data: entrada.imagem.base64 } });
  }
  const texto = entrada.texto?.trim();
  conteudo.push({
    type: "text",
    text: texto
      ? `Currículo em texto:\n\n${texto}\n\nExtraia os dados do perfil.`
      : "Extraia os dados do perfil a partir do documento acima.",
  });

  const r = await extrairEstruturado(PerfilExtraidoSchema, { system: SYSTEM, conteudo, esforco: "medium" });

  // Saneamento: a taxonomia e a UF são as nossas, não as do modelo.
  const d = r.dados;
  return {
    ...r,
    dados: {
      ...d,
      estado: normalizarUF(d.estado),
      especialidades: filtrarEspecialidades(d.especialidades, 6),
      habilidades: d.habilidades.map((h) => h.trim()).filter(Boolean).slice(0, 12),
      resumoProfissional: d.resumoProfissional?.trim().slice(0, 500) ?? null,
      telefone: d.telefone ? d.telefone.replace(/\D/g, "") || null : null,
      idiomas: d.idiomas
        .map((i) => ({ idioma: i.idioma.trim(), nivel: (NIVEL_IDIOMA_VALUES as readonly string[]).includes(i.nivel) ? i.nivel : "intermediario" }))
        .filter((i) => i.idioma),
      experiencias: d.experiencias.slice(0, 10).map((e) => ({
        ...e,
        estado: normalizarUF(e.estado),
        dataInicio: /^\d{4}-\d{2}$/.test(e.dataInicio ?? "") ? e.dataInicio : null,
        dataFim: /^\d{4}-\d{2}$/.test(e.dataFim ?? "") ? e.dataFim : null,
      })),
      formacao: d.formacao
        .map((f) => ({
          curso: f.curso.trim().slice(0, 120),
          instituicao: f.instituicao?.trim().slice(0, 120) ?? "",
          ano: /^\d{4}$/.test(f.ano ?? "") ? (f.ano as string) : "",
        }))
        .filter((f) => f.curso)
        .slice(0, 8),
    },
  };
}
