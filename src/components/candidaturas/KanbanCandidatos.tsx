"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { Briefcase, ChevronDown, ClipboardList, EyeOff, Heart, Loader2, MapPin, MessageCircle, PlayCircle, Sparkles, StickyNote, User } from "lucide-react";
import { AnelScore } from "@/components/match/ScoreBadge";
import { formatarDuracao } from "@/components/perfil/VideoApresentacao";
import type { CandidatoKanban } from "@/lib/servicos/candidaturas";
import type { StatusCandidatura } from "@/lib/servicos/status";
import type { TriagemKanban } from "@/lib/servicos/triagem";

interface Coluna {
  id: string;
  titulo: string;
  statuses: StatusCandidatura[];
  /** Status gravado quando um card é solto aqui. */
  destino: StatusCandidatura;
  cor: string;
}

const COLUNAS: Coluna[] = [
  { id: "novos", titulo: "Novos", statuses: ["enviada", "visualizada"], destino: "visualizada", cor: "border-t-blue-400" },
  { id: "em_analise", titulo: "Em análise", statuses: ["em_analise"], destino: "em_analise", cor: "border-t-amber-400" },
  { id: "entrevista", titulo: "Entrevista", statuses: ["entrevista"], destino: "entrevista", cor: "border-t-violet-400" },
  { id: "aprovada", titulo: "Aprovados", statuses: ["aprovada"], destino: "aprovada", cor: "border-t-emerald-500" },
  { id: "recusada", titulo: "Recusados", statuses: ["recusada"], destino: "recusada", cor: "border-t-gray-400" },
];

function colunaDe(status: StatusCandidatura): Coluna {
  return COLUNAS.find((c) => c.statuses.includes(status)) ?? COLUNAS[0];
}

