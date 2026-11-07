# _utils e _util

`_utils` chama método de classe. `_util` é helper de arquivo. Não troque um pelo outro. `_utils.getMethod`, `_utils.file`, `_utils.crypto` e `_utils.security.crypto` são caminhos de `_utils`. `_util._fileHelper` é caminho de `_util`. Módulo `require`, classe de conector, `_context`, `_objects` e extensão de ACL não são nenhum dos dois.

## _util._fileHelper

Artigo da versão 7.5. A classe `_fileHelper` fica na árvore de expressões em `_util`. O artigo nomeia `concatenate`, `create`, `convert`, `extract`, `getFileExtraInfo`, `readBarCode` e `resizeImage`. `resizeImage` não tem contrato.

`concatenate` junta um array na ordem dada e devolve um pdf. Cada item mantém a estrutura original: um html de n páginas ocupa as n primeiras; cada imagem vira uma página seguinte.

```javascript
const arquivosConcatenados = _util._fileHelper.concatenate({
    files: [htmlFile, imageFile, anotherImageFile],
    targetFileName: "concatenated.pdf"
});
```

`create` gera um arquivo a partir de string ou arquivo. Entradas escritas: `file`, `targetFileName`, `targetContentType`, `targetCharset`. O comentário da chamada mostra `content` no lugar de `file`. Retorno: arquivo convertido. O artigo não lista `url` nem `headers` aqui.

```javascript
const htmlFile = _util._fileHelper.create({
    file: result,
    targetFileName: "index.html",
    targetContentType: "text/html",
    targetCharset: "UTF-8"
});
```

`convert` usa as mesmas entradas e o mesmo tipo de retorno, mas não aceita string. Gera um objeto novo e preserva o original.

```javascript
const pdfFile = _util._fileHelper.convert({
    file: htmlFile,
    targetFileName: "htmlConvertido.pdf",
    targetContentType: "application/pdf",
    targetCharset: "UTF-8"
});
```

Conversão direta de imagem para pdf não existe no artigo. O contorno é ler o base64 do campo arquivo, montar um html com a imagem e converter esse html.

```javascript
const base64 = _utils.getMethod("_classId", ID_CLASS_IMG, "_get")({ "_id": ID_OBJ_IMG }).arquivo.getContentAsBase64();
const imagem = "<img src=\"data:image/gif;base64," + base64 + "\"/>";
const htmlFile = _util._fileHelper.create({
    file: imagem,
    targetContentType: "text/html",
    targetFileName: "imagem.html"
});
const imagemEmPDF = _util._fileHelper.convert({
    file: htmlFile,
    targetFileName: "imagemEmPDF.pdf",
    targetContentType: "application/pdf",
    targetCharset: "UTF-8"
});
```

`extract` em pdf recebe `file` e `page` e devolve essa página. Em imagem recebe `file`, `x`, `y`, `width` e `height` em pixels. O ponto inicial mais o tamanho não pode passar do tamanho da imagem; o artigo manda checar com `getFileExtraInfo`.

```javascript
const paginaDoPdf = _util._fileHelper.extract({
    file: pdfOriginal,
    page: 1
});
const imagemExtraida = _util._fileHelper.extract({
    file: imagemOriginal,
    x: 300,
    y: 50,
    width: 400,
    height: 200
});
```

`getFileExtraInfo` recebe `file` e devolve um objeto. O formato muda por tipo de arquivo. O artigo não mostra o retorno de pdf nem de imagem.

```javascript
_util._fileHelper.getFileExtraInfo({
    file: _object.arquivoConvertido
});
```

`readBarCode` procura código de barras, QR Code ou outro código numa imagem. Entradas: `file`, `format` (string), `tryHarder` (booleano opcional; verdadeiro aumenta a acurácia e piora o desempenho), `left`, `top`, `width`, `height` (opcionais, porcentagem da área, não pixel). Retorno escrito: json com um array dos códigos decodificados. O artigo não nomeia a propriedade desse array.

```javascript
const result = _util._fileHelper.readBarCode({
    file: content,
    format: "QR_CODE",
    tryHarder: false,
    left: 0.65,
    top: 0.09,
    width: 0.36,
    height: 0.34
});
```

## _utils.file

`_utils.file` escreve texto em sequência. Não é `_util._fileHelper`.

`createWriter(file, targetFileName, targetContentType, targetCharset)` devolve um writer. `file` pode ser um arquivo existente ou `null` para arquivo novo. Arquivo existente recebe as linhas no fim. A ordem dos quatro argumentos é posicional. O exemplo usa o tipo `text/txt`.

