import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";
import { caminhoEmpresa } from "@/lib/seo";
import Empresa from "@/models/Empresa";
import Vaga from "@/models/Vaga";
import { cidadesComVagas } from "@/lib/servicos/paginas-vagas";

/**
 * /sitemap.xml — o que o Google deve rastrear: páginas públicas fixas, as
 * vagas ativas (cada uma já leva JobPosting) e as páginas das empresas.
 * Regenerado a cada hora; vaga que fecha some da lista no próximo ciclo.
 */
export const revalidate = 3600;

const FIXAS: { caminho: string; prioridade: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { caminho: "/", prioridade: 1, freq: "daily" },
  { caminho: "/vagas", prioridade: 0.9, freq: "hourly" },
  { caminho: "/curriculo", prioridade: 0.7, freq: "monthly" },
  { caminho: "/anunciar", prioridade: 0.7, freq: "monthly" },
  { caminho: "/planos", prioridade: 0.4, freq: "monthly" },
  { caminho: "/privacidade", prioridade: 0.2, freq: "yearly" },
  { caminho: "/termos", prioridade: 0.2, freq: "yearly" },
  { caminho: "/cadastro", prioridade: 0.5, freq: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = FIXAS.map((p) => ({
    url: urlAbsoluta(p.caminho),
    changeFrequency: p.freq,
    priority: p.prioridade,
  }));

  try {
    await connectDB();
    const [vagas, empresas, cidades] = await Promise.all([
      Vaga.find({ status: "ativa", aprovadaPorAdmin: true }).select("_id updatedAt").sort({ createdAt: -1 }).limit(5000).lean(),
      Empresa.find({ slug: { $ne: null } }).select("slug updatedAt").limit(5000).lean(),
      cidadesComVagas(),
    ]);

    // Páginas por cidade e por função — só as que têm vaga ativa.
    const locais: MetadataRoute.Sitemap = cidades.flatMap((c) => [
      { url: urlAbsoluta(`/vagas/em/${c.slug}`), changeFrequency: "daily" as const, priority: 0.7 },
      ...c.funcoes.map((f) => ({
        url: urlAbsoluta(`/vagas/em/${c.slug}/${f.slug}`),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ]);

    return [
      ...fixas,
      ...locais,
      ...vagas.map((v) => ({
        url: urlAbsoluta(`/vagas/${v._id}`),
        lastModified: v.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
      ...empresas.map((e) => ({
        url: urlAbsoluta(caminhoEmpresa(e)),
        lastModified: e.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (err) {
    // Banco fora do ar não pode derrubar o sitemap: entrega ao menos as fixas.
    console.error("[sitemap]", err);
    return fixas;
  }
}
