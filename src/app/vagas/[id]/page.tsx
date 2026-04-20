import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";
import Profissional from "@/models/Profissional";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Building2, ArrowLeft, Calendar, Users, Briefcase, Clock, CheckCircle } from "lucide-react";
import BotaoCandidatar from "./BotaoCandidatar";
import ListaCandidatos from "./ListaCandidatos";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

interface EmpresaPopulada {
  _id: string; nomeFantasia: string; cidade: string;
  estado: string; setor: string; descricao: string; anoFundacao?: number;
}

export default async function DetalheVagaPage({ params }: { params: { id: string } }) {
  const session = await auth();
  await connectDB();

  const vaga = await Vaga.findById(params.id)
    .populate("empresaId", "nomeFantasia cidade estado setor descricao anoFundacao")
    .lean() as any;

  if (!vaga) notFound();

  let jaCandidatou = false;
  let profissionalId: string | null = null;

  if (session?.user.role === "profissional") {
    const prof = await Profissional.findOne({ userId: session.user.id }).select("_id");
    if (prof) {
      profissionalId = prof._id.toString();
      const candidatura = await Candidatura.findOne({ vagaId: params.id, profissionalId: prof._id });
      jaCandidatou = !!candidatura;
    }
  }

  let isDonoEmpresa = false;
  let candidatos: unknown[] = [];

  if (session?.user.role === "empresa") {
    const empresa = vaga.empresaId as EmpresaPopulada;
    if (session.user.profileId === empresa._id.toString()) {
      isDonoEmpresa = true;
      candidatos = await Candidatura.find({ vagaId: params.id }).sort({ createdAt: -1 }).lean();
    }
  }

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

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

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
          <div style={{ backgroundColor: "#1a5c38" }} className="relative px-8 py-8">
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
                </div>
              </div>

              {/* Salário */}
              <div className="sm:text-right shrink-0">
                <p className="text-2xl font-bold text-white">{formatarSalario()}</p>
                <p className="text-white/60 text-xs mt-1 flex items-center gap-1 sm:justify-end">
                  <Users className="h-3 w-3" />{vagaObj.totalCandidaturas} candidatura(s)
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="h-3.5 w-3.5" />{TIPO_LABEL[vagaObj.tipo]}
              </span>
              {vagaObj.remoto && (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                  Remoto
                </span>
              )}
            </div>
          </div>

          {/* Ação — candidatar */}
          <div className="px-8 py-5 border-b bg-[#f9fdf9]">
            {session?.user.role === "profissional" && (
              <BotaoCandidatar vagaId={params.id} jaCandidatou={jaCandidatou} vagaAtiva={vagaObj.status === "ativa"} />
            )}
            {!session && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-muted-foreground">Faça login para se candidatar a esta vaga.</p>
                <div className="flex gap-2">
                  <Link href="/entrar">
                    <button className="text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg transition-colors">
                      Entrar
                    </button>
                  </Link>
                  <Link href="/cadastro">
                    <button className="text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 px-5 py-2 rounded-lg transition-colors">
                      Cadastrar
                    </button>
                  </Link>
                </div>
              </div>
            )}
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
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-sm">{empresa.nomeFantasia}</p>
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
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{empresa.descricao}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lista de candidatos (empresa dona) */}
        {isDonoEmpresa && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <ListaCandidatos
              candidatos={JSON.parse(JSON.stringify(candidatos))}
              vagaId={params.id}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
