import Link from "next/link";
import { Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanoResolvido } from "@/lib/planos";

/** Card do painel da empresa: situação do plano e chamada para o Pro. Some com planos desligados. */
export default function CardPlanoPainel({ acesso }: { acesso: PlanoResolvido }) {
  if (acesso.motivo === "desligado") return null;

  const fim = acesso.ate ? acesso.ate.toLocaleDateString("pt-BR") : null;

  if (acesso.plano === "pro") {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        {acesso.motivo === "trial" ? <Clock className="h-4 w-4 text-primary shrink-0" /> : <Sparkles className="h-4 w-4 text-primary shrink-0" />}
        <span className="flex-1 min-w-[200px]">
          <span className="font-semibold">{acesso.motivo === "trial" ? "Período de teste do plano Pro" : "Plano Pro ativo"}</span>
          {fim && ` até ${fim}`}. Banco de currículos, Descobrir ilimitado e triagem por IA liberados.
        </span>
        {acesso.motivo === "trial" && (
          <Link href="/planos">
            <Button size="sm" variant="outline" className="bg-white">
              Ver planos
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 text-sm">
      <Sparkles className="h-4 w-4 text-primary shrink-0" />
      <span className="flex-1 min-w-[200px]">
        <span className="font-semibold">Plano Grátis.</span> Uma vaga ativa e 10 avaliações por dia no Descobrir. O Pro libera vagas
        ilimitadas, o banco de currículos e a triagem por IA.
      </span>
      <Link href="/planos">
        <Button size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Conhecer o Pro
        </Button>
      </Link>
    </div>
  );
}
