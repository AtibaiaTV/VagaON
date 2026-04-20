"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface Props {
  vagaId: string;
  jaCandidatou: boolean;
  vagaAtiva: boolean;
}

export default function BotaoCandidatar({ vagaId, jaCandidatou, vagaAtiva }: Props) {
  const [candidatou, setCandidatou] = useState(jaCandidatou);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCandidatar() {
    setErro("");
    setEnviando(true);

    const res = await fetch(`/api/vagas/${vagaId}/candidaturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: null }),
    });

    setEnviando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao se candidatar.");
      return;
    }

    setCandidatou(true);
  }

  if (!vagaAtiva) {
    return (
      <div className="mt-4 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        Esta vaga não está mais disponível.
      </div>
    );
  }

  if (candidatou) {
    return (
      <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
        <CheckCircle className="h-5 w-5 shrink-0" />
        <span>Candidatura enviada! Aguarde o contato da empresa.</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {erro && (
        <p className="text-sm text-destructive mb-2">{erro}</p>
      )}
      <Button onClick={handleCandidatar} disabled={enviando} className="w-full" size="lg">
        {enviando ? "Enviando candidatura..." : "Candidatar-me a esta vaga"}
      </Button>
    </div>
  );
}
