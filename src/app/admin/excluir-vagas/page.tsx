"use client";

import { useState } from "react";
import {
  Search, Trash2, AlertTriangle, CheckSquare,
  Square, Loader2, RotateCcw, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VagaResult {
  _id: string;
  titulo: string;
  nomeEmpresa: string;
  tipo: string;
  status: string;
  especialidade: string;
  cidade: string;
  estado: string;
  totalCandidaturas: number;
  createdAt: string;
}

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};
const STATUS_COR: Record<string, string> = {
  ativa:     "bg-green-100 text-green-700",
  pausada:   "bg-yellow-100 text-yellow-700",
  encerrada: "bg-gray-100 text-gray-600",
  rejeitada: "bg-red-100 text-red-700",
  rascunho:  "bg-blue-100 text-blue-600",
};

type Fase = "filtros" | "confirmar" | "concluido";

export default function ExcluirVagasPage() {
  // filtros
  const [empresa,    setEmpresa]    = useState("");
  const [titulo,     setTitulo]     = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim,    setDataFim]    = useState("");
  const [status,     setStatus]     = useState("");
  const [tipo,       setTipo]       = useState("");

  // estado
  const [vagas,      setVagas]      = useState<VagaResult[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [buscando,   setBuscando]   = useState(false);
  const [excluindo,  setExcluindo]  = useState(false);
  const [fase,       setFase]       = useState<Fase>("filtros");
  const [excluidas,  setExcluidas]  = useState(0);
  const [erro,       setErro]       = useState<string | null>(null);
  const [buscaFeita, setBuscaFeita] = useState(false);

  // ── buscar ──────────────────────────────────────────────────────────────────
  async function buscar() {
    setBuscando(true);
    setErro(null);
    setSelecionados(new Set());
    setFase("filtros");
    try {
      const params = new URLSearchParams();
      if (empresa)    params.set("empresa",    empresa);
      if (titulo)     params.set("titulo",     titulo);
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim)    params.set("dataFim",    dataFim);
      if (status)     params.set("status",     status);
      if (tipo)       params.set("tipo",       tipo);

      const res  = await fetch(`/api/admin/vagas/excluir?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao buscar.");
      setVagas(data);
      setBuscaFeita(true);
      // auto-seleciona todos
      setSelecionados(new Set(data.map((v: VagaResult) => v._id)));
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setBuscando(false);
    }
  }

  // ── seleção ─────────────────────────────────────────────────────────────────
  function toggleTodos() {
    if (selecionados.size === vagas.length) setSelecionados(new Set());
    else setSelecionados(new Set(vagas.map((v) => v._id)));
  }

  function toggleItem(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── exclusão ─────────────────────────────────────────────────────────────────
  async function confirmarExclusao() {
    setExcluindo(true);
    setErro(null);
    try {
      const res = await fetch("/api/admin/vagas/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selecionados) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir.");
      setExcluidas(data.excluidas);
      setFase("concluido");
      setVagas((prev) => prev.filter((v) => !selecionados.has(v._id)));
      setSelecionados(new Set());
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
      setFase("filtros");
    } finally {
      setExcluindo(false);
    }
  }

  function resetar() {
    setEmpresa(""); setTitulo(""); setDataInicio("");
    setDataFim(""); setStatus(""); setTipo("");
    setVagas([]); setSelecionados(new Set());
    setFase("filtros"); setExcluidas(0);
    setErro(null); setBuscaFeita(false);
  }

  const totalSelecionado = selecionados.size;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Excluir vagas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Use os filtros para encontrar vagas, selecione as que deseja remover e confirme.
        </p>
      </div>

      {/* ── Concluído ───────────────────────────────────────────────────────── */}
      {fase === "concluido" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-6 py-8 text-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{excluidas} vaga(s) excluída(s)</p>
          <p className="text-sm text-green-600 mt-1">A operação foi concluída com sucesso.</p>
          <Button variant="outline" className="mt-5 gap-2" onClick={resetar}>
            <RotateCcw className="h-4 w-4" />
            Nova exclusão
          </Button>
        </div>
      )}

      {/* ── Painel de filtros ───────────────────────────────────────────────── */}
      {fase !== "concluido" && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Estabelecimento</label>
                <Input
                  placeholder="Ex: Bourbon Resort"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscar()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Título da vaga</label>
                <Input
                  placeholder="Ex: Cozinheiro"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscar()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="ativa">Ativa</option>
                  <option value="pausada">Pausada</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="rejeitada">Rejeitada</option>
                  <option value="rascunho">Rascunho</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tipo de contrato</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="clt">CLT</option>
                  <option value="temporario">Temporário</option>
                  <option value="sazonal">Sazonal</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cadastrado a partir de</label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Cadastrado até</label>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-5">
              <Button onClick={buscar} disabled={buscando} className="gap-2">
                {buscando
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Buscando…</>
                  : <><Search className="h-4 w-4" />Buscar vagas</>}
              </Button>
              {buscaFeita && (
                <button onClick={resetar} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Limpar filtros
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {erro && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {erro}
        </div>
      )}

      {/* ── Resultados ─────────────────────────────────────────────────────── */}
      {buscaFeita && fase !== "concluido" && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              Vagas encontradas
              <Badge variant="secondary">{vagas.length}</Badge>
              {totalSelecionado > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  · {totalSelecionado} selecionada(s)
                </span>
              )}
            </CardTitle>

            {/* Select all */}
            {vagas.length > 0 && (
              <button
                onClick={toggleTodos}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {selecionados.size === vagas.length
                  ? <><CheckSquare className="h-4 w-4" />Desmarcar todos</>
                  : <><Square className="h-4 w-4" />Selecionar todos ({vagas.length})</>}
              </button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {vagas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Nenhuma vaga encontrada com esses filtros.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="w-10 px-4 py-3" />
                      <th className="text-left px-4 py-3">Vaga</th>
                      <th className="text-left px-4 py-3">Empresa</th>
                      <th className="text-left px-4 py-3">Tipo</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Local</th>
                      <th className="text-left px-4 py-3">Cadastro</th>
                      <th className="text-center px-4 py-3">Cand.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vagas.map((v) => {
                      const sel = selecionados.has(v._id);
                      return (
                        <tr
                          key={v._id}
                          onClick={() => toggleItem(v._id)}
                          className={`cursor-pointer transition-colors hover:bg-muted/30 ${sel ? "bg-red-50/60" : ""}`}
                        >
                          <td className="px-4 py-3 text-center">
                            {sel
                              ? <CheckSquare className="h-4 w-4 text-red-500 mx-auto" />
                              : <Square className="h-4 w-4 text-muted-foreground mx-auto" />}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center shrink-0">
                                <Briefcase className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium leading-tight">{v.titulo}</p>
                                <p className="text-xs text-muted-foreground">{v.especialidade}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-sm">{v.nomeEmpresa}</td>
                          <td className="px-4 py-3 text-xs">{TIPO_LABEL[v.tipo] ?? v.tipo}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[v.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{v.cidade}/{v.estado}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(v.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{v.totalCandidaturas}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Barra de ação fixa (aparece quando há seleção) ──────────────────── */}
      {totalSelecionado > 0 && fase === "filtros" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-white border border-border shadow-xl rounded-2xl px-6 py-4 flex items-center gap-6">
            <p className="text-sm font-medium">
              <span className="text-red-600 font-bold">{totalSelecionado}</span> vaga(s) selecionada(s)
            </p>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setFase("confirmar")}
            >
              <Trash2 className="h-4 w-4" />
              Excluir selecionadas
            </Button>
            <button
              onClick={() => setSelecionados(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de confirmação ────────────────────────────────────────────── */}
      {fase === "confirmar" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Confirmar exclusão</h2>
            <p className="text-muted-foreground text-sm text-center mb-6">
              Você está prestes a excluir permanentemente{" "}
              <strong className="text-foreground">{totalSelecionado} vaga(s)</strong>.
              <br />Esta ação <strong>não pode ser desfeita</strong>.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFase("filtros")}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Excluindo…</>
                  : <><Trash2 className="h-4 w-4" />Excluir {totalSelecionado}</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
