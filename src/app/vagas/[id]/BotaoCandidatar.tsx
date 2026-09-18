"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PerguntasTriagem from "@/components/triagem/PerguntasTriagem";
import { CheckCircle, ClipboardList } from "lucide-react";

interface Props {
  vagaId: string;
  jaCandidatou: boolean;
  vagaAtiva: boolean;
  /** Perguntas de triagem da vaga — quando há, aparecem antes de enviar. */
  perguntas?: string[];
  /** Texto quando a vaga não está ativa (preenchida, pausada, expirada…). */
  aviso?: string;
}

export default function BotaoCandidatar({ vagaId, jaCandidatou, vagaAtiva, perguntas = [], aviso }: Props) {
  const [candidatou, setCandidatou] = useState(jaCandidatou);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [respondendo, setRespondendo] = useState(false);
  const [respostas, setRespostas] = useState<string[]>(perguntas.map(() => ""));

  async function handleCandidatar() {
    setErro("");
    setEnviando(true);

    const res = await fetch(`/api/vagas/${vagaId}/candidaturas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: null, respostasTriagem: respostas }),
    });

    setEnviando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao se candidatar.");
      return;
    }

    setCandidatou(true);
    setRespondendo(false);
  }

  if (!vagaAtiva) {
    return (
      <div className="mt-4 p-3 bg-muted rounded-lg text-center text-sm text-muted-foreground">
        {aviso ?? "Esta vaga não está mais disponível."}
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

  // Vaga com perguntas: o primeiro clique abre as perguntas, o segundo envia.
  if (perguntas.length > 0 && respondendo) {
    return (
      <div className="mt-4 rounded-xl border border-primary/25 bg-white p-4 space-y-4">
        <div className="flex items-start gap-2">
          <ClipboardList className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">A empresa fez {perguntas.length === 1 ? "uma pergunta" : `${perguntas.length} perguntas`} rápidas</p>
            <p className="text-xs text-muted-foreground">Respostas curtas e diretas ajudam você a se destacar. Opcional, mas recomendado.</p>
          </div>
        </div>
        <PerguntasTriagem perguntas={perguntas} respostas={respostas} onChange={setRespostas} idPrefixo="candidatar-triagem" />
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setRespondendo(false)} disabled={enviando}>
            Voltar
          </Button>
          <Button type="button" onClick={handleCandidatar} disabled={enviando} className="flex-1" size="lg">
            {enviando ? "Enviando candidatura..." : "Enviar candidatura"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {erro && <p className="text-sm text-destructive mb-2">{erro}</p>}
      <Button
        onClick={() => (perguntas.length > 0 ? setRespondendo(true) : handleCandidatar())}
        disabled={enviando}
        className="w-full"
        size="lg"
      >
        {enviando ? "Enviando candidatura..." : "Candidatar-me a esta vaga"}
      </Button>
      {perguntas.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          A empresa faz {perguntas.length === 1 ? "1 pergunta rápida" : `${perguntas.length} perguntas rápidas`} antes de enviar.
        </p>
      )}
    </div>
  );
}
