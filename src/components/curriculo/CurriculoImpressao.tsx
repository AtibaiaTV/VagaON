"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  FileImage,
  FileText,
  FileType2,
  Link2,
  Link2Off,
  Loader2,
  Palette,
  Pencil,
  Printer,
} from "lucide-react";
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
import {
  FORMATOS_EXPORTACAO,
  baixarBlob,
  exportarCurriculo,
  exportarPdf,
  nomeArquivo,
  type FormatoExportacao,
} from "@/lib/curriculo-exportar";
import IconeWhatsApp from "./IconeWhatsApp";
import ModeloCriativo from "./ModeloCriativo";
import ModeloExecutivo from "./ModeloExecutivo";
import ModeloMinimalista from "./ModeloMinimalista";
import VisorPagina from "./VisorPagina";

export const COMPONENTES_MODELO = {
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

export interface LinkPublico {
  token: string;
  ativo: boolean;
}

interface Props {
  dados: DadosCurriculo;
  modeloInicial: ModeloCurriculo;
  /** Cor de detalhe salva por modelo. */
  coresIniciais?: CoresCurriculo;
  /** Link público já criado (ou null). */
  linkInicial?: LinkPublico | null;
  /** Grava modelo, cores e link no perfil (só na página real, não no playground). */
  salvarPreferencia?: boolean;
  /** Abre a janela de impressão assim que a página carregar (?imprimir=1). */
  autoImprimir?: boolean;
  /** Mostra o link para editar os dados. */
  linkEditar?: boolean;
  /**
   * Currículo de outra pessoa (empresa ou admin olhando um candidato): título
   * em terceira pessoa e sem WhatsApp/link público, que são do próprio dono.
   */
  terceiro?: boolean;
}

function urlPublica(token: string) {
  return `${window.location.origin}/cv/${token}`;
}

/**
 * Fluxo em três passos: modelo → cor de detalhe → ação (Imprimir, Baixar em
 * PDF/Word/PNG/JPEG ou WhatsApp), com a prévia em tamanho real embaixo. Na
 * impressão só a página do currículo sai: o resto tem a classe `nao-imprimir`.
 */
export default function CurriculoImpressao({
  dados,
  modeloInicial,
  coresIniciais,
  linkInicial = null,
  salvarPreferencia = false,
  autoImprimir = false,
  linkEditar = true,
  terceiro = false,
}: Props) {
  const [modelo, setModelo] = useState<ModeloCurriculo>(modeloInicial);
  const [cores, setCores] = useState<CoresCurriculo>(coresIniciais ?? {});
  const [link, setLink] = useState<LinkPublico | null>(linkInicial);
  const [menuAberto, setMenuAberto] = useState(false);
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);
  const [compartilhando, setCompartilhando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const timerCor = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cor = corDoModelo(modelo, cores);

  // "1 clique" a partir do perfil: imprime assim que fontes e foto carregarem.
  useAutoImprimir(autoImprimir);

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

  function noPagina() {
    return area.current?.querySelector<HTMLElement>(".cv-pagina") ?? null;
  }

  async function exportar(formato: FormatoExportacao) {
    const no = noPagina();
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

  /** Cria/liga/desliga o link público e devolve { token, ativo }. */
  async function alterarLink(acao: "criar" | "ativar" | "desativar" | "renovar"): Promise<LinkPublico | null> {
    if (!salvarPreferencia) return null;
    const r = await fetch("/api/perfil/curriculo-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao }),
    }).catch(() => null);
    const d = await r?.json().catch(() => null);
    if (!r?.ok || !d?.token) throw new Error(d?.error ?? "Não foi possível criar o link.");
    const novo = { token: d.token, ativo: Boolean(d.ativo) };
    setLink(novo);
    return novo;
  }

  async function garantirLink(): Promise<string | null> {
    if (!salvarPreferencia) return null;
    if (link?.ativo) return urlPublica(link.token);
    const novo = await alterarLink(link ? "ativar" : "criar");
    return novo ? urlPublica(novo.token) : null;
  }

  /**
   * Celular: folha de compartilhamento do sistema com o PDF anexado (a
   * pessoa escolhe o WhatsApp e o contato). Computador ou navegador sem
   * suporte: abre o WhatsApp com a mensagem e o link público.
   */
  async function compartilharWhatsApp() {
    if (compartilhando) return;
    setErro(null);
    setCompartilhando(true);
    try {
      const url = await garantirLink();
      const texto = `Olá! Segue meu currículo${dados.titulo ? ` — ${dados.titulo}` : ""}${url ? `:\n${url}` : "."}`;

      const no = noPagina();
      if (no && typeof navigator.share === "function") {
        try {
          const blob = await exportarPdf(no);
          const arquivo = new File([blob], nomeArquivo(dados.nome, modelo, "pdf"), { type: "application/pdf" });
          if (navigator.canShare?.({ files: [arquivo] })) {
            await navigator.share({ files: [arquivo], title: `Currículo — ${dados.nome}`, text: texto });
            return;
          }
        } catch (e) {
          if ((e as DOMException)?.name === "AbortError") return; // a pessoa fechou a folha
          console.warn("[curriculo] share com arquivo falhou, usando link:", e);
        }
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível compartilhar.");
    } finally {
      setCompartilhando(false);
    }
  }

  async function copiarLink() {
    try {
      const url = await garantirLink();
      if (!url) return;
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível copiar o link.");
    }
  }

  async function alternarLink() {
    try {
      await alterarLink(link?.ativo ? "desativar" : link ? "ativar" : "criar");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível alterar o link.");
    }
  }

  const Modelo = COMPONENTES_MODELO[modelo];
  const corPreset = CORES_DETALHE.find((c) => c.value === cor);

  return (
    <div className="space-y-4">
      <div className="nao-imprimir space-y-3">
        <div>
          <h1 className="text-xl font-bold">{terceiro ? `Currículo de ${dados.nome}` : "Meu currículo"}</h1>
          <p className="text-sm text-muted-foreground">
            {terceiro
              ? "Os dados vêm do perfil do profissional. Escolha o modelo e a cor; depois imprima ou baixe"
              : "Escolha o modelo e a cor; depois imprima, baixe ou envie pelo WhatsApp. Os dados vêm do seu perfil"}
            {linkEditar && !terceiro && (
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

        {/* 1. Modelo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3" role="radiogroup" aria-label="Modelo do currículo">
          {MODELOS_CURRICULO.map((m, i) => {
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
                      <span className="text-muted-foreground font-normal">{i + 1}.</span> {m.label}
                      {ativo && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 hidden sm:block">{m.descricao}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. Cor de detalhe do modelo selecionado */}
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

        {/* 3. Ações */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold mr-1">Pronto?</span>
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
                  <div role="menu" className="absolute left-0 z-40 mt-2 w-64 rounded-xl border border-border bg-white shadow-xl p-1.5">
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

            {!terceiro && (
              <Button
                type="button"
                size="lg"
                onClick={compartilharWhatsApp}
                disabled={compartilhando}
                className="gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white"
                title="Enviar o currículo pelo WhatsApp"
              >
                {compartilhando ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconeWhatsApp className="h-4 w-4" />}
                WhatsApp
              </Button>
            )}
          </div>

          {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}

          {salvarPreferencia && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {link?.ativo ? (
                <>
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    Link público:{" "}
                    <a href={`/cv/${link.token}`} target="_blank" rel="noopener" className="text-primary underline truncate max-w-[220px] sm:max-w-none">
                      {typeof window === "undefined" ? `/cv/${link.token}` : urlPublica(link.token)}
                    </a>
                  </span>
                  <button type="button" onClick={copiarLink} className="inline-flex items-center gap-1 font-semibold hover:text-foreground">
                    {copiado ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiado ? "copiado" : "copiar"}
                  </button>
                  <button type="button" onClick={alternarLink} className="inline-flex items-center gap-1 hover:text-foreground">
                    <Link2Off className="h-3.5 w-3.5" /> desativar
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Link2Off className="h-3.5 w-3.5 shrink-0" />
                  {link ? "Link público desativado — " : "Sem link público ainda — "}
                  <button type="button" onClick={alternarLink} className="font-semibold underline hover:text-foreground">
                    {link ? "reativar" : "criar link"}
                  </button>
                  <span className="hidden sm:inline">· o WhatsApp cria automaticamente ao compartilhar</span>
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Imprimir abre a janela do navegador (lá também dá para “Salvar como PDF”). Baixar gera o arquivo direto: PDF e
            imagens são cópias fiéis da página; o Word é um documento editável com as mesmas cores.
            {!terceiro && " WhatsApp envia o PDF pelo celular ou, no computador, o link público do currículo."}
            {" "}Se as cores não aparecerem na impressão, ative “Gráficos de fundo”.
          </p>
        </div>
      </div>

      <div ref={area}>
        <VisorPagina chave={modelo}>
          <Modelo d={dados} cor={cor} />
        </VisorPagina>
      </div>
    </div>
  );
}

/** Dispara a impressão assim que fontes e imagens carregarem (?imprimir=1). */
function useAutoImprimir(ativo: boolean) {
  const disparado = useRef(false);
  if (typeof window !== "undefined" && ativo && !disparado.current) {
    disparado.current = true;
    (async () => {
      await document.fonts?.ready;
      await Promise.all(
        Array.from(document.images).map((img) =>
          img.complete ? null : new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); })
        )
      );
      setTimeout(() => window.print(), 300);
    })();
  }
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
