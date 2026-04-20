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
import EspecialidadesMultiSelect from "@/components/shared/EspecialidadesMultiSelect";
import { ESTADOS } from "@/constants/estados";
import { ChefHat, ArrowLeft, ArrowRight, CheckCircle, Plus, Trash2 } from "lucide-react";

interface Experiencia {
  _id?: string;
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
}

interface Props {
  profileId: string;
  dados: Record<string, unknown> | null;
}

const ETAPAS = ["Dados pessoais", "Especialidades", "Experiências", "Disponibilidade"];

export default function FormProfissional({ profileId, dados }: Props) {
  const router = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const disponibilidadeDados = dados?.disponibilidade as Record<string, unknown> | undefined;

  const [pessoal, setPessoal] = useState({
    nomeCompleto: (dados?.nomeCompleto as string) ?? "",
    telefone: (dados?.telefone as string) ?? "",
    cidade: (dados?.cidade as string) ?? "",
    estado: (dados?.estado as string) ?? "",
    cep: (dados?.cep as string) ?? "",
    dispostoViajar: (dados?.dispostoViajar as boolean) ?? false,
    resumoProfissional: (dados?.resumoProfissional as string) ?? "",
  });

  const [especialidades, setEspecialidades] = useState<string[]>(
    (dados?.especialidades as string[]) ?? []
  );
  const [habilidades, setHabilidades] = useState<string>(
    ((dados?.habilidades as string[]) ?? []).join(", ")
  );

  const [experiencias, setExperiencias] = useState<Experiencia[]>(
    (dados?.experiencias as Experiencia[]) ?? []
  );

  const [disponibilidade, setDisponibilidade] = useState({
    tipo: (disponibilidadeDados?.tipo as string[]) ?? [],
    imediata: (disponibilidadeDados?.imediata as boolean) ?? true,
    dataDisponivel: (disponibilidadeDados?.dataDisponivel as string) ?? "",
  });

  function toggleDisponibilidade(tipo: string) {
    setDisponibilidade((prev) => ({
      ...prev,
      tipo: prev.tipo.includes(tipo)
        ? prev.tipo.filter((t) => t !== tipo)
        : [...prev.tipo, tipo],
    }));
  }

  function adicionarExperiencia() {
    setExperiencias((prev) => [
      ...prev,
      { cargo: "", empresa: "", cidade: "", estado: "", dataInicio: "", dataFim: "", descricao: "" },
    ]);
  }

  function removerExperiencia(index: number) {
    setExperiencias((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarExperiencia(index: number, campo: string, valor: string) {
    setExperiencias((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [campo]: valor } : exp))
    );
  }

  async function handleSalvar() {
    setErro("");
    setSalvando(true);

    const payload = {
      ...pessoal,
      especialidades,
      habilidades: habilidades.split(",").map((h) => h.trim()).filter(Boolean),
      experiencias,
      disponibilidade: {
        ...disponibilidade,
        dataDisponivel: disponibilidade.imediata ? null : disponibilidade.dataDisponivel,
      },
    };

    const res = await fetch(`/api/profissionais/${profileId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao salvar.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/painel"), 1500);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/painel" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            <span className="font-semibold">Meu Perfil Profissional</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {sucesso && (
          <div className="mb-6 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>Perfil salvo com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Indicador de etapas */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {ETAPAS.map((nome, i) => (
              <button
                key={i}
                onClick={() => setEtapa(i)}
                className={`flex-1 text-center text-xs font-medium pb-2 border-b-2 transition-colors ${
                  i === etapa
                    ? "border-primary text-primary"
                    : i < etapa
                    ? "border-primary/40 text-muted-foreground"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1 ${
                  i < etapa ? "bg-primary/20 text-primary" : i === etapa ? "bg-primary text-white" : "bg-muted"
                }`}>{i + 1}</span>
                <span className="hidden sm:inline">{nome}</span>
              </button>
            ))}
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </div>
        )}

        {/* Etapa 1: Dados pessoais */}
        {etapa === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados pessoais</CardTitle>
              <CardDescription>Informações básicas do seu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="nomeCompleto">Nome completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={pessoal.nomeCompleto}
                  onChange={(e) => setPessoal((p) => ({ ...p, nomeCompleto: e.target.value }))}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input
                  id="telefone"
                  value={pessoal.telefone}
                  onChange={(e) => setPessoal((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={pessoal.cidade}
                    onChange={(e) => setPessoal((p) => ({ ...p, cidade: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Select
                    value={pessoal.estado}
                    onValueChange={(v) => setPessoal((p) => ({ ...p, estado: v ?? "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="resumoProfissional">Resumo profissional</Label>
                <Textarea
                  id="resumoProfissional"
                  value={pessoal.resumoProfissional}
                  onChange={(e) => setPessoal((p) => ({ ...p, resumoProfissional: e.target.value }))}
                  placeholder="Fale um pouco sobre sua experiência e objetivos profissionais..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {pessoal.resumoProfissional.length}/500
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dispostoViajar"
                  checked={pessoal.dispostoViajar}
                  onChange={(e) => setPessoal((p) => ({ ...p, dispostoViajar: e.target.checked }))}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="dispostoViajar" className="font-normal cursor-pointer">
                  Estou disposto(a) a viajar / trabalhar em outra cidade
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Especialidades */}
        {etapa === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Especialidades</CardTitle>
              <CardDescription>Selecione todas as funções que você desempenha.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EspecialidadesMultiSelect
                selecionadas={especialidades}
                onChange={setEspecialidades}
              />
              <div className="space-y-1">
                <Label htmlFor="habilidades">Habilidades extras (separadas por vírgula)</Label>
                <Input
                  id="habilidades"
                  value={habilidades}
                  onChange={(e) => setHabilidades(e.target.value)}
                  placeholder="Ex: sushi, vinho, coquetelaria molecular"
                />
                <p className="text-xs text-muted-foreground">
                  Tags livres para diferenciar seu perfil nas buscas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Experiências */}
        {etapa === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experiências profissionais</CardTitle>
                <CardDescription>Adicione seus empregos anteriores e atuais.</CardDescription>
              </CardHeader>
              <CardContent>
                {experiencias.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma experiência adicionada ainda.
                  </p>
                )}
                <div className="space-y-6">
                  {experiencias.map((exp, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removerExperiencia(i)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Cargo *</Label>
                          <Input
                            value={exp.cargo}
                            onChange={(e) => atualizarExperiencia(i, "cargo", e.target.value)}
                            placeholder="Ex: Garçom"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Empresa *</Label>
                          <Input
                            value={exp.empresa}
                            onChange={(e) => atualizarExperiencia(i, "empresa", e.target.value)}
                            placeholder="Nome do estabelecimento"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Cidade</Label>
                          <Input
                            value={exp.cidade}
                            onChange={(e) => atualizarExperiencia(i, "cidade", e.target.value)}
                            placeholder="Cidade"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Estado</Label>
                          <Select
                            value={exp.estado}
                            onValueChange={(v) => atualizarExperiencia(i, "estado", v ?? "")}
                          >
                            <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                            <SelectContent>
                              {ESTADOS.map((e) => (
                                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Data início</Label>
                          <Input
                            type="month"
                            value={exp.dataInicio}
                            onChange={(e) => atualizarExperiencia(i, "dataInicio", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Data fim</Label>
                          <Input
                            type="month"
                            value={exp.dataFim}
                            onChange={(e) => atualizarExperiencia(i, "dataFim", e.target.value)}
                            placeholder="Em branco = atual"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Descrição</Label>
                        <Textarea
                          value={exp.descricao}
                          onChange={(e) => atualizarExperiencia(i, "descricao", e.target.value)}
                          placeholder="Descreva suas responsabilidades..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={adicionarExperiencia}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar experiência
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa 4: Disponibilidade */}
        {etapa === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Disponibilidade</CardTitle>
              <CardDescription>
                Informe que tipo de trabalho você está buscando.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de contrato desejado</Label>
                <div className="space-y-2">
                  {[
                    { value: "clt", label: "CLT — Emprego fixo com carteira assinada" },
                    { value: "temporario", label: "Temporário — Bicos e diárias avulsas" },
                    { value: "sazonal", label: "Sazonal — Feriados, temporadas e eventos" },
                  ].map((tipo) => (
                    <label key={tipo.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disponibilidade.tipo.includes(tipo.value)}
                        onChange={() => toggleDisponibilidade(tipo.value)}
                        className="mt-0.5 h-4 w-4 rounded border-input"
                      />
                      <div>
                        <p className="text-sm font-medium">{tipo.label.split("—")[0]}</p>
                        <p className="text-xs text-muted-foreground">{tipo.label.split("—")[1]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quando você está disponível?</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={disponibilidade.imediata}
                      onChange={() => setDisponibilidade((d) => ({ ...d, imediata: true }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Disponível imediatamente</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!disponibilidade.imediata}
                      onChange={() => setDisponibilidade((d) => ({ ...d, imediata: false }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">A partir de uma data específica</span>
                  </label>
                </div>
                {!disponibilidade.imediata && (
                  <Input
                    type="date"
                    value={disponibilidade.dataDisponivel}
                    onChange={(e) =>
                      setDisponibilidade((d) => ({ ...d, dataDisponivel: e.target.value }))
                    }
                    className="mt-2 max-w-xs"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navegação entre etapas */}
        <div className="mt-6 flex gap-3">
          {etapa > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtapa((e) => e - 1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
          {etapa < ETAPAS.length - 1 ? (
            <Button
              type="button"
              onClick={() => setEtapa((e) => e + 1)}
              className="flex-1"
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSalvar}
              className="flex-1"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar perfil"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
