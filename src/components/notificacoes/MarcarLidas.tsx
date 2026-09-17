"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ao abrir a página de notificações, marca todas como lidas e atualiza o sino. */
export default function MarcarLidas({ haNaoLidas }: { haNaoLidas: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!haNaoLidas) return;
    fetch("/api/notificacoes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todas: true }),
    })
      .then(() => router.refresh())
      .catch(() => {});
  }, [haNaoLidas, router]);
  return null;
}
