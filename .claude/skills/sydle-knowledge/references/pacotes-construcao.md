# Construção na plataforma

Contratos de construção no SYDLE ONE cobertos por estes artigos: Sybox (filtro de objetos, exportação avançada, script pós-instalação, bloqueio de geração e objeto de Workspace), extensão de classe, workspace, portal de serviços (portal, serviço, widget, CSS global, API do portal), view de projeto externo, webservice REST e SOAP, notificação (classe Social, toast, configuração CRM e caixa de teste), callback de método e de fila, autenticadores, chatbot do portal, analytics, embedding de base de conhecimento, campo Script em Python, snippets de plataforma, componente de redirecionamento em aplicação UI, e o pacote Documento Oficial (classe, versão, embutido, assinatura, DocuSign, template Mustache, media query de página e documentos contábeis).

## Api do portal

Classe `Api do portal` do pacote Service Desk - Portal. Expõe métodos que montam o backend do portal. Os nomeados no artigo são `getTicket` (dados do ticket na página), `getAlerts` (alertas da home e da página de serviço; o texto vem da classe `Alerta` do mesmo pacote, e um alerta pode ser de um serviço), `getPortal` (logos, textos e cores do objeto `Portal`) e `getTicketComments`.

O contrato de alteração é a classe Extensão de classe: o script novo entra no método estendido. O exemplo do artigo, dentro de `getTicketComments`, troca o nome exibido quando `user.name` é `"Sistema"`.

Armadilha: editar a classe da API direto conflita com outras classes. A extensão existe para não alterar a classe original.

## apiTramitador

Biblioteca JavaScript dos scripts locais do Tramitador e dos processos definidos. Entra por `require`. O artigo não mostra assinatura dos métodos; a lista muda, e método padrão novo entra no arquivo da API.

```javascript
const ApiTramitador = require("government/dispatcher/apiTramitador.js")(this);
```

Nomes citados: `POST_TYPE`, `addPost`, `addticketInternalComment`, `addPaymentPost`, `addPendency`, `searchOpenPendency`, `cancelPendency`, `diligenciar`, `diligenciarEsalvar`, `responderDiligenciamento`, `setInternalStatus`, `setInternalStatusAndSave`, `setToUnitsAndSave`, `setCurrentUnitsAndSave`, `setsendingUnitsAndSave`, `setHistoricToUnitsAndSave`, `createSubTicket`, `desmembrarSemPatch`, `desmembrar`, `sendSignal`, `sendSignalResolve`, `revogarSubTicket`, `referenciarTickets`, `referenciarSubTickets`, `addPostComDocumento`, `setExecutorGroup`, `getExecutionAuditorGroups`, `getPostUnit`, `calculeBeginDate`, `calculateDiffTime`, `isNotBusinessDay`, `fitDate`, `bussinessDay`, `getInteresteds`.

## Assinatura de documento via DocuSign

Subprocesso referenciado, genérico, com dois elementos: um script envia o envelope e um evento de mensagem devolve os documentos assinados.

Campos: `date` (data de execução), `requester` (solicitante), `conector` (conector; define o ambiente de envio), `documents` (array do envelope), `signers` (array de Formulário de assinantes), `emailSubject`, `signedDocuments` (saída: zip dos assinados e do resumo), `envelopeIDDocuSign` (id do envelope, usado no pooling até o fim das assinaturas). Não há assinatura de método.

## Assinatura de documentos

Atesta o documento pelo responsável. Ocorre pelo Formulário de Assinatura, pelos métodos Assinar e Autenticar de Documento Oficial ou de Versão de Documento, ou pelo Documento Embutido. Assinar e Autenticar se comportam do mesmo modo: Assinar é origem interna; Autenticar é origem externa. Só executa se Pode ser assinado, na classe Documento Oficial, permitir.

O formulário começa com Usuário (quem executa), Tipo de assinatura (só os permitidos no documento) e Documento (cópia do arquivo). Tipos: Login e Senha, e Certificado Digital.

Login e senha usa a senha de acesso. Com autenticador de sessão (Single Sign On), o campo de senha não aparece. Vale para qualquer arquivo e não altera o hash, salvo origem interna: o documento é renderizado de novo para inserir os nomes dos signatários pelo template, sem carimbo.

Certificado digital (remoto no Sydle, ou local na máquina) carimba o arquivo do mesmo jeito. O local exige configuração do ambiente e plugin externo (o artigo cita Lacuna); a senha fica no software, e o formulário não mostra senha. O remoto exige certificado válido vinculado ao usuário e pede a senha do certificado. O carimbo segue o Template do carimbo de assinatura digital das Configurações do Documento Oficial, ou o template do Tipo de Documento quando ele define um. Só PDF recebe certificado digital.

A assinatura preenche a tabela da versão. Versão publicada, ou versão inicial em rascunho (documento também em rascunho), replica a tabela no documento. Versão em rascunho de documento publicado replica a tabela no documento só na publicação. O mesmo usuário não assina a mesma versão duas vezes, e duas assinaturas não usam o mesmo certificado.

## Autenticadores

Autentica usuário no sistema ou no portal. Se o autenticador usa integração, o Sybox de Web Services entra antes.

LDAP: objeto em `LDAP (Conexão)` do pacote ECM; em seguida, objeto de Autenticador do pacote Sistema. Host e porta dependem de firewall. Campos extras do AD, ausentes da classe padrão de usuário, ficam numa classe própria (o exemplo é "Informações de Usuário") com referência ao usuário sincronizado. No método de autenticação, os campos do AD chegam em `_input.adData` (um título do artigo escreve `_input.aData`). O artigo não lista os campos além desse caminho.

SSO nativo: Autenticador SAML e Autenticador SSO customizado (outros protocolos, como OAuth). A configuração é URL de login e redirecionamento, URL de logout e redirecionamento, e obtenção de usuário. O IdP precisa aceitar o SYDLE ONE como provedor de serviço.

