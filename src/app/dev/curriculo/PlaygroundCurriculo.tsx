"use client";

import { useState } from "react";
import Link from "next/link";
import CurriculoImpressao from "@/components/curriculo/CurriculoImpressao";
import type { DadosCurriculo, ModeloCurriculo } from "@/lib/curriculo";

/** Envolve o componente real e permite simular as regras de impressão sem abrir a janela. */
export default function PlaygroundCurriculo({ dados, modelo, vazio }: { dados: DadosCurriculo; modelo: ModeloCurriculo; vazio: boolean }) {
  const [simulando, setSimulando] = useState(false);

  function alternar() {
    document.documentElement.classList.toggle("simular-impressao", !simulando);
    setSimulando((v) => !v);
  }

  return (
    <div className="min-h-screen bg-[#e9edeb]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3 nao-imprimir">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-white text-sm gap-3">
          <span className="font-bold">DEV · Currículo ({modelo}{vazio ? ", perfil mínimo" : ""})</span>
          <span className="flex gap-3 text-white/80 underline">
            <Link href="/dev/curriculo">completo</Link>
            <Link href="/dev/curriculo?vazio=1">mínimo</Link>
            <button type="button" onClick={alternar} className="underline">
              {simulando ? "sair da simulação" : "simular impressão"}
            </button>
          </span>
        </div>
      </div>
      {simulando && (
        <button
          type="button"
          onClick={alternar}
          className="fixed top-2 right-2 z-50 rounded-full bg-black text-white text-xs px-3 py-1.5"
        >
          sair da simulação
        </button>
      )}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CurriculoImpressao dados={dados} modeloInicial={modelo} linkEditar={false} />
      </main>
    </div>
  );
}
