"use client";

import { useEffect, useState } from "react";
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
  createdAt: string;
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

export default function AdminVagasPage() {
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [busca, setBusca] = useState("");
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

  const filtradas = vagas.filter(
    (v) =>
      v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      v.nomeEmpresa.toLowerCase().includes(busca.toLowerCase()) ||
      v.especialidade.toLowerCase().includes(busca.toLowerCase())
  );

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

      {carregando ? (
        <p className="text-sm text-muted-foreground text-center py-16">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-16">Nenhuma vaga encontrada.</p>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Todas as vagas
              <Badge variant="secondary">{vagas.length}</Badge>
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
                            <p className="font-medium leading-tight">{v.titulo}</p>
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
