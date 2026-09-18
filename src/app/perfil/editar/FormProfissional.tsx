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
import BrandBand from "@/components/shared/BrandBand";
import DefinirSenha from "@/components/perfil/DefinirSenha";
import ImportarCurriculo from "@/components/ia/ImportarCurriculo";
import VideoApresentacao, { type VideoPerfil } from "@/components/perfil/VideoApresentacao";
import { ESTADOS } from "@/constants/estados";
import { ESCALAS, NIVEIS_IDIOMA, RAIO_PADRAO_KM, TURNOS } from "@/constants/match";
import { AMPLITUDE_ESPECIALIDADES } from "@/lib/match/pesos";
import type { PerfilExtraido } from "@/lib/ia/curriculo";
import {
  descreverMesclagem,
  mesclarPerfilExtraido,
  type ExperienciaForm as Experiencia,
  type FormacaoForm,
  type IdiomaForm,
  type RelatorioMesclagem,
} from "@/lib/ia/mesclar-perfil";
import { ChefHat, ArrowLeft, ArrowRight, CheckCircle, Plus, Trash2, Camera, Upload, Loader2, X, User, Sparkles, Briefcase, CalendarClock, Flame, Languages, Undo2, AlertTriangle, GraduationCap, Printer } from "lucide-react";

interface Props {
  profileId: string;
  dados: Record<string, unknown> | null;
  /** ANTHROPIC_API_KEY configurada no servidor — mostra o painel "Preencher com IA". */
  iaDisponivel?: boolean;
  /** Veio do cadastro rápido (QR/link): conta recém-criada, perfil ainda vazio. */
  boasVindas?: boolean;
  /** false para conta que nasceu sem senha (hoje só o SSO da RedeSA faz isso). */
  temSenha?: boolean;
}

const ETAPAS = ["Dados pessoais", "Especialidades", "Experiências", "Disponibilidade"];

interface Importacao {
  relatorio: RelatorioMesclagem;
  observacoes: string[];
  confianca: PerfilExtraido["confianca"];
  /** Estado anterior, para "Desfazer". */
  anterior: {
    pessoal: Record<string, unknown>;
    especialidades: string[];
    habilidades: string;
    experiencias: Experiencia[];
    formacao: FormacaoForm[];
    idiomas: IdiomaForm[];
  };
}

