import Link from "next/link";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BrandBand from "@/components/shared/BrandBand";
import VagaCard, { type VagaCardData } from "@/components/shared/VagaCard";
import { Button } from "@/components/ui/button";
import { jsonLd } from "@/lib/seo";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";
import { cidadesComVagas, vagasDaCidade, type CidadeComVagas } from "@/lib/servicos/paginas-vagas";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  cidade: CidadeComVagas;
  /** Função filtrada (value da especialidade); ausente = todas as funções da cidade. */
  funcao?: { especialidade: string; slug: string; label: string } | null;
}

export function tituloPagina(c: CidadeComVagas, funcao?: Props["funcao"]): string {
  return funcao ? `Vagas de ${funcao.label} em ${c.cidade}, ${c.uf}` : `Vagas em ${c.cidade}, ${c.uf}`;
}

export function descricaoPagina(c: CidadeComVagas, funcao?: Props["funcao"], total?: number): string {
  const n = total ?? c.total;
  const oQue = funcao ? `de ${funcao.label}` : "em gastronomia, hotelaria e eventos";
  return `${n} vaga${n === 1 ? "" : "s"} ${oQue} em ${c.cidade}, ${c.uf}. CLT, temporário e sazonal. Cadastro gratuito, candidatura em 1 minuto.`;
}

/**
 * Página pública "vagas em <cidade>" / "vagas de <função> em <cidade>".
 * Server Component: lista, links cruzados e dados estruturados.
 */
export default async function PaginaVagasLocal({ cidade, funcao }: Props) {
  const [vagas, todas] = await Promise.all([vagasDaCidade(cidade, funcao?.especialidade), cidadesComVagas()]);
  const titulo = tituloPagina(cidade, funcao);
  const caminho = funcao ? `/vagas/em/${cidade.slug}/${funcao.slug}` : `/vagas/em/${cidade.slug}`;

  const cards: VagaCardData[] = vagas.map((v: any) => ({
    _id: String(v._id),
    titulo: v.titulo,
    tipo: v.tipo,
    especialidade: v.especialidade,
    cidade: v.cidade,
    estado: v.estado,
    salario: v.salario,
    empresaId: { nomeFantasia: v.empresaId?.nomeFantasia ?? "" },
  }));

  const outrasFuncoes = cidade.funcoes.filter((f) => f.especialidade !== funcao?.especialidade);
  const outrasCidades = todas.filter((c) => c.slug !== cidade.slug).slice(0, 12);

  const dados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Vagas", item: urlAbsoluta("/vagas") },
          { "@type": "ListItem", position: 2, name: `${cidade.cidade}, ${cidade.uf}`, item: urlAbsoluta(`/vagas/em/${cidade.slug}`) },
          ...(funcao ? [{ "@type": "ListItem", position: 3, name: funcao.label, item: urlAbsoluta(caminho) }] : []),
        ],
      },
      {
        "@type": "ItemList",
        name: titulo,
        numberOfItems: cards.length,
        itemListElement: cards.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: urlAbsoluta(`/vagas/${v._id}`) })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dados) }} />

      <BrandBand color="dark" className="py-10">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="text-xs text-white/60 mb-2 flex flex-wrap items-center gap-1" aria-label="Você está em">
            <Link href="/vagas" className="hover:text-white">Vagas</Link>
            <span>/</span>
            {funcao ? (
              <>
                <Link href={`/vagas/em/${cidade.slug}`} className="hover:text-white">{cidade.cidade}, {cidade.uf}</Link>
                <span>/</span>
                <span className="text-white/80">{funcao.label}</span>
              </>
            ) : (
              <span className="text-white/80">{cidade.cidade}, {cidade.uf}</span>
            )}
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{titulo}</h1>
          <p className="text-white/70 text-sm mt-1.5 flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" />
            {cards.length} vaga{cards.length === 1 ? "" : "s"} aberta{cards.length === 1 ? "" : "s"} agora · atualizado hoje
          </p>
        </div>
      </BrandBand>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {cards.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma vaga aberta neste momento</h2>
            <p className="text-sm text-muted-foreground">Cadastre seu currículo e avisamos quando entrar uma.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((v) => (
              <VagaCard key={v._id} vaga={v} />
            ))}
          </div>
        )}

        {/* Chamada: é o que transforma visita do Google em cadastro */}
        <section className="rounded-2xl bg-white border border-border/40 shadow-sm p-6 sm:p-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Trabalha {funcao ? `como ${funcao.label}` : "em gastronomia, hotelaria ou eventos"} em {cidade.cidade}?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre-se em 1 minuto. Empresas da região veem seu perfil e você recebe aviso de vaga nova que combina com você.
            </p>
          </div>
          <Link href={`/curriculo?origem=seo-${cidade.slug}`} className="shrink-0">
            <Button className="gap-2 font-semibold">
              Cadastrar currículo grátis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </section>

        {outrasFuncoes.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
              {funcao ? `Outras funções em ${cidade.cidade}` : `Vagas por função em ${cidade.cidade}`}
            </h2>
            <div className="flex flex-wrap gap-2">
              {outrasFuncoes.map((f) => (
                <Link
                  key={f.especialidade}
                  href={`/vagas/em/${cidade.slug}/${f.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm hover:border-primary/50 hover:text-primary"
                >
                  {f.label}
                  <span className="text-xs text-muted-foreground">{f.total}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {outrasCidades.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Vagas em outras cidades</h2>
            <div className="flex flex-wrap gap-2">
              {outrasCidades.map((c) => (
                <Link
                  key={c.slug}
                  href={`/vagas/em/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm hover:border-primary/50 hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary/60" />
                  {c.cidade}, {c.uf}
                  <span className="text-xs text-muted-foreground">{c.total}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-muted-foreground">
          É empresa e quer contratar em {cidade.cidade}?{" "}
          <Link href="/anunciar" className="underline underline-offset-2">Publique sua vaga grátis</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
