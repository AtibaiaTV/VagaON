"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, Loader2, Pause, Play, RefreshCw, Users, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LABEL_ACAO_VAGA,
  LABEL_STATUS_VAGA,
  acoesDisponiveis,
  diasAte,
  type AcaoVaga,
  type StatusVaga,
} from "@/lib/vagas-estado";

export const COR_STATUS_VAGA: Record<StatusVaga, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-amber-100 text-amber-700",
  preenchida: "bg-emerald-100 text-emerald-800",
  encerrada: "bg-gray-100 text-gray-600",
  expirada: "bg-gray-100 text-gray-600",
  rascunho: "bg-blue-100 text-blue-600",
  rejeitada: "bg-red-100 text-red-700",
};

const ICONE: Record<AcaoVaga, typeof Pause> = {
  pausar: Pause,
  reativar: Play,
  preencher: CheckCircle2,
  encerrar: XCircle,
  renovar: RefreshCw,
};

const ESTILO: Record<AcaoVaga, string> = {
  pausar: "",
  reativar: "",
  preencher: "border-emerald-300 text-emerald-800 hover:bg-emerald-50",
  encerrar: "border-red-200 text-red-700 hover:bg-red-50",
  renovar: "",
};

const CONFIRMACAO: Partial<Record<AcaoVaga, string>> = {
  preencher: "Marcar a vaga como preenchida? Ela sai do Descobrir e do site; quem ainda estava no funil é avisado.",
  encerrar: "Encerrar a vaga? Ela sai do Descobrir e do site; quem ainda estava no funil é avisado.",
};

interface Estado {
  status: StatusVaga;
  expiresAt: string | null;
  preenchidas: number;
  posicoes: number;
}

/**
 * Estado da vaga e ações da empresa dona (pausar, reativar, marcar como
 * preenchida, encerrar, renovar). Cada clique chama a API e recarrega a
 * página, para o funil e os badges refletirem.
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
    setV({ status: d.status, expiresAt: d.expiresAt, preenchidas: d.preenchidas, posicoes: d.posicoes });
    router.refresh();
  }

  const dias = v.status === "ativa" ? diasAte(v.expiresAt) : null;
  const completa = v.preenchidas >= v.posicoes;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COR_STATUS_VAGA[v.status]}`}>{LABEL_STATUS_VAGA[v.status]}</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {v.preenchidas}/{v.posicoes} {v.posicoes === 1 ? "posição preenchida" : "posições preenchidas"}
        </span>
        {dias !== null && (
          <span className={`inline-flex items-center gap-1 ${dias <= 3 ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
            <CalendarClock className="h-3.5 w-3.5" />
            {dias <= 0 ? "expira hoje" : `expira em ${dias} dia${dias === 1 ? "" : "s"}`}
            {v.expiresAt && ` (${new Date(v.expiresAt).toLocaleDateString("pt-BR")})`}
          </span>
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
