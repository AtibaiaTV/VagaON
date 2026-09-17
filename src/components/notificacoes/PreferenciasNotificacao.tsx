"use client";

import { useState } from "react";
import { Mail, MessageSquare, Smartphone } from "lucide-react";
import AtivarPush from "./AtivarPush";

interface Prefs {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
}

const CANAIS: { chave: keyof Prefs; rotulo: string; descricao: string; icone: React.ReactNode }[] = [
  { chave: "push", rotulo: "Avisos no aparelho", descricao: "Notificações do navegador / app instalado.", icone: <Smartphone className="h-4 w-4" /> },
  { chave: "whatsapp", rotulo: "WhatsApp", descricao: "Match, mensagens e atualizações no seu número.", icone: <MessageSquare className="h-4 w-4" /> },
  { chave: "email", rotulo: "E-mail", descricao: "Resumo de cada novidade importante.", icone: <Mail className="h-4 w-4" /> },
];

export default function PreferenciasNotificacao({ inicial }: { inicial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(inicial);
  const [salvando, setSalvando] = useState<keyof Prefs | null>(null);

  async function alternar(chave: keyof Prefs) {
    const valor = !prefs[chave];
    setPrefs((p) => ({ ...p, [chave]: valor }));
    setSalvando(chave);
    const r = await fetch("/api/notificacoes/preferencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [chave]: valor }),
    }).catch(() => null);
    if (!r?.ok) setPrefs((p) => ({ ...p, [chave]: !valor }));
    setSalvando(null);
  }

  return (
    <div className="space-y-3">
      <AtivarPush variante="card" />
      <ul className="divide-y rounded-xl border border-border/50 bg-white">
        {CANAIS.map((c) => (
          <li key={c.chave} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-primary shrink-0">{c.icone}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{c.rotulo}</p>
                <p className="text-xs text-muted-foreground">{c.descricao}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[c.chave]}
              aria-label={c.rotulo}
              disabled={salvando === c.chave}
              onClick={() => alternar(c.chave)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${prefs[c.chave] ? "bg-[#2DB87A]" : "bg-gray-300"} disabled:opacity-60`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[c.chave] ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">O sino no topo do site mostra tudo, independente dos canais acima.</p>
    </div>
  );
}
