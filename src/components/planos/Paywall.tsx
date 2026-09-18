import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Bloqueio de recurso do plano Pro. Sempre diz o que continua funcionando
 * de graça — o candidato que veio até a empresa nunca fica escondido.
 */
export default function Paywall({
  titulo,
  mensagem,
  compacto = false,
}: {
  titulo: string;
  mensagem: string;
  compacto?: boolean;
}) {
  if (compacto) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <Lock className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 min-w-[200px]">
          <span className="font-semibold">{titulo}.</span> {mensagem}
        </span>
        <Link href="/planos">
          <Button size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Ver planos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-muted-foreground text-sm mt-2">{mensagem}</p>
      <Link href="/planos" className="inline-block mt-6">
        <Button size="lg" className="gap-2">
          <Sparkles className="h-4 w-4" /> Conhecer o plano Pro
        </Button>
      </Link>
    </div>
  );
}
