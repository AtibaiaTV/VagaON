import { notFound } from "next/navigation";
import CardPlanoPainel from "@/components/planos/CardPlanoPainel";
import Paywall from "@/components/planos/Paywall";
import { MENSAGENS_LIMITE, PLANOS, diasAFrente, resolverPlano } from "@/lib/planos";

/**
 * Playground dos componentes de plano com o interruptor simulado ligado —
 * sem banco, sem mexer em PLANOS_ATIVOS. Só fora de produção.
 */
export default function PlanosDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const agora = new Date();
  const cenarios = [
    { titulo: "Planos desligados (padrão)", acesso: resolverPlano(null, agora, false) },
    { titulo: "Ligado · sem assinatura (Grátis)", acesso: resolverPlano(null, agora, true) },
    { titulo: "Ligado · teste de 60 dias", acesso: resolverPlano({ status: "trial", trialAte: diasAFrente(60, agora) }, agora, true) },
    { titulo: "Ligado · Pro ativo", acesso: resolverPlano({ plano: "pro", status: "ativa", ativoAte: diasAFrente(30, agora) }, agora, true) },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3">
        <div className="max-w-4xl mx-auto px-4 text-white text-sm font-bold">DEV · Planos (componentes)</div>
      </div>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {cenarios.map((c) => (
          <section key={c.titulo}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">
              {c.titulo} → plano {c.acesso.plano}, motivo {c.acesso.motivo}, vagas {c.acesso.limites.vagasAtivas ?? "∞"}, swipes{" "}
              {c.acesso.limites.swipesDia ?? "∞"}
            </h2>
            <CardPlanoPainel acesso={c.acesso} />
            {c.acesso.motivo === "desligado" && <p className="text-xs text-muted-foreground">(card do painel não aparece com planos desligados)</p>}
          </section>
        ))}

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Paywall compacto</h2>
          <Paywall titulo="Banco de currículos é do plano Pro" mensagem={MENSAGENS_LIMITE.bancoCurriculos} compacto />
        </section>
        <section className="bg-white rounded-2xl">
          <h2 className="text-sm font-semibold text-muted-foreground p-4 pb-0">Paywall página inteira</h2>
          <Paywall titulo="Banco de currículos é do plano Pro" mensagem={MENSAGENS_LIMITE.bancoCurriculos} />
        </section>

        <section className="text-xs text-muted-foreground">
          Limites do Grátis: {JSON.stringify(PLANOS.gratis.limites)} · Mensagem de vagas: “{MENSAGENS_LIMITE.vagasAtivas(1)}”
        </section>
      </main>
    </div>
  );
}
