import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MINIMO_PUBLICO, labelCriterio } from "@/constants/avaliacao";
import { resumoReputacaoPublico } from "@/lib/reputacao";
import Estrelas from "./Estrelas";
import ReputacaoBadge from "./ReputacaoBadge";

/**
 * A reputação como o próprio dono vê: tudo, inclusive antes do mínimo
 * público, com a média por critério. Direito de acesso (LGPD) na prática.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CardReputacaoPropria({ reputacao, lado }: { reputacao: any; lado: "profissional" | "empresa" }) {
  const total: number = reputacao?.total ?? 0;
  const media: number | null = reputacao?.media ?? null;
  const porCriterio: Record<string, number> =
    reputacao?.porCriterio instanceof Map ? Object.fromEntries(reputacao.porCriterio) : (reputacao?.porCriterio ?? {});
  const publico = resumoReputacaoPublico(reputacao);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Minha reputação</CardTitle>
          <Link href="/avaliacoes" className="text-xs font-semibold text-primary hover:underline">
            Ver avaliações →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda sem avaliações. Elas chegam depois de cada contratação feita pela plataforma —{" "}
            {lado === "profissional" ? "as empresas avaliam você e você avalia as empresas." : "você avalia quem contratou e é avaliado por eles."}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {media !== null && <Estrelas nota={media} tamanho={20} />}
              <span className="text-2xl font-black">{media?.toFixed(1).replace(".", ",")}</span>
              <span className="text-sm text-muted-foreground">
                {total} avaliaç{total === 1 ? "ão" : "ões"} · {reputacao?.recomendacoes ?? 0} recomend{(reputacao?.recomendacoes ?? 0) === 1 ? "a" : "am"}
              </span>
            </div>
            {publico ? (
              <ReputacaoBadge rep={publico} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Sua média fica pública a partir de {MINIMO_PUBLICO} avaliações (faltam {MINIMO_PUBLICO - total}). Até lá, só você vê.
              </p>
            )}
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 pt-1">
              {Object.entries(porCriterio).map(([chave, nota]) => (
                <li key={chave} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/80">{labelCriterio(chave)}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Estrelas nota={nota} tamanho={13} />
                    <span className="text-xs tabular-nums w-7 text-right">{nota.toFixed(1).replace(".", ",")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
