"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Estado de instalação do PWA neste aparelho.
 *
 * - Android/Chrome/Edge/Samsung: o navegador dispara `beforeinstallprompt`;
 *   o script inline do layout guarda o evento em `window.__promptInstalacaoPWA`
 *   (ele costuma disparar antes de o React montar) e avisa via
 *   `vagaon:instalavel`. `instalar()` abre o prompt nativo.
 * - iPhone/iPad: não existe prompt; só dá para orientar (Compartilhar →
 *   Adicionar à Tela de Início).
 * - Já instalado (standalone): nada a fazer.
 */

export type PlataformaInstalacao = "android" | "ios" | "desktop" | "nenhuma";

interface PromptInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __promptInstalacaoPWA?: PromptInstalacao | null;
  }
}

export interface EstadoInstalacao {
  /** true quando já roda como app instalado. */
  instalado: boolean;
  plataforma: PlataformaInstalacao;
  /** Abre o prompt nativo (só onde existe). */
  instalar: () => Promise<"accepted" | "dismissed" | "indisponivel">;
}

const CHAVE_DISPENSADA = "vagaon:instalacao:dispensada";
const CHAVE_FEITA = "vagaon:instalacao:feita";
const DIAS_SILENCIO = 14;

export function rodaComoApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function ehIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function ehMobile(): boolean {
  return window.matchMedia("(max-width: 1023px)").matches || /Android|Mobile/i.test(navigator.userAgent);
}

/** Em dev, `?simularInstalacao=ios|android` força a plataforma para ver a UI. */
function plataformaSimulada(): PlataformaInstalacao | null {
  if (process.env.NODE_ENV === "production") return null;
  const v = new URLSearchParams(window.location.search).get("simularInstalacao");
  return v === "ios" || v === "android" || v === "desktop" ? v : null;
}

export function dispensarInstalacao() {
  try {
    localStorage.setItem(CHAVE_DISPENSADA, new Date().toISOString());
  } catch {
    /* sem storage, o banner volta na próxima visita — aceitável */
  }
}

export function marcarInstalacaoFeita() {
  try {
    localStorage.setItem(CHAVE_FEITA, "1");
  } catch {
    /* idem */
  }
}

/** true quando a pessoa dispensou há menos de 14 dias ou já instalou por aqui. */
export function instalacaoSilenciada(): boolean {
  try {
    if (localStorage.getItem(CHAVE_FEITA) === "1") return true;
    const quando = localStorage.getItem(CHAVE_DISPENSADA);
    if (!quando) return false;
    const dias = (Date.now() - new Date(quando).getTime()) / 86_400_000;
    return dias < DIAS_SILENCIO;
  } catch {
    return false;
  }
}

export function useInstalacaoPWA(): EstadoInstalacao {
  const [instalado, setInstalado] = useState(false);
  const [plataforma, setPlataforma] = useState<PlataformaInstalacao>("nenhuma");

  useEffect(() => {
    if (rodaComoApp()) {
      setInstalado(true);
      return;
    }
    const simulada = plataformaSimulada();
    if (simulada) {
      setPlataforma(simulada);
      return;
    }
    if (ehIOS()) {
      setPlataforma("ios");
      return;
    }

    const marcar = () => setPlataforma(ehMobile() ? "android" : "desktop");
    if (window.__promptInstalacaoPWA) marcar();
    const aoInstalar = () => {
      window.__promptInstalacaoPWA = null;
      marcarInstalacaoFeita();
      setInstalado(true);
      setPlataforma("nenhuma");
    };
    window.addEventListener("vagaon:instalavel", marcar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("vagaon:instalavel", marcar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const instalar = useCallback(async () => {
    const evento = window.__promptInstalacaoPWA;
    if (!evento) return "indisponivel" as const;
    try {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      window.__promptInstalacaoPWA = null;
      if (outcome === "accepted") {
        marcarInstalacaoFeita();
        setInstalado(true);
        setPlataforma("nenhuma");
      }
      return outcome;
    } catch {
      window.__promptInstalacaoPWA = null;
      return "indisponivel" as const;
    }
  }, []);

  return { instalado, plataforma, instalar };
}
