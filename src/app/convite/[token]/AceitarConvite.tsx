"use client";

import { useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Dados =
  | { estado: "valido"; empresa: string; email: string; nome: string; contaExiste: boolean }
  | { estado: "vencido" | "usado" | "cancelado" | "inexistente" };

interface Props {
  token: string;
  dados: Dados;
  sessao: { email: string; mesmaConta: boolean } | null;
}

const MOTIVOS: Record<string, string> = {
  vencido: "Este convite venceu. Peça um novo ao dono da empresa.",
  usado: "Este convite já foi usado. Se foi você, é só entrar.",
  cancelado: "Este convite foi cancelado pelo dono da empresa.",
  inexistente: "Convite não encontrado. Confira o link.",
};

export default function AceitarConvite({ token, dados, sessao }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(dados.estado === "valido" ? dados.nome : "");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (dados.estado !== "valido") {
    return (
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-bold">Convite indisponível</h1>
        <p className="text-sm text-muted-foreground">{MOTIVOS[dados.estado]}</p>
        <Link href="/entrar">
          <Button className="w-full">Entrar no VagaON</Button>
        </Link>
      </div>
    );
  }

  // Logado com outra conta: não dá para aceitar por cima.
  if (sessao && !sessao.mesmaConta) {
    return (
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
        <h1 className="text-xl font-bold">Você está com outra conta</h1>
        <p className="text-sm text-muted-foreground">
          Este convite é para <span className="font-semibold">{dados.email}</span>, mas você está logado como{" "}
          <span className="font-semibold">{sessao.email}</span>. Saia e abra o link de novo.
        </p>
        <Button className="w-full" variant="outline" onClick={() => signOut({ callbackUrl: `/convite/${token}` })}>
          Sair desta conta
        </Button>
      </div>
    );
  }

  const precisaCriar = !dados.contaExiste;
  const emailConvite = dados.email;

  async function aceitar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const r = await fetch(`/api/convite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(precisaCriar ? { nome, senha } : {}),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErro(d.error || "Não deu para aceitar o convite.");
      setCarregando(false);
      return;
    }

    if (precisaCriar) {
      const login = await signIn("credentials", { email: emailConvite, password: senha, redirect: false }).catch(() => null);
      if (login?.error) {
        router.push("/entrar");
        return;
      }
    } else if (!sessao) {
      // Conta já existia e a pessoa não está logada: entra com a senha dela.
      router.push("/entrar");
      return;
    }
    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Entrar na equipe de {dados.empresa}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">como gerente · {dados.email}</p>
        </div>
      </div>

      <form onSubmit={aceitar} className="space-y-4">
        {erro && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{erro}</div>
        )}

        {precisaCriar ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="nome">Seu nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" className="h-11 bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Crie uma senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={verSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="mínimo 8 caracteres"
                  className="h-11 bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={verSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Já existe uma conta com este e-mail. Ao aceitar, ela passa a operar {dados.empresa}.
            {!sessao && " Depois é só entrar com a sua senha."}
          </p>
        )}

        <Button type="submit" className="w-full h-11 font-semibold" disabled={carregando}>
          {carregando ? "Entrando..." : precisaCriar ? "Criar conta e entrar" : "Aceitar convite"}
        </Button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Ao entrar você passa a ver vagas, candidatos e conversas desta empresa.
      </p>
    </div>
  );
}
