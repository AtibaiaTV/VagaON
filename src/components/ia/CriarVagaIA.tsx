"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { VagaEstruturada } from "@/lib/ia/vaga";

const EXEMPLOS = [
  "Preciso de 2 garçons pro casamento de sábado, das 18h à 1h, R$ 180 a diária, com experiência em serviço volante.",
  "Cozinheiro fixo, carteira assinada, 6x1, turno da noite, restaurante italiano, salário de 2.800 a 3.200.",
  "Camareira pra temporada de dezembro a fevereiro na pousada, alojamento incluso, diária de 130.",
];

interface Props {
  aoEstruturar: (vaga: VagaEstruturada) => void;
}

/** "Descreva a vaga como falaria com alguém" → formulário preenchido para revisão. */
export default function CriarVagaIA({ aoEstruturar }: Props) {
  const [frase, setFrase] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pronto = frase.trim().length >= 8;

  async function estruturar() {
    if (!pronto || processando) return;
    setErro(null);
    setProcessando(true);
    try {
      const r = await fetch("/api/ia/vaga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frase: frase.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d?.error ?? "Não foi possível montar a vaga. Tente de novo.");
        return;
      }
      aoEstruturar(d.vaga as VagaEstruturada);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 to-white p-4 sm:p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
          <Wand2 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Descreva a vaga como você falaria com alguém</p>
          <p className="text-xs text-muted-foreground">
            A IA monta o anúncio completo — título, descrição, contrato, salário, datas e até perguntas de triagem. Você
            confere e publica.
          </p>
        </div>
      </div>

      <Textarea
        value={frase}
        onChange={(e) => setFrase(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={EXEMPLOS[0]}
        className="bg-white"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") estruturar();
        }}
      />

      <div className="flex flex-wrap gap-1.5">
        {EXEMPLOS.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setFrase(ex)}
            className="text-[11px] px-2 py-1 rounded-full border border-border bg-white text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors text-left"
          >
            {ex.length > 64 ? `${ex.slice(0, 64)}…` : ex}
          </button>
        ))}
      </div>

      {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}

      <Button type="button" onClick={estruturar} disabled={!pronto || processando} className="gap-2">
        {processando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Montando a vaga…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Montar vaga com IA
          </>
        )}
      </Button>
    </section>
  );
}
