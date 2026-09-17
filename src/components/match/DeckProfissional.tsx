"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Compass, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedVagaItem } from "@/lib/servicos/feed";
import type { IMatch } from "@/models/Match";
import CardVagaSwipe from "./CardVagaSwipe";
import MatchOverlay from "./MatchOverlay";
import SwipeDeck, { type Direcao } from "./SwipeDeck";
import TriagemSheet from "./TriagemSheet";

type MatchAberto = { id: string; score: number; snapshot: IMatch["snapshot"] };

/** Deck do profissional: busca vagas, envia swipes e celebra o match. */
export default function DeckProfissional() {
  const [itens, setItens] = useState<FeedVagaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [restantes, setRestantes] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [travado, setTravado] = useState(false);
  const [match, setMatch] = useState<MatchAberto | null>(null);
  /** Vaga curtida que tem perguntas de triagem — abre a folha de respostas. */
  const [triagem, setTriagem] = useState<FeedVagaItem | null>(null);

  const buscando = useRef(false);
  const vistos = useRef(new Set<string>());

  const carregar = useCallback(async () => {
    if (buscando.current) return;
    buscando.current = true;
    try {
      const res = await fetch("/api/match/feed?limite=20", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setAviso(data.error ?? "Não foi possível carregar o feed.");
        return;
      }
      const novos = (data.cards as FeedVagaItem[]).filter((c) => !vistos.current.has(c.vaga.id));
      novos.forEach((c) => vistos.current.add(c.vaga.id));
      setItens((atual) => [...atual, ...novos]);
      setRestantes(data.restantes ?? 0);
    } catch {
      setAviso("Sem conexão. Tente de novo.");
    } finally {
      buscando.current = false;
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const decidir = useCallback(async (item: FeedVagaItem, direcao: Direcao) => {
    const res = await fetch("/api/match/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vagaId: item.vaga.id, direcao }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 429) {
      setTravado(true);
      setAviso(data.error ?? "Limite diário atingido.");
      return;
    }
    if (!res.ok && res.status !== 409) {
      setAviso(data.error ?? "Não foi possível registrar sua escolha.");
      return;
    }
    if (data.match) setMatch(data.match);
    if (res.ok && direcao !== "pass" && item.vaga.perguntasTriagem.length > 0) setTriagem(item);
  }, []);

  const enviarTriagem = useCallback(
    async (respostas: string[]) => {
      if (!triagem) return;
      const res = await fetch("/api/match/triagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vagaId: triagem.vaga.id, respostas }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível enviar as respostas.");
      setTriagem(null);
      setSucesso(`Respostas enviadas para ${triagem.vaga.empresa.nome}.`);
    },
    [triagem]
  );

  const aoFicarNoFim = useCallback(
    (sobrando: number) => {
      if (restantes > 0 || sobrando === 0) carregar();
    },
    [restantes, carregar]
  );

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-muted-foreground gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Calculando os melhores matches para você…</p>
      </div>
    );
  }

  return (
    <>
      {aviso && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>{aviso}</span>
          <button type="button" className="text-xs font-semibold underline" onClick={() => setAviso(null)}>
            fechar
          </button>
        </div>
      )}
      {sucesso && (
        <div className="mb-3 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-800 flex items-center justify-between gap-3">
          <span>{sucesso}</span>
          <button type="button" className="text-xs font-semibold underline" onClick={() => setSucesso(null)}>
            fechar
          </button>
        </div>
      )}

      <SwipeDeck
        itens={itens}
        chave={(i) => i.vaga.id}
        renderizar={(item, topo) => <CardVagaSwipe item={item} topo={topo} />}
        aoDecidir={decidir}
        aoFicarNoFim={aoFicarNoFim}
        travado={travado}
        rotulos={{ like: "TENHO INTERESSE", pass: "PASSAR", super: "MUITO INTERESSE" }}
        vazio={
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Por enquanto é isso</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              Você viu todas as vagas compatíveis. Novas vagas entram todo dia — e ampliar seu raio ou completar
              o perfil traz mais opções.
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <Button variant="outline" onClick={() => carregar()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Buscar de novo
              </Button>
              <Link href="/perfil/editar">
                <Button variant="ghost" className="w-full gap-2">
                  <Settings2 className="h-4 w-4" />
                  Ajustar preferências
                </Button>
              </Link>
            </div>
          </div>
        }
      />

      {match && <MatchOverlay match={match} lado="profissional" aoFechar={() => setMatch(null)} />}

      {/* Depois da celebração do match (se houver), as perguntas da empresa. */}
      {triagem && !match && (
        <TriagemSheet
          vagaTitulo={triagem.vaga.titulo}
          empresaNome={triagem.vaga.empresa.nome}
          perguntas={triagem.vaga.perguntasTriagem}
          aoEnviar={enviarTriagem}
          aoPular={() => setTriagem(null)}
        />
      )}
    </>
  );
}
