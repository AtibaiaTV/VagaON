# Currículo para impressão

O profissional escolhe um de três modelos e imprime (ou salva em PDF) em um
clique, com os dados que já estão no perfil. Nada é digitado de novo.

| Onde | O quê |
|---|---|
| `/perfil/curriculo` | Escolha do modelo, prévia em tamanho real e botão "Imprimir / salvar PDF". `?modelo=` pré-seleciona; `?imprimir=1` abre a impressão ao carregar. |
| `/perfil` | Card "Meu currículo" com os três modelos e o botão de imprimir (o modelo salvo é o padrão). |
| `src/lib/curriculo.ts` | `MODELOS_CURRICULO`, `montarDadosCurriculo(profissional, email)` (puro), formatação de datas. |
| `src/components/curriculo/` | `ModeloExecutivo`, `ModeloMinimalista`, `ModeloCriativo` (só JSX + Tailwind) e `CurriculoImpressao` (cliente: seleção, prévia, impressão). |
| `POST /api/perfil/curriculo-modelo` | Grava o modelo preferido em `Profissional.curriculoModelo`. |
| `src/app/globals.css` | Regras `.cv-*` e `@media print`. |

## Os três modelos

1. **Moderno Executivo** — duas colunas: lateral escura (`#2c3e50`) com foto redonda, contato, competências, idiomas e disponibilidade; coluna principal com nome, cargo alvo em verde (`#1abc9c`), perfil, experiência e formação.
2. **Minimalista Contemporâneo** — faixa clara (`#eaeff2`) com foto quadrada e nome; linha de contato com ícones; seções corridas (Sobre mim, Experiência, Educação, Competências em chips, Mais informações).
3. **Criativo** — barra azul (`#0066cc`) na lateral, foto redonda no canto, seções numeradas ("01 / PERFIL", …). A numeração pula seções vazias.

Todos: A4, fonte Arial (igual em qualquer impressora), seções vazias somem,
experiências da mais recente para a mais antiga, cada bloco com
`break-inside: avoid`. O "cargo alvo" é a especialidade principal do perfil.

## Dados usados

Nome, telefone, e-mail (do `User`), cidade/UF, LinkedIn, foto, resumo,
especialidades, habilidades, idiomas, disponibilidade, experiências e
**formação** — campo novo (`Profissional.formacao[]`: curso, instituição,
ano), editável na etapa "Experiências" do perfil e também extraído pela IA
do currículo importado.

## Como a impressão funciona

- A prévia é a página real de 210 mm, reduzida com `transform: scale()` para
  caber na tela. Em `@media print` o transform é removido, tudo com
  `nao-imprimir` some e `@page { size: A4; margin: 0 }`.
- Cores de fundo: `print-color-adjust: exact` força o Chrome a imprimir a
  lateral escura e a faixa. Se o navegador da pessoa ignorar, a dica na tela
  manda ativar "Gráficos de fundo".
- Currículo com mais de uma página: a lateral escura (Executivo) e a barra
  azul (Criativo) repetem em todas as folhas via um elemento `position: fixed`
  que só existe na impressão (`.cv-fundo-fixo`).
- "Salvar como PDF" é a opção da própria janela de impressão — não há geração
  de PDF no servidor.

## Testar

`/dev/curriculo` (fora de produção): dados fictícios completos ou
`?vazio=1` para um perfil mínimo; `?modelo=` escolhe; "simular impressão"
aplica as regras de `@media print` na tela via `html.simular-impressao`.
