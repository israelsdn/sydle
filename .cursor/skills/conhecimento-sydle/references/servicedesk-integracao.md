# Segurança, arquivos, logs e integrações (documentação oficial)

Contrato da documentação oficial do SYDLE ONE para arquivo, autenticação, criptografia, assinatura, saída para sistema externo, caixa de e-mail, banco, HTTP, WebDAV, pacote entre ambientes, início de processo por API e log. Cada seção segue um artigo que traz campo, regra de execução ou assinatura. Método cujo artigo não mostra a assinatura fica sem assinatura aqui.

## Manipulação de arquivos (fileHelper)

`_util._fileHelper` prepara manipulação de arquivo. A chamada monta a operação. A execução ocorre na gravação do objeto (save/update), para o arquivo entrar em memória só nesse momento.

`convert` recebe `file`, `targetFileName` e `targetContentType`. A partir da 8.8.0 também aceita `options.provider`. O provedor `html.pdf.one.v2` converte HTML em PDF com CSS3; o HTML leva `@page` dentro de `style` para o tamanho da página, e `font-family` precisa estar explícito. Fonte externa entra por `@import`. Docx para PDF depende das fontes embutidas no documento. Na 8.24.0 a melhora de performance é experimental e um administrador da organização precisa ligá-la. Destinos aceitos como `targetContentType`: `text/html`, `application/pdf`, `image/jpeg`, `image/png`. A tabela recusa docx, ppt, pptx, txt, a grafia `xlxs`, xml e bmp como destino.

`create` exige `targetFileName` e `targetContentType`. `targetCharset` é opcional e o padrão é `UTF-8`. O conteúdo entra por um só destes: `content` (string; objeto ou array passa por `JSON.stringify` ou `_utils.stringifyAsJson`), `base64`, ou `url` com `headers` opcional.

`concatenate` exige `files` e `targetFileName`. `targetContentType` padrão é `application/pdf`. `pageBreak` é booleano, padrão falso; a descrição do campo no artigo repete o texto de conteúdo de `create`. O artigo limita a junção a imagens e PDF num único PDF.

`extract` exige `file`. `targetContentType` padrão é `application/octet-stream`. `targetFileName` padrão é `"Extract_"` mais o nome. Em PDF, `page` recorta uma página. Em imagem, `x`, `y`, `width` e `height` recortam: decimal é porcentagem da dimensão original, inteiro é pixel. `options.extractPdfAnnotations` vale só para PDF, padrão falso, e usa outro modo de extração para trazer anotações.

`extractFile` tira um arquivo de um zip: `file` e `path`, ambos obrigatórios.

`getFormatsToConvert` recebe `contentType`. `getMIMEType` recebe `file` e devolve `{ "mimetype": ... }`. `getFileExtraInfo` recebe `file`. Imagem JPEG, PNG e a grafia BPM do artigo: `width` e `height`. PDF: `totalPages`, `canAssembleDocument` (a lista repete essa chave), `canExtractForAccessibility`, `canFillInForm`, `canModify`, `canModifyAnnotations`, `canPrint`, `isOwnerPermission`, `isReadOnly`, `isEncrypted`. PPT e PPTX: `totalSlides`.

`readBarCode` exige `file`, `format`, `top`, `left`, `height` e `width`. O recorte é percentual de 0.0 a 1.0. `tryHarder` padrão é falso. PDF vira imagem antes da leitura; `imgResolution` existe a partir da 8.36, mínimo 200, máximo 800, padrão 200, e valor fora da faixa é erro de validação. O retorno é `{ "codes": [{ "format": "...", "value": "..." }] }`. Formatos: `AZTEC`, `CODABAR`, `CODE_39`, `CODE_93`, `CODE_128`, `DATA_MATRIX`, `EAN_8`, `EAN_13`, `ITF`, `MAXICODE`, `PDF_417`, `QR_CODE`, `RSS_14`, `RSS_EXPANDED`, `UPC_A`, `UPC_E`, `UPC_EAN_EXTENSION`.

`resizeImage` exige `image` e `format`, e aceita JPEG e PNG. `height` e `width` estão marcados como obrigatórios e, ao mesmo tempo, o texto diz que omitir um dos dois mantém a proporção. Decimal é porcentagem; inteiro é pixel.

`toDownload` exige `file`. `contentDisposition` padrão é `attachment; filename={{NOME_DO_ARQUIVO}}`. `cacheControl` é opcional.

O artigo aponta um fórum sobre o momento do hash e outro sobre string para PDF, sem descrever o momento do hash.

```javascript
const pdfFile = _util._fileHelper.convert({
    "file": _object.content,
    "targetContentType": "application/pdf",
    "targetFileName": "new_file",
    "options": {
        "provider": "html.pdf.one.v2"
    }
});
```

Armadilha: o valor devolvido na chamada ainda é a operação adiada. O exemplo de `convert` só trata sucesso e erro em volta de `perform()`, que o artigo não define.

## Upload de arquivos via API

Há três entradas. Base64 e URL passam por `_util._fileHelper.create` e o arquivo segue no campo de arquivo do `_create` (ou equivalente) da classe de negócio. Binário usa `_upload`, presente em toda classe concreta: `POST` multipart, chave `file`. A resposta traz `_id`, `name`, `contentType`, `length`, `hash` e `storage`.

A referência devolvida por `_upload` entra em objeto da classe cujo `_upload` foi chamado. A classe Arquivo do pacote ECM guarda arquivo permissionado no campo `content`; o tipo de campo Arquivo é outra coisa. Criar objeto dessa classe pede usuário ou grupo de leitura e de escrita, porque o usuário da criação precisa das duas permissões.

```javascript
const file = _util._fileHelper.create({
    "base64": fileBase64,
    "targetFileName": fileName,
    "targetContentType": format
});
```

```javascript
const file = _util._fileHelper.create({
    "url": urlDoArquivo,
    "headers": headers,
    "targetFileName": fileName,
    "targetContentType": format
});
```

Armadilha: gravar em outra classe o `_id` gerado pelo `_upload` de Arquivo não resolve a referência.

## Extração textual de arquivos

Campo do tipo Arquivo extrai texto quando a opção Extrair conteúdo está ligada nas configurações adicionais. O artigo cita TXT, PDF, DOCX, XLSX, PPTX, PNG, JPEG, BMP e outros. O conteúdo extraído é indexado com o objeto, e a busca do objeto alcança o interior do anexo. A visualização do objeto mostra um botão no campo para ver o texto. O artigo não mostra método de script para ler esse texto.

## Manipulação de arquivos Zip

Escrita: instância de `_utils.zip.ZipWriter`. Do zero, o nome é obrigatório: `ZipWriter(targetFileName)`, `ZipWriter(targetFileName, password)` ou `ZipWriter(targetFileName, password, encryptionMethod)`. Com senha e sem método, a criptografia é `DEFAULT`, equivalente a passar `"DEFAULT"`. `AES_256` funciona dentro do ONE e o artigo diz que a maior parte dos sistemas operacionais ainda não abre esse método. Zip já existente: `ZipWriter(zipFile)` ou `ZipWriter(zipFile, password)` quando há senha. `addFile` recebe arquivo da plataforma. `new _utils.zip.ZipFolder(nome)` aceita `addFile` e `addFolder`; o writer recebe a pasta por `addFolder`. `getFile()` devolve o arquivo zip. `rename` muda o nome quando o writer nasceu de um zip existente; sem isso, o derivado repete o nome anterior.

Leitura: `_utils.zip.ZipReader`. A tabela de campos é `zipFile` (obrigatório), `password` e `loadFileHeaders` (padrão falso). Os exemplos que ligam o mapa de headers passam `true` no segundo argumento, sem senha. O artigo não mostra senha e `loadFileHeaders` na mesma chamada. `getFile(path)` devolve arquivo ou `null`. `getFolder(path)` devolve `ZipFolder` ou `null`; `getFolder("/")` é a raiz, com `getFiles()`, `getFolders()` e `toString()`. `importZip(zip, path)` e, com senha, `importZipWithPassword(zip, path, password)` extraem o zip de origem sob o path, preservando a estrutura; arquivo que não é zip lança exceção de tipo inválido. `existFile`, `existFolder` e `getFileHeaders` exigem `loadFileHeaders` verdadeiro. Cada header expõe `fileName`, `isDirectory` e `contentType`. `loadFileHeaders()` devolve booleano.

```javascript
const zip = new _utils.zip.ZipWriter("Documentos.zip", senha, "AES_256");
const folder = new _utils.zip.ZipFolder(nome);
folder.addFile(arquivo);
zip.addFolder(folder);
const zipFile = zip.getFile();
```

