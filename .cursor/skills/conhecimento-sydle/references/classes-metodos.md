# Classes e métodos

Contrato de classes, métodos padrão e padrões curtos de script embarcado extraídos da wiki SYDLE da EloGroup. Onde o artigo não mostra assinatura, corpo ou retorno, o texto não completa. Ids aparecem só quando o artigo os escreve.

## Aplicação

Pacote Sistema, classe Aplicação. Cria uma API interna: identificador, lista de classe e métodos expostos, e tokens (nome, usuário vinculado, token, autenticadores). No avançado: se todos os métodos são acessíveis, restrição por IP, grupo e classe, e se a chamada exige o token configurado. O objeto Service da mesma classe lista, por classe, os métodos permitidos; método fora dessa lista não retorna. O artigo cita o comando AddErrorMessage nos métodos da API e diz que o erro devolve `code` e `text` iguais aos configurados no script. A chamada não aparece no texto.

## Arquivos e métodos utilitários existentes

Importação do helper de classe do government:

```javascript
const ClassHelper = require("government/class.helper.js").init({ "_utils": _utils });
ClassHelper.extendsIf(_object, extendedClassId);
```

Nomes citados, sem corpo, salvo o que está entre parênteses.

CdaHelper: `getOriginalMethod`, `getOriginalAction`, `getSelectedActions`, `getSelectedAction`, `getRootObject`, `defaultGetMetadata`, `defaultSave`, `defaultUpdateDraft`.

UserHelper: `isAdmin()`; `getUserTaskRole(userTask)`; `getPerformers(pin, rolesIdentifiers)`; `getExecutorsEmails(pin, rolesIdentifiers)`; `getUsersFromGroups(groups)`; `getEmailsFromUserGroups(groups)`; `getUsersEmail(users)`; `getEmailsFromAttribution(organizationalUnit, attribution)`; `hasAttribution(attribution, organizationUnit, user)` (com unidade, testa aquela unidade; sem unidade, testa se há atribuição em alguma); `getPermission(organizationalUnit, attribution)`.

ClassHelper: `removeFields(obj, criteria, deepRemove)`; `removeSystemFields(obj, deepRemove)`; `objectDiff`; `translateIdentifierToName`; `planifyKeys`; `objectChanged`; `objectArrayChanged`; `dateChanged`; `fieldSelectedOrChanged`; `fieldChanged`; `hide`; `extendsIf`; `extendsIfActivity`; `extendsIfIsTicketAdditionalData`; `findFieldIndex`; `getMethodScript`; `hasCodeSnippetInMethod`; `cleanCodeSnippet`; `objectIsImplementing`; `isImplementing`. O exemplo de critério é `key => !key.startsWith("_")`.

## Arquivos utilitários

`require()` traz JavaScript externo. Arquivos citados, sem assinatura de função: pasta Dispatcher `apiTramitador.js`, `cda.helper.js`, `dispatchHistory.helper.js`, `notifier.js`, `settings.js`, `ticket.helper.js`; pasta Government `class.helper.js`, `permission.helper.js`, `rhSettings.js`.

## Seções de formulário via metadata

`_metadata.sections.nomeDaSecao.hidden` é booleano. Subseção: `_metadata.sections.nomeDaSecao.subsections.NomedaSubsecao.hidden`. Vale na criação do objeto, porque é metadata.

```javascript
if (!_object) {
    return;
}

if (_object.campo1 === true) {
    _metadata.sections.secao2.hidden = true;
}
```

## Atributo _parent

`_object._parent` é o objeto que referencia o atual. Sem referência, é `null`. A cadeia `_object._parent._parent` existe. Os campos do pai não aparecem na árvore de expressões. Na 8.4 com ECMAScript 2023 o artigo usa `?.`; antes disso, sair se o pai não existir. No obter metadata da classe filha, o exemplo só preenche `valueOptions` depois de confirmar o pai e o campo `tipoDeAnimal`.

```javascript
if (!_object._parent) {
    return;
}
```

## Atualizar rascunho

Roda a cada alteração do rascunho em edição, com um intervalo curto: digitar cinco caracteres pode disparar de uma a cinco vezes. `_oldObject` é o estado anterior. O artigo trata alteração como seleção (um lado vazio e o outro preenchido) ou troca de valor. Em referência embutida, o método da classe de fora roda antes do da classe de dentro e ainda vê o valor anterior do campo interno. O mesmo vale no Salvar: validação da classe externa que leia o embutido como se já fosse o valor novo erra o momento.

```javascript
const Helper = require("Utilitarios/helper.js");

if (Helper.fieldChanged("cpf", _oldObject, _object)) {
    if (_object.cpf.length === 11) {
        validaCPF(_object.cpf);
    }
}
```

`fieldChanged(field, _oldObject, _object)` devolve a seleção ou a troca. O artigo não mostra o corpo de `validaCPF`.

## Objetos que referenciam outro

