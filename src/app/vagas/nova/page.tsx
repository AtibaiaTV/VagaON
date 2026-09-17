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
import { AFIRMATIVAS, ESCALAS, TURNOS } from "@/constants/match";
import { ArrowLeft, Briefcase, Flame } from "lucide-react";
import EspecialidadeSelect from "@/components/shared/EspecialidadeSelect";
import EspecialidadesMultiSelect from "@/components/shared/EspecialidadesMultiSelect";

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
    // Perfil do candidato ideal — alimenta o motor de match
    anosExperienciaMin: "",
    habilidadesDesejadas: "",
    turno: "",
    escala: "",
    posicoes: "1",
  });
  const [especialidadesAceitas, setEspecialidadesAceitas] = useState<string[]>([]);
  const [afirmativa, setAfirmativa] = useState<string[]>([]);
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
      especialidadesAceitas: especialidadesAceitas.filter((e) => e !== form.especialidade),
      anosExperienciaMin: form.anosExperienciaMin ? parseInt(form.anosExperienciaMin) : 0,
      habilidadesDesejadas: form.habilidadesDesejadas.split(",").map((h) => h.trim()).filter(Boolean),
      turno: form.turno || null,
      escala: form.escala || null,
      posicoes: form.posicoes ? parseInt(form.posicoes) : 1,
      afirmativa,
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

          {/* Perfil do candidato ideal — o que o Descobrir usa para ranquear */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Candidato ideal</CardTitle>
              </div>
              <CardDescription>
                Quanto mais você preencher, melhor o ranking de candidatos no Descobrir. Tudo aqui é opcional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="anosExperienciaMin">Experiência mínima (anos)</Label>
                  <Input id="anosExperienciaMin" name="anosExperienciaMin" type="number" min={0} max={40}
                    value={form.anosExperienciaMin} onChange={handleChange} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="posicoes">Nº de posições</Label>
                  <Input id="posicoes" name="posicoes" type="number" min={1} max={100}
                    value={form.posicoes} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="habilidadesDesejadas">Habilidades desejadas (separadas por vírgula)</Label>
                <Input id="habilidadesDesejadas" name="habilidadesDesejadas" value={form.habilidadesDesejadas}
                  onChange={handleChange} placeholder="Ex: cozinha italiana, gestão de equipe, ficha técnica" />
                <p className="text-xs text-muted-foreground">
                  Diferente dos requisitos em texto, estas são comparadas uma a uma com o perfil do candidato.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Turno</Label>
                  <Select value={form.turno} onValueChange={(v) => handleSelect("turno", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      {TURNOS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Escala</Label>
                  <Select value={form.escala} onValueChange={(v) => handleSelect("escala", v ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      {ESCALAS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Vaga afirmativa (opcional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Marque se a vaga é preferencial ou exclusiva para algum grupo. Aparece como selo na vaga.
                </p>
                <div className="flex flex-wrap gap-2">
                  {AFIRMATIVAS.map((a) => {
                    const ativo = afirmativa.includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() =>
                          setAfirmativa((lista) => (ativo ? lista.filter((v) => v !== a.value) : [...lista, a.value]))
                        }
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          ativo ? "bg-[#1a5c38] text-white border-[#1a5c38]" : "bg-white border-border hover:border-primary/50"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Também aceita profissionais de</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Especialidades além da principal que servem para esta vaga (ex.: aceitar Cozinheiro de Linha para vaga de Chef de Partie).
                </p>
                <EspecialidadesMultiSelect selecionadas={especialidadesAceitas} onChange={setEspecialidadesAceitas} />
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