Obter usuário de forma padrão, verdadeiro: o ONE recupera ou cria o usuário pelo login, nas classes de autenticação que seguem a interface Usuário de acesso. Falso: um script faz o pareamento. Não se adapta a classe de usuário para esse pareamento. O autenticador entra no campo Autenticadores da Aplicação (Sistema > Aplicação). Na aplicação `main`, o botão aparece na tela de login.

Autenticador Google: credencial OAuth do tipo Aplicativo da Web, depois de a tela de consentimento ter o nome do aplicativo. Campos: Nome (texto do botão em `main`), Identificador (entra na URI), ID do cliente, Chave secreta do cliente, URI de redirecionamento autorizado, Autenticar somente usuários cadastrados?, URI de redirecionamento de logout. Com o autenticador criado, Origens JavaScript autorizadas e URIs de redirecionamento autorizados são preenchidos na credencial Google, e o autenticador entra na Aplicação.

```text
https://{id_organizacao}.sydle.one/api/1/{app}/sys/auth/sso/authenticate/{id_organizacao}/{id_autenticador}
```

`app` é o identificador da aplicação. Erro de autenticação sem causa visível: log no graylog ou no SYS Admin, e firewall.

## Biblioteca de snippets

Atalhos da IDE, com placeholders `$1` e `${2:id}`. O uso da IDE está no artigo "Snippets na nova IDE", não aqui. O contrato que os corpos mostram:

```javascript
const lib = require("caminho.js");
const mustache = require("/mustache.js");
const moment = require("/_internal/moment");
const template = _utils.getMethod("_classId", CLASS_ID_TEMPLATE_DOC, "_get")({ "_id": ID_TEMPLATE });
const result = mustache.render(template.template, view);
const numero = _system._sequence.nextVal({ "_id": SEQUENCIA_ID }).nextVal;
const history = _utils.getMethod("_classId", classId, "_getHistory")({ "_id": objectId });
```

`moment.locale("pt-br")` e `format("LL")` montam data por extenso em `_object`. `_getHistory` percorre com `hasNext` e `next`; cada item traz `_lastUpdateDate`, `_revision` e `_id`. Logger: `_utils.logging.Logger.getLogger` e `_utils.logging.Marker.getMarker`, depois `logger.info`. Mensagens: `_utils.addErrorMessage`, `addInfoMessage`, `addWarningMessage`, com `_utils.stringifyAsJson`. CRUD de uma linha: `_get`, `_search` (o corpo devolve `hits.hits` mapeado em `_source`), `_patch` com `_operationsList`, `_delete` com `_id`. `throw` do snippet `useThrow` é `_utils.stringifyAsJson`.

Prefixos: `pagedSeach` (grafia do artigo), `batchDelete`, `renderHTML`, `historyObject`, `sydleGet`, `sydleSearch`, `sydlePatch`, `sydleDelete`, `useLogger`, `method`, `importarLib`, `importarHelper`, `dataPorExtenso`, `nextvalSequence`, `addError`, `addInfo`, `addWarning`, `useThrow`.

Armadilhas no próprio corpo: `pagedSeach` usa `search_after` com `lastHit.sort` e `hit._source._concreteObject || hit._source`, e compara com `PAGE_SIZE`, sem definir `PAGE_SIZE` nem `parametroBusca` no trecho. `batchDelete` pede `"_source": false` e em seguida lê `item._source` e `item._id`.

## Callbacks

Função passada para outra função e chamada por ela. No método, o artigo guarda cada validação num objeto com campo texto de conteúdo Script. O método recebe `_input.funcao` e `_input.objeto`.

```javascript
if (!_input.funcao || !_input.objeto) {
    return;
}

const callback = eval(_input.funcao);
_output = callback(_input.objeto);
```

Na fila, `onSuccess` é o método chamado depois do processamento. O callback só executa se a mensagem terminar sem nenhum erro. O artigo usa isso para sinal de processo (método custoso ou fila em sequência) e para pós-processamento, como atualizar objeto de controle.

```javascript
_queues.methodExecutionQueue._create({
    "sender": { "_id": _object._id, "_classId": _object._class._id },
    "schedulingDate": new Date(),
    "body": {
        "targetClass": { "_classId": "000000000000000000000000", "_id": CLASS_ID },
        "targetMethod": "methodIdentifier",
        "parameter": _utils.stringifyAsJson(payload),
        "invokerUser": _user
    },
    "onSuccess": {
        "targetClass": { "_classId": "000000000000000000000000", "_id": CLASS_ID },
        "targetMethod": "methodIdentifier",
        "parameter": _utils.stringifyAsJson(payload),
        "invokerUser": _user
    }
});
```

## Changelogs do Documento Oficial

Registro de versão do pacote. Contratos que passam a valer, sem o histórico de autor:

- Exportar o objeto de Workspace mantém o valor habilitado no ambiente.
- `render` de Template de documento usa motor JavaScript ES2024.
- Cópia de visualização altera publicar da versão, renderizar do template e Obter documento público. O serviço Validação de documentos do Service Desk - Portal não está nesse Sybox; um Sybox à parte leva o serviço.
- Template de documento ganha campo de templates para reutilizar template dentro de template.
- Obter metadata de Assinaturas verifica se `_object` existe.
- Extração de texto na criação fica desligada. O booleano "Extrair conteúdo do documento", em Avançado do tipo, nasce falso. Para extrair: o booleano verdadeiro no tipo e o método `extractContent` de Documento oficial, pela fila, na extensão de classe, ao criar.
- `createNewDocument` e `renderFile` incluem `sequentialId` no título e no nome do arquivo, quando aplicável.
- Classificação do documento ganha `additionalDataClass`. Tipo de documento oficial ganha `classificationAdditionalData`.
- Template de documento ganha `useScriptEditor`. Exige Workspaces acima de v2.42.
- Tipo de documento ganha Classificação. O gerador de sequência deixa o `Eval` e passa a `new Function`. O erro antigo é `ReferenceError: keyGeneratorFunction is not defined`.
- Assinatura destacada: "Arquivo original" guarda o arquivo sem alteração, "Arquivo p7s" guarda a assinatura destacada, "Arquivo" guarda o arquivo com carimbo. Os dois primeiros existem no documento e na classe de assinaturas. Assinar externo, na versão, grava original e p7s na classe de assinaturas e remove esses arquivos do documento.
- O tipo escolhe a versão do conversor HTML para PDF. `render file` lê essa versão em `_util._fileHelper.create`.
- O template chama `formatDateLong` para data longa.
- Atualizar documento e nova versão renderizam os anexos.
- `officialDocumentClassHelper.js` não pode usar palavra reservada do JavaScript no motor Graal.
- Configurações do documento oficial ganha "Templates de exibição customizada" no serviço Validação de documentos: download, tabela de assinaturas e template Mustache com campos do documento. Obter documento público ganha parâmetros de retorno para essa autenticação.
- Reindexar Documentos, no tipo, acima de mil objetos, agenda na fila de execução de métodos.
- No formulário de assinatura, Assinar e `signatureTypeSigningForm` ficam na raiz.
- Status "Aguardando Integração" se comporta como rascunho, com limite: Publicar e Criar Nova Versão só por script. "Status Inicial Permitido" no tipo lista só "Aguardando Integração" e "Rascunho". O padrão de documento novo é Rascunho. Com os dois status permitidos, o script informa o status na criação.
- Dados adicionais do documento seguem a interface Dados Adicionais do Documento Oficial; os do tipo seguem Dados Adicionais do Tipo de Documento. A classe concreta é referência em Configurações do Documento Oficial.
- Tipo: "Permitir Anexos" e "Anexos Antes ou Depois". Com isso, o documento oferece "Anexar esses arquivos ao documento oficial", e renderizar arquivo concatena os anexos ao PDF.
- Configurações ganha "Assinadores de Documento". O tipo ganha "Usar Assinadores de Documento Customizados" e "Assinadores de Documento Customizados". O tipo, por padrão, usa os assinadores das configurações. O nome "Certificado Digital" passa a "Certificados e Autenticações Externas". Sem ao menos um assinador nas configurações, essa opção não aparece na assinatura, ainda que o tipo a habilite. O status do documento também precisa permitir o tipo. A assinatura por certificado das preferências do usuário usa o próprio arquivo e não pede senha. No documento embutido, "Prosseguir para Assinatura" é marcado de novo a cada troca de tipo de assinatura, para o ícone de carimbo não aparecer em Login e Senha.
- Identificador sequencial configurável por tipo.
- `renderFile` recebe `absoluteFileName` depois da assinatura interna por login e senha, para manter o nome. Também recebe `fileName`. `updateDocument` recebe `fileName`. `createVersion` da versão muda junto. Criar novo documento aceita nome de arquivo específico.
- Validação de assinatura no salvar do formulário quando o embutido tem id de versão.
- Criar rascunho de `officialDocumentSigningForm` cobre usuário delegado. Assinador Interno preenche o campo Documento desse formulário.
- Configuração de documento oficial: texto "Aplicação forçada" para autenticação de login e senha, e função que devolve o identificador da aplicação do usuário no momento dessa assinatura.
- Nível de acesso Público é proibido em documento criptografado.
- Prazo de mudança de fase do documento e do repositório digital usa a data de publicação da versão.
- Há trava de publicação sem assinatura.
- `createNewDocument` preenche a configuração de acesso padrão do tipo quando o input não a traz.
- Pendência com grupo vazio gera erro de grupo vazio.

## Chatbot e login no portal

Com o login do chatbot desligado, portal e chatbot não compartilham o usuário. O fluxo alternativo cria o objeto pessoa para o anônimo entrar no portal; a checagem ocorre quando o fluxo volta à árvore. `_chat.object` é o usuário do chat, no papel de `_user` do portal. Id de usuário anônimo mantém o chat anônimo.

```javascript
return _chat.object._id !== "609e68846d5c2e645c104c12" && _chat.object._id !== "5cbdb800dbab3e44afeae867";
```

A checagem vale depois do login no portal e de recarregar a página. Não há recurso que atualize o usuário do chatbot quando o usuário do portal muda. O artigo contorna com uma mensagem cujo link abre a página inicial do portal.

## Classificação do ticket

Não há contrato. O artigo remete a outro documento para os campos e para o processo definido. Diz apenas que a classificação define a natureza do atendimento e pode ter processo definido ou configuração de atendimento; esta tem uma configuração fixa para um serviço do Tramitador.

## CSS global do portal

Pacote Service Desk - Portal, classe Portal, campos avançados, campo "Adicionar CSS ao portal". O campo nasce vazio: o CSS é um arquivo aplicado ali, por cima da página. Seletores em tag (`h1`) atingem toda a página; o artigo aplica na classe do trecho. Tema de auto-contraste usa a classe `sd-dark-theme`. `display: none` oculta o componente. O rodapé também leva CSS, e esse CSS vale em todas as páginas (ver portal).

Armadilha: regra que não vence o CSS já aplicado usa `!important`.

## Notificador que cria objeto de e-mail no Sydle

Caixa de e-mail de teste, tipo Genérico, com login e senha quaisquer, sem servidor real. Notificador customizado, se precisar, parte da classe notificador mailbox do pacote CRM. A configuração é objeto de Configuração de notificação do CRM (há duas classes com esse nome; o pacote decide).

O identificador desse objeto é o que o script usa. Ativo liga ou desliga. Entidade é a classe do e-mail de teste, ou outra classe de negócio. Gatilhos: evento (método da entidade), manual (disparo em massa) e recorrente (rotina). Montador Mustache recebe os campos do script: destinatário `{{{to}}}`, título `{{{subject}}}`, corpo no próprio objeto ou por parâmetro, e anexos por parâmetro. O notificador aponta o SMTP para essa caixa.

Armadilha: ao promover Sybox de teste para produção, o objeto de Caixa de E-mail de produção não pode ser sobrescrito. O artigo não mostra o script da chamada.

## Notificador por gatilho

Depende do Sybox CRM. Objeto de Configuração de notificação. Entidade é a classe do fato (ticket, cliente, contrato, boleto). Gatilhos do Sybox: Evento, Recorrente e Manual (script).

