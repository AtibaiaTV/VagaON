import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft, Briefcase, Building2, Clock, ExternalLink, History, MapPin, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { labelEspecialidade } from "@/constants/especialidades";
import { AFIRMATIVAS, ESCALAS, TURNOS } from "@/constants/match";
import { LABEL_STATUS_VAGA, type StatusVaga } from "@/lib/vagas-estado";
import { COR_STATUS_VAGA } from "@/lib/vagas-estado";
import { historicoDaVaga } from "@/lib/servicos/historico-vaga";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Match from "@/models/Match";
import Vaga from "@/models/Vaga";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TIPO_LABEL: Record<string, string> = { clt: "CLT", temporario: "Temporário", sazonal: "Sazonal" };
const AUTOR_LABEL: Record<string, string> = {
  empresa: "Empresa",
  admin: "Admin",
  sistema: "Sistema",
  redesa: "RedeSA",
  profissional: "Profissional",
};
const ACAO_COR: Record<string, string> = {
  criada: "bg-green-100 text-green-700",
  editada: "bg-blue-100 text-blue-700",
  status: "bg-amber-100 text-amber-800",
  moderacao: "bg-purple-100 text-purple-700",
  validade: "bg-gray-100 text-gray-600",
  expirada: "bg-red-100 text-red-700",
  aviso: "bg-gray-100 text-gray-600",
  excluida: "bg-red-100 text-red-700",
};

