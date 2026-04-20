"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/layout/Logo";

const beneficios = [
  "Publicação gratuita de vagas",
  "Acesso ao banco de talentos",
  "Contratação CLT · Temporária · Sazonal",
  "Profissionais verificados",
];

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "", nomeFantasia: "", email: "", senha: "", confirmarSenha: "",
  });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (form.senha !== form.confirmarSenha) { setErro("As senhas não conferem."); return; }
    if (form.senha.length < 8) { setErro("A senha deve ter pelo menos 8 caracteres."); return; }
    setCarregando(true);
    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, email: form.email, senha: form.senha, role: "empresa", nomeFantasia: form.nomeFantasia }),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.error || "Erro ao criar conta."); setCarregando(false); return; }
    await signIn("credentials", { email: form.email, password: form.senha, redirect: false });
    router.push("/perfil/editar");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Lado esquerdo — verde */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#143f28" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative">
          <Logo size="md" variant="white" />
        </div>

        <div className="relative space-y-8">
          <blockquote className="text-white/90 text-2xl font-semibold leading-snug">
            "Encontre os melhores talentos da gastronomia, hotelaria e eventos. Publique vagas e gerencie candidatos com facilidade."
          </blockquote>
          <p className="text-white/50 text-sm">Plataforma gratuita para restaurantes, hotéis e eventos</p>
          <div className="space-y-3">
            {beneficios.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#4ade80]/30 border border-[#4ade80]/50 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                </div>
                <p className="text-white/80 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">VagaON</p>
            <p className="text-white/50 text-xs">Gastronomia, Hotelaria e Eventos</p>
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex items-center justify-center px-6 py-12 bg-[#f4f7f5]">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="md" />
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Cadastro de Empresa</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Publique vagas e encontre os melhores profissionais.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {erro}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="nomeFantasia" className="text-sm font-medium">Nome da empresa</Label>
              <Input id="nomeFantasia" name="nomeFantasia" placeholder="Ex: Restaurante Sabor & Arte" value={form.nomeFantasia} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-medium">Seu nome (responsável)</Label>
              <Input id="nome" name="nome" placeholder="Nome do responsável" value={form.nome} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-mail corporativo</Label>
              <Input id="email" name="email" type="email" placeholder="contato@suaempresa.com" value={form.email} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-sm font-medium">Senha</Label>
              <Input id="senha" name="senha" type="password" placeholder="Mínimo 8 caracteres" value={form.senha} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium">Confirmar senha</Label>
              <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a senha" value={form.confirmarSenha} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <Button type="submit" className="w-full h-11 font-semibold text-base" disabled={carregando}>
              {carregando ? "Criando conta..." : "Criar conta da empresa"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao se cadastrar, você concorda com nossos{" "}
            <span className="text-primary hover:underline cursor-pointer">termos de uso</span>.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Link href="/cadastro" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
