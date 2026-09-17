import { Check, AlertTriangle } from "lucide-react";
import type { ResumoScore } from "@/lib/servicos/projecoes";

const COR_POR_FAIXA: Record<string, string> = {
  "Match excelente": "#059669",
  "Match forte": "#2DB87A",
  "Bom match": "#84cc16",
  "Match parcial": "#9ca3af",
};

/** Anel de score: o número grande e a faixa, com a cor da faixa. */
export function AnelScore({ total, faixa, tamanho = 72 }: { total: number; faixa: string; tamanho?: number }) {
  const cor = COR_POR_FAIXA[faixa] ?? COR_POR_FAIXA["Match parcial"];
  const raio = (tamanho - 8) / 2;
  const circ = 2 * Math.PI * raio;
  const preenchido = circ * (total / 100);

  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke="#e5e7eb" strokeWidth={6} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${preenchido} ${circ - preenchido}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-black text-lg" style={{ color: cor }}>
          {total}
        </span>
        <span className="text-[9px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

/** Score + "por que combinamos" + ressalvas. É o coração da confiança no card. */
export default function ScoreBadge({ score, compacto = false }: { score: ResumoScore; compacto?: boolean }) {
  const cor = COR_POR_FAIXA[score.faixa] ?? COR_POR_FAIXA["Match parcial"];

  return (
    <div className="flex gap-3 items-start">
      <AnelScore total={score.total} faixa={score.faixa} tamanho={compacto ? 56 : 72} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm leading-tight" style={{ color: cor }}>
          {score.faixa}
        </p>
        <ul className="mt-1.5 space-y-1">
          {score.explicacoes.slice(0, compacto ? 2 : 3).map((e) => (
            <li key={e} className="flex items-start gap-1.5 text-xs text-foreground/80">
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
              <span className="leading-snug">{e}</span>
            </li>
          ))}
          {!compacto &&
            score.alertas.slice(0, 2).map((a) => (
              <li key={a} className="flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={2.5} />
                <span className="leading-snug">{a}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
