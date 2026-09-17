import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { ErroAtor } from "@/lib/servicos/erros";

/**
 * Cliente da API do Claude para as funções de IA do VagaON.
 *
 * Toda chamada é uma extração estruturada: entra texto/PDF/imagem, sai JSON
 * validado por um schema Zod. Modelo: Claude Opus 5 com thinking adaptativo
 * e fallback do lado do servidor (uma recusa de política reexecuta em outro
 * modelo dentro da mesma chamada, em vez de virar erro para o usuário).
 */

export const MODELO = "claude-opus-5";

export function iaConfigurada(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cliente: Anthropic | null = null;
function getCliente(): Anthropic {
  if (!iaConfigurada()) throw new ErroAtor(503, "Recurso de IA não configurado. Defina ANTHROPIC_API_KEY.");
  return (cliente ??= new Anthropic());
}

export type BlocoEntrada =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/webp"; data: string } };

export interface OpcoesExtracao {
  /** Texto estável (instruções + vocabulário): fica em cache entre chamadas. */
  system: string;
  conteudo: BlocoEntrada[];
  maxTokens?: number;
  esforco?: "low" | "medium" | "high";
}

export interface ResultadoExtracao<T> {
  dados: T;
  uso: { entrada: number; saida: number; cacheLida: number; modelo: string };
}

/**
 * Chama o modelo e devolve o JSON validado. Lança ErroAtor com mensagem
 * amigável em recusa, truncamento, JSON inválido ou falha da API.
 */
export async function extrairEstruturado<S extends z.ZodTypeAny>(
  schema: S,
  opcoes: OpcoesExtracao
): Promise<ResultadoExtracao<z.infer<S>>> {
  const client = getCliente();

  let resposta;
  try {
    resposta = await client.beta.messages.create({
      model: MODELO,
      max_tokens: opcoes.maxTokens ?? 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: zodOutputFormat(schema), effort: opcoes.esforco ?? "medium" },
      system: [{ type: "text", text: opcoes.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opcoes.conteudo }],
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new ErroAtor(503, "Chave da API de IA inválida.");
    if (err instanceof Anthropic.RateLimitError) throw new ErroAtor(429, "Muitas solicitações à IA agora. Tente em instantes.");
    if (err instanceof Anthropic.APIError) throw new ErroAtor(502, `A IA não respondeu (${err.status}). Tente de novo.`);
    throw err;
  }

  if (resposta.stop_reason === "refusal") {
    throw new ErroAtor(422, "A IA não pôde processar este conteúdo. Preencha manualmente.");
  }
  if (resposta.stop_reason === "max_tokens") {
    throw new ErroAtor(422, "O conteúdo é longo demais para processar de uma vez. Envie uma versão mais curta.");
  }

  const texto = resposta.content.find((b) => b.type === "text");
  if (!texto || texto.type !== "text") throw new ErroAtor(502, "A IA não devolveu dados.");

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto.text);
  } catch {
    throw new ErroAtor(502, "A IA devolveu um formato inesperado. Tente de novo.");
  }

  const validado = schema.safeParse(bruto);
  if (!validado.success) throw new ErroAtor(502, "A IA devolveu dados fora do formato esperado. Tente de novo.");

  return {
    dados: validado.data,
    uso: {
      entrada: resposta.usage.input_tokens,
      saida: resposta.usage.output_tokens,
      cacheLida: resposta.usage.cache_read_input_tokens ?? 0,
      modelo: resposta.model,
    },
  };
}