Evento dispara depois do método escolhido da entidade. O script Checar envio devolve booleano. No contexto, `params._object` é o objeto, `params._oldObject` é a versão anterior e só tem valor nos métodos Salvar e Atualizar Rascunho, e `params._input` é o mapa de parâmetros do método interceptado. Ticket novo: `_oldObject` sem `_id`.

## Portal de serviços

Pacote Service Desk - Portal, classe Portal. Campos: nome e identificador; título, descrição, cor padrão, cor de fundo e logos; catálogos; menu (nome, possuir subitens, itens, url, ícone); menu do usuário (nome, url); página inicial (header e seções); página de exibição (cards e configuração de pesquisa); avançado (CSS, abas, idioma, id do Google Tag Manager); rodapé em HTML e CSS, aplicado em todas as páginas.

Serviço cujo catálogo não está na lista de catálogos do portal não abre pelo portal. No painel padrão, cada item tem tipo (ticket, objeto do portal, objetos, tarefas de usuário), filtros, ordem e campos. Filtro de situação de atendimento usa nome e id dos objetos da classe Situação de atendimento do Tramitador. Campo do painel tem label e tipo texto ou data.

Publicar o portal exige o token da aplicação, gerado em Sistema > Aplicação. Também é necessário token do usuário anônimo `5cbdb800dbab3e44afeae867` na aplicação `servicedesk-embedded-guest`, sem autenticadores.

## Web service REST

Classe Web Service, pacote Utilitários (`com.sydle.util`), junto com Tipo de Autenticação. Sem dependência de outro Sybox. Campos: nome, identificador, tipo `REST` ou `SOAP`, método `GET`, `POST`, `PUT`, `PATCH` ou `DELETE`, endereço, tipo de autenticação, headers, template da requisição. Template preenchido entra no objeto da requisição: XML para SOAP, JSON para REST.

O método Chamar serviço faz a requisição, pela API e pela tela. A resposta traz conteúdo, código HTTP e headers. O campo `request` aceita query parameters; o exemplo do artigo ordena por `orderBy`. Não há corpo da chamada de API no texto.

## Serviço do portal

Pacote Service Desk - Portal, classe Serviço. Classificações padrão: Conteúdo padrão (estático: imagem, texto, vídeo, link), Formulário padrão (pode iniciar processo), Conteúdo dinâmico (muda por usuário) e Solicitação externa (outra URL, outra aba). Classificação personalizada pede nome, classe de dados adicionais, modelo, possui formulário, solicitação externa, possui conteúdo dinâmico, configuração de avaliação, controle de versão e permite listagem pública de conteúdo. A classificação escolhida muda os campos seguintes.

Campos: nome; identificador (também na URL direta); ativo; ícone; descrição; formato de conteúdo Markdown ou HTML; anexos (download no fim); imagens; palavras-chave e tags (pesquisa); itens relacionados; categoria ou catálogo (onde aparece); exibir também em (outros catálogos); ordem (sem valor, a filtragem é crescente); autor; data da última atualização (recebe a data atual). Avançado: herdar controle de acesso de leitura e o de escrita. Verdadeiro usa a ACL dos catálogos e categorias do serviço.

## Toast com progresso

Namespace `_social._notification`. Métodos utilitários, não a montagem manual.

`showToast` ausente ou falso cria a notificação e não a exibe em tempo real, nem como toast nem no menu. `redirectObject` e `redirectUrl` juntos: `redirectObject` prevalece. Imagem no tamanho de foto de perfil, quadrada, entre 32×32 e 64×64. Guardar o retorno: `updateProgress` e `endProgress` usam o `_id`. `showToast: true` entra de novo na atualização e no fim. `endProgress` também no erro, para a barra não ficar presa. `redirectUrl` fica para link externo ao backoffice.

`createToastNotification()` exige `recipient`. Opcionais: `subject`, `contentText`, `image`, `redirectObject`, `redirectUrl`, `showProgress`, `indeterminate`, `progressValue` (0 a 100).

`createDeterminateProgress()` exige `recipient`. Opcionais: `subject`, `contentText`, `image`, `redirectObject`, `redirectUrl`, `showToast`, `progressValue`.

`createIndeterminateProgress()` exige `recipient`. Opcionais: `subject`, `contentText`, `image`, `redirectObject`, `redirectUrl`, `showToast`.

`updateProgress()` exige `_id`. Opcionais: `subject`, `contentText`, `image`, `redirectObject`, `redirectUrl`, `indeterminate`, `showToast`, `progressValue`.

`endProgress()` exige `_id`. Opcionais: `subject`, `contentText`, `image`, `redirectObject`, `redirectUrl`, `showToast`.

```javascript
const notificacao = _social._notification.createDeterminateProgress({
    "recipient": _user,
    "subject": "Importando registros",
    "contentText": "Aguarde enquanto os dados são importados.",
    "showToast": true,
    "progressValue": 0
});

_social._notification.updateProgress({
    "_id": notificacao._id,
    "showToast": true,
    "progressValue": 50
});

_social._notification.endProgress({
    "_id": notificacao._id,
    "showToast": true
});
```

## View de projeto externo

A view embute um frontend hospedado como arquivo. O artigo exige um `index.hml` (grafia do texto) como entrada. Na build, os caminhos do `index.html` passam de `"/"` para `"./"`, senão js e css não resolvem dentro do Sydle. A build sobe compactada (`.rar`) num objeto da classe arquivo, com "Conteúdo disponível através do método www?" e "Habilitar redirecionamento de rotas para index.html?" verdadeiros. O ícone de olho abre a URL. Essa URL vai no campo URL do objeto da classe View, pacote Sistema.

Na classe de negócio, avançado: "view de exibição" é a tela de detalhe do objeto; "view de edição" é a tela de criar e editar. O artigo seguinte, no fechamento, diz ter ligado a tela de criar em "View de Exibição"; o glossário dos dois artigos atribui criar/editar à view de edição.

Rotas de React não cabem na view. Navegação sem rotas. HashRouter está citado como não verificado.

## Webservice SOAP

Integração HTTP nativa. SOAP pelo `_utils.connector.web`, por XMLHttpRequest e, para o XML, pela biblioteca E4X. O artigo não mostra a chamada.

