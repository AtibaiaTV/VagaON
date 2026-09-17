# Avaliações e reputação

Avaliação mútua depois de cada contratação feita pela plataforma. Desenhada
para ser útil (a nota vira confiança no marketplace) sem virar "lista suja":
o que a Justiça do Trabalho pune e a LGPD regula.

## Regras (constants/avaliacao.ts)

| Regra | Valor | Por quê |
|---|---|---|
| Quem avalia | só os dois lados de um match em `contratado` | Vínculo real, verificado pela plataforma. Uma avaliação por lado por vínculo. |
| Quando abre | 3 dias (temporário/sazonal) · 30 dias (CLT) após `Match.contratadoEm` | O bico já acabou; o CLT passou por boa parte da experiência. |
| Critérios | estruturados, 1–5, profissionais (`CRITERIOS_PROFISSIONAL`, `CRITERIOS_EMPRESA`) | Nada de aparência ou personalidade. "Higiene" é BPF/ANVISA, formulada como norma. |
| Comentário livre | privado ao avaliado, moderável | Sem texto livre público não há difamação pública. |
| Publicação | duplo-cega: quando os dois avaliam, ou após 14 dias | Ninguém avalia reagindo à nota do outro (anti-retaliação). |
| Média pública | só com **3+** avaliações; antes, nada aparece | Uma nota isolada não define ninguém. |
| Pontos fortes | critérios com média ≥ 4,5 (até 3) | A vitrine é positiva por construção. |
| Selo "Confiável" | média ≥ 4,5 com o mínimo | Incentivo. |
| Direitos do avaliado | vê tudo, responde uma vez, contesta → moderação | LGPD art. 20 (revisão), direito de resposta. |
| No motor de match | ±3% na **ordenação**, só com o mínimo, simétrico (empresa também) | Nunca elimina; a nota ajuda quem é bom. |

## Fluxo

1. Match → `contratado` (pelo chat ou pelo funil): `Match.contratadoEm` é gravado.
2. Cron diário `/api/cron/avaliacoes` convida os dois lados quando o prazo abre
   (`Match.avaliacoes.lembradaEm` evita repetir). O chat também mostra
   "Avaliar a experiência" no menu.
3. `/avaliacoes` → formulário (1–5 por critério, "recomendaria", comentário privado).
   `POST /api/avaliacoes`.
4. Se o outro lado já avaliou, as duas são publicadas na hora; senão o cron
   publica após 14 dias. Ao publicar: reputação recalculada
   (`Profissional.reputacao` / `Empresa.reputacao`) e o avaliado é notificado.
5. O avaliado responde (`/resposta`) ou contesta (`/disputa`). Admins são
   notificados; `/admin/avaliacoes` aceita (remove da reputação) ou rejeita.

## Onde aparece

- Deck: `CardProfissionalSwipe` (empresa vê o profissional) e `CardVagaSwipe`
  (profissional vê a empresa) — compacto: média, total, selo.
- Perfis públicos: `/profissionais/[id]`, `/empresas/[slug]`.
- Perfil próprio (`/perfil`): tudo, inclusive antes do mínimo público, com
  média por critério — o direito de acesso na prática.

## Código

- `src/models/Avaliacao.ts` · `src/lib/servicos/avaliacoes.ts` (regras) ·
  `src/lib/reputacao.ts` (projeção pública, puro) ·
  `src/components/avaliacoes/*` · `src/app/avaliacoes` · `src/app/admin/avaliacoes`.
- Cron: `vercel.json` → `/api/cron/avaliacoes` às 12:30 UTC, protegido por `CRON_SECRET`.
