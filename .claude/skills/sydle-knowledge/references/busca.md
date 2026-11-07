# Busca

A busca do SYDLE ONE passa pelo método `_search` e segue a query do Elasticsearch. Objeto buscável é indexado como documento JSON; a configuração do campo decide se ele entra no índice, e campo com relevância avançada fica de fora. Este reference reúne o corpo de query, agregação, paginação, score, nested, collapse, caixa, profile, a flag `_esSource` e a estratégia de indexação que muda quando o dado passa a aparecer na busca. Valores de classe e de campo abaixo são os dos artigos ou o placeholder que o próprio artigo já usa.

## Aggregations

Agregação resume os documentos que a query selecionou: quantidade, média, soma, mínimo, máximo ou distribuição. A busca comum devolve os documentos; a agregação devolve o que se conclui sobre eles. No SYDLE ONE isso vai no `_search`, na chave `aggs`. O retorno vem em `aggregations`.

Cada agregação tem um nome escolhido na query. `terms` agrupa por valores distintos de `field`; o `size` interno limita os buckets (os exemplos usam 10 e 20). Métricas citadas, cada uma com `field`: `avg`, `sum`, `min` e `max`. Pipeline aggregation calcula em cima de buckets já gerados; o texto reserva isso para análise avançada e, no dia a dia, fica em bucket e métrica. A `query` filtra primeiro e a agregação corre só nesse conjunto. Sub-agregação é um `aggs` dentro de outro. Na raiz, `size: 0` pede só o resumo, sem os objetos. Bucket traz `key` e `doc_count`. Tratar nulo antes de ler `buckets` ou `value`.

Cuidado com agregação em texto livre ou HTML, com sub-agregação funda e com agregar sem filtrar. O texto prefere campo estável: `_id`, `identifier` e campo controlado.

```javascript
const resultado = _utils.getMethod("_classId", ID_CLASSE_TICKET, "_search")({
    "size": 0,
    "query": {
        "term": {
            "status.identifier": "open"
        }
    },
    "aggs": {
        "ticketsPorSituacao": {
            "terms": {
                "field": "situacao.name.keyword",
                "size": 20
            }
        }
    }
});
```

`ID_CLASSE_TICKET` no artigo é o placeholder `"ID_DA_CLASSE_AQUI"`. O resumo lido no exemplo é `resultado.aggregations.ticketsPorSituacao.buckets`.

## Case sensitive

Analisador padrão passa o texto para minúsculas na indexação e na busca, então consulta em campo analisado ignora maiúsculas e minúsculas. Campo `keyword` não é analisado: a busca exata distingue caixa.

No `term`, `case_insensitive: true` ignora a caixa. O exemplo busca `estado.keyword` com `value` `"bahia"` e aceita variações de caixa desse mesmo texto. A alternativa é uma query `script` que compara `doc['name.keyword'].value.toLowerCase()` com `params.value`. O script roda em cada documento e fica lento em volume grande.

```javascript
{
    "query": {
        "term": {
            "estado.keyword": {
                "value": "bahia",
                "case_insensitive": true
            }
        }
    }
}
```

## Collapse

`collapse` agrupa os hits por um campo e devolve, por chave, o primeiro documento mais bem pontuado ou o primeiro da ordenação. Serve para listar o registro real e esconder repetição. Agregação, no mesmo artigo, serve para métrica e bucket, não para essa listagem.

`collapse.field` tem de ser `keyword` ou numérico, com `doc_values` ativo. O exemplo filtra `match` em `status` `"aberto"`, colapsa `cliente.id.keyword`, ordena `data_criacao` descendente e pagina com `from: 0` e `size: 10`. `inner_hits` (`name`, `size`, `sort`) devolve outros documentos da mesma chave. O exemplo usa `name` `"outros_tickets_cliente"`, `size` `3` e `sort` por `data_criacao` ascendente; no hit, a lista fica em `inner_hits.outros_tickets_cliente`. `track_total_hits` numérico (o exemplo usa `10000`) interrompe a contagem ao atingir o teto. Com `sort` por campo, o score não é calculado; para ter os dois, `"track_scores": true` na raiz.

O total em `hits` continua sendo o total de documentos sem o colapso; a quantidade de grupos distintos fica desconhecida. O colapso vale para os top hits e não altera as agregações. `collapse` não combina com a API de scroll.

