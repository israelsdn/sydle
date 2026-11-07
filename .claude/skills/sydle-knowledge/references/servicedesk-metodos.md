# Métodos e scripts (documentação oficial)

Contrato de métodos, ciclo de vida, motor de scripts e utilitários extraído da referência técnica oficial do SYDLE ONE (service desk), seção Métodos e scripts. Onde o artigo não mostra assinatura, retorno ou literal, o texto não completa. Ids aparecem só quando o artigo os escreve. O índice "Métodos e scripts" não traz contrato e não vira seção.

## Ciclo de vida dos métodos de leitura e escrita

Caminho de leitura e gravação quando o script chama `pacote.classe._metodo`. O objeto vive em dois espaços. Publicado é o objeto validado, versionado, em geral indexado e compartilhado: `_create`, `_update`, `_patch`, `_delete`. Rascunho é cópia de trabalho, por usuário, leve e privada: `_createDraft`, `_updateDraft`, `_patchDraft`, `_deleteDraft`. `_publish` pega o rascunho e executa um `_create` ou um `_update`; se a escrita publicada sucede, descarta o rascunho.

Storages internos: `object` (publicados, fonte da verdade), `draft`, `history`, `indices` (busca; também o único lugar dos objetos de classe volátil), `files`.

Classe indexada (opção Buscável): a escrita grava no banco e manda o objeto ao índice. `_get` lê do banco; `_search` lê do índice. Classe não buscável: a indexação é pulada; `_get` por `_id` ou campo único continua valendo; `_search` não enxerga o objeto. Classe volátil (`VOLATILE`): o objeto vive só no índice. `_create` grava direto no índice, `_update` reindexa, e tanto `_get` quanto `_search` leem do índice. Métodos nativos de classe volátil, como o `_save`, precisam ser não extensíveis (`NON_EXTENSIBLE`) e não aceitam interceptor. Rascunho e histórico nunca são indexados. Rascunho se acessa pelo `_id`.

No script de escrita: `_object` é o objeto em gravação e pode ser alterado antes de persistir; depois de persistido, passa a refletir o gravado, com `_id` e datas. `_oldObject` é o estado anterior, somente leitura, e vem vazio na criação. `_input` são os parâmetros da chamada. `_user` alimenta `_creationUser` e `_lastUpdateUser`. `_context` é somente leitura e traz `user` (o mesmo `_user`), `organization`, `request`, `locale` e, para embutido, `objectPath` (exemplo do artigo: `additionalData.addresses[0]`). `_object._parent` existe no embutido e é nulo ou ausente na raiz; também existe em `_oldObject._parent`; é somente leitura. `perform()` marca o antes e o depois da escrita.

`_getACL` calcula, para o usuário atual, quais métodos daquele objeto ele pode executar. Entra na autorização da operação e pode ser chamado para decidir botões. `_getMetadata` descreve campos, tipos, validações e métodos; toda escrita o aciona na normalização. Com `_getMetadata` próprio, a forma pode ser dinâmica, inclusive nos embutidos. `pacote.classe._save(...)` não existe. A lógica compartilhada por `_create` e `_update` fica no `_save`. Exceção ou validação no `_save` interrompe a persistência. `_patch` e `_patchDraft` também não podem ter script próprio; a lógica fica no `_save`.

Não há flag de objeto novo. Criação é `_oldObject` vazio; atualização traz o estado anterior.

```javascript
if (!_oldObject._id) {
    return;
}
```

Embutido: `_object._parent` é nulo na raiz e aponta o pai no embutido; dá para subir `_object._parent._parent`. O pai não é cópia congelada: é o estado em andamento no instante em que o filho roda. A cascata é profundidade primeiro, pai antes do filho. O filho lê o que o pai já calculou no `_save`. O pai não vê valor que o filho só produz no próprio `_save`; esse cálculo tem de estar no pai ou já vir no `_input`. Rascunho valida pouco, não gera histórico, não indexa e não controla concorrência.

Interceptor é script que entra antes dos scripts do método, na mesma fila síncrona: interceptors, depois scripts do método e, na escrita, a persistência por último. Não há como pular o método principal. O interceptor executa o próprio código ou lança exceção, e a exceção aborta a fila inteira, inclusive a persistência. Só método extensível aceita interceptor. O padrão é extensível; `NON_EXTENSIBLE` recusa. Entre interceptors do mesmo método, o campo `order` (inteiro, crescente) decide. Entre extensões de classe, `priority` (padrão 10) decide; empate desempata pela data de criação da extensão. No exemplo do artigo, dois interceptors com prioridade 10 são ordenados só pelo `order`: o de ordem 0 entra inteiro antes do de ordem 1, e só então os scripts da classe.

`perform()` na escrita aplica validação, normalização, regras de escrita e gravação. Antes dele: ajustar `_object`, validar, interromper. Depois dele, o objeto daquele fluxo já foi gravado; alteração em `_object` não muda a escrita. Serve para efeito colateral. No embutido, o `perform()` do filho só marca a fronteira; a gravação do documento inteiro ocorre quando a cascata disparada pelo `perform()` da raiz termina. Se o script não chama `perform()`, a plataforma chama ao final. A persistência não depende da chamada manual. `perform()` só conta uma vez por script; chamadas seguintes não abrem outra fronteira. Interceptor pesado soma latência no caminho da operação. O artigo pede pré-`perform()` enxuto e, no pós-`perform()`, fila ou segundo plano para efeito que não precisa segurar a requisição.

A execução é pilha. O trecho antes de `perform()` de cada script empilha na ordem interceptor (`order`, depois índice do script) e depois scripts do método. `_object`, `_input` e `_oldObject` são repassados já atualizados. A gravação ocorre uma vez, no fundo, depois do último "antes". O pós-`perform()` desempilha na ordem inversa: quem entrou por último retoma primeiro. Quem desempilha já vê o objeto persistido. Mudar `_object` em qualquer pós-`perform()`, inclusive no interceptor que empilhou primeiro, não altera o gravado. Exceção em qualquer script ou interceptor interrompe os seguintes e, na escrita, impede a persistência.

Ordem da escrita publicada (`_create`, `_update`, `_patch`, `_delete` e `_publish`, este reaproveitando `_create` ou `_update`): evento ANTES; script (`_save` no publicado, com `perform()` na fronteira); estrutura e validação via `_getMetadata`, onde o campo calculado na escrita é avaliado e gravado; regras de escrita (`_revision`, objeto protegido, histórico, quem referencia); gravação; indexação se a classe for indexada, acumulada até o flush; evento DEPOIS.

Campo calculado: `ON_WRITE` na normalização da escrita, gravado no banco, é o que o `_get` devolve e o ponto de partida da indexação. `ON_INDEX` só ao montar o documento de busca, não fica no banco, e entra no custo por objeto da indexação pontual, de relacionados e de reconstrução. `ON_READ` está descontinuado: a plataforma rejeita criar campo calculado na leitura.

`_get` busca por `_id` ou por qualquer campo de valor único, devolve o objeto atual ou `null`, vale para classe não buscável e lê do banco, salvo classe volátil, que lê do índice. `_search` consulta o índice (filtros, `from`/`size`, ordenação, total), só acha classe indexada e não vê rascunho. Antes de consultar, faz flush das indexações pendentes daquela classe na requisição atual, com a ressalva de `queue`. Se a classe é interface, o flush cobre as implementações. Por padrão o índice só localiza; o `_source` de cada hit vem do banco. `_esSource: true` pede o `_source` como está no índice.

A estratégia de indexação vai no segundo argumento da escrita, no campo `_indexStrategy`. O artigo documenta `queue`, sem diferenciar maiúsculas: grava agora e enfileira uma indexação simples, consumida depois.

```javascript
pacote.classe._create({
    "ativo": true
}, {
    "_indexStrategy": "queue"
});
```

O flush efetiva o que ficou acumulado: no fim da requisição; ao atingir limite de quantidade, tamanho ou tempo em memória; ou ao fazer `_search` da mesma classe na mesma requisição. Objeto gravado com `queue` não é garantido por esse flush do `_search`. Aparece quando a fila for consumida.

