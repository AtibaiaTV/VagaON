"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  telefoneMascarado: string | null;
  /** Já houve envio recente (ex.: no cadastro) — abre direto no campo do código. */
  enviadoEm: string | null;
  /** "banner" no painel, "card" dentro do perfil. */
  variante?: "banner" | "card";
}

/**
 * Pede/confirma o código de WhatsApp. Só é montado pelo servidor quando o
 * canal está ligado, há telefone e ele ainda não foi confirmado.
 */
export default function ConfirmarWhatsApp({ telefoneMascarado, enviadoEm, variante = "banner" }: Props) {
  const [fase, setFase] = useState<"inicio" | "codigo" | "ok">(enviadoEm ? "codigo" : "inicio");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  async function enviar() {
    setErro("");
    setOcupado(true);
    const r = await fetch("/api/whatsapp/verificacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "enviar" }),
    });
    const d = await r.json().catch(() => ({}));
    setOcupado(false);
    if (!r.ok) {
      setErro(d.error || "Não deu para enviar o código.");
      return;
    }
    setFase("codigo");
    setSegundos(60);
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    const r = await fetch("/api/whatsapp/verificacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "confirmar", codigo }),
    });
    const d = await r.json().catch(() => ({}));
    setOcupado(false);
    if (!r.ok) {
      setErro(d.error || "Código incorreto.");
      return;
    }
    setFase("ok");
  }

  const caixa =
    variante === "banner"
      ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
      : "rounded-xl border border-border/50 bg-white px-4 py-3";

  if (fase === "ok") {
    return (
      <div className={`${caixa} flex items-center gap-2 text-sm`}>
        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        WhatsApp confirmado. Os avisos de match e mensagens vão chegar no seu número.
      </div>
    );
  }

  return (
    <div className={`${caixa} space-y-2`}>
      <div className="flex items-start gap-3">
        <MessageCircle className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-sm min-w-0 flex-1">
          <p>
            <span className="font-semibold">Confirme seu WhatsApp</span>
            {telefoneMascarado && <span className="text-muted-foreground"> {telefoneMascarado}</span>}. É por ele que avisamos
            match, mensagem e entrevista. Leva 10 segundos.
          </p>
          {fase === "inicio" && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={enviar} disabled={ocupado}>
                {ocupado ? "Enviando..." : "Enviar código por WhatsApp"}
              </Button>
              <Link href="/perfil/editar" className="text-xs underline underline-offset-2 text-muted-foreground">
                número errado? corrigir
              </Link>
            </div>
          )}
          {fase === "codigo" && (
            <form onSubmit={confirmar} className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="código de 6 dígitos"
                className="w-44 bg-white"
                aria-label="Código recebido no WhatsApp"
              />
              <Button size="sm" type="submit" disabled={ocupado || codigo.length !== 6}>
                {ocupado ? "Conferindo..." : "Confirmar"}
              </Button>
              <button
                type="button"
                onClick={enviar}
                disabled={ocupado || segundos > 0}
                className="text-xs underline underline-offset-2 text-muted-foreground disabled:no-underline disabled:opacity-60"
              >
                {segundos > 0 ? `reenviar em ${segundos}s` : "não chegou? reenviar"}
              </button>
            </form>
          )}
          {erro && <p className="mt-1.5 text-xs text-destructive">{erro}</p>}
        </div>
      </div>
    </div>
  );
}
