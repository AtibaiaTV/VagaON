"use client";

import { useState } from "react";
import { KeyRound, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  /** false para conta criada pelo SSO da RedeSA, que nasce sem senha. */
  temSenha: boolean;
}

/** Cartão "Senha de acesso" do perfil: define a primeira senha ou troca a atual. */
export default function DefinirSenha({ temSenha: temSenhaInicial }: Props) {
  const [temSenha, setTemSenha] = useState(temSenhaInicial);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso(false);
    if (novaSenha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }
    setSalvando(true);
    const res = await fetch("/api/conta/senha", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(temSenha ? { senhaAtual, novaSenha } : { novaSenha }),
    }).catch(() => null);
    setSalvando(false);
    if (!res?.ok) {
      const dados = await res?.json().catch(() => null);
      setErro(dados?.error ?? "Não foi possível salvar. Tente de novo.");
      return;
    }
    setSucesso(true);
    setTemSenha(true);
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");
  }

  return (
    <Card id="senha" className={!temSenha ? "border-primary/40 bg-primary/5 scroll-mt-24" : "scroll-mt-24"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-primary" />
          {temSenha ? "Trocar senha" : "Definir uma senha"}
        </CardTitle>
        <CardDescription>
          {temSenha
            ? "Para entrar com e-mail e senha em qualquer aparelho."
            : "Sua conta entrou pela RedeSA e ainda não tem senha. Defina uma para entrar direto no VagaON, sem passar pelo backoffice."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {erro && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{erro}</div>
          )}
          {sucesso && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Senha salva. Você já pode entrar com e-mail e senha.
            </div>
          )}

          {temSenha && (
            <div className="space-y-1">
              <Label htmlFor="senhaAtual">Senha atual</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="novaSenha">{temSenha ? "Nova senha" : "Senha"}</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmacao">Confirmar</Label>
              <Input
                id="confirmacao"
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" variant={temSenha ? "outline" : "default"} disabled={salvando}>
            {salvando ? "Salvando..." : temSenha ? "Trocar senha" : "Definir senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
