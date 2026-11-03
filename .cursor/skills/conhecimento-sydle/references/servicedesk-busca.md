# Busca e indexação (documentação oficial)

Contrato de busca e indexação do SYDLE ONE como a documentação oficial do service desk escreve: pesquisa do operador, `_search`, mapping no Elasticsearch, operações de índice, query, filtro, o recorte de busca do Analytics, indexação por demanda e ordenação com campo dinâmico. A página índice "Buscas e pesquisas" só tem título e seção, sem corpo. Versão, nome de campo e forma da query abaixo são os do artigo que os cita. O Elasticsearch citado no guia de queries é o 7.17.

## Pesquisando informações

Na listagem de objetos de uma classe, a pesquisa simples percorre todos os campos e devolve os objetos que contêm o termo. A pesquisa avançada restringe a um campo e ao termo exato, e aceita mais de um campo ao mesmo tempo. O exemplo do artigo separa o nome que contém o termo do nome exatamente "São Paulo". Toda pesquisa ordena por qualquer campo da classe, entre eles Data de criação e Data da última alteração. A pesquisa global, no topo do workspace, percorre os objetos de todas as classes. O artigo situa essas pesquisas no workspace Explorer.

Não há corpo de query.

## Configuração e execução de pesquisa

O motor das buscas do produto é o Elasticsearch. Na criação e na atualização de um objeto buscável, o conteúdo entra no índice como documento JSON. O índice é a coleção desses objetos. O artigo registra que existem buscas feitas direto no banco, em situações especiais do sistema, e dá como exemplo a deleção de objetos.

Toda classe buscável tem o método Buscar, identificador `_search`, endpoint `<identificador_do_pacote>/<identificador_da_classe>/_search`. A entrada é a query do Elasticsearch. Sem query, nenhum filtro é criado. A saída é o JSON dos objetos que satisfazem a query, já restrito aos objetos que o usuário pode visualizar pelo Obter. Se o nível de acesso do Obter é Explícito, o Buscar segue essa permissão. Se o nível do Obter é Dinâmico, a permissão do Buscar é definida de forma explícita no método.

```javascript
const result1 = _system._user._search();
const result2 = _system._user._search({
    "query": {
        "term": {
            "active": true
        }
    }
});
```

O retorno mantém a mesma forma em qualquer classe. O artigo mostra `timed_out`, `took` em milissegundos, `hits.total` como número, `hits.max_score` e `hits.hits`. Cada hit traz `_type` sempre `"default"`, `_id`, `_score` e `_source`. O padrão são os 10 primeiros, mesmo quando há mais; `size` altera a quantidade. O exemplo de iteração testa `result.hits.total > 0` e lê `hit._source`.

```javascript
const result = _system._user._search();
if (result && result.hits && result.hits.total > 0) {
    result.hits.hits.forEach(function (hit) {
        const user = hit._source;
    });
}
```

Referência no `_source` não traz o objeto referido. O exemplo de Contrato mostra `customer` com `_id`, `_classId`, `classPackageIdentifier` e `classIdentifier`. Dentro da plataforma, o primeiro acesso a um campo da referência dispara o obter; o acesso seguinte usa o objeto já carregado. Busca externa que precise dos atributos da referência obtém essa referência à parte.

```javascript
const result = com.sydle.billing.contract._search();
if (result && result.hits && result.hits.total) {
    const contract = result.hits.hits[0]._source;
    const customerName = contract.customer.name;
    const customerAddress = contract.customer.address;
}
```

Campo de referência só entra na busca pelos campos indexados dele. Em Avançado, Configurações Adicionais do Campo, "Campos disponíveis para busca" tem três opções. "Apenas referência" guarda `_id` e `_classId`, a partir da versão 8.5. "Customizados", a partir da 8.14, escolhe os campos em vários níveis em "Campos de busca customizados" e o artigo diz que essa opção pode incluir campo que não esteja marcado como buscável na classe referenciada. "Filtrar campos por relevância", junto de "Permitir busca em campos até a seguinte relevância", indexa pela relevância do campo na classe referenciada: Identidade; Destaque (Identidade e Destaque); Comum (as três); Avançado (as quatro). Antes dessas opções, o artigo diz que só existia o filtro por relevância. Referência nova nasce permitindo busca apenas por referência. O exemplo Contrato, Pessoa e País escreve: Cliente até Identidade indexa os campos de Contrato e o Nome da Pessoa; até Destaque, também CPF e Telefone; Cliente até Comum com Nacionalidade até Identidade indexa os campos de Contrato, os campos de Pessoa e o Nome do País.

Campo marcado como não buscável não é indexado. A flag existe a partir da 8.5. Em versões anteriores, o artigo diz que todos os campos são indexados, exceto os de relevância Avançado. O uso citado para deixar de indexar é conteúdo extenso que não será pesquisado, como log de integração.