```javascript
{
    "query": {
        "match": {
            "status": "aberto"
        }
    },
    "collapse": {
        "field": "cliente.id.keyword"
    },
    "sort": [
        { "data_criacao": "desc" }
    ],
    "from": 0,
    "size": 10
}
```

## dis_max

`dis_max` procura o mesmo termo em vários campos e fica com o maior score de cada documento. `bool.should` com vários `match` soma correspondências e pode colocar na frente quem só repete o termo em mais de um campo.

O corpo é `query.dis_max.queries`, uma lista de queries. O exemplo usa `match` em `name` e em `description`. `tie_breaker` padrão `0` considera só o maior score. Valor entre `0` e `1` soma uma fração do score das outras queries. `1` considera todas por inteiro e se aproxima do `bool.should` do exemplo. O artigo mostra `0.5` mudando a ordem e o `_score`.

```javascript
com.sydle.billing.productCatalog.product._search({
    "size": 3,
    "query": {
        "dis_max": {
            "tie_breaker": 0.5,
            "queries": [
                { "match": { "name": "samsung" } },
                { "match": { "description": "samsung" } }
            ]
        }
    }
});
```

## Elastic Search básico

`match` vale para texto com palavras separadas por espaço: normaliza maiúsculas e tokeniza. Um nome de várias palavras vira a lista desses tokens em minúsculas. `term` busca o valor exato, sem normalização e sem tokenização; o exemplo usa `_id`. Texto com espaços pede o sufixo `keyword` (`name.keyword`) e, nesse campo, maiúscula e minúscula diferem. `terms` tem o mesmo papel do `term` e recebe uma lista de valores.

`bool.must` exige todas as cláusulas. `bool.must_not` exige que não se cumpram; o artigo descreve e não mostra o corpo. `bool.should` aceita qualquer cláusula. No exemplo de dois `match` em `name`, `minimum_should_match: 1` exige pelo menos um.

```javascript
crm.person._search({
    "query": {
        "bool": {
            "should": [
                { "match": { "name": "termo" } },
                { "match": { "name": "outroTermo" } }
            ],
            "minimum_should_match": 1
        }
    }
});
```

No artigo, os dois `match` usam sobrenomes; os textos ficam de fora daqui. O `must` junta `match` em `name` com `term` em `gender` no valor `"Feminino"`. O corpo publicado nesse trecho está com as chaves cortadas; as cláusulas são essas duas.

## Elasticsearch intermediário

Toda classe tem o método buscar. A query devolve o JSON dos objetos da classe que casam. Interface define um índice comum: a busca na interface devolve as classes que a seguem quando o campo da classe padrão tem o mesmo identificador e o mesmo tipo do campo da interface. O hit traz os campos da interface e `_concreteObject` com `_id`, `_classId`, `classPackageIdentifier` e `classIdentifier`.

`size` é a quantidade devolvida. O padrão é 10 e o máximo é 9999; quanto maior, mais lenta fica a busca. `sort` ordena por um ou mais campos; o exemplo ordena `code` com `order` `"asc"`. Dentro de `query`, o artigo nomeia `match` (texto aproximado), `term` (termo exato), `terms` (qualquer valor da lista) e `exists` (o campo tem ao menos um valor não nulo). O corpo de `exists` não aparece.

Não dá para pesquisar campos dentro de `_concreteObject`. Para restringir a classe concreta, o índice tem `_concreteClassId`, usado com `term`. O parágrafo desse exemplo fala na classe pessoa; o id colado no corpo é o mesmo `_classId` que o hit anterior atribui à classe empresa. Na classe concreta que aponta para uma interface, campo que existe na implementação entra por `identificadorDoCampoDaInterface._concreteFields.identificadorDoCampoDaClasseConcreta`. O exemplo é `data._concreteFields.idPortalService`. Campo que já está na interface busca direto no identificador da interface; o exemplo é `additionalData.parentTicket._id`.

```javascript
{
    "query": {
        "bool": {
            "must": [
                {
                    "term": {
                        "_concreteClassId": "59136a2c116a1f0f8819ecbb"
                    }
                }
            ]
        }
    }
}
```

O artigo ainda aponta classes e interfaces, indexação, relevância avançada, tipos de busca, buscas booleanas, referências múltiplas e o método buscar, sem o contrato desses outros textos.

## Flag `_esSource`

`_esSource: true` no corpo do `_search`, no mesmo nível de `size`, faz o hit trazer `_source` e também `_esSource`. Com a flag falsa, `_esSource` vem `null` e `_source` continua.