```javascript
const writer = _utils.file.createWriter(null, "teste.txt", "text/txt", "UTF-8");
const writerExistente = _utils.file.createWriter(_object.arquivo, "teste.txt", "text/txt", "UTF-8");
```

`writeLine(String)` acrescenta uma linha. Cada chamada adiciona CR (`0x0d`) e LF (`0x0a`) ao fim da linha anterior. `close()` encerra a escrita e o retorno é o arquivo. `abort()` cancela a escrita; o artigo mostra a chamada no `catch`. O exemplo de `abort` chama `writer.write`, método que o artigo não descreve.

```javascript
const writer = _utils.file.createWriter(null, "teste.txt", "text/txt", "UTF-8");
writer.writeLine("Primeira linha de texto");
writer.writeLine("Segunda linha de texto");
const novoArquivo = writer.close();
```

## _utils.object.DiffService.diff

Compara dois objetos e devolve a lista das diferenças. Assinatura escrita: `_utils.object.DiffService.diff(objeto1, objeto2)`.

Cada item tem `name` (nome do campo), `path` (caminho; aninhado com ponto, como `data.conteudo`), `operation`, `oldValue` e `newValue`. `operation` é `UPDATE`, `ADD` ou `DELETE`.

```javascript
const diferencas = _utils.object.DiffService.diff(noticia1, noticia2);
const camposAlterados = diferencas
    .filter(d => d.operation === "UPDATE")
    .map(d => ({
        campo: d.name,
        caminho: d.path
    }));
```

`name` é o nome exibido. `path` é o caminho do campo. Filtrar só `UPDATE` descarta inclusão e remoção.

## _util._fileHelper.create por URL

O artigo de bit array para pdf usa outro formato de `create`, além do formato com `file`. A chamada traz `url`, `targetContentType`, `targetFileName` e `headers`. O artigo descriptografa o segredo do web service com `_utils.crypto.standardDecrypt` no `encryptedValue` e envia o resultado no header `Authorization`. Não há contrato do bit array em si: o pdf sai da resposta HTTP montada pelo `create`.

```javascript
const token = _utils.crypto.standardDecrypt(aplicacao.auth.token.encryptedValue);
_output = _util._fileHelper.create({
    url: "https://apiteste.com/v1/obterDocumento/",
    targetContentType: "application/pdf",
    targetFileName: id + ".pdf",
    headers: {
        "Authorization": "Bearer " + token
    }
});
```

O `_get` do web service no artigo é `com.sydle.util.webService._get`, não um método de `_utils` nem de `_util`.

## _utils.zip

Manipula zip com ou sem senha. Tipos: `ZipWriter`, `ZipFolder` e `ZipReader`. A instância guarda referência momentânea: cada uso cria de novo.

`new _utils.zip.ZipWriter(nome)` cria zip sem senha. `new _utils.zip.ZipWriter(nome, senha)` cria com senha. Métodos: `addFile` (`file`), `addFolder` (`folder`), `getFile` (devolve o objeto do zip), `rename` (`name`).

`new _utils.zip.ZipFolder(nome)` aparece no exemplo. Métodos da pasta: `addFile` (`file`), `addFolder` (`folder`), `getFiles` (array), `getName` (string), `toString` (string da árvore). O artigo prefixa esses métodos com `zip.` na tabela.

`new _utils.zip.ZipReader(arquivo)` lê sem senha. `new _utils.zip.ZipReader(arquivo, senha)` lê zip criptografado. `getFolder(caminho)` devolve `ZipFolder`; `"/"` pede todas as pastas.

```javascript
const folderCrachas = new _utils.zip.ZipFolder("Crachas");
folderCrachas.addFile(fileCracha);
const zip = new _utils.zip.ZipWriter("Documentos.zip");
zip.addFolder(folderCrachas);
const arquivoZip = zip.getFile();
```

```javascript
const leitor = new _utils.zip.ZipReader(zip.getFile());
const folder = leitor.getFolder("Arquivos/");
```

Métodos do leitor: `existFile` (`filePath` com extensão, bool), `existFolder` (`folderPath`, bool), `getFile` (`filePath`, objeto se achar), `getFolder` (`folderPath`, objeto ou objetos), `getFileHeaders` (array do mapa de headers, sem entrada escrita), `loadFileHeaders` (bool; o texto de saída repete a frase de pasta existente), `listFiles` (array dos arquivos, sem entrada escrita).