No Obter Metadata, a query de um campo Referência não embutido restringe as opções do rascunho. O valor atribuído já é a cláusula: o artigo diz para não repetir o termo query.

```javascript
_metadata.fields.user.query = {
    "nested": {
        "path": "aclUserGroups",
        "query": {
            "term": {
                "aclUserGroups.name.keyword": "Gerente"
            }
        }
    }
};
```

Interface define um índice comum para as classes padrão que a seguem. Pesquisa na interface devolve os objetos dessas classes. Campo da classe padrão com o mesmo identificador e o mesmo tipo do campo da interface tem o valor armazenado na interface. A interface tem Buscar, Obter metadata e métodos personalizados. Interação de CRUD usa a classe padrão. O exemplo busca a interface e remove na classe concreta.

Instância de processo: a primeira publicação (1.0) cria duas classes com o nome do processo, identificadores `v1_0` (padrão) e `current` (interface). Versão nova cria a classe do rótulo, por exemplo `v2_0`, e atualiza a mesma `current`. As classes de versão seguem `current` e são não buscáveis, então a pesquisa de instâncias sai de `current` e alcança todas as versões. O identificador do pacote é `_process.` mais o identificador do processo, lido em Processo (Modelagem) > Processo. O endpoint de busca é `_process.<identificador_do_processo>/current/_search`. A permissão vem das raias. Versão específica filtra `_processVersion.versionLabel`. Obter, Atualizar e Remover usam a classe da versão, mesmo não buscável: `_process.<identificador_do_processo>/<rótulo_da_versão>/_get`, entrada `_id`. O exemplo de busca e o de obter escrevem `reimbursementClaim`; o exemplo que apaga pelo `_classId` do hit escreve `ReimbursementClaim`.

```javascript
const query = {
    "query": {
        "term": {
            "_processVersion.versionLabel": "1.0"
        }
    }
};
const result = _process.reimbursementClaim.current._search(query);
```

```javascript
const instance = _process.reimbursementClaim.v1_0._get({
    "_id": "5c9b68bad5082ab4bf1ef44c"
});
```

```javascript
const result = _process.ReimbursementClaim.current._search();
result.hits.hits.forEach(function (hit) {
    const instance = hit._source;
    const deleteMethod = _utils.getMethod("_classId", instance._classId, "_delete");
    deleteMethod(instance);
});
```

## Conceitos de indexação

Cada objeto indexável vira um documento no Elasticsearch, preenchido com os campos indexáveis e os valores. Cada classe ou interface indexável tem um mapping; os documentos dos objetos dessa classe seguem esse mapping. O identificador do campo no mapping é o identificador no ONE. Campo com "Buscável" falso não é indexável a partir da 8.5. Em versões anteriores, o artigo diz que campo de relevância Avançada não é indexável.

Tipos, como o artigo mapeia:

- Booleano: `boolean`.
- Data: `date`, também `keyword` e `text` no subcampo `as_text`. O exemplo põe `store` false nesses subcampos.
- Decimal: `double`.
- Decimal marcado como Vetor Denso, a partir da 8.20: `dense_vector`. O exemplo traz `dims` 1024, `index` true, `similarity` `"cosine"` e `index_options` com `type` `"int8_hnsw"`, `m` 16 e `ef_construction` 100. O artigo diz que `index_options` não se altera; o Elasticsearch o configura a partir do Vetor Denso.
- Identificador: `keyword`.
- Número não criptografado: `integer`. Número criptografado: `text` com analyzer `asciiwhitespace` e subcampo `keyword`. Entra o valor mascarado.
- Número longo não criptografado: `long`. Número longo criptografado: a mesma forma texto mais `keyword`, com o valor mascarado.
- Texto simples, internacionalizável ou não: `text` com analyzer `asciiwhitespace`, mais `keyword` e `keyword` com normalizer `asciiwhitespace` (`keyword_normalized`). Texto criptografado indexa o valor mascarado. O internacionalizável ganha outro campo, o identificador com sufixo `_i18n`, e cada idioma no mesmo formato; o exemplo mostra `pt`.
- Texto longo, internacionalizável ou não: `text` e `keyword`, sem o `keyword_normalized` que o texto simples tem. Internacionalizável também ganha `_i18n`. Criptografado indexa o mascarado.
- Dinâmico: `keyword`. O artigo diz que sempre entra uma representação textual do tipo resolvido.
- Coordenada geográfica: `geo_point`.

Arquivo pode indexar `_id` (`keyword`), `contentType`, `name` e `hash` (MD5) como `text`, `keyword` e `keyword` com normalizer `asciiwhitespace`, `length` como `long` e `contentText` como `text` quando o conteúdo foi extraído. A partir da 8.15, "Campos disponíveis para busca" escolhe quais entram. Campo novo, por padrão, inclui Nome, Content Type e Tamanho. Arquivo não múltiplo é `object`; múltiplo é `nested`. Nos exemplos, o `text` desses subcampos usa analyzer `asciiwhitespace` e o `keyword` tem `store` false.

