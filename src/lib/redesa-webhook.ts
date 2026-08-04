import jwt from "jsonwebtoken";

interface RedesaCandidaturaPayload {
  vagaonId: string;
  vagaonCandidaturaId: string;
  nome: string;
  email?: string;
  telefone?: string;
  linkedin?: string;
  mensagem?: string;
  curriculoUrl?: string;
}

interface RedesaTalentoPayload {
  vagaonCandidatoId: string;
  nome: string;
  email?: string;
  telefone?: string;
  linkedin?: string;
  mensagem?: string;
  curriculoUrl?: string;
  categoria?: string;
  cidade?: string;
  estado?: string;
}

function makeToken(): string {
  const secret = process.env.CROSS_PLATFORM_SECRET;
  if (!secret) throw new Error("CROSS_PLATFORM_SECRET não configurado");
  return jwt.sign({ type: "cross-platform" }, secret, { expiresIn: "5m" });
}

async function postWebhook(url: string, data: unknown, label: string): Promise<void> {
  try {
    const token = makeToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[Redesa webhook/${label}] Falhou com status ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error(`[Redesa webhook/${label}] Erro:`, err);
  }
}

export async function notifyRedesaCandidatura(data: RedesaCandidaturaPayload): Promise<void> {
  await postWebhook(
    "https://api.redesa.com.br/v1/webhooks/vagaon/candidaturas",
    data,
    "candidaturas"
  );
}

export async function notifyRedesaTalento(data: RedesaTalentoPayload): Promise<void> {
  await postWebhook(
    "https://api.redesa.com.br/v1/webhooks/vagaon/talentos",
    data,
    "talentos"
  );
}
