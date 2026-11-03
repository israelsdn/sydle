# Conexão com a API

Tooling externo (Node). Scripts embarcados usam `_utils` / `_util`, não HTTP.

## Ambiente

Um ambiente é cliente + estágio. A lista não é fechada: o link chega quando o usuário envia, e só então entra no `.env`. Sem `URL` preenchida, não conectar e não supor o host. Não há usuário nem senha.

```
SYDLE_<CLIENTE>_<AMBIENTE>_URL
```

`URL` vai até a aplicação, sem barra final: `https://<host>/api/1/<aplicacao>`. O login no Edge abre só `{origem}`, o host dessa URL.

O header `Authorization` das chamadas sai de `obterAuthorizationSessao`. A função de chamada recebe `baseUrl` e esse header já montado. Não concatenar `Bearer` ou `Basic` dentro da função. Não logar esse header.

## URL

```
POST {URL}/_classId/<classId>/<metodo>/
```

| Peça | Papel |
|---|---|
| `URL` | Host + `/api/1` + aplicação |
| `classId` no path | Classe em que a operação acontece |
| `_id` no body | Objeto dessa classe |

Meta-classe `000000000000000000000000`: operar a definição das classes. "Buscar a classe X" põe a meta-classe no path e X no body. "Buscar um objeto da classe X" põe X no path e o id do objeto no body.

Há duas formas de endereço. Por id: `{host}/api/1/<aplicacao>/_classId/<id>/<metodo>/`. Por nome de classe de sistema: `{host}/api/1/_system/_class/<metodo>/`. Uma única `URL` terminada na aplicação não serve as duas. Se as duas forem necessárias, a `URL` para em `/api/1` e a aplicação vira parâmetro.

## Qual busca

| Situação | Chamada |
|---|---|
| Definição da classe, id conhecido | `_get` na meta-classe |
| Objeto por id | `_get` na classe |
| Lista via Elasticsearch | `_search` |
| Só o nome ou parte do nome | `getObjectList` (`searchParams.searchText`), a mesma busca do seletor da UI |

Não inventar `_search` na meta-classe filtrando por `name`.

Resposta do `getObjectList`: nome em `card.ids[0]`, pacote em `card.ids[1]`, identifier na feature com `label === "Identificador"`, id em `card._id`. O retorno vem agrupado por data (`groupedCards`), não como lista plana.

## Corpo das chamadas

`_get`:

```json
{ "_id": "<objectId>" }
```

`_patch`: o call site monta `operationsList` como `{ op, path, value }[]`. A função só envia.

```json
{ "_id": "<objectId>", "_operationsList": [] }
```

`_search`: payload nomeado antes do `POST`. Preferir `filter` e `must_not` a `must`. `size: 0` quando só o total importa. `_source: false` quando só os ids importam. Acima de 10.000 itens, paginar com `sort` e `search_after`.

## Respostas

| Status | Significado |
|---|---|
| 200 | Sucesso com corpo |
| 204 | Sucesso sem corpo. Não é erro. Não parsear JSON. |
| 403 | `ERROR_USER_UNAUTHORIZED_TO_EXECUTE_METHOD`. Permissão é por método e por classe. A mesma mensagem aparece para classe inexistente. |

No erro, usar `generalMessages[0].code` e `.text`. `contextMessages` e `_messages` repetem a mesma lista.

Ao falhar credencial, citar o **nome** da variável ausente (`SYDLE_TJCE_DEV_URL`), nunca o valor.