Objeto da classe Web Service: nome, identificador, tipo SOAP, endereço, template XML, SOAP Action opcional, tipo de autenticação, headers e, em Avançado, classe de métodos do serviço. SOAP Action é cabeçalho HTTP com a operação, para o servidor não ler o XML inteiro; servidores antigos dependem dele. Autenticação e headers seguem o serviço (sem autenticação, usuário e senha, ou token). O teste é o método Chamar serviço: método, sufixo da URL, extra headers, Publicar. A resposta é XML.

## View customizada e a API

Continua a view externa. Cliente HTTP no frontend; o exemplo é Axios com `baseURL` no padrão `https://SEUPORTAL.sydle.one/api/1/main/`. Criar objeto: `POST` em `/pacote/classe/_create`, com os identificadores de pacote, classe, método e campos iguais aos do Sydle. O artigo abre o acesso de `_create` para público na classe de demonstração e diz que projeto real usa token. O retorno traz o objeto criado, inclusive o id.

O mesmo par de flags do arquivo e a mesma classe View. Glossário repetido: view de exibição é detalhe; view de edição é cadastro. A mesma ressalva de rotas React.

## Notificação (alerta) ao usuário

Objeto da classe Notificação, pacote Social, para um usuário. Aparece no sino do Sydle e do portal. O artigo recomenda `_utils.getMethod`.

Campos: `recipient` (referência a Usuário de Acesso; único obrigatório; não aceita grupo; grupo é um create por usuário), `subject`, `image`, `redirectObject` (referência a Objeto), `redirectUrl`. `previewDate` é o clique no sino. `readingDate` é o clique que redireciona.

Com `redirectObject` e `redirectUrl` juntos, esta classe redireciona para a URL. Isso é o inverso do toast, em que `redirectObject` prevalece.

```javascript
const ID_CLASSE_NOTIFICACAO = "5f89d6ac9795af276dc0b18b";

_utils.getMethod("_classId", ID_CLASSE_NOTIFICACAO, "_create")({
    "recipient": _user,
    "subject": "Essa é uma notificação de teste disparada durante uma demonstração",
    "redirectObject": _user._class
});
```

## Mustache e PDF

Versão de produto citada: 7.6. Tag `{{variavel}}`. Bloco `{{#lista}}` … `{{/lista}}`. Lista simples usa `{{.}}`. Lista de objetos usa a chave. Tag ausente no view, ou tag vazia, é apagada do resultado.

```javascript
const mustache = require("/mustache.js");
const result = mustache.render(template, view);
```

O script completo cria HTML e converte passando o arquivo. Um trecho anterior de `convert` usa `content` em vez de `file`. Imagem do documento: campo arquivo `getContentAsBase64()`. No exemplo prático, um trecho lê `_object._parent._pin.titulo` e o script completo lê `_object._parent.titulo`. A geração do exemplo está dentro de `botaoMudou`; o artigo não define essa função. O código roda no Atualizar Rascunho. O PDF vai para o campo arquivo (`arquivoRenderizado` ou `documento`).

```javascript
const htmlFile = _util._fileHelper.create({
    "content": result,
    "targetFileName": "Nome do arquivo.html",
    "targetContentType": "text/html",
    "targetCharset": "UTF-8"
});

const pdfFile = _util._fileHelper.convert({
    "file": htmlFile,
    "targetFileName": "Nome do arquivo.pdf",
    "targetContentType": "application/pdf",
    "targetCharset": "UTF-8"
});
```

Armadilhas: imagem maior que 700px é cortada no PDF, sem redimensionar. O conversor HTML/PDF segue CSS antigo e não suporta `display: flex`; o artigo indica tabela, ou conversor externo por API.

## Filtro de objetos no Sybox

Método Filtro de Objetos, no Sybox em rascunho, a partir do Sybox Métodos Utilitários 1.3.7. Operação do tipo Objeto, classe escolhida, query Elastic, Visualizar, então incluir os objetos. O artigo descreve o exemplo "idade maior que 18" e não mostra a query. Não há assinatura.

## Componente de redirecionamento

Redireciona dentro de uma aplicação UI quando a condição é verdadeira. A verificação ocorre ao carregar a página de origem.

Sybox citado: `[Elo DEV] SYBOX - Componente de redirecionamento`. Repositório: Path Redirect. O método da classe de configuração é "Configurações para redirecionamento". Campos: `originRoute` (a rota chega como input do componente), `condition`, `destinationRoute`. O artigo diz que a rota atual é comparada à rota desejada porque pode haver mais de um componente. O componente entra na rota de origem da aplicação UI. Não há script no texto.

## Componentes dinâmicos

Pacote Service Desk - Portal, classe Widgets. Entram num serviço de conteúdo dinâmico ou no portal. No serviço: formato Markdown ou HTML; no conteúdo, Mustache `{{identificador}}`, e o mesmo identificador no item de Componentes, em Configuração de conteúdo dinâmico. Cada widget abre os próprios campos (o calendário do exemplo tem Ano) e um campo de script do componente.

## Configuração de notificação

Classe Configuração de Notificação: template, caixa de e-mail e o envio. O identificador localiza o objeto no método `send`. Entidade padrão citada: E-mail / ECM; outra classe é possível.

Montador de conteúdo. Destinatário, no exemplo, `{{to}}`. Título recebe o assunto passado ao `send`. Corpo em Mustache: `{{#periodos}}` … `{{/periodos}}` itera o array; dentro do bloco o campo é `{{dataDeInicio}}`, sem prefixo `periodos.`. Esses campos vão no parâmetro `object` do `send`. Link que está só no HTML-fonte do corpo também é chave de `object`.

```javascript
_utils.getMethod("_classId", CLASSE_CONFIGURACAO_NOTIFICACAO_CRM, "send")({
    "identifier": "NotificarColaboradorDoAgendamento",
    "object": {
        "to": colaborador.person.email,
        "subject": assunto,
        "periodos": periodos,
        "link": urlServico
    }
});
```

