import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaVagasLocal, { descricaoPagina, tituloPagina } from "@/components/vagas/PaginaVagasLocal";
import { cidadePorSlug, especialidadeDoSlug } from "@/lib/servicos/paginas-vagas";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";

export const revalidate = 600;

async function resolver(params: { cidade: string; funcao: string }) {
  const c = await cidadePorSlug(params.cidade);
  if (!c) return null;
  const especialidade = especialidadeDoSlug(params.funcao);
  if (!especialidade) return null;
  // Só existe página para função com vaga ativa na cidade.
  const f = c.funcoes.find((x) => x.especialidade === especialidade);
  if (!f) return null;
  return { c, f };
}

export async function generateMetadata({ params }: { params: { cidade: string; funcao: string } }): Promise<Metadata> {
  const r = await resolver(params);
  if (!r) return { title: "Vagas — VagaON", robots: { index: false } };
  const titulo = tituloPagina(r.c, r.f);
  const descricao = descricaoPagina(r.c, r.f, r.f.total);
  return {
    title: `${titulo} — VagaON`,
    description: descricao,
    alternates: { canonical: urlAbsoluta(`/vagas/em/${r.c.slug}/${r.f.slug}`) },
    openGraph: { title: titulo, description: descricao, type: "website" },
  };
}

/** /vagas/em/atibaia-sp/garcom — vagas ativas da função na cidade. */
export default async function VagasFuncaoCidadePage({ params }: { params: { cidade: string; funcao: string } }) {
  const r = await resolver(params);
  if (!r) notFound();
  return <PaginaVagasLocal cidade={r.c} funcao={r.f} />;
}
