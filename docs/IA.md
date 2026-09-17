# IA no VagaON (Onda 3)

Quatro recursos, todos opcionais e todos "sugestão que a pessoa revisa":

| Recurso | Quem usa | Entrada | Saída | Onde |
|---|---|---|---|---|
| Currículo → perfil | profissional | PDF, foto ou texto colado | campos do perfil preenchidos para revisão | `/perfil/editar`, painel "Preencher com IA" |
| Frase → vaga | empresa | "preciso de 2 garçons pro sábado, 150 a diária" | formulário de vaga preenchido + suposições | `/vagas/nova`, painel "Descreva a vaga" |
| Triagem | empresa ↔ candidato | até 3 perguntas da vaga; respostas do candidato | respostas no card do funil + resumo/nota da IA | `/vagas/[id]` (funil) |
| Vídeo de apresentação | profissional → empresa | vídeo ≤ 60 s | player no card do deck, no funil e no perfil | `/perfil/editar`, `/descobrir`, `/profissionais/[id]` |

## Ligar e desligar

Uma variável: `ANTHROPIC_API_KEY` (console.anthropic.com). Sem ela:

- os painéis de IA nem aparecem (`iaConfigurada()` é passado do servidor para os componentes);
- as rotas `/api/ia/*` e `/api/candidaturas/[id]/triagem-ia` respondem `503`;
- o funil mostra as respostas de triagem sem resumo;
- todo o resto (perguntas, respostas, vídeo) funciona normalmente.

O vídeo usa o Cloudinary já configurado (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Não depende da chave de IA.

## Como as chamadas são feitas

`src/lib/ia/cliente.ts` — um único ponto de contato com a API:

- SDK oficial `@anthropic-ai/sdk`, modelo `claude-opus-5`, `output_config.effort` `medium` (extração) ou `low` (resumo de triagem);
- **saída estruturada**: cada função tem um schema Zod (`zodOutputFormat`), o JSON é validado de novo no servidor e depois **saneado contra o nosso vocabulário** (chaves de especialidade, UF, turnos, escalas, datas). O modelo nunca escreve direto no banco;
- **prompt caching** no bloco `system` (instruções + taxonomia de 162 especialidades): a partir da segunda chamada o custo de entrada cai bastante;
- **fallback do lado do servidor** ligado (`fallbacks: "default"`): se o modelo recusar por política, a API tenta outro modelo na mesma chamada. Se ainda assim recusar, a rota responde `422` com "preencha manualmente";
- erros do SDK viram `ErroAtor` com mensagem amigável (`503` chave inválida, `429` limite, `502` API fora, `422` conteúdo longo demais ou recusado).

Tamanhos: currículo até 4 MB (limite prático do corpo em serverless); texto colado até 20 000 caracteres; frase da vaga até 2 000.

## Currículo → perfil

`POST /api/ia/curriculo` (multipart `arquivo` e/ou `texto`; só profissional logado) → `PerfilExtraido`.

O arquivo é enviado à API e **não é armazenado** em lugar nenhum. A mesclagem com o formulário é feita no cliente por `mesclarPerfilExtraido` (`src/lib/ia/mesclar-perfil.ts`, pura e testada):

- campo já preenchido é mantido; campo vazio recebe a sugestão;
- especialidades, habilidades, experiências e idiomas são unidos sem duplicar (comparação sem acento/caixa);
- experiências sem data de início entram e são apontadas para revisão;
- o banner mostra o que foi preenchido, o que foi mantido, as observações da IA e um "Desfazer".

Nada é salvo até a pessoa clicar em "Salvar perfil".

## Frase → vaga

`POST /api/ia/vaga` (`{ frase }`; só empresa) → `VagaEstruturada`. O prompt recebe a data de hoje (fuso de São Paulo) e cidade/UF da empresa, para resolver "sábado" e "aqui". A resposta traz `suposicoes` (o que foi decidido por falta de informação) e até 3 `perguntasTriagem` específicas para a vaga. `vagaParaFormulario` (pura) preenche o formulário; a empresa revisa e publica como sempre.

## Triagem

- `Vaga.perguntasTriagem`: até 3 perguntas, 200 caracteres cada (`sanitizarPerguntas`).
- As respostas ficam em `Candidatura.triagem` (`perguntas` no momento da resposta, `respostas`, `respondidaEm`, `ia`). Três caminhos gravam:
  1. botão "Candidatar-me" na página da vaga (as perguntas aparecem antes de enviar);
  2. candidatura rápida (perguntas no formulário);
  3. deck: depois do like numa vaga com perguntas abre uma folha; as respostas vão para `Swipe.respostasTriagem` e são copiadas para a candidatura quando o match fecha (`criarMatch`). Se já existia candidatura para o par, gravam nela na hora.
- Resumo por IA (`resumirTriagem`): gerado **sob demanda** pelo Kanban (`POST /api/candidaturas/[id]/triagem-ia`), um card por vez, só quando a empresa abre o funil, e uma única vez por candidatura (fica gravado). Sem chave, o card mostra só as respostas.
- A nota (1–5) e "vale entrevistar / com ressalvas" são **apoio à leitura**: não movem o card, não entram no score do match e vêm sempre ao lado das respostas originais.

## Vídeo de apresentação

- Upload direto navegador → Cloudinary com assinatura de `POST /api/upload/video` (o corpo não passa pela Vercel, cujo limite é 4,5 MB). O cliente checa tipo, tamanho (≤ 60 MB) e duração (≤ 60 s) antes de subir.
- `Profissional.videoApresentacao = { url, publicId, duracao, enviadoEm }`. O `PUT /api/profissionais/[id]` só aceita URL do nosso cloud na pasta `vagaon/videos` e apaga o vídeo anterior ao trocar/remover.
- Aparece para empresas no card do deck, no card do funil e no perfil. **Some no modo às cegas** junto com a foto. Não entra em nenhuma dimensão do score.

## Limites legais (mesmos princípios do match)

- Prompts proíbem inferir idade, gênero, origem, saúde, família, religião ou aparência; as perguntas de triagem sugeridas seguem a mesma regra e o formulário avisa a empresa.
- O que a IA produz é sempre editável e nunca substitui a decisão humana (perfil, vaga, movimentação no funil).
- Currículos e respostas são enviados à API da Anthropic para processamento; não são usados para treinar modelos (termos comerciais) e o arquivo não é retido pelo VagaON.

## Testar

- `/dev/ia`: componentes de currículo, vaga e vídeo com saída em JSON; botão que simula a mesclagem sem API.
- `/dev/kanban`: cards com triagem resumida, com ressalvas e sem resumo, mais o chip de vídeo.
- Com `ANTHROPIC_API_KEY` no `.env.local`, os fluxos reais funcionam em dev: cada extração custa centavos (Opus 5 + cache do prompt).