`CLASSE_CONFIGURACAO_NOTIFICACAO_CRM` é o id da classe, no comentário do artigo; o valor não está no texto.

## Bloqueio de geração de Sybox

Parâmetros para geração de Sybox. Abas:

- Classes: campo Classes e Ação Bloquear. Sybox que carregue elemento dessas classes tem a geração interrompida.
- Objetos: campo Objetos (nome ou identificador) e Ação Bloquear. Exemplos do artigo: `main`, `servicedesk-aquisicoes`.
- Pacotes: qualquer classe desses pacotes. Exemplos do artigo: Service Desk - Atendimento, ECM, Documento oficial, Tramitador.
- Exceção: identificador do Sybox na lista Sybox's Liberados, que ignora as regras. Lista vazia: nenhum Sybox isento.
- Notificação: usuários que recebem alerta quando a geração contém classe, objeto ou pacote bloqueado.

O artigo trata a exceção como liberação temporária. Não há assinatura.

## Documento contábil: balanço patrimonial

Configuração de emissão. Campos gerais: Nome, Planos de Contas, Templates, Unidade Monetária do Arquivo, Notas Explicativas. Os exemplos de nome e plano no artigo são ilustração.

Estrutura: tópicos Ativo (Circulante e Não Circulante) e Passivo (Circulante, Não Circulante e Patrimônio Líquido). Por item: Código de Aglutinação, Possui Valores?, É Somatório de Tópicos Anteriores?, Subtrair? (sim subtrai; não soma), Subtópicos. Não há método.

## Documento contábil: DRE

Mesmos campos gerais do balanço, mais Conta de Apuração do Resultado do Exercício, Conta de Destino do Lucro Acumulado e Conta de Destino do Prejuízo Acumulado.

Tópicos do artigo: Receitas Financeiras, Despesas Financeiras, e três obrigatórios que não podem ser removidos porque alimentam o LALUR e o SPED: Resultado Antes do IRPJ e CSLL, Imposto de Renda e Contribuição Social, Lucro Líquido do Exercício. Não há método.

## Configurações do Documento Oficial

Classe que segue a interface Configuração / Sistema. Um objeto concentra o padrão do ambiente.

Campos do artigo: template e dimensões do carimbo de certificado digital, usados quando o tipo não tem template próprio; aplicação e autenticador da assinatura por login e senha; mensagem de aviso quando o autenticador de sessão dispensa a senha; permitir login e senha depois de certificado digital (origem interna é renderizada de novo e perde os carimbos de certificado); bloquear certificado fora do ICP-Brasil, validado na assinatura; URL base dos QRCodes dos documentos internos; template da tabela de assinaturas no validador; mensagem de usuário não autorizado no validador; instruções exibidas ao preencher Configuração de Acesso; unidade organizacional padrão do repositório digital quando a unidade não é calculada e o tipo não limita as unidades de criação.

Dados adicionais do tipo de documento: referência a classe da interface `6707f4b43211365e2e09f58e`. Dados adicionais do documento oficial: interface `6717ac06ad7f383e25114c4f`. O artigo aponta essas interfaces para integração e para o status Aguardando Integração.

## Criando um componente dinâmico

Duas classes. A de configuração segue a interface Configuração de Widget / Service Desk - Portal. A do widget segue Widget / Service Desk - Portal. O objeto do widget fica em Service Desk - Portal > Widgets.

No exemplo, a configuração tem o campo `analytics`, referência a Analytics/Sistema, obrigatório. O widget tem `name` (texto, obrigatório), `template` (texto, conteúdo script, obrigatório) e `config` (referência a Classe/Sistema, valor padrão a classe de configuração, somente leitura, oculto, obrigatório).

Método `draw` (nome Desenha): nível Explícito, grupo Administrador, exibição Menu. Entrada `config`, referência embutida à classe de configuração, obrigatória. Saída `html`, texto com conteúdo script. O script grava `_output.html` substituindo no template os tokens `identifier`, `configJSONPie` e `configJSONBar`. Lê gráfico por `_system._analytics.getPieChartData(param).pieData` e `getBarChartData(param).bars`. O `param` do artigo é `_id` e `maxNumberOfGroups` 30; a origem da variável `analytics` não aparece no trecho. Cada item traz `count` e `headerText`. O template de exemplo monta dois `canvas` e instancia `Chart` dentro de `setTimeout` de 1500 ms.

Armadilha: Cloudflare pode impedir digitar `<script>` em campo textual. O artigo diz que a configuração da Sydle retira esse bloqueio.

O encaixe no serviço está na seção Componentes dinâmicos.

## Analytics

Classe Analytics, sobre uma classe com objetos buscáveis. Nome identifica na busca, junto com o id.

Extração analítica: colunas, sem agrupamento, uma linha por objeto. Exibição padrão: Tabela; Pipeline (agrupador vira coluna de cards); Gráfico de pizza (agrupador vira secção); Gráfico de barras (agrupador no eixo x); Listagem (pelo campo escolhido).

Busca segmentada: filtro permanente (campo e valor; mais condições pelo ícone). Template de busca: filtro opcional visível na visualização. As duas existem também na extração analítica. Colunas ordenam os objetos. Agrupadores são os campos escolhidos, todos de uma vez se quiser. Agregador conta objetos e tem Função sobre o campo.

Campo dinâmico: script Elastic Painless, só no ElasticSearch. Não chama método da plataforma e não lê outro objeto; só atributos do objeto no Elastic. Tipos: Número, Texto, Booleano, Decimal, Data. A expressão devolve valor do tipo escolhido.

Permissões, separadas: usuários de leitura, usuários de escrita, grupos de leitura, grupos de escrita.

## Documento embutido

Campo referência embutida para Documento oficial embutido / Documento Oficial. Instancia com id de documento ou id de versão, porque a assinatura pode ser na versão atual ou numa versão (rascunho). `signingAllowed` true mostra o formulário de assinatura; false ou ausente só exibe. `signingRequired` true impede salvar o formulário sem assinatura daquele usuário. Assinar ainda depende de Pode ser assinado; se não puder, o componente mostra a mensagem.

