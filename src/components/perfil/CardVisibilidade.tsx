"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, PartyPopper } from "lucide-react";
import { TEXTO_PAUSA_PERFIL, type MotivoPausaPerfil } from "@/lib/vagas-estado";

interface Props {
  ativo: boolean;
  motivoPausa: MotivoPausaPerfil | null;
  /** Contratação registrada nos últimos 30 dias — sugere pausar. */
  contratadoRecente: { vagaTitulo: string; quando: string } | null;
}

/**
 * Interruptor "aparecer para empresas". Pausado, o perfil some do Descobrir
 * e do banco de currículos; candidaturas, matches e chats continuam.
 */
export default function CardVisibilidade({ ativo: inicial, motivoPausa: motivoInicial, contratadoRecente }: Props) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(inicial);
  const [motivo, setMotivo] = useState<MotivoPausaPerfil | null>(motivoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function definir(novo: boolean, motivoNovo: MotivoPausaPerfil = "manual") {
    setErro(null);
    setSalvando(true);
    const r = await fetch("/api/perfil/visibilidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: novo, motivo: motivoNovo }),
    }).catch(() => null);
    setSalvando(false);
    if (!r?.ok) {
      const d = await r?.json().catch(() => ({}));
      setErro(d?.error ?? "Não foi possível alterar. Tente de novo.");
      return;
    }
    setAtivo(novo);
    setMotivo(novo ? null : motivoNovo);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border/50 bg-white px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {ativo ? <Eye className="h-5 w-5 text-primary shrink-0" /> : <EyeOff className="h-5 w-5 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold">{ativo ? "Visível para as empresas" : "Perfil pausado"}</p>
            <p className="text-xs text-muted-foreground">
              {ativo
                ? "Você aparece no Descobrir e no banco de currículos. Suas candidaturas e conversas não dependem disso."
                : TEXTO_PAUSA_PERFIL[motivo ?? "manual"]}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={ativo}
          aria-label={ativo ? "Pausar perfil" : "Reativar perfil"}
          disabled={salvando}
          onClick={() => definir(!ativo)}
          className={`relative shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-60 ${ativo ? "bg-primary" : "bg-border"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform flex items-center justify-center ${
              ativo ? "translate-x-5" : ""
            }`}
          >
            {salvando && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </span>
        </button>
      </div>

      {ativo && contratadoRecente && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
          <PartyPopper className="h-4 w-4 shrink-0" />
          <span className="flex-1 min-w-[180px]">
            Parabéns pela contratação em <span className="font-semibold">{contratadoRecente.vagaTitulo}</span> ({contratadoRecente.quando}).
            Se não quer mais receber vagas por agora, pause o perfil. Quem faz extras costuma deixar ligado.
          </span>
          <button
            type="button"
            disabled={salvando}
            onClick={() => definir(false, "contratado")}
            className="font-semibold underline hover:text-emerald-950"
          >
            Pausar agora
          </button>
        </div>
      )}

      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