Na atualização, `INDEX` reindexa só o objeto (é o que `queue` gera). `INDEX_RELATED` reindexa o objeto e quem o referencia, porque o documento de busca do referenciador guarda cópia denormalizada do rótulo e dos campos embutidos à força. A propagação olha os campos que mudaram, a relevância (`ONLY_OBJECT`, inclusive relevância só de sistema; `ALL`; ou filtrada até a relevância buscada pelo referenciador) e se a referência denormalizada daquele referenciador inclui de fato um campo alterado. Os primeiros referenciadores, por padrão na ordem de 1000, vão síncronos. O restante vira `INDEX_RELATED` na fila de indexação simples, com progresso retomável (última classe e objeto, restantes, iteração).

Ao montar o documento, a plataforma roda o `_getACL` do objeto (script; se vazio, cai na ACL explícita) e os encoders de campo: rótulos, calculados `ON_INDEX`, extração de conteúdo, tags em lote, e campos de sistema (`_id`, `_class`, data de indexação, rastreamento de referências, achatamento de interface). Esse código roda por objeto indexado, por referenciador na reindexação de relacionados e por todos os objetos numa reconstrução (`INDEX_REBUILD`), inclusive quando muda o script do `_getACL` ou o nível de acesso de `_get` e `_search`. A ACL fica congelada no documento até o objeto ser reindexado de novo. O artigo pede `_getACL` auto-contido nos campos do próprio objeto e dos embutidos. Basear a ACL em outra estrutura, grupo externo ou em quem executa `_user` / `_context.user` grava a permissão do instante da indexação, não da leitura. Se a permissão depende de estrutura externa, o código que muda essa estrutura é quem precisa disparar a reindexação.

Cenários que o artigo destaca:

- `_create`: sem concorrência, nasce com `_revision` inicial, sem histórico. Indexação, se buscável, só deste objeto, no flush.
- `_update` regrava o objeto; campo não enviado vira nulo. `_patch` aplica operações e entra no mesmo fluxo. Concorrência por `_revision`: se o enviado não é o do banco, a atualização é rejeitada. `_patch` recarrega, reaplica e tenta de novo até um limite. `_update` devolve o erro na hora. Edição publicada gera histórico se a classe tem histórico ativo, guardando o estado anterior. A reindexação pode propagar a quem referencia, conforme os campos alterados.
- `_delete` é operação protegida; objeto protegido não é deletado. Os scripts dos embutidos rodam e podem impedir a deleção. Quem referencia é tratado pela modelagem: anula a referência ou apaga o referenciador em cascata. Nessa cascata, o referenciador é removido sem o ciclo de `_delete` da classe dele. Histórico daquele objeto e rascunhos associados também saem.
- `_createDraft` cria do zero ou a partir de um publicado, quando recebe o `_id`; nesse caso guarda referência ao original. Validação leve: somente leitura, unicidade e alguns tipos. Embutido obrigatório vazio não fica nulo: a plataforma cria um filho em branco e desce até uma profundidade limitada, que o artigo não numera. `_create` e `_update` não fazem esse esboço; embutido obrigatório vazio na escrita publicada é erro de validação. Sem histórico, sem índice, sem concorrência.
- `_updateDraft` regrava o rascunho; `_patchDraft` aplica operações. Não altera o publicado e não gera histórico. O `_revision` do rascunho só serve à publicação.
- `_deleteDraft` remove o rascunho. O publicado vinculado permanece. Rascunho também cai após 7 dias sem edição, ou quando o publicado vinculado é deletado.
- `_publish({ "_id": idRascunho })`: sem publicado apontado, equivale ao `_create` completo; com publicado apontado, equivale ao `_update` completo, conferindo o `_revision` guardado no início da edição. Conflito rejeita a publicação. O rascunho só é descartado se a publicação sucede. Se a validação completa falha, o publicado não muda e o rascunho continua.
- Embutido faz parte do documento do pai e não tem campos de sistema próprios de data, usuário e revisão; esses são do objeto de topo. Referência guarda ponteiro: salvar o pai não dispara script, validação nem gravação do referenciado. No publicado, `_create` e `_update` do pai descem `_save` em cada embutido, não `_create` nem `_update`. `_createDraft` desce `_createDraft`. `_updateDraft` desce `_updateDraft`; filho novo roda `_createDraft` e depois `_updateDraft`. `_patchDraft` desce `_patchDraft`. `_delete` desce `_delete`. `_deleteDraft` não roda script nos filhos. A tabela do artigo não lista `_patch` nem `_publish` como operação que desce. A navegação é pai, depois cada item de lista embutida na ordem do array; a montagem do documento final sobe dos filhos para o pai; grava-se um documento. `_context.objectPath` indica o ponto (exemplo: `additionalData.addresses[1]`). Erro de qualquer nível reprova a gravação inteira. A profundidade da cascata tem limite, sem número no artigo. Campo comum e referência não viram nó.
- Formulário de método não é objeto. Há parâmetro de entrada e de saída. Na tela, as ações são Publicar e Cancelar. Abrir faz `_createDraft` do `_input`; editar faz `_updateDraft` ou `_patchDraft`; a forma vem do `_getMetadata`. Variáveis: `_input` no papel de `_object`, `_oldInput` no papel de `_oldObject`, além de `_object`, `_objects`, `_user` e `_utils`. Publicar roda um `_save` de validação e normalização e invoca o método-alvo; o formulário não vira objeto publicado. Se o alvo é `_create`, `_update` ou `_publish` de uma classe, é esse método que grava. Cancelar faz `_deleteDraft` e não invoca o alvo. O retorno vira formulário de saída. Validação de tela não substitui regra que precisa valer sempre que o objeto for gravado; essa fica no `_save` da classe do objeto.

Rascunho expira em 7 dias, é visível só para quem criou, e o método que desce nos embutidos é o mesmo chamado (`_createDraft` e os demais da tabela). Publicado grava no espaço compartilhado, valida por completo, gera histórico no `_update` e no `_patch`, indexa se buscável, controla concorrência por `_revision` e desce `_save` (create/update) ou `_delete`.

## Configurar motor de classe de sistema

Recurso marcado como temporário para trocar o motor de scripts de métodos e campos de uma classe de sistema, independente do motor padrão da organização, enquanto a migração ainda encontra erro não mapeado. O artigo descreve o caminho de tela: objeto de configuração da organização, menu de métodos, "Configurar motor de classe do sistema", escolher as classes e o motor. Não mostra assinatura.

## Métodos utilitários (_utils)

`_utils` está no contexto do script. O catálogo abaixo é o que este artigo assina. Vários itens só apontam outro guia e não trazem parâmetros aqui: `ResponseHelper` (o contrato de resposta HTTP está no artigo de respostas customizadas), `file.pdf.PdfReader`, `_utils.logging` (somente v8.5), `_utils.sybox.SyboxRepoConfigs`, `_utils.zip`, `_util._fileHelper`, `_utils.security.crypto`, `_utils.security.token` (o artigo de token detalha o JWS), `_utils.security.signature`, `_utils.security.pdfsignature`, `_utils.security.certificate`, `_utils.security.xmlsignature`. O helper de arquivo do catálogo é `_util._fileHelper`, no singular.

`_utils.acl.checkPerm(method, objectOrObjectId)` recebe a referência do método (o exemplo é `crm.person._get`) e, opcional, o objeto ou o id. Sem o segundo argumento, a checagem é no contexto de classe. Devolve booleano.

`_utils.acl.prepareSearch(search)` devolve a mesma query Elasticsearch com dados de `_acl` do `_user`.

`_utils.addErrorMessage(message, code, path)` acrescenta erro que não interrompe o script. `message` é string obrigatória. `code` é number opcional e volta em `generalMessages` e `_messages`. `path` é string opcional e só é interpretado no Workspaces novo, no feedback localizado. Retorno `null`. `_utils.addInfoMessage(message, code)` e `_utils.addWarningMessage(message, code)` seguem o mesmo desenho, sem `path`; o `code` volta em `_messages`. Retorno `null`.

`_utils.appInfo` não é chamado no artigo: é objeto com `version`.

`_utils.calculateNextDate(expression)` recebe cron que o artigo diz compatível com o cron unix e devolve a próxima data em ISO 8601. Cron inesperado lança `Error`. O exemplo usa sete campos e `?`: `"0 0 0 ? * * *"`.

`_utils.class.ClassService.getAllMethods(classId)`, somente v8.5, devolve os métodos da classe, inclusive os de extensão.

`_utils.connector.createFormData()` devolve o corpo FormData. O artigo também chama `createFormData(charset)`, com charset opcional. `append(name, value)` aceita string ou referência de arquivo e devolve `null`.

