"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CurriculoImpressao from "@/components/curriculo/CurriculoImpressao";
import { corDoModelo, type CoresCurriculo, type DadosCurriculo, type ModeloCurriculo } from "@/lib/curriculo";
import { exportarCurriculo, type FormatoExportacao } from "@/lib/curriculo-exportar";

declare global {
  interface Window {
    /** Só no playground: gera cada formato e devolve o tamanho em bytes (sem baixar). */
    __cvExportar?: (formato: FormatoExportacao) => Promise<{ formato: string; bytes: number; tipo: string }>;
  }
}

/** Envolve o componente real e permite simular as regras de impressão sem abrir a janela. */
export default function PlaygroundCurriculo({
  dados,
  modelo,
  cores,
  vazio,
}: {
  dados: DadosCurriculo;
  modelo: ModeloCurriculo;
  cores: CoresCurriculo;
  vazio: boolean;
}) {
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    window.__cvExportar = async (formato) => {
      const no = document.querySelector<HTMLElement>(".cv-pagina");
      if (!no) throw new Error("página não encontrada");
      const blob = await exportarCurriculo(formato, no, dados, modelo, corDoModelo(modelo, cores));
      return { formato, bytes: blob.size, tipo: blob.type };
    };
    return () => {
      delete window.__cvExportar;
    };
  }, [dados, modelo, cores]);

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
            <Link href="/dev/curriculo?modelo=executivo&cor=8e2a3b">vinho</Link>
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
        <CurriculoImpressao dados={dados} modeloInicial={modelo} coresIniciais={cores} linkEditar={false} />
      </main>
    </div>
  );
}
