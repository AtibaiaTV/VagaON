"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, Users, Plus, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FeedProfissionalItem } from "@/lib/servicos/feed";
import type { IMatch } from "@/models/Match";
import CardProfissionalSwipe from "./CardProfissionalSwipe";
import MatchOverlay from "./MatchOverlay";
import SwipeDeck, { type Direcao } from "./SwipeDeck";

export interface VagaResumo {
  id: string;
  titulo: string;
  cidade: string;
  especialidadeLabel: string;
  totalLikesRecebidos: number;
}

type MatchAberto = { id: string; score: number; snapshot: IMatch["snapshot"] };

/** Deck da empresa: escolhe a vaga e desliza candidatos ranqueados para ela. */
export default function DeckEmpresa({ vagas, modoCegoInicial = false }: { vagas: VagaResumo[]; modoCegoInicial?: boolean }) {
  const [vagaId, setVagaId] = useState(vagas[0]?.id ?? "");
  const [itens, setItens] = useState<FeedProfissionalItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [restantes, setRestantes] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchAberto | null>(null);
  const [modoCego, setModoCego] = useState(modoCegoInicial);
  const [salvandoModo, setSalvandoModo] = useState(false);

  const buscando = useRef(false);
  const vistos = useRef(new Set<string>());

  const carregar = useCallback(
    async (reiniciar = false) => {
      if (!vagaId || buscando.current) return;
      buscando.current = true;
      if (reiniciar) {
        vistos.current = new Set();
        setItens([]);
        setCarregando(true);
      }
      try {
        const res = await fetch(`/api/match/feed?vagaId=${vagaId}&limite=20`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setAviso(data.error ?? "Não foi possível carregar candidatos.");
          return;
        }
        const novos = (data.cards as FeedProfissionalItem[]).filter((c) => !vistos.current.has(c.profissional.id));
        novos.forEach((c) => vistos.current.add(c.profissional.id));
        setItens((atual) => (reiniciar ? novos : [...atual, ...novos]));
        setRestantes(data.restantes ?? 0);
      } catch {
        setAviso("Sem conexão. Tente de novo.");
      } finally {
        buscando.current = false;
        setCarregando(false);
      }
    },
    [vagaId]
  );

  useEffect(() => {
    carregar(true);
  }, [carregar]);

  const decidir = useCallback(
    async (item: FeedProfissionalItem, direcao: Direcao) => {
      const res = await fetch("/api/match/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vagaId, profissionalId: item.profissional.id, direcao }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) {
        setAviso(data.error ?? "Não foi possível registrar sua escolha.");
        return;
      }
      if (data.match) setMatch(data.match);
    },
    [vagaId]
  );

  const aoFicarNoFim = useCallback(
    (sobrando: number) => {
      if (restantes > 0 || sobrando === 0) carregar();
    },
    [restantes, carregar]
  );

  const vagaAtual = vagas.find((v) => v.id === vagaId);

  async function alternarModoCego() {
    const novo = !modoCego;
    setSalvandoModo(true);
    const r = await fetch("/api/match/preferencias", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modoCego: novo }),
    }).catch(() => null);
    setSalvandoModo(false);
    if (!r?.ok) {
      setAviso("Não foi possível alterar o modo às cegas.");
      return;
    }
    setModoCego(novo);
    // Os cards já carregados mostram (ou escondem) nome e foto — recarrega.
    carregar(true);
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidatos para a vaga</label>
          <button
            type="button"
            role="switch"
            aria-checked={modoCego}
            onClick={alternarModoCego}
            disabled={salvandoModo}
            title="Esconde foto e nome até o match: você decide pelo perfil, não pelo rosto."
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
              modoCego ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-border text-muted-foreground hover:border-violet-300"
            }`}
          >
            {modoCego ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Modo às cegas
          </button>
        </div>
        <Select value={vagaId} onValueChange={(v) => v && setVagaId(v)}>
          <SelectTrigger className="mt-1 bg-white">
            <SelectValue placeholder="Escolha uma vaga" />
          </SelectTrigger>
          <SelectContent>
            {vagas.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.titulo} — {v.cidade}
                {v.totalLikesRecebidos > 0 ? ` · ${v.totalLikesRecebidos} interessado${v.totalLikesRecebidos > 1 ? "s" : ""}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {vagaAtual && (
          <p className="text-xs text-muted-foreground mt-1">
            {vagaAtual.especialidadeLabel} · quem já curtiu a vaga aparece primeiro
          </p>
        )}
      </div>

      {aviso && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>{aviso}</span>
          <button type="button" className="text-xs font-semibold underline" onClick={() => setAviso(null)}>
            fechar
          </button>
        </div>
      )}

      {carregando ? (
        <div className="flex flex-col items-center justify-center min-h-[460px] text-muted-foreground gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Ranqueando candidatos…</p>
        </div>
      ) : (
        <SwipeDeck
          key={vagaId}
          itens={itens}
          chave={(i) => i.profissional.id}
          renderizar={(item, topo) => <CardProfissionalSwipe item={item} topo={topo} />}
          aoDecidir={decidir}
          aoFicarNoFim={aoFicarNoFim}
          rotulos={{ like: "QUERO CONVERSAR", pass: "PASSAR", super: "PRIORIDADE" }}
          vazio={
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg">Sem novos candidatos por agora</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Você já avaliou todos os perfis compatíveis com esta vaga. Novos profissionais entram todo dia.
              </p>
              <div className="flex flex-col gap-2 mt-5">
                <Button variant="outline" onClick={() => carregar(true)} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Buscar de novo
                </Button>
                <Link href="/vagas/nova">
                  <Button variant="ghost" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Publicar outra vaga
                  </Button>
                </Link>
              </div>
            </div>
          }
        />
      )}

      {match && <MatchOverlay match={match} lado="empresa" aoFechar={() => setMatch(null)} />}
    </>
  );
}
