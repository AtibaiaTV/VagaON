"use client";

import { useRef, useState } from "react";
import { Upload, FileText, CheckCircle, XCircle, MinusCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RowPreview {
  nomeFantasia: string;
  classificacao: string;
  tituloVaga: string;
  cidade: string;
  estado: string;
  remuneracao: string;
}

interface Resultado {
  nome: string;
  status: "criado" | "pulado" | "erro";
  detalhe?: string;
}

interface ImportResponse {
  criados: number;
  pulados: number;
  erros: number;
  resultados: Resultado[];
}

// ── CSV parser client-side (apenas para preview) ──────────────────────────────
function parsePreview(text: string): RowPreview[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) { fields.push(current.trim()); current = ""; }
      else current += ch;
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  function col(row: string[], kw: string): string {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(kw.toLowerCase()));
    return idx !== -1 ? (row[idx] ?? "").replace(/^"|"$/g, "").trim() : "";
  }

  return lines.slice(1)
    .map((line) => {
      const row = splitLine(line);
      return {
        nomeFantasia:  col(row, "nome fantasia"),
        classificacao: col(row, "classifica"),
        tituloVaga:    col(row, "titulo da vaga"),
        cidade:        col(row, "cidade"),
        estado:        col(row, "estado"),
        remuneracao:   col(row, "remunera"),
      };
    })
    .filter((r) => r.nomeFantasia);
}

const STATUS_ICON = {
  criado: <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />,
  pulado: <MinusCircle className="h-4 w-4 text-yellow-500 shrink-0" />,
  erro:   <XCircle    className="h-4 w-4 text-red-500   shrink-0" />,
};
const STATUS_COR = {
  criado: "text-green-700",
  pulado: "text-yellow-700",
  erro:   "text-red-700",
};

export default function ImportarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<RowPreview[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [resposta, setResposta] = useState<ImportResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setErro("Apenas arquivos .csv são aceitos.");
      return;
    }
    setErro(null);
    setResposta(null);
    setArquivo(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(parsePreview(e.target?.result as string));
    reader.readAsText(file, "utf-8");
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function importar() {
    if (!arquivo) return;
    setCarregando(true);
    setErro(null);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      const res = await fetch("/api/admin/importar", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao importar.");
      setResposta(json);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  function resetar() {
    setArquivo(null);
    setPreview([]);
    setResposta(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Importar planilha CSV</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Faça upload de um arquivo .csv para criar estabelecimentos e vagas em lote.
        </p>
      </div>

      {/* Formato esperado */}
      <Card className="mb-6 border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Colunas esperadas no CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "Nome Fantasia","Razão Social","CNPJ","Classificação","Setor",
              "Descrição da Empresa","Telefone","Email de Contato","Site",
              "Cidade","Estado","CEP","Endereço","Titulo da Vaga",
              "Tipo de Contrato","Especialidade","Descrição da Vaga",
              "Requisitos","Remuneração","Aceita trabalho remoto",
            ].map((col) => (
              <span key={col} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                {col}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Colunas são identificadas por palavras-chave — a ordem exata não importa.
            Linhas sem "Nome Fantasia" são ignoradas.
          </p>
        </CardContent>
      </Card>

      {/* Upload area */}
      {!arquivo && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-colors"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-sm">Arraste o arquivo aqui ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">Apenas .csv · UTF-8</p>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
        </div>
      )}

      {erro && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* Preview */}
      {arquivo && !resposta && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {arquivo.name}
              <span className="text-muted-foreground font-normal text-sm">
                — {preview.length} registro(s) encontrado(s)
              </span>
            </CardTitle>
            <button onClick={resetar} className="text-xs text-muted-foreground hover:text-foreground underline">
              Trocar arquivo
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {["#","Estabelecimento","Classificação","Vaga","Cidade / UF","Remuneração"].map((h) => (
                      <th key={h} className="text-left px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{r.nomeFantasia}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.classificacao}</td>
                      <td className="px-4 py-2">{r.tituloVaga}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.cidade}{r.estado ? `, ${r.estado}` : ""}</td>
                      <td className="px-4 py-2 text-muted-foreground">{r.remuneracao || "A combinar"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-3 border-t">
                  Exibindo 50 de {preview.length} registros
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão importar */}
      {arquivo && !resposta && preview.length > 0 && (
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={importar} disabled={carregando} className="gap-2">
            {carregando
              ? <><Loader2 className="h-4 w-4 animate-spin" />Importando {preview.length} registros…</>
              : <><Upload className="h-4 w-4" />Importar {preview.length} registro(s)</>}
          </Button>
          <Button variant="outline" onClick={resetar} disabled={carregando}>
            Cancelar
          </Button>
        </div>
      )}

      {/* Resultados */}
      {resposta && (
        <div className="mt-6 space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-center">
              <p className="text-3xl font-bold text-green-700">{resposta.criados}</p>
              <p className="text-sm text-green-600 mt-1">Criados</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-center">
              <p className="text-3xl font-bold text-yellow-700">{resposta.pulados}</p>
              <p className="text-sm text-yellow-600 mt-1">Já existiam</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-center">
              <p className="text-3xl font-bold text-red-700">{resposta.erros}</p>
              <p className="text-sm text-red-600 mt-1">Erros</p>
            </div>
          </div>

          {/* Detalhe linha a linha */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Detalhes da importação</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={resetar}>
                <Download className="h-3.5 w-3.5" />
                Nova importação
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-96 overflow-y-auto">
                {resposta.resultados.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20">
                    {STATUS_ICON[r.status]}
                    <span className="font-medium text-sm flex-1">{r.nome}</span>
                    <span className={`text-xs ${STATUS_COR[r.status]}`}>
                      {r.status === "criado" ? r.detalhe : r.status === "pulado" ? "já cadastrado" : r.detalhe}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
