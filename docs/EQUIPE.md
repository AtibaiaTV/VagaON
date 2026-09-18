# Equipe (multiusuário por empresa)

Uma empresa pode ser operada por mais de uma pessoa. Restaurante e hotel
quase sempre têm dono mais gerente mexendo em vaga; antes, a conta era presa
a um único e-mail.

## Papéis

| | Dono | Gerente |
|---|---|---|
| Publicar, editar e encerrar vagas | sim | sim |
| Funil, chat, entrevista, Descobrir, banco de currículos | sim | sim |
| Editar o perfil da empresa | sim | sim |
| Avaliações | sim | sim |
| Ver a equipe | sim | sim |
| Convidar e remover gerentes | sim | não |
| Plano ("Quero o Pro") | sim | não |

O **dono** é quem criou a conta (`Empresa.userId`, único). **Gerentes** ficam
em `Empresa.membros[]` (`userId`, `papel: "gerente"`, `convidadoPor`,
`desde`). Todo mundo da equipe é um `User` com `role: "empresa"` e
`profileId` apontando para a mesma empresa. Máximo de 10 gerentes.

## Como funciona

1. Dono abre **/perfil/equipe** (card "Equipe" no painel e no perfil), informa
   e-mail e nome. Sai um `ConviteEmpresa` com token e validade de 7 dias.
2. Se o Resend estiver ligado, o e-mail vai sozinho. Em qualquer caso a tela
   mostra o link com botões **Copiar** e **WhatsApp**: é o caminho principal
   enquanto `RESEND_API_KEY` não existe em produção.
3. A pessoa abre **/convite/[token]**:
   - sem conta: informa nome e senha, a conta nasce já dentro da empresa e
     entra logada;
   - com conta de empresa do mesmo e-mail e sem outra empresa: aceita com um
     clique (conta da RedeSA sem senha pode definir uma aqui);
   - com conta de profissional, ou operando outra empresa: recusa e pede
     outro e-mail;
   - logada com outra conta: pede para sair antes.
4. Remover gerente tira o acesso na hora (a conta fica, sem empresa).

## Regra de resolução (importante para quem mexe no código)

"Qual é a empresa deste usuário?" é **sempre**
`Empresa.findOne(filtroEmpresaDoUsuario(userId))`, de
`src/lib/servicos/equipe.ts`, que cobre dono ou gerente. Nunca
`Empresa.findOne({ userId })`. O `resolverAtor` já faz isso; páginas e rotas
que consultam a empresa direto usam o filtro.

`session.user.profileId` **não** é mais usado para decidir posse. Posse é
`papelNaEmpresa(empresa, userId)`; dono-only é `exigirDono`. Assim, um
gerente adicionado ou removido depois do login é refletido na próxima
requisição, sem depender do JWT.

## Arquivos

- Serviço: `src/lib/servicos/equipe.ts` (filtro, papéis, convite, aceite, remoção)
- Modelos: `src/models/Empresa.ts` (`membros`), `src/models/ConviteEmpresa.ts`
- API: `GET/POST /api/empresa/equipe`, `DELETE /api/empresa/equipe/convites/[id]`,
  `DELETE /api/empresa/equipe/membros/[userId]`, `GET/POST /api/convite/[token]`
- Telas: `/perfil/equipe`, `/convite/[token]`
- Notificações da empresa vão para a equipe inteira (ver NOTIFICACOES.md)
- Plano: convidar exige `multiusuario` (Pro); no-op com `PLANOS_ATIVOS` vazio

## Fora do escopo por enquanto

- Papéis mais finos (só vagas, só chat).
- Uma pessoa em várias empresas (uma conta = uma empresa).
- Transferir a propriedade da empresa (hoje é manual, pelo admin).
- Admin listar/remover gerentes: a API do admin já devolve `gerentes` por
  empresa; a tela ainda não mostra.
