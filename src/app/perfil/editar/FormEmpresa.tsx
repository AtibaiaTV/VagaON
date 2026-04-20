"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SETORES } from "@/constants/setores";
import { ESTADOS } from "@/constants/estados";
import { Building2, ArrowLeft, CheckCircle } from "lucide-react";

interface Props {
  profileId: string;
  dados: Record<string, string> | null;
}

export default function FormEmpresa({ profileId, dados }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    nomeFantasia: dados?.nomeFantasia ?? "",
    razaoSocial: dados?.razaoSocial ?? "",
    cnpj: dados?.cnpj ?? "",
    telefone: dados?.telefone ?? "",
    email: dados?.email ?? "",
    website: dados?.website ?? "",
    setor: dados?.setor ?? "",
    descricao: dados?.descricao ?? "",
    cidade: dados?.cidade ?? "",
    estado: dados?.estado ?? "",
    cep: dados?.cep ?? "",
    endereco: dados?.endereco ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSelect(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    const res = await fetch(`/api/empresas/${profileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao salvar.");
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push("/painel");
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/painel" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold">Perfil da Empresa</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {sucesso && (
          <div className="mb-6 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Perfil salvo com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações da empresa</CardTitle>
              <CardDescription>Dados principais que aparecem nas suas vagas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erro && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="nomeFantasia">Nome da empresa *</Label>
                <Input
                  id="nomeFantasia"
                  name="nomeFantasia"
                  value={form.nomeFantasia}
                  onChange={handleChange}
                  placeholder="Ex: Restaurante Sabor & Arte"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="razaoSocial">Razão social</Label>
                  <Input
                    id="razaoSocial"
                    name="razaoSocial"
                    value={form.razaoSocial}
                    onChange={handleChange}
                    placeholder="Razão social"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Setor *</Label>
                <Select value={form.setor} onValueChange={(v) => handleSelect("setor", v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SETORES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao">Descrição da empresa</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  placeholder="Conte um pouco sobre sua empresa, cultura e diferenciais..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">E-mail de contato</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="website">Site</Label>
                <Input
                  id="website"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://suaempresa.com.br"
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Estado *</Label>
                  <Select value={form.estado} onValueChange={(v) => handleSelect("estado", v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    name="cep"
                    value={form.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    placeholder="Rua, número"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar perfil"}
          </Button>
        </form>
      </main>
    </div>
  );
}
