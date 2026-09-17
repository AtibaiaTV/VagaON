# Sistema de Match (Descobrir)

Modo "Tinder" do VagaON: o profissional desliza **vagas**, a empresa desliza
**candidatos dentro de cada vaga**. Match = like dos dois lados no mesmo par
`(vaga, profissional)`. O match cria uma `Candidatura` formal (status
`em_analise`), então painel da empresa e webhook da Redesa continuam iguais.

## Mapa do código

| Camada | Onde | O que faz |
|---|---|---|
| Motor (puro) | `src/lib/match/` | `avaliarMatch(profissional, vaga)` → score 0–100 + explicações. Sem Mongoose, testável isolado. |
| Pesos | `src/lib/match/pesos.ts` | **Única** fonte de calibragem. Mexeu aqui, mudou o ranking. |
| Geo | `src/constants/municipios.ts` | Coordenadas de ~180 cidades. Cidade desconhecida → sem coordenadas → "mesma UF", nunca centroide. |
| Serviços | `src/lib/servicos/` | `feed.ts` (monta o deck), `swipe.ts` (registra + fecha match), `matches.ts` (lista, chat), `projecoes.ts` (**fronteira LGPD**). |
| API | `src/app/api/match/*`, `src/app/api/matches/*` | Rotas finas sobre os serviços. |
| UI | `src/components/match/`, `src/app/descobrir`, `src/app/matches` | Deck com gestos, cards, overlay de match, chat com polling. |
| Models | `Swipe`, `Match`, `Mensagem` + campos novos em `Profissional` e `Vaga` | `Swipe` é log append-only. `Match` é também a conversa. |
| Calibragem | `/admin/match-lab` | Vê o motor pontuar todos os pares contra um perfil ou vaga real. |

## Como o score é calculado

1. **Eliminatórias** (não pontua): perfil sem especialidade; distância > 1,5×
   o raio do profissional (só com coordenadas reais dos dois lados); nenhuma
   relação entre especialidades.
2. **Dimensões ponderadas** — cada uma devolve nota 0–1, ou `null` quando não
   dá para avaliar (ex.: vaga com salário "a combinar"). Peso de dimensão
   `null` é **redistribuído**, não zerado. Perfil sem cidade nem estado vale
   0.3 em localização (com alerta), não `null`.

   | Dimensão | Peso | Nota |
   |---|---|---|
   | especialidade | 30 | exato 1.0 · mesma subcategoria 0.7 · mesma categoria 0.45 · adjacente 0.3 — × fator de amplitude: até 8 especialidades ×1.0, −0,03 por extra, piso ×0.7 (perfil "escopeta" com 30 cargos não ganha "exato" de graça) |
   | localizacao | 20 | remoto 1.0; platô até 25% do raio, decaimento quadrático até 0 no raio |
   | experiencia | 15 | anos ÷ exigido, saturando em 1 |
   | disponibilidade | 12 | 60% tipo de contrato + 40% data |
   | salario | 10 | teto da vaga ÷ pretensão (tudo convertido para mensal) |
   | habilidades | 8 | fração das desejadas que o perfil tem (extras não penalizam) |
   | turnoEscala | 5 | compatibilidade |

3. **Teto pelo cargo**: `total ≤ 50 + 50 × notaEspecialidade`. Garçom perfeito
   em tudo não vira "match forte" para um sous chef (teto 65).
4. **Confiança**: `× (0,75 + 0,25 × fraçãoDoPesoAvaliado)`. Com metade das
   dimensões avaliáveis o teto é 87. Sem isso, nos dados reais, perfil vazio
   pontuava 100 só com o default `imediata: true`.
5. **`total`** (exibido) = os passos acima. **`prioridade`** (só ordena o feed)
   = total × boost de perfil (completude, empresa verificada, atividade
   recente; ±5%). Sem clamp em 100.
5. Feed mostra só `total ≥ 35` (`SCORE_MINIMO_FEED`).

O que **não** entra no score, por decisão: idade, foto, gênero, nome. O log de
`Swipe` guarda o score de cada decisão — é a evidência de que o ranking usou
só critérios profissionais.

## Fronteira LGPD

`projecoes.ts` define o que cada lado vê **antes** do match: nunca CPF,
telefone, e-mail, data de nascimento, CEP, currículo ou LinkedIn. Contato só em
`GET /api/matches/[id]` depois do interesse mútuo, e some se o match encerra.

## Operação

- **Backfill** dos documentos antigos (geo, anos de experiência, índices):
  `node src/scripts/backfill-match.mjs --dry` e depois sem `--dry`.
- **Limites**: 50 likes/dia por profissional (`LIMITE_LIKES_DIA`); feed pontua
  até 300 candidatos por requisição (`LOTE_CANDIDATOS`).
- **Chat**: polling a cada 4 s com `?depois=`; trocar por Pusher/Ably não muda a UI.
- **PWA**: `public/manifest.webmanifest` + `public/sw.js` (nunca cacheia
  `/api`, não cacheia páginas autenticadas). SW só registra em produção.

## Calibrando

1. Rode o backfill.
2. Abra `/admin/match-lab`, escolha 3–4 profissionais típicos e 3–4 vagas.
3. Olhe quem está no topo e quem foi eliminado. Se o instinto de recrutador
   discorda, ajuste `pesos.ts` (não o motor) e recarregue.
4. Depois de uma semana com swipes reais, compare score × taxa de like na
   coleção `swipes` — aí os pesos deixam de ser opinião.
