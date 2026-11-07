---
name: register-azure-boards
description: >-
  Cadastra epic, feature, Product Backlog Item e task no Azure Boards
  pelo MCP do Azure DevOps, depois das confirmações de destino. Use quando
  o usuário pedir para cadastrar work item, task, PB, feature ou epic no
  Azure, Azure Boards ou Azure DevOps, com plano pronto ou especificação
  a quebrar. Pode quebrar a spec antes (detalhe por funcionalidade via
  task-breakdown). Não usa a plataforma SYDLE.
version: 3.0.0
---

# Register Azure Boards

Cria work items na hierarquia do plano, só pelo MCP `azure-devops`
(`.mcp.json` na raiz, organização `elotech`, domínios `core`, `work` e
`work-items`). Projeto, Area Path, Iteration Path e Assigned To só depois
de listar e confirmar no card. Só cria; não apaga nem edita item
existente.

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
Azure Boards; Azure DevOps; work item.

## Entradas

- Plano/handoff da skill `task-breakdown`, ou especificação validada
  (neste caso, quebrar antes).
- MCP `azure-devops` conectado. A autenticação é do próprio servidor:
  na primeira chamada ele abre o login da conta Microsoft no navegador
  padrão e guarda o token. Não pedir senha no chat.
- Respostas do card: projeto, Area Path, Iteration Path, Assigned To
  por work item, pais, quais níveis criar, lista final.

Sem plano e sem especificação, diga o que falta. Sem o MCP na sessão,
ou com o login dele falhando, pare e diga à pessoa. Não há outro
caminho de cadastro.

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
3. Listar projetos: `core_list_projects`. Card de projeto só com nomes
   retornados. Se a chamada pedir login, avisar que a janela da Microsoft
   abriu e esperar a pessoa concluir.
4. Com o projeto escolhido:
   - times: `core_list_project_teams`;
   - Area Paths do time: `work` com `action: get_team_settings`
     (`areaPaths`, `defaultAreaPath`);
   - Iteration Paths: `work` com `action: list_iterations` (projeto) ou
     `list_team_iterations` (time).
   Card de Area Path e Iteration Path só com paths retornados. Iteration
   é obrigatória. Não inventar path. Área fora do time escolhido: juntar
   os `areaPaths` de `get_team_settings` dos outros times do projeto.
5. Para cada work item a criar (epic, feature, PBI e cada task), card
   de Assigned To: opção “sem assignee” ou identity validada com
   `core_get_identity_ids` (`searchFilter`: nome ou e-mail). Não inventar
   e-mail nem descriptor.
6. Tipos: confirmar os nomes no projeto com `wit_work_item`
   `action: get_type` quando houver dúvida (Agile/Scrum mudam nomes).
7. Confirmar a lista final (título + tipo + pai + área + iteration +
   assignee). Sem este sim, não chamar ferramenta de escrita.
8. Criar na ordem epic → feature → Product Backlog Item → task, um
   `wit_work_item_write` `action: create` por item, com `fields`:
   `System.Title`, `System.AreaPath`, `System.IterationPath`,
   `System.AssignedTo` quando houver e `System.Description` quando
   houver (`format: Markdown`). Guardar o id devolvido de cada um.
9. Ligar filho ao pai com `wit_work_item_link_write` `action: link`,
   `updates: [{ id: <filho>, linkToId: <pai>, type: "parent" }]`. Pode
   ir em lote por nível.
10. Devolver ids e urls. Não apagar. Não editar item que já existia.

Não usar `add_child`: ele não define Assigned To. Não usar `update` em
item que não foi criado nesta rodada.

## Confirmações obrigatórias

Até 4 perguntas por chamada (`AskUserQuestion`). Primeira opção = sugestão.
Opções de Area, Iteration e projeto vêm do MCP, não de chute.

1. Projeto (lista do MCP) + Area Path + Iteration Path (listas do MCP;
   Iteration obrigatória).
2. Assigned To por work item (identity validada ou “sem assignee”) e
   quais níveis/pais criar.
3. Lista final título/tipo/pai/área/iteration/assignee — último sim
   antes da primeira escrita.

Sem `AskUserQuestion` nesta sessão, use o plan mode (`ExitPlanMode`) com
as mesmas escolhas concretas; não substitua por lista em prosa no chat
se o card existir.

## Limites

- Sem plano, quebra via `task-breakdown` (detalhe por funcionalidade);
  não comprime tasks para reduzir quantidade.
- Não consulta nem altera SYDLE.
- Não apaga work item.
- Não edita work item existente.
- Não inventa organização, projeto, Area Path, Iteration Path nem
  identity.
- Não cria sem Area Path, Iteration Path e decisão de Assigned To no
  card (incluindo “sem assignee”).
- Não cria sem o último card de confirmação.
- Não pede senha no chat. Não coloca PAT nem senha no `.mcp.json`.
- Não chama a API do Azure fora do MCP nem faz login por navegador.

## Verificação

Pronto quando projeto, Area e Iteration vieram do MCP e do card, cada
item tem decisão de Assigned To no card, cada item criado nesta rodada
tem id e url, e a hierarquia filho→pai está ligada.

## Critério de falha

Falhou se criou sem card, se apagou, se editou item pré-existente, se
inventou destino/area/iteration/identity, se criou sem Iteration ou sem
decisão de assignee, se cadastrou fora da hierarquia, se gravou PAT/senha
no repositório, ou se cadastrou por outro caminho que não o MCP.

## Owner

Israel.
