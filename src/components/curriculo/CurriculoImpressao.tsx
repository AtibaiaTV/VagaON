"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Download, FileImage, FileText, FileType2, Loader2, Palette, Pencil, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CORES_DETALHE,
  COR_PADRAO,
  MODELOS_CURRICULO,
  corDoModelo,
  corValida,
  coresCriativo,
  coresExecutivo,
  coresMinimalista,
  type CoresCurriculo,
  type DadosCurriculo,
  type ModeloCurriculo,
} from "@/lib/curriculo";
import { FORMATOS_EXPORTACAO, baixarBlob, exportarCurriculo, nomeArquivo, type FormatoExportacao } from "@/lib/curriculo-exportar";
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

const ICONE_FORMATO: Record<FormatoExportacao, typeof FileText> = {
  pdf: FileText,
  docx: FileType2,
  png: FileImage,
  jpeg: FileImage,
};

interface Props {
  dados: DadosCurriculo;
  modeloInicial: ModeloCurriculo;
  /** Cor de detalhe salva por modelo. */
  coresIniciais?: CoresCurriculo;
  /** Grava modelo e cores no perfil (só na página real, não no playground). */
  salvarPreferencia?: boolean;
  /** Abre a janela de impressão assim que a página carregar (?imprimir=1). */
  autoImprimir?: boolean;
  /** Mostra o link para editar os dados. */
  linkEditar?: boolean;
}

/**
 * Escolha do modelo e da cor + prévia em tamanho real (reduzida para caber
 * na tela) + Imprimir + Baixar (PDF, Word, PNG, JPEG). Na impressão só a
 * página do currículo sai: o resto tem a classe `nao-imprimir`.
 */
