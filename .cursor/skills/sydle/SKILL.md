---
name: sydle
description: >-
  Conecta, autentica e usa a API e os scripts do SYDLE ONE. Use quando o
  usuário mencionar SYDLE, classe, método embarcado, pacote, ambiente
  (TJCE, MPCE, SEMAS, DEV, HOM, PROD), login, sessão, token, _get, _search,
  _patch ou automação na plataforma. Não é creating-a-skill nem create-rule.
version: 1.3.0
---

# SYDLE ONE

Cliente e estágio identificam o ambiente (`TJCE` + `DEV`). Abra só o arquivo da tarefa.

| Tarefa | Arquivo |
|---|---|
| Login, sessão, Edge | [login.md](references/login.md) |
| Chamada HTTP | [conexao.md](references/conexao.md) |
| Script que roda dentro da plataforma | [scripts-embarcados.md](references/scripts-embarcados.md) |
| Identifier, label, PascalCase | [identificadores.md](references/identificadores.md) |
| Motor, erro, modelagem | [plataforma.md](references/plataforma.md) |

A sessão é lida por [scripts/lib/sessao-sydle.mjs](scripts/lib/sessao-sydle.mjs). Sem sessão válida, siga o [login.md](references/login.md).

## Gatilhos

SYDLE, classe, método embarcado, pacote, ambiente (TJCE, MPCE, SEMAS, DEV, HOM, PROD), login, sessão, token, `_get`, `_search`, `_patch` ou automação na plataforma.

## Entradas

- Cliente e estágio, no pedido ou no par já usado na sessão.
- `SYDLE_<CLIENTE>_<AMBIENTE>_URL` no `.env` da pasta da skill (`.cursor/skills/sydle/`). Sem essa variável, não há host.
- O pedido: login, chamada HTTP, script embarcado, identifier ou modelagem.

## Saídas

- O arquivo da tarefa, aberto sob demanda.
- Sessão em `.cursor/skills/sydle/.sydle-session.json` quando o login pelo Edge termina.
- Chamada, script ou identifier quando o pedido é esse.

## Limites

- Não pedir usuário nem senha. Não imprimir token.
- Não inventar host, id de classe, template ou atribuição.
- Não abrir o browser do Cursor para login. O login é o Edge, pelo `login-edge.mjs`.
- Ao abrir o Edge, abrir na mesma hora o card de confirmação e só então verificar a sessão. Não esperar a janela fechar. Depois de gravar a sessão, o script fecha o Edge.
- Não persistir em rascunho nem em `_getMetadata`.
- Script embarcado não chama a API por HTTP. Tooling externo não usa `_utils` como se fosse script da plataforma.
- Não gravar outra skill com estes gatilhos.

## Verificação

A sessão vale quando `GET {origem}/api/1/elogroup/sys/auth/validateToken` responde 200, sem imprimir o corpo. Chamada HTTP cita o nome da variável ausente, nunca o valor. Identifier novo não carrega partícula que só liga palavras. Script embarcado segue a ordem do [scripts-embarcados.md](references/scripts-embarcados.md).

O pacote está íntegro quando este arquivo tem `name`, `description` e `version`, a `description` tem até 1024 caracteres, os cinco links acima resolvem e [login-edge.mjs](scripts/login-edge.mjs) continua no path citado.

## Critério de falha

Falhou se conectou sem `URL` no `.env`, se inventou host ou id, se pediu senha, se abriu o browser do Cursor para login, se esperou o Edge fechar para verificar a sessão, se a `description` passou de 1024 caracteres ou passou a narrar o fluxo, ou se um reference aponta para outro reference.

## Owner

Israel.
