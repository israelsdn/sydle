---
name: update-agents-md
description: >-
  Atualiza o AGENTS.md deste repositório como índice pedido → skill ou
  regra. Use quando o usuário pedir para atualizar o AGENTS.md, o índice,
  ou incluir uma skill ou regra nova nele. Não é creating-a-skill nem
  create-rule.
version: 1.0.0
---

# Atualizar o AGENTS.md

Mantém o `AGENTS.md` da raiz como índice. Cada linha aponta um pedido para uma skill ou uma regra. O detalhe continua no arquivo apontado.

## Gatilhos

Atualizar o AGENTS.md. Atualizar o índice. Incluir uma skill ou regra nova no AGENTS.md. O índice está desatualizado.

## Entradas

- Pedido explícito para atualizar o `AGENTS.md`.
- `AGENTS.md` na raiz, se existir.
- `.cursor/skills/*/SKILL.md`: campo `name` e `description`.
- `.cursor/rules/*.mdc`: path e a frase do que a regra cobre.

Sem pedido para atualizar o `AGENTS.md`, não grave.

## Saídas

- O `AGENTS.md` da raiz, melhorado.
- Na resposta: linhas que entraram, linhas que saíram, e skill ou regra que ficou de fora, com o motivo.

## Ordem

1. Ler o `AGENTS.md`. Preservar linha que, se faltar, faz o agente errar.
2. Listar cada skill e cada regra. Uma linha de tabela por arquivo.
3. Coluna Pedido: as palavras que a pessoa digitaria. Se a linha já existe, manter a frase. Se a linha é nova, tirar as palavras de gatilho da `description` da skill, ou da frase de abertura da regra. Não resumir o corpo.
4. Coluna Onde: skill `name` com o path `.cursor/skills/<name>/`, ou o path `.cursor/rules/<arquivo>.mdc`.
5. Cortar linha que, apagada, não causa erro.
6. Gravar só `AGENTS.md`.
7. Conferir a verificação abaixo antes de responder.

## Forma do arquivo

```markdown
# SYDLE

Skills e regras do Cursor para o SYDLE ONE. Cliente e estágio identificam o ambiente (`TJCE` + `DEV`). Abra só o arquivo da tarefa.

| Pedido | Onde |
|---|---|
| … | … |

A regra é o recorte curto. O detalhe fica na skill que ela aponta.
```

Estas linhas ficam: o título, a frase do ambiente `TJCE` + `DEV`, "Abra só o arquivo da tarefa", o cabeçalho da tabela, e a frase final sobre a regra ser o recorte curto.

Skill e regra do mesmo assunto continuam em linhas separadas. A skill leva o detalhe. A regra leva o recorte.

## Limites

- Só quando a pessoa pedir para atualizar o `AGENTS.md`.
- Melhora o arquivo que existe. Se o arquivo existir, não reescrever do zero.
- Linha só fica se apagá-la causar erro.
- Não copia corpo de skill nem de regra.
- Não cria skill, regra nem `AGENTS.md` em subpasta.
- Não grava outro arquivo.
- Não documenta carregamento de prompt, `CLAUDE.md` nem `project-knowledge`.

## Verificação

Pronto quando:

- cada `.cursor/skills/*/SKILL.md` e cada `.cursor/rules/*.mdc` tem uma linha na tabela, ou a resposta diz por que ficou de fora;
- o arquivo continua no formato acima, com as linhas fixas;
- a resposta lista o que entrou e o que saiu.

## Critério de falha

Falhou se reescreveu do zero um arquivo que já existia, se copiou corpo de skill ou regra, se omitiu skill ou regra sem dizer, se documentou carregamento de prompt, ou se alterou outro arquivo.

## Owner

Israel.