```javascript
const reader = new _utils.zip.ZipReader(zipFile, senha);
const arquivoInterno = reader.getFile("Nome1/Cpf.pdf");
```

Armadilha: path de pasta no exemplo de `getFolder` termina com barra (`"Nome1/"`); o de `existFolder` não (`"folder1/folder2"`).

## Manipulação de arquivos PDF

A partir da 8.11.0, `_utils.file.pdf.PdfReader` é instanciado. `new _utils.file.pdf.PdfReader(pdfFile)` ou, com senha, `PdfReader(pdfFile, password)`. `skipPages(n)` conta sempre a partir do início: a página 1 é a primeira, `skipPages(3)` faz o `nextPage` seguinte devolver a página 4, e um `skipPages` posterior reposiciona de novo a partir do começo. Valor maior que o total não altera a posição. `nextPage()` devolve a página ou `null`. `totalPages()` devolve o total. `close()` libera o leitor.

A página tem `getNumber()` a partir de 1, `getText(options)`, `getImageAsBase64(contentType)` com MIME de imagem, e, a partir da 8.34.0, `getPageAsBase64()` (PDF de uma página, em base64). Em `getText`, `charset` padrão é `UTF-8`, `forceOCR` padrão é falso, e `options` segue para o serviço de OCR. Com `forceOCR` falso, texto da página volta direto e texto dentro de imagem fica de fora; com verdadeiro, o OCR lê a página inteira, inclusive imagem, com custo de processamento e de cobrança.

O artigo recomenda o leitor no lugar de `_util._fileHelper.extract` quando o uso é texto por OCR ou uma página isolada: o PDF entra na memória uma vez. O trecho recomendado chama `skipPages(pageIndex)` e em seguida `nextPage()`.

```javascript
const reader = new _utils.file.pdf.PdfReader(pdfFile);
try {
    const total = reader.totalPages();
    reader.skipPages(3);
    const page = reader.nextPage();
    const pageAsText = page.getText({
        "forceOCR": true,
        "charset": "utf-8"
    });
    const pageAsImage = page.getImageAsBase64("image/png");
    const pageAsPdf = page.getPageAsBase64();
} finally {
    reader.close();
}
```

Armadilha: `skipPages` é absoluto. Tratar `pageIndex` como número da página e passá-lo a `skipPages` entrega a página seguinte.

## Aplicação

A classe Aplicação limita o que uma requisição de API obtém e quem obtém. `Identificador` entra na URL. `Métodos` lista o que a aplicação alcança e fica oculto quando `Todos os métodos são acessíveis?` é verdadeiro. `Tokens` configura token de usuário específico. `Autenticadores` valida o acesso e o fator de segurança. `Restringir acesso` e `Regras de restrição` limitam por IP, grupo e classe. `Realizar chamadas apenas com token` aceita só os tokens configurados.

Cada autenticador entra uma vez na lista. Repetir o mesmo autenticador é recusado na entrada duplicada. O Autenticador de recurso OAuth também só é aceito uma vez por aplicação.

As classes de autenticação do autenticador implementam a interface Usuário de Acesso: classe de sistema (Usuário), de SYBOX (Pessoa/CRM) ou classe própria. O artigo lista estes padrões: básico, certificado A1 e A3, e-mail com código verificador, LDAP, SSO customizado, OAuth2, redes sociais (Facebook, Google, Instagram, Linkedin e Twitter) e SAML 2.0.

A partir da 8.10, `_system._application.refreshAllTokens` atualiza todos os tokens de uma aplicação. O caso citado é exportação de aplicação no SYBOX.

```javascript
const appWithRefreshedToken = _system._application.refreshAllTokens({
    "_id": appId
});
```

## Autenticadores

Objeto da interface Autenticador, associado à Aplicação. O método da interface é `authenticate`. Há Nome, Identificador e Configuração de Sessão: tempo de inatividade, em segundos, contado da geração do token, renovável por uma API de renovação antes de expirar; tempo de sessão, em segundos, contado do login, depois do qual o token não renova.

Autenticação basic exige usuário e senha. Vários basic na mesma aplicação são tentados na ordem até o primeiro sucesso. Header `Authorization: Basic` só passa se `Realizar chamadas apenas com token` estiver desmarcado. Dois logins seguidos, no mesmo login e senha, em intervalo curto, podem usar cache e pular a lógica, inclusive o script pós-autenticação.

No Autenticador básico padrão, `Obter usuário de forma padrão?` ligado busca o login nas Classes de autenticação e valida a senha. `Permite "Esqueci minha senha"` exige Mailbox, tempo de validade do link em segundos e formato de e-mail: template HTML (o artigo cita as chaves `{{url}}` e `{{user.name}}`) ou script que preenche `_output.html`. Pode haver script de validação de senha e script pós-autenticação. Com o flag desligado, o script recebe login e senha em `_input` e devolve o usuário em `_output.user`; nulo ou exceção impede o login. Nesse modo não há recuperar senha nem script de validação de senha. `_input.password` não expõe o valor: `check(passwordToCheck)` compara com senha plana ou campo criptografado, inclusive irreversível; o valor segue para um objeto `_ecm._ldapConnection`; `getMD5()` devolve o hash MD5.

A partir da 8.24, a validação padrão de senha escolhe regras de complexidade e devolve os erros de uma vez, já localizados. A validação customizada continua sendo um script.

Autenticador LDAP aponta para `_ecm._ldapConnection`, mais Domínio de usuários, Endereço base de buscas e Classe de usuário no LDAP. No modo padrão, autentica no LDAP e busca a Classe de autenticação. Se achar, atualiza e devolve. Se não achar, cria usuário local quando `Autenticar somente usuários cadastrados` está desmarcado. Sincronização de campos: Nunca, Sempre, Somente na criação de um usuário novo, ou Somente se vazio. O valor é fixo ou atributo LDAP. O login padrão usa o atributo `sAMAccountName`. Atributo do tipo texto aceita template `{{nomeDoAtributo}}`; se todos os atributos faltam, o valor é vazio; se um existe, o ausente entra como texto vazio. Template com chaves desbalanceadas, ou em campo que não é texto, é recusado ao salvar. Login com atributo único, sem template, recebe o domínio em minúsculas (`usuario@dominio`). Login com template não recebe esse complemento. No modo customizado, `_input.adData` é o JSON do LDAP e `_input.ldapConnection` é a conexão usada; o script devolve `_output.user` e faz sozinho sincronização e criação.

Classe genérica basic implementa a interface, tem campo `identifier` e método `authenticate`, com as mesmas regras do script customizado do básico padrão.

SSO também implementa Provedor de identidade. Vários SSO aparecem como botões. Um único autenticador, e ele SSO, dispara o fluxo sem botão. Etapas: o frontend pede os dados em `/1/{app}/sys/auth/sso/signin/...`; o IdP autentica; o retorno cai em `/1/{app}/sys/auth/sso/authenticate...` ou `/1/{app}/sys/auth/sso/generic/authenticate`; o ONE devolve redirecionamento com token temporário; o frontend troca pelo token definitivo. Logout ativo: `/1/{app}/sys/auth/sso/signout/...`, o IdP encerra, volta em `/1/{app}/sys/auth/sso/logout...`, e o ONE encerra a sessão. O IdP também pode iniciar no passo em que ele mesmo encerra a sessão. A partir da 8.34 dá para configurar restrição do token por IP, padrão verdadeiro, e expiração em segundos, inteiro de 1 a 300, padrão 60.

SAML configura emissor, URL de login do IdP, binding HTTP POST ou HTTP Redirect, resposta criptografada, requisição assinada, algoritmo, chave pública PEM, encoding, política de NameID, logout ativo, URL e binding de logout, URL pós-logout e whitelist de `one_redirect`. Obtenção padrão segue o LDAP, com atributos SAML; NameId costuma ir para o login. Obtenção customizada recebe `_input.parameters`. Certificado próprio do cliente, a partir da 8.22: objeto Certificado privado padrão, Provedor SSO, protocolo SAML, desmarcar Usar chave privada padrão para SP? e informar a chave. O certificado padrão da plataforma fica para teste e homologação. Importar dados e Visualizar dados de conexão também são da 8.22. A importação ainda pede Nome, Identificador, Emissor e Obtenção de usuário à mão.

