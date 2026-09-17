"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Flame, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatchResumo } from "@/lib/servicos/matches";
import { AnelScore } from "./ScoreBadge";
import { faixaDoScore } from "@/lib/match/pesos";

const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
  novo: { texto: "Novo", cor: "bg-emerald-100 text-emerald-700" },
  conversando: { texto: "Conversando", cor: "bg-blue-100 text-blue-700" },
  entrevista: { texto: "Entrevista", cor: "bg-violet-100 text-violet-700" },
  contratado: { texto: "Contratado", cor: "bg-amber-100 text-amber-800" },
  encerrado: { texto: "Encerrado", cor: "bg-gray-100 text-gray-600" },
};

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `${d} dias`;
}

export default function ListaMatches({ lado }: { lado: "profissional" | "empresa" }) {
  const [aba, setAba] = useState<"ativos" | "encerrados">("ativos");
  const [matches, setMatches] = useState<MatchResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    fetch(`/api/matches?status=${aba === "ativos" ? "" : "encerrado"}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => !cancelado && setMatches(d.matches ?? []))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [aba]);

  return (
    <div>
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-border/50 mb-4">
        {(["ativos", "encerrados"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${
              aba === a ? "bg-[#1a5c38] text-white" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {a === "ativos" ? "Ativos" : "Encerrados"}
          </button>
        ))}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 max-w-xs mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg">{aba === "ativos" ? "Nenhum match ainda" : "Nada encerrado"}</h3>
          {aba === "ativos" && (
            <>
              <p className="text-sm text-muted-foreground mt-1.5">
                Um match acontece quando os dois lados demonstram interesse. Continue descobrindo!
              </p>
              <Link href="/descobrir" className="inline-block mt-5">
                <Button className="gap-2">
                  <Flame className="h-4 w-4" />
                  Descobrir
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {matches.map((m) => {
            const outroNome = lado === "profissional" ? m.snapshot.empresaNome : m.snapshot.profissionalNome;
            const outraFoto = lado === "profissional" ? m.snapshot.empresaLogo : m.snapshot.profissionalFoto;
            const status = STATUS_LABEL[m.status] ?? STATUS_LABEL.novo;
            const naoLidas = m.naoLidas > 0;

            return (
              <li key={m.id}>
                <Link
                  href={`/matches/${m.id}`}
                  className={`flex items-center gap-3 bg-white rounded-2xl border px-3 py-3 hover:border-primary/40 hover:shadow-md transition-all ${
                    naoLidas ? "border-primary/40" : "border-border/40"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[#1a5c38] flex items-center justify-center shrink-0">
                    {outraFoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={outraFoto} alt="" className="w-full h-full object-cover" />
                    ) : lado === "profissional" ? (
                      <Building2 className="h-6 w-6 text-[#4ade80]" />
                    ) : (
                      <User className="h-6 w-6 text-[#4ade80]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate ${naoLidas ? "font-bold" : "font-semibold"}`}>{outroNome}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${status.cor}`}>
                        {status.texto}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.snapshot.vagaTitulo}</p>
                    {m.ultimaMensagem && (
                      <p className={`text-xs truncate mt-0.5 ${naoLidas ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {m.ultimaMensagem.autorTipo === "sistema" ? "✨ " : ""}
                        {m.ultimaMensagem.texto}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <AnelScore total={m.score} faixa={faixaDoScore(m.score).label} tamanho={40} />
                    <span className="text-[10px] text-muted-foreground">{tempoRelativo(m.atualizadoEm)}</span>
                    {naoLidas && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#2DB87A] text-white text-[10px] font-bold flex items-center justify-center">
                        {m.naoLidas}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