`_utils.connector.web(target, contentType, headers, options)` abre requisição HTTP. `target` é a URL. `contentType` é o MIME do header `Content-Type`. `headers` pode ser objeto vazio; o exemplo passa `null`. `options` é opcional na tabela, e o texto pede pelo menos `{}`. Chaves de `options`: `logRequest` (boolean), `connectTimeout` e `readTimeout` (number, padrão 60000 milissegundos), `followRedirects` (boolean), `certificate` (referência a objeto de classe que segue a interface Certificado Privado, id `62d0bed8fc3c4b68cb101260`), `provider` (string; o exemplo `"apache"` é para requisição PATCH). O retorno expõe `delete`, `get`, `patch`, `post`, `put`, `request`, `setBasicAuth` e `setBearerAuth`. `delete()` devolve `true` em status 200 ou 204 e `false` nos demais. `get`, `patch` e `post` devolvem o corpo e lançam `Error` se o status não for 200, 201, 202 ou 204. O catálogo lista `put` e descreve esse método como verbo PATCH; não documenta o retorno de `put`. `request(method, body)` exige o verbo em maiúsculas. Verbos que o artigo lista: `POST`, `PUT`, `PATCH`, `DELETE`, `GET`. `body` é opcional. O retorno de `request` traz `status` (number), `headers` (object), `body` (object), `bodyAsBase64` (string) e, a partir da 8.27, `multipartBody`. Para `multipart/related`, a partir da 8.27, a resposta é lista de objetos com `headers` e `body`, pelo `multipartBody` ou direto em `get`, `patch`, `post` e `put`. `setBasicAuth(login, password)` e `setBearerAuth(token)` devolvem `null` e guardam a autenticação no conector. O terceiro argumento de `request` não aparece neste catálogo.

```javascript
const connector = _utils.connector.web(url, "application/json", null, {});
const resposta = connector.request("POST", {
    "id": idProduto
});
```

`_utils.crypto.checkOriginalValue(valueToChecked, encrypted)` compara string com o objeto de um campo criptografado e devolve booleano. `decode(algorithm, charset, data)` e `encode(algorithm, charset, data)` aceitam só `"BASE64"`; outro algoritmo devolve `null`. Charset não suportado lança `Error`. `standardDecrypt(payload)` recebe o objeto de campo criptografado reversível e devolve string; algoritmo irreversível lança `Error`. `standardEncrypt(payload, algorithmType)` criptografa string. `algorithmType` opcional: `"REVERSIBLE"` ou `"IRREVERSIBLE"`; omitido, usa `"REVERSIBLE"`. Devolve o objeto no formato do campo criptografado.

`_utils.file.createWriter(file, targetFileName, targetContentType, targetCharset)` recebe a referência de um campo arquivo. MIME omitido vira `"text/plain"`; charset omitido vira `"UTF-8"`. `abort()` devolve `null`. `close()` faz o upload e devolve a referência do arquivo criado. `writeLine(line)` devolve booleano.

`_utils.getMethod(packageIdentifier, classIdentifier, methodIdentifier)` devolve a função. Com pacote `"_classId"`, o segundo argumento é o id da classe.

```javascript
const criado = _utils.getMethod("crm", "person", "_create")({
    "name": "nome"
});
const obtido = _utils.getMethod("_classId", idClasse, "_get")({
    "_id": idObjeto
});
```

`_utils.identityText(object, separator, multipleSeparator)` devolve string com os campos de relevância identidade. Separadores são opcionais.

`_utils.indexing.reindex(objects, strictReindex)` cria indexação assíncrona (objeto da classe Indexação Simples). `strictReindex` `true` reindexa só o objeto; `false` reindexa também quem o referencia. Devolve `true` se a mensagem foi criada. A tabela do artigo grafa o parâmetro como `strinctReindex`; a linha de assinatura grafa `strictReindex`. `reindexSync(objects, strictReindex)` espera o fim e devolve `true` se a reindexação ocorreu.

`_utils.log(object)` devolve `null` e grava log interno.

`_utils.object.DiffService.diff(from, to)` compara dois objetos da mesma classe. Classe diferente lança `Error`. O catálogo descreve o retorno como lista de objetos com as funções `getName`, `getNewValue`, `getOldValue`, `getOperation` e `getPath`. O artigo dedicado do mesmo serviço descreve um JSON com `name`, `path`, `operation`, `oldValue` e `newValue`. Este arquivo não escolhe uma das duas formas.

`_utils.object.ExhibitionService.format(object, relevancies, timezoneId)` e `formatWithLogo(object, relevancies, timezoneId)` estão assinados aqui. O artigo de exibição detalha o retorno. Relevâncias que o catálogo aceita: `"IDENTITY"`, `"FEATURED"`, `"COMMON"`, `"SYSTEM"`, `"ADVANCED"`. `timezoneId` é obrigatório no catálogo (exemplo `"America/Sao_Paulo"`). As duas funções devolvem objeto com `getValuesByRelevancy` e `getLogo`.

`_utils.object.FileService.getFile(classId, objectId, fileId)` devolve a referência do arquivo. A tabela tipa `objectId` como `string[]`. `toFile(map)` reconstitui referência de arquivo depois de serializar, no cenário `_utils.stringifyAsJson` seguido de `JSON.parse`.

`_utils.object.ObjectService.getFieldValue(object, fieldPath)` extrai o valor. O objeto pode ser referência (`_id` e `_classId`) ou objeto da plataforma. Objeto inválido ou caminho inexistente lança erro. Múltiplo se acessa por índice ou pelo id do item. O separador do caminho pode ser `"."` ou `"/"`.

`refreshCalculatedFields(classId, objectId, classFields)` atualiza o valor no objeto e devolve `null`. A tabela marca `classFields` como obrigatório e diz que deve ser instância de `new _utils.object.ClassFields(classId, fieldIdentifier)`. O exemplo constrói `new _utils.object.ClassFields()` sem argumento, chama `add(idClasse, identificadorCampo)` e, para recalcular todos os campos, passa `null` no terceiro argumento.

`replaceReference(from, to)` substitui referências da mesma classe. O retorno expõe `getRemaining`, `getProcessed`, `getProtectedObjects` e `getErrors`. O artigo não mostra o que cada uma devolve além da descrição de quantidade.

`validateAndThrow`, somente 8.21, não tem assinatura entre parênteses. O parâmetro mostrado é `object`. Interrompe o script se o objeto é inválido (obrigatório, unicidade, multiplicidade, referência). Usado no `_save`, marca os campos inválidos no feedback localizado. `validate`, somente 8.21, também só mostra o parâmetro `object`, não interrompe e devolve objeto com `getErrors`. A estrutura escrita é um mapa do identificador do campo para uma lista de `{ "code", "text" }`. O código de exemplo é `"ERROR_REQUIRED_FIELD"`.

`_utils.object.StreamService.of(object).extended(options)`, `.summarized(options)` e `.detailed(options)` materializam os campos. `options` é opcional. Retornos: `ExtendedFieldData[]`, `SummarizedFieldData[]`, `DetailedFieldData[]`, arrays com `filter`, `map` e `forEach`. Atributos comuns: `path`, `value`, `owner`, `index`. `extended` acrescenta `field`, `type`, `parentReadOnly`. `detailed` acrescenta `field` e `eClass`. `summarized` acrescenta `identifier`. Chaves de `options`, com o padrão do artigo quando a chave é omitida, `null` ou `{}`: `includeListAsFieldData` padrão `false` (só os itens indexados; `true` inclui também o campo lista); `identifyMultipleEmbeddedBy` `"ID"` ou `"INDEX"`, padrão `"INDEX"`; `extendedMetadataOptions` `"CUSTOM"`, `"SYSTEM"` ou `"ALL"`, padrão `"CUSTOM"`, e só vale em `extended`.

`_utils.organization.OrganizationService.getEnvironmentType()`, a partir da 8.41, devolve o tipo declarado da organização em execução, não o da modelagem. SYBOX instalado em outra organização lê o tipo da organização de destino. Valores: `"DEVELOPMENT"`, `"STAGING"`, `"PRODUCTION"`, ou `null` se nada foi declarado.