Autenticador OAuth, a partir da 8.36, usa Authorization Code e pode usar OIDC. Campos: ID e segredo do cliente (segredo criptografado), endpoint de autorização, endpoint de token, OIDC habilitado, endpoint JWKS, endpoint de informações do usuário (obrigatório sem OIDC), escopos, PKCE, modo e endpoint de sign out, whitelist e parâmetros adicionais. Todo endpoint é `https://`. URL de redirecionamento com mais de 256 caracteres é ignorada. Com OIDC, o escopo `openid` entra sozinho e o usuário sai do `id_token`, validado no JWKS (RFC 7517). Endpoint que devolve certificado X.509 em PEM não serve. Sem OIDC, os dados saem do endpoint de usuário. PKCE gera `code_verifier` e envia `code_challenge` SHA-256 com `code_challenge_method=S256`. Login configurado à mão aceita o mesmo template de claims do LDAP. Sem login configurado, OIDC usa `{{sub}}@{{iss}}` e, sem OIDC, só `sub`. `id_token` ausente, assinatura inválida, token expirado ou `aud` diferente do ID do cliente rejeita a autenticação, sem tentativa alternativa. Sign out: Inativo (só local); Revogação de token (chamada servidor a servidor, RFC 7009; falha vai para log); Revogação de sessão (redireciona ao provider com `post_logout_redirect_uri` e, se houver, `id_token_hint`). `access_token` e `id_token` ficam criptografados na sessão. Se o IdP autenticou e o ONE recusou o usuário, sign out ativo desloga o provider. Importar dados lê `{issuer}/.well-known/openid-configuration` e, na falta, `{issuer}/.well-known/oauth-authorization-server`, preenche endpoints, escopos, OIDC, PKCE e sign out em rascunho. ID e segredo do cliente continuam manuais. Visualizar dados de conexão devolve `redirect_uri`, ID do cliente, escopos, URL de back channel logout e se o logout do IdP precisa informar `sid`.

SSO customizado, com chamada padrão, define método GET (redirect) ou POST (form), URL e parâmetros fixos ou vindos da requisição. Sem a chamada padrão, o script lê `_input.parameters` e preenche `_output.method`, `_output.parameters` e `_output.url`. O redirecionamento pós-login é valor fixo, atributo de entrada ou script (`_input.parameters`, `_input.success`, `_input.authenticationError`, saída `_output.url`; vazio usa o caminho base do frontend). Logout ativo repete o par chamada e redirecionamento, sem URL de erro. Obtenção de usuário segue o SAML.

Classe genérica SSO implementa Autenticador e Provedor de identidade, com `identifier`, `enableIPAddressVerificationForSSOLogin` (booleano, padrão falso, a partir da 8.34) e `sSOTokenAuthenticationDurationTime` (número de 1 a 300, padrão 60). Métodos: `getSignInUrlCall` (`_output.method`, `_output.parameters`, `_output.jsonResponse`, `_output.url`), `authenticate` (`_output.user`), `getSignInRedirectUrl`, `getSignOutUrlCall`, `getSignOutRedirectUrl`. `getServiceProviderUrl` a plataforma já implementa.

Autenticador de recurso OAuth, a partir da 8.40, marca a aplicação como recurso protegido. O único campo próprio é a Aplicação de login. A aplicação aceita um só. Este autenticador não aparece no login, não cria sessão e não tem configuração de sessão. Retirá-lo corta, na requisição seguinte, o acesso OAuth à aplicação e mantém a sessão na Aplicação de login, salvo quando a própria aplicação lista o autenticador que validou o usuário. Enquanto houver referência, a Aplicação de login não pode ser removida. A aplicação `webdav` pode ser marcada.

Autenticação por certificado lê dados públicos de um certificado local já validado. Botão no login; se for o único autenticador, o fluxo dispara sozinho. Obtenção padrão ou customizada; no customizado os dados chegam em `_input.certificateData`. O redirecionamento passa por página externa, e o artigo manda acionar o suporte da SYDLE para o cadastramento do ambiente.

Autenticação por token lê um JWT no header `Authorization: bearer` e não aparece na tela de login. Token emitido pelo ONE é JWE. Se a validação padrão falha, o token segue para o autenticador de token da aplicação. O script recebe `_input.token` e devolve `_output.user`. Para JWS, o artigo indica `_utils.security.token.JWSParser` e não lista os métodos.

Autenticador de fluxo, a partir da 8.36, é o autenticador principal, em etapas, e não um segundo fator. Não há `_user` prévio. No sucesso, `_output.user` é obrigatório. Cada chamada recebe `_input.code` (a primeira é `start`) e `_input.data`. `_output.result` é `success`, `error` ou `nextOperation`. Em `nextOperation`, `_output.nextOperation` traz `operationCode`, `clientForm`, `returnData` (visível ao requisitante) e `contextData` (fica no token da operação e volta mesclado em `_input.data`). Início: `POST /api/1/{aplicação}/sys/auth/flow/start/{identificador do autenticador}`, sem corpo; a resposta traz `status` `next_step_required`, `operationToken`, `operationCode` `start`, `clientForm` e `returnData`. O script só roda no próximo endpoint: `POST .../sys/auth/flow/next/{identificador}`, corpo `operationToken`, `operationCode` e `params`. Sucesso devolve HTTP 200 no formato de login. Nova etapa devolve HTTP 200 com `next_step_required`, novo `operationToken`, `operationCode`, `clientForm`, `returnData` e `endpoint`. Etapa inválida devolve HTTP 400 sem payload; o mesmo `operationToken` e `operationCode` repetem a etapa. Token expirado, inválido ou de outra aplicação devolve HTTP 200 com `status` `restart_process` e `operationCode` `reset`, sem `operationToken` novo.

Armadilha: o padrão verdadeiro da restrição de IP do token SSO, no texto geral a partir da 8.34, convive com o padrão falso do campo `enableIPAddressVerificationForSSOLogin` na classe genérica. `sub` sozinho cola usuários de providers diferentes. Login LDAP com template deixa de receber o domínio.

## Regra de complexidade de senhas

A partir da 8.24, para autenticador do tipo padrão. A classe Regra Complexidade de Senha tem Nome, Descrição da regra e Mensagem de erro, todos obrigatórios, e um script que recebe a senha e um valor, quando a regra pede parâmetro, e devolve verdadeiro ou falso. No máximo um parâmetro adicional. Quando ele existe, Descrição e Mensagem de erro contêm `{{0}}`, trocado pelo valor informado no autenticador. Regras nativas, cada uma com inteiro no input: tamanho mínimo, quantidade de minúsculos, de maiúsculos, de numéricos e de especiais. Dá para criar regra própria.

## Recuperar senha

O artigo limita a função ao Autenticador Básico Padrão e ao flag `Permite 'Esqueci minha senha'`. Mailbox, validade do link e o conteúdo do e-mail estão no artigo de Autenticadores. Com obtenção de usuário customizada, o próprio artigo de Autenticadores diz que recuperar senha não existe.

## Fator de segurança

A partir da 8.x, um autenticador basic pode ter segundo fator ou mais. Cada fator é uma sequência de operações. A primeira tem código fixo `start`. O resultado de uma operação é sucesso, erro ou próxima operação. Sucesso autentica naquele fator e pode ainda exigir o fator seguinte. Erro impede o login. Depois do sucesso do autenticador, a resposta volta o código da operação inicial.

Na Aplicação, a classe embutida Fator de segurança por Autenticador tem o autenticador e a lista de fatores. Autenticador duplicado é recusado. O script pós-login da Aplicação roda depois do autenticador e dos fatores, sem retorno, com `user`, `authenticator` e `securityFactors`.

`POST /api/1/{aplicação}/sys/auth/signIn/{identificador do autenticador}` com `userLogin` e `userPassword`. Falha do autenticador: HTTP 401 sem payload. Sucesso: sempre `operationCode` `start` do primeiro fator, mais `clientForm`, `returnData` e `operationToken`. Passos seguintes: `POST .../sys/auth/mfa/step` com `operationToken`, `operationCode` e `params`. Sucesso sem fator restante devolve `code` (código de acesso), `name`, `login` e `accessToken`. Sucesso com fator restante devolve `operationCode` `start` e `operationToken` do próximo fator. Erro de validação: HTTP 400 sem payload. Erro inesperado no processamento: HTTP 500 sem payload. Próxima operação devolve `operationCode`, `clientForm`, `returnData` e `operationToken`.

TOTP nativo: no primeiro acesso o segredo sai em texto e em QR Code, mais códigos de backup de uso único, que não podem ser consultados depois. Códigos seguintes têm 6 dígitos e valem 30 segundos, com tolerância de relógio. Reset em Preferências, Mais opções, Limpar códigos de segurança; o próximo acesso volta a ser o primeiro.

