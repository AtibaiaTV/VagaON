"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Crown, Link2, Mail, MessageCircle, Trash2, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConviteListado, MembroListado } from "@/lib/servicos/equipe";

interface Props {
  papel: "dono" | "gerente";
  meuId: string;
  membrosIniciais: MembroListado[];
  convitesIniciais: ConviteListado[];
  podeConvidar: boolean;
  maxMembros: number;
}

function dataCurta(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function GerenciarEquipe({ papel, meuId, membrosIniciais, convitesIniciais, podeConvidar, maxMembros }: Props) {
  const [membros, setMembros] = useState(membrosIniciais);
  const [convites, setConvites] = useState(convitesIniciais);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);

  const ehDono = papel === "dono";
  const gerentes = membros.filter((m) => m.papel === "gerente").length;
  const cheia = gerentes >= maxMembros;

  async function convidar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);
    const r = await fetch("/api/empresa/equipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome }),
    });
    const d = await r.json().catch(() => ({}));
    setEnviando(false);
    if (!r.ok) {
      setErro(d.error || "Não deu para convidar.");
      return;
    }
    setConvites((c) => [d.convite, ...c.filter((x) => x.email !== d.convite.email)]);
    setEmail("");
    setNome("");
    setAviso(
      d.emailEnviado
        ? "Convite enviado por e-mail. Você também pode mandar o link por WhatsApp."
        : "Convite criado. Mande o link abaixo por WhatsApp ou copie e envie como preferir."
    );
  }

  async function cancelar(id: string) {
    if (!confirm("Cancelar este convite?")) return;
    const r = await fetch(`/api/empresa/equipe/convites/${id}`, { method: "DELETE" });
    if (r.ok) setConvites((c) => c.filter((x) => x.id !== id));
  }

  async function remover(m: MembroListado) {
    if (!confirm(`Remover ${m.nome} da equipe? A pessoa perde o acesso à empresa na hora.`)) return;
    const r = await fetch(`/api/empresa/equipe/membros/${m.userId}`, { method: "DELETE" });
    if (r.ok) setMembros((l) => l.filter((x) => x.userId !== m.userId));
    else {
      const d = await r.json().catch(() => ({}));
      setErro(d.error || "Não deu para remover.");
    }
  }

  async function copiar(c: ConviteListado) {
    try {
      await navigator.clipboard.writeText(c.link);
      setCopiado(c.id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      prompt("Copie o link:", c.link);
    }
  }

  function linkWhatsApp(c: ConviteListado): string {
    const texto = `Olá${c.nome ? `, ${c.nome.split(" ")[0]}` : ""}! Te convidei para gerenciar as vagas da nossa empresa no VagaON. Entre por aqui: ${c.link}`;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quem opera a empresa</CardTitle>
          <CardDescription>
            O dono cuida do plano e da equipe. Gerentes publicam vagas, cuidam dos candidatos, usam o Descobrir e o chat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-xl border border-border/50 bg-white">
            {membros.map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    {m.papel === "dono" && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <span className="truncate">{m.nome}</span>
                    {m.userId === meuId && <span className="text-xs text-muted-foreground font-normal">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.email} · {m.papel === "dono" ? "Dono" : `Gerente desde ${dataCurta(m.desde)}`}
                    {m.status === "suspenso" && " · suspenso"}
                  </p>
                </div>
                {ehDono && m.papel === "gerente" && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={() => remover(m)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remover</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {ehDono && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserRoundPlus className="h-4 w-4 text-primary" />
              Convidar gerente
            </CardTitle>
            <CardDescription>
              A pessoa recebe um link, cria a senha e já entra na sua empresa. O convite vale 7 dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!podeConvidar ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                Convidar gerentes faz parte do plano Pro.{" "}
                <Link href="/planos" className="font-semibold text-primary underline underline-offset-2">
                  Ver planos
                </Link>
              </div>
            ) : cheia ? (
              <p className="text-sm text-muted-foreground">A equipe já tem o máximo de {maxMembros} gerentes.</p>
            ) : (
              <form onSubmit={convidar} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="conv-email">E-mail</Label>
                  <Input id="conv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="gerente@empresa.com.br" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conv-nome">Nome (opcional)</Label>
                  <Input id="conv-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Maria" className="bg-white" />
                </div>
                <Button type="submit" disabled={enviando} className="gap-2">
                  <Mail className="h-4 w-4" />
                  {enviando ? "Enviando..." : "Convidar"}
                </Button>
              </form>
            )}
            {erro && <p className="mt-3 text-sm text-destructive">{erro}</p>}
            {aviso && <p className="mt-3 text-sm text-primary">{aviso}</p>}
          </CardContent>
        </Card>
      )}

      {ehDono && convites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Convites pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-xl border border-border/50 bg-white">
              {convites.map((c) => (
                <li key={c.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.nome || c.email}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.nome && `${c.email} · `}
                        {c.vencido ? "vencido" : `vale até ${dataCurta(c.expiraEm)}`}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-muted-foreground gap-1" onClick={() => cancelar(c.id)}>
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </Button>
                  </div>
                  {!c.vencido && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copiar(c)}>
                        {copiado === c.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiado === c.id ? "Copiado" : "Copiar link"}
                      </Button>
                      <a href={linkWhatsApp(c)} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </Button>
                      </a>
                      <a href={c.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2">
                        <Link2 className="h-3.5 w-3.5" />
                        abrir
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!ehDono && (
        <p className="text-sm text-muted-foreground">Só o dono da empresa convida ou remove pessoas da equipe.</p>
      )}
    </div>
  );
}
