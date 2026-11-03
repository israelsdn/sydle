---
name: task-breakdown
description: >-
  Quebra especificação de desenvolvimento validada em epic, feature,
  Product Backlog Item e task, no maior detalhe por funcionalidade, com
  mapeamento de classes e confirmação no card. Use quando o usuário pedir
  quebra de tarefa, de task, de PB, de Product Backlog Item, de feature
  ou de epic a partir de uma especificação. Não cadastra no Azure e não
  altera a plataforma SYDLE (só leitura via skill sydle).
version: 1.2.0
---

# Quebra de tarefas

Após a validação de uma especificação de desenvolvimento, monta o plano de
trabalho na hierarquia obrigatória e só fecha depois das confirmações.

Hierarquia:

```
epic → feature → Product Backlog Item (PB) → task
```

PB = Product Backlog Item. Não pular nível. Não inventar nível fora dessa
ordem.

## Detalhe por funcionalidade

Prioridade é cobrir a funcionalidade, não reduzir a quantidade de tasks.
Quebre no maior detalhe útil: uma task = uma unidade verificável de
comportamento, regra, campo, método, permissão, integração ou tela. Não
aglutine funcionalidades distintas para “ficar com poucas tasks”. Quantidade
alta é aceitável quando cada item ainda for claro e testável.

## Gatilhos

Quebra de task/tarefa, especificação validada, Product Backlog Item, PB,
feature, epic, mapeamento de classes para backlog.

## Entradas

- Documento ou texto da especificação já validada.
- Cliente e ambiente(s) cadastrados no `.env` da skill `sydle` quando a
  análise de classes exigir consulta (`TJCE` + `HOM`/`PROD`/`DEV`, etc.).
- Respostas dos cards de confirmação.

Sem especificação, diga o que falta. Sem ambiente cadastrado para uma
consulta necessária, cite o nome da variável ausente
(`SYDLE_<CLIENTE>_<AMBIENTE>_URL`) e não invente host.

## Saídas

- Árvore `epic → feature → Product Backlog Item → task`.
- Mapa de classes: novas versus já existentes em HOM/PROD (e DEV, se
  consultado).
- Alterações propostas por classe (campo, método, permissão, etc.), só
  como plano.
- Confirmações aprovadas ou recusadas.
- Pacote pronto para a skill `register-azure-boards` (handoff). Esta skill
  não cria work item.

## Ordem

1. Ler a especificação. Extrair objetivo, escopo, atores e mudanças
   pedidas.
2. Montar candidatos da hierarquia no maior detalhe por funcionalidade.
   Cada task descreve uma unidade verificável ligada a trecho da spec.
   Não omitir regra, campo, método ou fluxo só para enxugar a lista.
3. Mapear classes e artefatos SYDLE citados ou implicados. Consulta só
   leitura pela skill `sydle`, nos ambientes cadastrados necessários.
   Uma classe: consultar neste agente. Duas ou mais: login neste agente,
   uma vez, se a sessão não existir; depois um subagent `map-sydle-class`
   por classe, em paralelo. Cada um recebe nome, cliente, ambientes e o
   trecho da spec que cita a classe. Juntar os registros curtos no mapa.
4. Separar: classe nova; classe já em HOM/PROD; alteração sensível
   (método padrão, permissão, unicidade, integração).
5. Abrir cards de confirmação (`AskQuestion`) antes de fechar o plano.
   Sem card disponível, perguntar em prosa os mesmos pontos. Não seguir
   como aprovado sem resposta.
6. Ajustar o plano com as respostas. Itens recusados saem ou são
   reescritos e confirmados de novo.
7. Entregar a árvore final, o mapa de classes e o handoff para
   `register-azure-boards`. Não cadastrar no Azure aqui.

## Confirmações obrigatórias

Até 4 perguntas por chamada de card. Primeira opção = sugestão.

Perguntar, no mínimo, se:

1. A quebra em epic / feature / Product Backlog Item / task faz sentido.
2. As classes mapeadas são as corretas (incluir “não consultar / fora de
   escopo” quando couber).
3. As alterações propostas em classes já existentes em HOM ou PROD são
   aceitáveis para seguir no plano.
4. O handoff para cadastro no Azure pode partir desse plano.

Se qualquer confirmação for negativa, não feche o entregável como
aprovado.

## Leitura SYDLE

Use a skill `sydle` para login, sessão e consulta. Só `_get`, `_search`,
`getObjectList`, `_getHistory` e equivalentes de leitura. Não `_patch`,
não gravar classe, não executar método de negócio só para “testar”.

Uma classe fica neste agente. Duas ou mais vão para o subagent
`map-sydle-class` (`.cursor/agents/map-sydle-class.md`), um por classe,
em paralelo, depois do login. O subagent não abre o Edge, não grava
sessão e não altera a plataforma. O mapa usa o registro curto que ele
devolve, sem colar o JSON da API.

Não inventar id de classe, template ou atribuição. Classe não encontrada
fica marcada como não encontrada, com o ambiente tentado.

## Limites

- Só leitura na plataforma.
- Pode acessar ambientes cadastrados via `sydle`.
- Não cadastra epic, feature, Product Backlog Item nem task no Azure.
- Não altera classe, objeto, método, permissão ou pacote.
- Não implementa código da especificação.
- Não pula nível da hierarquia.
- Não agrupa funcionalidades distintas numa task só para reduzir quantidade.
- Não fecha o plano sem as confirmações.
- Com duas ou mais classes, não consulta todas neste agente. O login
  fica aqui; a consulta vai para `map-sydle-class`.

## Verificação

O entregável está pronto quando:

- a hierarquia está completa e nomeada (PB = Product Backlog Item);
- cada task aponta evidência na spec;
- classes citadas foram conferidas no ambiente ou marcadas como não
  encontradas;
- com duas ou mais classes, o mapa é a união dos registros de
  `map-sydle-class`;
- os cards (ou perguntas equivalentes) foram respondidos;
- o handoff Azure está explícito e esta skill não cadastrou nada.

## Critério de falha

Falhou se cadastrou no Azure, se alterou ambiente SYDLE, se inventou
classe ou id, se pulou nível da hierarquia, se entregou plano aprovado
sem confirmação, se omitiu impacto em classe já existente em HOM/PROD
quando a spec a altera, se comprimiu funcionalidades distintas numa
task só para reduzir quantidade, ou se, com duas ou mais classes,
consultou todas neste agente.

## Owner

Israel.
