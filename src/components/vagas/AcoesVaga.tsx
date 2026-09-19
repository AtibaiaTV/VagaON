"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Pause, Play, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COR_STATUS_VAGA,
  LABEL_ACAO_VAGA,
  LABEL_STATUS_VAGA,
  acoesDisponiveis,
  type AcaoVaga,
  type StatusVaga,
} from "@/lib/vagas-estado";

const ICONE: Record<AcaoVaga, typeof Pause> = {
  pausar: Pause,
  reativar: Play,
  preencher: CheckCircle2,
  encerrar: XCircle,
};

const ESTILO: Record<AcaoVaga, string> = {
  pausar: "",
  reativar: "",
  preencher: "border-emerald-300 text-emerald-800 hover:bg-emerald-50",
  encerrar: "border-red-200 text-red-700 hover:bg-red-50",
};

const CONFIRMACAO: Partial<Record<AcaoVaga, string>> = {
  preencher: "Marcar a vaga como preenchida? Ela sai do Descobrir e do site; quem ainda estava no funil é avisado.",
  encerrar: "Encerrar a vaga? Ela sai do Descobrir e do site; quem ainda estava no funil é avisado.",
};

interface Estado {
  status: StatusVaga;
  preenchidas: number;
  posicoes: number;
}

/**
 * Estado da vaga e ações da empresa dona (pausar, reativar, marcar como
 * preenchida, encerrar). Cada clique chama a API e recarrega a página, para
 * o funil e os badges refletirem. A vaga não tem prazo: fica ativa até a
 * empresa decidir.
 */
export default function AcoesVaga({ vagaId, ...inicial }: { vagaId: string } & Estado) {
  const router = useRouter();
  const [v, setV] = useState<Estado>(inicial);
  const [ocupado, setOcupado] = useState<AcaoVaga | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function executar(acao: AcaoVaga) {
    const pergunta = CONFIRMACAO[acao];
    if (pergunta && !confirm(pergunta)) return;
    setErro(null);
    setOcupado(acao);
    const r = await fetch(`/api/vagas/${vagaId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setOcupado(null);
    if (!r?.ok) {
      setErro(d?.error ?? "Não foi possível alterar a vaga.");
      return;
    }
    setV({ status: d.status, preenchidas: d.preenchidas, posicoes: d.posicoes });
    router.refresh();
  }

  const completa = v.preenchidas >= v.posicoes;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COR_STATUS_VAGA[v.status]}`}>{LABEL_STATUS_VAGA[v.status]}</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {v.preenchidas}/{v.posicoes} {v.posicoes === 1 ? "posição preenchida" : "posições preenchidas"}
        </span>
        {v.status === "ativa" && (
          <span className="text-xs text-muted-foreground" title="A vaga não expira sozinha">sem prazo · fica no ar até você pausar ou encerrar</span>
        )}
      </div>

      {v.status === "ativa" && completa && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          Todas as posições foram preenchidas. Marque a vaga como preenchida para parar de receber candidatos, ou deixe ativa se quer mais gente.
        </p>
      )}
      {v.status !== "ativa" && (
        <p className="text-xs text-muted-foreground">
          Fora do Descobrir e do site. Candidatos, funil e conversas continuam disponíveis aqui.
        </p>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}

      <div className="flex flex-wrap gap-2">
        {acoesDisponiveis(v.status).map((acao) => {
          const Icone = ICONE[acao];
          const principal = acao === "reativar";
          return (
            <Button
              key={acao}
              type="button"
              size="sm"
              variant={principal ? "default" : "outline"}
              disabled={ocupado !== null}
              onClick={() => executar(acao)}
              className={`gap-1.5 ${principal ? "" : `bg-white ${ESTILO[acao]}`}`}
            >
              {ocupado === acao ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icone className="h-3.5 w-3.5" />}
              {LABEL_ACAO_VAGA[acao]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
