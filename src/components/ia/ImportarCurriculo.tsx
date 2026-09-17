"use client";

import { useRef, useState, type DragEvent } from "react";
import { ChevronDown, FileText, Loader2, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PerfilExtraido } from "@/lib/ia/curriculo";

const MAX_MB = 4;
const TIPOS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MIN_TEXTO = 80;

interface Props {
  aoExtrair: (perfil: PerfilExtraido) => void;
  /** Começa recolhido (ex.: perfil já bem preenchido). */
  recolhido?: boolean;
}

/**
 * "Preencher com IA": manda o currículo (PDF, foto ou texto colado) para
 * /api/ia/curriculo e devolve a sugestão para o formulário. Nada é salvo
 * aqui — quem salva é o botão normal do perfil, depois da revisão.
 */
export default function ImportarCurriculo({ aoExtrair, recolhido = false }: Props) {
  const [aberto, setAberto] = useState(!recolhido);
  const [modo, setModo] = useState<"arquivo" | "texto">("arquivo");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sobre, setSobre] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pronto = modo === "arquivo" ? Boolean(arquivo) : texto.trim().length >= MIN_TEXTO;

  function escolherArquivo(f: File | null | undefined) {
    setErro(null);
    if (!f) return setArquivo(null);
    if (!TIPOS.includes(f.type)) return setErro("Envie um PDF, JPG, PNG ou WebP — ou cole o texto.");
    if (f.size > MAX_MB * 1024 * 1024) return setErro(`Arquivo acima de ${MAX_MB} MB. Envie um PDF menor ou cole o texto.`);
    setArquivo(f);
  }

  function aoSoltar(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setSobre(false);
    escolherArquivo(e.dataTransfer.files?.[0]);
  }

  async function enviar() {
    if (!pronto || processando) return;
    setErro(null);
    setProcessando(true);
    const fd = new FormData();
    if (modo === "arquivo" && arquivo) fd.append("arquivo", arquivo);
    else fd.append("texto", texto.trim());

    try {
      const r = await fetch("/api/ia/curriculo", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErro(d?.error ?? "Não foi possível ler o currículo. Tente de novo.");
        return;
      }
      aoExtrair(d.perfil as PerfilExtraido);
      setArquivo(null);
      setTexto("");
      setAberto(false);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <section className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 to-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={aberto}
      >
        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Preencher com IA a partir do seu currículo</p>
          <p className="text-xs text-muted-foreground">
            Envie o PDF ou uma foto e a IA sugere nome, funções, experiências e resumo. Você revisa antes de salvar.
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            {(["arquivo", "texto"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setModo(m);
                  setErro(null);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  modo === m ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "arquivo" ? "PDF ou foto" : "Colar texto"}
              </button>
            ))}
          </div>

          {modo === "arquivo" ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(true);
              }}
              onDragLeave={() => setSobre(false)}
              onDrop={aoSoltar}
              className={`rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
                sobre ? "border-primary bg-primary/5" : "border-border bg-white"
              }`}
            >
              {arquivo ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium truncate max-w-[240px]">{arquivo.name}</span>
                  <span className="text-xs text-muted-foreground">{(arquivo.size / 1024 / 1024).toFixed(1)} MB</span>
                  <button
                    type="button"
                    onClick={() => escolherArquivo(null)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover arquivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-primary/60 mx-auto mb-1.5" />
                  <p className="text-sm">
                    Arraste o currículo aqui ou{" "}
                    <button type="button" onClick={() => inputRef.current?.click()} className="text-primary font-semibold underline">
                      escolha o arquivo
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG ou WebP · até {MAX_MB} MB</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  escolherArquivo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={6}
                maxLength={20000}
                placeholder="Cole aqui o texto do seu currículo (nome, contato, experiências, cursos...)"
                className="bg-white"
              />
              <p className="text-xs text-muted-foreground text-right">
                {texto.trim().length < MIN_TEXTO ? `mínimo ${MIN_TEXTO} caracteres` : `${texto.length}/20000`}
              </p>
            </div>
          )}

          {erro && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Button type="button" onClick={enviar} disabled={!pronto || processando} className="gap-2">
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Lendo o currículo…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Ler e preencher
                </>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70" />
              O arquivo é usado só para sugerir os campos e não fica guardado. O que você já preencheu é mantido.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
