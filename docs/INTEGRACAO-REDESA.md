# Integração com a RedeSA

A RedeSA (guia turístico) e o VagaON (vagas e profissionais) atendem os mesmos
estabelecimentos. O dono já tem conta e já está logado no backoffice da RedeSA;
a integração existe para que ele **não precise de uma segunda conta** para
cuidar das vagas.

Desenho: **uma implementação, duas portas.** O funil, o chat, a triagem e as
avaliações vivem só no VagaON. O backoffice da RedeSA mostra um resumo e tem um
botão que leva o dono, já logado, para dentro do VagaON.

Tudo é assinado com `CROSS_PLATFORM_SECRET`, o mesmo valor nos dois lados. Sem
ele, a integração inteira fica desligada e o VagaON funciona sozinho.

## Identidade: `redesaId`

A chave é `establishmentId` da RedeSA, gravado em `Empresa.redesaId`. A dupla
User + Empresa correspondente é sempre criada ou encontrada por
[`garantirContaRedesa`](../src/lib/servicos/sso-redesa.ts), que trata quatro
situações:

| Situação | O que acontece |
|---|---|
| Empresa com `redesaId` e User de verdade | Entra |
| Empresa com `redesaId` mas `userId` órfão (auto-provisão antiga) | Cria ou adota o User e conserta o vínculo |
| User com o e-mail do estabelecimento, papel `empresa`, sem RedeSA | Adota: a empresa que já existia no VagaON passa a ser a mesma |
| Nada existe | Cria User **sem senha** + Empresa |

Um e-mail que já é de **profissional** ou de **admin** nunca é adotado — seria
fundir duas identidades sem ninguém pedir. O SSO recusa com a página de erro
`email-em-uso`.

O User criado pelo SSO não tem senha: a porta dele é a RedeSA. Para usar o
login normal do VagaON, define uma senha em **Perfil → Definir uma senha**
(`PUT /api/conta/senha`, PR #32); o painel lembra disso enquanto não houver
senha. Conta que já tem senha usa o mesmo cartão para trocar, informando a atual.

**O token precisa trazer `email`.** Sem e-mail não há como criar a conta, e o
SSO (ou a API de vagas, ao criar empresa nova) responde 400.

## Token

JWT HS256 assinado com `CROSS_PLATFORM_SECRET`:

```json
{
  "type": "cross-platform",
  "sub": "<id do usuário na RedeSA>",
  "establishmentId": "<id do estabelecimento>",
  "establishmentName": "Bar do Zé",
  "category": "gastronomy",
  "city": "Atibaia",
  "state": "SP",
  "email": "contato@bardoze.com.br",
  "phone": "11999990000"
}
```

`category`: `gastronomy` → restaurante, `accommodation` → hotel, o resto → outros.

Para a **API** (`/api/redesa/...`), o token vai no cabeçalho `Authorization:
Bearer` e não há limite de idade além do `exp` que a RedeSA puser.

Para o **SSO**, o token passa pelo navegador: é verificado com **idade máxima
de 5 minutos contada do `iat`** (`VALIDADE_TOKEN_SSO`). Emita na hora do
clique, com `expiresIn: "5m"`; um token sem `iat` é recusado.

## SSO: do backoffice para dentro do VagaON

`POST /api/sso/redesa`, formulário (`application/x-www-form-urlencoded`):

| Campo | |
|---|---|
| `token` | obrigatório |
| `destino` | opcional; caminho interno do VagaON (`/painel` por padrão). Qualquer coisa que não comece com `/` cai no padrão — não há redirect externo |

É POST, não link com `?token=`: o token carrega e-mail e telefone, e query
string vai parar em log de servidor e em `Referer`.

No backoffice, o botão "Gerenciar vagas" é um formulário que abre o VagaON já
logado:

```html
<form method="post" action="https://SEU-DOMINIO/api/sso/redesa" target="_blank">
  <input type="hidden" name="token" value="<jwt emitido agora, expiresIn 5m>">
  <input type="hidden" name="destino" value="/painel">
  <button type="submit">Gerenciar vagas no VagaON</button>
</form>
```

Destinos úteis: `/painel` (visão geral), `/vagas/nova`, `/vagas/<id>/candidaturas`.

Em caso de recusa, o VagaON manda para `/entrar/redesa?motivo=<código>` com
uma explicação legível. Códigos: `token` (expirado ou inválido),
`email-em-uso`, `dados` (sem e-mail), `suspensa`, `metodo` (abriu por GET). A
mensagem com o e-mail fica só no log do servidor.

## API de vagas (já existia)

`GET/POST /api/redesa/vagas`, `GET/PUT/DELETE /api/redesa/vagas/[id]`, com o
token no `Authorization`. Vagas criadas por aqui nascem `ativa` e aprovadas.

O `POST` cria a empresa se ela não existir — agora pelo mesmo
`garantirContaRedesa` do SSO, com User de verdade. Antes ele criava a Empresa
com um `userId` aleatório, e ninguém conseguia entrar nela.

## Webhooks para a RedeSA

O VagaON avisa a RedeSA, com token de 5 minutos no `Authorization`:

- `POST https://api.redesa.com.br/v1/webhooks/vagaon/candidaturas` — nova candidatura
- `POST https://api.redesa.com.br/v1/webhooks/vagaon/talentos` — novo profissional

Falha de webhook vai para o log e não interrompe nada do lado do VagaON.

## Onde fica a porta na RedeSA

O dono do estabelecimento usa o **portal do lojista** (`apps/business`,
business.redesa.com.br), não o backoffice: é lá que existe "estabelecimento
ativo" e o token cross-platform. A página **Vagas** desse portal tem o card
"VagaON" com o resumo (vagas ativas, candidaturas) e os botões **Gerenciar no
VagaON** (`/painel`) e **Publicar no VagaON** (`/vagas/nova`). O clique pede um
token novo em `POST /v1/auth/cross-platform-token` e envia o formulário para
`/api/sso/redesa` numa aba nova — o token guardado no login não serve, porque
o SSO só aceita token com menos de 5 minutos.

Código na RedeSA: `apps/business/src/services/vagaon.ts` (`abrirNoVagaON`) e
`apps/business/src/components/VagaOnPorta.tsx`. URL do VagaON em
`VITE_VAGAON_URL`.

O backoffice (`apps/backoffice`, para a equipe da RedeSA) não tem
estabelecimento ativo; a rota `/professionals` dele é um cadastro interno de
profissionais, não a porta do dono.
