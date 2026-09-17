"use client";

import { useState } from "react";
import FormularioAvaliacao from "@/components/avaliacoes/FormularioAvaliacao";

export default function FormularioAvaliacaoDev({ lado }: { lado: "profissional" | "empresa" }) {
  const [log, setLog] = useState<string>("(o envio vai falhar: o match é fictício — serve para ver a validação)");
  return (
    <div className="space-y-4">
      <FormularioAvaliacao
        lado={lado}
        matchId="000000000000000000000000"
        outroNome={lado === "empresa" ? "Mariana Costa" : "Trattoria Nonna Rosa"}
        vagaTitulo="Sous Chef — Restaurante Italiano"
        aoConcluir={(a) => setLog(`concluída: ${JSON.stringify(a)}`)}
        aoCancelar={() => setLog("cancelado")}
      />
      <p className="text-xs text-muted-foreground">{log}</p>
    </div>
  );
}
