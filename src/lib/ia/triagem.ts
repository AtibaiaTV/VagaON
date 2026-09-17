import { z } from "zod";
import { extrairEstruturado } from "./cliente";

/**
 * Respostas às perguntas de triagem da vaga → resumo curto e nota para o
 * card do funil. É apoio à leitura da empresa, não decisão: a nota nunca
 * move o card sozinha e o texto é mostrado ao lado das respostas originais.
 */

export const TriagemSchema = z.object({
  /** 2 a 3 frases, em português, sobre o que as respostas dizem em relação à vaga. */
  resumo: z.string(),
  pontosFortes: z.array(z.string()),
  ressalvas: z.array(z.string()),
  /** 1 a 5: aderência das respostas ao que a vaga pede. */
  nota: z.number(),
  recomendaEntrevista: z.boolean(),
});

export type Triagem = z.infer<typeof TriagemSchema>;

const SYSTEM = `Você ajuda um contratante de gastronomia, hotelaria ou eventos no Brasil a ler rapidamente as respostas de triagem de um candidato.

Regras:
- Avalie SOMENTE o que as respostas dizem em relação ao que a vaga pede (disponibilidade, experiência citada, clareza, compromisso). Não infira nada sobre idade, gênero, origem, saúde, família, religião ou aparência — se uma resposta trouxer isso, ignore.
- "resumo": 2 a 3 frases objetivas. "pontosFortes"/"ressalvas": itens curtos, só se sustentados pelas respostas. Resposta em branco ou evasiva é ressalva.
- "nota": 1 (respostas não atendem ao pedido) a 5 (atendem claramente, com evidência). 3 = neutro/insuficiente para saber.
- "recomendaEntrevista": true quando não há ressalva que inviabilize.
- Português do Brasil, tom neutro.`;

export async function resumirTriagem(entrada: {
  vagaTitulo: string;
  vagaDescricao: string;
  tipo: string;
  perguntas: string[];
  respostas: string[];
}) {
  const qa = entrada.perguntas
    .map((p, i) => `P${i + 1}: ${p}\nR${i + 1}: ${(entrada.respostas[i] ?? "").trim() || "(sem resposta)"}`)
    .join("\n\n");

  const r = await extrairEstruturado(TriagemSchema, {
    system: SYSTEM,
    conteudo: [
      {
        type: "text",
        text: `Vaga: ${entrada.vagaTitulo} (${entrada.tipo})\n${entrada.vagaDescricao.slice(0, 1500)}\n\nTriagem:\n${qa}\n\nResuma e dê a nota.`,
      },
    ],
    esforco: "low",
    maxTokens: 2000,
  });

  const d = r.dados;
  return {
    ...r,
    dados: {
      ...d,
      resumo: d.resumo.trim().slice(0, 600),
      pontosFortes: d.pontosFortes.map((s) => s.trim()).filter(Boolean).slice(0, 4),
      ressalvas: d.ressalvas.map((s) => s.trim()).filter(Boolean).slice(0, 4),
      nota: Math.max(1, Math.min(5, Math.round(d.nota || 3))),
    },
  };
}
