import type { CategoriaNotificacao } from "@/models/Notificacao";

export type Canal = "app" | "push" | "email" | "whatsapp";

/** O que se quer dizer, independente do canal. */
export interface MensagemNotificacao {
  categoria: CategoriaNotificacao;
  /** Curto: assunto do e-mail, título do push. */
  titulo: string;
  /** Uma ou duas frases. */
  corpo: string;
  /** Itens curtos depois do corpo (resumos). E-mail mostra como lista; os outros canais juntam ao corpo. */
  linhas?: string[];
  /** Caminho relativo (ex.: /matches/abc). Os canais montam a URL absoluta. */
  url: string;
}

/** Corpo + linhas num texto só, para canais sem lista (push, WhatsApp, in-app). */
export function corpoCompleto(msg: MensagemNotificacao, separador = " · "): string {
  const linhas = (msg.linhas ?? []).filter(Boolean);
  return linhas.length ? `${msg.corpo} ${linhas.join(separador)}` : msg.corpo;
}

/** Quem recebe, já com tudo que cada canal precisa. */
export interface Destinatario {
  userId: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  preferencias: { email: boolean; whatsapp: boolean; push: boolean };
  pushSubscriptions: { endpoint: string; keys: { p256dh: string; auth: string } }[];
}

export interface ResultadoEnvio {
  canal: Canal;
  ok: boolean;
  detalhe?: string;
}

/** Referência a um lado do match — o orquestrador resolve o User por trás. */
export type AlvoNotificacao =
  | { tipo: "profissional"; perfilId: unknown }
  | { tipo: "empresa"; perfilId: unknown }
  | { tipo: "user"; userId: unknown };

export function urlAbsoluta(caminho: string): string {
  if (/^https?:\/\//.test(caminho)) return caminho;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
}