Fator customizado implementa a interface Dados de implementação de fator de segurança. A classe genérica tem um script. Entrada: `code`, `data` (`params` da API mais `contextData` da operação anterior) e `user`. Saída: `result` (`success`, `error` ou `nextOperation`) e, na próxima operação, `operationCode`, `returnData`, `clientForm` e `contextData`. O objeto Fator de segurança escolhe implementação Nativa ou Customizada.

```javascript
_output.result = "nextOperation";
_output.nextOperation = {
    "operationCode": "requireSmsCode",
    "returnData": {},
    "clientForm": "<html></html>"
};
```

Armadilha: o exemplo de organização por mapa, no artigo, devolve `success` antes da comparação do código. O `start` do fator seguinte só chega depois do sucesso do fator anterior.

## Delegação

O usuário delega autorização a outros, com data de validade, em Preferências, aba Geral. A ação passa a poder o que o autorizador pode. O registro fica no formato `Autorizador / Autorizado`. A delegação gera objeto da classe Usuário Autorizado. No script, `_user` vira esse objeto: os campos visíveis são os do autorizador, e os do autorizado ficam em `_user._realObject`.

```javascript
if (!_user._realObject) {
    return;
}
const idAutorizador = _user._id;
const idAutorizado = _user._realObject._id;
```

Armadilha: ler `_user._id` durante a delegação devolve o autorizador.

## Plugin de Assinatura ONE Signer

Plugin local para assinatura com certificado instalado na máquina. O artigo aponta o instalador `one-signer-setup-0.1.1.exe`. A instalação recomendada é para todos os utilizadores, com permissão de administrador, para o Java ser instalado junto. A JDK mínima é a 24; o caminho padrão citado é `C:\Program Files\Java\jdk-24`. O programa sobe depois da reinicialização, ou pela busca One Signer. Erro de permissão no fim da instalação significa que o Java não foi instalado como administrador. A mensagem `This application requires a Java Runtime Enviroment 24.` aponta JDK ou variável de ambiente fora da versão 24.

## Assinatura

Assinatura de XML, PDF ou texto usa certificado digital. O formato, quando não é informado, é o objeto padrão da interface Formato de Assinador: Formato XML DSig / Xades ou Formato Assinatura PDF. Atributos XAdES: SigningCertificate, SignaturePolicyIdentifier (OID, digest em base64 e URL), SigningTime, SignatureTimeStamp, CompleteCertificateRefs, CompleteRevocationRefs, SigAndRefsTimeStamp, RefsOnlyTimeStamp, CertificateValues, RevocationValues e ArchiveTimeStamp. PDF só tem SigningTime e SignatureTimeStamp. Campo avançado: algoritmo digest. Carimbo de tempo exige servidor TSA. Cadeia e lista de revogação, quando o atributo pede, entram nos parâmetros `crt` e `crl`, arrays de arquivos.

Assinatura por script usa certificado A1 guardado na classe Certificado Privado Padrão: upload PKCS#12 (`.pfx` ou `.p12`), identificador e senha gravada criptografada. Há permissão de edição e permissão de uso em assinatura. Quem edita o certificado também pode assinar. A assinatura só ocorre se o certificado está habilitado para o usuário do contexto e válido no período. Sem o parâmetro `pki`, vale o Certificado Privado padrão das Preferências do usuário, em Segurança.

`com.sydle.one.security.DefaultPrivateCertificate.signPDF` devolve arquivo. Parâmetros no exemplo: `pki`, `file`, `reason`, `location`, `visual` (`image`, `text`, `fontSize`, `page`, `x`, `y`, `width`, `height`), `signFormat` e, se o formato tem carimbo, `timeStampServer`.

`signXML` assina arquivo (devolve arquivo) ou string (devolve o XML em `signed`). `signatures` nulo assina o documento inteiro. Cada item tem `sign` (XPath; `/*` é o documento), `signAt`, `signBefore`, `signFormat` e `transformXpath`. `content` e `charset` valem para string.

`generateSignature` e `generateCMSSignature` assinam texto ou, a partir da 8.17, arquivo. A saída usada no artigo é o campo `signature`. Parâmetros: `pki`, `content` ou `file`, `charset`, `algorithm` (o exemplo usa `sha1WithRSA`), `detached` só no CMS, e a partir da 8.17 `signatureDate`, `timeStampServer` e `signFormat`.

Pelo formulário, o campo Arquivo com Habilitar assinatura aponta um ou mais objetos da interface Assinador Documento. Quatro classes: Assinador Documento Interno (o mesmo Certificado Privado Padrão; carimbo de tempo com URL, tipo de autenticação e credencial Basic ou Bearer), gov.br (login na conta, chave privada fora da plataforma, ambiente de produção ou homologação, ID e segredo, URL de redirecionamento; o artigo recomenda manter o padrão e informar `https://{{orgId}}.sydle.one/#/govBrRedirect/`; conta nível PRATA ou OURO; este assinador não assina XML e não faz carimbo de tempo), Signer Digital (extensão no browser, certificado local A1 ou A3, só Windows no artigo) e Lacuna (extensão Lacuna Web PKI, chave de licença comprada à parte). Cadeia permitida e lista de revogação, no Interno, filtram a lista e alimentam atributos. No Signer Digital e no Lacuna, esses arquivos entram na validação e nos atributos, e não na listagem de certificados locais. Exibir certificados inválidos mostra o inválido e a assinatura ainda valida. Filtro de uso restringe o uso do certificado. Scripts de validação do Lacuna existem por compatibilidade e o artigo desaconselha o uso.

Configuração de PDF no campo: formato, carimbo visual com texto (`{{user}}`, `{{date}}`, `{{CN}}`), imagem, posição, tamanho e página; página vazia assina na última. XML: personalizações com nome, XPath a assinar, formato, posição, assinar antes de, e XPath de transformação. Várias personalizações usam Escolha de local: uma, uma ou mais, ou todas. Em `_getMetadata`, `signatureLocationChoice` aceita `"All"`, `"OnlyOne"` e `"OneOrMore"`.

```javascript
_metadata.fields.arquivo.enableSigning = true;
_metadata.fields.arquivo.includeVisualSignature = true;
_metadata.fields.arquivo.signatureLocationChoice = "All";
```

Armadilha: formato com carimbo sem `timeStampServer`, ou com atributo de cadeia sem `crt` e `crl`, falha na validação. Certificado A3 não entra no fluxo de script, que é A1 no servidor.

## Utilitários de certificado e assinatura

`_utils.security.certificate.Certificate`: `createFromFile(cerFile)`, `createFromBase64(base64)`, `createArrayFromZipFile(zipFile)`. Métodos: `checkValidity()`, `getBirthDate()`, `getCPF()`, `getCommomName()`, `getData()`, `getEmail()`, `getKeyUsage()`, `getNotAfter()`, `getNotBefore()`, `verifyChain(chain)` (array de certificados; verdadeiro se algum é o emissor), `exportToPemFile()` a partir da 8.20. O exemplo de PDF chama `getCommonName()`.

`PrivateCertificate.createFromFile(file, encryptedPassword)` lê `.pfx` ou `.p12`. A senha já entra criptografada pela criptografia padrão da organização, como texto ou como campo criptografado. Os métodos repetem os de Certificate, exceto `exportToPemFile`. `getPublicCertificate()` existe a partir da 8.20.

`CertificateRevocationList`: `createFromFile`, `createFromBase64`, `createArrayFromZipFile`. `isRevoke(certificate)` aceita Certificate ou PrivateCertificate.

`_utils.security.pdfsignature.Signature.getSignatures(pdfFile).getSignatures()` devolve as assinaturas. Cada uma tem `getCertificate()`, `getCertificateData()`, `getName()` e `getPosition()` com `getHeight()`, `getLeft()`, `getPage()`, `getTop()` e `getWidth()`. `getBytesToExternalSign(pdfFile, certificate, stampParams, timezone, encode, signFormat)` devolve objeto com `getAlgorithm()`, `getBytesToSign()`, `getDocumentIdentifier()` e `getSignatureDate()`. `externalSign(pdfFile, certificate, stampParams, timezone, signatureDate, documentIdentifier, signatureBase64, timeStampServerSettings, signFormat)` grava a assinatura externa. `scriptSign(pdfFile, certificate, stampparams, timezone, basefunction, encodeSHA256, timeStampServerSettings, signFormat)` recebe uma função JavaScript: entrada em base64, retorno da assinatura em base64. `StampParams.create(image, text, fontSize, stampPosition)`. `StampPosition.create(top, left, heigth, width, page)` expõe `getHeigth()`.

