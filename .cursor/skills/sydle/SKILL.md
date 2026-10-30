---
name: sydle
description: >-
  Conecta, autentica e usa a API e os scripts do SYDLE ONE. Use quando o
  usuário mencionar SYDLE, classe, método embarcado, pacote, ambiente
  (TJCE, MPCE, DEV, HOM, PROD), login, sessão, token, _get, _search,
  _patch ou automação na plataforma.
---

# SYDLE ONE

Cliente e estágio identificam o ambiente (`TJCE` + `DEV`). O link fica no `.env`. A sessão de trabalho é um Bearer gravado em `.sydle-session.json`. Não há usuário nem senha. Token e o header `Authorization` não aparecem em chat, log, código versionado nem mensagem de erro.

## Começar

1. Confirme o par cliente + estágio. Sem o link no `.env`, não chame a API.
2. Nas chamadas, use `obterAuthorizationSessao(cliente, ambiente)`. O retorno já é `Bearer ...`. Não peça usuário nem senha.
3. Escolha o tipo de código:
   - Script que roda **dentro** do SYDLE → [scripts-embarcados.md](scripts-embarcados.md)
   - Tooling Node que chama a API por HTTP → [conexao.md](conexao.md)

## Login

A rota de interface é `{origem}/app/elogroup` em todos os ambientes. Não há usuário nem senha no `.env` nem no fluxo de conexão.

Sem sessão válida, rode `node .cursor/skills/sydle/scripts/login-edge.mjs <CLIENTE> <AMBIENTE>`. Isso abre o **Microsoft Edge** (Windows), captura o token e **fecha o Edge** ao concluir. **Nunca** use o browser integrado do Cursor para login.

Só conecte em ambiente cujo link já foi informado. Links novos chegam aos poucos: cada um vira `SYDLE_<CLIENTE>_<AMBIENTE>_URL`. Sem o link, não invente host.

Detalhe da sessão: [login.md](login.md). O módulo que lê a sessão é [scripts/lib/sessao-sydle.mjs](scripts/lib/sessao-sydle.mjs).

## Achar e ler objetos

| Situação | Caminho |
|---|---|
| Só o nome (ou parte) da classe | `getObjectList` com `searchText`. Não filtrar a meta-classe por `name`. |
| Já tem o `_id` da classe e quer a definição | `POST` na meta-classe `000000000000000000000000` com `{ "_id": "<id da classe>" }` |
| Já tem o `_id` de um objeto | `POST {url}/_classId/<classId>/_get/` com `{ "_id": "<id do objeto>" }` |
| Alterar a definição | `_patch` com `_operationsList` montada no call site |

`classId` no path é a classe da operação. `_id` no body é o objeto. Os dois não se trocam.

Todos os métodos da API, inclusive leitura, são `POST`. Parâmetros vão no body.

`204` é sucesso sem corpo (nenhum objeto casou). `403` é método não autorizado naquela classe; não distingue classe inexistente.

## Escrever código

- Identificadores em português, sem partícula de ligação (`da`, `do`, `de`, `e`). Label visível pode ter preposição. Ver [identificadores.md](identificadores.md).
- Motor do SYDLE: `let` tem escopo de função, não de bloco. Não repetir o mesmo `let` e não declarar `let` dentro de laço.
- Não inventar id de classe, template ou atribuição. Constante vazia e aviso explícito quando o id não foi dado.
- Referência a classe do tipo interface leva `_id` e `_classId`.
- Não persistir (`_create`, `_update`, `_delete`) em rascunho nem em `_getMetadata`.

Modelagem, performance e vocabulário da plataforma: [plataforma.md](plataforma.md).