function dataHora(d: unknown): string {
  if (!d) return "—";
  return new Date(d as string).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function data(d: unknown): string {
  if (!d) return "—";
  return new Date(d as string).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function salario(s: any): string {
  if (!s || s.tipo === "a_combinar") return "A combinar";
  const p: Record<string, string> = { hora: "/hora", dia: "/dia", mes: "/mês" };
  const fmt = (n: number) => `R$ ${Number(n).toLocaleString("pt-BR")}`;
  if (s.tipo === "faixa" && s.min && s.max) return `${fmt(s.min)} a ${fmt(s.max)}${p[s.periodo] ?? ""}`;
  return `${fmt(s.max ?? s.min ?? 0)}${p[s.periodo] ?? ""}`;
}

function rotulo(lista: readonly { readonly value: string; readonly label: string }[], v: unknown): string {
  if (!v) return "—";
  return lista.find((x) => x.value === v)?.label ?? String(v);
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function Lista({ itens }: { itens: unknown }) {
  const arr = Array.isArray(itens) ? itens.filter(Boolean) : [];
  if (!arr.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {arr.map((i, k) => (
        <Badge key={k} variant="secondary" className="font-normal">{String(i)}</Badge>
      ))}
    </span>
  );
}

/**
 * Ficha completa da vaga para o admin: todos os campos, métricas, datas e o
 * histórico de quem mexeu (o equivalente do currículo detalhado do
 * profissional).
 */
export default async function AdminVagaPage({ params }: { params: { id: string } }) {
  if (!isValidObjectId(params.id)) notFound();
  await connectDB();
  const vaga: any = await Vaga.findById(params.id).lean();
  if (!vaga) notFound();

  const [empresa, candidaturas, matches, historico] = await Promise.all([
    Empresa.findById(vaga.empresaId).select("nomeFantasia slug cidade estado email telefone").lean(),
    Candidatura.countDocuments({ vagaId: vaga._id }),
    Match.countDocuments({ vagaId: vaga._id }),
    historicoDaVaga(vaga._id),
  ]);

  const status = vaga.status as StatusVaga;

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/vagas" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Vagas
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {vaga.titulo}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${COR_STATUS_VAGA[status] ?? "bg-gray-100"}`}>
              {LABEL_STATUS_VAGA[status] ?? status}
            </span>
            <span>{labelEspecialidade(vaga.especialidade)}</span>
            <span>{TIPO_LABEL[vaga.tipo] ?? vaga.tipo}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vaga.remoto ? "Remoto" : `${vaga.cidade}/${vaga.estado}`}</span>
          </p>
        </div>
        <Link href={`/vagas/${String(vaga._id)}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          Ver página pública <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Criada</p><p className="font-semibold">{dataHora(vaga.createdAt)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Última alteração</p><p className="font-semibold">{dataHora(vaga.updatedAt)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Válida até</p><p className="font-semibold">{data(vaga.expiresAt)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Candidaturas · matches</p><p className="font-semibold">{candidaturas} · {matches}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />Empresa</CardTitle></CardHeader>
          <CardContent>
            {empresa ? (
              <>
                <Linha rotulo="Nome">
                  <Link href={`/empresas/${empresa.slug ?? String(empresa._id)}`} className="text-primary hover:underline">{empresa.nomeFantasia}</Link>
                </Linha>
                <Linha rotulo="Cidade">{[empresa.cidade, empresa.estado].filter(Boolean).join("/") || "—"}</Linha>
                <Linha rotulo="E-mail">{empresa.email || "—"}</Linha>
                <Linha rotulo="Telefone">{empresa.telefone || "—"}</Linha>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Empresa não encontrada (id {String(vaga.empresaId)}).</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Ciclo de vida</CardTitle></CardHeader>
          <CardContent>
            <Linha rotulo="Status">{LABEL_STATUS_VAGA[status] ?? status}{vaga.motivoRejeicao ? ` · ${vaga.motivoRejeicao}` : ""}</Linha>
            <Linha rotulo="Aprovada pelo admin">{vaga.aprovadaPorAdmin ? "sim" : "não"}</Linha>
            <Linha rotulo="No Descobrir">{vaga.match?.ativo === false ? "não" : "sim"}</Linha>
            <Linha rotulo="Validade">{data(vaga.expiresAt)}{vaga.expiraAvisoEm ? ` · aviso enviado em ${data(vaga.expiraAvisoEm)}` : ""}</Linha>
            <Linha rotulo="Encerrada em">{data(vaga.encerradaEm)}</Linha>
            <Linha rotulo="Posições">{vaga.preenchidas ?? 0} preenchida(s) de {vaga.posicoes ?? 1}</Linha>
            <Linha rotulo="Alerta de vaga nova">{vaga.alertaVagaNovaEm ? `enviado em ${dataHora(vaga.alertaVagaNovaEm)}` : "não enviado"}</Linha>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Anúncio</CardTitle></CardHeader>
        <CardContent>
          <Linha rotulo="Título">{vaga.titulo}</Linha>
          <Linha rotulo="Função">{labelEspecialidade(vaga.especialidade)} <span className="text-muted-foreground text-xs">({vaga.especialidade})</span>{vaga.especialidadeOriginal ? <span className="text-muted-foreground text-xs"> · importada como &quot;{vaga.especialidadeOriginal}&quot;</span> : null}</Linha>
          <Linha rotulo="Funções aceitas"><Lista itens={(vaga.especialidadesAceitas ?? []).map(labelEspecialidade)} /></Linha>
          <Linha rotulo="Tipo">{TIPO_LABEL[vaga.tipo] ?? vaga.tipo}</Linha>
          <Linha rotulo="Salário">{salario(vaga.salario)}</Linha>
          <Linha rotulo="Período">{vaga.periodo?.dataInicio || vaga.periodo?.dataFim ? `${data(vaga.periodo?.dataInicio)} a ${data(vaga.periodo?.dataFim)}` : "—"}</Linha>
          <Linha rotulo="Local">{vaga.remoto ? "Remoto" : `${vaga.cidade}/${vaga.estado}`}{vaga.raioKm ? ` · raio ${vaga.raioKm} km` : ""}{vaga.localizacao?.coordinates ? "" : " · sem coordenadas"}</Linha>
          <Linha rotulo="Descrição"><span className="whitespace-pre-line">{vaga.descricao || "—"}</span></Linha>
          <Linha rotulo="Requisitos"><span className="whitespace-pre-line">{vaga.requisitos || "—"}</span></Linha>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Candidato ideal (sinais do match)</CardTitle></CardHeader>
        <CardContent>
          <Linha rotulo="Experiência mínima">{vaga.anosExperienciaMin ? `${vaga.anosExperienciaMin} ano(s)` : "—"}</Linha>
          <Linha rotulo="Habilidades"><Lista itens={vaga.habilidadesDesejadas} /></Linha>
          <Linha rotulo="Turno">{rotulo(TURNOS, vaga.turno)}</Linha>
          <Linha rotulo="Escala">{rotulo(ESCALAS, vaga.escala)}</Linha>
          <Linha rotulo="Idiomas"><Lista itens={vaga.idiomasDesejados} /></Linha>
          <Linha rotulo="Afirmativa"><Lista itens={(vaga.afirmativa ?? []).map((a: string) => rotulo(AFIRMATIVAS, a))} /></Linha>
          <Linha rotulo="Perguntas de triagem">
            {(vaga.perguntasTriagem ?? []).length ? (
              <ol className="list-decimal pl-5 space-y-0.5">{vaga.perguntasTriagem.map((p: string, i: number) => <li key={i}>{p}</li>)}</ol>
            ) : "—"}
          </Linha>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Métricas</CardTitle></CardHeader>
        <CardContent>
          <Linha rotulo="Visualizações">{vaga.visualizacoes ?? 0}{vaga.ultimaVisualizacaoEm ? ` · última em ${dataHora(vaga.ultimaVisualizacaoEm)}` : ""}</Linha>
          <Linha rotulo="Candidaturas">{candidaturas}</Linha>
          <Linha rotulo="Curtidas recebidas">{vaga.match?.totalLikesRecebidos ?? 0}</Linha>
          <Linha rotulo="Matches">{matches}</Linha>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4 text-primary" />Histórico</CardTitle>
          <p className="text-xs text-muted-foreground">Quem fez o quê e quando (horário de Brasília). Registrado a partir de 18/09/2026; antes disso só a data de criação.</p>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {historico.map((h: any) => (
              <li key={String(h._id)} className="py-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{dataHora(h.em)}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ACAO_COR[h.acao] ?? "bg-gray-100 text-gray-600"}`}>{h.acao}</span>
                  <span className="font-medium">{h.por?.nome || AUTOR_LABEL[h.por?.tipo] || "—"}</span>
                  <span className="text-xs text-muted-foreground">({AUTOR_LABEL[h.por?.tipo] ?? h.por?.tipo})</span>
                  {h.detalhes && <span className="text-muted-foreground">· {h.detalhes}</span>}
                </div>
                {h.mudancas?.length > 0 && (
                  <ul className="mt-1 ml-32 text-xs text-muted-foreground space-y-0.5">
                    {h.mudancas.map((m: any, i: number) => (
                      <li key={i}><span className="font-medium text-foreground/80">{m.campo}:</span> {m.de} → {m.para}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="py-2.5 text-sm flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 shrink-0">{dataHora(vaga.createdAt)}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">criada</span>
              <span className="text-muted-foreground">registro da própria vaga</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
