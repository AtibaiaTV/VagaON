"use client";

import { Briefcase, Heart, MapPin, Plane, Zap, Languages } from "lucide-react";
import { TIPO_CONTRATO_LABEL } from "@/constants/match";
import type { FeedProfissionalItem } from "@/lib/servicos/feed";
import ScoreBadge from "./ScoreBadge";

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Face do card de profissional no deck da empresa. */
export default function CardProfissionalSwipe({ item, topo }: { item: FeedProfissionalItem; topo: boolean }) {
  const { profissional: p, score, jaCurtiu } = item;

  return (
    <article className="h-full w-full rounded-3xl overflow-hidden bg-white shadow-xl border border-border/40 flex flex-col">
      {/* Hero com foto ou iniciais */}
      <header className="relative h-56 shrink-0" style={{ backgroundColor: "#143f28" }}>
        {p.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
              <span className="text-4xl font-black text-[#4ade80]">{iniciais(p.nome)}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 to-transparent" />

        {jaCurtiu && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2DB87A] text-white text-xs font-bold shadow-lg">
            <Heart className="h-3.5 w-3.5 fill-current" />
            Já curtiu sua vaga
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <h3 className="font-bold text-2xl text-white leading-tight">{p.nome}</h3>
          <p className="text-sm text-white/80 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5" />
            {p.cidade}, {p.estado}
            {score.distanciaKm !== null && ` · ${score.distanciaKm} km da vaga`}
          </p>
        </div>
      </header>

      <div className={`flex-1 px-5 py-4 space-y-4 ${topo ? "overflow-y-auto scrollbar-hide" : "overflow-hidden"}`}>
        <ScoreBadge score={score} />

        <div className="flex flex-wrap gap-1.5">
          {p.especialidadesLabels.map((e) => (
            <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-[#1a5c38] text-white font-medium">
              {e}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Fato icone={<Briefcase className="h-4 w-4" />} texto={p.anosExperiencia > 0 ? `${p.anosExperiencia} anos de experiência` : "Início de carreira"} />
          <Fato
            icone={<Zap className="h-4 w-4" />}
            texto={p.disponibilidade.imediata ? "Disponível agora" : "Disponível em breve"}
          />
          {p.disponibilidade.tipo.length > 0 && (
            <Fato icone={<Briefcase className="h-4 w-4" />} texto={p.disponibilidade.tipo.map((t) => TIPO_CONTRATO_LABEL[t] ?? t).join(" · ")} />
          )}
          {p.dispostoViajar && <Fato icone={<Plane className="h-4 w-4" />} texto="Disposto a viajar" />}
          {p.idiomas.length > 0 && (
            <Fato icone={<Languages className="h-4 w-4" />} texto={p.idiomas.map((i) => i.idioma).join(", ")} />
          )}
        </div>

        {p.ultimosCargos.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Últimos cargos</p>
            <ul className="text-sm text-foreground/80 space-y-0.5">
              {p.ultimosCargos.map((c, i) => (
                <li key={`${c}-${i}`}>• {c}</li>
              ))}
            </ul>
          </div>
        )}

        {p.habilidades.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.habilidades.slice(0, 10).map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {h}
              </span>
            ))}
          </div>
        )}

        {p.resumo && <p className="text-sm text-foreground/80 whitespace-pre-line line-clamp-6">{p.resumo}</p>}
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