Script indexa `name`, `version` e `language` como `text`, `keyword` e `keyword` com normalizer `asciiwhitespace`; `name_i18n` como o texto internacionalizável; `content` como `text` e `keyword`. Múltiplo é `nested`. Na frase do não múltiplo, o artigo nomeia o tipo Arquivo e o exemplo usa o identificador `campoNaoMultiploScript` com `type` `"object"`. Nesse exemplo, `name_i18n.pt` traz a chave `analyser`; os demais textos do mesmo exemplo usam `analyzer`.

Referência embutida indexa o objeto com os campos indexáveis dentro de quem referencia. Referência não embutida é forçadamente embutida: o objeto referido é obtido e indexado da mesma forma. O documento embutido segue o mapping da classe ou da interface referenciada. A raiz é o primeiro nível. O artigo limita a 4 forçadamente embutidos aninhados e a 7 níveis no total, contando a raiz e os níveis embutidos e forçadamente embutidos. No último nível permitido, referência dali é indexada de forma simplificada, sem nível novo. O artigo aceita, entre outros, raiz mais 4 forçadamente embutidos mais 2 embutidos. Recusa raiz mais 5 embutidos mais 3 forçadamente embutidos, raiz mais 2 forçadamente embutidos mais 1 embutido mais 3 forçadamente embutidos, e raiz mais 4 forçadamente embutidos mais 4 embutidos. Auto-relacionamento, embutidos da mesma classe, tem limite mais restritivo: até 3 embutidos da mesma classe aninhados, ou raiz mais até 2 embutidos da mesma classe. A cadeia permitida no artigo é A embute A embute B embute B embute C embute A embute B. A recusada por A é raiz mais 3 embutidos de A. A recusada por B tem 4 embutidos de B.

Embutido, depois da raiz, indexa por padrão todos os campos buscáveis. A partir da 8.17, "Customizados" em "Campos disponíveis para busca" escolhe os campos em "Campos de busca customizados". Forçadamente embutido usa a mesma configuração do campo. O padrão, "Apenas referência", indexa `_id` e `_classId`. "Customizados" também a partir da 8.17. "Filtrar campos por relevância" vale para o nível imediatamente abaixo. No exemplo, A aponta para B até Identidade e B aponta para C até Comum: o segundo nível de A fica com os campos de Identidade de B, inclusive a referência; o terceiro nível fica com Identidade, Destaque e Comum de C.

Referência não múltipla para classe padrão é `object`; múltipla é `nested`. As duas indexam `_classId` e `_id` como `keyword` e os campos indexáveis do próximo nível, dentro do teto de 4 forçadamente embutidos e 7 níveis. Referência para interface, não múltipla `object` e múltipla `nested`, indexa `_classId` e `_id` como `keyword`, os campos do próximo nível que pertencem à interface, `_concreteFields` como `flattened` e o companheiro textual dos campos que não pertencem à interface. A prosa chama esse companheiro de `_concreteFieldWords` uma vez e de `_concreteFieldsWords` no teto de aninhamento; os exemplos de mapping usam `_concreteFieldsWords`, com `text`, `keyword` e `keyword` de normalizer `asciiwhitespace`. O teto escrito é 3 `_concreteFields` e `_concreteFieldsWords` aninhados. O `flattened` leva os campos desconhecidos a `keyword`, e o artigo também os indexa como texto. Número, número longo e decimal viram representação Long, só rearranjo de bits, e depois texto. Data vira milissegundos desde 1 de janeiro de 1970 às 0:00 e depois texto. Coordenada vira texto de latitude e longitude numa lista.

## Operações de indexação

Indexação assíncrona dispara quando uma classe é alterada ou quando objetos mudam com a estratégia `"queue"`. A operação vira mensagem. Operação complexa que percorre objetos da classe é dividida em intervalos, processados em paralelo. A mensagem que divide os intervalos só inicia o trabalho; o andamento fica no objeto de Acompanhamento de Operação de Indexação. Objeto que falha num intervalo gera operação simples Indexar (INDEX). Se a quantidade ou a proporção de falhas passa do limite da operação, ela é cancelada com erro e os intervalos ainda não processados são descartados. O artigo não escreve o número desse limite nem o limite de tempo do intervalo.

Operações simples, nos objetos:

