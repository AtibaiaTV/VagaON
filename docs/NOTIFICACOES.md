# Notificações

Um evento (match, mensagem, candidatura) vira **uma** notificação que sai por
todos os canais configurados e permitidos pelo usuário. Código em
`src/lib/notificacoes/`: `notificar(alvo, mensagem)` é a única porta de entrada.

| Canal | Sempre? | Precisa de | Onde configurar |
|---|---|---|---|
| **In-app** (sino no Navbar, `/notificacoes`) | sim | nada | — |
| **Push** (PWA / navegador) | não | par VAPID | `.env`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| **E-mail** | não | conta no Resend | `RESEND_API_KEY`, `EMAIL_REMETENTE` |
| **WhatsApp** | não | Meta Cloud API + template aprovado | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE` |

Canal sem credencial é pulado em silêncio. Nenhuma falha de canal derruba a
operação que a disparou. Tudo é aguardado (Vercel encerra a função ao responder).

## Eventos que notificam

| Evento | Quem recebe | Onde dispara |
|---|---|---|
| Novo match | os dois lados | `servicos/swipe.ts` → `criarMatch` |
| Nova mensagem | o outro lado, **só na primeira não lida** | `servicos/matches.ts` → `enviarMensagem` |
| Match → entrevista / contratado / encerrado | o outro lado | `servicos/matches.ts` → `atualizarStatusMatch` |
| Candidatura → em análise / aprovada / recusada | profissional | `api/candidaturas/[id]` PATCH |
| Nova candidatura pelo board | empresa | `api/vagas/[id]/candidaturas` POST |

Textos em `mensagens.ts`. Preferências por canal em `User.notificacoes`
(tela: `/perfil` → Notificações).

## Push — como ativar

1. `npx web-push generate-vapid-keys` → cole as chaves no `.env` (local e Vercel).
2. Em produção o service worker já registra sozinho. Em dev, `NEXT_PUBLIC_SW_EM_DEV="1"`.
3. O usuário clica em **Ativar avisos** (`/descobrir`, `/matches`, `/notificacoes` ou `/perfil`).
   A inscrição vai para `PushSubscription`; inscrições expiradas (404/410) são apagadas no envio.

iOS: push só funciona com o app **instalado na tela inicial** (iOS 16.4+).

## E-mail — como ativar

1. Crie a conta em resend.com e gere uma API key → `RESEND_API_KEY`.
2. Para testar sem domínio, deixe `EMAIL_REMETENTE` vazio: usa `onboarding@resend.dev`,
   que só entrega para o e-mail da própria conta Resend.
3. Para produção, verifique o domínio no Resend e defina `EMAIL_REMETENTE="VagaON <avisos@seudominio.com.br>"`.

## WhatsApp — como ativar

Usa a **API oficial** (Meta Cloud API). Mensagem iniciada pela plataforma
fora da janela de 24 h precisa ser um template aprovado; usamos um só,
utilitário, para simplificar.

1. Meta for Developers → app do tipo Business → produto WhatsApp. Anote o
   **Phone number ID** e gere um **token permanente** (System User).
2. Gerenciador do WhatsApp → Modelos de mensagem → criar:
   - Nome: `vagaon_aviso` · Categoria: **Utilidade** · Idioma: **Português (BR)**
   - Corpo:
     ```
     Olá, {{1}}! {{2}}
     Acesse: {{3}}
     ```
   - Exemplos para aprovação: `{{1}}` = Maria · `{{2}}` = Deu match! Trattoria Nonna Rosa também tem interesse em você para a vaga "Sous Chef". Comece a conversa. · `{{3}}` = https://vagaon.com.br/matches/abc
3. `.env`: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE="vagaon_aviso"`.
4. Telefones são normalizados para `55 + DDD + número` (`normalizarTelefoneBR`).

Faixa gratuita da Meta: 1.000 conversas de utilidade/mês por número; depois
é cobrado por conversa (24 h).

### Webhook (status e respostas)

`/api/webhooks/whatsapp` recebe da Meta o status de cada aviso (enviada →
entregue → lida, ou falhou) e o que o usuário responde. Código em
`src/lib/notificacoes/whatsapp-webhook.ts`; registros em `MensagemWhatsApp`
(somem em 90 dias).

1. `.env`: `WHATSAPP_VERIFY_TOKEN` (qualquer segredo; `openssl rand -hex 24`) e
   `WHATSAPP_APP_SECRET` (Meta → app → Configurações → Básico → Chave secreta).
2. Meta → app → WhatsApp → Configuração → Webhook: URL
   `https://SEU-DOMINIO/api/webhooks/whatsapp`, Verify token = o mesmo valor.
   Assine o campo **messages**.
3. Todo POST é validado pela assinatura `X-Hub-Signature-256`; sem
   `WHATSAPP_APP_SECRET` o webhook descarta tudo (503).

O que acontece com o que o usuário escreve:

| Resposta | Efeito |
|---|---|
| `PARAR` (ou pare, sair, cancelar, stop) | `User.notificacoes.whatsapp = false` e confirmação |
| `VOLTAR` (ou ativar, continuar) | religa e confirma |
| Qualquer outra coisa | uma orientação por dia por telefone apontando para `/matches` (ou para o cadastro, se o número não for de ninguém) |

O dono do número é achado pelo telefone do Profissional ou da Empresa,
tolerando máscara e o nono dígito. Mensagens recebidas ficam gravadas mesmo
sem dono, para auditoria.

Para testar sem número aprovado: o painel da Meta tem "Testar" no webhook,
que envia um evento assinado; e `curl` sem assinatura deve responder 401.

## Testando

- Sem nenhuma credencial: faça um match (ou envie uma mensagem) e veja o sino e `/notificacoes`.
- Push: ative em `/notificacoes`, depois gere um evento em outra aba/conta. O aviso aparece mesmo com a aba fechada.
- Logs: falhas de canal saem como `[notificacoes] <canal> falhou para <userId>: <detalhe>`.