## Docusign Connector

Classe de integração, não é `_utils` nem `_util`. O artigo não mostra assinatura de script. Identificadores de método: `updateAccessKey`, `updateAccessKeyScheduled`, `sendDocument`, `recoverUpdatedDocument`, `checkSubscriptionStatus`.

`sendDocument` envia um envelope e os assinantes assinam em ordem. `recoverUpdatedDocument` devolve uma lista de arquivos e um zip. `checkSubscriptionStatus` faz pooling; se o envelope está `completed`, chama `recoverUpdatedDocument`; senão reagenda depois de `checkIntervalMinutes`. `updateAccessKeyScheduled` reagenda depois de `tokenRefreshIntervalMinutes`. O artigo desaconselha pooling, cita 20 minutos por envelope em maio de 2024, expiração de 8 horas e atualização a cada 180 minutos.

Campos: `name`, `accountID`, `user`, `password`, `hostEnv`, `userID`, `apiAccountID`, `integrationKey`, `tokenURI`, `authenticationURI`, `encodedKeys`, `accessToken`, `refreshToken`, `checkIntervalMinutes`, `tokenRefreshIntervalMinutes`, `log`.

## one-utils

Não é `_utils`. Arquivo JavaScript do SYBOX, Métodos Utilitários 1.3.5, importado no script de `_getMetadata`. `Metadata` altera `_metadata.fields` em lote. Cada método aceita o nome do campo ou um array de nomes.

```javascript
const { context } = require("Utilitarios/one-utils")(this);
const { Metadata } = context();
const metadata = new Metadata();
metadata.setVisibleEditableAndRequired(["nome", "sobreNome"]);
```

Métodos e efeito escrito: `setHidden` (`hidden = true`), `setVisible` (`hidden = false`), `setRequired` (`required = true`), `setOptional` (`required = false`), `setReadOnly` (`readOnly = true`), `setEditable` (`readOnly = false`), `setVisibleAndRequired`, `setHiddenAndOptional`, `setHiddenWhenEmpty` (vazio ou nulo), `setVisibleWhenFilled`, `setHiddenAndReadOnly`, `setVisibleAndReadOnly`, `setEditableAndRequired`, `setVisibleEditableAndRequired` (`hidden = false`, `readOnly = false`, `required = true`).

## _utils.resource.lock e isLocked

O título cita `isLocked`. O artigo não descreve `isLocked`. Não há contrato.

`_utils.resource.lock(chave)` serializa scripts que usam a mesma string. Quem chega depois espera o `release`. O retorno tem `release()`. Sem `release`, a chave segue travada. O artigo pede `try`/`finally` para liberar também quando houver erro.

```javascript
const recurso = _utils.resource.lock("insira_uma_chave");
try {
    // bloco exclusivo
} finally {
    recurso.release();
}
```

## Sobrescrever ACL de métodos

Campo de extensão de classe, não é `_utils` nem `_util`. Níveis escritos: explícito, público, herdar e dinâmico. O artigo não mostra assinatura do campo.

Método dinâmico resolve permissão em Obter controle de acesso (`_getAcl`). Para tornar dinâmico um método que não era, o artigo manda interceptar `_getAcl` e marcar o nível dinâmico nesse campo. Ao sobrescrever o comportamento, chama `perform()` antes de alterar `_acl`.

```javascript
perform();
const admin = _system._userGroup._get({ "_id": "asdqwe1321321321321" });
_acl._get.groups.push(admin);
```

Se a permissão de Obter mudar, a listagem só fica correta depois de reindexar a classe. Sem reindexação, o objeto pode aparecer na lista e falhar na abertura.

## _utils.storedAt

`_utils.storedAt(objeto)` devolve a coleção: `PUBLISHED`, `DRAFT` ou `HISTORY`. Uso citado: Obter Metadata, para separar edição (`DRAFT`) de exibição (`PUBLISHED`). Operação pesada de metadata fica dentro do rascunho.

```javascript
if (_utils.storedAt(_object) === "DRAFT") {
}
```

O retorno em Obter Metadata e em Obter Controle de Acesso não é o mesmo. Em Alterar Rascunho, Criar Rascunho e Salvar o valor não muda, porque a coleção da execução não muda.

## _context.objectPath

`_context` existe no método junto de `_object`, `_input` e `_queues`. O artigo cita sistema operacional, link da página e IP, sem contrato desses itens. `objectPath` é o caminho do campo, em especial em classe embutida. Obter Metadata da classe raiz não altera características da classe embutida.