- Indexar (INDEX): criar ou alterar por `_update()` ou `_patch()` com `_indexStrategy` `"queue"`; chamar `_utils.indexing.reindex()`; falha de operação complexa de reindexação, para o objeto que não foi processado.
- Indexar relacionados (INDEX_RELATED): alterar objeto referido por outros, conforme o nível de busca. Os primeiros 1000 relacionados são atualizados na hora; o restante gera essa operação. No exemplo, `nome` de Usuário tem relevância Identidade e as referências de criador permitem busca até Identidade, então a troca do nome reindexa quem aponta para esse usuário.
- Deletar (DELETE): tira o objeto do índice da classe e de interfaces. Gerada ao deletar por script com `_indexStrategy` `"queue"`.

Reconstruir índice (INDEX_REBUILD) recria mapping, atualiza configurações do índice, recria aliases e indexa os objetos em intervalos INDEX_INTERVAL_REBUILD. É gerada ao marcar "Objetos buscáveis?" como verdadeiro. Em campos: criar campo buscável com valor padrão ou calculado usando estratégia de cálculo na indexação; criar Arquivo; criar Texto com conteúdo "Texto simples"; em campo buscável já existente, alterar identificador, relevância, tipo, multiplicidade, Embutido, Classe referenciada, Criptografado, Calculado, script do calculado, tradução do nome, tradução dos nomes das Opções disponíveis, Campos disponíveis para busca, Permitir busca em campos até a seguinte relevância, Extrair conteúdo, ou Conteúdo do Texto ao remover "Texto simples" ou ao selecioná-lo; tornar buscável um campo que não era. A partir da 8.20, no Decimal: Vetor Denso, e, com Vetor Denso verdadeiro, Dimensões, Tipo de elemento e Métrica de similaridade. Em métodos: script de `_getACL`; nível de acesso de `_search` e de `_get`; ACL de método sobrescrita por extensão de classe. Interrupção: a classe pode ficar com mapping incorreto, e parte dos objetos pode ser indexada com mapping diferente do esperado.

Reconstruir intervalo (INDEX_INTERVAL_REBUILD), a partir da 8.21.0, indexa o intervalo no índice recriado, gera INDEX para o que falhou e atualiza o acompanhamento. Nasce do INDEX_REBUILD, uma por intervalo, ou dela mesma quando o limite de tempo estoura antes do fim do intervalo. Interrupção: os objetos do intervalo podem ficar de fora do índice recriado.

Indexar objetos referenciados (INDEX_EMBOSSER_OBJECTS) atualiza o mapping das classes que têm referência, embutida ou não, para uma classe alterada que passou por reconstrução de índice, e atualiza os objetos dessas classes. A lista de gatilhos repete as criações e alterações de campo do INDEX_REBUILD, com "traduções" no lugar das duas linhas de tradução, e sem "Objetos buscáveis?", sem `_getACL`, sem nível de acesso e sem extensão de ACL. Identifica classes que embutem a classe alterada e gera INDEX_EMBOSSER_OBJECTS_INTERVAL. Interrupção: classes e objetos que embutem a classe podem ficar com mapping desatualizado.

Indexar intervalo de objetos referenciados (INDEX_EMBOSSER_OBJECTS_INTERVAL), a partir da 8.39.0, indexa o intervalo no índice da classe que referencia, com os dados atualizados da classe alterada. Nasce do INDEX_EMBOSSER_OBJECTS ou dela mesma no limite de tempo. Falha vira INDEX. Interrupção: o intervalo pode continuar com os dados anteriores.

Atualizar o mapping da classe (MAPPING_UPDATE) altera o mapping e não reindexa os objetos. É gerada ao criar campo buscável sem valor padrão, que não seja Arquivo nem Texto de conteúdo "Texto simples", e ao tornar um campo buscável nessas mesmas condições. Interrupção: o mapping pode não ser salvo.

Atualizar o mapping de classes referenciadas (UPDATE_EMBOSSER_MAPPINGS) faz o mesmo para quem tem referência, embutida ou não, a uma classe que passou por atualização de mapping, sem reindexar objetos. Os gatilhos são os do MAPPING_UPDATE quando a classe alterada é referenciada por outra. Gera um MAPPING_UPDATE por classe que embute a alterada. Interrupção: essas classes podem permanecer com mapping desatualizado.

Remover interface (INTERFACE_REMOVE) tira os objetos da classe do índice da interface quando uma classe que tem objetos deixa de segui-la. Interrupção: objeto pode continuar listado na interface.

Reconstruir interface (INTERFACE_REBUILD) indexa no índice da interface os objetos de uma classe concreta que passa a seguir uma interface de objetos buscáveis, ou quando muda o nível de acesso de `_get`. Adiciona ou remove objetos em intervalos INTERFACE_REBUILD_INTERVAL. Interrupção: nem todo objeto entra na listagem da interface.

Reconstruir intervalo de interface (INTERFACE_REBUILD_INTERVAL), a partir da 8.39.0, indexa o intervalo no índice da interface, gera INDEX na falha e atualiza o acompanhamento. Interrupção: o intervalo pode não aparecer na listagem da interface.