export default function FormProfissional({ profileId, dados, iaDisponivel = false, boasVindas = false, temSenha = true }: Props) {
  const router = useRouter();
  const [etapa, setEtapa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [importacao, setImportacao] = useState<Importacao | null>(null);

  const disponibilidadeDados = dados?.disponibilidade as Record<string, unknown> | undefined;

  const [fotoPerfil, setFotoPerfil] = useState<string>((dados?.fotoPerfil as string) ?? "");
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [video, setVideo] = useState<VideoPerfil | null>((dados?.videoApresentacao as VideoPerfil | null) ?? null);

  const [pessoal, setPessoal] = useState({
    nomeCompleto: (dados?.nomeCompleto as string) ?? "",
    telefone: (dados?.telefone as string) ?? "",
    cidade: (dados?.cidade as string) ?? "",
    estado: (dados?.estado as string) ?? "",
    cep: (dados?.cep as string) ?? "",
    dispostoViajar: (dados?.dispostoViajar as boolean) ?? false,
    resumoProfissional: (dados?.resumoProfissional as string) ?? "",
    linkedinUrl: (dados?.linkedinUrl as string) ?? "",
    curriculoUrl: (dados?.curriculoUrl as string) ?? "",
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
  const [idiomas, setIdiomas] = useState<IdiomaForm[]>(
    ((dados?.idiomas as IdiomaForm[]) ?? []).map((i) => ({ idioma: i.idioma ?? "", nivel: i.nivel ?? "intermediario" }))
  );
  const [formacao, setFormacao] = useState<FormacaoForm[]>(
    ((dados?.formacao as FormacaoForm[]) ?? []).map((f) => ({ curso: f.curso ?? "", instituicao: f.instituicao ?? "", ano: f.ano ?? "" }))
  );

  function atualizarFormacao(index: number, campo: keyof FormacaoForm, valor: string) {
    setFormacao((prev) => prev.map((f, i) => (i === index ? { ...f, [campo]: valor } : f)));
  }

  /** Aplica a sugestão da IA sem sobrescrever o que já estava preenchido. */
  function aplicarPerfilExtraido(perfil: PerfilExtraido) {
    const anterior = { pessoal: { ...pessoal }, especialidades, habilidades, experiencias, formacao, idiomas };
    const { estado, relatorio } = mesclarPerfilExtraido(
      { pessoal, especialidades, habilidades, experiencias, formacao, idiomas },
      perfil
    );
    setPessoal(estado.pessoal);
    setEspecialidades(estado.especialidades);
    setHabilidades(estado.habilidades);
    setExperiencias(estado.experiencias);
    setFormacao(estado.formacao);
    setIdiomas(estado.idiomas);
    setImportacao({ relatorio, observacoes: perfil.observacoes, confianca: perfil.confianca, anterior });
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function desfazerImportacao() {
    if (!importacao) return;
    const a = importacao.anterior;
    setPessoal(a.pessoal as typeof pessoal);
    setEspecialidades(a.especialidades);
    setHabilidades(a.habilidades);
    setExperiencias(a.experiencias);
    setFormacao(a.formacao);
    setIdiomas(a.idiomas);
    setImportacao(null);
  }

  const [disponibilidade, setDisponibilidade] = useState({
    tipo: (disponibilidadeDados?.tipo as string[]) ?? [],
    imediata: (disponibilidadeDados?.imediata as boolean) ?? true,
    dataDisponivel: (disponibilidadeDados?.dataDisponivel as string) ?? "",
  });

  // Preferências que alimentam o motor de match (Descobrir).
  const pretensaoDados = dados?.pretensaoSalarial as Record<string, unknown> | undefined;
  const [preferencias, setPreferencias] = useState({
    raioKm: (dados?.raioKm as number) ?? RAIO_PADRAO_KM,
    pretensaoMin: pretensaoDados?.min ? String(pretensaoDados.min) : "",
    pretensaoPeriodo: (pretensaoDados?.periodo as string) ?? "mes",
    turnos: (dados?.turnos as string[]) ?? [],
    escalas: (dados?.escalas as string[]) ?? [],
  });

  function alternarLista(campo: "turnos" | "escalas", valor: string) {
    setPreferencias((p) => ({
      ...p,
      [campo]: p[campo].includes(valor) ? p[campo].filter((v) => v !== valor) : [...p[campo], valor],
    }));
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadandoFoto(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok && data.url) {
      setFotoPerfil(data.url);
    } else {
      setErro(data.error || "Erro ao enviar foto.");
    }
    setUploadandoFoto(false);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

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
      fotoPerfil,
      videoApresentacao: video,
      idiomas: idiomas.filter((i) => i.idioma.trim()).map((i) => ({ idioma: i.idioma.trim(), nivel: i.nivel })),
      especialidades,
      habilidades: habilidades.split(",").map((h) => h.trim()).filter(Boolean),
      experiencias,
      formacao: formacao
        .map((f) => ({ curso: f.curso.trim(), instituicao: f.instituicao.trim(), ano: f.ano.trim() }))
        .filter((f) => f.curso),
      disponibilidade: {
        ...disponibilidade,
        dataDisponivel: disponibilidade.imediata ? null : disponibilidade.dataDisponivel,
      },
      raioKm: preferencias.raioKm,
      pretensaoSalarial: {
        min: preferencias.pretensaoMin ? parseFloat(preferencias.pretensaoMin) : null,
        periodo: preferencias.pretensaoPeriodo,
      },
      turnos: preferencias.turnos,
      escalas: preferencias.escalas,
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
    <div className="min-h-screen bg-[#f4f7f5]">
      <BrandBand color="dark" className="py-8">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-3">
          <Link href="/painel" className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">Meu Perfil Profissional</span>
          </div>
        </div>
      </BrandBand>

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
                onClick={() => { setEtapa(i); setErro(""); }}
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
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28] transition-all duration-300"
              style={{ width: `${((etapa + 1) / ETAPAS.length) * 100}%` }}
            />
          </div>
        </div>

        {erro && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </div>
        )}

        {boasVindas && !importacao && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <p className="font-semibold">Cadastro criado! Agora deixe seu perfil completo — leva 2 minutos.</p>
            <p className="text-xs text-green-800/90 mt-1">
              {iaDisponivel
                ? "O caminho mais rápido: envie seu currículo em PDF ou foto logo abaixo e a IA preenche tudo para você revisar. Ou preencha etapa por etapa."
                : "Preencha as 4 etapas abaixo: dados, funções, experiências e disponibilidade. Perfil completo aparece primeiro para as empresas."}
            </p>
          </div>
        )}

        {importacao && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-green-700" />
                <span>
                  <span className="font-semibold">Currículo lido.</span> {descreverMesclagem(importacao.relatorio)}{" "}
                  Passe pelas {ETAPAS.length} etapas, confira tudo e salve.
                </span>
              </p>
              <button
                type="button"
                onClick={desfazerImportacao}
                className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 hover:text-green-950 shrink-0"
              >
                <Undo2 className="h-3.5 w-3.5" /> Desfazer
              </button>
            </div>
            {importacao.relatorio.mantidos.length > 0 && (
              <p className="text-xs text-green-800/80 pl-6">
                Mantivemos o que você já tinha em: {importacao.relatorio.mantidos.join(", ")}.
              </p>
            )}
            {(importacao.confianca === "baixa" || importacao.relatorio.experienciasSemData > 0 || importacao.observacoes.length > 0) && (
              <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 space-y-0.5 ml-6">
                {importacao.confianca === "baixa" && (
                  <li className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    O documento estava difícil de ler — confira cada campo com atenção.
                  </li>
                )}
                {importacao.relatorio.experienciasSemData > 0 && (
                  <li>
                    {importacao.relatorio.experienciasSemData} experiência(s) vieram sem data de início — complete na etapa 3.
                  </li>
                )}
                {importacao.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {etapa === 0 && iaDisponivel && (
          <div className="mb-4">
            <ImportarCurriculo aoExtrair={aplicarPerfilExtraido} recolhido={Boolean(dados?.resumoProfissional) && experiencias.length > 0} />
          </div>
        )}

        {/* Etapa 1: Dados pessoais */}
        {etapa === 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Dados pessoais</CardTitle>
              </div>
              <CardDescription>Informações básicas do seu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Foto de perfil */}
              <div className="flex items-center gap-4 bg-primary/5 rounded-xl p-4">
                <div className="shrink-0">
                  {fotoPerfil ? (
                    <img
                      src={fotoPerfil}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
                      {pessoal.nomeCompleto ? (
                        <span className="text-xl font-bold text-primary">
                          {pessoal.nomeCompleto.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")}
                        </span>
                      ) : (
                        <Camera className="h-7 w-7 text-primary/40" />
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground">JPG ou PNG · Máx. 5 MB · Quadrada ideal</p>
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md px-3 py-1.5 cursor-pointer hover:bg-primary/5 transition-colors">
                    {uploadandoFoto ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        {fotoPerfil ? "Trocar foto" : "Enviar foto"}
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFotoUpload}
                      disabled={uploadandoFoto}
                    />
                  </label>
                  {fotoPerfil && (
                    <button
                      type="button"
                      onClick={() => setFotoPerfil("")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              <VideoApresentacao video={video} onChange={setVideo} onErro={setErro} />

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
              <div className="space-y-1">
                <Label htmlFor="linkedinUrl">LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={pessoal.linkedinUrl}
                  onChange={(e) => setPessoal((p) => ({ ...p, linkedinUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/seuperfil"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="curriculoUrl">Currículo (link)</Label>
                <Input
                  id="curriculoUrl"
                  type="url"
                  value={pessoal.curriculoUrl}
                  onChange={(e) => setPessoal((p) => ({ ...p, curriculoUrl: e.target.value }))}
                  placeholder="https://drive.google.com/... ou similar"
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link público do seu currículo (Google Drive, Dropbox, etc.)
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Especialidades</CardTitle>
              </div>
              <CardDescription>
                Selecione as funções que você realmente desempenha. Até {AMPLITUDE_ESPECIALIDADES.limite} contam
                integralmente no Descobrir — acima disso, o cargo pesa menos no match.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EspecialidadesMultiSelect
                selecionadas={especialidades}
                onChange={setEspecialidades}
              />
              {especialidades.length > AMPLITUDE_ESPECIALIDADES.limite && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 -mt-2">
                  {especialidades.length} especialidades selecionadas. Focar nas principais melhora sua posição
                  no ranking das empresas.
                </p>
              )}
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
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Experiências profissionais</CardTitle>
                </div>
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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Formação e cursos</CardTitle>
                </div>
                <CardDescription>
                  Graduação, curso técnico ou cursos livres (ex.: manipulação de alimentos, coquetelaria). Aparecem no seu
                  currículo para impressão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formacao.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum curso adicionado ainda.</p>
                )}
                {formacao.map((f, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px_32px] gap-2 items-center border rounded-lg p-3 sm:border-0 sm:p-0">
                    <Input
                      value={f.curso}
                      onChange={(e) => atualizarFormacao(i, "curso", e.target.value)}
                      placeholder="Curso (ex.: Tecnólogo em Gastronomia)"
                      aria-label="Curso"
                    />
                    <Input
                      value={f.instituicao}
                      onChange={(e) => atualizarFormacao(i, "instituicao", e.target.value)}
                      placeholder="Instituição"
                      aria-label="Instituição"
                    />
                    <Input
                      value={f.ano}
                      onChange={(e) => atualizarFormacao(i, "ano", e.target.value)}
                      placeholder="Ano"
                      aria-label="Ano de conclusão"
                      maxLength={12}
                    />
                    <button
                      type="button"
                      onClick={() => setFormacao((l) => l.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive justify-self-end sm:justify-self-center"
                      aria-label="Remover curso"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setFormacao((l) => [...l, { curso: "", instituicao: "", ano: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar curso ou formação
                </Button>
                {dados && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    <Printer className="h-3.5 w-3.5" />
                    Depois de salvar, imprima seu currículo em{" "}
                    <Link href="/perfil/curriculo" className="text-primary font-semibold underline">
                      Meu currículo
                    </Link>
                    .
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Etapa 4: Disponibilidade */}
        {etapa === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Disponibilidade</CardTitle>
              </div>
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

              {/* Preferências do match */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-5">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Preferências para o Descobrir</p>
                </div>
                <p className="text-xs text-muted-foreground -mt-3">
                  Usamos isso para ranquear as vagas que aparecem para você. Nada aqui é obrigatório, mas quanto mais
                  preencher, melhores os matches.
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="raioKm">Distância máxima até o trabalho</Label>
                    <span className="text-sm font-semibold text-primary">{preferencias.raioKm} km</span>
                  </div>
                  <input
                    id="raioKm"
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={preferencias.raioKm}
                    onChange={(e) => setPreferencias((p) => ({ ...p, raioKm: Number(e.target.value) }))}
                    className="w-full accent-[#2DB87A]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {pessoal.dispostoViajar ? "Como você aceita viajar, consideramos até 3× esse raio." : "Marque \"disposto a viajar\" na primeira etapa para ampliar."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pretensaoMin">Pretensão salarial mínima</Label>
                  <div className="grid grid-cols-[1fr_140px] gap-2">
                    <Input
                      id="pretensaoMin"
                      type="number"
                      min={0}
                      value={preferencias.pretensaoMin}
                      onChange={(e) => setPreferencias((p) => ({ ...p, pretensaoMin: e.target.value }))}
                      placeholder="Ex: 3500"
                    />
                    <Select
                      value={preferencias.pretensaoPeriodo}
                      onValueChange={(v) => setPreferencias((p) => ({ ...p, pretensaoPeriodo: v ?? "mes" }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hora">por hora</SelectItem>
                        <SelectItem value="dia">por dia</SelectItem>
                        <SelectItem value="mes">por mês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Turnos que você aceita</Label>
                  <div className="flex flex-wrap gap-2">
                    {TURNOS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => alternarLista("turnos", t.value)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          preferencias.turnos.includes(t.value)
                            ? "bg-[#1a5c38] text-white border-[#1a5c38]"
                            : "bg-white border-border hover:border-primary/50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Escalas que você aceita</Label>
                  <div className="flex flex-wrap gap-2">
                    {ESCALAS.map((e) => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => alternarLista("escalas", e.value)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          preferencias.escalas.includes(e.value)
                            ? "bg-[#1a5c38] text-white border-[#1a5c38]"
                            : "bg-white border-border hover:border-primary/50"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-primary" /> Idiomas
                  </Label>
                  <p className="text-xs text-muted-foreground -mt-0.5">
                    Vagas em hotéis e eventos costumam pedir inglês ou espanhol — contam no match.
                  </p>
                  <div className="space-y-2">
                    {idiomas.map((i, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_150px_32px] gap-2 items-center">
                        <Input
                          value={i.idioma}
                          onChange={(e) => setIdiomas((l) => l.map((x, j) => (j === idx ? { ...x, idioma: e.target.value } : x)))}
                          placeholder="Ex: Inglês"
                          aria-label="Idioma"
                        />
                        <Select
                          value={i.nivel}
                          items={NIVEIS_IDIOMA}
                          onValueChange={(v) => setIdiomas((l) => l.map((x, j) => (j === idx ? { ...x, nivel: v ?? "intermediario" } : x)))}
                        >
                          <SelectTrigger aria-label="Nível"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {NIVEIS_IDIOMA.map((n) => (
                              <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => setIdiomas((l) => l.filter((_, j) => j !== idx))}
                          className="text-muted-foreground hover:text-destructive justify-self-center"
                          aria-label="Remover idioma"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIdiomas((l) => [...l, { idioma: "", nivel: "intermediario" }])}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar idioma
                    </Button>
                  </div>
                </div>
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
              onClick={() => { setEtapa((e) => e - 1); setErro(""); }}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
          {etapa < ETAPAS.length - 1 ? (
            <Button
              type="button"
              onClick={() => { setEtapa((e) => e + 1); setErro(""); }}
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

        {!boasVindas && (
          <div className="mt-8">
            <DefinirSenha temSenha={temSenha} />
          </div>
        )}
      </main>
    </div>
  );
}
