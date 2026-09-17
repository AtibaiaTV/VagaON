"use client";

import { useState } from "react";
import { Loader2, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_TEXTO, criteriosPara } from "@/constants/avaliacao";
import type { AvaliacaoDTO } from "@/lib/servicos/avaliacoes";

interface Props {
  lado: "profissional" | "empresa";
  matchId: string;
  outroNome: string;
  vagaTitulo: string;
  aoConcluir: (a: AvaliacaoDTO) => void;
  aoCancelar: () => void;
}

/** Notas de 1 a 5 por critério, "recomendaria" e um comentário privado ao avaliado. */
export default function FormularioAvaliacao({ lado, matchId, outroNome, vagaTitulo, aoConcluir, aoCancelar }: Props) {
  const criterios = criteriosPara(lado);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [recomendaria, setRecomendaria] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const completo = criterios.every((c) => notas[c.chave]) && recomendaria !== null;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!completo) {
      setErro("Dê uma nota em todos os critérios e responda se recomendaria.");
      return;
    }
    setEnviando(true);
    setErro(null);
    const r = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, criterios: notas, recomendaria, comentario }),
    });
    const d = await r.json().catch(() => ({}));
    setEnviando(false);
    if (!r.ok) {
      setErro(d.error ?? "Não foi possível enviar.");
      return;
    }
    aoConcluir(d.avaliacao);
  }

  return (
    <form onSubmit={enviar} className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 space-y-4">
      <div>
        <p className="font-bold">Como foi trabalhar com {outroNome}?</p>
        <p className="text-xs text-muted-foreground">
          {vagaTitulo} · Sua avaliação só é publicada quando {outroNome} também avaliar — ou em 14 dias. Ninguém avalia
          reagindo à nota do outro.
        </p>
      </div>

      <ul className="divide-y divide-border/40">
        {criterios.map((c) => (
          <li key={c.chave} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.descricao}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0" role="radiogroup" aria-label={c.label}>
              {[1, 2, 3, 4, 5].map((n) => {
                const ativa = (notas[c.chave] ?? 0) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={notas[c.chave] === n}
                    aria-label={`${n} de 5`}
                    onClick={() => setNotas((s) => ({ ...s, [c.chave]: n }))}
                    className="p-0.5"
                  >
                    <Star className={`h-6 w-6 transition-colors ${ativa ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"}`} />
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      <div>
        <p className="text-sm font-semibold mb-1.5">
          {lado === "empresa" ? "Contrataria de novo?" : "Trabalharia de novo com esta empresa?"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecomendaria(true)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              recomendaria === true ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-border hover:border-emerald-400"
            }`}
          >
            <ThumbsUp className="h-4 w-4" /> Sim
          </button>
          <button
            type="button"
            onClick={() => setRecomendaria(false)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
              recomendaria === false ? "bg-gray-700 border-gray-700 text-white" : "bg-white border-border hover:border-gray-400"
            }`}
          >
            <ThumbsDown className="h-4 w-4" /> Não
          </button>
        </div>
      </div>

      <div>
        <label htmlFor={`coment-${matchId}`} className="text-sm font-semibold">
          Comentário <span className="font-normal text-muted-foreground">(opcional, só {outroNome} lê)</span>
        </label>
        <textarea
          id={`coment-${matchId}`}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={3}
          maxLength={MAX_TEXTO}
          placeholder="Algo que ajude a pessoa a melhorar ou que valha registrar."
          className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[11px] text-muted-foreground text-right">{comentario.length}/{MAX_TEXTO}</p>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={enviando || !completo}>
          {enviando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
            </>
          ) : (
            "Enviar avaliação"
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={aoCancelar}>
          Depois
        </Button>
      </div>
    </form>
  );
}
