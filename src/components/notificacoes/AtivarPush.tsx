"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

type Estado = "verificando" | "indisponivel" | "negado" | "inativo" | "ativando" | "ativo";

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function base64UrlParaUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function registrarSW(): Promise<ServiceWorkerRegistration> {
  const existente = await navigator.serviceWorker.getRegistration("/");
  if (existente) return existente;
  await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

async function sincronizar(sub: PushSubscription) {
  await fetch("/api/push/inscrever", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  }).catch(() => {});
}

/**
 * Botão para ativar avisos no navegador. Some quando não há suporte, quando a
 * chave VAPID não está configurada ou quando já está ativo (variante pill).
 * Na primeira visita com inscrição existente, ressincroniza com o servidor —
 * cobre o caso de trocar de conta no mesmo aparelho.
 */
export default function AtivarPush({ variante = "pill" }: { variante?: "pill" | "card" }) {
  const [estado, setEstado] = useState<Estado>("verificando");

  useEffect(() => {
    (async () => {
      if (!CHAVE_PUBLICA || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setEstado("indisponivel");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("negado");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/");
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          await sincronizar(sub);
          setEstado("ativo");
        } else {
          setEstado("inativo");
        }
      } catch {
        setEstado("inativo");
      }
    })();
  }, []);

  const ativar = useCallback(async () => {
    setEstado("ativando");
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "negado" : "inativo");
        return;
      }
      const reg = await registrarSW();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlParaUint8Array(CHAVE_PUBLICA) as BufferSource,
        }));
      await sincronizar(sub);
      setEstado("ativo");
    } catch {
      setEstado("inativo");
    }
  }, []);

  if (estado === "verificando" || estado === "indisponivel") return null;

  if (variante === "pill") {
    if (estado === "ativo" || estado === "negado") return null;
    return (
      <button
        type="button"
        onClick={ativar}
        disabled={estado === "ativando"}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 hover:bg-white/20 disabled:opacity-60"
      >
        {estado === "ativando" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        Ativar avisos
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-white px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        {estado === "ativo" ? (
          <BellRing className="h-5 w-5 text-primary shrink-0" />
        ) : estado === "negado" ? (
          <BellOff className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <Bell className="h-5 w-5 text-primary shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold">Avisos neste aparelho</p>
          <p className="text-xs text-muted-foreground">
            {estado === "ativo"
              ? "Ativados. Você recebe match e mensagens mesmo com o app fechado."
              : estado === "negado"
                ? "Bloqueados no navegador. Libere nas configurações do site para ativar."
                : "Receba match e mensagens na hora, mesmo com o app fechado."}
          </p>
        </div>
      </div>
      {estado !== "ativo" && estado !== "negado" && (
        <button
          type="button"
          onClick={ativar}
          disabled={estado === "ativando"}
          className="shrink-0 rounded-full bg-primary text-white text-xs font-bold px-3.5 py-2 hover:bg-primary/90 disabled:opacity-60"
        >
          {estado === "ativando" ? "Ativando…" : "Ativar"}
        </button>
      )}
    </div>
  );
}
