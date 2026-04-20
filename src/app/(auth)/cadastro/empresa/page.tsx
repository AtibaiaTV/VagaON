"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    nomeFantasia: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    if (form.senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setCarregando(true);

    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        role: "empresa",
        nomeFantasia: form.nomeFantasia,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Erro ao criar conta.");
      setCarregando(false);
      return;
    }

    await signIn("credentials", {
      email: form.email,
      password: form.senha,
      redirect: false,
    });

    router.push("/perfil/editar");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Cadastro de Empresa</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publique vagas e encontre profissionais.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {erro && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {erro}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="nomeFantasia">Nome da empresa</Label>
                <Input
                  id="nomeFantasia"
                  name="nomeFantasia"
                  placeholder="Ex: Restaurante Sabor & Arte"
                  value={form.nomeFantasia}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nome">Seu nome (responsável)</Label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Nome do responsável"
                  value={form.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">E-mail corporativo</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@suaempresa.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  name="senha"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.senha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                <Input
                  id="confirmarSenha"
                  name="confirmarSenha"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.confirmarSenha}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? "Criando conta..." : "Criar conta da empresa"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao se cadastrar, você concorda com nossos termos de uso.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                <Link href="/cadastro" className="hover:underline">
                  ← Voltar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
