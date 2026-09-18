# SEO (candidato chegando pelo Google)

Um site de vagas vive de candidato que busca "vaga de garçom em Atibaia". O
que existe para isso, sem anúncio:

| Peça | Onde | O que faz |
|---|---|---|
| JobPosting (schema.org) | `/vagas/[id]` via `src/lib/seo.ts` | Coloca a vaga no Google for Jobs |
| Organization | `/empresas/[slug]` | Cartão da empresa |
| `sitemap.xml` | `src/app/sitemap.ts` (1 h) | Fixas + vagas ativas + empresas + páginas por cidade/função |
| `robots.txt` | `src/app/robots.ts` | Libera o público, fecha área logada, `/cv/`, `/convite/`, `/api` |
| Páginas por cidade | `/vagas/em/[cidade]` | "Vagas em Atibaia, SP" |
| Páginas por função | `/vagas/em/[cidade]/[funcao]` | "Vagas de Garçom em Atibaia, SP" |

## Páginas por cidade e função

Código em `src/lib/servicos/paginas-vagas.ts` + `src/components/vagas/PaginaVagasLocal.tsx`.

- Só existem para combinações **com vaga ativa** (`cidadesComVagas()`, agregado
  das vagas ativas com cache de 10 min). Página vazia responde 404 e fica
  fora do sitemap: o Google penaliza página fina, e ninguém ganha nada.
- Slug da cidade: `slugify("Atibaia SP")` → `atibaia-sp`. Slug da função é o
  `value` da especialidade com `_` → `-` (`chef_cozinha` → `chef-cozinha`).
- Cada página traz: lista de vagas (`VagaCard`), chamada para cadastrar
  currículo (`/curriculo?origem=seo-<cidade>`, fica em `User.origemCadastro`),
  links para as outras funções da cidade e para as outras cidades,
  BreadcrumbList + ItemList em JSON-LD, `canonical`.
- `/vagas` (visão pública) lista as cidades com vaga no rodapé da página.
- `revalidate = 600`: vaga nova aparece em até 10 min.

## Depois do deploy

1. Google Search Console → Sitemaps → `https://www.vagaon.com.br/sitemap.xml`.
2. Conferir no relatório "Vagas de emprego" se as JobPosting estão sendo lidas.
3. `NEXT_PUBLIC_APP_URL` tem que ser `https://www.vagaon.com.br` (canônico;
   sem www responde 307).