`_utils.resource.lock(key)` devolve objeto com `release()`, que devolve `null`. Outra thread que peça a mesma chave entra na fila e espera, na ordem do pedido. O artigo pede guardar o retorno e chamar `release` em `finally`. `_utils.resource.isLocked` lista o parâmetro `key` e devolve booleano; a linha de assinatura não escreve os parênteses.

```javascript
const lock = _utils.resource.lock(chave);
try {
    pacote.classe._patch({
        "_id": _object._id,
        "_operationsList": [{
            "op": "replace",
            "path": "assignedTo",
            "value": _user
        }]
    });
} finally {
    lock.release();
}
```

`_utils.storedAt(object)` devolve `"DRAFT"`, `"PUBLISHED"` ou `null` se o objeto não foi encontrado.

`_utils.stringifyAsJson(object)` devolve string JSON. O artigo o indica para referência da plataforma por causa do lazy loading, que `JSON.stringify` não trata.

`_utils.token.generate(user)` recebe referência de usuário e devolve string. O artigo não mostra claims, algoritmo nem prazo. É outro caminho em relação a `_utils.security.token`.

## Propriedade _context

A partir da 8.4.48, `_context` reúne membros já existentes e acrescenta `objectPath` e `locale`.

`objectPath` serve em `_getMetadata` e nos métodos de escrita `_createDraft`, `_updateDraft` e `_save`. No objeto raiz, e também em método criado pelo usuário e em `_getACL`, os métodos de `objectPath` devolvem string vazia. No script de parâmetro de entrada ou saída, `objectPath` é o caminho até o objeto pai `_object`, não até `_input` ou `_output`.

`getPath()` devolve o caminho separado por `"."` (exemplo do artigo: `firstEmbeddedField.0.secondEmbeddedField`). `getFriendlyPath()` usa os nomes amigáveis dos campos. `concatWith(texto)` devolve `getPath` mais o texto. Se `getPath` é vazio, devolve o próprio texto. Se o texto é vazio, nada é concatenado.

```javascript
const caminho = _context.objectPath.concatWith("name");
```

`locale` aponta o idioma do usuário; o artigo remete à API Java `Locale` e não lista métodos. `user` é o mesmo `_user`. `organization` é o mesmo `_user._organization`. `request` é o mesmo `_user.request`.

## Dicas de depuração

Script roda no servidor e só para no fim ou numa exceção não tratada. Para ver valor, o artigo usa notificação: `throw` interrompe e gera notificação vermelha; `_utils.addErrorMessage` vermelha; `_utils.addWarningMessage` amarela; `_utils.addInfoMessage` azul; `_utils.debug` cinza, visível para quem está nos grupos Modelador de Classes e Modelador de Processos. Tarefa automática e processo não notificam o usuário. Objeto da plataforma não é JSON puro: `JSON.stringify` gera o erro "Ocorreu um erro de estouro de pilha na execução de scripts."; o artigo manda usar `_utils.stringifyAsJson`.

A árvore de expressões lista o que está no escopo. Duplo clique imprime o caminho. Referência cuja classe concreta só existe em execução, como referência a interface, mostra na árvore só os campos da interface.

Teste citado: Executável; API do método, com `_input` e `_output`; método via tela. O exemplo de tela cria método de contexto Classe, exibição Menu, parâmetro de entrada e de saída, e chama `_system._user._search`. O artigo não completa o contrato de `_search` nesse exemplo.

Erro de processo fica na Mensagem da fila, com remetente (a instância) e o campo Erro (stack). O texto localiza classe, método, índice do script e linha. Corrigir o processo exige publicá-lo de novo. A mensagem com erro pode ser reprocessada pelo botão de play, retomando daquele elemento. Mensagem da fila também cobre evento temporizador, execução assíncrona e elemento automático. Tarefa de usuário se depura com as notificações. Intervenção manual, em desenvolvimento, reposiciona tarefa já concluída. Para ensaiar atividade automática, o artigo obtém a instância e usa esse objeto como `_pin`:

```javascript
const _pin = _process.identificadorProcesso.versaoProcesso._get({
    "_id": idInstancia
});
```

Armadilhas que o artigo nomeia: ler propriedade de `undefined` ("Não é possível ler a propriedade \"code\" de undefined."); campo obrigatório da versão de processo não inicializado; alterar atributo de referência aninhada ("Cannot change read-only property"). A referência aninhada é só leitura. O artigo altera o objeto de destino com `_get` e `_update`, ou com `_patch`. Toda classe padrão tem `_patch`. No exemplo de `_patch` deste artigo, `path` começa com `"/"`. Atualizar de novo a partir do estado lido antes da primeira escrita gera "O objeto com _id: \"...\" da classe \"...\" não pode ser atualizado pois foi modificado de maneira concorrente." O `_update` devolve o objeto atualizado; a segunda escrita precisa partir desse retorno. O `_patch` deste artigo altera só o trecho informado, no estado do banco no momento da requisição.

## Graal

Motor novo de scripts. Método e campo calculado têm o campo Motor JavaScript: `ES2005` (motor antigo), `ES2023` (Graal) e `Padrão` (o motor da organização). Motores diferentes interoperam. O script no motor novo está no modo estrito. O artigo diz que o motor antigo será descontinuado e aponta a configuração de motor da classe de sistema para reverter uma classe que quebrou na migração. Não dá data.

No `ES2023` o artigo destaca encadeamento opcional, template string, rest e spread, desestruturação, `Proxy`, `BigInt`, `catch` sem parâmetro, atribuição lógica, `??`, `**`, e métodos de `Array` (`at`, `flat`, `flatMap`, `includes`, `toSorted`, `toReversed`, `with`, `findLast`, `findLastIndex`, `toSpliced`), `Object.entries`, `Object.values`, `Object.hasOwn`, `Object.getOwnPropertyDescriptors`, `String.prototype.at`, `padStart`, `padEnd`, `replaceAll`.

Quebras em relação ao motor antigo: `toLocaleTimeString` perde o fuso (de "21:23:00 BRT" para "21:23:00"); `toLocaleDateString` passa de data por extenso para `"04/04/2023"`; `toLocaleString` segue o mesmo par. Segunda atribuição a `const` lança exceção; no motor antigo a segunda atribuição era ignorada sem erro. `const` declarado dentro de `try` não existe fora do bloco; o motor novo lança `ReferenceError`. O título da seção inclui `let`. Palavras reservadas que não podem ser identificador: `implements`, `interface`, `package`, `private`, `protected`, `public`, `static`. `new java.math.BigDecimal` não é permitido; o artigo cita a biblioteca `decimal.js` e não mostra a API. E4X não existe no motor novo. `function () { ... }` sem nome é inválido, também dentro de `eval`; o artigo aceita envolver em parênteses ou atribuir a variável. Função e variável criadas em `eval` não ficam no contexto de fora. `Array.concat` e `Array.join` não são métodos estáticos; a chamada é na instância. O artigo admite que outros métodos possam ter o mesmo vazamento no motor antigo.

## Métodos via tela

Método pode aparecer como botão, com formulário de entrada antes e formulário de saída depois. O nível de acesso esconde o botão de quem não pode executar. O contexto de execução muda o lugar do botão. Objeto: exibição de objeto, listagem e analytics pipeline. Classe: listagem e analytics pipeline. Rascunho: rascunho. Modo de exibição, por local: Destaque fica visível; Menu fica no menu; nenhuma seleção significa que não aparece naquele local. Com ao menos um modo, o campo Ícone aparece. O padrão é `ti-control-play`; o valor é o identificador Themify.

No contexto Objeto, a exibição de um objeto manda esse objeto. Listagem e pipeline permitem seleção múltipla. Número mínimo e número máximo limitam a seleção. Mínimo maior que um esconde o botão na exibição de objeto. O script lê a seleção em `_objects`. Nesse uso, `_object` vem nulo. No contexto Rascunho, o script lê o rascunho em `_object`. No contexto Classe, nenhum objeto é selecionado.

Formulário de entrada tem os métodos Criar Formulário, Atualizar Formulário e Obter Metadata. Neles há `_input`, `_oldInput` (este não existe no Obter Metadata), `_object` e `_objects`. Formulário de saída tem Obter Metadata, com `_output`, `_object` e `_objects`. No método principal, `_input` lê o formulário de entrada e `_output` preenche o de saída. Referência escolhida na entrada não traz o objeto inteiro: só `_id`, `_classId`, `_classIdentifier` e `classPackageIdentifier`. O conteúdo inteiro pede o Obter da classe. `_output._redirectObject` abre o detalhe do objeto informado. `_output._redirectURL` abre o link em nova aba. O exemplo de analytics usa `_classId` `"000000000000000000000046"` para a classe Analytics.