function iniciais(nome: string) {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

/**
 * Funil de contratação de uma vaga. Arrastar e soltar no desktop; no toque,
 * o seletor "Mover para" de cada card. Cada mudança é otimista e desfeita se
 * a API recusar.
 */
export default function KanbanCandidatos({
  candidatos: inicial,
  modoCego,
  iaDisponivel = false,
}: {
  candidatos: CandidatoKanban[];
  modoCego: boolean;
  /** Com ANTHROPIC_API_KEY no servidor: resume as respostas de triagem que ainda não têm resumo. */
  iaDisponivel?: boolean;
}) {
  const [candidatos, setCandidatos] = useState(inicial);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resumindo, setResumindo] = useState<string | null>(null);
  const resumoIniciado = useRef(false);

  // Resumos são gerados sob demanda, um por vez, só quando a empresa abre o
  // funil — e cada candidatura é resumida uma única vez (fica gravada).
  useEffect(() => {
    if (!iaDisponivel || resumoIniciado.current) return;
    const pendentes = inicial
      .filter((c) => c.triagem && !c.triagem.ia && c.triagem.respostas.some((r) => r.trim()))
      .map((c) => c.id);
    if (!pendentes.length) return;
    resumoIniciado.current = true;

    (async () => {
      for (const id of pendentes) {
        setResumindo(id);
        const r = await fetch(`/api/candidaturas/${id}/triagem-ia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }).catch(() => null);
        if (!r || r.status === 503) break; // IA indisponível: mostra só as respostas
        if (r.ok) {
          const d = await r.json().catch(() => null);
          if (d?.ia) {
            setCandidatos((lista) =>
              lista.map((c) => (c.id === id && c.triagem ? { ...c, triagem: { ...c.triagem, ia: d.ia } } : c))
            );
          }
        }
      }
      setResumindo(null);
    })();
  }, [iaDisponivel, inicial]);

  async function mover(id: string, destino: StatusCandidatura) {
    const atual = candidatos.find((c) => c.id === id);
    if (!atual || atual.status === destino) return;
    const anterior = atual.status;
    setCandidatos((lista) => lista.map((c) => (c.id === id ? { ...c, status: destino } : c)));

    const r = await fetch(`/api/candidaturas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: destino }),
    }).catch(() => null);

    if (!r?.ok) {
      const d = await r?.json().catch(() => ({}));
      setErro(d?.error ?? "Não foi possível mover o candidato.");
      setCandidatos((lista) => lista.map((c) => (c.id === id ? { ...c, status: anterior } : c)));
    }
  }

  async function anotar(id: string, nota: string) {
    setCandidatos((lista) => lista.map((c) => (c.id === id ? { ...c, notaEmpresa: nota || null } : c)));
    await fetch(`/api/candidaturas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notaEmpresa: nota || null }),
    }).catch(() => null);
  }

  function aoSoltar(e: DragEvent, coluna: Coluna) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || arrastando;
    setSobre(null);
    setArrastando(null);
    if (id) mover(id, coluna.destino);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{candidatos.length}</span> candidato{candidatos.length === 1 ? "" : "s"} · arraste
          entre as colunas
        </p>
        {modoCego && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
            <EyeOff className="h-3.5 w-3.5" /> Modo às cegas até a entrevista
          </span>
        )}
      </div>

      {erro && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800 flex items-center justify-between gap-3">
          <span>{erro}</span>
          <button type="button" className="text-xs font-semibold underline" onClick={() => setErro(null)}>fechar</button>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
        {COLUNAS.map((coluna) => {
          const cards = candidatos.filter((c) => coluna.statuses.includes(c.status));
          const ativa = sobre === coluna.id;
          return (
            <section
              key={coluna.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (sobre !== coluna.id) setSobre(coluna.id);
              }}
              onDragLeave={() => setSobre((s) => (s === coluna.id ? null : s))}
              onDrop={(e) => aoSoltar(e, coluna)}
              className={`snap-start shrink-0 w-[272px] rounded-2xl border border-t-4 bg-[#f4f7f5] ${coluna.cor} ${
                ativa ? "ring-2 ring-primary/50 bg-primary/5" : "border-border/40"
              } transition-colors`}
            >
              <header className="px-3 py-2.5 flex items-center justify-between">
                <p className="text-sm font-bold">{coluna.titulo}</p>
                <span className="text-xs font-semibold text-muted-foreground bg-white border border-border/40 rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </header>

              <div className="px-2 pb-2 space-y-2 min-h-[120px]">
                {cards.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border/60 rounded-xl">
                    Solte aqui
                  </p>
                )}
                {cards.map((c) => (
                  <CardCandidato
                    key={c.id}
                    c={c}
                    arrastando={arrastando === c.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastando(c.id);
                    }}
                    onDragEnd={() => {
                      setArrastando(null);
                      setSobre(null);
                    }}
                    onMover={(destino) => mover(c.id, destino)}
                    onAnotar={(nota) => anotar(c.id, nota)}
                    resumindo={resumindo === c.id}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CardCandidato({
  c,
  arrastando,
  onDragStart,
  onDragEnd,
  onMover,
  onAnotar,
  resumindo,
}: {
  c: CandidatoKanban;
  arrastando: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onMover: (destino: StatusCandidatura) => void;
  onAnotar: (nota: string) => void;
  resumindo: boolean;
}) {
  const [notaAberta, setNotaAberta] = useState(false);
  const [videoAberto, setVideoAberto] = useState(false);
  const [nota, setNota] = useState(c.notaEmpresa ?? "");
  const coluna = colunaDe(c.status);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl border border-border/40 shadow-sm p-3 cursor-grab active:cursor-grabbing ${
        arrastando ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1a5c38] flex items-center justify-center shrink-0">
          {c.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.foto} alt="" className="w-full h-full object-cover" draggable={false} />
          ) : c.oculto ? (
            <User className="h-5 w-5 text-[#4ade80]" />
          ) : (
            <span className="text-xs font-black text-[#4ade80]">{iniciais(c.nome)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight truncate">{c.nome}</p>
          <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {[c.cidade, c.estado].filter(Boolean).join(", ") || "—"}
            {c.anosExperiencia > 0 && (
              <>
                <span>·</span>
                <Briefcase className="h-3 w-3" />
                {c.anosExperiencia} anos
              </>
            )}
          </p>
        </div>
        {c.score && <AnelScore total={c.score.total} faixa={c.score.faixa} tamanho={40} />}
      </div>

      {c.especialidades.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {c.especialidades.slice(0, 2).map((e) => (
            <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {e}
            </span>
          ))}
          {c.especialidades.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{c.especialidades.length - 2}</span>
          )}
        </div>
      )}

      {c.score?.explicacao && <p className="text-[11px] text-emerald-700 mt-1.5">✓ {c.score.explicacao}</p>}
      {c.mensagem && <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2">“{c.mensagem}”</p>}

      {c.triagem && <TriagemCard t={c.triagem} resumindo={resumindo} />}

      {videoAberto && c.video && (
        <video src={c.video.url} controls autoPlay playsInline preload="metadata" className="mt-2 w-full rounded-lg bg-black" />
      )}

      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/40">
        {c.video && (
          <button
            type="button"
            onClick={() => setVideoAberto((v) => !v)}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1 ${videoAberto ? "text-primary" : "text-muted-foreground"} hover:text-primary`}
            title={`Vídeo de apresentação (${formatarDuracao(c.video.duracao)})`}
          >
            <PlayCircle className="h-3.5 w-3.5" /> Vídeo
          </button>
        )}
        {c.matchId && (
          <Link
            href={`/matches/${c.matchId}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-1"
            title="Este candidato deu match com a vaga"
          >
            <Heart className="h-3 w-3 fill-current" /> Chat
          </Link>
        )}
        {!c.oculto && (
          <Link href={`/profissionais/${c.profissionalId}`} className="text-[11px] font-semibold text-muted-foreground hover:text-primary px-1">
            Perfil
          </Link>
        )}
        <button
          type="button"
          onClick={() => setNotaAberta((v) => !v)}
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1 ${c.notaEmpresa ? "text-amber-700" : "text-muted-foreground"} hover:text-primary`}
          title="Anotação interna"
        >
          <StickyNote className="h-3 w-3" /> {c.notaEmpresa ? "Nota" : "Anotar"}
        </button>
        <select
          aria-label="Mover para"
          value={coluna.id}
          onChange={(e) => {
            const destino = COLUNAS.find((col) => col.id === e.target.value)?.destino;
            if (destino) onMover(destino);
          }}
          className="ml-auto text-[11px] rounded-md border border-border/60 bg-white px-1.5 py-1 text-foreground"
        >
          {COLUNAS.map((col) => (
            <option key={col.id} value={col.id}>
              {col.titulo}
            </option>
          ))}
        </select>
      </div>

      {notaAberta && (
        <div className="mt-2">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onBlur={() => onAnotar(nota.trim())}
            rows={2}
            maxLength={1000}
            placeholder="Anotação só sua (o candidato não vê)"
            className="w-full text-xs rounded-lg border border-border/60 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {c.matchId && c.score === null && (
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <MessageCircle className="h-3 w-3" /> Veio pelo Descobrir
        </p>
      )}
    </article>
  );
}

/** Respostas de triagem + leitura da IA. A nota é apoio: quem move o card é a empresa. */
function TriagemCard({ t, resumindo }: { t: TriagemKanban; resumindo: boolean }) {
  const [aberta, setAberta] = useState(false);
  const respondidas = t.respostas.filter((r) => r?.trim()).length;
  const ia = t.ia;

  return (
    <div className="mt-2 rounded-lg bg-[#f4f7f5] border border-border/40 px-2.5 py-2 text-[11px]">
      {ia ? (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary shrink-0" />
            <span className="font-semibold text-primary">Triagem</span>
            <Nota valor={ia.nota} />
            <span className={`ml-auto font-semibold ${ia.recomendaEntrevista ? "text-emerald-700" : "text-amber-700"}`}>
              {ia.recomendaEntrevista ? "Vale entrevistar" : "Com ressalvas"}
            </span>
          </div>
          <p className="text-foreground/80 leading-snug">{ia.resumo}</p>
          {(ia.pontosFortes.length > 0 || ia.ressalvas.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {ia.pontosFortes.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ {p}
                </span>
              ))}
              {ia.ressalvas.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  ! {p}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <ClipboardList className="h-3 w-3 text-primary shrink-0" />
          <span className="font-semibold">
            Triagem · {respondidas}/{t.perguntas.length} respondida{respondidas === 1 ? "" : "s"}
          </span>
          {resumindo && (
            <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> resumindo…
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="mt-1 inline-flex items-center gap-1 text-muted-foreground hover:text-primary font-medium"
      >
        {aberta ? "Ocultar respostas" : "Ver respostas"}
        <ChevronDown className={`h-3 w-3 transition-transform ${aberta ? "rotate-180" : ""}`} />
      </button>

      {aberta && (
        <dl className="mt-1.5 space-y-1.5">
          {t.perguntas.map((p, i) => {
            const r = t.respostas[i]?.trim();
            return (
              <div key={i}>
                <dt className="font-semibold text-foreground/70">{p}</dt>
                <dd className={r ? "text-foreground/90" : "text-muted-foreground italic"}>{r || "(sem resposta)"}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </div>
  );
}

function Nota({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Nota ${valor} de 5`} title={`Aderência das respostas: ${valor}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-1.5 h-1.5 rounded-full ${n <= valor ? "bg-primary" : "bg-border"}`} />
      ))}
    </span>
  );
}
