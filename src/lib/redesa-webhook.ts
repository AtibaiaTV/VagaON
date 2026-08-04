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

export async function notifyRedesaCandidatura(data: RedesaCandidaturaPayload): Promise<void> {
  const secret = process.env.CROSS_PLATFORM_SECRET;
  if (!secret) {
    console.error("[Redesa webhook] CROSS_PLATFORM_SECRET não configurado");
    return;
  }

  const token = jwt.sign({ type: "cross-platform" }, secret, { expiresIn: "5m" });

  try {
    const res = await fetch("https://api.redesa.com.br/v1/webhooks/vagaon/candidaturas", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Redesa webhook] Falhou com status ${res.status}: ${body}`);
    }
  } catch (err) {
    console.error("[Redesa webhook] Erro ao notificar candidatura:", err);
  }
}
