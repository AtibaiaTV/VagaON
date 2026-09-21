"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Briefcase } from "lucide-react";

interface Vaga {
  _id: string;
  titulo: string;
  nomeEmpresa: string;
  especialidade: string;
  tipo: string;
  cidade: string;
  estado: string;
  status: string;
  aprovadaPorAdmin: boolean;
  totalCandidaturas: number;
  /** Profissionais distintos que curtiram ou se candidataram. */
  interessados?: number;
  createdAt: string;
  updatedAt?: string;
}

/** "18/09 20:46" no horário de Brasília. */
function dataHora(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};

const STATUS_BADGE: Record<string, string> = {
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-yellow-100 text-yellow-700",
  encerrada: "bg-gray-100 text-gray-600",
  rejeitada: "bg-red-100 text-red-700",
  rascunho: "bg-blue-100 text-blue-600",
};

const STATUS_OPCOES: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "ativa", label: "Ativas" },
  { value: "pausada", label: "Pausadas" },
  { value: "preenchida", label: "Preenchidas" },
  { value: "encerrada", label: "Encerradas" },
  { value: "rejeitada", label: "Rejeitadas" },
  { value: "com-interesse", label: "Com interessados" },
];

/** useSearchParams exige Suspense por cima (regra do Next para páginas que leem a URL). */
export default function AdminVagasPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Carregando...</p>}>
      <AdminVagasPageConteudo />
    </Suspense>
  );
}

function AdminVagasPageConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const statusFiltro = params.get("status") ?? "";
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [busca, setBusca] = useState(params.get("busca") ?? "");

  function setStatus(valor: string) {
    router.replace(valor ? `/admin/vagas?status=${valor}` : "/admin/vagas");
  }
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/vagas")
      .then((r) => r.json())
      .then((data) => {
        setVagas(data);
        setCarregando(false);
      });
  }, []);

  async function moderarVaga(id: string, status: string, aprovadaPorAdmin: boolean, motivoRejeicao?: string) {
    setAtualizando(id);
    const res = await fetch(`/api/admin/vagas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, aprovadaPorAdmin, motivoRejeicao }),
    });
    if (res.ok) {
      setVagas((prev) =>
        prev.map((v) =>
          v._id === id ? { ...v, status, aprovadaPorAdmin } : v
        )
      );
    }
    setAtualizando(null);
  }

  const filtradas = vagas.filter((v) => {
    const b = busca.toLowerCase();
    if (!(v.titulo.toLowerCase().includes(b) || v.nomeEmpresa.toLowerCase().includes(b) || v.especialidade.toLowerCase().includes(b))) return false;
    if (statusFiltro === "com-interesse") return (v.interessados ?? 0) > 0;
    return !statusFiltro || v.status === statusFiltro;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Vagas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Modere todas as vagas publicadas na plataforma.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, empresa ou especialidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {STATUS_OPCOES.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setStatus(o.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              o.value === statusFiltro ? "bg-primary text-white border-primary" : "bg-white hover:border-primary/50 hover:text-primary"
            }`}
          >
            {o.label}
            <span className={`ml-1 tabular-nums ${o.value === statusFiltro ? "text-white/80" : "text-muted-foreground"}`}>
              {o.value === "" ? vagas.length : o.value === "com-interesse" ? vagas.filter((v) => (v.interessados ?? 0) > 0).length : vagas.filter((v) => v.status === o.value).length}
            </span>
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground text-center py-16">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">Nenhuma vaga encontrada.</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {statusFiltro ? STATUS_OPCOES.find((o) => o.value === statusFiltro)?.label : "Todas as vagas"}
              <Badge variant="secondary">{filtradas.length === vagas.length ? vagas.length : `${filtradas.length} de ${vagas.length}`}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Vaga</th>
                    <th className="text-left py-3 pr-4">Empresa</th>
                    <th className="text-left py-3 pr-4">Tipo</th>
                    <th className="text-left py-3 pr-4">Local</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3 pr-4">Criada</th>
                    <th className="text-left py-3 pr-4">Alterada</th>
                    <th className="text-left py-3 pr-4" title="Profissionais que curtiram no Descobrir ou se candidataram">Interesse</th>
                    <th className="text-left py-3 pr-4">Cand.</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtradas.map((v) => (
                    <tr key={v._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-green-100 flex items-center justify-center shrink-0">
                            <Briefcase className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div>
                            <Link href={`/admin/vagas/${v._id}`} className="font-medium leading-tight hover:text-primary hover:underline" title="Ficha completa e histórico">
                              {v.titulo}
                            </Link>
                            <p className="text-xs text-muted-foreground">{v.especialidade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{v.nomeEmpresa}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs">{TIPO_LABEL[v.tipo] ?? v.tipo}</span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-xs">
                        {v.cidade}/{v.estado}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_BADGE[v.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dataHora(v.createdAt)}</td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">{dataHora(v.updatedAt)}</td>
                      <td className={`py-3 pr-4 text-center ${(v.interessados ?? 0) > 0 ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                        {v.interessados ?? 0}
                      </td>
                      <td className="py-3 pr-4 text-center text-muted-foreground">
                        {v.totalCandidaturas}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {v.status !== "ativa" && v.status !== "encerrada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                              disabled={atualizando === v._id}
                              onClick={() => moderarVaga(v._id, "ativa", true)}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Aprovar
                            </Button>
                          )}
                          {v.status === "ativa" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-yellow-700 border-yellow-200 hover:bg-yellow-50"
                              disabled={atualizando === v._id}
                              onClick={() => moderarVaga(v._id, "pausada", true)}
                            >
                              Pausar
                            </Button>
                          )}
                          {v.status !== "rejeitada" && v.status !== "encerrada" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                              disabled={atualizando === v._id}
                              onClick={() =>
                                moderarVaga(v._id, "rejeitada", false, "Conteúdo inadequado")
                              }
                            >
                              <XCircle className="h-3 w-3" />
                              Rejeitar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