Na versão 8 o campo `_unembeddedReferences` deixou de existir. A busca usa `_refTracking.referenceObjects` em `_system._objectInterface._search`, com `must_not` no próprio `_id`, ordenação `_creationDate` descendente, `size` 1000 e `from` 0.

```javascript
_system._objectInterface._search({
    "query": {
        "bool": {
            "filter": [
                { "term": { "_refTracking.referenceObjects": idObjeto } }
            ],
            "must_not": [
                { "term": { "_id": idObjeto } }
            ]
        }
    },
    "sort": [{ "_creationDate": { "order": "desc" } }],
    "size": 1000,
    "from": 0
});
```

## Buscar (_search)

Presente em classe buscável. Fala com o Elasticsearch e respeita a permissão do usuário. `_get` recebe um campo único e devolve um objeto ou `null`. `_search` recebe a query e devolve a lista. O Elasticsearch devolve 10 objetos se `size` não vier. O dado do objeto está em `hits.hits[]._source`.

Retorno citado: `timed_out`, `took`, `hits.total` (no exemplo, número), `hits.max_score`, `hits.hits[]` com `_type` sempre `"default"`, `_id`, `_score`, `_source`. Se o acesso de Obter é explícito, Buscar segue essa permissão. Se Obter é dinâmico, a permissão de Buscar é definida no próprio método.

```javascript
const busca = _utils.getMethod("_classId", idClasse, "_search")({
    "query": {
        "term": { "nationality._id": idPais }
    },
    "size": 100
}).hits.hits.map(function (el) {
    return el._source;
});
```

## Campo de moeda dinâmico

Classe Moeda, identificador `_currency`, pacote Financeiro `_finance`, norma ISO-4217. O valor monetário é um decimal. No avançado, tipo Moeda fixa uma moeda; tipo Moeda dinâmico aponta outro campo. O script de exemplo do `_save` lê `_input.valor` e `_input.campoMoeda`, usa `campoMoeda.iso` e grava `_object.valorConvertido`. As taxas do exemplo são ilustrativas; o artigo manda usar serviço ou integração.

## Campos calculados

Nome antigo: campo transiente. Liga-se em avançado, opção Calculado. O valor sai da expressão, pelo atributo `_value`. Não se atribui o campo direto. Momento "Na leitura": recalcula no Obter e na reindexação. Momento "Na escrita": calcula em Salvar, Atualizar Rascunho e Criar Rascunho. O momento é configuração do ambiente; "Na leitura" custa mais. Serve quando o valor precisa mudar mesmo sem edição direta daquele campo.

```javascript
const hoje = new Date();

if (_object.prazo && _object.prazo < hoje) {
    _value = true;
} else {
    _value = false;
}
```

## Classe de métodos de serviço

Campo avançado da classe Web Service: referência a uma classe que segue a interface Métodos de Serviço. Concentra um endpoint por método. O artigo descreve a chamada com identificador do web service, verbo HTTP e sufixo; parâmetros, quando existem, vão dentro de `request`. O prefixo e o Bearer ficam no web service. O texto não mostra o script da chamada. Exemplos nomeados: `updateToken` (GET), login que reutiliza `updateToken()`, e Find Movies (GET mais sufixo).

## Remuneração do beneficiário

Classe `com.sydle.hr.EmployeeRemuneration`. Interface Dados de remuneração do colaborador. Campos: `staffMember`, `type` (`standard` ou `additional`), `baseValue`, `startDate` (se vazia, assume a admissão), `endDate` (nula significa tempo indeterminado), `dateOfRemunerationEffects`, `jobTitle` / `level`, `contractType`, `additionalData`. No cálculo da folha o registro vigente entra em `_input` com a chave em camelCase. Duas classes com o mesmo camelCase ganham sufixo `_idDaClasse`.

`_getMetadata`: embutido em movimentação altera visibilidade e obrigatoriedade de `type`, `endDate` e `staffMember`. Se `lowerBound === upperBound`, `baseValue` fica somente leitura. `editHelp` mostra piso e teto.

`validateRemunerationFields`: bloqueia `startDate` posterior a `endDate`; `baseValue` fora de `lowerBound` e `upperBound` do nível (`salaryLevels` de `positionRole` ou `additionalPosition`); duas remunerações ativas do mesmo tipo com vigência sobreposta no mesmo colaborador. O trecho lança as chaves `ERROR_REMUNERATION_LOWER_BOUND` e `ERROR_REMUNERATION_UPPER_BOUND`.

No `_save` / `_create`: se `startDate` é menor ou igual a agora, chama `refreshStaffMemberFields`. Se `startDate` ou `endDate` é futura, agenda mensagem na fila `methodExecutionQueue` para 2 dias depois do início ou do fim, no começo do dia. O exemplo chama `scheduleMessage({ staffMember, date })`; o artigo não mostra o corpo dessa função.

`getCurrentRemunerationFromStaffMember` busca a remuneração do colaborador numa data de referência ou competência, com a flag `retroativeDate`. A assinatura dos parâmetros não aparece.

## Tags

