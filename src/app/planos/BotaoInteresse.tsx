"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";

/**
 * Enquanto não há provedor de pagamento, "Quero o Pro" registra o interesse
 * e a equipe entra em contato (o admin vê a lista). Quando o provedor
 * entrar, este botão vira o checkout.
 */
export default function BotaoInteresse({ ativos, jaInteressada, noPro }: { ativos: boolean; jaInteressada: boolean; noPro: boolean }) {
  const [estado, setEstado] = useState<"inicial" | "enviando" | "ok" | "erro">(jaInteressada ? "ok" : "inicial");

  async function registrar() {
    setEstado("enviando");
    const r = await fetch("/api/planos/interesse", { method: "POST" }).catch(() => null);
    setEstado(r?.ok ? "ok" : "erro");
  }

  if (noPro) {
    return <p className="text-xs text-center text-muted-foreground">Você já está no Pro.</p>;
  }

  if (estado === "ok") {
    return (
      <p className="flex items-center justify-center gap-1.5 text-sm text-green-700">
        <CheckCircle className="h-4 w-4" /> Interesse registrado. Entraremos em contato.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={registrar}
        disabled={estado === "enviando"}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
      >
        {estado === "enviando" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {ativos ? "Quero o Pro" : "Avise-me quando o Pro abrir"}
      </button>
      {estado === "erro" && <p className="text-xs text-destructive text-center">Não foi possível registrar. Tente de novo.</p>}
    </div>
  );
}