Remover índice (INDEX_DELETE) apaga o índice da classe quando "Objetos buscáveis?" passa a falso. O artigo não lista impacto de interrupção.

O acompanhamento de operação que percorre objetos nasce no começo e traz Status, Data de início, Data de término e Detalhes. Detalhes de reindexação (8.21.0) identificam a classe reindexada. Detalhes de indexação de objetos referenciadores (8.39.0) identificam a classe referenciadora e as classes alvo. Detalhes de reconstrução de interface (8.39.0) identificam a interface e a classe concreta. O progresso, em todos, traz Total de objetos, Número de objetos indexados, Número de falhas, Progresso, Objetos indexados por segundo, Paralelismo atual, Previsão de término e Tempo total de processamento. Falha fica em Mensagem de erro e Erros.

Status: Em andamento, processa intervalos. Pausada, suspensa e retomável do ponto em que parou. Cancelando, o cancelamento foi pedido. Cancelada, encerrou antes de todos os intervalos. Cancelada com erro, as falhas passaram do limite tolerado. Reiniciando, o reinício foi pedido. Reiniciada, foi substituída por outra, com acompanhamento novo. Concluída, todos os intervalos foram processados. Concluída com erro, os intervalos foram processados e a troca do índice reconstruído falhou.

Métodos de tela: Pausar não cria mensagem nova de intervalo. Continuar retoma a pausada. Cancelar deixa os intervalos restantes sem processar. Reiniciar, a partir da 8.39.0, encerra a atual e abre outra com acompanhamento novo. Alterar paralelismo muda quantos intervalos andam ao mesmo tempo. Forçar recriação das mensagens, a partir da 8.39.0, devolve à fila os intervalos já atribuídos e cria mensagem nova para eles.

## Queries de consulta

A query segue a sintaxe do Elasticsearch 7.17. O artigo aponta Search API e Query DSL dessa versão e descreve os parâmetros que lista.

`size` é a quantidade devolvida. Omitido, vale 10. O máximo aceito é 10000. Quanto maior, mais lenta a pesquisa. Se só a quantidade de hits importa, o artigo indica `size` 0. `from` é o offset a partir do primeiro item; o padrão é 0. A soma de `from` e `size` aceita no máximo 10000. Acima disso, `search_after`: a página anterior entrega em `sort` o valor usado na ordenação, e a página seguinte continua dali. O exemplo ordena por `_id_doc_value`, campo que o ONE cria nos índices para essa paginação, e lê `hit._source._concreteObject` ou `hit._source`.

```javascript
const PAGE_SIZE = 200;
const params = {
    "size": PAGE_SIZE,
    "query": {
        "match_all": {}
    },
    "sort": [
        "_id_doc_value"
    ]
};
let queried;
do {
    const hits = packageIdentifier.classIdentifier._search(params).hits.hits;
    queried = hits.length;
    if (queried) {
        params.search_after = hits[hits.length - 1].sort;
        processItems(hits.map(function (hit) {
            return hit._source._concreteObject || hit._source;
        }));
    }
} while (queried >= PAGE_SIZE);
```

`sort` ordena por um ou mais campos. O corpo mostrado é um objeto, não uma lista: `code` com `order` `"asc"`.

`query` filtra por campo. O exemplo de `term` em `customer.name` usa o valor `"SYDLE"` sem `.keyword`. `match` é a query de texto; o termo passa pelo pré-processamento, e o artigo diz que "SYDLE ONE" e "sydle one" encontram os mesmos objetos. `term` exige o termo exato; em campo Texto, o caminho leva `.keyword`, como `userGroup.name.keyword`. `terms` aceita qualquer um dos valores da lista, também com `.keyword` quando o campo é Texto. `range` usa `gte`, `gt`, `lte` e `lt`. Em data, o exemplo é `saleDate` com `gte` `"now-30d/d"`. `exists` exige ao menos um valor não nulo no campo; campo vazio combina com `must_not`.

`bool` combina cláusulas. `must` precisa ser satisfeita e entra no score. `filter` precisa ser satisfeita, não entra no score e o artigo diz que o resultado vai para o cache. `should` pode ser satisfeita. `must_not` não pode ser satisfeita. O exemplo longo de fatura escreve o `should` de data como string direta (`"saleDate": "now-1d/d"`), enquanto a seção de `range` escreve o objeto com `gte`. Os exemplos com `should` junto de `must` trazem `minimum_should_match` 1.

Texto internacionalizável, idioma fixo: depois do identificador, `_i18n` e a sigla (`pt`, `en`, `es`). `term` no exemplo usa `description_i18n.pt.keyword`. `match` no exemplo usa `description_i18n.en` sem `.keyword`. Idioma atual do usuário: `identificador._current`. O artigo diz que `_current` não é indexado; a consulta é adaptada aos idiomas existentes. Se o idioma atual é português, a busca considera português. Os dois exemplos de `name._current` usam `.keyword`, um em `term` e outro em `match`.