Tag é instância da classe Tag, pacote utilitários. Quem altera tag no objeto é a classe Tagueamento, não a classe do objeto nem a classe Tag. Ids escritos no artigo: Tagueamento `5f46a00e8e252233d9b04c9d`, Tag `5be9cbdd62edb93f1f6a230b`.

`tag({ object, tag })` falha se a tag já está no objeto. `untag({ object, tag })` não falha se a tag não está. `getTags({ object })` devolve um objeto cujo único campo citado é `tags`, lista das tags. Cada tag do exemplo tem `identifier`, `name.pt`, `private`, `color`, `icon`, `order`, `_id` e `_class`.

```javascript
const tag = _utils.getMethod("_classId", "5be9cbdd62edb93f1f6a230b", "_get")({
    "_id": tagId
});

_utils.getMethod("_classId", "5f46a00e8e252233d9b04c9d", "tag")({
    "object": _object,
    "tag": tag
});
```

## Diálogo de confirmação

`com.sydle.ui.workspaces.Workspace.addConfirmationDialog({ title, message, identifier })`. A execução para e o modal abre. Se o usuário confirma, o script recomeça do início; o `identifier` já confirmado não abre de novo. Vale em Salvar, Criar Rascunho e método customizado. A mensagem pode usar variável do script, inclusive `_user.name`.

```javascript
com.sydle.ui.workspaces.Workspace.addConfirmationDialog({
    "title": "Titulo de exemplo",
    "message": "Mensagem de exemplo",
    "identifier": "confirmation-key"
});
```

## Máscara dinâmica

Propriedade `mask` de campo Texto, apontando para a classe Máscara (`_mask`). No `_getMetadata`:

```javascript
_metadata.fields.textField.mask = _system._mask._get(idDaMascara);
```

Campos da máscara: `name`, `prefix`, `mask`, `clearIfNotMatch`, `dropSpecialCharacters`. Se `_get` devolve `null`, o exemplo cria com `_system._mask._create` e atribui o retorno ao campo. O exemplo de padrão é `"9999"`.

## Metadata alterado por outra classe

Classe de alteração com três campos: Campo, Propriedade (`name`, `placeholder`, `hidden`, `readOnly`, `required`) e Valor. A classe alvo tem um campo embutido múltiplo, no exemplo `alteracaoDeMetadata`. No final do obter metadata, o script monta uma string e executa com `eval`, para não ser sobrescrito pelo resto do script. `name` e `placeholder` entram entre aspas; `hidden`, `readOnly` e `required` entram como valor. Quem preenche a lista é o parent, no exemplo no criar rascunho: cada item tem `campo`, `propriedade` e `valor`.

## Montar query de busca

Classe Consulta em classes, método `[Consulta] Montar query`. O formulário pede a classe e os filtros; o botão Obter devolve a query em texto. Não entram paginação (`from`, `size`), `sort`, `fields` nem omissão de `_source`. Nem toda função do Elasticsearch está nesse utilitário.

## Avaliação

Classes Avaliação e Configuração de avaliação. Avaliação: avaliado, agrupadores, avaliador, valor, tipo NPS (detrator 0 a 6, neutro 7 e 8, promotor 9 e 10), data, motivo, observação, IP de acesso. Configuração: nome, pergunta, possui observação, possui motivo, motivos, nomes dos campos de observação e de motivo. No ticket, a configuração entra na classificação e o ticket precisa fechar com status Fechado. Sem assinatura de método.

## Vetor denso

Configuração de campo Decimal, não um tipo isolado. Dimensões de 1 a 4096. Elemento ponto flutuante ou byte (inteiro de -128 a 127). Métrica cosseno (não aceita vetor só de zeros) ou produto escalar (com ponto flutuante, magnitude 1). Alterar a configuração com registros já gravados reindexa a classe e zera os vetores.

A gravação substitui o array inteiro. Array menor que a dimensão é completado com zeros. Atribuir índice ou usar `push` gera erro.

```javascript
_object.campo_vetor = [1.0, 1.0, -1.0];
```

Busca k-NN em `_search`, dentro de `query.knn`: `field`, `query_vector`, `k`, `num_candidates`. Filtro de negócio fica em `knn.filter`. O artigo diz que o filtro roda antes da métrica.

```javascript
_utils.getMethod("_classId", idClasse, "_search")({
    "query": {
        "knn": {
            "field": "campo_vetor",
            "query_vector": [1.0, 1.0, -1.0],
            "k": 3,
            "num_candidates": 50
        }
    }
});
```

## Markdown dinâmico

Campo texto com avançado markdown, sem valor padrão. O conteúdo é preenchido no atualizar rascunho ou no criar rascunho, com HTML, só se a variável existir. O exemplo grava `_object.markdownDinamico` e interpola `_object.nome` dentro de `sy-alert`.

## Certificado digital

Objeto Certificado Digital / ECM: arquivo `.pfx` e senha. O objeto só é criado se a senha está correta. As datas de validade são preenchidas sozinhas e valem na hora da assinatura. Depois, Preferências do usuário, Segurança, selecionar o certificado. Sem assinatura de método.

