"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Building2, Sparkles } from "lucide-react";

interface Empresa {
  _id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  setor: string;
  cidade: string;
  estado: string;
  verificada: boolean;
  userStatus: string;
  userEmail: string;
  /** Gerentes além do dono (ver docs/EQUIPE.md). */
  gerentes?: number;
  createdAt: string;
  // Planos (ver docs/PLANOS.md)
  assinatura?: { status?: string; interesseEm?: string | null };
  plano?: { plano: "gratis" | "pro"; motivo: "desligado" | "assinatura" | "trial" | "gratis"; ate: string | null };
  planosAtivos?: boolean;
  vagasAtivas?: number;
  candidaturas?: number;
  contratacoes?: number;
}

type AcaoPlano = "pro30" | "pro365" | "trial60" | "gratis";

const SETOR_LABEL: Record<string, string> = {
  restaurante: "Restaurante",
  hotel: "Hotel",
  bar: "Bar",
  eventos: "Eventos",
  outros: "Outros",
};

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  function carregar() {
    return fetch("/api/admin/empresas")
      .then((r) => r.json())
      .then((data) => {
        setEmpresas(data);
        setCarregando(false);
      });
  }

  useEffect(() => {
    carregar();
  }, []);

  async function definirPlano(id: string, acaoPlano: AcaoPlano) {
    setAtualizando(id + "_plano");
    const res = await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acaoPlano }),
    });
    if (res.ok) await carregar(); // o plano resolvido vem do servidor
    setAtualizando(null);
  }

  async function toggleVerificada(id: string, verificada: boolean, userStatus: string) {
    setAtualizando(id);
    const novoUserStatus = verificada ? "ativo" : userStatus;
    const res = await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificada, userStatus: novoUserStatus }),
    });
    if (res.ok) {
      setEmpresas((prev) =>
        prev.map((e) =>
          e._id === id ? { ...e, verificada, userStatus: novoUserStatus } : e
        )
      );
    }
    setAtualizando(null);
  }

  async function toggleUserStatus(id: string, status: string) {
    setAtualizando(id + "_status");
    const res = await fetch(`/api/admin/empresas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userStatus: status }),
    });
    if (res.ok) {
      setEmpresas((prev) =>
        prev.map((e) => (e._id === id ? { ...e, userStatus: status } : e))
      );
    }
    setAtualizando(null);
  }

  const filtradas = empresas.filter(
    (e) =>
      e.nomeFantasia.toLowerCase().includes(busca.toLowerCase()) ||
      e.userEmail.toLowerCase().includes(busca.toLowerCase())
  );

  const pendentes = filtradas.filter((e) => !e.verificada);
  const verificadas = filtradas.filter((e) => e.verificada);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Aprove e gerencie empresas cadastradas na plataforma.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 max-w-sm"
        />
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground text-center py-16">Carregando...</p>
      ) : (
        <div className="space-y-8">
          {/* Pendentes de aprovação */}
          {pendentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                Aguardando aprovação ({pendentes.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendentes.map((e) => (
                  <EmpresaCard
                    key={e._id}
                    empresa={e}
                    atualizando={atualizando}
                    onVerificar={(id) => toggleVerificada(id, true, e.userStatus)}
                    onRejeitar={(id) => toggleUserStatus(id, "suspenso")}
                    onSuspender={(id) => toggleUserStatus(id, "suspenso")}
                    onAtivar={(id) => toggleUserStatus(id, "ativo")}
                    onPlano={definirPlano}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Verificadas */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              Verificadas ({verificadas.length})
            </h2>
            {verificadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma empresa verificada ainda.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {verificadas.map((e) => (
                  <EmpresaCard
                    key={e._id}
                    empresa={e}
                    atualizando={atualizando}
                    onVerificar={(id) => toggleVerificada(id, true, e.userStatus)}
                    onRejeitar={(id) => toggleVerificada(id, false, e.userStatus)}
                    onSuspender={(id) => toggleUserStatus(id, "suspenso")}
                    onAtivar={(id) => toggleUserStatus(id, "ativo")}
                    onPlano={definirPlano}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmpresaCard({
  empresa,
  atualizando,
  onVerificar,
  onRejeitar,
  onSuspender,
  onAtivar,
  onPlano,
}: {
  empresa: Empresa;
  atualizando: string | null;
  onVerificar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onSuspender: (id: string) => void;
  onAtivar: (id: string) => void;
  onPlano: (id: string, acao: AcaoPlano) => void;
}) {
  const isLoading =
    atualizando === empresa._id || atualizando === empresa._id + "_status" || atualizando === empresa._id + "_plano";
  const plano = empresa.plano;
  const rotuloPlano = !plano
    ? null
    : plano.motivo === "desligado"
      ? "Planos desligados"
      : plano.plano === "pro"
        ? `Pro${plano.motivo === "trial" ? " (teste)" : ""}${plano.ate ? ` até ${new Date(plano.ate).toLocaleDateString("pt-BR")}` : ""}`
        : "Grátis";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-sm">{empresa.nomeFantasia}</CardTitle>
              <p className="text-xs text-muted-foreground">{empresa.razaoSocial}</p>
            </div>
          </div>
          {empresa.verificada ? (
            <Badge className="bg-green-100 text-green-700 text-xs shrink-0">Verificada</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 text-xs shrink-0">Pendente</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{SETOR_LABEL[empresa.setor] ?? empresa.setor} · {empresa.cidade}/{empresa.estado}</p>
          <p>
            {empresa.userEmail}
            {(empresa.gerentes ?? 0) > 0 && ` · +${empresa.gerentes} gerente${empresa.gerentes === 1 ? "" : "s"}`}
          </p>
          <p>
            Conta:{" "}
            <span
              className={`font-medium ${
                empresa.userStatus === "ativo"
                  ? "text-green-700"
                  : empresa.userStatus === "suspenso"
                  ? "text-red-700"
                  : "text-amber-700"
              }`}
            >
              {empresa.userStatus}
            </span>
          </p>
          <p>
            {empresa.vagasAtivas ?? 0} vaga(s) ativa(s) · {empresa.candidaturas ?? 0} candidatura(s) · {empresa.contratacoes ?? 0} contratação(ões)
          </p>
          {rotuloPlano && (
            <p className="flex flex-wrap items-center gap-1.5">
              Plano:{" "}
              <span className={`font-medium ${plano?.plano === "pro" && plano.motivo !== "desligado" ? "text-primary" : ""}`}>{rotuloPlano}</span>
              {empresa.assinatura?.interesseEm && (
                <Badge className="bg-primary/10 text-primary text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" /> quer o Pro
                </Badge>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {(["pro30", "pro365", "trial60", "gratis"] as AcaoPlano[]).map((acao) => (
            <Button
              key={acao}
              size="sm"
              variant="outline"
              className="h-6 text-[11px] px-2"
              disabled={isLoading}
              onClick={() => onPlano(empresa._id, acao)}
              title="Venda manual enquanto não há provedor de pagamento"
            >
              {acao === "pro30" ? "Pro 30d" : acao === "pro365" ? "Pro 1 ano" : acao === "trial60" ? "Teste 60d" : "Grátis"}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {!empresa.verificada && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => onVerificar(empresa._id)}
            >
              <CheckCircle className="h-3 w-3" />
              Aprovar
            </Button>
          )}
          {empresa.verificada && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-amber-700 border-amber-200 hover:bg-amber-50"
              disabled={isLoading}
              onClick={() => onRejeitar(empresa._id)}
            >
              <XCircle className="h-3 w-3" />
              Revogar
            </Button>
          )}
          {empresa.userStatus !== "suspenso" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
              disabled={isLoading}
              onClick={() => onSuspender(empresa._id)}
            >
              Suspender
            </Button>
          )}
          {empresa.userStatus === "suspenso" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
              disabled={isLoading}
              onClick={() => onAtivar(empresa._id)}
            >
              Reativar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