`nested` busca referência múltipla, simples ou embutida. O `path` é o campo, e a query interna repete esse caminho.

```javascript
{
    "query": {
        "nested": {
            "path": "aclUserGroups",
            "query": {
                "match": {
                    "aclUserGroups.name": "Administrador"
                }
            }
        }
    }
}
```

Pessoa com Documentos, referência embutida múltipla: o CPF pedido é `nested` em `documents`, `bool` `must` com `match` em `documents.type.name` `"CPF"` e `match` em `documents.number` com `_input.cpf`, `size` 1. Pessoa sem documento: `bool` `must_not` de um `nested` cujo `exists` usa `field` `"documents"`. Conexão do tipo parceria em que a empresa pode estar em `enterprise` ou `anotherEnterprise`: `must` com `term` em `type.name.keyword` e um `bool` `should` dos dois `name.keyword`, `minimum_should_match` 1, `size` 100. Anexo com conteúdo extraído: o `match` do artigo põe `anexo.contentText` e `operator` `"and"` no mesmo nível.

```javascript
{
    "query": {
        "match": {
            "anexo.contentText": "SYDLE contrato",
            "operator": "and"
        }
    }
}
```

Texto é guardado tokenizado e na forma literal `keyword`. A tokenização do ONE é por espaço. A normalização converte para ASCII básico, sem acento, e para minúsculas; o termo da query de texto completo passa pelo mesmo tratamento. Query de termo exato não processa o termo. O `match` padrão usa OU: um token basta. No exemplo didático, `match` de "Contrato comprado em Paris" em `placeOfSale` devolve os três contratos porque todos têm "contrato"; `match` de "BrAsiL" devolve os que normalizam para "brasil"; `term` em `placeOfSale.keyword` só devolve o texto idêntico, com a mesma caixa; `match` em `.keyword` e `term` no campo analisado, com a frase inteira, devolvem lista vazia. O artigo fecha: resultado relevante usa query de texto completo no campo sem `.keyword`; resultado exato usa query de termo no campo com `.keyword`.

## Utilitário para conversão de filtros

A partir da 8.23, `com.sydle.one.FilterExpression.toESQuery(params)` converte uma FilterExpression em query do Elasticsearch. `filter` é obrigatório. `searchText` é o texto da busca global. `timezone` vale para campo de data; o exemplo usa `"America/Sao_Paulo"`. `sorter` é opcional: `sorter.field` é descrito como ID do campo, e o exemplo completo passa `"name"`; `sorter.order` é `"asc"` ou `"desc"`.

O `filter` muda conforme o objeto embutido. Expressão de Filtro já está no formato e segue direto, `_object.filterExpression`. Busca do Workspace guarda a expressão em `advancedFilter`, `_object.search.advancedFilter`. Filtro Simples passa antes por `com.sydle.one.FilterExpression.convertFiltersToExpression({ filters: _object.filters })`. O retorno é um mapa `expressions` agrupado por id de classe; a chamada seguinte usa `converted.expressions[_object.searchClassId]`. O exemplo de retorno mostra a chave `"ID_DA_CLASSE"`.

```javascript
const queryParams = {
    "filter": _object.filterExpression,
    "searchText": _object.searchText,
    "timezone": "America/Sao_Paulo",
    "sorter": {
        "field": "name",
        "order": "asc"
    }
};
const esQuery = com.sydle.one.FilterExpression.toESQuery(queryParams);
_output.results = _utils.getMethod("_classId", _object.targetClassId, "_search")(esQuery);
```

## Filtros e buscas

Filtro é Campo, Operador e Valor. O campo é o endereço no objeto. Na busca avançada entram os campos visíveis da modelagem. A busca avançada combina as cláusulas com E. "Adicionar filtro OU" agrupa cláusulas em que uma basta. Um ponto azul no botão indica busca ativa. Dá para salvar a busca e compartilhá-la.

Operadores e compatibilidade, como a tabela do artigo:

- Igual e Diferente: todos os tipos, exceto múltiplos e textos longos.
- Menor que e Maior que: todos os tipos, exceto Referência, Booleano, Arquivo e Coordenada geográfica.
- Contém, Começa com e Termina com: texto que não esteja configurado como seleção de opções (`valueOptions`).
- Contido em e Não contido em: todos os tipos.
- Vazio: todos os tipos, exceto múltiplos e informações internas de Arquivo.
- Preenchido: todos os tipos.
- Últimos dias e Próximos dias: Data no formato padrão (Data).

O tipo do valor segue o campo e o operador.