## Memória de cálculo do item de remuneração

O script da memória devolve este objeto. `title`, `subtitle`, `result.name`, `result.total` e `finalResult` são string. `calculations` é lista de `{ name, total }`, também strings.

```javascript
return {
    "title": titulo,
    "subtitle": subtitulo,
    "calculations": [{ "name": nome, "total": total }],
    "result": { "name": nome, "total": total },
    "finalResult": resultadoFinal
};
```

O script do item devolve `reference` (`number`, `unit`), `salary`, `discount`, `cost` e `calculationMemoryParams`. A plataforma guarda `calculationMemoryParams` no resultado. A memória lê `_input.result.calculationMemoryParams`. Sem esse objeto, o exemplo da memória não tem `daysInCompetence` nem `totalValue`. O exemplo do item devolve `null` quando não há `calculations.vacation.leaves`.

## Objetos duplicados

Três caminhos no texto: ordenar a listagem, agrupar no Analytics com contagem maior que 1, ou `_search` com `aggs.terms`, `min_doc_count` 2 e `size` 0. O campo do exemplo é `"email.keyword"`. Os buckets vêm em `aggregations.contagem_duplicados.buckets`. O exemplo busca de novo por `term`, fica com o primeiro `_id` e chama `_delete` nos demais. O `catch` do exemplo está vazio. O artigo recomenda campo único e validação no evento Before Save. Arquivo físico duplicado se busca pelo hash, não pelo nome.

## Como escrever um artigo da wiki

Não há contrato de classe ou método.

## URL permanente

`_system._organization.getPermalink` recebe `_id`, `_classId` e `appIdentifier` opcional. O padrão de `appIdentifier` é `"main"`. O retorno usado no exemplo é `output.permalink`.

```javascript
const output = _system._organization.getPermalink({
    "_id": idObjeto,
    "_classId": idClasse,
    "appIdentifier": "main"
});
const permalink = output.permalink;
```

## Importar CSV

Campo de arquivo do exemplo: `cSV`. `getContentAsText("UTF8")`, quebra por `\r\n` ou `\n`, quebra a linha por `";"`, ignora o índice 0. Cada linha seguinte chama `seuPacote.suaClasse.create({ ... })`. O artigo usa `create`, sem underline.

## Promises

A partir da 8.34, em método de classe, no motor GRAAL. O método roda em função assíncrona e aceita `await` no topo, `.then` e `.catch`. A thread continua uma só: Promise não paraleliza. Sem `await` no nível de fora, o código seguinte segue antes do `.then`. `setTimeout` executa a função na hora; existe para biblioteca externa que o chama. Operação pesada dentro da Promise continua na mesma thread.

## Configuração de acesso

Classe de permissão de Documento Oficial, no próprio documento ou herdada do Tipo de Documento. O nível tem de estar em Níveis de acesso permitidos do tipo. Níveis: público, restrito, sigiloso. Restrito: definitiva ou temporária; expiração por prazo ou por fase do ticket; controle herdado do ticket ou explícito (grupos e usuários). Restrição ligada a ticket só em documento que não é avulso. Sigiloso exige fundamentação legal, grau de sigilo e grupos ou usuários. Restrito e sigiloso podem ter controle só de leitura. Restringir acesso ao excluir limita quem vê documento com status excluído. Sem assinatura de método.

## Exibição de métodos

Aba Avançado, Locais de exibição na tela. Lugares: listagem de objetos, Analytics pipeline e objeto (inclui instância de processo). Em cada lugar, menu (três pontos) ou destaque (botão com ícone). Ícone padrão `ti-control-play`; o campo recebe o identificador Themify.

## BLOB e CLOB por banco

`_ecm._databaseConnection.executeQuery({ database, query, params })`. `params` é opcional e substitui `?`. Consulta comum devolve `rows`. BLOB e CLOB não saem por `rows`; só no GRAAL, pelo `resultSet`: `next()`, `getFile(columnName, archiveName, contentType)` e `close()`. Sem `archiveName`, o nome fica `columnName_x`. `getFile` devolve arquivo aceito no upload da plataforma. Também existem `getString`, `getDouble`, `getInt`, `getLong`, `getDate` e `getTimestamp`, todos com `columnName`.

Escrita: `_ecm._databaseConnection.execute({ database, command, params })` para INSERT, UPDATE ou DELETE.

```javascript
const conexao = _ecm._databaseConnection.executeQuery({
    "database": "oracle",
    "query": "SELECT * FROM table FETCH FIRST 10 ROWS ONLY"
}).resultSet;
const arquivo = conexao.getFile("campo_blob", "arquivo_1", "application/pdf");
conexao.close();
```

## Classes que seguem uma interface

