"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MessageSquareReply, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_TEXTO, PRAZO_AVALIACAO_DIAS } from "@/constants/avaliacao";
import type { AvaliacaoDTO, ConvitePendente } from "@/lib/servicos/avaliacoes";
import Estrelas from "./Estrelas";
import FormularioAvaliacao from "./FormularioAvaliacao";

type Lado = "profissional" | "empresa";

function dataBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function PainelAvaliacoes({ lado, matchDestacado }: { lado: Lado; matchDestacado: string | null }) {
  const [pendentes, setPendentes] = useState<ConvitePendente[]>([]);
  const [recebidas, setRecebidas] = useState<AvaliacaoDTO[]>([]);
  const [enviadas, setEnviadas] = useState<AvaliacaoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [abrindo, setAbrindo] = useState<string | null>(matchDestacado);
  const [aviso, setAviso] = useState<string | null>(null);

  async function carregar() {
    const r = await fetch("/api/avaliacoes", { cache: "no-store" }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (d) {
      setPendentes(d.pendentes ?? []);
      setRecebidas(d.recebidas ?? []);
      setEnviadas(d.enviadas ?? []);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function concluida(a: AvaliacaoDTO) {
    setPendentes((p) => p.filter((x) => x.matchId !== a.matchId));
    setEnviadas((e) => [a, ...e]);
    setAbrindo(null);
    setAviso(
      a.publicadaEm
        ? "Avaliação publicada — a outra parte também já tinha avaliado."
        : "Avaliação enviada. Ela será publicada quando a outra parte avaliar, ou em 14 dias."
    );
    // Publicação dupla pode ter liberado uma recebida.
    carregar();
  }

  async function responder(id: string, texto: string) {
    const r = await fetch(`/api/avaliacoes/${id}/resposta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setAviso(d.error ?? "Não foi possível responder.");
      return;
    }
    setRecebidas((lista) => lista.map((a) => (a.id === id ? d.avaliacao : a)));
  }

  async function contestar(id: string, motivo: string) {
    const r = await fetch(`/api/avaliacoes/${id}/disputa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setAviso(d.error ?? "Não foi possível contestar.");
      return;
    }
    setRecebidas((lista) => lista.map((a) => (a.id === id ? d.avaliacao : a)));
    setAviso("Contestação enviada para a moderação. Você será avisado da decisão.");
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const prazo = lado === "empresa" ? "após a contratação (3 dias para temporário/sazonal, 30 para CLT)" : "após a contratação";

  return (
    <div className="space-y-8">
      {aviso && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 flex items-center justify-between gap-3">
          <span>{aviso}</span>
          <button type="button" className="text-xs font-semibold underline" onClick={() => setAviso(null)}>fechar</button>
        </div>
      )}

      {/* Para avaliar */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary inline-block" /> Para avaliar
        </h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada pendente. Convites aparecem aqui {prazo} — só quem contratou pela plataforma avalia.
          </p>
        ) : (
          <ul className="space-y-3">
            {pendentes.map((p) =>
              abrindo === p.matchId ? (
                <li key={p.matchId}>
                  <FormularioAvaliacao
                    lado={lado}
                    matchId={p.matchId}
                    outroNome={p.outroNome}
                    vagaTitulo={p.vagaTitulo}
                    aoConcluir={concluida}
                    aoCancelar={() => setAbrindo(null)}
                  />
                </li>
              ) : (
                <li key={p.matchId} className="bg-white rounded-2xl border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.outroNome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.vagaTitulo} · contratação em {dataBR(p.contratadoEm)} · {PRAZO_AVALIACAO_DIAS[p.tipoVinculo] ?? 30} dias de prazo já
                      cumpridos
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAbrindo(p.matchId)}>
                    Avaliar
                  </Button>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      {/* Recebidas */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary inline-block" /> Recebidas
        </h2>
        {recebidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação publicada sobre você ainda.</p>
        ) : (
          <ul className="space-y-3">
            {recebidas.map((a) => (
              <CartaoRecebida key={a.id} a={a} onResponder={responder} onContestar={contestar} />
            ))}
          </ul>
        )}
      </section>

      {/* Enviadas */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary inline-block" /> Enviadas
        </h2>
        {enviadas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não avaliou ninguém.</p>
        ) : (
          <ul className="space-y-2">
            {enviadas.map((a) => (
              <li key={a.id} className="bg-white rounded-2xl border border-border/40 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{a.avaliadoNome}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.vagaTitulo}</p>
                </div>
                <div className="text-right shrink-0">
                  <Estrelas nota={a.media} />
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                    {a.publicadaEm ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> publicada
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" /> aguardando a outra parte
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CartaoRecebida({
  a,
  onResponder,
  onContestar,
}: {
  a: AvaliacaoDTO;
  onResponder: (id: string, texto: string) => Promise<void>;
  onContestar: (id: string, motivo: string) => Promise<void>;
}) {
  const [modo, setModo] = useState<"nenhum" | "resposta" | "disputa">("nenhum");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    if (!texto.trim()) return;
    setEnviando(true);
    if (modo === "resposta") await onResponder(a.id, texto.trim());
    else await onContestar(a.id, texto.trim());
    setEnviando(false);
    setModo("nenhum");
    setTexto("");
  }

  return (
    <li className="bg-white rounded-2xl border border-border/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{a.autorNome}</p>
          <p className="text-xs text-muted-foreground truncate">
            {a.vagaTitulo} · {a.publicadaEm ? dataBR(a.publicadaEm) : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <Estrelas nota={a.media} />
          <p className="text-xs font-bold mt-0.5">{a.media.toFixed(1).replace(".", ",")}</p>
        </div>
      </div>

      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
        {a.criterios.map((c) => (
          <li key={c.chave} className="flex items-center justify-between text-sm">
            <span className="text-foreground/80">{c.label}</span>
            <Estrelas nota={c.nota} tamanho={13} />
          </li>
        ))}
      </ul>

      <p className="text-sm flex items-center gap-1.5">
        {a.recomendaria ? (
          <>
            <ThumbsUp className="h-4 w-4 text-emerald-600" /> Recomendaria
          </>
        ) : (
          <>
            <ThumbsDown className="h-4 w-4 text-gray-500" /> Não recomendaria
          </>
        )}
      </p>

      {a.comentario && (
        <p className="text-sm text-foreground/80 bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-0.5">Comentário privado para você</span>
          {a.comentario}
        </p>
      )}

      {a.resposta && (
        <p className="text-sm text-foreground/80 border-l-2 border-primary/40 pl-3">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-0.5">Sua resposta · {dataBR(a.resposta.em)}</span>
          {a.resposta.texto}
        </p>
      )}

      {a.disputa && (
        <p className="text-xs flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          Contestação {a.disputa.status === "aberta" ? "em análise pela moderação" : a.disputa.status === "aceita" ? "aceita" : "analisada — avaliação mantida"}
          {a.disputa.notaAdmin ? ` · ${a.disputa.notaAdmin}` : ""}
        </p>
      )}

      {modo === "nenhum" ? (
        <div className="flex gap-3">
          {!a.resposta && (
            <button type="button" onClick={() => setModo("resposta")} className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline">
              <MessageSquareReply className="h-3.5 w-3.5" /> Responder
            </button>
          )}
          {!a.disputa && (
            <button type="button" onClick={() => setModo("disputa")} className="text-xs font-semibold text-muted-foreground hover:text-amber-700 hover:underline">
              Contestar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={MAX_TEXTO}
            placeholder={modo === "resposta" ? "Sua resposta fica visível junto com a avaliação." : "Explique por que a avaliação não corresponde aos fatos. A moderação analisa."}
            className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={enviar} disabled={enviando || !texto.trim()}>
              {modo === "resposta" ? "Publicar resposta" : "Enviar contestação"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setModo("nenhum")}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
