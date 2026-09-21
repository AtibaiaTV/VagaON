import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChipsUrl, JANELAS, dataHoraBR, janelaDias } from "@/components/admin/FiltrosUrl";
import { candidaturasDetalhadas } from "@/lib/servicos/admin-listas";

export const dynamic = "force-dynamic";

const STATUS: { value: string; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "enviada", label: "Enviada" },
  { value: "visualizada", label: "Visualizada" },
  { value: "em_analise", label: "Em análise" },
  { value: "entrevista", label: "Entrevista" },
  { value: "aprovada", label: "Aprovada" },
  { value: "recusada", label: "Recusada" },
  { value: "via-match", label: "Vieram do match" },
];

const STATUS_COR: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-700",
  visualizada: "bg-sky-100 text-sky-700",
  em_analise: "bg-amber-100 text-amber-800",
  entrevista: "bg-purple-100 text-purple-700",
  aprovada: "bg-emerald-100 text-emerald-800",
  recusada: "bg-red-100 text-red-700",
};

/** Cada candidatura com nome, vaga e empresa — o número do dashboard, aberto. */
export default async function AdminCandidaturasPage({ searchParams }: { searchParams: { status?: string; dias?: string } }) {
  // Sem parâmetro mostra tudo: o total do dashboard é "desde o início".
  const dias = searchParams.dias ? janelaDias(searchParams.dias) : null;
  const status = STATUS.some((s) => s.value === searchParams.status) ? searchParams.status! : "todas";
  const todas = await candidaturasDetalhadas(dias);
  const filtrar = (s: string) => (s === "todas" ? todas : s === "via-match" ? todas.filter((c) => c.viaMatch) : todas.filter((c) => c.status === s));
  const lista = filtrar(status);
  const outros = { status: searchParams.status, dias: searchParams.dias };

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Candidaturas</h1>
        <p className="text-muted-foreground text-sm mt-1">Quem se candidatou a quê, e em que pé está no funil da empresa.</p>
      </div>

      <div className="space-y-2">
        <ChipsUrl base="/admin/candidaturas" param="dias" atual={searchParams.dias ?? "todos"} opcoes={JANELAS} outros={outros} />
        <ChipsUrl base="/admin/candidaturas" param="status" atual={status} opcoes={STATUS.map((s) => ({ ...s, n: filtrar(s.value).length }))} outros={outros} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{lista.length} candidatura{lista.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma candidatura neste filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Enviada em</th>
                    <th className="text-left py-3 pr-4">Profissional</th>
                    <th className="text-left py-3 pr-4">Vaga</th>
                    <th className="text-left py-3 pr-4">Empresa</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dataHoraBR(c.em)}</td>
                      <td className="py-3 pr-4">
                        <Link href={`/profissionais/${c.profissionalId}`} className="font-medium hover:text-primary hover:underline">{c.profissionalNome}</Link>
                        {c.cidade && <p className="text-xs text-muted-foreground">{c.cidade}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/admin/vagas/${c.vagaId}`} className="hover:text-primary hover:underline">{c.vagaTitulo}</Link>
                        <p className="text-xs text-muted-foreground">vaga {c.vagaStatus}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.empresaNome}</td>
                      <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[c.status] ?? "bg-gray-100"}`}>{c.status.replace("_", " ")}</span></td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {c.viaMatch ? "match (interesse mútuo)" : "botão Candidatar-se"}
                        {c.triagemRespondida && " · triagem respondida"}
                      </td>
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
