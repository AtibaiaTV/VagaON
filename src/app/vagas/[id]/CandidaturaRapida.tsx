"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputSenha from "@/components/shared/InputSenha";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EspecialidadeSelect from "@/components/shared/EspecialidadeSelect";
import PerguntasTriagem from "@/components/triagem/PerguntasTriagem";
import { ESTADOS } from "@/constants/estados";
import AutocompleteCidade from "@/components/shared/AutocompleteCidade";

interface Props {
  vagaId: string;
  vagaTitulo: string;
  cidade: string;
  estado: string;
  especialidade: string;
  perguntas?: string[];
}

/**
 * Inscrição em ~1 minuto para quem chegou pelo Google/Instagram e não tem
 * conta. Cidade, UF e função vêm preenchidas com as da vaga — na prática
 * são quatro campos digitados: nome, WhatsApp, e-mail e senha.
 */
export default function CandidaturaRapida({ vagaId, vagaTitulo, cidade, estado, especialidade, perguntas = [] }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    cidade,
    estado,
    especialidade,
    site: "", // honeypot
  });
  const [respostas, setRespostas] = useState<string[]>(perguntas.map(() => ""));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [existente, setExistente] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  function campo(nome: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [nome]: e.target.value }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setExistente(false);
    setEnviando(true);

    const r = await fetch("/api/candidatura-rapida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vagaId, respostasTriagem: respostas }),
    }).catch(() => null);
    const d = await r?.json().catch(() => ({}));

    if (!r?.ok) {
      setErro(d?.error ?? "Não foi possível enviar. Tente de novo.");
      setExistente(Boolean(d?.existente));
      setEnviando(false);
      return;
    }

    // Conta criada: entra com as mesmas credenciais e recarrega a página já logado.
    await signIn("credentials", { email: form.email, password: form.senha, redirect: false }).catch(() => null);
    setSucesso(true);
    setEnviando(false);
    router.refresh();
  }

  if (sucesso) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4">
        <p className="flex items-center gap-2 font-semibold text-green-800">
          <CheckCircle className="h-5 w-5" /> Candidatura enviada!
        </p>
        <p className="text-sm text-green-800/80 mt-1">
          Sua conta foi criada e você já está logado. Complete o perfil em 2 minutos para subir no ranking da empresa e
          receber vagas compatíveis no Descobrir.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link href="/perfil/editar">
            <Button size="sm">Completar perfil</Button>
          </Link>
          <Link href="/candidaturas">
            <Button size="sm" variant="outline">Minhas candidaturas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" /> Candidatura rápida
          </p>
          <p className="text-xs text-muted-foreground">
            Sem conta ainda? Candidate-se a <span className="font-medium">{vagaTitulo}</span> em 1 minuto. Já tem conta?{" "}
            <Link href={`/entrar?callbackUrl=/vagas/${vagaId}`} className="text-primary font-semibold underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {erro && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}{" "}
          {existente && (
            <Link href={`/entrar?callbackUrl=/vagas/${vagaId}`} className="font-semibold underline">
              Entrar agora
            </Link>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cr-nome">Nome completo *</Label>
          <Input id="cr-nome" value={form.nome} onChange={campo("nome")} required autoComplete="name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cr-telefone">WhatsApp com DDD *</Label>
          <Input id="cr-telefone" value={form.telefone} onChange={campo("telefone")} required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cr-email">E-mail *</Label>
          <Input id="cr-email" type="email" value={form.email} onChange={campo("email")} required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cr-senha">Crie uma senha *</Label>
          <InputSenha id="cr-senha" value={form.senha} onChange={campo("senha")} required minLength={8} autoComplete="new-password" placeholder="mínimo 8 caracteres" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cr-cidade">Cidade *</Label>
          <AutocompleteCidade
            id="cr-cidade"
            contexto="todas"
            uf={form.estado || undefined}
            value={form.cidade}
            onChange={(v) => setForm((f) => ({ ...f, cidade: v }))}
            onSelect={(s) => setForm((f) => ({ ...f, cidade: s.cidade, estado: s.uf ?? f.estado }))}
            required
            autoComplete="address-level2"
          />
        </div>
        <div className="space-y-1">
          <Label>Estado *</Label>
          <Select value={form.estado} onValueChange={(v) => setForm((f) => ({ ...f, estado: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>Sua função principal</Label>
          <EspecialidadeSelect value={form.especialidade} onChange={(v) => setForm((f) => ({ ...f, especialidade: v }))} />
        </div>
      </div>

      {perguntas.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">A empresa pergunta</p>
          <PerguntasTriagem perguntas={perguntas} respostas={respostas} onChange={setRespostas} idPrefixo="cr-triagem" compacto />
        </div>
      )}

      {/* Honeypot — invisível para pessoas, irresistível para robôs. */}
      <input
        type="text"
        name="site"
        value={form.site}
        onChange={campo("site")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando…
          </>
        ) : (
          "Candidatar-me em 1 minuto"
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Ao continuar você cria uma conta gratuita no VagaON e aceita receber avisos sobre esta candidatura.
      </p>
    </form>
  );
}
