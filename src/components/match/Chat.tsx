"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, User, Send, Phone, Mail, ExternalLink, FileText, Globe, MapPin,
  MoreVertical, CheckCircle2, CalendarCheck, XCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchDetalhe, MensagemDTO } from "@/lib/servicos/matches";
import type { ContatoEmpresa, ContatoProfissional } from "@/lib/servicos/projecoes";

const INTERVALO_POLLING_MS = 4000;

function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function ehContatoProfissional(c: ContatoProfissional | ContatoEmpresa): c is ContatoProfissional {
  return "linkedinUrl" in c;
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
                {lado === "empresa" && match.status !== "entrevista" && match.status !== "contratado" && (
                  <button type="button" onClick={() => mudarStatus("entrevista")} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-violet-600" /> Marcar entrevista
                  </button>
                )}
                {lado === "empresa" && match.status !== "contratado" && (
                  <button type="button" onClick={() => mudarStatus("contratado")} className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Marcar como contratado
                  </button>
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