A definição de classe é objeto da classe nativa Classe, identificador `_class`, pacote Sistema, id escrito `000000000000000000000000`. A lista `implements` pede busca `nested` em `implements._id`. Busca textual plana no array erra o casamento. O id de interface do exemplo (`65c0f4a89b3f190996b2b5ae`) é o do artigo, não um id fixo da plataforma. O retorno útil no exemplo é `hits.hits` mapeado para `_source`, depois os `_id`.

```javascript
const classes = _utils.getMethod("_classId", "000000000000000000000000", "_search")({
    "query": {
        "bool": {
            "must": [
                {
                    "nested": {
                        "path": "implements",
                        "query": {
                            "term": { "implements._id": idInterface }
                        }
                    }
                }
            ]
        }
    }
}).hits.hits.map(function (el) {
    return el._source;
});
```

## JSON e XML

Biblioteca `fxp.min.js`: `XMLBuilder.build` (JSON para string XML), `XMLParser.parse` (XML para objeto), `XMLValidator` (indica se é XML válido e, se não for, os pontos de erro). `parseTagValue: false` mantém o texto da tag como string. Se o ambiente não tem o arquivo, a adaptação citada para o motor Rhino é: tirar valor padrão de parâmetro de função, trocar `const` por `let` e encerrar com `module.exports = fxp`.

```javascript
const { XMLBuilder } = require("fxp.min.js");
const builder = new XMLBuilder({ "format": true, "indentBy": "    " });
const xml = builder.build(json);
```

```javascript
const { XMLParser } = require("fxp.min.js");
const parser = new XMLParser({ "parseTagValue": false });
const json = parser.parse(xml);
```

## Criação de métodos

Método padrão começa com `_` (`updateDraft`, `_getMetadata`, `_save` e os demais). Método novo tem entrada, saída, nível de acesso e contexto de execução. O artigo pede JSDoc (`@param`, `@returns`). Entrada do exemplo chega em `_input` e a saída vai para `_output`.

`require("hr/helpers")(this)` expõe `getParameter(p, required, defVal)` e `getRef(ref, classId)`. `getParameter`: se `required` e o valor falta ou é `null`, lança exceção; se o parâmetro é `undefined` ou `null`, devolve `defVal`. `getRef` confere se a referência é da classe informada. O id de classe do exemplo está truncado no texto; não é um id utilizável.

## Criar rascunho

Versão citada: 7.5. Roda quando o objeto é exibido e o rascunho é criado, em edição ou não. Atribuição incondicional repõe o valor a cada exibição. Só atribuir se o campo está `null`. Embutido: criar o objeto antes de preencher o filho. O mesmo `|| {}` deixa o embutido aberto sem torná-lo obrigatório.

```javascript
if (_object) {
    if (_object.meuCampo === null) {
        _object.meuCampo = valorInicial;
    }
    _object.endereco = _object.endereco || {};
}
```

## Criar

Versão citada: 7.5. Em classe buscável, cria e persiste. Em classe sem objetos buscáveis, o objeto só existe na execução e serve para validar campos. Parâmetros são opcionais somente se nenhum campo é obrigatório. Criar sempre dispara Salvar da mesma classe. O exemplo, dentro do atualizar rascunho, chama `crm.address._create(_object.endereco)`.

## Contexto de execução

Só no backoffice. Contextos, campo múltiplo: Objeto, Rascunho e Classe. Número mínimo e máximo de objetos só aparece com contexto Objeto; se o único contexto é Objeto, o mínimo é obrigatório. O botão no objeto aberto só surge se o mínimo não é maior que 1. Depois de salvar, a página precisa ser atualizada para o botão aparecer. Seleção fora da faixa exibe erro. No script, a seleção é `_objects` (array). Contexto Classe coloca o método na box da listagem, sem seleção. Menu e destaque são por local. Ícones citados: Themify e Font Awesome.

## Arquivo utilitário

ECM, Arquivo padrão: nome, pasta, marca de arquivo e o `.js`. O export recebe o escopo externo e devolve o mapa de funções. O `require` devolve essa função; o argumento `this` é o contexto do script.

```javascript
module.exports = function (EXTERNAL_SCOPE) {
    const _utils = EXTERNAL_SCOPE._utils;
    return {
        "getPerformers": getPerformers
    };
};
```

```javascript
const arquivo = require("pasta/arquivo.js")(this);
```

O exemplo também lê de `EXTERNAL_SCOPE`: `_object`, `_social`, `_user`, `com`, `_system`, `_process`, `_metadata`. `getPerformers(pin, rolesIdentifiers)` retorna sem valor se falta `pin._class._id` ou se `rolesIdentifiers` está vazio; senão devolve `this.getExecutorsEmails(pin, rolesIdentifiers)`.

## MD5

No executável, `require("../Utilitarios/md5.js")` devolve a função. A chamada do artigo é `md5(texto)` e o uso descrito é hash hexadecimal de 32 caracteres. O exemplo de plataforma aplica a função na string passada. O artigo também mostra `createHash` de `"crypto"`, que não é a chamada do ONE. No Conector PNCP, método Converter, `md5` sobre `registro.descricao` vira `codigoDoItem`. O texto trata isso como identificador determinístico, não como proteção de senha ou de conteúdo.

