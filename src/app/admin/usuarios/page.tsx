"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCheck, UserX, ShieldCheck, FileText } from "lucide-react";
import CurriculumModal from "@/components/admin/CurriculumModal";

interface Usuario {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_LABEL: Record<string, string> = {
  profissional: "Profissional",
  empresa: "Empresa",
  admin: "Admin",
};

const STATUS_BADGE: Record<string, string> = {
  ativo: "bg-green-100 text-green-700",
  suspenso: "bg-red-100 text-red-700",
  pendente: "bg-yellow-100 text-yellow-700",
};

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [curriculumAberto, setCurriculumAberto] = useState<{ id: string; nome: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((r) => r.json())
      .then((data) => {
        setUsuarios(data);
        setCarregando(false);
      });
  }, []);

  async function atualizarStatus(id: string, status: string) {
    setAtualizando(id);
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const atualizado = await res.json();
      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, status: atualizado.status } : u))
      );
    }
    setAtualizando(null);
  }

  const filtrados = usuarios.filter(
    (u) =>
      u.name.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie todos os usuários da plataforma.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Todos os usuários</CardTitle>
            <Badge variant="secondary">{usuarios.length}</Badge>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Carregando...
            </p>
          ) : filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Nome</th>
                    <th className="text-left py-3 pr-4">E-mail</th>
                    <th className="text-left py-3 pr-4">Perfil</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-left py-3 pr-4">Cadastro</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map((u) => (
                    <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{u.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1">
                          {u.role === "admin" && (
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                          )}
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botão Ver Curriculum — apenas para profissionais */}
                          {u.role === "profissional" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-[#1a5c38] border-[#c6e9d9] hover:bg-[#f0faf5]"
                              onClick={() => setCurriculumAberto({ id: u._id, nome: u.name })}
                            >
                              <FileText className="h-3 w-3" />
                              Ver Curriculum
                            </Button>
                          )}
                          {u.status !== "ativo" && u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                              disabled={atualizando === u._id}
                              onClick={() => atualizarStatus(u._id, "ativo")}
                            >
                              <UserCheck className="h-3 w-3" />
                              Ativar
                            </Button>
                          )}
                          {u.status !== "suspenso" && u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                              disabled={atualizando === u._id}
                              onClick={() => atualizarStatus(u._id, "suspenso")}
                            >
                              <UserX className="h-3 w-3" />
                              Suspender
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Curriculum */}
      {curriculumAberto && (
        <CurriculumModal
          userId={curriculumAberto.id}
          userName={curriculumAberto.nome}
          onClose={() => setCurriculumAberto(null)}
        />
      )}
    </div>
  );
}
