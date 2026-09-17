"use client";

import { useEffect } from "react";

/**
 * Registra o service worker em produção — em dev ele atrapalha o hot reload.
 * Para testar push localmente, NEXT_PUBLIC_SW_EM_DEV="1" libera o registro.
 */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_SW_EM_DEV !== "1") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* sem SW o site continua funcionando normalmente */
    });
  }, []);
  return null;
}