`getPath()` devolve o caminho pelos identificadores. `getFriendlyPath()` devolve o caminho pelos nomes. `concatWith` acrescenta um trecho; `concatWith("teste")` termina em `.teste`. Para `_patch`, o artigo troca `.` por `/`. No exemplo com dois níveis embutidos, o id da raiz é `_object._parent._parent._id`. `ValidationException` recebe a mensagem, `null` e o caminho, para marcar o campo.

```javascript
_utils.addWarningMessage(_utils.stringifyAsJson(_context.objectPath.getPath()));
_utils.addWarningMessage(_utils.stringifyAsJson(_context.objectPath.getFriendlyPath()));
_utils.addWarningMessage(_utils.stringifyAsJson(_context.objectPath.concatWith("teste")));
```

```javascript
if (_object.idade && _object.idade < 18) {
    throw new ValidationException("Astronatas precisam ser maiores de 18", null, _context.objectPath.concatWith("idade"));
}
```

O artigo usa `_utils.addWarningMessage` e `_utils.stringifyAsJson` só para imprimir. Não documenta a assinatura dos dois.

## _objects

Propriedade imutável do método criado pelo usuário: a lista de objetos quando o método é chamado com uma lista. Não é `_utils`. O texto também diz que, nessa chamada, `_object` é preenchido com os objetos selecionados. Os exemplos percorrem `_objects`.

```javascript
_objects.forEach((selectedObject) => {
    package.livro._update(selectedObject);
});
```

```javascript
_objects.forEach((livro) => {
    package.livro._delete(livro);
});
```

## _utils.acl.checkPerm

Verifica se o usuário atual pode executar um método. Retorno `true` ou `false`. Entradas escritas: `method` e `objectOrObjectId`. `method` é obrigatório e é a referência do método, um objeto, como `crm.person._get`. `objectOrObjectId` é id ou referência; se faltar, a checagem é de classe, sem instância.

```javascript
const userCanGetSYDLEEnterpriseObject = _utils.acl.checkPerm(crm.enterprise._get, SYDLE_ENTERPRISE_OBJECT_ID);
```

## _utils.acl.prepareSearch

Assinatura escrita: `_utils.acl.prepareSearch(search)`. `search` é a query do Elasticsearch, tipo escrito como `objetc`, obrigatório. `_search` por script não aplica permissão. O método inclui filtro de leitura (`_get`) do usuário do contexto: a query volta com `bool`/`must`, a query original e um `terms` em `_acl` (`any` mais os ids de permissão, `boost` 1). O artigo diz que o retorno é a query original já modificada.

```javascript
const search = {
    "size": 100,
    "query": {
        "term": {
            "class._id": "000000000000000000000002"
        }
    }
};
const preparedSearch = _utils.acl.prepareSearch(search);
const analyticsResultWithACL = _system._analytics._search(preparedSearch);
```

## _utils.calculateNextDate

`_utils.calculateNextDate(expressaoCron)` devolve a próxima ocorrência em ISO 8601 UTC. O cron do artigo é Quartz: segundo, minuto, hora, dia do mês, mês, dia da semana, ano opcional. `?` no exemplo detalhado é dia da semana sem restrição. A expressão `0 0 9 ? * 2 *` está descrita como segunda-feira às 09:00.

```javascript
const cronExpression = "0 0 8 1/1 * ? *";
_output.date = _utils.calculateNextDate(cronExpression);
```

Exemplo executado em 08/09/2025 às 13:23, cron diário às 8h, retorno `"2025-09-09T11:00:00Z"`. A tabela repete 08:00 como `2025-09-08T11:00Z`. O artigo também diz que o retorno padrão será 00:00 UTC e que pode ser tratado com `moment.utc()`. Esse texto não bate com o exemplo.

## _utils.connector.web

Chamada HTTP. Assinatura escrita: `_utils.connector.web(target, contentType, headers, options)`.

`target` é obrigatório. `contentType` é o tipo enviado. `headers` não é obrigatório; o artigo aceita objeto vazio e o exemplo passa `null`. `options` está marcado como não obrigatório e, na mesma frase, como objeto vazio `{}` obrigatório. Chaves de `options`: `logRequest` (booleano), `connectTimeout` (ms, padrão 60000), `readTimeout` (ms, padrão 60000), `followRedirects` (booleano, status 3xx), `certificate` (referência que implementa `Certificado Privado`), `provider` (string; `"apache"` para PATCH com comportamento que o artigo não detalha).