Template de busca é um formulário de busca avançada já montado. O valor do filtro pode ficar vazio. Ao aplicá-lo, o usuário altera os filtros e essa alteração não grava no template. Template criado pelo usuário fica ligado à classe e vale em qualquer analytics dessa classe e na listagem de qualquer workspace; o compartilhamento edita o objeto em Sistema > Busca avançada. Template da view de listagem do workspace só aparece na listagem daquele workspace, e pode ser o padrão carregado sozinho. Template do analytics pode ser o padrão daquele analytics.

Busca segmentada aplica um recorte, por exemplo Inbox ou Não finalizados, e não carrega esses filtros na busca avançada. O usuário não os altera por ali. Cria-se no analytics ou na view de listagem do workspace. No workspace, para grupos específicos de usuário, o artigo diz que também cabe uma query do Elastic além dos filtros. Não nomeia os grupos.

Campo oculto não aparece no filtro. Campo de filtro é buscável: "Buscável" verdadeiro. Campo de referência depende da relevância e de "Campos disponíveis para busca" e "Permitir busca em campos até a seguinte relevância" na referência, e de ser buscável na classe referenciada. Campo oculto na ficha e útil no filtro muda no `_getMetadata`. Com objeto presente, o exemplo esconde o campo na visualização. Sem objeto, o exemplo o mostra. O artigo diz que `_object` nulo é a condição usada para montar a lista de campos do filtro. O identificador do exemplo é `textoculto`.

```javascript
if (_object) {
    _metadata.fields.textoculto.hidden = true;
}
```

```javascript
if (!_object) {
    _metadata.fields.textoculto.hidden = false;
}
```

## Analytics

Analytics monta gráfico e relatório sobre uma classe ou um processo. O que aparece respeita a permissão do usuário sobre os dados. No exemplo de Contrato, valor menor ou igual a R$ 10.000 é acessível a Comercial e a Gerente comercial; valor maior, só a Gerente comercial. A frase do que o Comercial vê, quando não é Gerente, diz valores menores que R$ 10.000. Criar Analytics é liberado por padrão; extensão de classe pode sobrescrever o acesso do método Criar. Usuários e grupos de leitura e de escrita valem para o Analytics, não para os dados.

A classe dos dados define o universo. Extração analítica desliga o agrupamento, fixa a visualização em Tabela e faz cada linha ser um objeto; as colunas escolhem os campos. Busca segmentada é filtro prévio, com a mesma configuração de um filtro, e pode ter uma padrão. Se houver mais de uma, a tela lista os segmentos. Se houver uma, ela é a padrão e a seção de segmento não é exibida. Se não houver nenhuma, entram todos os dados permitidos. Template de busca pode nascer sem valor. Template criado na visualização, mesmo por quem não configura o Analytics, pode ser compartilhado onde a classe é listada.

Agrupador junta objetos com o mesmo valor no campo. Agregador calcula sobre o grupo. Campo numérico: Somatório, Média, Máximo ou Mínimo. A própria classe, marcada com asterisco no exemplo, e referência múltipla: só Quantidade. Distintos, a partir da 8.5, conta valores distintos e usa Cardinality Aggregation com precisão 3000. Até cerca de 3000 o artigo trata como exato; acima, imprecisão de no máximo 3%. Vale para texto, numérico, referência não embutida e posição geográfica. Coluna de extração que é propriedade de referência múltipla, sem função, repete o objeto numa linha por valor. Concatenar, nessa coluna, junta os valores na mesma célula com quebra de linha. Campo numérico nessa coluna aceita as funções dos agregadores. Alias vazio usa o nome do campo com o caminho, no exemplo "Estado > País > Nome". Campo dinâmico usa Painless, pode ser agrupador, agregador ou coluna, e o artigo diz que precisa entrar como agrupador ou agregador para aparecer. Para surgir na escolha, cria-se o campo, salva-se o Analytics e volta-se à edição. O exemplo de expressão é `return doc["identifier.keyword"].value.toUpperCase();`.

Campo de agrupador ou agregador segue a regra do filtro: oculto fica de fora, e o campo é buscável. Agregador numérico é que soma, tira média, máximo e mínimo. Texto com vários valores, no agrupador, pode Concatenar, um grupo com os valores separados por vírgula, ou Dividir, um grupo por valor. Mais de uma classe no mesmo Analytics pede uma classe, no exemplo uma interface que as outras seguem, ou uma referência que já exista. Dado de fora do ONE entra no Analytics depois de estar armazenado no ONE.

