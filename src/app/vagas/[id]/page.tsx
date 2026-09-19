import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { caminhoEmpresa, jsonLd, montarJobPosting } from "@/lib/seo";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";
import Profissional from "@/models/Profissional";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { labelAfirmativa } from "@/constants/match";
import { MapPin, Building2, ArrowLeft, Calendar, Users, Briefcase, Clock, CheckCircle, BadgeCheck, ExternalLink, Heart, HeartHandshake, RefreshCw, Eye, Navigation } from "lucide-react";
import { distanciaKm, paraCoords } from "@/lib/match/geo";
import { geocodificarCidade } from "@/constants/municipios";
import BotaoCandidatar from "./BotaoCandidatar";
import CandidaturaRapida from "./CandidaturaRapida";
import KanbanCandidatos from "@/components/candidaturas/KanbanCandidatos";
import { candidatosDaVaga, type CandidatoKanban } from "@/lib/servicos/candidaturas";
import { iaConfigurada } from "@/lib/ia/cliente";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import { AVISO_STATUS_VAGA, type StatusVaga } from "@/lib/vagas-estado";
import AcoesVaga from "@/components/vagas/AcoesVaga";
import Empresa from "@/models/Empresa";
import { papelNaEmpresa } from "@/lib/servicos/equipe";
import { contarInteressadosPorVaga } from "@/lib/servicos/interesse";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

interface EmpresaPopulada {
  _id: string; nomeFantasia: string; cidade: string;
  estado: string; setor: string; descricao: string; anoFundacao?: number;
  slug?: string | null; logo?: string | null; verificada?: boolean;
}

const CAMPOS_EMPRESA = "nomeFantasia cidade estado setor descricao anoFundacao slug logo verificada website";

// Título e descrição próprios: sem isso a vaga aparece no Google com o título genérico do site.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  await connectDB();
  const vaga = await Vaga.findById(params.id).select("titulo descricao cidade estado status").populate("empresaId", "nomeFantasia").lean() as any;
  if (!vaga) return { title: "Vaga não encontrada — VagaON" };

  const empresaNome = vaga.empresaId?.nomeFantasia ?? "";
  const description = `${vaga.titulo}${empresaNome ? ` na ${empresaNome}` : ""} — ${vaga.cidade}, ${vaga.estado}. ${String(vaga.descricao ?? "").replace(/\s+/g, " ").slice(0, 120)}`;

  return {
    title: `${vaga.titulo}${empresaNome ? ` — ${empresaNome}` : ""} | VagaON`,
    description,
    robots: vaga.status === "ativa" ? undefined : { index: false },
    openGraph: { title: vaga.titulo, description, type: "website" },
  };
}