```javascript
_object.campoDocumentoEmbutido = {
    "documentId": ID_DOCUMENTO,
    "signingAllowed": true,
    "signingRequired": true
};
```

`versionId` substitui `documentId`. Os dois preenchidos, ou nenhum, disparam o erro de instanciação.

Armadilha: sobrescrever um embutido já instanciado com `signingAllowed` true produz esse mesmo erro, mesmo com os mesmos dados. Entre as duas escritas, o campo vai a `null`.

## Documento Oficial, classe

Classe principal do pacote. Campos: Título (obrigatório); Versão (número, não editável); Versão Corrente (referência oculta e não editável à versão corrente); Status (não editável; o status diz se assina e quais tipos); Informações complementares do status (embutido; motivo de exclusão, por exemplo); Ticket (opcional, não editável, preenchido na criação; sem ticket o documento é avulso); Código de acesso (único, na criação); Tipo de Documento (obrigatório); Origem (obrigatório); Arquivo (o arquivo, ou o aviso de encriptado; encriptado só abre por Descriptografar Arquivo); Dados do documento (embutido da interface Classe de dados; obrigatório na origem interna, opcional nas demais); Assinaturas (tabela); Código externo; Configuração de acesso (embutido; se o tipo tem padrão, o campo só avisa que o tipo define).

Métodos e limites que o artigo fixa:

- Adicionar pendência: tipo Assinatura ou Ciência, mais grupos e/ou usuários. Gera Pendência de Ação e tag.
- Alterar configuração de acesso: documento publicado cujo tipo não tem configuração padrão.
- Assinar e Autenticar: delegam à Versão de Documento.
- Atualizar documento: publica nova versão.
- Cancelar: só de PUBLICADO para CANCELADO; versão em rascunho é excluída.
- Concluir pendência: o sistema passa documento, tipo e usuário; atende pendência do usuário ou de grupo dele; tira a tag se não restar pendência daquele tipo.
- Criar documento Repositório Digital: automático ao publicar avulso.
- Criar nova minuta: método de classe, processo de Minuta.
- Criar novo documento: método de classe `createNewDocument`.
- Descriptografar arquivo.
- Excluir pendências: apaga as pendências e as tags.
- Nova versão: só PUBLICADO e sem versão em rascunho.
- Pode ser assinado: usado pelo embutido. Fatores: tipos do tipo de documento, tipos do status, PDF para certificado, uma assinatura por usuário na versão, classificação arquivística do avulso (avulso não publica sem ela, porque o repositório digital precisa; se a publicação é automática na primeira assinatura, o avulso só assina com essa classificação). Saída: `result` (bool), `signingOptions` e `message`.
- Publicar versão: delega à versão.
- Reativar: só status CANCELADO.
- Registrar ciência: só quem tem a pendência de ciência.
- Tornar público: rotina sobre nível RESTRITO com prazo de restrição vencido.

Criação: método de classe, script ou API, Minuta, ou ação do Tramitador (mesma lógica do método de classe). Origem interna exige `dataForDocumentCreation` (o Sydle renderiza com esses dados). Origem externa exige `content`; `dataForDocumentCreation` é opcional. Tipo com controle padrão não pede controle no create. Tipo sem padrão exige `accessConfiguration` no script. O exemplo do artigo usa nível restrito, restrição temporária, `restrictionUnit` `"years"`, `criterionRestrictionExpiration` `"definedTime"`, `accessControlType` `"inherit"` e `timeForRestrictionExpiration` 5. Outros códigos não aparecem.

```javascript
_utils.getMethod("_classId", ID_CLASS_OFFICIALDOCUMENT, "createNewDocument")({
    "documentType": _utils.getMethod("_classId", DOCTYPE_CLASSID, "_get")({ "_id": ID_TIPO_DOCUMENTO }),
    "title": "Título do Documento",
    "source": _utils.getMethod("_classId", SOURCE_CLASSID, "_get")({ "_id": ID_ORIGEM }),
    "format": _utils.getMethod("_classId", FORMAT_CLASSID, "_get")({ "_id": ID_FORMATO }),
    "dataForDocumentCreation": data,
    "ticket": _pin.ticket,
    "accessConfiguration": {
        "accessLevel": { "_id": ID_RESTRITO },
        "restrictionType": { "_id": ID_RESTRICAO_TEMPORARIA },
        "restrictionUnit": "years",
        "criterionRestrictionExpiration": "definedTime",
        "accessControlType": "inherit",
        "timeForRestrictionExpiration": 5
    }
});
```

## Documento Oficial, pacote

Pacote de documentos atestados pelo controle do sistema. Classes centrais: Documento Oficial, Tipo de Documento, Versão de Documento, Documento embutido, Configuração de acesso, Configurações do documento oficial. O detalhe de cada uma está na página da classe. Ids que o artigo lista:

Classes: Documento Oficial `5d824174f4fe0d665608ae2e`; Configurações do documento oficial `5e161d1e0978c903b6caded5`; Formato de Documento `5dc334c6f4fe0d6656399e64`; Grau de Sigilo `603a416e3c3fc611b2e6356b`; Nível de Acesso `603a479b3c3fc611b2e6bc4a`; Origem de Documento `5df8f87fad0ab2006ceee5a9`; Status de Documento `604666dc3c3fc611b22b12a2`; Tipo de Documento `5dc32ec2f4fe0d6656398d71`; Tipo de Restrição de Acesso `603a47cf3c3fc611b2e6c067`; Versão de Documento `604668383c3fc611b22b2e50`; interface Classe de Dados `5dfa6530ad0ab2006cf051a1`; Documento oficial embutido `60bf8ecfecbfd32816c51906`.

