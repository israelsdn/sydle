---
name: register-azure-boards
description: >-
  Cadastra epic, feature, Product Backlog Item e task no Azure Boards
  depois do login no Edge e das confirmações de destino. Use quando o
  usuário pedir para cadastrar work item, task, PB, feature ou epic no
  Azure, Azure Boards ou Azure DevOps, com plano pronto ou especificação
  a quebrar. Pode quebrar a spec antes (detalhe por funcionalidade via
  task-breakdown). Não usa a plataforma SYDLE.
version: 1.4.0
---

# Cadastro Azure Boards

Cria work items na hierarquia do plano. Login no Microsoft Edge. O link
da organização (`AZURE_DEVOPS_URL`) fica no `.env` da skill. Projeto,
Area Path, Iteration Path e Assigned To só depois de listar na API e
confirmar no card. Só cria; não apaga nem edita item existente.

Se chegar só a especificação (sem plano), quebre antes com a skill
`task-breakdown`: maior detalhe por funcionalidade, sem limitar a
quantidade de tasks. Depois siga o cadastro.

Hierarquia:

```
epic → feature → Product Backlog Item (PB) → task
```

PB = Product Backlog Item. Pode criar os níveis que faltarem, depois da
confirmação, e ligar filho ao pai.

## Gatilhos

Cadastrar task, PB, Product Backlog Item, feature ou epic no Azure;
Azure Boards; Azure DevOps; work item; abrir Edge para Azure.

## Entradas

- Plano/handoff da skill `task-breakdown`, ou especificação validada
  (neste caso, quebrar antes).
- `AZURE_DEVOPS_URL` no `.env` da pasta da skill
  (`.cursor/skills/register-azure-boards/`). Sem essa variável, não há
  host. Se o usuário informar o link, grave no `.env` e só então abra o
  Edge.
- Login no Edge (`scripts/login-edge-azure.mjs`).
- Listagens da API (scripts): projetos, Area Paths, Iteration Paths,
  identities para Assigned To.
- Respostas do card: projeto, Area Path, Iteration Path, Assigned To
  por work item, pais, quais níveis criar, lista final.

Sem plano e sem especificação, diga o que falta. Sem `AZURE_DEVOPS_URL`,
peça o link e grave no `.env` — não invente host e não abra o Edge.
Sem login, rode o Edge e o card de confirmação na mesma hora.

## Saídas

- Work items criados (tipo, título, id, url, área, iteration, assignee).
- Resumo por nível da hierarquia.
- Itens deixados de fora por recusa no card.

## Ordem

1. Se não houver plano confirmado, aplicar `task-breakdown` na
   especificação (detalhe por funcionalidade; quantidade de tasks não é
   teto). Só depois cadastrar.
2. Ler o plano. Se já veio da `task-breakdown` com confirmações,
   respeite-as; só reabra a quebra se o usuário pedir ou se o plano
   estiver incompleto.
3. Garantir `AZURE_DEVOPS_URL` no `.env` da skill. Se faltar, pedir o
   link da organização (ex.: `https://dev.azure.com/<org>`), gravar com
   `gravarUrlAzureDevops` e só então seguir. Não inventar host.
4. Subir `node .cursor/skills/register-azure-boards/scripts/login-edge-azure.mjs`
   em segundo plano. Abrir o card na mesma hora: "O Edge está aberto
   para o login no Azure. Confirme para verificar se a sessão foi
   concluída." Opções: `verificar` / `aguardar`. Nunca usar o browser
   do Cursor.
5. Com sessão válida, listar projetos
   (`scripts/listar-destino-azure.mjs` sem projeto, ou API) e abrir
   card de projeto só com nomes retornados.
6. Com o projeto escolhido, listar Area Paths e Iteration Paths
   (`scripts/listar-destino-azure.mjs --projeto <nome>`). Card de Area
   Path e Iteration Path só com paths da API. Iteration é obrigatória.
   Não inventar path.
7. Para cada work item a criar (epic, feature, PBI e cada task), card
   de Assigned To: opção “sem assignee” ou identity validada via
   `scripts/buscar-identidade-azure.mjs --texto <nome>`. Não inventar
   e-mail nem descriptor.
8. Confirmar a lista final (título + tipo + pai + área + iteration +
   assignee). Sem este sim, não chamar a API.
9. Obter token de sessão (cookie Edge + SessionToken). Não gravar PAT
   no `.env`.
10. Criar na ordem: epic → feature → Product Backlog Item → task, com
    `System.AreaPath`, `System.IterationPath` e `System.AssignedTo`
    quando houver. Tipos padrão Agile; se o projeto usar outros nomes,
    o card define os tipos antes de criar.