export default async function DetalheVagaPage({ params }: { params: { id: string } }) {
  const session = await auth();
  await connectDB();

  const vaga = await Vaga.findById(params.id)
    .populate("empresaId", CAMPOS_EMPRESA)
    .lean() as any;

  if (!vaga) notFound();

  let jaCandidatou = false;
  let profissionalId: string | null = null;
  let distanciaDeMim: number | null = null;

  if (session?.user.role === "profissional") {
    const prof = await Profissional.findOne({ userId: session.user.id }).select("_id cidade estado localizacao");
    if (prof) {
      profissionalId = prof._id.toString();
      // "A X km de você": cidade do profissional → cidade da vaga.
      const deMim = paraCoords(prof.localizacao) ?? geocodificarCidade(prof.cidade, prof.estado);
      const daVaga = paraCoords(vaga.localizacao) ?? geocodificarCidade(vaga.cidade, vaga.estado);
      if (deMim && daVaga && !vaga.remoto) distanciaDeMim = distanciaKm(deMim, daVaga);
      const candidatura = await Candidatura.findOne({ vagaId: params.id, profissionalId: prof._id });
      jaCandidatou = !!candidatura;
    }
  }

  let isDonoEmpresa = false;
  let candidatos: CandidatoKanban[] = [];
  let modoCego = false;
  let triagemIA = false;

  if (session?.user.role === "empresa") {
    const empresaDaVaga = vaga.empresaId as EmpresaPopulada;
    // Dono ou gerente da empresa da vaga: decidido pelo banco, não pelo JWT.
    const dona = await Empresa.findById(empresaDaVaga._id).lean();
    if (dona && papelNaEmpresa(dona, session.user.id)) {
      isDonoEmpresa = true;
      modoCego = dona.match?.modoCego === true;
      candidatos = await candidatosDaVaga(dona, vaga);
      // Resumo por IA: precisa da chave e do plano (no-op com planos desligados).
      triagemIA = iaConfigurada() && acessoDaEmpresa(dona).limites.triagemIA;
    }
  }

  // Conta a visita de quem não é dono nem admin — alimenta "Visualizações" no
  // painel da empresa. (A rota GET /api/vagas/[id] também conta, mas a página
  // não passa por ela.)
  if (!isDonoEmpresa && session?.user.role !== "admin") {
    await Vaga.updateOne({ _id: vaga._id }, { $inc: { visualizacoes: 1 }, $set: { ultimaVisualizacaoEm: new Date() } });
  }

  // Quem pode ver o interesse na vaga: a empresa dona (e gerentes) e o admin.
  const veInteresse = isDonoEmpresa || session?.user.role === "admin";
  const interessados = veInteresse
    ? ((await contarInteressadosPorVaga([vaga._id]).catch(() => new Map())).get(String(vaga._id)) ?? 0)
    : null;

  const empresa = vaga.empresaId as EmpresaPopulada;
  const vagaObj = JSON.parse(JSON.stringify(vaga));

  function formatarSalario() {
    const s = vagaObj.salario;
    if (!s || s.tipo === "a_combinar") return "A combinar";
    const p: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
    if (s.tipo === "fixo") return `R$ ${s.max?.toLocaleString("pt-BR")}${p[s.periodo]}`;
    return `R$ ${s.min?.toLocaleString("pt-BR")} – ${s.max?.toLocaleString("pt-BR")}${p[s.periodo]}`;
  }

  const especialidadeLabel = ESPECIALIDADES.find((e) => e.value === vagaObj.especialidade)?.label ?? vagaObj.especialidade;
  const perguntasTriagem: string[] = Array.isArray(vagaObj.perguntasTriagem) ? vagaObj.perguntasTriagem : [];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Google for Jobs: só vaga ativa entra no índice. */}
      {vagaObj.status === "ativa" && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(montarJobPosting(vaga, empresa)) }} />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/vagas" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar às vagas
          </Link>
        </div>

        {/* Card principal — estilo currículo */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">

          {/* Header verde */}
          <div style={{ backgroundColor: "#1a5c38" }} className="relative overflow-hidden px-8 py-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            {/* Linha decorativa dourada */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Ícone da empresa */}
              <div className="w-20 h-20 rounded-xl bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0">
                <Building2 className="h-10 w-10 text-white/80" strokeWidth={1.5} />
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                  {vagaObj.titulo}
                </h1>
                <p className="text-white/80 text-lg font-medium mb-3">{empresa.nomeFantasia}</p>

                <div className="flex flex-wrap gap-3 text-sm text-white/70">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />{vagaObj.cidade}, {vagaObj.estado}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />{especialidadeLabel}
                  </span>
                  {(vagaObj.periodo?.dataInicio || vagaObj.periodo?.dataFim) && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {vagaObj.periodo.dataInicio && new Date(vagaObj.periodo.dataInicio).toLocaleDateString("pt-BR")}
                      {vagaObj.periodo.dataFim && ` até ${new Date(vagaObj.periodo.dataFim).toLocaleDateString("pt-BR")}`}
                    </span>
                  )}
                  {vagaObj.createdAt && (
                    <span className="flex items-center gap-1.5 text-white/60" title="Data em que a vaga foi cadastrada">
                      <Clock className="h-4 w-4" />
                      Publicada em {new Date(vagaObj.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {vagaObj.updatedAt && (
                    <span className="flex items-center gap-1.5 text-white/60" title="Última atualização da vaga">
                      <RefreshCw className="h-4 w-4" />
                      Atualizada em {new Date(vagaObj.updatedAt).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {(isDonoEmpresa || session?.user.role === "admin") && (
                    <span className="flex items-center gap-1.5 text-white/60" title="Última vez que um candidato abriu esta vaga">
                      <Eye className="h-4 w-4" />
                      {vagaObj.ultimaVisualizacaoEm
                        ? `Vista por último em ${new Date(vagaObj.ultimaVisualizacaoEm).toLocaleDateString("pt-BR")}`
                        : "Ainda não vista por candidatos"}
                    </span>
                  )}
                  {distanciaDeMim !== null && (
                    <span className="flex items-center gap-1.5 text-white font-medium" title="Distância entre a sua cidade e a da vaga">
                      <Navigation className="h-4 w-4" />
                      {distanciaDeMim === 0 ? "Na sua cidade" : `A ${distanciaDeMim} km de você`}
                    </span>
                  )}
                </div>
              </div>

              {/* Salário */}
              <div className="sm:text-right shrink-0">
                <p className="text-2xl font-bold text-white">{formatarSalario()}</p>
                <p className="text-white/60 text-xs mt-1 flex items-center gap-1 sm:justify-end">
                  <Users className="h-3 w-3" />{vagaObj.totalCandidaturas} candidatura(s)
                </p>
                {interessados !== null && (
                  <p className="text-white text-xs mt-1 flex items-center gap-1 sm:justify-end font-medium" title="Profissionais que curtiram no Descobrir ou se candidataram (cada pessoa conta uma vez)">
                    <Heart className="h-3 w-3" />{interessados} profissional(is) interessado(s)
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="h-3.5 w-3.5" />{TIPO_LABEL[vagaObj.tipo]}
              </span>
              {!vagaObj.remoto && vagaObj.raioKm && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20" title="Distância máxima que a empresa aceita para candidatos">
                  <Navigation className="h-3.5 w-3.5" />Candidatos até {vagaObj.raioKm} km
                </span>
              )}
              {vagaObj.remoto && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                  Remoto
                </span>
              )}
              {(vagaObj.afirmativa ?? []).map((a: string) => (
                <span key={a} className="inline-flex items-center gap-1.5 bg-violet-500/30 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-300/40">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Vaga afirmativa · {labelAfirmativa(a)}
                </span>
              ))}
            </div>
          </div>

          {/* Ação — candidatar (ou gerir, se for a empresa dona) */}
          <div className="px-8 py-5 border-b bg-[#f9fdf9]">
            {isDonoEmpresa && (
              <AcoesVaga
                vagaId={params.id}
                status={vagaObj.status as StatusVaga}
                preenchidas={vagaObj.preenchidas ?? 0}
                posicoes={vagaObj.posicoes ?? 1}
              />
            )}
            {session?.user.role === "profissional" && (
              <BotaoCandidatar
                vagaId={params.id}
                jaCandidatou={jaCandidatou}
                vagaAtiva={vagaObj.status === "ativa"}
                aviso={AVISO_STATUS_VAGA[vagaObj.status as StatusVaga]}
                perguntas={perguntasTriagem}
              />
            )}
            {!session &&
              (vagaObj.status === "ativa" ? (
                <CandidaturaRapida
                  vagaId={params.id}
                  vagaTitulo={vagaObj.titulo}
                  cidade={vagaObj.cidade}
                  estado={vagaObj.estado}
                  especialidade={vagaObj.especialidade}
                  perguntas={perguntasTriagem}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {AVISO_STATUS_VAGA[vagaObj.status as StatusVaga] ?? "Esta vaga não está mais disponível."}
                </p>
              ))}
          </div>

          {/* Corpo do card — 2 colunas */}
          <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/40">

            {/* Coluna principal */}
            <div className="md:col-span-2 p-8 space-y-8">

              {/* Descrição */}
              <section>
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                  <span className="w-6 h-0.5 bg-primary inline-block" />
                  Descrição da vaga
                </h2>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{vagaObj.descricao}</p>
              </section>

              {/* Requisitos */}
              {vagaObj.requisitos && (
                <section>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                    <span className="w-6 h-0.5 bg-primary inline-block" />
                    Requisitos
                  </h2>
                  <ul className="space-y-1.5">
                    {vagaObj.requisitos.split("\n").filter(Boolean).map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Coluna lateral — empresa */}
            <div className="p-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-primary inline-block" />
                Sobre a empresa
              </h2>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                  {empresa.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={empresa.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm flex items-center gap-1">
                    {empresa.nomeFantasia}
                    {empresa.verificada && <BadgeCheck className="h-4 w-4 text-primary" />}
                  </p>
                  {empresa.anoFundacao && (
                    <p className="text-xs text-muted-foreground">Início em {empresa.anoFundacao}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary/60 shrink-0" />
                  {empresa.cidade}, {empresa.estado}
                </p>
              </div>

              {empresa.descricao && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-6">{empresa.descricao}</p>
              )}

              <Link
                href={caminhoEmpresa(empresa)}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Ver perfil e outras vagas
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Funil de candidatos (empresa dona) */}
        {isDonoEmpresa && (
          <section className="bg-white rounded-2xl shadow-md p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-primary inline-block" />
              Candidatos
            </h2>
            {candidatos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum candidato ainda. Quem der match ou se candidatar pelo site aparece aqui —{" "}
                <Link href="/descobrir" className="text-primary font-semibold underline">
                  descubra candidatos
                </Link>
                .
              </p>
            ) : (
              <KanbanCandidatos candidatos={candidatos} modoCego={modoCego} iaDisponivel={triagemIA} />
            )}
            {isDonoEmpresa && perguntasTriagem.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Perguntas de triagem desta vaga: {perguntasTriagem.map((p, i) => `${i + 1}) ${p}`).join("  ")}
              </p>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
