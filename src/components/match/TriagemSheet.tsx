"use client";

import { useState } from "react";
import { ClipboardList, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import PerguntasTriagem from "@/components/triagem/PerguntasTriagem";

interface Props {
  vagaTitulo: string;
  empresaNome: string;
  perguntas: string[];
  /** Envia as respostas; lance um Error com mensagem amigável se falhar. */
  aoEnviar: (respostas: string[]) => Promise<void>;
  aoPular: () => void;
}

/**
 * Aparece logo depois do like numa vaga com perguntas de triagem. Responder
 * é opcional — o like já foi registrado — mas quem responde chega ao funil
 * da empresa com contexto (e com o resumo da IA).
 */
export default function TriagemSheet({ vagaTitulo, empresaNome, perguntas, aoEnviar, aoPular }: Props) {
  const [respostas, setRespostas] = useState<string[]>(perguntas.map(() => ""));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const respondeu = respostas.some((r) => r.trim());

  async function enviar() {
    if (!respondeu || enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      await aoEnviar(respostas);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold leading-tight">Interesse registrado!</p>
              <p className="text-xs text-muted-foreground truncate">
                {empresaNome} fez {perguntas.length === 1 ? "uma pergunta" : `${perguntas.length} perguntas`} para a vaga {vagaTitulo}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <PerguntasTriagem perguntas={perguntas} respostas={respostas} onChange={setRespostas} idPrefixo="deck-triagem" compacto />
          {erro && <p className="mt-3 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}
        </div>

        <div className="px-5 py-4 border-t border-border/40 flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={aoPular} disabled={enviando} className="text-muted-foreground">
            Depois
          </Button>
          <Button type="button" onClick={enviar} disabled={!respondeu || enviando} className="flex-1 gap-2">
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar respostas
          </Button>
        </div>
      </div>
    </div>
  );
}
