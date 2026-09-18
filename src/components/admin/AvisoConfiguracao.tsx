import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { diagnosticar } from "@/lib/diagnostico";

/**
 * Faixa no topo do admin quando falta configuração. Existe para que a falta
 * de uma variável apareça como aviso em vez de virar degradação silenciosa
 * (painel de IA sumindo, QR com localhost, cron respondendo 401).
 */
export default function AvisoConfiguracao() {
  const { pendencias } = diagnosticar();
  if (pendencias.length === 0) return null;

  const nomes = pendencias.slice(0, 3).map((v) => v.nome);
  const resto = pendencias.length - nomes.length;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900">
        <p className="font-semibold">
          {pendencias.length === 1 ? "1 variável de ambiente pendente" : `${pendencias.length} variáveis de ambiente pendentes`}
        </p>
        <p className="mt-0.5 text-amber-900/80">
          {nomes.join(", ")}
          {resto > 0 && ` e mais ${resto}`}. Alguns recursos estão desligados sem aviso para quem usa o site.{" "}
          <Link href="/admin/diagnostico" className="font-semibold underline underline-offset-2">
            Ver o que falta
          </Link>
        </p>
      </div>
    </div>
  );
}