`_utils.security.signature.TimeStampServerSettings`: `createBasic(url, username, password)`, `createBearer(url, token)`, `createNoAuth(url)`. O objeto tem `getUrl()`, `getAuthenticationType()`, `getUsername()`, `getPassword()` e `getToken()`.

`RSASignature`, a partir da 8.10: `sign(payload, params)` e `verifySignature(payload, signature, params)`. `privatePem` ou `publicPem` obrigatório. `hashMethod` opcional, `SHA-256` ou `SHA-1`, padrão `SHA-256`. `charset` padrão `UTF-8`. `encodeBase64` padrão falso. O retorno de `sign` traz `hash` em base64 e `params` sem a chave privada. `ECDSASignature` repete esse contrato a partir da 8.30.

`_utils.security.xmlsignature.Signature` segue o PDF. `getPosition()` aqui tem `getSighPath()` e `getSigRef()`. `getBytesToExternalSign(xmlFile, certificate, encode, signatureLocation, certChain, crl)`. `signatureLocation` é array com `sign`, `signAt`, `signBefore`, `signFormat` e `transformXpath`. `externalSign` e `scriptSign` recebem arquivo, certificado, data, identificador, assinatura, carimbo, localizações, cadeia e CRL, na ordem que o artigo lista para cada método.

`CMSSignature`, a partir da 8.17: `getBytesToExternalSign(file, certificate, encode, signFormat)` com os getters `getAlgorithm`, `getBytesToSign`, `getDocumentIdentifier` e `getSignatureDate`. `externalSign(file, certificate, signatureDate, signatureBase64, timeStampServerSettings, signFormat)` devolve arquivo `.p7s` de assinatura destacada. O exemplo do artigo lê `bytesToSign`, `signatureDate` e `documentIdentifier` como campos do retorno, e chama `getBytesToSign()` no texto do método.

```javascript
const certificate = _utils.security.certificate.Certificate.createFromFile(arquivoCer);
const valido = certificate.checkValidity();
const chaves = _utils.security.crypto.RSA.KeyPairGenerator.generate(2048);
```

Armadilha: a lista do certificado escreve `getCommomName` e o exemplo escreve `getCommonName`. A posição do carimbo escreve `heigth`. O exemplo de cadeia chama `verifyChain` num nome de variável que o trecho não criou.

## Utilitários de criptografia

Caminho `_utils.security.crypto` mais o algoritmo. Algoritmos: Hmac/MD5, Hmac/SHA1, Hmac/SHA256, Bcrypt, RSA/ECB/OAEPPadding, AES/GCM/NoPadding e AES/CBC/PKCS5Padding. A primeira linha de exemplo escreve `OEAPPadding`; os exemplos seguintes e o gerador usam `OAEPPadding`.

`encrypt(payload, params)` devolve `hash` em base64 e `params` para a descriptografia, sem chaves. `payload` plano ou base64. `encodeBase64` padrão falso. `charset` padrão `UTF-8`. `decrypt` existe para os algoritmos reversíveis; o retorno é texto plano ou base64, pelos mesmos dois parâmetros, agora aplicados à saída.

Hmac é irreversível. `secret` é obrigatório. O artigo não mostra `decrypt`.

Bcrypt é irreversível. `secret` obrigatório, `salt` opcional em base64, `cost` opcional com padrão 10. O `params` devolvido inclui `salt` e `cost`.

RSA cifra com `publicPem` e decifra com `privatePem`, ambos PEM. `oaepHash` na cifra é opcional, padrão `SHA-256`, valores `SHA-1` e `SHA-256`. Na decifra, `oaepHash` é obrigatório. A partir da 8.9, `RSA.KeyPairGenerator.generate(bitLength)` exige inteiro maior ou igual a 1024 e devolve `publicKey` e `privateKey`.

AES usa `key` em base64 de 128, 192 ou 256 bits, ou `secret` com `salt` de 128 bits. Com `secret` e sem `salt`, a plataforma gera o salt. A chave derivada usa PBKDF2-HMAC-SHA256 com 65536 iterações. `iv` omisso é gerado: 12 bytes no GCM e 16 no CBC. A decifra exige `iv` e, no modo `secret`, também `salt`. O `params` da cifra devolve `salt`, quando houve `secret`, e `iv`.

```javascript
const encrypted = _utils.security.crypto.AES.GCM.NoPadding.encrypt(texto, {
    "secret": segredo
});
const decrypted = _utils.security.crypto.RSA.ECB.OAEPPadding.decrypt(encrypted.hash, {
    "privatePem": privatePem,
    "oaepHash": "SHA-256"
});
```

Armadilha: decifrar RSA sem repetir o `oaepHash` que a cifra usou, ou decifrar AES sem o `iv` devolvido em `params`.

## Acesso a sistemas externos

Banco, LDAP, HTTP e o restante só completam se o serviço é alcançável pelos servidores do ONE na internet. Serviço restrito precisa liberar os IPs de saída: `52.201.100.126`, `3.212.155.118`, `34.231.48.236`, `35.174.120.38`, `54.232.55.210` e `54.94.17.204`. O artigo recomenda SSL/TLS (LDAPS, HTTPS e equivalentes).

## Elevação de privilégio de autenticação

A partir da 8.30, experimental, e depende de atualização do Workspaces. O artigo diz que não está em todos os ambientes. A configuração fica na Aplicação, na Configuração de acesso a métodos: método, fatores de segurança e TTL avançado. O TTL é por quantos segundos o método pode ser chamado de novo sem outro MFA. Com `Todos os métodos são acessíveis?` falso, esse campo se chama Métodos acessíveis.

A chamada protegida responde 401 com `status` `mfa_required`, `operationToken` (JWE), `operationCode` `start`, `clientForm`, `returnData` e `endpoint` `/api/1/main/sys/auth/mfa/step`. O header é `WWW-Authenticate: Bearer`, com `error` `insufficient_user_authentication`, `acr_values` `mfa` e `max_age` 30. `POST /mfa/step`, com `Authorization: Bearer`, envia `operationToken`, `operationCode` e `params`. Falta passo: 200, `mfa_next_step_required`, novo token e o `operationCode` seguinte. Conclusão: 200, `success`, `approvalToken` e `endpoint` do recurso original. O approval também volta em cookie. A chamada original se repete com o token de autenticação e o header `X-One-Approval-MFA-Token`. No front, os dois tendem a já estar no cookie.

O `approvalToken` vale para o serviço que gerou o desafio. Outro serviço protegido pede MFA de novo. `operationToken` tem TTL padrão de 5 minutos. `approvalToken` usa o TTL da aplicação, padrão 30 segundos. O MFA não executa a ação de negócio.

Armadilha: guardar o approval e reutilizá-lo noutro método, ou depois do TTL, dispara desafio novo. Chamar o método de negócio no meio do `/mfa/step` não executa a ação.

## Servidor SSO

O ONE atua como IdP SAML 2.0 e, a partir da 8.39, como Authorization Server OAuth 2.0 / OpenID Provider, no fluxo Authorization Code com PKCE. O certificado de assinatura é um Certificado Privado Padrão; o certificado padrão da plataforma fica para teste. No objeto Provedor SSO, URL de login e URL de erro valem para todos os protocolos. Placeholders de login: `{{app}}`, `{{redirect}}`, `{{orgId}}`, `{{ssoToken}}` (o cookie já leva o token no mesmo domínio). Placeholders de erro: `{{app}}`, `{{message}}`, `{{orgId}}`.

SAML: habilitar o protocolo, desmarcar a chave privada padrão do IdP e informar o certificado. Visualizar dados de conexão IdP gera XML. Cada SP confiável é um Provedor de serviço SAML, preenchido à mão ou por XML do SP. Campos manuais: Nome, Aplicações de acesso e Atributos adicionais do usuário (classe, campo e nome do atributo). O login segue sempre; atributo extra é optativo.

OAuth como IdP emite `access_token`, `id_token` e `refresh_token`. A chave de assinatura assina `id_token` e `logout_token`, e a pública sai no JWKS. Visualizar dados de conexão mostra a URL de descoberta `{issuer}/.well-known/openid-configuration`, endpoint de token, userinfo, JWKS, issuer e escopos `openid`, `email`, `profile` e `app:{aplicação}` para cada recurso protegido cuja Aplicação de login é a aplicação escolhida. Aplicação recém-marcada pode demorar a aparecer no índice.