Além do documento, `_esSource` traz `_acl` (vetor de strings, o aclInbox), a versão i18n dos campos de texto, `_fullClassIdentifier` (`identificadorPacote.identificadorClasse`), `_indexingDate` e `_refTracking` (classes e objetos referenciados). A flag já teve atributo removido ou alterado. O artigo manda usar só para consulta e não apoiar entrega nesses atributos.

```javascript
const sybox = _utils.getMethod("_classId", SYBOX_CLASSID, "_search")({
    "_esSource": true,
    "size": 1
}).hits.hits[0];
```

No exemplo, `SYBOX_CLASSID` é `"000000000000000000000100"`.

## Index strategy

`_create`, `_update`, `_patch` e `_delete` atualizam o banco e, por padrão, o índice na hora. `_indexStrategy` vai no argumento seguinte ao dado. `"default"` é o síncrono e pode ser omitido: o dado fica disponível para busca ao fim da operação. `"queue"` manda a indexação para uma fila: o script não espera o índice, e a busca pode não ver o objeto ainda. A fila precisa de acompanhamento.

O uso mostrado é importação em volume, quando a busca imediata não é necessária. Quando a tela precisa listar o que acabou de ser gravado, o artigo deixa o padrão síncrono. O exemplo de busca logo depois do `_create` síncrono usa este corpo, sem explicar `filter` como cláusula geral:

```javascript
_utils.getMethod("_classId", ID_CLASSE_PESSOA, "_create")(
    pessoaData,
    { "_indexStrategy": "queue" }
);
```

```javascript
_utils.getMethod("_classId", ID_CLASSE_EXEMPLO, "_search")({
    "filter": {
        "_id": objeto._id
    }
});
```

Os dois ids de classe são nomes do artigo, sem valor atribuído.

## match_phrase

`match` encontra documento que contenha alguma das palavras. `match_phrase` exige os termos juntos e na ordem da frase, depois da análise do texto.

`query` é obrigatório e aceita texto, número, booleano ou data. `slop` é inteiro opcional, padrão `0`: máximo de posições entre as palavras. O comentário do exemplo diz que transposição custa 2. O texto chama o analisador de `analyser`; a chave no corpo é `analyzer`. Se faltar, vale o analisador padrão. `zero_terms_query`: `none` (padrão) não devolve documento quando o analisador elimina todos os tokens; `all` devolve todos, no papel de `match_all`. `boost` é float opcional, padrão `1.0`.

```javascript
const buscaExata = _utils.getMethod("_classId", CLASSE_ID_DA_BUSCA, "_search")({
    "query": {
        "match_phrase": {
            "nome_do_campo": {
                "query": textoDaPesquisa,
                "slop": 2,
                "analyzer": "standard",
                "zero_terms_query": "none",
                "boost": 1.5
            }
        }
    },
    "size": 5
});
```

## more_like_this

`more_like_this` acha documento parecido com um texto ou com outro documento. Escolhe termos por TF-IDF e monta a query. Não exige a lista fechada de palavras que um `match` exigiria: descarta palavra comum, monta a similaridade e devolve o que se parece com o texto enviado.

`like` é obrigatório: texto, documento do índice ou documento artificial. `unlike` tira textos ou documentos da referência. `fields` são os campos analisados. Seleção de termo: `max_query_terms` (teto; maior fica mais preciso e mais pesado), `min_term_freq`, `min_doc_freq`, `max_doc_freq`, `min_word_length`, `max_word_length`, `stop_words` e `analyzer` (padrão: o analisador do campo). Formação da query: `minimum_should_match`, `fail_on_unsupported_field` (`true` erra em campo incompatível; `false` ignora o campo), `boost_terms` (peso TF-IDF, ligado com valor maior que 0), `include` (`true` inclui o próprio documento de referência) e `boost`.

`minimum_should_match` numérico exige essa quantidade de termos. Percentual, como `"75%"`, exige essa fração; fração arredonda para baixo (o texto cita 2,25 virando 2). A forma `"3<80%"` exige 80% quando há mais de 3 termos e, no contrário, todos os termos. Termo que não existe no conteúdo sai da conta: se um dos termos da entrada não aparece em documento nenhum, o percentual passa a valer só sobre os termos que restaram. Para não mascarar isso, o artigo passa `minimum_should_match` com a quantidade exata de termos. TF alto no documento pesa mais; termo raro no índice pesa mais; documento longo é normalizado. O texto avisa que isso não garante o melhor item num de-para.

