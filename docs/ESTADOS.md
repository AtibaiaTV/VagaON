# Estados da vaga e visibilidade do perfil

Antes disto, nada mudava depois do match ou da contratação: a vaga ficava no
ar para sempre e o perfil contratado continuava no deck de todas as empresas.
Agora os dois lados têm estados visíveis e regras automáticas. Nada some sem
a pessoa decidir.

## Vaga

| Estado | Aparece no Descobrir, site e Google | Funil, chats e candidaturas | Quem leva até aqui |
|---|---|---|---|
| `ativa` | sim | sim | publicação, Reativar, Renovar |
| `pausada` | não | sim | empresa (Pausar) |
| `preenchida` | não | sim | empresa (Marcar como preenchida) |
| `encerrada` | não | sim | empresa (Encerrar) |
| `expirada` | não | sim | cron, por prazo |
| `rascunho` / `rejeitada` | não | — | já existiam (admin) |

Transições e rótulos em `src/lib/vagas-estado.ts` (puro). Botões na página da
vaga, para a empresa dona (`AcoesVaga`): Pausar, Reativar, Marcar como
preenchida, Encerrar, Renovar por 30 dias. API: `PATCH /api/vagas/[id]/status
{ acao }`. Fechar (preenchida/encerrada) avisa quem ainda estava no funil
(candidaturas enviada/visualizada/em análise/entrevista, até 200).

**Validade.** Vaga CLT vale 60 dias; temporária ou sazonal vale até a data de
término (`expiresAt`, definido na criação). O cron avisa 3 dias antes
("Renovar por 30 dias" em um clique) e expira o que venceu, avisando a
empresa. Reativar dá validade nova. Vagas antigas sem validade recebem a
natural, com carência mínima de 7 dias, na primeira rodada do cron.

**Contratação.** Cada "contratado" no chat ou "aprovada" no funil soma em
`preenchidas`. Ao chegar em `posicoes`, a empresa recebe "Marcar a vaga como
preenchida?" — a vaga **não fecha sozinha**, porque a empresa pode querer
mais gente.

Em "Minhas candidaturas" o profissional vê "Vaga preenchida/encerrada/…"
em vez de esperar resposta para sempre.

## Perfil do profissional

`Profissional.match.ativo` decide se a pessoa aparece no Descobrir das
empresas e no banco de currículos. Candidaturas, matches e chats nunca
dependem disso. Interruptor no `/perfil` (`CardVisibilidade`); API
`POST /api/perfil/visibilidade { ativo, motivo }`.

| `motivoPausa` | Como acontece |
|---|---|
| `manual` | a pessoa desligou o interruptor |
| `contratado` | depois de uma contratação recente, o card sugere "Pausar agora"; a pessoa decide (quem faz extra deixa ligado) |
| `inatividade` | cron: 180 dias sem atividade → aviso; 7 dias depois sem reação → pausa e aviso |

Atividade = abrir o painel ou o Descobrir, ou dar swipe
(`registrarAtividadeProfissional`). Reativar o perfil zera o aviso. Perfil
antigo sem nenhuma atividade usa a data da última edição.

## Cron

O plano Hobby da Vercel permite dois crons. `vercel.json` aponta para
`/api/cron/manutencao` (12:30 UTC), que roda em sequência: convites e
publicação de avaliações, validade das vagas, inatividade. Cada passo é
isolado e idempotente; a resposta traz as contagens. A rota antiga
`/api/cron/avaliacoes` continua existindo para chamadas manuais.

## Testar

`/dev/estados` (fora de produção): a barra de ações em cada estado da vaga e
o card de visibilidade nas quatro situações. Os cliques chamam a API real e
falham sem sessão — é só visual. As transições e a validade têm testes puros
no script de fumaça.