```javascript
const md5 = require("../Utilitarios/md5.js");
const hash = md5("The quick brown fox jumps over the lazy dog");
```

## Dados adicionais (additionalData)

Em classe protegida, o campo embutido `additionalData` referencia uma interface. A classe nova segue essa interface, é do tipo padrão e não tem objetos buscáveis. Os campos novos nascem nela. Na Configuração do pacote (Sistema, classe Configuração, objeto do pacote, avançado) só cabe uma classe. Se já existe classe selecionada e ela está em uso, os campos entram nela. No `_create`, `additionalData` é um objeto no mesmo nível dos campos da classe protegida.

```javascript
const pessoaCriada = _utils.getMethod("_classId", idClassePessoa, "_create")({
    "name": nome,
    "additionalData": {
        "usuarioNoSistema": usuarioRef
    }
});
```

## Delegação de usuário

Preferências, Gerais, Delegação: usuários autorizados e período. O script busca `_system._userPreferences` com `term` em `user._id`, pega `hits.hits[0]._source` e faz `_patch` com `op` `"replace"`, `path` `"/preferences/0/delegation/"` e `value` `{ authorizedUsers, start, end }`. Cada autorizado leva `_id` e `_classId`. `start` e `end` passam por uma função que faz `toISOString()`, corta os 5 últimos caracteres e concatena `"Z"`. O fim do exemplo é `new Date() + 30`. O `term` do exemplo está escrito com o texto `"pessoa._id"`.

## Delivery Suite

Não há contrato de método embarcado. O artigo é o guia do aplicativo desktop (ambientes, sessão normal ou anônima, doze abas, Workspace IA).

## Formulário de outro método

`com.sydle.ui.workspaces.Workspace.addMethodInputCommand`. Classe Workspace, id escrito `61b8c68e51839b4307dc8edc`, pacote Workspaces. Parâmetros: `_classId`, `methodIdentifier`, `output` (o `_output` atual; a função devolve esse objeto com o comando), `objectId` opcional (obrigatório na prática se o método alvo é de um objeto), `input` opcional para pré-preencher o formulário. O exemplo atribui o retorno a `_output`.

```javascript
_output = com.sydle.ui.workspaces.Workspace.addMethodInputCommand({
    "_classId": idClasse,
    "methodIdentifier": identificadorMetodo,
    "output": _output,
    "objectId": idObjeto,
    "input": parametros
});
```

## Executável do tipo Método

Tipo Método abre Classe e Método. Alguns métodos de sistema são ocultados de propósito. Métodos de extensão de classe entram na lista. O script de pré-execução monta a entrada; se o método não recebe parâmetro, fica vazio. Nesse script há pacotes, classes, métodos, `_utils` e `_user`. A saída mostra entrada, script de saída, tempo e logs. Erro de contexto aparece no campo Mensagens.

## Execução periódica de métodos

Pacote Utilitários, classe Execução periódica de método. Cada objeto escolhe classe, método customizado, script de entrada e cron. O retorno do script vira o `_input` e é avaliado a cada disparo. Sem parâmetro, `return {}`. Contexto Objeto: o mesmo retorno inclui o `_id` da instância. Ao salvar, calcula a data da próxima execução e cria mensagem na fila de execução de métodos. Data diferente do horário esperado indica cron incorreto. Avançado: tentativas e notificação. Executar agora dispara sem esperar o cron. Exemplos de cron: `0 0 0 * * ? *` (todo dia à meia-noite) e `0 0 0 L * ? *` (`L` é o último dia do mês). O exemplo de contagem lê `busca.hits.total.value`. Momento: `require("/_internal/moment")`.

```javascript
const moment = require("/_internal/moment");

return {
    "competencia": moment().format("MMYYYY")
};
```

## Extrator de dados

Extrai de uma classe, transforma em script e carrega noutra. A classe de destino é ligada nela mesma, no campo Extrator de dados, com modificador Volátil. Uma classe, um extrator; um extrator, uma classe. Campos do extrator: nome, identificador, classe de extração, filtros, script, expiração em minutos, paralelismo (Automático obrigatório se a origem é volátil; Manual com valor fixo) e notificações. Dado expirado é regenerado na próxima consulta de Analytics.

No script, `_input.objects` é o lote e `_output.transformedObjects` precisa ter o mesmo tamanho, posição a posição. Cada posição: um objeto (1 para 1), uma lista (1 para N, até 1.000 objetos gerados por objeto de origem) ou `null` (não carrega). Ação de tela: quantidade para pré-visualizar e efetivar carga completa. Via script: `_system._dataExtractor.extractAndLoad({ _id })`. O id do exemplo não é id fixo da plataforma.

## Fluxo definido