```javascript
const similares = _utils.getMethod("_classId", CLASSE_ID_DA_BUSCA, "_search")({
    "query": {
        "more_like_this": {
            "fields": ["name"],
            "like": textoDaPesquisa,
            "min_term_freq": 1,
            "max_query_terms": 60,
            "minimum_should_match": "40%",
            "analyzer": "standard"
        }
    },
    "size": 5
});
```

O segundo exemplo troca `"40%"` por `quantidadeDeTermos`. `boost_terms: 2` aparece só comentado.

## multi_match

`multi_match` manda uma string para vários campos e aceita boost no nome do campo (`nome_produto^3`, `marca^2`, e o texto também cita `titulo^3`). Diferente do `term`, casa por semelhança de texto, como o `match`.

`operator`: o texto chama `OR` de padrão (basta um termo) e `AND` de todos os termos. O corpo de exemplo grava `"operator": "and"`. `type`: `best_fields` é o padrão e usa o score do melhor campo; `most_fields` soma o score dos campos que casaram; `phrase` exige a frase, com ordem, em cada campo da lista; `cross_fields` trata os campos como um só, para termo repartido entre eles (o exemplo do texto é nome e sobrenome).

```javascript
const objetos = _utils.getMethod("_classId", ID_CLASSE, "_search")({
    "query": {
        "bool": {
            "must": [
                {
                    "multi_match": {
                        "query": "termo",
                        "fields": ["campo1", "campo2", "campo3^2"],
                        "type": "best_fields",
                        "operator": "and"
                    }
                }
            ]
        }
    }
}).hits.hits.map(function (hit) {
    return hit._source;
});
```

O outro corpo do artigo usa `type` `"most_fields"` e os campos `nome_produto^3`, `marca^2`, `descricao_curta` e `tags`, com a query `"tênis de corrida azul"`.

## search_after

`index.max_result_window` limita o tamanho da consulta. O padrão citado é 10000. Dá para alterar o parâmetro; o artigo recomenda paginar com `search_after`.

A paginação depende de um `sort`. Cada hit interno traz `sort` com os valores dessa ordenação. A página seguinte repete a query e o `sort` e envia em `search_after` o `sort` do último hit. O exemplo ordena `date` e `tie_breaker_id`, os dois `"asc"`.

A ordenação não fica estável entre consultas. No empate de score, o Elasticsearch usa um id interno do Lucene, e esse id muda de uma consulta para outra. O artigo pede um point in time: `POST /indice/_pit?keep_alive=1m`, cujo retorno traz `id`; as buscas seguintes mandam `pit.id` e `pit.keep_alive`; ao fim, `DELETE /_pit` com esse `id`. O corpo com PIT no artigo usa `size: 10000`, `track_total_hits: false` e, no `sort` de `@timestamp`, `format` `"strict_date_optional_time_nanos"`. O `id` devolvido é um token longo; não entra aqui.

```javascript
{
    "query": {
        "match": {
            "title": "elasticsearch"
        }
    },
    "search_after": [1463538857, "654323"],
    "sort": [
        { "date": "asc" },
        { "tie_breaker_id": "asc" }
    ]
}
```

Os números de `search_after` são o `sort` do último hit do exemplo, não um parâmetro fixo.

## Profile

`profile: true` na raiz do corpo, fora de `query`, faz a resposta trazer `profile`. O exemplo lê só `.profile`. Serve para ver tempo da query, de cada parte, da busca dos documentos, da recuperação de `_source`, das operações internas e de cada shard. O profiling pesa na execução: o tempo serve para achar gargalo e comparar versões da mesma consulta, não como tempo normal de produção.

Na resposta, `_shards` traz `total`, `successful`, `skipped` e `failed`. `took` é o tempo da busca em milissegundos e não diz em qual etapa foi. `profile.shards` detalha cada shard: `id`, `node_id`, `shard_id`, `index`, `cluster`, `searches`, `aggregations` (vazio se não houver agregação) e `fetch` (carga do documento, inclusive `_source`). Em `searches`: `query` com `type`, `description`, `time_in_nanos` e `breakdown`; `rewrite_time` em nanossegundos; `collector`. `type` é a operação interna em que a query pode ter sido reescrita. `description` liga essa operação ao que foi escrito. O primeiro número a olhar é `time_in_nanos`: 1 segundo = 1.000.000.000, 1 milissegundo = 1.000.000, 1 microssegundo = 1.000.

