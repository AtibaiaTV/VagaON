import Link from "next/link";

/** "18/09 20:46" no horário de Brasília. */
export function dataHoraBR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

/**
 * Chips de filtro que vivem na URL (server components): cada chip é um link
 * que troca um parâmetro e preserva os outros. Sem estado no cliente, e o
 * link do dashboard já chega filtrado.
 */
export function ChipsUrl({
  base,
  param,
  atual,
  opcoes,
  outros,
}: {
  base: string;
  param: string;
  atual: string;
  opcoes: { value: string; label: string; n?: number }[];
  outros: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(outros)) if (v && k !== param) q.set(k, v);
        q.set(param, o.value);
        const ativo = o.value === atual;
        return (
          <Link
            key={o.value}
            href={`${base}?${q.toString()}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              ativo ? "bg-primary text-white border-primary" : "bg-white hover:border-primary/50 hover:text-primary"
            }`}
          >
            {o.label}
            {o.n !== undefined && <span className={`tabular-nums ${ativo ? "text-white/80" : "text-muted-foreground"}`}>{o.n}</span>}
          </Link>
        );
      })}
    </div>
  );
}

export const JANELAS: { value: string; label: string }[] = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "todos", label: "Desde o início" },
];

export function janelaDias(v: string | undefined, padrao = 30): number | null {
  if (v === "todos") return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : padrao;
}
