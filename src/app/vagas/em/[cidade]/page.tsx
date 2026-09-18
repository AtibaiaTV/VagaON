import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaVagasLocal, { descricaoPagina, tituloPagina } from "@/components/vagas/PaginaVagasLocal";
import { cidadePorSlug } from "@/lib/servicos/paginas-vagas";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: { cidade: string } }): Promise<Metadata> {
  const c = await cidadePorSlug(params.cidade);
  if (!c) return { title: "Vagas — VagaON", robots: { index: false } };
  const titulo = tituloPagina(c);
  return {
    title: `${titulo} — VagaON`,
    description: descricaoPagina(c),
    alternates: { canonical: urlAbsoluta(`/vagas/em/${c.slug}`) },
    openGraph: { title: titulo, description: descricaoPagina(c), type: "website" },
  };
}

/** /vagas/em/atibaia-sp — todas as vagas ativas da cidade. */
export default async function VagasNaCidadePage({ params }: { params: { cidade: string } }) {
  const c = await cidadePorSlug(params.cidade);
  if (!c) notFound();
  return <PaginaVagasLocal cidade={c} />;
}