```javascript
const grupos = _utils.getMethod("_classId", ID_CLASS_INTERFACE_GRUPO_USUARIO, "_search")({
    "profile": true,
    "query": {
        "nested": {
            "path": "aclUserGroups",
            "query": {
                "term": {
                    "aclUserGroups._id": ID_GRUPO_ACESSO_MONITORES
                }
            }
        }
    },
    "size": 5
}).profile;
```

## function_score

`function_score` recalcula o `_score` que ordena os hits. `query` escolhe o conjunto. `functions` é a lista de ajustes; cada função pode ter `filter` e então só vale para quem passa nele.

`weight` aplica um peso fixo aos documentos que passam pelo filtro. `field_value_factor` usa um campo numérico: `field`, `factor` (padrão 1), `modifier` e `missing` (valor se o campo não existir). `random_score` aceita `seed` para repetir o sorteio. `script_score` executa `script.source` com `script.params`; o exemplo é `doc['field1'].value * 2 + params.factor`. Decaimento: `gauss`, `linear` e `exp`, com `origin`, `scale` (distância em que a pontuação cai à metade), `offset` (faixa em que o score fica constante) e `decay`.

`score_mode` junta as funções: `multiply`, `sum`, `avg`, `first`, `max`. `boost_mode` junta esse resultado ao score da query: `multiply`, `replace`, `avg`, `sum`. `max_boost` limita o boost. `min_score` tira documento abaixo desse score. `boost` multiplica a `function_score` inteira. O exemplo completo usa `score_mode` `"sum"`, `boost_mode` `"multiply"`, `max_boost` `5`, `min_score` `1` e `boost` `1.5`.

```javascript
{
    "query": {
        "function_score": {
            "query": { "match_all": {} },
            "functions": [
                {
                    "weight": 3,
                    "filter": {
                        "term": { "category": "books" }
                    }
                },
                {
                    "field_value_factor": {
                        "field": "popularity",
                        "modifier": "log1p",
                        "missing": 1
                    }
                },
                {
                    "gauss": {
                        "date": {
                            "origin": "2026-01-01",
                            "scale": "30d",
                            "decay": 0.8
                        }
                    }
                }
            ],
            "score_mode": "sum",
            "boost_mode": "multiply",
            "max_boost": 5,
            "min_score": 1,
            "boost": 1.5
        }
    }
}
```

O artigo também mostra `field_value_factor` com `factor` `1.2` e `modifier` `"sqrt"`, `random_score` com `seed` `12345`, e `gauss` com `origin` `"now"`, `scale` `"10d"`, `offset` `"5d"` e `decay` `0.5`. Não fixa o padrão de `score_mode` nem de `boost_mode`.

## Nested

Sem `nested`, o índice achata o array de objetos: os valores continuam no documento e a relação entre campos do mesmo item se perde. Com o campo mapeado como `nested`, cada item é um documento interno e as condições valem dentro dele. Usar quando várias condições precisam ser verdadeiras no mesmo item da lista.

`path` e `query` são obrigatórios. A `query` interna (`bool`, `term`, `range` e outras) corre em cada item; o campo interno leva o prefixo do path. `score_mode` é opcional e o padrão é `avg`; o texto cita `max` para o item de maior score pesar mais no pai. `inner_hits` devolve quais itens casaram. `ignore_unmapped: true` evita erro quando o `path` não existe em todos os documentos do índice.

O exemplo busca turma com `term` em `situacao` `"ativo"` e, no path `instrutores`, `term` em `instrutores.instrutor._id` mais `range` `gte` em `instrutores.cargaHorariaAlocada`.

```javascript
const IDENTIFICADOR_DO_INSTRUTOR = "69a82a5cbb770a529e0ed46c";
const CARGA_HORARIA_MINIMA = 50;
const CLASS_TURMA_ID = "699c6a4cbb770a529e4547e5";

const query = {
    "query": {
        "bool": {
            "must": [
                {
                    "term": {
                        "situacao": "ativo"
                    }
                },
                {
                    "nested": {
                        "path": "instrutores",
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "term": {
                                            "instrutores.instrutor._id": IDENTIFICADOR_DO_INSTRUTOR
                                        }
                                    },
                                    {
                                        "range": {
                                            "instrutores.cargaHorariaAlocada": {
                                                "gte": CARGA_HORARIA_MINIMA
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            ]
        }
    }
};

const turmas = _utils.getMethod("_classId", CLASS_TURMA_ID, "_search")(query);
```
