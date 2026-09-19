"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPinOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResultadoLote, SimulacaoCampanha } from "@/lib/servicos/campanha-cidade";

const BLOQUEIO_LABEL: Record<string, string> = {
  "sem-telefone": "sem telefone válido",
  suspenso: "conta suspensa",
  "whatsapp-desligado": "desligou o WhatsApp",
  "ja-avisado": "já avisado",
};

/**
 * Campanha única "perfil sem cidade": simulação sempre visível, disparo só
 * pelo botão, em lotes pequenos (número novo, qualidade em observação).
 */
export default function CampanhaSemCidade({ configurado, onEnviado }: { configurado: boolean; onEnviado?: () => void }) {
  const [sim, setSim] = useState<SimulacaoCampanha | null>(null);
  const [lote, setLote] = useState(10);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLote | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    const r = await fetch("/api/admin/campanhas/sem-cidade").catch(() => null);
    if (r?.ok) setSim(await r.json());
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function enviar() {
    if (!sim) return;
    const n = Math.min(lote, sim.elegiveis);
    if (!confirm(`Enviar o aviso por WhatsApp (e sino) para ${n} profissional(is) agora? Cada um recebe uma vez só.`)) return;
    setErro("");
    setEnviando(true);
    setResultado(null);
    const r = await fetch("/api/admin/campanhas/sem-cidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limite: lote }),
    });
    const d = await r.json().catch(() => ({}));
    setEnviando(false);
    if (!r.ok) {
      setErro(d.error || "Falhou.");
      return;
    }
    setResultado(d);
    void carregar();
    onEnviado?.();
  }

  const elegiveis = sim?.alvos.filter((a) => a.bloqueio === null) ?? [];
  const bloqueados = sim?.alvos.filter((a) => a.bloqueio !== null) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPinOff className="h-4 w-4 text-primary" />
          Campanha: perfis sem cidade
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Sem cidade o perfil não entra em raio nem distância e quase não aparece. Uma mensagem por pessoa, mais recentes
          primeiro. Número novo: mande em lotes pequenos e olhe o log antes do próximo.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!sim ? (
          <p className="text-sm text-muted-foreground">Carregando simulação…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-full bg-gray-100">sem cidade: <b>{sim.semCidade}</b></span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">elegíveis agora: <b>{sim.elegiveis}</b></span>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">já avisados: <b>{sim.jaAvisados}</b></span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm flex items-center gap-2">
                Lote de
                <select value={lote} onChange={(e) => setLote(Number(e.target.value))} className="h-8 rounded-lg border px-2 text-sm bg-white">
                  {[5, 10, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <Button onClick={enviar} disabled={enviando || !configurado || sim.elegiveis === 0} className="gap-2">
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar lote ({Math.min(lote, sim.elegiveis)})
              </Button>
              {!configurado && <span className="text-xs text-amber-700">WhatsApp desligado neste ambiente.</span>}
            </div>
            {erro && <p className="text-sm text-red-700">{erro}</p>}

            {resultado && (
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-semibold mb-1">Lote enviado · {resultado.restantes} ainda elegível(is)</p>
                <ul className="text-xs space-y-0.5">
                  {resultado.enviados.map((e, i) => (
                    <li key={i} className={e.whatsapp === "ok" ? "text-emerald-800" : "text-red-700"}>
                      {e.nome} · {e.telefoneMascarado} · WhatsApp: {e.whatsapp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Ver simulação ({sim.alvos.length})</summary>
              <ul className="mt-2 divide-y rounded-lg border bg-white">
                {[...elegiveis, ...bloqueados].map((a) => (
                  <li key={a.profissionalId} className="flex items-center justify-between gap-2 px-3 py-1.5">
                    <span className="truncate">
                      {a.nome} <span className="text-muted-foreground">· {a.telefoneMascarado} · cadastro {new Date(a.cadastradoEm).toLocaleDateString("pt-BR")}</span>
                    </span>
                    <span className={a.bloqueio ? "text-muted-foreground" : "text-emerald-700 font-medium"}>
                      {a.bloqueio ? BLOQUEIO_LABEL[a.bloqueio] ?? a.bloqueio : "recebe"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