```javascript
const connector = _utils.connector.web(myUrl, "application/json", null, {});
```

Métodos do retorno, como o artigo escreve:

- `delete`: booleano; `true` para 200 ou 204; `false` nos demais.
- `get`, `patch`, `post`, `put`: objeto com o corpo; exceção se o status não for 200, 201, 202 ou 204.
- `request(method, body)`: objeto com `status`, `headers`, `body` e `bodyAsBase64`. Não lança exceção sozinho.
- `setBasicAuth(login, password)` e `setBearerAuth(authToken)`: `null`. Só configuram o conector.

O exemplo de `get()` direto lê `status`, `body` e `headers` no retorno. A lista de métodos diz que `get` devolve o corpo.

```javascript
connector.setBearerAuth(authToken);
connector.setBasicAuth(login, password);
const response = connector.request("POST", { "id": productId });
const directResponse = _utils.connector.web(myUrl, "application/json", null, {}).get();
```

## _utils.crypto

Suite de campo texto criptografado. Não é `_utils.security.crypto`. O campo tem `encryptedValue` e `maskedValue`. Algoritmos do campo: reversível (`REVERSIBLE`) e irreversível (`IREVERSIBLE` no texto, `IRREVERSIBLE` na tabela). Irreversível não descriptografa pelos métodos nativos.

O artigo não mostra chamada de `checkOriginalValue`, `decode` nem `encode`. Entradas nomeadas:

- `checkOriginalValue`: `valueToChecked` (puro) e `encrypted`. Bool.
- `decode` e `encode`: `algorithm` só `BASE64`, `charset` `UTF-8`, `data`, `params` desconhecido. `decode` devolve a string original. `encode` devolve a string em BASE64.
- `standardDecrypt`: `payload` é o `encryptedValue`. Só algoritmo reversível. Devolve a string pura. A chamada no artigo de pdf é posicional.
- `standardEncrypt`: `payload` é a string. `algorithmType` opcional; sem tipo, o retorno é reversível; `"IRREVERSIBLE"` torna irreversível. Devolve a string criptografada.

```javascript
const token = _utils.crypto.standardDecrypt(aplicacao.auth.token.encryptedValue);
```

## _utils.identityText

Assinatura: `_utils.identityText(object, separator, multipleSeparator)`. Devolve string só com campos de relevância Identidade. `object` é obrigatório. `separator` e `multipleSeparator` não são. Padrão de `separator`: `" / "`. Padrão de `multipleSeparator`: `" , "`. Os dois padrões incluem espaços.

```javascript
const pessoa = _utils.getMethod("_classId", CLASS_PESSOA, "_get")({ "_id": ID_PESSOA });
_utils.identityText(pessoa);
_utils.identityText(pessoa, " - ");
_utils.identityText(pessoa, " | ", " e ");
```

Campo arquivo marcado como identidade não entra na string. Campo de outra relevância também não. Numa referência marcada como identidade, os campos identidade do objeto referenciado são unidos com `multipleSeparator`; o resultado se separa dos outros campos identidade com `separator`. No exemplo, `multipleSeparator` `" e "` junta nome e documento da pessoa, e também os valores múltiplos do documento; `" | "` separa isso do cargo.

## _utils.object.ObjectService.refreshCalculatedFields

Campo calculado grava em `_value` e, por padrão, só atualiza na escrita do objeto. Atualizar calculado na leitura foi descontinuado.

Assinatura: `_utils.object.ObjectService.refreshCalculatedFields(ID_CLASSE, ID_OBJETO, camposParaAtualizar)`. O terceiro argumento é a lista de campos. `null` recalcula todos.

```javascript
const camposParaAtualizar = new _utils.object.ClassFields();
fieldsToRefresh.add(_object._class._id, "isValido");
_utils.object.ObjectService.refreshCalculatedFields(_object._class._id, _object._id, camposParaAtualizar);
_utils.object.ObjectService.refreshCalculatedFields(_object._class._id, _object._id, null);
```

O exemplo específico cria `camposParaAtualizar` e chama `fieldsToRefresh.add`. O artigo não declara `fieldsToRefresh`. `add` recebe o id da classe e o identificador do campo.

## _utils.resource.lock(key)

Mesmo lock do artigo anterior, com a chave explícita. Entrada: `key` (string). Mesma chave, mesma exclusão. Liberar com `release()` em `try`/`finally`.