## Metadata

Em script de `_getMetadata`, `_metadata` altera a forma. Classe padrão expõe `editHelp`, `fields` e `context`. Interface expõe `concreteClasses`.

`editHelp` é texto internacionalizável: objeto com chaves de idioma (`pt`, `en`, `es` no exemplo) ou string, associada ao idioma atual. `context._disableRequired` desliga a verificação padrão de obrigatório. No embutido, o filho que define o próprio valor vence; se não define, herda o pai; se ninguém define, o padrão é `false` e a validação de obrigatório permanece. `concreteClasses` filtra as concretas de uma interface. O exemplo faz `push` de `{ "_id": id }` e diz que não é preciso `_classId`, porque a referência é da classe Classe. O script na interface vale para toda referência àquela interface. O artigo indica o `_createDraft` da classe interessada quando o filtro deve ser local.

Propriedades de campo, como o artigo as limita:

- Todos: `name` (mapa de idiomas ou string), `hidden` (booleano), `additionalConfigs` (objeto cujas chaves são identificadores de configuração avançada), `exhibitionConfigs` (o mesmo para exibição).
- Não sistema: `required`, `breakLine`, `readOnly` (booleanos), `size` (`"lg"`, `"md"` ou `"sm"`: linha inteira, metade, um quarto).
- Múltiplo: `minMultiplicity`, `maxMultiplicity` (inteiros), `shiftable` (booleano).
- Texto: `maxLength` (número; conteúdo texto simples, longo ou link), `mask` (referência; o exemplo chama `_system._mask._get(idDaMascara)`), `placeholder` (mapa ou string; texto simples ou link).
- Decimal: `decimalPrecision` (inteiro). `trailingZeros` (booleano), a partir da 8.40, só na exibição padrão de decimal: completa zeros até as casas configuradas. Em exibição de moeda não tem efeito. Valor que não é booleano não altera o campo.
- Decimal, número e número longo: `thousandSeparator` (booleano).
- Dinâmico e referência não embutida: `query`. O cabeçalho diz string; o exemplo atribui um objeto de query Elasticsearch. A plataforma não invalida referência já gravada que deixe de passar na query; limpar o campo fica no `_updateDraft` ou no `_save`.
- `valueOptions`, nos tipos decimal, dinâmico, número, número longo e texto. `push` e `indexOf` são mostrados em `valueOptions`. Para texto, `push` de string usa a mesma string como identificador e valor; o mapa usa `identifier` e `value`. `pop`, `splice` e `length` são mostrados no campo (`_metadata.fields.campo.pop()`), não em `valueOptions`.
- Dinâmico: `type` com `"REFERENCE"`, `"FILE"`, `"DOUBLE"`, `"STRING"`, `"BOOLEAN"`, `"DATE"`, `"INTEGER"`, `"LONG"`, `"ID"` ou `"GEOPOINT"`. `multiple` (booleano). Depois de `"STRING"`, `i18n`. Depois de `"REFERENCE"`, `embedded` e `refClass`. Um exemplo atribui `refClass` como string de id; outro, como `{ "_id": idDaClasse }`.
- Script: `additionalContext`, com `push` de objetos `{ key, description, type, typeConfig }`. O exemplo usa `type` `"string"` e `"function"`. Em `typeConfig` aparecem `multiple`, `optional`, `isI18n`, `hasParams`, `parameters`, `hasReturn` e `classRef` com `_id` e `_classId`. Os `indexOf` e `length` desse trecho estão escritos em outros campos, não em `additionalContext`.
- Arquivo: `signers` (lista; o exemplo faz `push` de `{ "_id": id, "classId": idClasse }`, com `classId` sem sublinhado, ou substitui a lista). `visualSignatureSettings` com as chaves `text`, `image`, `x`, `y`, `width`, `height`, `fontSize` e `page`. `acceptedExtensions` (lista de strings). `enableSigning` e `includeVisualSignature` (booleanos). `signatureLocations`: o cabeçalho diz booleano; os exemplos atribuem lista de mapas com `name`, `sign`, `signAt` e `signBefore`. `maxSize` é número em MB. `pdfSignFormat` é referência com `_id` e `_classId`; o artigo escreve `_id` `"652c558c3c6434615878f24f"` e `_classId` `"652c55473c6434615878b899"`. `signatureLocationChoice`: `"OnlyOne"`, `"OneOrMore"` ou `"All"`.
- Múltiplo de referência embutida: `items`, sem input direto. Cada item tem `hidden` e `removable`. `findById(id)` e o índice `items[id]` localizam o item. `_getMetadata` também roda em contexto de classe; o exemplo só percorre `_object` depois de testar se ele existe.

## Métodos de sistema

Métodos padrão de classe. A classe do objeto ou do rascunho tem de ser exatamente a classe do método. Onde se espera um id, o artigo aceita o mapa inteiro, porque internamente é tratado como objeto.

`_create(objeto)` cria com os campos informados. Obrigatórios são os que o usuário marcou. Sem obrigatório, a chamada pode ir sem parâmetro e o retorno traz só campos de sistema. Com parâmetro, o retorno traz os campos de sistema preenchidos e os campos enviados.

`_delete({ "_id": id })` não tem retorno.

`_get` recebe objeto com `_id` ou com outro campo de valor único e devolve o objeto encontrado. O detalhe do campo único está no artigo próprio. Este artigo não escreve `null`.

`_getACL` recebe o objeto ou `{ "_id": id }` e devolve as permissões dos métodos da classe daquele objeto.

`_patch` recebe `_id` e `_operationsList` no formato JSON Patch e devolve o objeto atualizado. Operações no exemplo: `add`, `replace`, `move`, `remove`. Caminhos no exemplo não têm barra inicial: `"myField/-"` inclui no fim, `"myField/0"` é índice. `move` usa `from` e `path`.

`_update` recebe `_id` e os campos. Campo não enviado é considerado nulo. Devolve o objeto atualizado.

`_save` é onde fica a lógica que roda antes da persistência, compartilhada por `_create`, `_update` e `_patch`. Sem erro de validação e sem exceção, o dado persiste e o objeto volta atualizado. Exceção ou validação de campo interrompe e nada é criado nem atualizado. `_revision` muda a cada atualização bem-sucedida. `_update` e `_patch` comparam o `_revision` informado com o do banco. Se mudou, lançam `ConcurrentObjectUpdateException` com a mensagem "O objeto com _id: \"<id>\" da classe \"<classe>\" não pode ser atualizado pois foi modificado de maneira concorrente." Este artigo não descreve a nova tentativa automática do `_patch`.

## Promises

A partir da 8.34, em método de classe, com execução no Graal. Habilitar Promises coloca o conteúdo numa função assíncrona, e `await` pode ser usado direto. A execução não é assíncrona de thread: o código roda nos pontos de espera ou no fim, em thread única. Sem `await` no nível mais externo, o trecho seguinte ao acionamento entra no resultado antes da conclusão da Promise. `setTimeout`, ao contrário da norma, executa a função na hora; o artigo diz que isso existe para biblioteca externa. O exemplo de biblioteca faz `require("pdf-lib.js")` e cria arquivo com `_util._fileHelper.create`, passando `targetFileName`, `targetContentType` e `base64`. Exportação de SYBOX para versão anterior à 8.34 não é suportada quando a classe tem método que usa Promise.

## Fila de execução de métodos

A fila executa método depois, de forma assíncrona, com data agendada e usuário de contexto. A criação mostrada é `_queues.methodExecutionQueue._create`. `sender` é a referência de quem gerou a mensagem (`_id` e `_classId`); a mensagem aparece na aba Dados desse objeto enquanto o status é Aguardando, Executando ou Erro. `schedulingDate` é a data da execução; `null` segue a prioridade da fila e executa assim que possível. `body.targetClass` é referência da classe (`_classId` e `_id`); no exemplo, `_classId` é `"000000000000000000000000"`. `body.targetMethod` é o identificador do método. `body.parameter` é string equivalente ao `_input`; o exemplo usa `_utils.stringifyAsJson`. `body.invokerUser` é o usuário do contexto. `onSuccess` tem o mesmo tipo de `body` e só roda se o método principal volta sem erro. O exemplo de `onSuccess.invokerUser` usa `_classId` `"000000000000000000000002"` e `_id` `"000000000002000000000001"`.