export default function CurriculoImpressao({
  dados,
  modeloInicial,
  coresIniciais,
  salvarPreferencia = false,
  autoImprimir = false,
  linkEditar = true,
}: Props) {
  const [modelo, setModelo] = useState<ModeloCurriculo>(modeloInicial);
  const [cores, setCores] = useState<CoresCurriculo>(coresIniciais ?? {});
  const [escala, setEscala] = useState(1);
  const [altura, setAltura] = useState(ALTURA_PX);
  const [menuAberto, setMenuAberto] = useState(false);
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const visor = useRef<HTMLDivElement>(null);
  const pagina = useRef<HTMLDivElement>(null);
  const timerCor = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cor = corDoModelo(modelo, cores);

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

  function salvar(body: Record<string, string>) {
    if (!salvarPreferencia) return;
    fetch("/api/perfil/curriculo-modelo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  function escolherModelo(m: ModeloCurriculo) {
    setModelo(m);
    salvar({ modelo: m });
  }

  function escolherCor(hex: string) {
    if (!corValida(hex)) return;
    const c = hex.toLowerCase();
    setCores((prev) => ({ ...prev, [modelo]: c }));
    // O seletor livre dispara a cada movimento: grava só quando a pessoa para.
    if (timerCor.current) clearTimeout(timerCor.current);
    timerCor.current = setTimeout(() => salvar({ modelo, cor: c }), 400);
  }

  async function exportar(formato: FormatoExportacao) {
    const no = pagina.current?.querySelector<HTMLElement>(".cv-pagina");
    if (!no || gerando) return;
    setErro(null);
    setGerando(formato);
    try {
      const blob = await exportarCurriculo(formato, no, dados, modelo, cor);
      const ext = FORMATOS_EXPORTACAO.find((f) => f.value === formato)?.ext ?? formato;
      baixarBlob(blob, nomeArquivo(dados.nome, modelo, ext));
      setMenuAberto(false);
    } catch (e) {
      console.error("[curriculo] exportação falhou:", e);
      setErro("Não foi possível gerar o arquivo. Tente de novo ou use Imprimir → Salvar como PDF.");
    } finally {
      setGerando(null);
    }
  }

  const Modelo = COMPONENTES[modelo];
  const corPreset = CORES_DETALHE.find((c) => c.value === cor);

  return (
    <div className="space-y-4">
      <div className="nao-imprimir space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Meu currículo</h1>
            <p className="text-sm text-muted-foreground">
              Escolha o modelo e a cor. Os dados vêm do seu perfil
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

          <div className="flex items-center gap-2">
            <Button type="button" size="lg" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>

            <div className="relative">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setMenuAberto((v) => !v)}
                disabled={gerando !== null}
                aria-haspopup="menu"
                aria-expanded={menuAberto}
                className="gap-2 bg-white"
              >
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {gerando ? `Gerando ${FORMATOS_EXPORTACAO.find((f) => f.value === gerando)?.label}…` : "Baixar"}
                {!gerando && <ChevronDown className={`h-4 w-4 transition-transform ${menuAberto ? "rotate-180" : ""}`} />}
              </Button>

              {menuAberto && !gerando && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuAberto(false)} aria-hidden="true" />
                  <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-border bg-white shadow-xl p-1.5">
                    {FORMATOS_EXPORTACAO.map((f) => {
                      const Icone = ICONE_FORMATO[f.value];
                      return (
                        <button
                          key={f.value}
                          type="button"
                          role="menuitem"
                          onClick={() => exportar(f.value)}
                          className="w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-primary/5"
                        >
                          <Icone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            <span className="block text-sm font-semibold leading-tight">{f.label}</span>
                            <span className="block text-[11px] text-muted-foreground">{f.descricao}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}

        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Modelo do currículo">
          {MODELOS_CURRICULO.map((m) => {
            const ativo = m.value === modelo;
            return (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => escolherModelo(m.value)}
                className={`text-left rounded-xl border-2 bg-white p-2 sm:p-3 transition-colors ${
                  ativo ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Miniatura modelo={m.value} cor={corDoModelo(m.value, cores)} />
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

        {/* Cor de detalhe do modelo selecionado */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-white px-3 py-2.5">
          <span className="text-sm font-semibold inline-flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-primary" /> Cor de detalhe
          </span>
          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Cor de detalhe">
            {CORES_DETALHE.map((c) => {
              const ativa = c.value === cor;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={ativa}
                  aria-label={c.label}
                  title={c.label}
                  onClick={() => escolherCor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 ${
                    ativa ? "border-foreground" : "border-white shadow"
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {ativa && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
                </button>
              );
            })}
            <label
              className="w-7 h-7 rounded-full border-2 border-white shadow cursor-pointer relative overflow-hidden"
              title="Outra cor"
              style={{ background: "conic-gradient(#f43f5e, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #f43f5e)" }}
            >
              <input
                type="color"
                value={cor}
                onChange={(e) => escolherCor(e.target.value)}
                aria-label="Outra cor"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          </div>
          <span className="text-xs text-muted-foreground">
            {corPreset ? corPreset.label : `Personalizada ${cor}`}
            {cor !== COR_PADRAO[modelo] && (
              <>
                {" "}
                ·{" "}
                <button type="button" onClick={() => escolherCor(COR_PADRAO[modelo])} className="underline hover:text-foreground">
                  voltar ao padrão
                </button>
              </>
            )}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Imprimir abre a janela do navegador (lá também dá para “Salvar como PDF”). Baixar gera o arquivo direto: PDF e
          imagens são cópias fiéis da página; o Word é um documento editável com as mesmas cores. Se as cores não
          aparecerem na impressão, ative “Gráficos de fundo”.
        </p>
      </div>

      <div ref={visor} className="cv-visor overflow-hidden" style={{ height: altura }}>
        <div
          ref={pagina}
          className="cv-escalado shadow-xl"
          style={{ width: LARGURA_PX, transform: `scale(${escala})`, transformOrigin: "top left" }}
        >
          <Modelo d={dados} cor={cor} />
        </div>
      </div>
    </div>
  );
}

/** Esboço do layout de cada modelo, desenhado com CSS, na cor escolhida. */
function Miniatura({ modelo, cor }: { modelo: ModeloCurriculo; cor: string }) {
  const base = "relative w-12 h-16 sm:w-14 sm:h-[76px] rounded-md overflow-hidden border border-border/60 shrink-0";
  if (modelo === "executivo") {
    const c = coresExecutivo(cor);
    return (
      <div className={`${base} bg-[#f8f9fa]`} aria-hidden="true">
        <div className="absolute left-0 top-0 bottom-0 w-[35%]" style={{ backgroundColor: c.lateral }}>
          <div className="w-3 h-3 rounded-full border border-white mx-auto mt-1.5" style={{ backgroundColor: c.fotoFundo }} />
          <div className="mx-1 mt-1.5 h-0.5" style={{ backgroundColor: c.destaque }} />
        </div>
        <div className="absolute left-[42%] right-1 top-2 h-1 bg-[#2c3e50] rounded" />
        <div className="absolute left-[42%] right-3 top-4 h-0.5 rounded" style={{ backgroundColor: c.destaque }} />
        <div className="absolute left-[42%] right-2 top-7 h-0.5 bg-[#bdc3c7] rounded" />
        <div className="absolute left-[42%] right-4 top-9 h-0.5 bg-[#bdc3c7] rounded" />
      </div>
    );
  }
  if (modelo === "minimalista") {
    const c = coresMinimalista(cor);
    return (
      <div className={`${base} bg-white`} aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[28%]" style={{ backgroundColor: c.faixa }}>
          <div className="absolute left-1 top-1 w-3 h-3 rounded-sm" style={{ backgroundColor: c.fotoFundo }} />
          <div className="absolute left-5 right-1 top-1.5 h-1 bg-[#2f3542] rounded" />
        </div>
        <div className="absolute left-1 right-2 top-[40%] h-0.5 rounded" style={{ backgroundColor: c.destaque }} />
        <div className="absolute left-1 right-4 top-[52%] h-0.5 bg-[#a4b0be] rounded" />
        <div className="absolute left-1 right-3 top-[64%] h-0.5 bg-[#a4b0be] rounded" />
      </div>
    );
  }
  const c = coresCriativo(cor);
  return (
    <div className={`${base} bg-white`} aria-hidden="true">
      <div className="absolute left-0 top-0 bottom-0 w-[8%]" style={{ backgroundColor: c.destaque }} />
      <div className="absolute right-1 top-1 w-3 h-3 rounded-full" style={{ backgroundColor: c.linha }} />
      <div className="absolute left-2 w-5 top-2 h-1 bg-[#111111] rounded" />
      <div className="absolute left-2 w-4 top-4 h-0.5 rounded" style={{ backgroundColor: c.destaque }} />
      <div className="absolute left-2 right-1 top-7 h-0.5 rounded" style={{ backgroundColor: c.destaque }} />
      <div className="absolute left-2 right-3 top-9 h-0.5 bg-[#333333] rounded" />
    </div>
  );
}
