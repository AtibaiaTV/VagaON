"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ESTADOS } from "@/constants/estados";
import { ArrowLeft, Briefcase } from "lucide-react";
import EspecialidadeSelect from "@/components/shared/EspecialidadeSelect";

export default function NovaVagaPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    requisitos: "",
    tipo: "",
    especialidade: "",
    cidade: "",
    estado: "",
    remoto: false,
    salarioTipo: "a_combinar",
    salarioMin: "",
    salarioMax: "",
    salarioPeriodo: "mes",
    periodoInicio: "",
    periodoFim: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSelect(campo: string, valor: string) {
    setForm((p) => ({ ...p, [campo]: valor ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    const payload = {
      titulo: form.titulo,
      descricao: form.descricao,
      requisitos: form.requisitos,
      tipo: form.tipo,
      especialidade: form.especialidade,
      cidade: form.cidade,
      estado: form.estado,
      remoto: form.remoto,
      salario: {
        tipo: form.salarioTipo,
        min: form.salarioMin ? parseFloat(form.salarioMin) : null,
        max: form.salarioMax ? parseFloat(form.salarioMax) : null,
        moeda: "BRL",
        periodo: form.salarioPeriodo,
      },
      periodo: {
        dataInicio: form.periodoInicio || null,
        dataFim: form.periodoFim || null,
      },
    };

    const res = await fetch("/api/vagas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao publicar vaga.");
      return;
    }

    router.push("/vagas");
  }

  const mostrarPeriodo = form.tipo === "temporario" || form.tipo === "sazonal";

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-8">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3">
          <Link href="/painel" className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Briefcase className="h-5 w-5 text-white/80" />
          <span className="font-semibold text-white">Publicar Nova Vaga</span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da vaga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes da vaga</CardTitle>
              <CardDescription>Descreva a oportunidade com clareza para atrair os melhores candidatos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {erro && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</div>
              )}
              <div className="space-y-1">
                <Label htmlFor="titulo">Título da vaga *</Label>
                <Input id="titulo" name="titulo" value={form.titulo} onChange={handleChange}
                  placeholder="Ex: Garçom para restaurante italiano" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Tipo de contrato *</Label>
                  <Select value={form.tipo} onValueChange={(v) => handleSelect("tipo", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT — Carteira assinada</SelectItem>
                      <SelectItem value="temporario">Temporário / Bico</SelectItem>
                      <SelectItem value="sazonal">Sazonal — Temporada / Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Especialidade *</Label>
                  <EspecialidadeSelect
                    value={form.especialidade}
                    onChange={(v) => handleSelect("especialidade", v)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao">Descrição da vaga *</Label>
                <Textarea id="descricao" name="descricao" value={form.descricao} onChange={handleChange}
                  placeholder="Descreva as responsabilidades, horários, ambiente de trabalho..." rows={5} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="requisitos">Requisitos</Label>
                <Textarea id="requisitos" name="requisitos" value={form.requisitos} onChange={handleChange}
                  placeholder="Experiência mínima, habilidades necessárias, diferenciais..." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Período (temporário/sazonal) */}
          {mostrarPeriodo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Período de trabalho</CardTitle>
                <CardDescription>Informe as datas do contrato temporário ou sazonal.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="periodoInicio">Data de início</Label>
                  <Input type="date" id="periodoInicio" name="periodoInicio"
                    value={form.periodoInicio} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="periodoFim">Data de término</Label>
                  <Input type="date" id="periodoFim" name="periodoFim"
                    value={form.periodoFim} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remuneração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Remuneração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Tipo de salário</Label>
                <Select value={form.salarioTipo} onValueChange={(v) => handleSelect("salarioTipo", v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_combinar">A combinar</SelectItem>
                    <SelectItem value="fixo">Valor fixo</SelectItem>
                    <SelectItem value="faixa">Faixa salarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.salarioTipo !== "a_combinar" && (
                <div className="grid grid-cols-3 gap-4">
                  {form.salarioTipo === "faixa" && (
                    <div className="space-y-1">
                      <Label htmlFor="salarioMin">Mínimo (R$)</Label>
                      <Input id="salarioMin" name="salarioMin" type="number"
                        value={form.salarioMin} onChange={handleChange} placeholder="0,00" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="salarioMax">{form.salarioTipo === "faixa" ? "Máximo (R$)" : "Valor (R$)"}</Label>
                    <Input id="salarioMax" name="salarioMax" type="number"
                      value={form.salarioMax} onChange={handleChange} placeholder="0,00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Por</Label>
                    <Select value={form.salarioPeriodo} onValueChange={(v) => handleSelect("salarioPeriodo", v ?? "")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hora">Hora</SelectItem>
                        <SelectItem value="dia">Dia</SelectItem>
                        <SelectItem value="mes">Mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader><CardTitle className="text-base">Localização</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input id="cidade" name="cidade" value={form.cidade} onChange={handleChange}
                    placeholder="São Paulo" required />
                </div>
                <div className="space-y-1">
                  <Label>Estado *</Label>
                  <Select value={form.estado} onValueChange={(v) => handleSelect("estado", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.remoto}
                  onChange={(e) => setForm((p) => ({ ...p, remoto: e.target.checked }))}
                  className="h-4 w-4 rounded border-input" />
                <span className="text-sm">Aceita trabalho remoto / à distância</span>
              </label>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={salvando}>
            {salvando ? "Publicando..." : "Publicar Vaga"}
          </Button>
        </form>
      </main>
    </div>
  );
}
