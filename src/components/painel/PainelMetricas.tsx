import Link from "next/link";
import type { LinhaVaga } from "@/lib/servicos/metricas";

export interface Tile {
  rotulo: string;
  valor: string | number;
  /** Linha pequena abaixo do número. */
  dica?: string;
  destaque?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  ativa: "Ativa",
  pausada: "Pausada",
  encerrada: "Encerrada",
  rascunho: "Rascunho",
  rejeitada: "Rejeitada",
};

/** Faixa de números do painel + tabela por vaga (empresa). Server-rendered, sem JS. */
export default function PainelMetricas({ tiles, porVaga }: { tiles: Tile[]; porVaga?: LinhaVaga[] }) {
  return (
    <section className="mb-8 space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <div
            key={t.rotulo}
            className={`rounded-2xl border px-4 py-3 ${
              t.destaque ? "bg-[#1a5c38] border-[#1a5c38] text-white" : "bg-white border-border/40"
            }`}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${t.destaque ? "text-white/70" : "text-muted-foreground"}`}>
              {t.rotulo}
            </p>
            <p className={`text-2xl font-black mt-0.5 leading-none ${t.destaque ? "text-[#4ade80]" : "text-foreground"}`}>{t.valor}</p>
            {t.dica && <p className={`text-[11px] mt-1 ${t.destaque ? "text-white/60" : "text-muted-foreground"}`}>{t.dica}</p>}
          </div>
        ))}
      </div>

      {porVaga && porVaga.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/40 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <p className="text-sm font-bold">Interesse por vaga</p>
            <Link href="/descobrir" className="text-xs font-semibold text-primary hover:underline">
              Ver candidatos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Vaga</th>
                  <th className="text-right px-3 py-2 font-semibold">Views</th>
                  <th className="text-right px-3 py-2 font-semibold">Curtidas</th>
                  <th className="text-right px-3 py-2 font-semibold">Matches</th>
                  <th className="text-right px-4 py-2 font-semibold">Candid.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {porVaga.map((v) => (
                  <tr key={v.id} className={v.status !== "ativa" ? "opacity-60" : ""}>
                    <td className="px-4 py-2.5">
                      <Link href={`/vagas/${v.id}`} className="font-medium hover:text-primary">
                        {v.titulo}
                      </Link>
                      <span className="block text-[11px] text-muted-foreground">
                        {v.cidade} · {STATUS_LABEL[v.status] ?? v.status}
                      </span>
                    </td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{v.visualizacoes}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums font-semibold text-primary">{v.likes}</td>
                    <td className="text-right px-3 py-2.5 tabular-nums">{v.matches}</td>
                    <td className="text-right px-4 py-2.5 tabular-nums">{v.candidaturas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
