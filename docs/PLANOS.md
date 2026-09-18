# Planos para empresas

Estrutura pronta e **desligada por padrão**. Liga com uma variável de ambiente
quando a base justificar. Profissional nunca paga.

## Regra de ouro

O que o candidato fez pela empresa nunca fica atrás do paywall: candidaturas
às vagas dela, matches, chat, entrevista, funil e o vídeo de quem se
candidatou continuam grátis. O plano cobra a **busca ativa** e as
**ferramentas**.

| Recurso | Grátis | Pro |
|---|---|---|
| Vagas ativas | 1 | ilimitadas |
| Ver quem se candidatou às suas vagas | sempre | sempre |
| Funil, chat, entrevista | sim | sim |
| Descobrir (deck de candidatos) | 10 decisões/dia | ilimitado |
| Banco de currículos (`/profissionais`) | não | sim |
| Resumo das respostas de triagem por IA | não | sim |
| Vários usuários por empresa (ver [EQUIPE.md](EQUIPE.md)) | não | até 10 gerentes |
| Selo verificado | não | previsto |

Preço de referência (`src/lib/planos.ts`): Pro R$ 149/mês ou passe de
temporada R$ 199 por 30 dias (buffet, hotel, evento). Ajuste em `PLANOS`.

## Como ligar

1. Conceder teste à base atual, para ninguém perder acesso de repente:
   `node src/scripts/conceder-trial.mjs --dias 60 --dry` e depois sem `--dry`.
2. `PLANOS_ATIVOS=1` na Vercel (e no `.env.local` para testar).
3. Enquanto não há provedor de pagamento, a venda é manual: em
   `/admin/empresas` cada card tem **Pro 30d**, **Pro 1 ano**, **Teste 60d** e
   **Grátis**, além do valor entregue (vagas ativas, candidaturas,
   contratações) e o selo "quer o Pro" de quem clicou na página de planos.

Com a variável vazia, `resolverPlano` devolve Pro com motivo `desligado` para
todas as empresas: nenhum limite é aplicado, o card do painel some e a página
`/planos` avisa que tudo está liberado no lançamento.

## Onde os limites entram

| Ponto | Guarda | Resposta |
|---|---|---|
| `POST /api/vagas` | `verificarLimiteVagas` | 402 `{ error, upgrade: true }` |
| Deck da empresa (`registrarSwipe`) | `verificarLimiteSwipesEmpresa` | 402; `DeckEmpresa` trava o deck e mostra o link para `/planos` |
| `/profissionais` | `acessoDaEmpresa().limites.bancoCurriculos` | página com `Paywall` |
| `/profissionais/[id]` | idem, **exceto** quem tem candidatura ou match com a empresa | `Paywall` |
| `POST /api/candidaturas/[id]/triagem-ia` | `exigirRecurso("triagemIA")` | 402; o Kanban só pede resumo quando `iaDisponivel` (chave + plano) |
| `/painel` (empresa) | `CardPlanoPainel` | situação do plano e chamada para o Pro |
| `POST /api/empresa/equipe` | `exigirRecurso("multiusuario")` | 402; `/perfil/equipe` esconde o formulário e mostra o link para `/planos`. Gerente já convidado nunca perde acesso |

Tudo passa por `src/lib/servicos/planos.ts`, que usa `resolverPlano` (puro,
em `src/lib/planos.ts`): assinatura `ativa`/`inadimplente` com `ativoAte`
no futuro → Pro; `trialAte` no futuro → Pro (teste); senão Grátis.

## Modelo de dados

`Empresa.assinatura`: `plano` (gratis|pro), `status`
(nenhuma|trial|ativa|inadimplente|cancelada), `ativoAte`, `trialAte`,
`provedor` (`manual` ou o gateway), `referenciaExterna`, `interesseEm`
(clicou em "Quero o Pro"), `atualizadoEm`. Índice em `status + ativoAte`.

## Próximo passo: provedor de pagamento

Assinatura recorrente por cartão ou PIX em um PSP (Asaas, Stripe, Pagar.me).
O botão da página de planos vira checkout; um webhook do provedor grava
`assinatura.status/ativoAte/referenciaExterna` e nada mais muda, porque todo
o resto lê só `resolverPlano`. Nenhum dinheiro de profissional passa pela
plataforma.