Gráfico de pizza: agrupador é a fatia, agregador é o tamanho. Barras: até dois agregadores, duas barras por grupo. Pipeline: agrupador vira coluna; ordenar itens define a ordem dos cards; o agregador aparece no alto do pipe. Arrastar o card exige permissão de edição no objeto e campo agrupador editável. O agrupador não pode ser múltiplo, fica no objeto raiz, não é data nem referência embutida, e não está dentro de embutido múltiplo da raiz. Método no pipeline referencia o contexto de execução como objeto. Seleção em lote pede ao menos um método habilitado a receber vários parâmetros, ou número mínimo de objetos de pelo menos 1. Tabela mostra todos os agrupadores e agregadores; cada linha é a combinação mais fina. Listagem agrupa cards por "Organizado por". Mapa só aparece se houver coordenada geográfica; o agrupador de Coordenada é desse tipo; com agregador, o ponto vira círculo proporcional. Drill down, em pizza e barras, desce o nível do agrupamento; drill up volta pelo caminho ou pelo ícone de casa.

Ordenação das categorias é ascendente ou descendente por campo ou subcampo. A partir da 8.40, quando a ordem é o próprio agrupador e ele é referência, `referenceSortMode` do `sorter` entra em `getTableData`, `getBarChartData`, `getPieChartData` e `getPipelineData`. `ID` usa o identificador interno. `IDENTITY` usa a identidade gravada: maiúscula antes de minúscula, acentuada depois da letra sem acento. `NORMALIZED_IDENTITY` ignora caixa e acento e, no empate, desempata pela identidade gravada. Sem o modo, ou com ele vazio, tabela ordena por `ID` e gráfico por `IDENTITY`. Valor fora da lista faz o método falhar e a mensagem lista os aceitos. Referência vazia fica por último. Identidade com mais de um campo compara um campo por vez, primeiro sem caixa e acento, depois como foi gravado. O exemplo com Nome e Fruta fica: CASA / Abacate, CASA / Banana, Casa / Amora, Casa / Caju. O modo não altera a ordem quando a ordenação é por agregador, o agrupador não é referência, a referência está em embutido múltiplo, a classe referenciada não tem todos os campos de identidade indexados na referência, ou a tabela tem agrupadores em embutidos múltiplos diferentes. Referência vinda de interface: `ID` e `NORMALIZED_IDENTITY` ordenam como `IDENTITY`.

```javascript
{
    "_id": "<id do analytics>",
    "sorter": {
        "field": "<id do campo agrupador>",
        "order": "asc",
        "referenceSortMode": "NORMALIZED_IDENTITY"
    }
}
```

Exportação gera CSV. Reload automático atualiza no intervalo configurado.

## Indexação por demanda

O recurso mantém no Elasticsearch os índices que recebem busca e remove os que não recebem. Classe buscável pode existir sem índice. O uso é acompanhado por rotinas. A remoção olha os dias sem busca e a quantidade de objetos: índice menor sai mais rápido; índice maior tolera mais dias. O artigo não dá a fórmula.

Busca num índice já removido indexa antes de pesquisar. Índice pequeno é reconstruído na hora e a busca segue em seguida. Índice grande é reconstruído de forma assíncrona e o usuário é avisado na hora para tentar de novo depois. "Pequeno" é configurável. O artigo sugere, pelos testes, até 30.000 objetos. Classe buscável nova não ganha índice na criação. Objeto de classe buscável sem índice não é indexado na criação nem na atualização. Consulta só com agrupamento (`aggs`, `count`) não conta como uso. Ver as classes na aba dados não conta; expandir os objetos, quando os hits voltam, conta. Organização hospedada nova não cria índices; os primeiros acessos pelo front e cada listagem de objetos aberta é que disparam a criação. Índice permanente, fora da remoção, configura-se no objeto Indexação da listagem de configuração. O artigo não descreve os campos desse objeto.

## Ordenação customizada em listagem

`getObjectListCards` passa a aceitar campo dinâmico do Elasticsearch na ordenação da listagem. Antes, `searchParams.sorters` recebia campo da modelagem. O parâmetro novo é `searchParams.dynamicFields`, no formato do campo dinâmico de analytics: `_id`, `type` e `expression`. A expressão devolve valor compatível com o `type`. O `sorter.field` pode ser o `_id` de um desses campos dinâmicos. O exemplo usa `type` `"DOUBLE"`, expressão `doc["valor"].value * 1.2`, `order` `"ASC"`, `timezoneId` `"America/Sao_Paulo"`, `from` 0 e `size` 10. O artigo limita o recurso a script: em chamada de API, `dynamicFields` é ignorado.

```javascript
{
    "timezoneId": "America/Sao_Paulo",
    "searchParams": {
        "dynamicFields": [
            {
                "_id": "67d9defa4102cc5c458d5372",
                "type": "DOUBLE",
                "expression": "doc[\"valor\"].value * 1.2"
            }
        ],
        "searchText": null,
        "grouper": null,
        "from": 0,
        "size": 10,
        "sorters": [
            {
                "field": "67d9defa4102cc5c458d5372",
                "order": "ASC"
            }
        ]
    }
}
```