Há ainda, no objeto da mensagem já criada, propriedade avançada para executar outro método ao concluir, com ou sem erro: classe, método, parâmetros e usuário. O artigo não mostra o identificador desse campo.

```javascript
_queues.methodExecutionQueue._create({
    "sender": {
        "_id": _object._id,
        "_classId": _object._class._id
    },
    "schedulingDate": null,
    "body": {
        "targetClass": {
            "_classId": "000000000000000000000000",
            "_id": _object._class._id
        },
        "targetMethod": "generate",
        "parameter": _utils.stringifyAsJson({
            "_id": _object._id
        }),
        "invokerUser": _user
    }
});
```

## Contextos de execução

Três contextos, combináveis. Método novo nasce com Classe e Objeto; Rascunho é acrescentado. Só Classe: `_object` não vem preenchido; serve a lógica que não depende de objeto. Só Objeto: `_object` vem do `_id`, obrigatório na chamada; `_objects` existe quando o método permite mais de um objeto. Chamar método só de objeto com id de rascunho gera erro. Só Rascunho: `_object` é o rascunho; no máximo um objeto, e ele precisa ser rascunho. A partir da 8.15, alteração feita em `_object` nesse contexto persiste sozinha. Chamar método só de rascunho com id de publicado gera erro. Com Classe, Objeto e Rascunho juntos, o script testa se `_object` existe. Com Objeto e Rascunho juntos, `_utils.storedAt(_object)` devolve `"PUBLISHED"` ou `"DRAFT"`.

## Propriedade _objects

`_objects` é lista imutável e só existe em método criado pelo usuário. Chamada para um objeto, pela tela ou por outro meio que não seja a listagem, coloca esse único objeto em `_objects` e o mesmo objeto em `_object`. Chamada pela listagem, com um ou mais objetos, preenche `_objects` com a seleção e deixa `_object` nulo.

## Obter controle de acesso

O script de `_getACL` existe para edição quando algum método está com permissão Dinâmica. Roda no contexto de um objeto. Há `_object` e `_acl`. Cada chave de `_acl` é o identificador de um método dinâmico e traz `users` (referências de usuário), `groups` (referências de grupo) e `public` (booleano). `users` e `groups` já nascem com a parte explícita do método.

Incluir usuário ou grupo é `push` da referência, ou substituir a lista. O artigo recomenda `_id` junto de `_classId`. String só com id, ou mapa só com `_id`, assume a interface Usuário de Acesso (`_aclUser`) ou Grupo de Usuário de Acesso (`_aclUserGroup`); o artigo desaconselha, pelo custo de achar a classe concreta. `public` só aceita booleano; qualquer outro valor vale como falso. `public` `true` desconsidera usuários e grupos explícitos, exceto o grupo Grupo Padrão da classe Grupo de Usuário, incluído automaticamente. O retorno de exemplo de um método público traz esse grupo com `_id` `"eba000000005000000000003"` e `_classId` `"000000000000000000000005"`, e `public: true`.

Remover é tirar o item de `users` ou `groups`. O exemplo chama `filter` e não atribui o resultado de volta.

Chamada: `pacote.classe._getACL({ "_id": id })`. Qualquer mapa com `_id` válido serve. Entrada inválida lança exceção ou devolve `null`. O retorno tem uma chave por método, cada uma com `users`, `groups` e `public`. Não é possível invocar `_getACL` pela API.

## Obtenção de objetos por campo único

`_get` também localiza por campo configurado como único. Não suportam unicidade: dinâmico, referência embutida, criptografado e internacionalizável. Campo único múltiplo não repete valor entre objetos nem dentro do mesmo objeto. O argumento é um valor singular, nunca uma lista: para achar quem contém `"X"`, `"Y"` e `"Z"`, passa-se um desses valores, não o array.

Chamada interna: `pacote.classe._get(body)`. Chamada externa: `POST` ou `GET` em `https://{dominio}/api/1/main/_classId/{idClasse}/_get`. Valores que o artigo exige: texto e identificador como string; inteiro e inteiro longo como número inteiro; decimal como número decimal; data como ISO 8601 em UTC+0, no formato ano-mês-dia `T` hora:minuto:segundo.milissegundo `Z`. Data sem hora usa zeros no tempo. Segundo e milissegundo omitidos valem 0. Booleano como `true` ou `false` no exemplo, não como texto. Referência não embutida como `{ "_id", "_classId" }`. Arquivo como `{ "_id", "hash" }`. Arquivo de mesmo conteúdo tem o mesmo `_id` ainda que o nome mude, então o campo único não distingue nomes. Coordenada geográfica como `{ "lat", "lon" }`.

## Perform

`perform()` desvia o fluxo dos scripts do método. Num método com vários scripts, `perform()` no primeiro executa os seguintes. Ao voltar, `_object`, `_input` e `_output` refletem o que os scripts posteriores alteraram. Só a primeira chamada dentro de um script tem efeito.

No exemplo de método comum, o log do primeiro script vê o texto já composto pelos scripts seguintes, inclusive o trecho que o segundo script acrescenta depois do próprio `perform()`. O log do segundo script vê o que o terceiro acrescentou e ainda não vê o trecho que ele mesmo acrescenta depois do `perform()`.

Em `_updateDraft` e `_save`, o artigo diz que a última execução de `perform()` persiste e devolve o objeto persistido ao script, e que no fim de todos os scripts não há segunda persistência. No exemplo, `_id` é nulo antes de `perform()` e existe depois. A atribuição a `_object` depois de `perform()` não entra no objeto publicado; o valor publicado do exemplo é o que estava antes de `perform()`, com o acréscimo feito antes. Em interceptor, `perform()` invoca o método original, com as mesmas regras.

## Serviço de diff de objetos

`_utils.object.DiffService.diff(from, to)` compara dois objetos da mesma classe: publicados, itens de histórico ou objetos de outros ambientes. O artigo dedicado descreve cada diferença como `{ "name", "path", "operation", "oldValue", "newValue" }`, com `operation` em `ADD`, `DELETE` ou `UPDATE`. Ignora campos de sistema, exceto `_id` e `_protected`. O catálogo de `_utils` descreve funções `getName`, `getNewValue`, `getOldValue`, `getOperation` e `getPath`, e lança `Error` se as classes diferem.

Histórico: `pacote.classe._getHistory({ "_id": id })` devolve iterador com `hasNext` e `next`. Itens de histórico podem ser comparados entre si. Objeto de outro ambiente entra no `diff` depois de obtido; a classe precisa existir no ambiente que executa o script. Modelagem diferente da mesma classe pode inconsistir o cálculo. O exemplo entre ambientes chama `com.sydle.util.webService.send` e não mostra o corpo de `params`.

## Exibição de objeto

`_utils.object.ExhibitionService.format(object, relevancies, timezoneId)` devolve a formatação sem logo. `formatWithLogo` inclui a logo se existir. `relevancies` é array em inglês e maiúsculas: `IDENTITY`, `FEATURED`, `COMMON`, `ADVANCED`, `SYSTEM`. Valor fora disso lança "Parâmetro relevancies com valor inválido. Exemplo de valor válido: [IDENTITY, FEATURED]." `timezoneId` segue o id de fuso e converte campo data. Id inválido lança "Parâmetro timezoneId com valor inválido. Exemplo de valor válido: \"America/Sao_Paulo\"."

`getValuesByRelevancy()` devolve mapa da relevância para lista de `{ "label", "values" }`. Cada item também tem `getLabel()` e `getValues()`. `getLogo()` devolve `null`, exceto em `formatWithLogo` quando há logo. A logo traz `fileId`, `objectId`, `classId`, `classIdentifier` e `classPackageIdentifier`, com os getters `getFileId`, `getObjectId`, `getClassId`, `getClassIdentifier` e `getClassPackageIdentifier`. O exemplo serializado do retorno também mostra as chaves `valuesByRelevancy` e `logo`.

## Informações de requisição HTTP em script

A partir da 8.4.X, a requisição HTTP da API do método está em `_user.request`. Na fila, `request` é nulo. Se um script chama outro método, o `request` visto lá dentro é o da requisição original, não o da chamada interna.