Cliente cadastrado é um Provedor de serviço OAuth. ID do cliente até 255 caracteres. Cliente público exige PKCE e não recebe segredo. Cliente confidencial autentica com segredo, e o PKCE fica opcional. O segredo sai uma vez, pelo método Gerar Segredo do cliente, com o cadastro em rascunho, e fica armazenado de forma irreversível. A mesma chamada gera outro segredo e substitui o anterior. Até 20 URIs de redirecionamento, comparação exata, esquema `https://`, sem fragmento. Em loopback (`localhost`, `127.0.0.1`, `[::1]`) a porta pode divergir se esquema, host, caminho e query coincidem. `openid` entra sempre. Escopos de aplicação só aparecem para recurso protegido. O escopo concedido é a interseção do pedido com os Escopos permitidos; escopo fora é descartado, sem erro. `scope` omitido concede nenhum escopo de identidade: a resposta traz `access_token` e não traz `id_token`. Consentimento reaparece quando o escopo pedido cresce. Logout ativo notifica a URL por Back-Channel Logout. Allowlist de pós-logout vazia aceita só origem igual à de alguma URI de redirecionamento.

Mapeamento de claims: escopo `openid`, `email`, `profile` ou `*****`. Escopo `app:{aplicação}` não leva claim, e mapeamento ligado a ele sai na publicação. Classe Usuário de Acesso aplica a qualquer usuário. A primeira linha, escopo `*****` e classe Usuário de Acesso, define `sub` e não pode ser removida. O padrão de `sub` é o ID do usuário. Trocar para o login mantém compatibilidade e perde a estabilidade, porque o login é editável.

Cliente por metadados, a partir da 8.40, usa a URL `https` do documento como `client_id`. O Provedor de serviço OAuth por metadados vale para o domínio aceito, não para um cliente. Domínio exato ou curinga à esquerda (`*.claude.ai` cobre subdomínio e não o domínio nu; `*` sozinho aceita qualquer domínio). Domínio excluído sai deste provedor e pode continuar noutro. Excluir `*` desativa o provedor. O cliente é sempre público, com PKCE obrigatório, sem segredo, sem logout e sem allowlist. A descoberta anuncia `client_id_metadata_document_supported: true` quando há provedor publicado. A escolha entre provedores é a mais específica: domínio exato, depois curinga de sufixo mais longo. Dois provedores publicados na mesma aplicação não salvam se aceitam o mesmo domínio sem exclusão. Empate fora dessa validação atende o provedor criado por último. A busca dos metadados é HTTPS direta do servidor, sem proxy, até 5 segundos, HTTP 200, JSON de até 5 KB, sem redirecionamento. Endereço de uso especial, loopback, rede interna ou host bloqueado para saída é recusado. A tela de erro mostra código (`HOST_NOT_ACCEPTED`, `FETCH_FAILED`); o detalhe fica no log. `client_id` que não é URL válida é explicado na tela e não vai ao log. Cache de metadados válidos: entre 5 minutos e 24 horas, conforme o header. Erro não fica em cache. `refresh_token` renova sem buscar de novo enquanto o provedor continuar publicado e aceitando o domínio. `post_logout_redirect_uri` desse cliente não é aceito. SYBOX exportado para versão anterior à 8.40 não leva provedor por metadados. O artigo desaconselha aceitar hospedagem compartilhada e `*.sydle.one`.

Recurso protegido, a partir da 8.40: 401 sem credencial válida traz `resource_metadata` e `scope` `app:{aplicação}`. O documento fica em `/.well-known/oauth-protected-resource` mais o path chamado, com `resource`, `authorization_servers`, `scopes_supported`, `bearer_methods_supported` e `resource_name`. Rota da organização anuncia o endereço da rota, sem o path interno. Todo caminho da aplicação tem documento, inclusive `/webdav/...` quando a aplicação webdav é recurso. O documento não diz se o endpoint existe. O escopo `app:{aplicação}` só é concedido na Aplicação de login daquele recurso. O parâmetro `resource` (RFC 8707) restringe o access token àquele recurso; o refresh continua valendo para o que foi autorizado. Mais de um `resource` na mesma requisição é recusado: cada token serve um recurso. `invalid_target` traz o motivo em `error_description`. A renovação desse access token é só no endpoint de token, via `refresh_token`. `/api/1/{aplicação}/sys/auth/renewToken` e endpoint de plataforma sem aplicação, como `/api/sys/rest/validateToken`, recusam com `invalid_token`. O access token cai na requisição seguinte se a sessão encerra, se o autenticador que validou o usuário sai da Aplicação de login, ou se o Autenticador de recurso OAuth sai da aplicação.

Como SP, o ONE usa Autenticador SAML (importa o XML do IdP) ou Autenticador OAuth (Importar dados pela URL do issuer). O autenticador entra no campo Autenticadores da Aplicação.

Armadilha: segredo de cliente confidencial não é recuperável. Escopo desconhecido é descartado em silêncio no cliente cadastrado e, no cliente por metadados, a autorização termina na tela de erro sem redirecionar. `renewToken` da plataforma não renova token de `app:{aplicação}`.

## Usuários e grupos de usuários

Usuário e Grupo de Usuário ficam no pacote Sistema. Só Administrador e Gerenciador de usuários editam usuário. Nome, login e senha são obrigatórios; a senha é armazenada criptografada. E-mail, foto e superior são opcionais. Com Ativo desmarcado, o usuário não loga. A permissão é a união dos grupos. O identificador do grupo é o usado em script.

Grupos nativos: Administrador acessa todas as funções. Grupo Padrão está em todo usuário e vê Analytics, Processos e classes básicas. Com Explorer, além do que cada um acrescenta: Modelador de classes (classes, pacotes, sequência, extensão, mensagem da fila, mensagem, SYBOX, máscara, tag; só vê usuário, grupo e mailbox; vê `_utils.debug()`); Modelador de processos (processo, versão, grupo de processo, modelagem, mensagem da fila, mensagem, máscara, tag; só vê classe, pacote, usuário, grupo e mailbox; vê `_utils.debug()`); Gerenciador de usuários (usuário, grupo e autenticador; só vê sessão e mailbox; não adiciona o grupo Administrador); Gerenciador de workspace (workspace e view); Importador de SYBOX (SYBOX, mensagem da fila e mensagem; só vê classe e pacote); Exportador de SYBOX (SYBOX; só vê classe e pacote).

## Permissões de acesso

O nível de acesso do método define a operação. Criar, Obter, Atualizar e Remover cobrem o CRUD. Obter Histórico é método padrão. Buscar só tem a permissão alterável quando o nível de Obter é dinâmico. Método customizado também tem nível. Explícito une grupos e usuários. Público deixa qualquer usuário executar. Dinâmico aplica regra por objeto ou por dado do usuário.

Armadilha: mudar a permissão de Buscar com Obter em nível explícito ou público não está previsto no artigo.

## Autenticação por AD/LDAP

Este artigo configura Active Directory em Sistema, Configurações da Organização, Autenticação, Active Directories. É outro ponto de configuração em relação ao Autenticador LDAP. Campos: nome, host, porta (o exemplo cita 389 e 636 para SSL), domínio de usuários, endereço base de busca, autenticar somente usuários cadastrados, sincronizar grupos e sincronizar superior. Grupo e superior sincronizam no login daquele usuário. Várias conexões são tentadas até a primeira que autentica. Usuário da base local continua podendo entrar. Restrição de autenticação por grupo, na mesma configuração da organização, exige que esses usuários estejam ativos no AD. O AD precisa ser alcançável pelos IPs de saída. A customização dos atributos sincronizados fica noutro guia, que este artigo só aponta.

Armadilha: desmarcar somente usuários cadastrados cria o usuário local no primeiro login. Deixar a restrição de fora mantém a senha local válida mesmo com AD ligado.

## Importação e exportação entre ambientes

SYBOX gera e lê arquivo `.sybox`. Tipo Exportação: nome, observações, carregar alterações desde uma data, configurações de exportação e, no avançado, configuração de campos. Por classe: exportar todos ou objetos escolhidos, proteger (no destino não edita nem remove) e incluir dependências. Dependência listada pode ser ignorada por classe ou por objeto. Valor de campo criptografado não é exportado. Salvar de novo regenera o arquivo depois de alteração nos objetos.

Tipo Importação anexa o `.sybox`. Salvar o objeto não aplica. Aplicar SYBOX confirma a importação. Antes, o ONE confere dependências no ambiente ou dentro do pacote. Objeto de mesmo ID é sobrescrito; ID novo é criado. O sucesso informa criados, atualizados e reindexação. A migração termina quando a aba Dados não tem mais mensagens. Erro de dependência cita a referência ausente. Dois objetos de mesmo identificador e IDs diferentes, criados à mão em cada ambiente, geram erro na importação. O fluxo citado é criar em desenvolvimento, importar em homologação e repetir o mesmo SYBOX em produção, para o ID permanecer o mesmo.