Fluxo que segue processo BPM. No Ticket, Status é lista fechada, igual para solicitação ad-hoc ou não. Fase é marco pré-definido dos serviços ad-hoc. Situação é cadastrada pelo Gestor de Serviços Executáveis, aponta uma Fase e um Status, e ao aplicá-la altera os dois. No fluxo definido, a modelagem usa a API do Tramitador para escolher a situação. O texto não lista as operações nem mostra assinatura.

## Fluxos ad-hoc

Tarefas sem sequência pré-definida. Status, Fase e Situação seguem o mesmo contrato do fluxo definido. Etapa de atendimento liga fase e situação. Dá para criar situação na fase Em tramite e situações de encerramento nas fases Encerrado e Confirmação de Encerramento. A fase Confirmação de encerramento não foi implementada por completo. Sem assinatura de método.

## Formulário de assinantes

Classe embutida do sybox Docusign, sem objetos buscáveis. Campos: `name`, `document`, `email`, `customTabs`. O texto marca `email` como obrigatório. `customTabs` customiza a assinatura daquele assinante. O exemplo de tab:

```javascript
{
    "signHereTabs": [
        { "anchorString": "LOCAL_ASSINATURA_1" }
    ]
}
```

A âncora é um texto no documento, no exemplo `{{LOCAL_ASSINATURA_1}}`.

## Formulário de ação

Interface Dados padrões dos formulários de ação, id escrito `6050f5bc3c3fc611b2c72ea0`. Os campos aparecem em `resolverPendencia()`. No exemplo BPM: `documento` (referência, oculto), `acaoDoAssinante` (texto, obrigatório), `justificativaDaDevolucao` (texto, oculto), `senha` (texto). `processarPendencia()` roda quando `resolverPendencia()` roda e, ao fim, a pendência sai de nova para concluída.

O exemplo, se `acaoDoAssinante === "Assinar"`, chama `sign` na classe do documento oficial com `password`, `document` e `signatureType` de id `5dfd33d4ad0ab2006cf56bfd` (comentário do artigo: login e senha). Em seguida `_system._queueMessage.addItem({ sender, subject, body, schedulingDate, tryNow })`. No exemplo, `sender` é `_user._id`, `subject` é `_process._processInstance.triggerSignal`, `schedulingDate` é `null`, `tryNow` é `false`, e `body` traz `signal` mais `signalIdentifier`.

## Formulários de métodos

Exibição: Nenhuma (só script, padrão), Menu (três pontos) ou Destaque (ícone Themify). Locais de menu: listagem, objeto e rascunho. Formulário de entrada: Obter Metadata (obrigatório, oculto, somente leitura), Alterar Formulário (valores) e Criar Formulário (valor antes de exibir). O valor está em `_input` pelo identificador do campo; também existem `_oldInput` e `_object`. Formulário de saída só tem Obter Metadata; o script grava em `_output` pelo identificador.

## Função perform

`perform()` existe no topo do JavaScript do método. Desvia para os scripts seguintes. Ao voltar, `_object`, `_input` e `_output` refletem esses scripts. Só a primeira chamada dentro de um script desvia. Em interceptor, `perform()` chama o método original.

Em `_updateDraft` e `_save`, a última execução de `perform()` persiste e devolve o objeto persistido. Não há outra gravação no fim dos scripts; outra gravação pede um `_update` explícito. No exemplo, o log de `_id` é `null` antes do `perform` e um id depois. A assinatura persistida citada no log é `"Signed By: ONE!!"`, valor montado antes do `perform`. O script ainda atribui `"SYDLE ONE"` depois, e o artigo diz que essa etapa não gera nova persistência.

```javascript
_object.signature += "!!";
perform();
```

## Logs personalizados

A partir da 8.5, em `_utils.logging`. `Marker.getMarker(nome)` cria marcador. `Logger.getLogger(nome)` cria logger; sem nome, o nome padrão é `"onelogprefix"`. `info`, `warn` e `error` recebem pelo menos a mensagem; o marcador é parâmetro extra. Nos exemplos, `info` recebe a string, e `warn` e `error` recebem o marcador e depois a mensagem ou o objeto. A classe Log fica no Sistema; a busca filtra por marcador ou pelo logger.

```javascript
const logger = _utils.logging.Logger.getLogger("Programa");
const marker = _utils.logging.Marker.getMarker("Execução");
logger.info("Conteúdo da mensagem de informação");
logger.error(marker, "Erro de execução");
```

## Gestão de conteúdos do portal

Processo genérico de conteúdo do portal, achado no ambiente citado `elogroup-dev`, sybox `6425d997ebe84a5629b5d9eb`. Ids escritos: Conteúdo do portal `640899ca439a3e33b599bc2f`; Conteúdo - Edição de conteúdos `641b060445bf9f1fbf3ef5d2`; Dados de conteúdo `641360e285e624557b784b24`; Status do conteúdo `641b21c7b6305d41b8860a12`; publicado `641b21f10f7b015c5806954f`; inativo `641b21daa82f2c12fb6551a5`; rascunho `641b21fba82f2c12fb6ba69d`; arquivo de campos da interface `6418ab27f5e5d82b2d48c171`; extensão de salvar `6418aba0f5e5d82b2d4f2b84`.