11. Devolver ids e urls. Não apagar. Não editar item que já existia.

## Login Edge

Script: [scripts/login-edge-azure.mjs](scripts/login-edge-azure.mjs).

1. Lê `AZURE_DEVOPS_URL` do `.env` da skill. Sem ela, falha.
2. Abre o Edge com perfil temporário e remote debugging (porta padrão
   `9223`, `AZURE_EDGE_DEBUG_PORT`).
3. Abre a URL do `.env`.
4. Espera autenticação (cookies de sessão Azure / página logada).
5. Grava `.cursor/skills/register-azure-boards/.azure-session.json`.
6. Fecha o Edge.

Não pedir senha no chat. Não imprimir cookie nem token. O card libera a
verificação; não usar o fechamento da janela como sinal.

Sessão e `.env` em [scripts/lib/sessao-azure.mjs](scripts/lib/sessao-azure.mjs).
Modelo versionado: [`.env.example`](.env.example).

## Confirmações obrigatórias

Até 4 perguntas por chamada (`AskQuestion`). Primeira opção = sugestão.
Opções de Area, Iteration e projeto vêm da API, não de chute.

1. Link da organização (`AZURE_DEVOPS_URL`), se ainda não estiver no
   `.env` — grave antes do Edge.
2. Projeto (lista da API) + Area Path + Iteration Path (listas da API;
   Iteration obrigatória).
3. Assigned To por work item (busca validada ou “sem assignee”) e quais
   níveis/pais criar.
4. Lista final título/tipo/pai/área/iteration/assignee — último sim
   antes do POST.

Sem `AskQuestion` nesta sessão, use o card do Plan (`CreatePlan`) com
as mesmas escolhas concretas; não substitua por lista em prosa no chat
se o card existir.

## Destino e identities (API)

Scripts determinísticos:

- [scripts/listar-destino-azure.mjs](scripts/listar-destino-azure.mjs) —
  projetos; com `--projeto`, areas e iterations.
- [scripts/buscar-identidade-azure.mjs](scripts/buscar-identidade-azure.mjs) —
  `--texto <consulta>` devolve identities candidatas.

Lib: [scripts/lib/api-azure.mjs](scripts/lib/api-azure.mjs).

## Criação (API)

Script: [scripts/criar-workitems.mjs](scripts/criar-workitems.mjs) +
[scripts/lib/api-azure.mjs](scripts/lib/api-azure.mjs).

Bearer via `WebPlatformAuth/SessionToken` (cookie da sessão Edge; appId
nulo). Sem PAT.

`POST https://dev.azure.com/{org}/{project}/_apis/wit/workitems/${type}?api-version=7.1`

Corpo JSON Patch: `/fields/System.Title`, `System.AreaPath`,
`System.IterationPath`, `System.AssignedTo` quando houver,
`System.Description` quando houver, link
`System.LinkTypes.Hierarchy-Reverse` para o pai.

O plano JSON do script exige `areaPath` e `iterationPath` no root (ou
por item). `assignedTo` por item (string unique name / e-mail) ou omitido
para “sem assignee”.

Só criar. Sem delete. Sem update de item pré-existente nesta versão.

## Limites

- Sem plano, quebra via `task-breakdown` (detalhe por funcionalidade);
  não comprime tasks para reduzir quantidade.
- Não consulta nem altera SYDLE.
- Não apaga work item.
- Não edita work item existente.
- Não inventa organização, projeto, Area Path, Iteration Path, host
  Azure nem identity.
- Não cria sem Area Path, Iteration Path e decisão de Assigned To no
  card (incluindo “sem assignee”).
- Não abre o Edge sem `AZURE_DEVOPS_URL` no `.env`.
- Não usa o browser integrado do Cursor para login.
- Não cria sem o último card de confirmação.
- Não coloca PAT nem senha no `.env` (só o link).

## Verificação

Pronto quando `AZURE_DEVOPS_URL` está no `.env`, a sessão Edge foi
confirmada, Area/Iteration vieram da API e do card, cada item tem
decisão de Assigned To no card, cada item criado nesta rodada tem id e
url, e a hierarquia filho→pai está ligada.

## Critério de falha

Falhou se criou sem card, se apagou, se usou o browser do Cursor, se
inventou destino/host/area/iteration/identity, se criou sem Iteration
ou sem decisão de assignee, se abriu o Edge sem `AZURE_DEVOPS_URL`, se
cadastrou fora da hierarquia, ou se gravou PAT/senha no repositório.

## Owner

Israel.
