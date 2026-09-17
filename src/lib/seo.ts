import { labelEspecialidade } from "@/constants/especialidades";
import { SETORES } from "@/constants/setores";
import { urlAbsoluta } from "@/lib/notificacoes/tipos";

/**
 * Dados estruturados (schema.org) para o Google.
 *
 * JobPosting em /vagas/[id] é o que coloca a vaga no Google for Jobs sem
 * pagar job board — o equivalente gratuito da "integração com 15 job boards"
 * dos ATS. Organization em /empresas/[slug] dá o cartão da empresa.
 *
 * Entram documentos `.lean()` com formatos ligeiramente diferentes, por isso
 * Record<string, any>.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

const DIA_MS = 1000 * 60 * 60 * 24;

const EMPLOYMENT_TYPE: Record<string, string> = {
  clt: "FULL_TIME",
  temporario: "TEMPORARY",
  sazonal: "TEMPORARY",
};

const UNIT_TEXT: Record<string, string> = { hora: "HOUR", dia: "DAY", mes: "MONTH" };

function iso(d: unknown): string | null {
  if (!d) return null;
  const data = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function textoParaHtml(texto: string): string {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escapado
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function caminhoEmpresa(empresa: Doc): string {
  return `/empresas/${empresa.slug ?? empresa._id}`;
}

export function montarOrganization(empresa: Doc) {
  const setor = SETORES.find((s) => s.value === empresa.setor)?.label;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: empresa.nomeFantasia,
    url: urlAbsoluta(caminhoEmpresa(empresa)),
    ...(empresa.logo ? { logo: empresa.logo } : {}),
    ...(empresa.website ? { sameAs: [empresa.website] } : {}),
    ...(empresa.descricao ? { description: empresa.descricao } : {}),
    ...(setor ? { knowsAbout: setor } : {}),
    ...(empresa.cidade || empresa.estado
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: empresa.cidade || undefined,
            addressRegion: empresa.estado || undefined,
            addressCountry: "BR",
          },
        }
      : {}),
  };
}

export function montarJobPosting(vaga: Doc, empresa: Doc) {
  const criada = iso(vaga.createdAt) ?? new Date().toISOString();
  const validade =
    iso(vaga.expiresAt) ??
    iso(vaga.periodo?.dataFim) ??
    new Date(new Date(criada).getTime() + 60 * DIA_MS).toISOString();

  const descricao = [vaga.descricao, vaga.requisitos ? `Requisitos:\n${vaga.requisitos}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const salario = vaga.salario;
  // Valor implausível (ex.: "1,7/mês" querendo dizer 1.700) é pior que nenhum:
  // o Google marca a vaga como enganosa. Nesses casos, omite o salário.
  const MINIMO_PLAUSIVEL: Record<string, number> = { hora: 5, dia: 30, mes: 500 };
  const maior = Math.max(salario?.min ?? 0, salario?.max ?? 0);
  const temSalario =
    salario && salario.tipo !== "a_combinar" && maior >= (MINIMO_PLAUSIVEL[salario.periodo] ?? 500);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: vaga.titulo,
    description: textoParaHtml(descricao),
    identifier: { "@type": "PropertyValue", name: "VagaON", value: String(vaga._id) },
    datePosted: criada,
    validThrough: validade,
    employmentType: EMPLOYMENT_TYPE[vaga.tipo] ?? "OTHER",
    occupationalCategory: labelEspecialidade(vaga.especialidade),
    directApply: true,
    url: urlAbsoluta(`/vagas/${vaga._id}`),
    hiringOrganization: {
      "@type": "Organization",
      name: empresa.nomeFantasia,
      sameAs: urlAbsoluta(caminhoEmpresa(empresa)),
      ...(empresa.logo ? { logo: empresa.logo } : {}),
    },
    ...(vaga.remoto
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Brasil" },
        }
      : {}),
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: vaga.cidade,
        addressRegion: vaga.estado,
        addressCountry: "BR",
      },
    },
    ...(temSalario
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "BRL",
            value: {
              "@type": "QuantitativeValue",
              ...(salario.min && salario.max && salario.min !== salario.max
                ? { minValue: salario.min, maxValue: salario.max }
                : { value: salario.max ?? salario.min }),
              unitText: UNIT_TEXT[salario.periodo] ?? "MONTH",
            },
          },
        }
      : {}),
  };
}

/** Serializa para <script type="application/ld+json"> sem abrir brecha de XSS. */
export function jsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