```javascript
const lockKey = TICKET_CLASS_ID + "_" + TICKET_ID + "_" + METHOD_IDENTIFIER;
const lock = _utils.resource.lock(lockKey);
try {
    // bloco exclusivo
} finally {
    lock.release();
}
```

O artigo também mostra a chave com id do objeto (`"pedido_" + pedido._id`) e com número de processo (`"processo" + _object.numProcesso`, sem separador). Quem não compartilha a string não entra na mesma fila.

## _utils.security.crypto

Caminho `_utils.security.crypto` mais o algoritmo. Não é `_utils.crypto`. Irreversíveis: `Hmac/MD5`, `Hmac/SHA1`, `Hmac/SHA256`, `Bcrypt`. Reversíveis: `RSA/ECB/OAEPPadding`, `AES/GCM/NoPadding`, `AES/CBC/PKCS5Padding`.

`encrypt(payload, params)` devolve `hash` (Base64) e `params`. Esse `params` de retorno não contém chaves. `decrypt(payload, params)` existe nos reversíveis; `payload` é Base64; o retorno é texto puro ou Base64.

Em `params`, `encodeBase64` (padrão `false`) e `charset` (padrão `"UTF-8"`) são opcionais. Na cifra descrevem o payload. Na decifra descrevem o retorno.

O primeiro exemplo do artigo escreve `RSA.ECB.OEAPPadding`. Os exemplos seguintes escrevem `RSA.ECB.OAEPPadding`.

HMAC: `secret` obrigatório. Sem decrypt no artigo.

```javascript
const encryptedMD5 = _utils.security.crypto.Hmac.MD5.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
const encryptedSHA1 = _utils.security.crypto.Hmac.SHA1.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
const encryptedSHA256 = _utils.security.crypto.Hmac.SHA256.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
```

Bcrypt: `secret` obrigatório; `salt` Base64 opcional (128 bits; se faltar, a plataforma gera); `cost` opcional, padrão 10. O `params` devolvido inclui `salt` e `cost`.

```javascript
const encrypted = _utils.security.crypto.Bcrypt.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
```

RSA: cifra com `publicPem` obrigatório e `oaepHash` opcional (`"SHA-256"` padrão; aceita `"SHA-1"` e `"SHA-256"`). O `params` devolvido inclui `oaepHash`. Decifra com `privatePem` obrigatório e `oaepHash` obrigatório. PEM no artigo tem cabeçalho e rodapé de chave pública ou privada. `KeyPairGenerator.generate(bitLength)` existe a partir da 8.9: `bitLength` inteiro, mínimo 1024, recomendado 2048. Devolve `publicKey` e `privateKey`. O exemplo de decrypt depois do `generate` passa só `privatePem`, sem o `oaepHash` que a decifra marca como obrigatório.

```javascript
const encrypted = _utils.security.crypto.RSA.ECB.OAEPPadding.encrypt("texto_a_encriptar", { "publicPem": publicPem });
const decrypted = _utils.security.crypto.RSA.ECB.OAEPPadding.decrypt("hash_a_decriptar", { "privatePem": privatePem, "oaepHash": "SHA-256" });
const keys = _utils.security.crypto.RSA.KeyPairGenerator.generate(2048);
```

AES, modos `AES.GCM.NoPadding` e `AES.CBC.PKCS5Padding`. Chave direta `key` de 128, 192 ou 256 bits, ou `secret` mais `salt` de 128 bits. Com `secret`, a chave sai de PBKDF2-HMAC-SHA256 com 65536 iterações. `salt` e `iv` são opcionais na cifra; se faltarem, a plataforma gera. `iv` tem tamanho 12 no GCM e 16 no CBC. O `params` devolvido inclui `salt` (quando houve `secret`) e `iv`, e não inclui a chave. Na decifra, `iv` é obrigatório; `salt` é obrigatório se não houver `key`; `key` é obrigatório se não houver `secret`.

```javascript
const encryptedGcm = _utils.security.crypto.AES.GCM.NoPadding.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
const encryptedCbc = _utils.security.crypto.AES.CBC.PKCS5Padding.encrypt("texto_a_encriptar", { "secret": "chave_de_criptografia" });
const decrypted = _utils.security.crypto.AES.GCM.NoPadding.decrypt("hash_a_decriptar", paramsDesc);
```

## _utils.token

`_utils.token.generate(user)` recebe o objeto do usuário e devolve a string do JWT. Cada chamada devolve um token diferente, mesmo com o mesmo usuário. Não há outro método no artigo.

```javascript
const token = _utils.token.generate(_user);
```