Configuração de campos, no SYBOX ou na Configuração padrão de SYBOX, define comportamento de um campo na importação, inclusive não sobrescrever o destino ou gravar valor fixo. Há configurações de sistema nessa classe que o artigo diz não poderem ser alteradas.

Processo e versão pedem as dependências do diagrama e das configurações dos elementos. Incluir todas as dependências numa exportação seguinte pode levar classe ou configuração ainda incompleta.

Armadilha: campo criptografado viaja vazio. Token de aplicação exportada pede `refreshAllTokens` no destino, no artigo da Aplicação.

## Configuração de caixa de e-mail

Objeto Caixa de e-mail tem nome e identificador. O identificador entra no script. Envio e recebimento são independentes. Tipos prontos: Genérico (Basic, servidor, porta, SSL ou TLS no envio, SSL no recebimento, remetente padrão opcional), Google OAuth e Microsoft OAuth. Credencial diferente da principal fica no avançado de envio ou de recebimento. Remover e-mails originais após download apaga a mensagem no provedor depois do download.

Google: conta de serviço, chave `.p12` (criar ou enviar; a senha e a chave precisam ser guardadas na hora), delegação em todo o domínio com o escopo `https://mail.google.com/`. O certificado no ONE é Certificado privado padrão; na 7.6 o artigo chama Certificado digital (PKI).

Microsoft: aplicativo no diretório, permissão de aplicativo no Microsoft Graph para Mail.ReadWrite e Mail.Send, consentimento de administrador, e usuários ou grupos no aplicativo empresarial. O artigo recomenda Application Access Policy no Exchange Online para restringir as caixas: `Connect-ExchangeOnline`, grupo de segurança, `New-ApplicationAccessPolicy` com `RestrictAccess`, e `Test-ApplicationAccessPolicy`. A replicação citada é de 30 minutos a 1 hora. Segredo do cliente aparece uma vez no campo Valor. Certificado alternativo só `.p12`. Na caixa: ID do cliente, ID do locatário, certificado ou segredo, e o endereço da caixa.

Tipo de servidor customizado aponta classe de Dados para envio de e-mail (há padrão SMTP), Dados para recebimento de e-mail (há padrão IMAP) e Credencial (há Basic e OAuth 2.0 de Google e Microsoft). O contrato dos métodos está na ajuda do formulário, e o artigo não o transcreve. O método de envio também abre no rascunho da caixa, para teste.

## Envio e recebimento de e-mail

`_ecm._mailbox.send` recebe `mailbox` (identificador ou `_id`) e `email`. No formulário, De e Assunto são obrigatórios; ao menos um entre Para, Cópia e Cópia oculta; ao menos um entre corpo HTML e corpo texto. No comentário do script, `from` omisso usa o remetente padrão da caixa. `to`, `cc`, `bcc` e `replyTo` são textos com destinatários separados por vírgula. `attachments` é lista de campos arquivo. `headers` é lista de `name` e `value`. `options.contentEncoding` existe a partir da 8.13; o exemplo usa `UTF-8`. A caixa precisa ter envio habilitado. Na caixa Microsoft, o nome do header começa por `X-` ou `x-`, ou é `List-Unsubscribe`.

`_ecm._mailbox.receive` recebe `mailbox` e `newerThan`. Cada mensagem nova vira objeto E-mail no pacote ECM. Download repetido não cria duplicata. A caixa precisa ter recebimento habilitado. O exemplo do artigo faz `newerThan` com o retorno de `setDate`, que é o timestamp numérico.

```javascript
_ecm._mailbox.send({
    "mailbox": identificadorCaixa,
    "email": {
        "to": destinatarios,
        "subject": assunto,
        "htmlBody": corpoHtml,
        "attachments": [_object.anexo],
        "headers": [{
            "name": "X-Custom-Header",
            "value": "valor"
        }]
    },
    "options": {
        "contentEncoding": "UTF-8"
    }
});
```

```javascript
_ecm._mailbox.receive({
    "mailbox": identificadorCaixa,
    "newerThan": instante
});
```

Armadilha: header sem o prefixo exigido na caixa Microsoft é recusado. Apagar no provedor depende do flag de remoção, não do `receive` em si.

## Integração com banco de dados

Classe Banco de Dados (Conexão): identificador (o usado no script), nome, tipo, string de conexão, login e senha. O botão Testar tenta conectar. A URL segue o SGBD. Suportados: Oracle, SQL Server, MySQL, DB2, PostgreSQL, PrestoDB, Trino, Snowflake a partir da 8.25, Athena e Redshift a partir da 8.22, SAP Hana a partir da 8.26. O banco precisa aceitar os IPs de saída.

`executeQuery({ database, query, params })` devolve no máximo 1000 elementos; acima disso lança erro. O exemplo lê `rows`. Placeholder `?`, e `params` é a lista na ordem. `execute({ database, command, params })` roda INSERT, UPDATE e DELETE.

BLOB e CLOB, só no motor GRAAL: a consulta devolve `resultSet`, `next()` avança, `getFile(columnName, archiveName, contentType)` lê o binário, e `close()` encerra. `archiveName` omisso vira `columnName` mais um contador. Também há `getString`, `getDouble`, `getInt`, `getLong`, `getDate` e `getTimestamp`, todos com o nome da coluna. O exemplo de `getFile` no artigo deixa a string do nome do arquivo sem fechar.

```javascript
const resultado = _ecm._databaseConnection.executeQuery({
    "database": identificador,
    "query": "SELECT * FROM cliente WHERE nome = ?",
    "params": [nome]
});
const linhas = resultado.rows;
```

```javascript
const resultado = _ecm._databaseConnection.execute({
    "database": identificador,
    "command": comando,
    "params": params
});
```

Armadilha: paginar acima de 1000 no próprio retorno estoura. Deixar o `resultSet` sem `close()` segura a consulta. A string de SAP Hana no artigo inclui `encrypt=false` e `validateCertificate=false`.

## Web services

`_utils.connector.web(url, contentType, headers, options)` monta o conector. O exemplo encadeia `setBasicAuth(usuario, senha)` e `post(corpo)`. `options` no exemplo tem `logRequest`, `connectTimeout` e `readTimeout`, os dois tempos com o valor 300, sem unidade. SOAP usa o mesmo conector, `XMLHttpRequest` ou E4X. O artigo não mostra envelope nem método SOAP. O serviço precisa ser alcançável pelos IPs de saída.

```javascript
const conector = _utils.connector.web(url, "application/json", headers, {
    "logRequest": false,
    "connectTimeout": 300,
    "readTimeout": 300
});
const response = conector.setBasicAuth(usuario, senha).post(corpo);
```

## WebDAV

Sincroniza a árvore da classe Arquivo com uma unidade de rede. Windows e OS X: `https://{organizacao}.sydle.one/webdav`. Linux: `davs://{organizacao}.sydle.one/webdav`. O path depois da raiz limita o diretório. A autenticação é usuário e senha da plataforma. Leitura e escrita do objeto, e a herança da pasta, valem no protocolo.

Classe substituta da Arquivo Padrão, nas configurações da organização: campos `name`, `parent`, `isFile` e `content`. `content` e `parent` não podem ser obrigatórios na criação. Outro obrigatório ou validação fica no `_save`. `name` acompanha o nome do arquivo em `content`.

Armadilha: campo obrigatório na instanciação quebra o preenchimento gradual do WebDAV.

## Criação de instância via método/API

Processo publicado ganha classe compilada de identificador `current`. O método Iniciar (`_start`) cria instância da versão atual e só existe quando há Evento Inicial Plano. Endpoint interno: `_process.{identificador}.current._start`. Endpoint externo: `/api/1/{aplicação}/_process.{identificador}/current/_start`. A permissão é o papel da raia do evento inicial. A entrada inicializa campos. A saída traz `processInstanceId` e `processInstanceClassId`. O script do evento inicial lê `_input` e grava em `_pin`. Referência que recebe JSON com `_id` dispara `_get` da classe do campo.

```javascript
const instancia = _process.ombudsman.current._start({
    "user": {
        "_id": idUsuario
    },
    "reason": motivo
});
```

```javascript
if (_input) {
    _pin.client = _input.user;
    _pin.reason = _input.reason;
}
```

Armadilha: processo sem evento inicial plano não tem `_start`.

