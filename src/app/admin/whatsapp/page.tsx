"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, KeyRound, Loader2, RefreshCw, Send, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Mensagem {
  id: string;
  direcao: "saida" | "entrada";
  telefone: string;
  usuario: string | null;
  tipo: string;
  texto: string;
  status: string;
  erro: string | null;
  em: string;
  atualizadoEm: string;
}

interface Resposta {
  configurado: boolean;
  phoneNumberId: string | null;
  template: string;
  totais: Record<string, number>;
  ultimas24h: number;
  mensagens: Mensagem[];
}

const STATUS_COR: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-700",
  entregue: "bg-emerald-100 text-emerald-700",
  lida: "bg-green-100 text-green-800",
  falhou: "bg-red-100 text-red-700",
  recebida: "bg-amber-100 text-amber-800",
};

function quando(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatarTelefone(t: string) {
  const d = t.replace(/\D/g, "");
  const local = d.startsWith("55") ? d.slice(2) : d;
  if (local.length < 10) return t;
  return `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
}

/**
 * Log do WhatsApp (Cloud API) e botão de teste. O log é alimentado pelo
 * envio (canais/whatsapp.ts) e pelo webhook (status e respostas).
 */
export default function AdminWhatsAppPage() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [telefoneBusca, setTelefoneBusca] = useState("");
  const [direcao, setDirecao] = useState("");
  const [telefoneTeste, setTelefoneTeste] = useState("");
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pin, setPin] = useState("");
  const [registrando, setRegistrando] = useState(false);
  const [resultadoRegistro, setResultadoRegistro] = useState<{ ok: boolean; texto: string } | null>(null);

  const [wabaId, setWabaId] = useState("");
  const [assinando, setAssinando] = useState(false);
  const [resultadoWaba, setResultadoWaba] = useState<{ ok: boolean; texto: string } | null>(null);

  async function assinarWaba(e: React.FormEvent) {
    e.preventDefault();
    setAssinando(true);
    setResultadoWaba(null);
    const r = await fetch("/api/admin/whatsapp/assinatura", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wabaId }),
    });
    const d = await r.json().catch(() => ({}));
    setAssinando(false);
    setResultadoWaba({
      ok: Boolean(d.ok),
      texto: d.error || d.detalhe
        ? String(d.error || d.detalhe)
        : `antes: ${d.antes}\nassinar: ${d.assinar}\ndepois: ${d.depois}`,
    });
  }

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setRegistrando(true);
    setResultadoRegistro(null);
    const r = await fetch("/api/admin/whatsapp/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const d = await r.json().catch(() => ({}));
    setRegistrando(false);
    setResultadoRegistro(
      d.ok
        ? { ok: true, texto: "Número registrado na Cloud API. Agora o envio de template deve funcionar." }
        : { ok: false, texto: `${d.status ?? ""} ${d.detalhe || d.error || "Falhou sem detalhe."}`.trim() }
    );
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const p = new URLSearchParams();
    if (telefoneBusca) p.set("telefone", telefoneBusca);
    if (direcao) p.set("direcao", direcao);
    const r = await fetch(`/api/admin/whatsapp?${p}`).catch(() => null);
    setDados(r?.ok ? await r.json() : null);
    setCarregando(false);
  }, [telefoneBusca, direcao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function testar(e: React.FormEvent) {
    e.preventDefault();
    setTestando(true);
    setResultadoTeste(null);
    const r = await fetch("/api/admin/whatsapp/teste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: telefoneTeste }),
    });
    const d = await r.json().catch(() => ({}));
    setTestando(false);
    setResultadoTeste(
      d.ok
        ? { ok: true, texto: `Aceito pela Meta em ${d.ms} ms para ${d.numero}. Veja se chegou no aparelho; a entrega aparece abaixo quando o webhook responder.` }
        : { ok: false, texto: d.detalhe || d.error || "Falhou sem detalhe." }
    );
    void carregar();
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mensagens trocadas com a API da Meta: avisos enviados, status de entrega e o que as pessoas responderam.
          Configuração em <Link href="/admin/diagnostico" className="underline">Diagnóstico</Link>.
        </p>
      </div>

      {dados && !dados.configurado && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          WhatsApp desligado neste ambiente: faltam <code>WHATSAPP_TOKEN</code> e/ou <code>WHATSAPP_PHONE_NUMBER_ID</code>.
          O log abaixo mostra só o que o webhook recebeu, se houver.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              Testar envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={testar} className="flex flex-wrap gap-2">
              <Input
                value={telefoneTeste}
                onChange={(e) => setTelefoneTeste(e.target.value)}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                className="w-48 bg-white"
                required
              />
              <Button type="submit" disabled={testando || !dados?.configurado} className="gap-2">
                {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar template
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Usa o template <code>{dados?.template ?? "vagaon_aviso"}</code>
              {dados?.phoneNumberId && <> a partir do número <code>{dados.phoneNumberId}</code></>}. Precisa do template
              aprovado na Meta.
            </p>
            {resultadoTeste && (
              <p className={`mt-2 text-sm ${resultadoTeste.ok ? "text-emerald-700" : "text-red-700"}`}>{resultadoTeste.texto}</p>
            )}

            {/* Registro do número na Cloud API: passo único, exigido depois de
                adicionar o número na conta. Sem ele: "(#133010) Account not registered". */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold">Registrar número na API</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Só na primeira vez, ou se o envio responder <code>#133010 Account not registered</code>. O PIN de 6
                dígitos vira a verificação em duas etapas do número: anote.
              </p>
              <form onSubmit={registrar} className="flex flex-wrap gap-2">
                <Input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="PIN de 6 dígitos"
                  inputMode="numeric"
                  className="w-40 bg-white"
                  required
                />
                <Button type="submit" variant="outline" disabled={registrando || pin.length !== 6 || !dados?.configurado} className="gap-2">
                  {registrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Registrar
                </Button>
              </form>
              {resultadoRegistro && (
                <p className={`mt-2 text-sm break-all ${resultadoRegistro.ok ? "text-emerald-700" : "text-red-700"}`}>{resultadoRegistro.texto}</p>
              )}
            </div>

            {/* Assinatura do app na WABA: sem isso o webhook não recebe
                status nem respostas, mesmo verificado no painel da Meta. */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-semibold">Assinar o app na conta (webhook)</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                Se as mensagens saem mas o status não muda e as respostas (PARAR) não chegam, o app não está assinado na
                conta do WhatsApp Business. ID da conta (WABA): em Configuração da API, ao lado do número.
              </p>
              <form onSubmit={assinarWaba} className="flex flex-wrap gap-2">
                <Input
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value.replace(/\D/g, ""))}
                  placeholder="ID da conta (WABA)"
                  inputMode="numeric"
                  className="w-56 bg-white"
                  required
                />
                <Button type="submit" variant="outline" disabled={assinando || !wabaId || !dados?.configurado} className="gap-2">
                  {assinando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                  Conferir e assinar
                </Button>
              </form>
              {resultadoWaba && (
                <pre className={`mt-2 text-xs whitespace-pre-wrap break-all rounded-lg p-2 ${resultadoWaba.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{resultadoWaba.texto}</pre>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Totais</CardTitle>
          </CardHeader>
          <CardContent>
            {dados ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {["enviada", "entregue", "lida", "falhou", "recebida"].map((s) => (
                  <span key={s} className={`px-2.5 py-1 rounded-full ${STATUS_COR[s]}`}>
                    {s}: <span className="font-semibold">{dados.totais[s] ?? 0}</span>
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  últimas 24 h: <span className="font-semibold">{dados.ultimas24h}</span>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">…</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={telefoneBusca}
          onChange={(e) => setTelefoneBusca(e.target.value)}
          placeholder="Filtrar por telefone"
          className="w-48 bg-white"
        />
        <select value={direcao} onChange={(e) => setDirecao(e.target.value)} className="h-8 rounded-lg border px-2 text-sm bg-white">
          <option value="">Enviadas e recebidas</option>
          <option value="saida">Só enviadas</option>
          <option value="entrada">Só recebidas</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => void carregar()} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {carregando && !dados ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando…</p>
        ) : !dados || dados.mensagens.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma mensagem registrada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Quando</th>
                <th className="text-left px-3 py-2 font-medium">Direção</th>
                <th className="text-left px-3 py-2 font-medium">Telefone / usuário</th>
                <th className="text-left px-3 py-2 font-medium">Texto</th>
                <th className="text-left px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dados.mensagens.map((m) => (
                <tr key={m.id} className="border-t align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{quando(m.em)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {m.direcao === "saida" ? (
                      <span className="inline-flex items-center gap-1 text-xs"><ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />{m.tipo}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs"><ArrowDownLeft className="h-3.5 w-3.5 text-amber-600" />{m.tipo}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>{formatarTelefone(m.telefone)}</div>
                    {m.usuario && <div className="text-xs text-muted-foreground">{m.usuario}</div>}
                  </td>
                  <td className="px-3 py-2 max-w-md">
                    <div className="line-clamp-2">{m.texto}</div>
                    {m.erro && <div className="text-xs text-red-700 mt-0.5 break-all">{m.erro}</div>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COR[m.status] ?? "bg-gray-100"}`}>{m.status}</span>
                    {m.atualizadoEm !== m.em && <div className="text-[10px] text-muted-foreground mt-0.5">{quando(m.atualizadoEm)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
