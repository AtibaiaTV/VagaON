import Link from "next/link";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChipsUrl, JANELAS, dataHoraBR, janelaDias } from "@/components/admin/FiltrosUrl";
import { FILTROS_MATCH, filtrarMatches, matchesDetalhados, type FiltroMatch } from "@/lib/servicos/admin-listas";

export const dynamic = "force-dynamic";

const STATUS_COR: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700",
  conversando: "bg-green-100 text-green-700",
  entrevista: "bg-purple-100 text-purple-700",
  contratado: "bg-emerald-100 text-emerald-800",
  encerrado: "bg-gray-100 text-gray-600",
};

function horas(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} dias`;
}

/** Quem deu match com quem, e o que aconteceu depois — os nomes por trás do painel de liquidez. */
export default async function AdminMatchesPage({ searchParams }: { searchParams: { f?: string; dias?: string } }) {
  const dias = janelaDias(searchParams.dias);
  const f = (FILTROS_MATCH.some((x) => x.value === searchParams.f) ? searchParams.f : "todos") as FiltroMatch;
  const todos = await matchesDetalhados(dias);
  const lista = filtrarMatches(todos, f);
  const outros = { f: searchParams.f, dias: searchParams.dias };

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-primary" />Matches</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interesse mútuo confirmado: quem, em qual vaga, e se virou conversa. Só mensagem de pessoa conta como resposta.
        </p>
      </div>

      <div className="space-y-2">
        <ChipsUrl base="/admin/matches" param="dias" atual={searchParams.dias ?? "30"} opcoes={JANELAS} outros={outros} />
        <ChipsUrl
          base="/admin/matches"
          param="f"
          atual={f}
          opcoes={FILTROS_MATCH.map((x) => ({ ...x, n: filtrarMatches(todos, x.value).length }))}
          outros={outros}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{lista.length} match{lista.length === 1 ? "" : "es"}</CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum match neste filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Match em</th>
                    <th className="text-left py-3 pr-4">Profissional</th>
                    <th className="text-left py-3 pr-4">Empresa · vaga</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3 pr-4">1ª mensagem</th>
                    <th className="text-left py-3 pr-4">Msgs</th>
                    <th className="text-left py-3 pr-4">Alerta parado</th>
                    <th className="text-left py-3">Contratado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dataHoraBR(m.em)}<br /><span title="Aderência no momento do match">{m.score}% aderência</span></td>
                      <td className="py-3 pr-4">
                        <Link href={`/profissionais/${m.profissionalId}`} className="font-medium hover:text-primary hover:underline">{m.profissionalNome || "—"}</Link>
                        {m.cidade && <p className="text-xs text-muted-foreground">{m.cidade}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{m.empresaNome || "—"}</p>
                        <Link href={`/admin/vagas/${m.vagaId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{m.vagaTitulo || "(vaga)"}</Link>
                      </td>
                      <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[m.status] ?? "bg-gray-100"}`}>{m.status}</span></td>
                      <td className="py-3 pr-4 text-xs">
                        {m.primeiraMensagem ? (
                          <>
                            <span className="font-medium">{m.primeiraMensagem.autor}</span> em {horas(m.primeiraMensagem.horasDepois)}
                            <br /><span className="text-muted-foreground">{dataHoraBR(m.primeiraMensagem.em)}</span>
                          </>
                        ) : (
                          <span className="text-red-700">ninguém falou</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center tabular-nums">{m.totalMensagens}{m.ultimaMensagemEm && <p className="text-[11px] text-muted-foreground whitespace-nowrap">última {dataHoraBR(m.ultimaMensagemEm)}</p>}</td>
                      <td className="py-3 pr-4 text-xs">
                        {m.alertaParadoEm ? (
                          <>{dataHoraBR(m.alertaParadoEm)}<br /><span className={m.reagiuAoAlerta ? "text-green-700" : "text-muted-foreground"}>{m.reagiuAoAlerta ? "reagiu depois" : "sem reação"}</span></>
                        ) : "—"}
                      </td>
                      <td className="py-3 text-xs">{m.contratadoEm ? dataHoraBR(m.contratadoEm) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
