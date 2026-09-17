"use client";

import { useState } from "react";
import { Briefcase, BadgeCheck, Building2, Clock, MapPin, Wallet, CalendarClock, ChevronDown } from "lucide-react";
import { formatarSalario } from "@/components/shared/VagaCard";
import { ESCALAS, TIPO_CONTRATO_LABEL, TURNOS, labelAfirmativa } from "@/constants/match";
import type { FeedVagaItem } from "@/lib/servicos/feed";
import ReputacaoBadge from "@/components/avaliacoes/ReputacaoBadge";
import ScoreBadge from "./ScoreBadge";

const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-400/20 border-blue-300/30",
  temporario: "bg-amber-400/20 border-amber-300/30",
  sazonal: "bg-violet-400/20 border-violet-300/30",
};

function rotulo(lista: readonly { value: string; label: string }[], v: string | null) {
  return v ? (lista.find((x) => x.value === v)?.label ?? v) : null;
}

/** Face do card de vaga no deck do profissional. */
export default function CardVagaSwipe({ item, topo }: { item: FeedVagaItem; topo: boolean }) {
  const { vaga, score } = item;
  const [expandido, setExpandido] = useState(false);
  const turno = rotulo(TURNOS, vaga.turno);
  const escala = rotulo(ESCALAS, vaga.escala);

  return (
    <article className="h-full w-full rounded-3xl overflow-hidden bg-white shadow-xl border border-border/40 flex flex-col">
      {/* Cabeçalho verde — identidade da marca */}
      <header style={{ backgroundColor: "#1a5c38" }} className="relative px-5 pt-5 pb-4 shrink-0">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {vaga.empresa.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vaga.empresa.logo} alt="" className="w-11 h-11 rounded-xl object-cover bg-white/15 shrink-0" draggable={false} />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-white/80" strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-white/85 font-medium truncate flex items-center gap-1">
                {vaga.empresa.nome}
                {vaga.empresa.verificada && <BadgeCheck className="h-4 w-4 text-[#4ade80] shrink-0" />}
              </p>
              <p className="text-xs text-white/60 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {vaga.remoto ? "Remoto" : `${vaga.cidade}, ${vaga.estado}`}
                {score.distanciaKm !== null && !vaga.remoto && ` · ${score.distanciaKm} km`}
              </p>
              <ReputacaoBadge rep={vaga.empresa.reputacao} compacto claro />
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border text-white shrink-0 whitespace-nowrap ${TIPO_COR[vaga.tipo] ?? "bg-white/15 border-white/20"}`}>
            {TIPO_CONTRATO_LABEL[vaga.tipo] ?? vaga.tipo}
          </span>
        </div>
        <h3 className="font-bold text-xl text-white leading-snug line-clamp-2">{vaga.titulo}</h3>
        <p className="text-sm text-[#4ade80] font-medium mt-0.5 flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          {vaga.especialidadeLabel}
        </p>
      </header>

      {/* Corpo rolável */}
      <div className={`flex-1 px-5 py-4 space-y-4 ${topo ? "overflow-y-auto scrollbar-hide" : "overflow-hidden"}`}>
        <ScoreBadge score={score} />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Fato icone={<Wallet className="h-4 w-4" />} texto={formatarSalario(vaga.salario)} />
          {(turno || escala) && (
            <Fato icone={<Clock className="h-4 w-4" />} texto={[turno, escala].filter(Boolean).join(" · ")} />
          )}
          {vaga.anosExperienciaMin > 0 && (
            <Fato icone={<Briefcase className="h-4 w-4" />} texto={`${vaga.anosExperienciaMin}+ anos de experiência`} />
          )}
          {vaga.periodo.dataInicio && (
            <Fato
              icone={<CalendarClock className="h-4 w-4" />}
              texto={`Início ${new Date(vaga.periodo.dataInicio).toLocaleDateString("pt-BR")}`}
            />
          )}
        </div>

        {vaga.afirmativa.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vaga.afirmativa.map((a) => (
              <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold">
                Vaga afirmativa · {labelAfirmativa(a)}
              </span>
            ))}
          </div>
        )}

        {vaga.habilidadesDesejadas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {vaga.habilidadesDesejadas.map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {h}
              </span>
            ))}
          </div>
        )}

        <div>
          <p className={`text-sm text-foreground/80 whitespace-pre-line ${expandido ? "" : "line-clamp-4"}`}>
            {vaga.descricao}
          </p>
          {vaga.requisitos && expandido && (
            <>
              <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1 uppercase tracking-wide">Requisitos</p>
              <p className="text-sm text-foreground/80 whitespace-pre-line">{vaga.requisitos}</p>
            </>
          )}
          {topo && (vaga.descricao.length > 220 || vaga.requisitos) && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setExpandido((v) => !v)}
              className="mt-2 text-xs font-semibold text-primary flex items-center gap-1"
            >
              {expandido ? "Ver menos" : "Ver mais"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandido ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Fato({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2 text-foreground/80 min-w-0">
      <span className="text-primary/70 shrink-0">{icone}</span>
      <span className="truncate font-medium">{texto}</span>
    </div>
  );
}
