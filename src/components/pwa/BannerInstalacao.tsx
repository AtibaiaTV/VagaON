"use client";

import { useEffect, useState } from "react";
import { Loader2, Share, SquarePlus, X } from "lucide-react";
import { dispensarInstalacao, instalacaoSilenciada, useInstalacaoPWA } from "./useInstalacaoPWA";

const ATRASO_MS = 2500;

/**
 * Convite para instalar o app, fixo no rodapé do celular. Aparece só para
 * quem está logado (montado pelo Navbar), nunca dentro do app instalado, e
 * fica 14 dias quieto depois de "Agora não". No Android abre o prompt
 * nativo; no iPhone mostra o caminho (Compartilhar → Adicionar à Tela de
 * Início), que é o único que existe lá.
 */
export default function BannerInstalacao() {
  const { instalado, plataforma, instalar } = useInstalacaoPWA();
  const [visivel, setVisivel] = useState(false);
  const [entrou, setEntrou] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const [semPrompt, setSemPrompt] = useState(false);

  useEffect(() => {
    if (instalado || (plataforma !== "android" && plataforma !== "ios") || instalacaoSilenciada()) {
      setVisivel(false);
      return;
    }
    const t = setTimeout(() => setVisivel(true), ATRASO_MS);
    return () => clearTimeout(t);
  }, [instalado, plataforma]);

  // Desliza de baixo para cima no primeiro frame após montar.
  useEffect(() => {
    if (!visivel) {
      setEntrou(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntrou(true));
    return () => cancelAnimationFrame(raf);
  }, [visivel]);

  if (!visivel) return null;

  function fechar() {
    dispensarInstalacao();
    setVisivel(false);
  }

  async function aoInstalar() {
    setInstalando(true);
    const r = await instalar();
    setInstalando(false);
    if (r === "accepted") setVisivel(false);
    else if (r === "dismissed") fechar();
    else setSemPrompt(true); // navegador sem prompt: mostra o caminho manual
  }

  return (
    <div
      role="dialog"
      aria-label="Instalar o VagaON"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div
        style={{ backgroundColor: "#143f28" }}
        className={`pointer-events-auto max-w-md mx-auto rounded-2xl text-white shadow-2xl border border-white/10 p-4 transition-all duration-300 ease-out ${
          entrou ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl shrink-0 shadow" />
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-tight">Instale o VagaON no celular</p>
            {plataforma === "ios" || semPrompt ? (
              <p className="text-sm text-white/80 mt-1 leading-snug">
                {semPrompt ? (
                  "Abra o menu do navegador e toque em “Instalar app” ou “Adicionar à tela inicial”."
                ) : (
                  <>
                    Toque em <Share className="inline h-4 w-4 -mt-0.5 mx-0.5 text-[#4ade80]" aria-label="Compartilhar" />{" "}
                    <span className="font-semibold">Compartilhar</span> e depois em{" "}
                    <SquarePlus className="inline h-4 w-4 -mt-0.5 mx-0.5 text-[#4ade80]" aria-hidden="true" />
                    <span className="font-semibold">Adicionar à Tela de Início</span>. No iPhone, os avisos de match só
                    chegam com o app instalado.
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm text-white/80 mt-1 leading-snug">
                Abre direto da tela inicial, sem navegador, e avisa na hora de match e mensagens.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="shrink-0 -mr-1 -mt-1 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 mt-3">
          {plataforma === "ios" || semPrompt ? (
            <button
              type="button"
              onClick={fechar}
              className="rounded-full bg-[#2DB87A] text-white text-sm font-bold px-4 py-2 hover:bg-[#27a56d]"
            >
              Entendi
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={fechar}
                className="rounded-full text-white/75 text-sm font-semibold px-3 py-2 hover:text-white hover:bg-white/10"
              >
                Agora não
              </button>
              <button
                type="button"
                onClick={aoInstalar}
                disabled={instalando}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2DB87A] text-white text-sm font-bold px-4 py-2 hover:bg-[#27a56d] disabled:opacity-60"
              >
                {instalando && <Loader2 className="h-4 w-4 animate-spin" />}
                Instalar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
