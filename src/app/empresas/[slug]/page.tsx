import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { BadgeCheck, Briefcase, Building2, Flame, Globe, MapPin, Pencil, Share2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { jsonLd, montarOrganization } from "@/lib/seo";
import { SETORES } from "@/constants/setores";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VagaCard from "@/components/shared/VagaCard";
import ReputacaoBadge from "@/components/avaliacoes/ReputacaoBadge";
import { resumoReputacaoPublico } from "@/lib/reputacao";
import { Button } from "@/components/ui/button";
import Empresa from "@/models/Empresa";
import { papelNaEmpresa } from "@/lib/servicos/equipe";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

/**
 * Página pública da empresa — o link que o restaurante posta no Instagram.
 * Resolve por slug; por _id (links antigos) redireciona para o slug quando existe.
 */
async function carregarEmpresa(param: string) {
  await connectDB();
  if (isValidObjectId(param)) {
    const porId = await Empresa.findById(param).lean();
    if (porId?.slug && porId.slug !== param) redirect(`/empresas/${porId.slug}`);
    return porId;
  }
  return Empresa.findOne({ slug: param }).lean();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const empresa = await carregarEmpresa(params.slug);
  if (!empresa) return { title: "Empresa não encontrada — VagaON" };

  const local = [empresa.cidade, empresa.estado].filter(Boolean).join(", ");
  const description =
    empresa.descricao?.slice(0, 155) ||
    `Vagas em ${empresa.nomeFantasia}${local ? ` (${local})` : ""} para gastronomia, hotelaria e eventos. Candidate-se pelo VagaON.`;

  return {
    title: `Vagas na ${empresa.nomeFantasia} — VagaON`,
    description,
    openGraph: {
      title: `Vagas na ${empresa.nomeFantasia}`,
      description,
      type: "profile",
      ...(empresa.logo ? { images: [{ url: empresa.logo }] } : {}),
    },
  };
}

export default async function EmpresaPublicaPage({ params }: { params: { slug: string } }) {
  const [empresa, session] = await Promise.all([carregarEmpresa(params.slug), auth()]);
  if (!empresa) notFound();

  const vagas = await Vaga.find({ empresaId: empresa._id, status: "ativa", aprovadaPorAdmin: true })
    .sort({ createdAt: -1 })
    .lean();

  const setor = SETORES.find((s) => s.value === empresa.setor)?.label ?? "Estabelecimento";
  const local = [empresa.cidade, empresa.estado].filter(Boolean).join(", ");
  const ehDona = session?.user.role === "empresa" && Boolean(papelNaEmpresa(empresa, session.user.id));
  const vagasCard = vagas.map((v) => ({
    _id: String(v._id),
    titulo: v.titulo,
    tipo: v.tipo,
    especialidade: v.especialidade,
    cidade: v.cidade,
    estado: v.estado,
    salario: v.salario,
    empresaId: { nomeFantasia: empresa.nomeFantasia },
  }));

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(montarOrganization(empresa)) }} />

      {/* Hero */}
      <div style={{ backgroundColor: "#143f28" }} className="relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 overflow-hidden flex items-center justify-center shrink-0">
            {empresa.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={empresa.logo} alt={empresa.nomeFantasia} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-10 w-10 text-white/80" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight flex items-center gap-2 flex-wrap">
              {empresa.nomeFantasia}
              {empresa.verificada && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#2DB87A]/25 text-[#4ade80] border border-[#4ade80]/40 rounded-full px-2 py-0.5">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                </span>
              )}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70 mt-1.5">
              <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{setor}</span>
              {local && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{local}</span>}
              {empresa.website && (
                <a href={empresa.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white">
                  <Globe className="h-4 w-4" />Site
                </a>
              )}
            </div>
            <div className="mt-2">
              <ReputacaoBadge rep={resumoReputacaoPublico(empresa.reputacao)} claro compacto />
            </div>
          </div>
          {ehDona && (
            <Link href="/perfil/editar" className="shrink-0">
              <Button size="sm" className="bg-white text-[#143f28] hover:bg-white/90 font-semibold gap-2">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {ehDona && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm flex items-start gap-2">
            <Share2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p>
              Esta é a sua página pública. Compartilhe o link nas redes e no WhatsApp: quem entrar vê suas vagas ativas e
              pode se candidatar ou dar match.
            </p>
          </div>
        )}

        {empresa.descricao && (
          <section className="bg-white rounded-2xl shadow-sm border border-border/40 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
              <span className="w-6 h-0.5 bg-primary inline-block" /> Sobre
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{empresa.descricao}</p>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {vagas.length === 0
                ? "Nenhuma vaga aberta no momento"
                : `${vagas.length} vaga${vagas.length > 1 ? "s" : ""} aberta${vagas.length > 1 ? "s" : ""}`}
            </h2>
            {session?.user.role === "profissional" && vagas.length > 0 && (
              <Link href="/descobrir">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Flame className="h-4 w-4 text-primary" /> Descobrir
                </Button>
              </Link>
            )}
          </div>

          {vagas.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {vagasCard.map((v) => (
                <VagaCard key={v._id} vaga={v} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Volte em breve — ou{" "}
              <Link href="/vagas" className="text-primary font-semibold underline">
                veja todas as vagas
              </Link>{" "}
              da plataforma.
            </p>
          )}
        </section>

        {!session && vagas.length > 0 && (
          <section className="rounded-2xl bg-[#1a5c38] text-white p-6 sm:p-8 text-center">
            <h3 className="text-xl font-bold">Quer trabalhar aqui?</h3>
            <p className="text-white/75 text-sm mt-1.5 max-w-md mx-auto">
              Crie seu perfil grátis, dê match com {empresa.nomeFantasia} e converse direto com quem contrata.
            </p>
            <Link href="/cadastro/profissional" className="inline-block mt-5">
              <Button size="lg" className="bg-[#2DB87A] hover:bg-[#25a06a] text-white font-bold">Criar meu perfil grátis</Button>
            </Link>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
