import { ShieldCheck, Star } from "lucide-react";
import type { ReputacaoPublica } from "@/lib/reputacao";

/**
 * Reputação como terceiros veem: média, total, selo "Confiável" e pontos
 * fortes. Sem avaliações suficientes mostra nada (compacto) ou "Novo".
 * Server-compatible: sem hooks.
 */
export default function ReputacaoBadge({
  rep,
  compacto = false,
  claro = false,
}: {
  rep: ReputacaoPublica | null;
  compacto?: boolean;
  /** Sobre fundo escuro (headers verdes). */
  claro?: boolean;
}) {
  if (!rep) {
    if (compacto) return null;
    return <p className={`text-xs ${claro ? "text-white/60" : "text-muted-foreground"}`}>Ainda sem avaliações suficientes</p>;
  }

  const texto = claro ? "text-white" : "text-foreground";
  const sub = claro ? "text-white/70" : "text-muted-foreground";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={`inline-flex items-center gap-1 font-bold ${texto}`}>
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {rep.media.toFixed(1).replace(".", ",")}
      </span>
      <span className={`text-xs ${sub}`}>
        {rep.total} avaliaç{rep.total === 1 ? "ão" : "ões"}
      </span>
      {rep.confiavel && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Confiável
        </span>
      )}
      {!compacto && rep.pontosFortes.length > 0 && (
        <span className={`text-xs ${sub} w-full`}>
          Pontos fortes: <span className={`font-medium ${texto}`}>{rep.pontosFortes.join(" · ")}</span>
        </span>
      )}
    </div>
  );
}
