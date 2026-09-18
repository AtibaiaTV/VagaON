"use client";

import { useState } from "react";
import { CheckCircle, Loader2, Share, Smartphone, SquarePlus } from "lucide-react";
import { useInstalacaoPWA } from "./useInstalacaoPWA";

/**
 * Entrada permanente para instalar o app (página de perfil) — para quem
 * dispensou o banner e mudou de ideia. Some quando já roda instalado ou
 * quando este navegador não permite instalar.
 */
export default function CardInstalarApp() {
  const { instalado, plataforma, instalar } = useInstalacaoPWA();
  const [instalando, setInstalando] = useState(false);
  const [resultado, setResultado] = useState<"accepted" | "dismissed" | "indisponivel" | null>(null);

  if (instalado || plataforma === "nenhuma") return null;

  async function aoInstalar() {
    setInstalando(true);
    setResultado(await instalar());
    setInstalando(false);
  }

  const manual = plataforma === "ios" || resultado === "indisponivel";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-white px-4 py-3">
      <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Usar o VagaON como app</p>
        {resultado === "accepted" ? (
          <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Instalado! Procure o ícone do VagaON na tela inicial.
          </p>
        ) : manual ? (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            {plataforma === "ios" ? (
              <>
                No Safari, toque em <Share className="inline h-3.5 w-3.5 -mt-0.5 text-primary" aria-label="Compartilhar" />{" "}
                <span className="font-medium">Compartilhar</span> e depois em{" "}
                <SquarePlus className="inline h-3.5 w-3.5 -mt-0.5 text-primary" aria-hidden="true" />{" "}
                <span className="font-medium">Adicionar à Tela de Início</span>. Os avisos de match no iPhone dependem disso.
              </>
            ) : (
              "Abra o menu do navegador e toque em “Instalar app” ou “Adicionar à tela inicial”."
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            Abre direto da tela inicial, sem navegador, e avisa na hora de match e mensagens.
          </p>
        )}
      </div>
      {!manual && resultado !== "accepted" && (
        <button
          type="button"
          onClick={aoInstalar}
          disabled={instalando}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-xs font-bold px-3.5 py-2 hover:bg-primary/90 disabled:opacity-60"
        >
          {instalando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Instalar
        </button>
      )}
    </div>
  );
}
