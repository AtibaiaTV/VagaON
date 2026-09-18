"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/Logo";
import type { DadosCurriculo, ModeloCurriculo } from "@/lib/curriculo";
import { baixarBlob, exportarPdf, nomeArquivo } from "@/lib/curriculo-exportar";
import { COMPONENTES_MODELO } from "./CurriculoImpressao";
import VisorPagina from "./VisorPagina";

/**
 * Página pública do currículo (/cv/[token]): quem recebe o link vê o
 * currículo, imprime ou baixa o PDF. Sem login, sem índice nos buscadores.
 */
export default function CurriculoPublico({ dados, modelo, cor }: { dados: DadosCurriculo; modelo: ModeloCurriculo; cor: string }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const Modelo = COMPONENTES_MODELO[modelo];

  async function baixarPdf() {
    const no = area.current?.querySelector<HTMLElement>(".cv-pagina");
    if (!no || gerando) return;
    setErro(null);
    setGerando(true);
    try {
      baixarBlob(await exportarPdf(no), nomeArquivo(dados.nome, modelo, "pdf"));
    } catch {
      setErro("Não foi possível gerar o PDF. Use Imprimir → Salvar como PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#e9edeb]">
      <header className="nao-imprimir bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0">
            <Logo size="md" />
          </Link>
          <p className="text-sm text-muted-foreground truncate hidden sm:block">Currículo de {dados.nome}</p>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={baixarPdf} disabled={gerando} className="gap-1.5 bg-white">
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              PDF
            </Button>
            <Button type="button" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {erro && <p className="nao-imprimir text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{erro}</p>}
        <div ref={area}>
          <VisorPagina chave={modelo}>
            <Modelo d={dados} cor={cor} />
          </VisorPagina>
        </div>
        <p className="nao-imprimir text-[11px] text-muted-foreground text-center">
          Currículo criado no{" "}
          <Link href="/" className="text-primary font-semibold underline">
            VagaON
          </Link>{" "}
          — vagas de gastronomia, hotelaria e eventos.
        </p>
      </main>
    </div>
  );
}