Objetos: Nato digital `5dc3400ff4fe0d665639aedc`; Digitalizado `5df90968ad0ab2006ceefb1d`; origem Externa `5dfa3c10ad0ab2006cefc75e`; origem Interna `5dfa3c18ad0ab2006cefc76d`; objeto Configurações do Documento Oficial `5e162f3e30d14c459ef200dd`. Status: Cancelado `604667383c3fc611b22b191b`; Excluído `604667403c3fc611b22b198f`; Obsoleto `6046671c3c3fc611b22b17d8`; Publicado `604667153c3fc611b22b171f`; Rascunho `6046670a3c3fc611b22b1620`; Aguardando Integração `66f44a143211365e2e1f6db8`. Grau: Reservado `603a476a3c3fc611b2e6b783`; Secreto `603a41ae3c3fc611b2e63b3b`; Ultrassecreto `603a474d3c3fc611b2e6b468`. Nível: Público `603a4ed53c3fc611b2e7695f`; Restrito `603a4ede3c3fc611b2e769dc`; Sigiloso `603a4ee73c3fc611b2e76a2a`. Restrição: Definitiva `603a4efd3c3fc611b2e76ce2`; Temporária `603a4f0a3c3fc611b2e76da4`.

## Embedding e base de conhecimento

A classe Embedding gera registros a partir da classe de origem, em lote. Carga nova processa só itens inéditos e substitui a lógica da carga anterior; os objetos permanecem. As regras ficam em Configuração de Base de Conhecimento: conta e modelo da IA, classe de origem, script que formata o texto analisado pela LLM, e, em Avançado, a query dos objetos. O texto formatado aparece no campo Conteúdo, em Avançado, de cada objeto Embedding.

`getEmbeddings` busca por similaridade. `threshold` vai de 0 a 1; quanto menor, maior a precisão, no comentário do artigo. O hit útil está em `_source.contentSource`.

```javascript
const nearbyEmbeddings = com.sydle.ai.Embedding.weightedSearchNearby({
    "texts": [question],
    "weights": [1],
    "threshold": 0.3,
    "fromEmbeddingSources": [base],
    "size": 20,
    "webService": null,
    "user": null,
    "mmr": true
}).hits;
```

```javascript
const result = com.sydle.ai.Autopilot.run({
    "_id": configAutopilot,
    "method": "generateContent",
    "promptVars": promptVars
});
```

O artigo lê a resposta em `result.results[0]`. `promptVars` do exemplo tem `question` e `context`. O restante do exemplo (mapa de ids, `processarConteudosEmbeddings`, `buscarItemPorId`) é do caso, sem definição no texto.

## Python em campo Script

Campo Script executa JavaScript ou Python. Diferente do texto com conteúdo Script. O método é `execute()`. Python está em fase experimental.

Propriedades: `content`, `name` (com internacionalização), `language` (`PY`), `version`. `additionalContext` documenta parâmetros e não valida. `execute` recebe um único objeto; as propriedades viram variáveis globais. O script devolve em `_output`. Valores múltiplos no campo executam os scripts em sequência. `getObjWithScriptField` no artigo é ilustrativa; o Python em si não está no texto.

```javascript
_output = obj.pythonScript.execute({
    "produtos": produtos,
    "desconto": 10
});
```

## Script na instalação do Sybox

Operação de script na configuração do Sybox, executada depois da instalação. O exemplo faz `_patch` com `op` `"replace"` no `path` `"/nome"`. Os ids do artigo são do objeto de demonstração, não de classe de plataforma.

O script roda em toda instalação em ambiente novo, enquanto permanecer na configuração. Execução só na primeira instalação: remover o script do objeto de configuração depois dessa instalação.

```javascript
_utils.getMethod("_classId", ID_CLASSE, "_patch")({
    "_id": idObjeto,
    "_operationsList": [{
        "op": "replace",
        "path": "/nome",
        "value": "Flat"
    }]
});
```

## Media query no template de documento oficial

Objeto de Template de documento / Documento Oficial. O CSS do artigo reduz deformação na conversão HTML para PDF. O contrato de página é `@media` com `@page`: `size: A4`, margem `2cm 1cm 2cm 1cm`, `background` com `url({{marcaDagua}})`, e caixas `@top-left`, `@top-center`, `@top-right` e `@bottom-center`.

Tags Mustache usadas nessas caixas e no corpo do exemplo: `marcaDagua`, `ticket.code`, `brasao`, `secretaria`, `departamento`, `accessCode`, `autorizacao`, `processo`, `empresaInstaladoraDeInfraestrutura`, `expedicao`, `validade`, `primeiraEmissao`, `indicacaoFiscal`, `zoneamento`, `sistemaViario`, `enderecoDeImplantacaoDoSite`, `bairro`, `regional`, `alturaTotalDaInfraestrutura`, `rNDaBaseDaInfraestrutura`, `coneDaAeronautica`, `recuoFrontalDoEixoDaInfraestrutura`, `recuoFrontalDosGabinetesEOuDemaisEquipamentosAuxiliares`, `menorAfastamentoDoEixoDaInfraestruturaAteDivisaLote`, `menorAfastamerntoDoEixoDaInfraestruturaAteDemaisEdificacoesDoLote`, `menorAfastamentoDosGabinetesEOuDemaisEquipamentosAuxiliaresEmRelacaoAsDivisasDeDemaisEdificacoesDoLoteM`, `areaPermeavelDaAreaLocadaSiteM`, `taxaDePermeabilidadeDaAreaLocadaSite`, `anexarARTRRTReferenteAObraCivilDaInfraestruturaDeSuporteProjetoEExecucao`, `aeoSMMA`, `mensagemRegularizacao`, `accessCodeDoPrimeiro`, `accessCodeDoAnterior`, `observacoes`. O miolo HTML é o documento de exemplo, não um segundo contrato.

## Exportação avançada de objetos no Sybox

No campo Modo de Seleção da classe, na exportação. Modos:

- Todos: todos os objetos, buscáveis ou não. Indisponível para classe do tipo Interface.
- Individual: escolha manual.
- Avançado: filtro sobre objetos buscáveis. Sem filtro, exporta todos os buscáveis da classe, equivalente a `match_all`. Exige classe buscável, porque usa o motor de busca.

A exportação obedece a permissão `_get` de quem exporta; objeto fora dessa permissão não entra, mesmo que o filtro o alcance. O artigo combina o modo avançado com Bloquear Sobrescrita para objeto já existente no destino permanecer. O filtro recorrente pode ser anotado em Observações do Sybox. Não há query pronta no texto.
