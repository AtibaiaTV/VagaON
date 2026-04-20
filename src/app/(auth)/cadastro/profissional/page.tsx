"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Camera, User } from "lucide-react";

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
    if (file.size > 5 * 1024 * 1024) {
      setErro("A foto deve ter no máximo 5 MB.");
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Cadastro de Profissional</h1>
          <p className="text-muted-foreground text-sm mt-1">Crie sua conta e comece a encontrar vagas.</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-6">
              {erro && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
              )}

              {/* Upload de foto */}
              <div className="flex flex-col items-center gap-2">
                <Label className="text-sm font-medium">
                  Foto de perfil <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 hover:border-primary transition-colors bg-muted/50 flex items-center justify-center group"
                >
                  {foto ? (
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

              {/* Nome */}
              <div className="space-y-1">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" name="nome" placeholder="Seu nome completo" value={form.nome} onChange={handleChange} required />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required />
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <Label htmlFor="senha">Senha</Label>
                <Input id="senha" name="senha" type="password" placeholder="Mínimo 8 caracteres" value={form.senha} onChange={handleChange} required />
              </div>

              {/* Confirmar senha */}
              <div className="space-y-1">
                <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                <Input id="confirmarSenha" name="confirmarSenha" type="password" placeholder="Repita a senha" value={form.confirmarSenha} onChange={handleChange} required />
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? "Criando conta..." : "Criar minha conta"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao se cadastrar, você concorda com nossos termos de uso.
              </p>
              <Link href="/cadastro" className="text-sm text-muted-foreground hover:underline">← Voltar</Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
