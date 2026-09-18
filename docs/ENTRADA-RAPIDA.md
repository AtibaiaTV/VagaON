# Entrada rápida por QR Code ou link

Três páginas públicas de cadastro em 1 minuto, pensadas para o celular. O QR
e o link são a mesma coisa: o QR só carrega o link.

| Página | Para quem | O que acontece |
|---|---|---|
| `/curriculo` | profissional | nome, WhatsApp, e-mail, senha, cidade/UF, função → conta + perfil mínimo → entra logado em `/perfil/editar?boasvindas=1` (com o painel de importar currículo por IA, se a chave existir) |
| `/anunciar` | empresa | nome do estabelecimento, WhatsApp, e-mail, senha, cidade/UF, função da vaga, tipo e uma descrição livre → conta + empresa + **primeira vaga no ar** → entra logado na página da vaga |
| `/comecar` | qualquer | escolhe "sou profissional" ou "sou empresa" e cai numa das duas |

Com `ANTHROPIC_API_KEY`, a descrição livre da vaga vira anúncio completo
(título, descrição, salário, datas, perguntas de triagem) via `estruturarVaga`;
sem a chave (ou se a IA falhar) a vaga é publicada com o texto como está e a
empresa edita depois. Honeypot `site` nos dois formulários.

## Dois QR Codes ou um?

- **Material onde o público é um só** (cartaz na cozinha, adesivo no
  vestiário, folheto no sindicato → profissionais; cartão para donos de
  restaurante, grupo de empresários → empresas): use o QR **específico**.
  Um toque a menos e a mensagem certa no cartaz.
- **Contexto misto** (feira, evento, Instagram, vitrine): use o QR **geral**
  (`/comecar`), que pergunta quem é a pessoa.

## Origem

`?origem=cartaz-balcao` vai para `User.origemCadastro`. Cada material com
uma etiqueta diferente; `/admin/qr` mostra cadastros por origem (profissionais
e empresas). Use isso para saber qual cartaz funciona.

## Gerar QR, link e cartaz

- `/admin/qr`: escolhe destino, etiqueta e selo; baixa **SVG** (gráfica,
  adesivo, vetor) ou **PNG** (redes, WhatsApp); copia o link; "enviar por
  WhatsApp" com a mensagem pronta; abre o cartaz.
- `/cartaz?destino=curriculo&origem=cartaz`: cartaz A4 pronto para imprimir
  (título, QR grande com selo, três passos, link por extenso). Página
  pública sem dados sensíveis.
- `GET /api/qr?destino=…&origem=…&selo=1&formato=svg|png&tamanho=1024`:
  só gera QR para as páginas de entrada do próprio site. Correção de erro
  **H**, então o selo VagaON no centro (15 % do lado) não atrapalha a leitura.

`NEXT_PUBLIC_APP_URL` define o domínio do link (senão `AUTH_URL`, senão
localhost). Confira antes de imprimir: o QR gerado em dev aponta para
localhost.
