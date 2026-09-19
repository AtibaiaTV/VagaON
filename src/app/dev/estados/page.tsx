import { notFound } from "next/navigation";
import CardVisibilidade from "@/components/perfil/CardVisibilidade";
import AcoesVaga from "@/components/vagas/AcoesVaga";
import { LABEL_STATUS_VAGA, acoesDisponiveis, type StatusVaga } from "@/lib/vagas-estado";

/** Playground dos estados de vaga e da visibilidade do perfil — sem banco (os cliques dão erro de API). Só fora de produção. */
export default function EstadosDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const estados: { status: StatusVaga; preenchidas: number; posicoes: number }[] = [
    { status: "ativa", preenchidas: 0, posicoes: 2 },
    { status: "ativa", preenchidas: 2, posicoes: 2 },
    { status: "pausada", preenchidas: 1, posicoes: 2 },
    { status: "preenchida", preenchidas: 2, posicoes: 2 },
    { status: "encerrada", preenchidas: 0, posicoes: 1 },
    { status: "expirada", preenchidas: 0, posicoes: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3">
        <div className="max-w-4xl mx-auto px-4 text-white text-sm font-bold">DEV · Estados da vaga e visibilidade do perfil</div>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {estados.map((e, i) => (
          <section key={i} className="bg-white rounded-2xl border p-4">
            <h2 className="text-xs font-semibold text-muted-foreground mb-3">
              {LABEL_STATUS_VAGA[e.status]} · ações: {acoesDisponiveis(e.status).join(", ") || "nenhuma"}
            </h2>
            <AcoesVaga vagaId="000000000000000000000000" {...e} />
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground">Visibilidade do perfil</h2>
          <CardVisibilidade ativo motivoPausa={null} contratadoRecente={null} />
          <CardVisibilidade ativo motivoPausa={null} contratadoRecente={{ vagaTitulo: "Sous Chef — Trattoria Nonna Rosa", quando: "15/09/2026" }} />
          <CardVisibilidade ativo={false} motivoPausa="manual" contratadoRecente={null} />
          <CardVisibilidade ativo={false} motivoPausa="inatividade" contratadoRecente={null} />
        </section>
      </main>
    </div>
  );
}