## Exportação e importação de modelagens de processo

Exportar a modelagem gera arquivo no formato escolhido, com o nome do processo. Importar, na aba Avançado de um processo novo, no campo Arquivo de Importação, copia o desenho. Nome, identificador, pacote e campos ficam de fora. Esses dados pedem SYBOX.

## Logs

A partir da 8.5, a classe Log do pacote Sistema registra evento interno e evento de regra de negócio. Campos: nível (`INFO`, `WARN`, `ERROR`, `DEBUG`, `TRACE`), data de geração, recurso, login, IP, path, identificador da requisição, identificador da thread, aplicação, versão da plataforma, logger, marcador, identificador, conteúdo, tipo de erro, stack trace e dados adicionais. A listagem filtra por intervalo, marcador e outros campos. Dado adicional depende de extrator ligado ao marcador.

## Métricas de uso de recursos

A partir da 8.29, o campo Métricas de sistema aparece em log com marcador `ACTION_COMPLETED`, gerado pela plataforma. Temporal soma tempo e o identificador termina em `_time`, em milissegundos. Quantitativo soma ocorrências e o identificador termina em `_count`, com as exceções abaixo.

Banco: `db_query`, `db_create`, `db_update`, `db_delete`, `db_bulk_write`, `db_create_collection`, `db_drop_collection`, `db_create_index`, cada um em `_time` e `_count`. Banco externo: `ext_db_query` e `ext_db_command`, nos dois sufixos. Cache: `cache_get`, `cache_get_batch`, `cache_computed`, `cache_is_stale_check`, `cache_mark_as_stale`. Elasticsearch: `es_search`, `es_index`, `es_delete`, `es_update`, `es_get`, `es_create_index`, `es_delete_indexes`, `es_put_mapping`, `es_delete_index`, `es_flush`, nos dois sufixos; só quantitativos, `es_bulk_add_index` e `es_bulk_add_delete`. Arquivo: `file_upload` e `file_download` nos dois sufixos, e `file_conversion` só como quantidade, sem `_count`. Caixa: `mailbox_send_msg`, `mailbox_receive_msg`, `mailbox_remove_msg`, `mailbox_search_msg`. HTTP: `connector_web_req`, `ocr_req`, `xmlhttp_req`. SFTP com par completo: `sftp_connect`, `sftp_session`, `sftp_read_file`, `sftp_write_file`. Na tabela quantitativa, remoção, diretório, path canônico, criação de diretório, remoção de diretório e stat aparecem com sufixo `_time`: `sftp_remove_file_time`, `sftp_read_dir_time`, `sftp_canonical_path_time`, `sftp_create_dir_time`, `sftp_remove_dir_time`, `sftp_stat_time`. Fila, só quantidade: `method_exec_msg_create_count`, `legacy_msg_create_count`, `simple_idx_msg_create_count`, `complex_idx_msg_create_count` e `custom_queue_msg_create`. Outros temporais: `ldap_connection_time` e `action_time`.

Armadilha: procurar `sftp_remove_file_count` ou `file_conversion_count` não acha o identificador que o artigo publicou.

## Extratores de log

A partir da 8.5. O extrator liga um marcador a uma classe de dados adicionais e preenche o campo Dados adicionais do Log. Campos: nome, marcador único, tipo `REGEX` ou `JSON`, classe, exemplo de mensagem e configuração. A classe implementa Dados adicionais de Log, do pacote Sistema (`com.sydle.one`). Não leva referência, dinâmica, arquivo nem coordenada. Não leva campo obrigatório nem calculado. Não leva script em Obter Metadata, Salvar e Remover, e esses três métodos ficam com modificador Não extensível. Permissão padrão de obter, criar, excluir, atualizar e buscar: Administrador, Modelador de classes e Modelador de processos.

REGEX usa a sintaxe de `Pattern.compile()` do Java, devolve o primeiro valor ou, havendo grupo, o primeiro grupo, e só preenche campo com expressão configurada. Data extraída em ISO 8601. JSON converte o conteúdo do log e preenche a chave igual ao identificador do campo. Data em ISO 8601, instância `Date` ou timestamp numérico. Campo ausente no JSON fica vazio.

Nativos: Tempo de execução de ações, REGEX, marcador `ACTION_COMPLETED`, campo `time` em milissegundos, classe Extrator de tempo de execução de Ações, com Analytics Performance de execução de método (quantidade, média, máximo e mínimo por recurso). Erro de concorrência em alteração parcial de objeto, REGEX, marcador `ERROR_PATCH_RETRYING`, campo `objectId`.

```javascript
const logger = _utils.logging.Logger.getLogger("com.org.apiDocument");
const marker = _utils.logging.Marker.getMarker("DOCUMENT-API-ERROR");
logger.error(marker, {
    "time": Date.now(),
    "userId": _user._id,
    "documentId": _input.documentId
});
```

Armadilha: logar o objeto inteiro estoura memória. O extrator JSON casa identificador, não rótulo. Referência dentro dos dados adicionais é tipo proibido.

## Utilitários para logging

A partir da 8.5, biblioteca `_utils.logging`. `Marker.getMarker(markerName)` cria o marcador. `getName()` devolve o nome. `Logger.getLogger()` usa o nome `onelogprefix`. `Logger.getLogger(name)` usa o nome informado. Níveis com método direto: `info`, `warn` e `error`, cada um com mensagem, com um argumento, com dois, e os mesmos três com `Marker` na frente. `atInfo()`, `atWarn()` e `atError()` devolvem `LoggingEventBuilder`, que o script não instancia. O builder tem `addMarker`, `addArgument` (troca `{}` pelo resultado de `_utils.stringifyAsJson`), `addKeyValue`, `withMessage`, `log()`, `log(message)`, `log(message, arg)` e `log(message, arg0, arg1)`. O artigo não mostra método `debug` nem `trace` no logger, embora a classe Log tenha esses níveis.

```javascript
const marker = _utils.logging.Marker.getMarker("MY_MARKER");
const logger = _utils.logging.Logger.getLogger("com.example.MyClass");
logger.info(marker, "Minha mensagem");
logger.atError().withMessage("An error occurred {}.").addKeyValue("ErrorCode", 500).addArgument("customExceptionString").log();
```

Armadilha: o marcador do extrator é o mesmo texto passado a `getMarker`. Argumento a mais, sem `{}` correspondente, fica fora da substituição que o artigo descreve.

## Logs de contexto

A partir da 8.23, o log de marcador `ACTION_COMPLETED` recebe o contexto da requisição. Escrita: `_object(id)|CREATE|_class(id)`, e o mesmo com `UPDATE` ou `DELETE`. Rascunho: `_draft(id)|CREATE|_class(id)|_published(id)`; rascunho de objeto novo omite `_published`. Retorno de API: a ação no texto é `GET`, para objeto, rascunho e histórico (`_history(id)|GET|_class(id)|_published(id)`), inclusive objeto dentro de mapa ou lista. Método de API em classe ou objeto gera `OTHER`: `_class(id)|OTHER` ou `_object(id)|OTHER|_class(id)`. Chamada por script não gera esse `OTHER`.

Arquivo, parte a partir da 8.26: `_download`, `_preview` e `extractContentAsText` geram `_file(id)|GET|_object(id)|_class(id)|_path(caminho)`. `_upload` e `_completeUpload` geram `_file(id)|CREATE|_object(id)|_class(id)`. `_util._fileHelper.toDownload` no `_output`, `getImageCard` e `getImageCardByToken` também geram log de arquivo.

Script, em `_context`: `logText(text)`; `logObject(objectId, classId, action)` com `CREATE`, `UPDATE`, `DELETE`, `RETRIEVE` ou `OTHER`; `logFile(fileId, action, objectId, classId, path)` com `CREATE`, `UPDATE`, `DELETE`, `GET` ou `OTHER`. Os três últimos argumentos de `logFile` são opcionais no texto do artigo.

Limite padrão de 50 entradas por requisição. Prioridade do que permanece: log definido pela API (retorno e operação direta, como o CREATE do `_create`), depois log de script, depois escrita que não é a operação direta da API. `logText` tem limite padrão de 200 caracteres.

```javascript
_context.logText(texto);
_context.logObject(objectId, classId, "CREATE");
_context.logFile(fileId, "GET", objectId, classId, path);
```

Armadilha: o texto automático de leitura usa `GET`, e a ação de script para objeto usa `RETRIEVE`. Objeto criado em volume por script perde o log se os 50 lugares já foram ocupados pela prioridade mais alta; `logObject` explícito sobe esses objetos na fila.
