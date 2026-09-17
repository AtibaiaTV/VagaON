"use client";

import { useEffect } from "react";

/** Registra o service worker só em produção — em dev ele só atrapalha o hot reload. */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* sem SW o site continua funcionando normalmente */
    });
  }, []);
  return null;
}
