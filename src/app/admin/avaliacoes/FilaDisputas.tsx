"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Estrelas from "@/components/avaliacoes/Estrelas";
import type { AvaliacaoDTO } from "@/lib/servicos/avaliacoes";

type Disputa = AvaliacaoDTO & { avaliadoTipo: "profissional" | "empresa" };

export default function FilaDisputas() {
  const [itens, setItens] = useState<Disputa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [notas, setNotas] = useState<Record<string, string>>({});

  async function carregar() {
    const r = await fetch("/api/admin/avaliacoes", { cache: "no-store" }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setItens(d?.disputas ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function resolver(id: string, decisao: "aceita" | "rejeitada") {
    const r = await fetch(`/api/admin/avaliacoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisao, notaAdmin: notas[id] ?? "" }),
    });
    if (r.ok) carregar();
  }

  if (carregando) return <RefreshCw className="h-5 w-5 animate-spin text-primary" />;
  if (!itens.length) return <p className="text-sm text-muted-foreground">Nenhuma contestação.</p>;

  return (
    <ul className="space-y-4 max-w-3xl">
      {itens.map((a) => {
        const aberta = a.disputa?.status === "aberta";
        return (
          <li key={a.id} className={`bg-white rounded-xl border p-4 space-y-3 ${aberta ? "border-amber-300" : "border-border/40 opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{a.autorNome}</span> ({a.autorTipo}) avaliou{" "}
                  <span className="font-semibold">{a.avaliadoNome}</span> · {a.vagaTitulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  Contestada em {a.disputa ? new Date(a.disputa.em).toLocaleDateString("pt-BR") : "-"} ·{" "}
                  {aberta ? "aberta" : a.disputa?.status}
                </p>
              </div>
              <Estrelas nota={a.media} />
            </div>

            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
              {a.criterios.map((c) => (
                <li key={c.chave} className="flex justify-between">
                  <span>{c.label}</span>
                  <span className="tabular-nums">{c.nota}/5</span>
                </li>
              ))}
            </ul>

            {a.comentario && (
              <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-[11px] uppercase text-muted-foreground block">Comentário do avaliador</span>
                {a.comentario}
              </p>
            )}
            <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-[11px] uppercase text-amber-800 block">Motivo da contestação</span>
              {a.disputa?.motivo}
            </p>
            {a.resposta && (
              <p className="text-sm border-l-2 border-primary/40 pl-3">
                <span className="text-[11px] uppercase text-muted-foreground block">Resposta pública do avaliado</span>
                {a.resposta.texto}
              </p>
            )}

            {aberta ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={notas[a.id] ?? ""}
                  onChange={(e) => setNotas((n) => ({ ...n, [a.id]: e.target.value }))}
                  placeholder="Nota da moderação (opcional, vai para quem contestou)"
                  maxLength={400}
                  className="w-full rounded-lg border border-input px-3 py-1.5 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50" onClick={() => resolver(a.id, "aceita")}>
                    Aceitar contestação (remover avaliação)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolver(a.id, "rejeitada")}>
                    Rejeitar (manter avaliação)
                  </Button>
                </div>
              </div>
            ) : (
              a.disputa?.notaAdmin && <p className="text-xs text-muted-foreground">Nota da moderação: {a.disputa.notaAdmin}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