`url` é a URL original completa. `httpMethod` é o verbo. `queryParams` é mapa em que cada valor é sempre array de strings. `pathParams` é array dos segmentos depois do nome do método; barras repetidas são ignoradas. `remoteIp` é o IP de quem chamou ou do último proxy. `headers` é mapa; o valor pode ser string ou array. `oneData` traz `app`, `classId`, `method` e `objectId`. `objectId` é nulo fora do contexto de objeto. O mesmo vale quando a URL usa o pacote da classe no lugar de `_classId`. `forwardPath` é o caminho interno quando a classe Rota (`Route`) roteou a chamada; sem roteamento, é nulo. No exemplo roteado, `url` permanece a URL original e `forwardPath` é a URL do método.

## Respostas HTTP customizadas

A partir da 8.4, método com script pode montar a resposta HTTP. O artigo marca a função como experimental. Sem `_response` em `_output`, a resposta continua JSON padrão. `_output._response` não pode ser `null` nem `{}`, precisa ter ao menos um entre `body`, `status`, `headers` e `headersToRemove`, e não pode ter outra chave.

`status` é inteiro opcional, nunca `null` nem string. Códigos que o artigo aceita: 200, 201, 202, 204, 205, 300, 301, 302, 303, 304, 305, 307, 400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 428, 429, 431, 500, 501, 503, 511. O exemplo 418 é rejeitado. Sem `status`, a resposta pode ser 200, 204 ou 304, ou um código de erro. 204 nessa situação ocorre com corpo vazio. 304 ocorre pelo cache padrão. 204 e 205 explícitos exigem corpo vazio nulo. 304 explícito exige corpo vazio nulo e ao menos um header entre `Cache-Control`, `Content-Location`, `ETag` e `Expires`. 401 exige `WWW-Authenticate`. 405 exige `Allow`.

`headers` é mapa não vazio, de 1 a 20 nomes, sem duplicata. Nome é case-insensitive, no máximo 50 caracteres, começa com letra e só tem letra sem acento, dígito e hífen não consecutivo. Há blocklist de headers padrão, sem a lista dos nomes neste artigo. Valor é string ou número, nunca `null`, sem espaço no início ou no fim, e string só com US-ASCII imprimível (códigos 32 a 126). `Content-Type` segue o RFC 9110; charset, se houver, precisa existir no servidor; `"application/json"` não leva charset. O padrão da plataforma já é `"application/json"`. `Last-Modified` segue o RFC 9110 e não pode ser data futura em relação ao servidor.

`body`, se omitido, faz o resto de `_output` ser o corpo. Se `_output` só tem `_response` e este não tem `body`, o corpo é `{}`. `body` aceita o que for serializável em texto ou JSON, conforme o `Content-Type`. Corpo vazio em `application/json` é `null`; string vazia não conta como vazio nesse tipo. Fora de `application/json`, corpo vazio é `null` ou `""`.

`headersToRemove` é lista de 1 a 20 strings, sem duplicata case-insensitive, sem nome que já esteja em `headers`. Remover header ausente não é erro. Os nomes seguem a mesma forma da seção de headers.

`_utils.ResponseHelper.returnText(text, type)` e `returnText(text, type, charset)`. `type` é `"csv"`, `"css"`, `"html"`, `"javascript"`, `"plain"` ou `"xml"`. Charset omitido é `"utf-8"`. O retorno pode receber depois `status`, `headers` e `headersToRemove`. `_utils.ResponseHelper.returnFile(file)` devolve arquivo para download. No valor retornado por `returnFile`, `body` não pode ser incluído. O artigo de Promise mostra `_util._fileHelper.create` com `base64`; este artigo mostra `create` com `content`, `targetFileName` e `targetContentType`.

`_utils.ResponseHelper.returnOutputWriter(function, parameters, contentType, isChunked)`, a partir da 8.22, só em método ECMA 2024. A prosa chama o quarto parâmetro de `chunkedResponse`. `function` recebe `(input, output)` e escreve no corpo. `parameters` é o JSON repassado como input. `contentType` vira o header. Quarto argumento verdadeiro envia sem buffer, com `Transfer-Encoding: chunked`. `output` tem `writeBase64(base64)`, `writeLine(text)` (acrescenta quebra de linha) e `writeByteArray(data)`. O exemplo lê arquivo com `_utils.object.FileService.toFile(input.file).reader("UTF-8")`, `readLine` e `close`. No repasse de uma requisição, o exemplo chama `connector.request(verbo, corpo, { "autoClose": false })`, lê `response.reader(charset)`, `readerBase64()` e `readerByteArray()`, e cita `_input._bodyWriter` com `writeLine`, `writeBase64` e `writeByteArray`. O catálogo de `connector.web` não lista esse terceiro argumento.

Headers de segurança incluídos por padrão, removíveis ou sobrescrevíveis, exceto `X-XSS-Protection` (`"0"`) e `X-Content-Type-Options` (`"nosniff"`): `X-Frame-Options` `"SAMEORIGIN"`; `Content-Security-Policy` `"default-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests"`; `Cross-Origin-Opener-Policy` `"same-origin"`; `Cross-Origin-Embedder-Policy` `"require-corp"`; `Strict-Transport-Security` `"max-age=31536000; includeSubDomains"`; `Referrer-Policy` `"no-referrer"`; `X-Download-Options` `"noopen"`; `X-Permitted-Cross-Domain-Policies` `"none"`.

Cache automático quando a requisição é `GET`, `status` não foi definido e a resposta não veio do utilitário de download com arquivo que não foi enviado à plataforma. A plataforma acrescenta `ETag`, `Cache-Control` `"must-revalidate"` e `Expires` `"-1"`. `GET` com `If-None-Match` igual ao `ETag` devolve 304. Esses headers podem ser sobrescritos ou removidos.

`Access-Control-Allow-Origin` vem `"*"` e pode ser sobrescrito, não removido. `Access-Control-Allow-Methods` `"*"` e `Access-Control-Max-Age` `"86400"` não podem ser sobrescritos nem removidos. Prefixo `X-One` não pode ser criado, sobrescrito nem removido. `X-Robots-Tag` `"noindex, nofollow"` entra no acesso direto `*/api/1/{app}/*` e não pode ser alterado nem removido nesse caso. Em acesso por rota, não é inserido.

```javascript
_output = {
    "_response": {
        "status": 200,
        "body": {
            "ok": true
        }
    }
};
```

## Utilitário de token

Dois caminhos no catálogo de `_utils`: `token.generate(user)`, que só devolve uma string, e `_utils.security.token` para JWS.

`_utils.security.token.JWS.builder()` devolve o builder. Cada configuração devolve o próprio builder. `build()` devolve a string do token. `algorithmHeaderValue(alg)` recebe o algoritmo; os exemplos são `"HS256"` e `"RS256"`. Chave, em uma de quatro formas: `secretKey(secret, byteLength)` trunca ou completa com `"0"` até o tamanho, que precisa caber no algoritmo (o artigo cita SHA256 com 32 bytes); `secretKeyBase64(secretBase64)`; `jwk(jwk)`, que o texto chama de formato JKW; `pkcs8Key(privateCertificate)` em PEM. Payload: `addClaim(key, value)`, `subject(subject)` (`sub`), `issuer(issuer)` (`iss`), `issuedAt(issuedAt)` e `setIssuedAtToNow()` (`iat`), `audiences(lista)` e `audience(valor)` (`aud`), `expirationTime(expiration)` (`exp`).

`_utils.security.token.JWSParser.create(token)` devolve o parser. `parse()` devolve `{ "headers", "payload" }`. Com chave definida, a assinatura é conferida e divergência lança exceção. Formas da chave: `secretKey`, `secretKeyBase64`, `jwk` e `publicCertificateKey(publicCertificate)` em PEM, para token assinado pela privada correspondente. Se `exp` existe e é anterior ao instante atual, lança exceção. Sem `exp`, não há erro de expiração. `disableExpirationValidation()` desliga essa conferência.

## Redirecionamento de métodos

Reformulado a partir da 8.23. Versão anterior fica fora deste artigo. Encaminha pacote, classe e método antigos para o recurso novo, em API, script ou método de tela. A tela é Configuração, Redirecionamento, Atualizar Redirecionamento.

