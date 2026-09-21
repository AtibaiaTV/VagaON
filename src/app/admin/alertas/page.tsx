import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChipsUrl, JANELAS, dataHoraBR, janelaDias } from "@/components/admin/FiltrosUrl";
import { TIPOS_ALERTA, alertasDetalhados, type TipoAlerta } from "@/lib/servicos/admin-listas";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { profissional: "Profissional", empresa: "Empresa", admin: "Admin" };

/** Avisos automáticos que o sistema mandou (in-app; e-mail/push/WhatsApp saem junto quando ligados), e se surtiram efeito. */
export default async function AdminAlertasPage({ searchParams }: { searchParams: { tipo?: string; dias?: string } }) {
  const dias = janelaDias(searchParams.dias);
  const tipo = (TIPOS_ALERTA.some((t) => t.value === searchParams.tipo) ? searchParams.tipo : "todos") as TipoAlerta;
  const lista = await alertasDetalhados(dias, tipo);
  const outros = { tipo: searchParams.tipo, dias: searchParams.dias };
  const convertidos = lista.filter((a) => a.converteu === true).length;
  const lidos = lista.filter((a) => a.lidaEm).length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" />Alertas enviados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Avisos automáticos (vaga nova que combina, match parado, resumo semanal, perfil sem cidade): para quem foram e o que aconteceu depois.
          Os disparos por WhatsApp têm o próprio histórico em <Link href="/admin/whatsapp" className="underline">WhatsApp</Link>.
        </p>
      </div>

      <div className="space-y-2">
        <ChipsUrl base="/admin/alertas" param="dias" atual={searchParams.dias ?? "30"} opcoes={JANELAS} outros={outros} />
        <ChipsUrl base="/admin/alertas" param="tipo" atual={tipo} opcoes={TIPOS_ALERTA.map((t) => ({ value: t.value, label: t.label }))} outros={outros} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {lista.length} aviso{lista.length === 1 ? "" : "s"}
            <span className="text-sm font-normal text-muted-foreground"> · {lidos} lido(s) no sino{tipo === "vaga-nova" || tipo === "todos" ? ` · ${convertidos} converteram em like/candidatura` : ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum aviso neste filtro.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Enviado em</th>
                    <th className="text-left py-3 pr-4">Para</th>
                    <th className="text-left py-3 pr-4">Aviso</th>
                    <th className="text-left py-3 pr-4">Lido</th>
                    <th className="text-left py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lista.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dataHoraBR(a.em)}</td>
                      <td className="py-3 pr-4">
                        <Link href={`/admin/usuarios?busca=${encodeURIComponent(a.nome)}`} className="font-medium hover:text-primary hover:underline">{a.nome}</Link>
                        <p className="text-xs text-muted-foreground">{ROLE[a.role] ?? a.role}</p>
                      </td>
                      <td className="py-3 pr-4">
                        {a.titulo}
                        {a.vagaId && <Link href={`/admin/vagas/${a.vagaId}`} className="block text-xs text-muted-foreground hover:text-primary hover:underline">ver a vaga</Link>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{a.lidaEm ? dataHoraBR(a.lidaEm) : "não"}</td>
                      <td className="py-3 text-xs">
                        {a.converteu === null ? "—" : a.converteu ? <span className="text-green-700 font-medium">curtiu ou se candidatou</span> : <span className="text-muted-foreground">sem reação</span>}
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
