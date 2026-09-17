"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODELOS_CURRICULO, type DadosCurriculo, type ModeloCurriculo } from "@/lib/curriculo";
import ModeloCriativo from "./ModeloCriativo";
import ModeloExecutivo from "./ModeloExecutivo";
import ModeloMinimalista from "./ModeloMinimalista";

/** 210 mm a 96 dpi — largura real da página; na tela é reduzida para caber. */
const LARGURA_PX = 794;
const ALTURA_PX = 1123;

const COMPONENTES = {
  executivo: ModeloExecutivo,
  minimalista: ModeloMinimalista,
  criativo: ModeloCriativo,
} as const;

interface Props {
  dados: DadosCurriculo;
  modeloInicial: ModeloCurriculo;
  /** Grava a escolha no perfil (só na página real, não no playground). */
  salvarPreferencia?: boolean;
  /** Abre a janela de impressão assim que a página carregar (?imprimir=1). */
  autoImprimir?: boolean;
  /** Mostra o link para editar os dados. */
  linkEditar?: boolean;
}

/**
 * Escolha do modelo + prévia em tamanho real (reduzida para caber na tela)
 * + botão de imprimir. Na impressão só a página do currículo sai: o resto
 * tem a classe `nao-imprimir` (ver globals.css).
 */
export default function CurriculoImpressao({
  dados,
  modeloInicial,
  salvarPreferencia = false,
  autoImprimir = false,
  linkEditar = true,
}: Props) {
  const [modelo, setModelo] = useState<ModeloCurriculo>(modeloInicial);
  const [escala, setEscala] = useState(1);
  const [altura, setAltura] = useState(ALTURA_PX);
  const visor = useRef<HTMLDivElement>(null);
  const pagina = useRef<HTMLDivElement>(null);

  // A prévia é a página real, só reduzida; a altura do visor acompanha.
  useEffect(() => {
    const el = visor.current;
    const pg = pagina.current;
    if (!el || !pg) return;
    const medir = () => {
      const e = Math.min(1, el.clientWidth / LARGURA_PX);
      setEscala(e);
      setAltura(Math.ceil(pg.offsetHeight * e));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    ro.observe(pg);
    return () => ro.disconnect();
  }, [modelo]);

  // "1 clique" a partir do perfil: imprime assim que fontes e foto carregarem.
  useEffect(() => {
    if (!autoImprimir) return;
    let ativo = true;
    (async () => {
      await document.fonts?.ready;
      await Promise.all(
        Array.from(document.images).map((img) =>
          img.complete ? null : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); })
        )
      );
      if (ativo) setTimeout(() => window.print(), 300);
    })();
    return () => {
      ativo = false;
    };
  }, [autoImprimir]);

  function escolher(m: ModeloCurriculo) {
    setModelo(m);
    if (salvarPreferencia) {
      fetch("/api/perfil/curriculo-modelo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo: m }),
      }).catch(() => {});
    }
  }

  const Modelo = COMPONENTES[modelo];

  return (
    <div className="space-y-4">
      <div className="nao-imprimir space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Meu currículo</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o modelo e imprima ou salve em PDF. Os dados vêm do seu perfil
              {linkEditar && (
                <>
                  {" "}
                  —{" "}
                  <Link href="/perfil/editar" className="text-primary font-semibold underline inline-flex items-center gap-1">
                    <Pencil className="h-3 w-3" /> editar
                  </Link>
                </>
              )}
              .
            </p>
          </div>
          <Button type="button" size="lg" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / salvar PDF
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Modelo do currículo">
          {MODELOS_CURRICULO.map((m) => {
            const ativo = m.value === modelo;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => escolher(m.value)}
                className={`text-left rounded-xl border-2 bg-white p-2 sm:p-3 transition-colors ${
                  ativo ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Miniatura modelo={m.value} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight flex items-center gap-1">
                      {m.label}
                      {ativo && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 hidden sm:block">{m.descricao}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Na janela de impressão, escolha “Salvar como PDF” para gerar o arquivo. Se as cores não aparecerem, ative
          “Gráficos de fundo” nas opções de impressão.
        </p>
      </div>

      <div ref={visor} className="cv-visor overflow-hidden" style={{ height: altura }}>
        <div
          ref={pagina}
          className="cv-escalado shadow-xl"
          style={{ width: LARGURA_PX, transform: `scale(${escala})`, transformOrigin: "top left" }}
        >
          <Modelo d={dados} />
        </div>
      </div>
    </div>
  );
}

/** Esboço do layout de cada modelo, desenhado com CSS. */
function Miniatura({ modelo }: { modelo: ModeloCurriculo }) {
  const base = "relative w-12 h-16 sm:w-14 sm:h-[76px] rounded-md overflow-hidden border border-border/60 shrink-0";
  if (modelo === "executivo") {
    return (
      <div className={`${base} bg-[#f8f9fa]`} aria-hidden="true">
        <div className="absolute left-0 top-0 bottom-0 w-[35%] bg-[#2c3e50]">
          <div className="w-3 h-3 rounded-full bg-[#34495e] border border-white mx-auto mt-1.5" />
          <div className="mx-1 mt-1.5 h-0.5 bg-[#1abc9c]" />
        </div>
        <div className="absolute left-[42%] right-1 top-2 h-1 bg-[#2c3e50] rounded" />
        <div className="absolute left-[42%] right-3 top-4 h-0.5 bg-[#1abc9c] rounded" />
        <div className="absolute left-[42%] right-2 top-7 h-0.5 bg-[#bdc3c7] rounded" />
        <div className="absolute left-[42%] right-4 top-9 h-0.5 bg-[#bdc3c7] rounded" />
      </div>
    );
  }
  if (modelo === "minimalista") {
    return (
      <div className={`${base} bg-white`} aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[28%] bg-[#eaeff2]">
          <div className="absolute left-1 top-1 w-3 h-3 rounded-sm bg-[#ced6e0]" />
          <div className="absolute left-5 right-1 top-1.5 h-1 bg-[#2f3542] rounded" />
        </div>
        <div className="absolute left-1 right-2 top-[40%] h-0.5 bg-[#57606f] rounded" />
        <div className="absolute left-1 right-4 top-[52%] h-0.5 bg-[#a4b0be] rounded" />
        <div className="absolute left-1 right-3 top-[64%] h-0.5 bg-[#a4b0be] rounded" />
      </div>
    );
  }
  return (
    <div className={`${base} bg-white`} aria-hidden="true">
      <div className="absolute left-0 top-0 bottom-0 w-[8%] bg-[#0066cc]" />
      <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-[#e1e8ed]" />
      <div className="absolute left-2 w-5 top-2 h-1 bg-[#111111] rounded" />
      <div className="absolute left-2 w-4 top-4 h-0.5 bg-[#0066cc] rounded" />
      <div className="absolute left-2 right-1 top-7 h-0.5 bg-[#0066cc] rounded" />
      <div className="absolute left-2 right-3 top-9 h-0.5 bg-[#333333] rounded" />
    </div>
  );
}