`_system.ResourceRedirectConfig.addRedirect` e `removeRedirect` recebem `resource` (chamada completa do destino), `type` e `alias` (o que os clientes ainda chamam). Devolvem `true` ou `false`. Tipos: `PACKAGE_IDENTIFIER`, `CLASS_IDENTIFIER`, `METHOD_IDENTIFIER`, `CLASS_CHANGE` (8.23) e `METHOD_CHANGE` (8.23).

`PACKAGE_IDENTIFIER`: `resource` é o pacote novo (`"crm.location"`) e `alias` é o identificador antigo (`"_location"`). `CLASS_IDENTIFIER`: redireciona classe no mesmo pacote; no exemplo, `resource` é `"crm.location.CityNew"` e `alias` é só `"City"`. `METHOD_IDENTIFIER`: a prosa diz outro método na mesma classe; o exemplo usa `resource` `"crm.location.CityNew.getIbgeCodeNew"` e `alias` `"getIbgeCode"`. `CLASS_CHANGE` e `METHOD_CHANGE`: `alias` é a chamada completa antiga (`"_location.City"`, `"_location.City.getIbgeCode"`).

O alias não pode já existir no escopo: outro pacote com o mesmo identificador, outra classe no mesmo pacote, ou outro método na mesma classe. Uso do recurso legado gera aviso no log. Chamada feita pela fila não redireciona: a fila usa referência direta da classe, não o identificador.

```javascript
_system.ResourceRedirectConfig.addRedirect({
    "resource": "crm.location.City",
    "type": "CLASS_CHANGE",
    "alias": "_location.City"
});
```

## SSE

Reformulado a partir da 8.34. Conexão persistente criada em script. `Subscriber` (`_utils.sse.Subscriber`) configura a conexão e o endpoint devolve isso por `ResponseHelper.returnSSESubscriber`, que vira `Content-Type: text/event-stream`. `Event` (`_utils.sse.Event`) pode ser publicado de outro script ou processo. `channelId` roteia: todo subscriber com o mesmo canal recebe o evento. O método que devolve a conexão precisa ser chamado com usuário autenticado.

`subscriber.id()` é único da conexão física. `subscriber.channelId()` é o canal. Omitir `channelId` no builder gera um valor exclusivo daquela conexão. O mesmo `channelId` em várias abas entrega o mesmo evento nas abas. Canal genérico entrega para qualquer outra conexão da organização que use o mesmo valor. Organizações diferentes não compartilham mensagem mesmo com o mesmo `channelId`. Não há curinga de canal.

Builder: `_utils.sse.Subscriber.builder()`, depois `.channelId(string)` opcional, `.pingMessage(map)` opcional (padrão `{ "event": "PING" }`; `null` desativa o payload e manda comentário SSE, a partir da 8.39), `.ttl(minutes)` opcional (padrão 5), `.build()`. `addInitialData(map)` pode ser chamado mais de uma vez e envia esses dados ao abrir, antes de evento externo. O exemplo completo devolve com `return`; os exemplos anteriores atribuem `_output`. Fechar: `_utils.sse.Subscriber.close(subscriberId)`.

Ping a cada minuto: mantém a conexão, remove conexão cujo ping falha e confere o TTL desde o último evento (ou desde a abertura, se nenhum evento foi enviado). A granularidade é de um minuto; no pior caso a conexão fica ativa até `ttl + 1` minutos.

`_utils.sse.Event.builder(channelId)` exige o canal. `.data(map)`, `.type(string)`, `.to(userId)` e `.id(string)` são opcionais. Sem `.to()`, o evento vai a todos os subscribers do canal. O artigo recomenda `.to(userId)` quando não se quer broadcast. `_utils.sse.Event.send(event)` entrega a quem está no mesmo `channelId`, corresponde ao usuário de `.to()` ou a todos se `.to()` foi omitido, e pertence à organização do contexto.

Não há garantia de entrega nem reenvio. Três perdas que o artigo descreve: a conexão acumula até 256 eventos não consumidos e, no seguinte, descarta o evento e é fechada, sem afetar as outras; o tópico do cluster retém até 10000 eventos por até 5 minutos, e o nó que fica atrás perde o que já saiu; evento publicado com o cliente desconectado não fica guardado, e `Last-Event-ID` de uma nova conexão não dispara reenvio. O artigo pede estado atual em `addInitialData`, tratar o evento como aviso e buscar o dado crítico à parte, e guardar em objeto ou fila o que não pode se perder.

```javascript
const subscriber = _utils.sse.Subscriber.builder()
    .channelId(idCanal)
    .build();
subscriber.addInitialData({
    "type": "CONECTADO",
    "subscriberId": subscriber.id()
});
_output = _utils.ResponseHelper.returnSSESubscriber(subscriber);
```

## E4X

E4X existe no motor ECMA2005 e não existe no motor novo. O artigo manda migrar para biblioteca. Cheerio só funciona no motor novo. XMLDOM funciona nos dois. `require("xmldom.js")` e `new xmldom.DOMParser().parseFromString(xml, "text/xml")`. `require("cheerio")` e `cheerio.load`; nos exemplos de alteração, o segundo argumento é `{ "xmlMode": true }`. No ES2005, `XMLHttpRequest` expõe `responseXML`. No ES2023 esse atributo não está disponível; o artigo lê `request.responseText` e passa ao `DOMParser`. O artigo não mostra a API completa das bibliotecas, só a navegação, a atribuição e a construção equivalentes ao E4X.

## Obter métodos e campos calculados inválidos no Graal

Ação de tela no objeto de configuração da organização, menu de métodos, "Obter métodos e campos calculados inválidos no GRAAL". O resultado separa uso totalmente incompatível, que vai falhar na migração, de uso que pode ser incompatível e precisa ser avaliado. Não mostra assinatura.

## Utilitário SFTP

Conexão é um objeto da classe Conexão SFTP. Campos: nome, identificador (é o que o script usa), host, porta (o artigo cita 22 como usual), usuário, tipo de autenticação e timeout de conexão em segundos, obrigatório, padrão 30. Autenticação: certificado digital (objeto Certificado Privado Padrão em PKCS#12, referenciado no campo); chave criptográfica OpenSSH com cabeçalho e rodapé `BEGIN` e `END PRIVATE KEY`; login e senha. O campo senha existe nos três tipos. É obrigatório em login e senha. Em certificado ou chave é opcional, e servidor com dois fatores falha a autenticação se a senha ficar vazia. Em rascunho, o método de tela Testar Conexão devolve "Conexão Realizada com Sucesso" ou "Conexão Falhou", com mensagem resumida e arquivo de log.

`_ecm._sftpConnection.createSession({ "connection": identificador })` abre a sessão. Sem o parâmetro, ou com identificador inválido, lança erro. `close()` encerra; o artigo pede `finally`.

Arquivo: `readFile(filePath)` devolve arquivo da plataforma e lança erro se o caminho não existe ou não é arquivo. `writeFile(filePath, file)` cria ou sobrescreve e devolve `true` ou `false`. `writeFileIfAbsent(filePath, file)` não escreve se já existe e devolve `false` nesse caso ou em falha de escrita. `removeFile(filePath)` devolve `false` se falhar, inclusive se não existe. `existsFile(filePath)` devolve booleano. O segundo argumento de escrita é objeto de campo arquivo ou equivalente.

Diretório: `readDirectory(directoryPath)` devolve `SftpDirectory` e lança erro se o caminho não existe ou não é diretório. `createDirectory` devolve `true` se criou e `false` em erro. `removeDirectory` devolve `false` em erro, e o artigo cita diretório não vazio ou inexistente. `existsDirectory` devolve booleano.

`SftpDirectory`: `getName()`, `getPath()`, `listFiles()` e `listDirectories()`, estes dois como `Array<FileMetadata>`. O tipo é descrito com propriedades `name`, `length` (bytes), `contentType` (nulo em diretório; inferido pelo nome) e `filePath`. O exemplo chama `name()`, `length()`, `contentType()` e `filePath()`.

O artigo avisa que outro sistema no mesmo filesystem pode conflitar, e que lock, se necessário, fica a cargo de quem chama. Não mostra a assinatura desse lock no SFTP.

```javascript
const sftpSession = _ecm._sftpConnection.createSession({
    "connection": identificadorConexao
});
try {
    const existe = sftpSession.existsFile("/remote/inbox/dados.csv");
    if (existe === true) {
        const arquivo = sftpSession.readFile("/remote/inbox/dados.csv");
    }
} finally {
    sftpSession.close();
}
```