`criar novo tipo de conteúdo`, na interface conteúdo do portal, pede nome, classe que segue Dados de Conteúdo, grupos e usuários de editar/criar e de gerir. O identificador dos campos da interface não muda; mudar cria outro campo na classe concreta. O nome visível pode mudar.

Métodos padrão do tipo, sem script adicional: Abortar processo de edição (contexto objeto; encerra o processo e tira a tag de edição); Criar novo (contexto classe); Inativar (status, data de publicação, data de inativação e objeto de serviço do portal); Iniciar processo de edição (tag e novo processo). Obter controle de acesso, Obter metadata e Atualizar rascunho aceitam mais scripts. Atualizar rascunho preenche o autor na primeira vez. Publicar no portal não está implementado: o script termina em `throw` pedindo implementação. Republicar todos republica todos os conteúdos. Sem permissão de criar em classe alguma, o início do processo dá `throw`. A raia dos gestores sai das permissões de Publicar no portal. O objeto nasce rascunho e, publicada, fica publicado.

## Assinatura em lote legada

Migração para pendência. No `start()` da atividade, persistir a referência na tarefa: a pendência é cancelada se a tarefa executar. Classe escrita `60d4bef45d6e586e752a2afa`, método `adicionarPendencia`, parâmetros `officialDocument`, `action` (`_id` e `_classId`), `executorUser`, `comment` e `sender` opcional. O `_id` e o `_classId` de `action` do exemplo são os do guia (`69b2f96866bfcf6010ed04b2` e `604f67ad3c3fc611b2b3b8f4`).

No `end()`, `cancelarPendencia({ pendencia, justificativa })`. A listagem da assinatura em lote filtra `status.keyword` igual a `"Nova"`, além de `action._id` e executor (usuário ou grupo), com `minimum_should_match` 1 e `size` 1000. Sem o status, pendência já resolvida entra na lista e a segunda assinatura do mesmo documento falha.

```javascript
_utils.getMethod("_classId", "60d4bef45d6e586e752a2afa", "adicionarPendencia")({
    "officialDocument": documentoOficial,
    "action": { "_id": idAcao, "_classId": idClasseAcao },
    "executorUser": usuarioExecutor,
    "comment": "Pendencia criada via BPM",
    "sender": remetente
});
```

## Histórico da ação

Classe que registra ação de documento oficial, venha ou não de pendência. Campos: `officialDocument` (obrigatório), `actionType` (obrigatório, relevância identidade), `documentVersion`, `numberVersion` (inteiro, oculto), `data` (informações complementares). Método `registrarHistorico`, acesso EXPLICIT. O JSDoc cita `documento`, `tipoDeAcao` (com `_id`), `formulario` e retorno do histórico criado. O corpo não está no texto.

## Histórico (_getHistory)

Método padrão. Duas chamadas no artigo: `_system._class._getHistory({ "_id": id })` e `_utils.getMethod("_classId", idClasse, "_getHistory")({ "_id": id })`. Também aparece `_utils.getMethod(packageIdentifier, classIdentifier, "_getHistory")`. A tabela diz que `_id` é o id da classe. Os exemplos seguintes passam o id do objeto (`objectId`, `pessoaId`) e leem `_lastUpdateDate` do objeto e de cada item.

O retorno é Iterator: `hasNext()` e `next()`. Não é array e não vem ordenado. O exemplo por data ignora item posterior à data pedida, recusa data posterior a `_lastUpdateDate` do objeto atual e, sem item anterior, lança `"Não existe histórico anterior a essa data."`. Sem histórico, a mensagem do exemplo é que a classe não contém histórico.

```javascript
const historico = _utils.getMethod("_classId", idClasse, "_getHistory")({
    "_id": idObjeto
});

while (historico.hasNext()) {
    const item = historico.next();
}
```

## Identidade com campo calculado

Campo de relevância Identidade, calculado, com `_value` montado de outros campos. Este artigo diz que o cálculo é na escrita, a cada salvamento no banco. O artigo de campos calculados diz que o momento (leitura ou escrita) é escolha do ambiente.

```javascript
_value = _object.codigoDoItemDoMaterialServico + " - " + _object.nomeDoMaterialServico;
```

O exemplo original usa interpolação e `?.` nos dois campos.

## Importar planilha xlsx

Biblioteca `xlsx.mini.min.js` na classe Arquivo do ECM. Conferir se o arquivo já existe antes de incluir outro. `getContentAsBase64()` no campo arquivo, `XLSX.read(data, { type: "base64" })`, primeira aba em `workbook.SheetNames[0]`, `XLSX.utils.sheet_to_json`.

```javascript
const XLSX = require("xlsx.mini.min.js");
const data = _input.planilha.getContentAsBase64();
const workbook = XLSX.read(data, { "type": "base64" });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const lines = XLSX.utils.sheet_to_json(worksheet);
```
