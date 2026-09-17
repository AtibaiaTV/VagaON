"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, User, Send, Phone, Mail, ExternalLink, FileText, Globe, MapPin,
  MoreVertical, CheckCircle2, CalendarCheck, XCircle, RefreshCw, CalendarPlus, CalendarX2, Clock, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EntrevistaDTO, MatchDetalhe, MensagemDTO } from "@/lib/servicos/matches";
import type { ContatoEmpresa, ContatoProfissional } from "@/lib/servicos/projecoes";

const INTERVALO_POLLING_MS = 4000;

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ehContatoProfissional(c: ContatoProfissional | ContatoEmpresa): c is ContatoProfissional {
  return "linkedinUrl" in c;
}

function dataCurta(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-09-20T14:30" no fuso do navegador — para o min do datetime-local. */
function agoraLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function linkGoogleAgenda(e: EntrevistaDTO, titulo: string, url: string) {
  if (!e.escolhida) return "#";
  const ics = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const inicio = new Date(e.escolhida);
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Entrevista — ${titulo}`,
    dates: `${ics(inicio.toISOString())}/${ics(fim.toISOString())}`,
    details: [e.observacao, `Conversa no VagaON: ${url}`].filter(Boolean).join("\n"),
    location: e.local ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Conversa de um match. Sem websocket: carrega o histórico e depois busca só
 * o que chegou depois da última mensagem, a cada poucos segundos. Simples,
 * roda em serverless, e a UI não muda se um dia virar tempo real.
 */
export default function Chat({ matchId, lado }: { matchId: string; lado: "profissional" | "empresa" }) {
  const [detalhe, setDetalhe] = useState<MatchDetalhe | null>(null);
  const [mensagens, setMensagens] = useState<MensagemDTO[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarContato, setMostrarContato] = useState(false);
  const [agendando, setAgendando] = useState(false);
  const [propostas, setPropostas] = useState(["", "", ""]);
  const [localEntrevista, setLocalEntrevista] = useState("");
  const [obsEntrevista, setObsEntrevista] = useState("");
  const [salvandoEntrevista, setSalvandoEntrevista] = useState(false);

  const ultimaEm = useRef<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const idsVistos = useRef(new Set<string>());

  const acrescentar = useCallback((novas: MensagemDTO[]) => {
    const ineditas = novas.filter((m) => !idsVistos.current.has(m.id));
    if (!ineditas.length) return;
    ineditas.forEach((m) => idsVistos.current.add(m.id));
    setMensagens((atual) => [...atual, ...ineditas]);
    ultimaEm.current = ineditas[ineditas.length - 1].em;
  }, []);

  // Carga inicial: detalhe + histórico.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const [rd, rm] = await Promise.all([
        fetch(`/api/matches/${matchId}`, { cache: "no-store" }),
        fetch(`/api/matches/${matchId}/mensagens`, { cache: "no-store" }),
      ]);
      if (cancelado) return;
      if (!rd.ok) {
        setErro((await rd.json().catch(() => ({}))).error ?? "Match não encontrado.");
        return;
      }
      setDetalhe(await rd.json());
      const dm = await rm.json();
      acrescentar(dm.mensagens ?? []);
    })();
    return () => {
      cancelado = true;
    };
  }, [matchId, acrescentar]);

  // Polling do que chegou depois.
  useEffect(() => {
    if (!detalhe || detalhe.match.status === "encerrado") return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const q = ultimaEm.current ? `?depois=${encodeURIComponent(ultimaEm.current)}` : "";
      const r = await fetch(`/api/matches/${matchId}/mensagens${q}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok) return;
      const d = await r.json();
      acrescentar(d.mensagens ?? []);
      if (d.status && d.status !== detalhe.match.status) {
        setDetalhe((atual) => atual && { ...atual, match: { ...atual.match, status: d.status } });
      }
      // A entrevista muda do outro lado (proposta, escolha, cancelamento) — acompanha.
      if (d.entrevista !== undefined && JSON.stringify(d.entrevista) !== JSON.stringify(detalhe.match.entrevista)) {
        setDetalhe((atual) => atual && { ...atual, match: { ...atual.match, entrevista: d.entrevista } });
      }
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(timer);
  }, [matchId, detalhe, acrescentar]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens.length]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setTexto("");
    const r = await fetch(`/api/matches/${matchId}/mensagens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: t }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErro(d.error ?? "Não foi possível enviar.");
      setTexto(t);
    } else {
      acrescentar([d.mensagem]);
      setDetalhe((atual) =>
        atual && atual.match.status === "novo" ? { ...atual, match: { ...atual.match, status: "conversando" } } : atual
      );
    }
    setEnviando(false);
  }

  async function mudarStatus(status: "entrevista" | "contratado" | "encerrado") {
    setMenuAberto(false);
    if (status === "encerrado" && !confirm("Encerrar esta conversa? Isso não pode ser desfeito.")) return;
    const r = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErro(d.error ?? "Não foi possível atualizar.");
      return;
    }
    setDetalhe((atual) => atual && { ...atual, match: d.match, contato: status === "encerrado" ? null : atual.contato });
  }

  function aplicarEntrevista(entrevista: EntrevistaDTO | null, status?: string) {
    setDetalhe(
      (atual) =>
        atual && {
          ...atual,
          match: { ...atual.match, entrevista, ...(status ? { status: status as MatchDetalhe["match"]["status"] } : {}) },
        }
    );
  }

  async function proporHorarios(e: React.FormEvent) {
    e.preventDefault();
    const lista = propostas.filter(Boolean).map((v) => new Date(v).toISOString());
    if (!lista.length) {
      setErro("Informe pelo menos um horário.");
      return;
    }
    setSalvandoEntrevista(true);
    const r = await fetch(`/api/matches/${matchId}/entrevista`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propostas: lista, local: localEntrevista, observacao: obsEntrevista }),
    });
    const d = await r.json().catch(() => ({}));
    setSalvandoEntrevista(false);
    if (!r.ok) {
      setErro(d.error ?? "Não foi possível propor os horários.");
      return;
    }
    aplicarEntrevista(d.entrevista);
    setAgendando(false);
    setPropostas(["", "", ""]);
  }

  async function escolherHorario(iso: string) {
    setSalvandoEntrevista(true);
    const r = await fetch(`/api/matches/${matchId}/entrevista`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ escolhida: iso }),
    });
    const d = await r.json().catch(() => ({}));
    setSalvandoEntrevista(false);
    if (!r.ok) {
      setErro(d.error ?? "Não foi possível confirmar.");
      return;
    }
    aplicarEntrevista(d.entrevista, "entrevista");
  }

  async function cancelarEntrevista() {
    if (!confirm("Cancelar a entrevista? Vocês podem combinar outro horário depois.")) return;
    setSalvandoEntrevista(true);
    const r = await fetch(`/api/matches/${matchId}/entrevista`, { method: "DELETE" });
    setSalvandoEntrevista(false);
    if (!r.ok) {
      setErro("Não foi possível cancelar.");
      return;
    }
    aplicarEntrevista(null);
  }

  if (erro && !detalhe) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{erro}</p>
        <Link href="/matches" className="inline-block mt-4">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  if (!detalhe) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const { match, vaga, profissional, contato } = detalhe;
  const outroNome = lado === "profissional" ? vaga.empresa.nome : profissional.nome;
  const outraFoto = lado === "profissional" ? vaga.empresa.logo : profissional.foto;
  const encerrado = match.status === "encerrado";

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] sm:h-[calc(100dvh-80px)] max-w-md w-full mx-auto bg-white sm:border-x border-border/40">
      {/* Cabeçalho */}
      <header style={{ backgroundColor: lado === "empresa" ? "#143f28" : "#1a5c38" }} className="px-3 py-3 flex items-center gap-3 shrink-0">
        <Link href="/matches" className="text-white/70 hover:text-white p-1" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={() => setMostrarContato((v) => !v)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0">
            {outraFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outraFoto} alt="" className="w-full h-full object-cover" />
            ) : lado === "profissional" ? (
              <Building2 className="h-5 w-5 text-[#4ade80]" />
            ) : (
              <User className="h-5 w-5 text-[#4ade80]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate leading-tight">{outroNome}</p>
            <p className="text-white/60 text-xs truncate">{vaga.titulo} · {match.score}% de aderência</p>
          </div>
        </button>

        {!encerrado && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="text-white/70 hover:text-white p-1"
              aria-label="Ações"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuAberto && (
              <div className="absolute right-0 top-9 z-20 w-56 bg-white rounded-xl shadow-xl border border-border/50 py-1 text-sm">
                {lado === "empresa" && match.status !== "contratado" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      setAgendando(true);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2"
                  >
                    <CalendarPlus className="h-4 w-4 text-violet-600" /> Propor horários de entrevista
                  </button>
                )}
                {lado === "empresa" && match.status !== "entrevista" && match.status !== "contratado" && (
                  <button type="button" onClick={() => mudarStatus("entrevista")} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-violet-600" /> Marcar como em entrevista
                  </button>
                )}
                {lado === "empresa" && match.status !== "contratado" && (
                  <button type="button" onClick={() => mudarStatus("contratado")} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Marcar como contratado
                  </button>
                )}
                {match.status === "contratado" && (
                  <Link href={`/avaliacoes?match=${matchId}`} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-500" /> Avaliar a experiência
                  </Link>
                )}
                <button type="button" onClick={() => mudarStatus("encerrado")} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" /> Encerrar conversa
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Contato revelado */}
      {mostrarContato && contato && (
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 text-sm space-y-1.5">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Contato liberado pelo match</p>
          {contato.telefone && (
            <a href={`tel:${contato.telefone}`} className="flex items-center gap-2 text-emerald-900">
              <Phone className="h-4 w-4" /> {contato.telefone}
            </a>
          )}
          {contato.email && (
            <a href={`mailto:${contato.email}`} className="flex items-center gap-2 text-emerald-900">
              <Mail className="h-4 w-4" /> {contato.email}
            </a>
          )}
          {ehContatoProfissional(contato) ? (
            <>
              {contato.linkedinUrl && (
                <a href={contato.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-900">
                  <ExternalLink className="h-4 w-4" /> LinkedIn
                </a>
              )}
              {contato.curriculoUrl && (
                <a href={contato.curriculoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-900">
                  <FileText className="h-4 w-4" /> Currículo
                </a>
              )}
            </>
          ) : (
            <>
              {contato.website && (
                <a href={contato.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-900">
                  <Globe className="h-4 w-4" /> Site
                </a>
              )}
              {contato.endereco && (
                <p className="flex items-center gap-2 text-emerald-900">
                  <MapPin className="h-4 w-4" /> {contato.endereco}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Propor horários (empresa) */}
      {agendando && !encerrado && (
        <form onSubmit={proporHorarios} className="px-4 py-3 bg-violet-50 border-b border-violet-100 space-y-2 text-sm">
          <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide">Propor horários de entrevista</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {propostas.map((v, i) => (
              <input
                key={i}
                type="datetime-local"
                min={agoraLocal()}
                value={v}
                required={i === 0}
                onChange={(e) => setPropostas((p) => p.map((x, j) => (j === i ? e.target.value : x)))}
                className="rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs"
              />
            ))}
          </div>
          <input
            type="text"
            value={localEntrevista}
            onChange={(e) => setLocalEntrevista(e.target.value)}
            placeholder="Local (endereço ou 'online')"
            maxLength={300}
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs"
          />
          <input
            type="text"
            value={obsEntrevista}
            onChange={(e) => setObsEntrevista(e.target.value)}
            placeholder="Observação (opcional): o que levar, com quem falar…"
            maxLength={500}
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvandoEntrevista} className="bg-violet-600 hover:bg-violet-700 text-white">
              {salvandoEntrevista ? "Enviando…" : "Enviar horários"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAgendando(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Cartão da entrevista */}
      {match.entrevista && !encerrado && (
        <div className="px-4 py-3 bg-violet-50 border-b border-violet-100 text-sm space-y-2">
          {match.entrevista.escolhida ? (
            <>
              <p className="flex items-center gap-2 font-semibold text-violet-900">
                <CalendarCheck className="h-4 w-4" /> Entrevista confirmada: {dataCurta(match.entrevista.escolhida)}
              </p>
              {match.entrevista.local && (
                <p className="flex items-center gap-2 text-violet-900/80 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> {match.entrevista.local}
                </p>
              )}
              {match.entrevista.observacao && <p className="text-xs text-violet-900/80">{match.entrevista.observacao}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={linkGoogleAgenda(match.entrevista, vaga.titulo, `${typeof window !== "undefined" ? window.location.origin : ""}/matches/${matchId}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Google Agenda
                </a>
                <a
                  href={`/api/matches/${matchId}/entrevista/ics`}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar .ics
                </a>
                <button
                  type="button"
                  onClick={cancelarEntrevista}
                  disabled={salvandoEntrevista}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <CalendarX2 className="h-3.5 w-3.5" /> Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-semibold text-violet-900">
                <Clock className="h-4 w-4" />
                {lado === "profissional" ? "A empresa propôs horários — escolha um:" : "Horários propostos — aguardando o candidato"}
              </p>
              <div className="flex flex-wrap gap-2">
                {match.entrevista.propostas.map((iso) =>
                  lado === "profissional" ? (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => escolherHorario(iso)}
                      disabled={salvandoEntrevista}
                      className="rounded-full bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {dataCurta(iso)}
                    </button>
                  ) : (
                    <span key={iso} className="rounded-full bg-white border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-800">
                      {dataCurta(iso)}
                    </span>
                  )
                )}
              </div>
              {match.entrevista.local && (
                <p className="flex items-center gap-2 text-violet-900/80 text-xs">
                  <MapPin className="h-3.5 w-3.5" /> {match.entrevista.local}
                </p>
              )}
              {lado === "empresa" && (
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAgendando(true)} className="text-xs font-semibold text-violet-800 hover:underline">
                    Propor outros horários
                  </button>
                  <button type="button" onClick={cancelarEntrevista} disabled={salvandoEntrevista} className="text-xs font-semibold text-red-700 hover:underline">
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#f4f7f5]">
        {mensagens.map((m) =>
          m.autorTipo === "sistema" ? (
            <div key={m.id} className="text-center">
              <span className="inline-block text-xs text-muted-foreground bg-white border border-border/40 rounded-full px-3 py-1 max-w-[90%]">
                ✨ {m.texto}
              </span>
            </div>
          ) : (
            <div key={m.id} className={`flex ${m.minha ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  m.minha ? "bg-[#1a5c38] text-white rounded-br-md" : "bg-white border border-border/40 rounded-bl-md"
                }`}
              >
                {m.texto}
                <span className={`block text-[10px] mt-1 ${m.minha ? "text-white/60" : "text-muted-foreground"} text-right`}>
                  {horaDe(m.em)}
                </span>
              </div>
            </div>
          )
        )}
        <div ref={fimRef} />
      </div>

      {erro && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex justify-between">
          <span>{erro}</span>
          <button type="button" className="underline font-semibold" onClick={() => setErro(null)}>fechar</button>
        </div>
      )}

      {/* Entrada */}
      {encerrado ? (
        <div className="px-4 py-3 text-center text-sm text-muted-foreground border-t bg-white">Conversa encerrada.</div>
      ) : (
        <form onSubmit={enviar} className="flex items-end gap-2 px-3 py-3 border-t bg-white shrink-0">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(e);
              }
            }}
            placeholder="Escreva uma mensagem…"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none rounded-2xl border border-input bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
          />
          <Button type="submit" size="icon" disabled={!texto.trim() || enviando} className="rounded-full h-10 w-10 shrink-0" aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
