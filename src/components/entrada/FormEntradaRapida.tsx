"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EspecialidadeSelect from "@/components/shared/EspecialidadeSelect";
import { ESTADOS } from "@/constants/estados";
import AutocompleteCidade from "@/components/shared/AutocompleteCidade";

export interface ContaRapida {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  cidade: string;
  estado: string;
  especialidade: string;
}

interface Props {
  /** Rótulos por tipo de conta. */
  rotuloNome: string;
  rotuloEspecialidade: string;
  /** Campos extras (ex.: descrição da vaga), renderizados antes do botão. */
  extras?: ReactNode;
  /** Validação dos extras; devolve mensagem de erro ou null. */
  validarExtras?: () => string | null;
  /** Monta o corpo enviado à API a partir da conta (extras entram aqui). */
  corpo: (conta: ContaRapida) => Record<string, unknown>;
  api: string;
  /** Para onde ir depois de entrar; recebe a resposta da API. */
  destino: (resposta: Record<string, unknown>) => string;
  textoBotao: string;
  textoEnviando: string;
  origem: string | null;
}

/**
 * Formulário único da entrada rápida (QR ou link): cria a conta, entra e
 * redireciona. Compartilhado por /curriculo e /anunciar.
 */
export default function FormEntradaRapida({
  rotuloNome,
  rotuloEspecialidade,
  extras,
  validarExtras,
  corpo,
  api,
  destino,
  textoBotao,
  textoEnviando,
  origem,
}: Props) {
  const router = useRouter();
  const [conta, setConta] = useState<ContaRapida>({ nome: "", telefone: "", email: "", senha: "", cidade: "", estado: "", especialidade: "" });
  const [site, setSite] = useState(""); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [existente, setExistente] = useState(false);

  function campo(nome: keyof ContaRapida) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setConta((c) => ({ ...c, [nome]: e.target.value }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setExistente(false);
    const erroExtras = validarExtras?.();
    if (erroExtras) return setErro(erroExtras);
    if (!conta.especialidade) return setErro(`Escolha ${rotuloEspecialidade.toLowerCase()}.`);

    setEnviando(true);
    const r = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...conta, ...corpo(conta), origem, site }),
    }).catch(() => null);
    const d = await r?.json().catch(() => ({}));

    if (!r?.ok) {
      setErro(d?.error ?? "Não foi possível criar a conta. Tente de novo.");
      setExistente(Boolean(d?.existente));
      setEnviando(false);
      return;
    }

    await signIn("credentials", { email: conta.email, password: conta.senha, redirect: false }).catch(() => null);
    router.push(destino(d ?? {}));
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      {erro && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {erro}{" "}
          {existente && (
            <Link href="/entrar" className="font-semibold underline">
              Entrar agora
            </Link>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="er-nome">{rotuloNome} *</Label>
          <Input id="er-nome" value={conta.nome} onChange={campo("nome")} required autoComplete="name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="er-telefone">WhatsApp com DDD *</Label>
          <Input id="er-telefone" value={conta.telefone} onChange={campo("telefone")} required inputMode="tel" autoComplete="tel" placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="er-email">E-mail *</Label>
          <Input id="er-email" type="email" value={conta.email} onChange={campo("email")} required autoComplete="email" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="er-senha">Crie uma senha *</Label>
          <Input id="er-senha" type="password" value={conta.senha} onChange={campo("senha")} required minLength={8} autoComplete="new-password" placeholder="mínimo 8 caracteres" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="er-cidade">Cidade *</Label>
          <AutocompleteCidade
            id="er-cidade"
            contexto="todas"
            uf={conta.estado || undefined}
            value={conta.cidade}
            onChange={(v) => setConta((c) => ({ ...c, cidade: v }))}
            onSelect={(s) => setConta((c) => ({ ...c, cidade: s.cidade, estado: s.uf ?? c.estado }))}
            required
            autoComplete="address-level2"
          />
        </div>
        <div className="space-y-1">
          <Label>Estado *</Label>
          <Select value={conta.estado} onValueChange={(v) => setConta((c) => ({ ...c, estado: v ?? "" }))}>
            <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>{rotuloEspecialidade} *</Label>
          <EspecialidadeSelect value={conta.especialidade} onChange={(v) => setConta((c) => ({ ...c, especialidade: v }))} />
        </div>
      </div>

      {extras}

      {/* Honeypot — invisível para pessoas, irresistível para robôs. */}
      <input
        type="text"
        name="site"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> {textoEnviando}
          </>
        ) : (
          textoBotao
        )}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Ao continuar você cria uma conta gratuita no VagaON. Já tem conta?{" "}
        <Link href="/entrar" className="text-primary font-semibold underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
