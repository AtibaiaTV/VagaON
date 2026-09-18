# Variáveis de ambiente

Fonte única do que o VagaON lê do ambiente. A mesma lista, em código, está em
[`src/lib/diagnostico.ts`](../src/lib/diagnostico.ts); ao mexer numa, mexa na
outra. Com o site no ar, **`/admin/diagnostico`** mostra o que já está definido
naquele ambiente e o que cada ausência desliga — é a forma mais rápida de
conferir a Vercel sem abrir a Vercel.

Em desenvolvimento: `.env.local` na raiz (não versionado). Na Vercel: Settings →
Environment Variables. **Toda mudança exige um novo deploy**, e as `NEXT_PUBLIC_*`
entram no código no momento do *build* — republicar é obrigatório para elas.

Nenhuma variável tem o valor exibido em tela, exceto as `NEXT_PUBLIC_*`, que o
navegador recebe de qualquer jeito.

## Essenciais

Sem qualquer uma destas, o site não funciona.

| Variável | Para quê | Sem ela | Onde conseguir |
|---|---|---|---|
| `MONGODB_URI` | Banco (MongoDB Atlas) | Nada carrega | Atlas → Database → Connect → Drivers |
| `AUTH_SECRET` | Assina as sessões do NextAuth | Ninguém entra | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Domínio público; base de QR, links e e-mails | QR Code, cartaz e links de aviso saem com `http://localhost:3000` | O domínio real, com `https` e sem barra no fim |

`AUTH_URL` serve de reserva para `NEXT_PUBLIC_APP_URL` (ver
[`src/lib/qr.ts`](../src/lib/qr.ts)), mas o valor público é o que vale para o
material impresso. Na Vercel, ligue também `AUTH_TRUST_HOST="true"`.

## Uploads (Cloudinary)

| Variável | Sem ela |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Foto, logo e vídeo não sobem |
| `CLOUDINARY_API_KEY` | Envios falham |
| `CLOUDINARY_API_SECRET` | Envios falham; apagar arquivo antigo também |

Valores no painel do Cloudinary, em Dashboard.

## IA (Claude)

| Variável | Sem ela |
|---|---|
| `ANTHROPIC_API_KEY` | Os painéis "Preencher com IA" ficam ocultos e as rotas de IA respondem 503 |

Chave em console.anthropic.com → API Keys. Detalhes em [IA.md](IA.md); o
playground fora de produção é `/dev/ia`.

## Tarefas automáticas (cron)

| Variável | Sem ela |
|---|---|
| `CRON_SECRET` | Os dois crons respondem 401: vaga vencida não expira, perfil inativo não some, convite de avaliação não sai |

Gere com `openssl rand -hex 32`. O mesmo valor na Vercel, que o envia como
`Authorization: Bearer`. Crons declarados em [`vercel.json`](../vercel.json):
`/api/cron/lembretes-entrevista` (09:00 BRT) e `/api/cron/manutencao` (09:30 BRT).
O plano Hobby permite dois — por isso a manutenção é um cron único.

## Notificações

Todas opcionais: canal sem credencial é simplesmente ignorado, e o sino dentro
do site funciona sem nenhuma delas. Ver [NOTIFICACOES.md](NOTIFICACOES.md).

| Variável | Sem ela |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Sem push no celular |
| `VAPID_SUBJECT` | Usa `mailto:contato@vagaon.app` |
| `RESEND_API_KEY` | Nenhum e-mail sai |
| `EMAIL_REMETENTE` | Usa `onboarding@resend.dev`, que só entrega no e-mail da própria conta Resend |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Nenhum WhatsApp sai |
| `WHATSAPP_TEMPLATE` | Usa `vagaon_aviso` |
| `WHATSAPP_API_VERSION` | Usa `v21.0` |

Par VAPID: `npx web-push generate-vapid-keys`.

## Integração RedeSA

| Variável | Sem ela |
|---|---|
| `CROSS_PLATFORM_SECRET` | Entrada por token da RedeSA e webhook de talentos ficam desligados; o VagaON sozinho não é afetado |

## Planos

| Variável | Efeito |
|---|---|
| `PLANOS_ATIVOS` | Só `"1"` liga os limites do plano Grátis. Vazio (estado atual): toda empresa é tratada como Pro |

Antes de ligar, rode `node src/scripts/conceder-trial.mjs --dias 60 --dry` e
confira a saída. Ver [PLANOS.md](PLANOS.md).

## Só em desenvolvimento

| Variável | Efeito |
|---|---|
| `NEXT_PUBLIC_SW_EM_DEV` | `"1"` registra o service worker em dev, para testar push |

## Ordem sugerida para colocar no ar

1. `NEXT_PUBLIC_APP_URL` — antes de imprimir qualquer QR.
2. `CRON_SECRET` — senão a manutenção diária nunca roda.
3. `ANTHROPIC_API_KEY` — primeiro teste em `/dev/ia`.
4. Resend, depois push, depois WhatsApp (o que exige aprovação de template).
5. `PLANOS_ATIVOS` fica vazio até existir provedor de pagamento.

Depois de cada bloco, abra `/admin/diagnostico` e confira.
