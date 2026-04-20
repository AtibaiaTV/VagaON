"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft } from "lucide-react";
import Logo from "@/components/layout/Logo";

const beneficios = [
  "Perfil visível para centenas de empresas",
  "Candidate-se com um clique",
  "CLT · Temporário · Sazonal",
  "Sem taxas — 100% gratuito",
];

export default function CadastroProfissionalPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmarSenha: "" });
  const [foto, setFoto] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErro("A foto deve ter no máximo 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!foto) { setErro("É obrigatório anexar uma foto de perfil."); return; }
    if (form.senha !== form.confirmarSenha) { setErro("As senhas não conferem."); return; }
    if (form.senha.length < 8) { setErro("A senha deve ter pelo menos 8 caracteres."); return; }
    setCarregando(true);
    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, email: form.email, senha: form.senha, role: "profissional", foto }),
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
        style={{ backgroundColor: "#1a5c38" }}
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
            "Seu próximo emprego em gastronomia, hotelaria e eventos está aqui. Cadastre-se e seja encontrado pelas melhores empresas do Brasil."
          </blockquote>
          <p className="text-white/50 text-sm">Plataforma 100% gratuita para profissionais</p>
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
            <h1 className="text-2xl font-bold text-foreground">Cadastro de Profissional</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Crie sua conta e comece a encontrar vagas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {erro && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {erro}
              </div>
            )}

            {/* Foto de perfil */}
            <div className="flex flex-col items-center gap-2">
              <Label className="text-sm font-medium self-start">
                Foto de perfil <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 hover:border-primary transition-colors bg-white flex items-center justify-center group"
              >
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Clique para adicionar sua foto</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-sm font-medium">Nome completo</Label>
              <Input id="nome" name="nome" placeholder="Seu nome completo" value={form.nome} onChange={handleChange} required className="h-11 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required className="h-11 bg-white" />
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
              {carregando ? "Criando conta..." : "Criar minha conta"}
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
