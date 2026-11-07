# Documento, portal e componentes

Contrato de documento oficial, da pendência que o sucede, do portal de serviços e da view que coloca um componente de tela no lugar do formulário nativo. Entram só os artigos da lista que trazem esse contrato. Onde o texto não mostra assinatura, parâmetro ou passo, o trecho diz isso e não completa.

## Template de documento

A classe guarda o HTML que o mustache.js renderiza na criação de documento oficial de origem interna. Os campos são nome, template e imagens. As marcações mustache usam os identificadores da classe de dados adicionais, do documento oficial e das classes referenciadas. O método Renderizar da própria classe monta o arquivo. A view é o campo de dados adicionais, com estes atributos a mais: `title`, `documentType`, `accessCode`, `now`, `author`, `signatures`, `signs` e `qrcode`. `signs` é o texto no padrão `Assinado eletronicamente por: <autores das assinaturas>`.

No URL da imagem, `{{qrCode}}` posiciona o QR com link para o documento. Uma imagem do campo Imagens entra pelo identificador, com arquivo de Arquivo/ECM. O Renderizar cria a tag. O uso é `<img src="{{brasao}}"/>`.

Campo múltiplo itera com o mustache nativo, inclusive a tabela de assinaturas (`signatureDate`, `user`, `signatureType`, `ip`):

```html
<!--{{#signatures}}-->
{{signatureDate}}
<!--{{/signatures}}-->
```

Data no template segue a configuração do campo. Com Data sem hora ou GMT local verdadeiro, a função ajusta o fuso. Sem essas marcas, a função é a regular.

- `{{#formatDateFunction}}{{identificadorCampoData}}{{/formatDateFunction}}`: data completa, sem ajuste de fuso.
- `{{#formatDateOnlyFunction}}{{identificadorCampoData}}{{/formatDateOnlyFunction}}`: data sem hora, sem ajuste de fuso.
- `{{#offSetFormatDateFunction}}{{identificadorCampoData}}{{/offSetFormatDateFunction}}`: data completa, com ajuste de fuso.
- `{{#offSetFormatDateOnlyFunction}}{{identificadorCampoData}}{{/offSetFormatDateOnlyFunction}}`: data sem hora, com ajuste de fuso.

## Tipo de documento

O tipo configura o documento oficial no mesmo papel em que uma classificação configura um ticket. Nome é obrigatório. Origem interna ou externa vem em Origens permitidas. Extensões aceitas limitam a origem externa. Formato é nato digital ou digitalizado. Origem interna só admite nato digital, e o template (referência não embutida) e o formulário de dados são obrigatórios. O formulário é uma classe na interface `Classe de dados – Documento oficial`. Serve para renderizar o template ou só para guardar dados, e permite buscar o documento pelos campos adicionais. Template e classe de dados existem antes do tipo.

Tipos de assinatura definem o que o tipo aceita. Certificado digital assina apenas PDF. Com nenhuma opção marcada, o documento não é assinável. O carimbo customizado substitui o padrão de Configurações do Documento oficial, em Dimensões do carimbo de assinatura digital. O texto do carimbo aceita `{{identificador}}` dos campos do documento, `{{user}}`, `{{date}}` e `{{CN}}`. Também entram altura, largura, tamanho da fonte, posição X e Y e a quantidade máxima de carimbos lado a lado.

Unidades com permissão para criação, quando preenchidas, restringem quais unidades criam aquele tipo. A ação de criação lista só os tipos que o usuário pode criar.

Nível público: servidor público acessa o documento publicado. No portal de serviços da PBH, qualquer cidadão consulta pelo código de acesso, sem autenticação. Nível restrito: grupos ou usuários por herdar do ticket ou por definição explícita. Herdar do ticket não existe para documento avulso. A restrição é definitiva ou temporária. No caso temporário, o autor define o critério para tornar o documento público: prazo ou fase do ticket. Fase do ticket não existe para documento avulso. Nível sigiloso: grupos ou pessoas definidos pelo autor ou pelo digitalizador na criação. O grau de sigilo marca o tempo até o documento ficar público. Graus e tipos de restrição permitidos só valem se o nível correspondente estiver liberado.

Bloquear publicação sem assinatura impede publicar documento não assinado e tira a ação de publicação na criação. A ação de publicação é na criação, após a primeira assinatura ou manual, pelo método de publicar. Documento criado por ticket publica independentemente dessa opção.

Criptografar arquivos guarda o arquivo criptografado. O acesso é o método Descriptografar arquivo, da classe Documento Oficial.

Classificação arquivística rege o documento e a associação ao repositório digital. Sai do método Classificação arquivística no objeto do tipo. Publicar documento avulso, sem ticket, exige essa classificação configurada.

A pré-definição de controle de acesso, quando marcada, torna obrigatória a configuração de acesso padrão, embutida, seguida por todos os documentos do tipo. O booleano só muda enquanto não existir documento oficial daquele tipo. Documento que já usa a configuração padrão impede o tipo de deixar de defini-la. Documento com configuração individual impede o tipo de passar a definir uma padrão.

Status inicial permitido aponta para Status de documento. Os status citados são Rascunho e Aguardando Integração. Um status selecionado vale para todo documento criado. Mais de um exige a escolha na criação. Campo vazio deixa o status Rascunho.

## Versão de documento

Cada documento oficial gera uma versão, que é o snapshot daquele momento. Os campos são documento (referência não embutida), número da versão, status da versão, data da publicação, conteúdo da versão (documento oficial embutido com todos os dados), responsável pela publicação, hash inicial, hash atual, hash da publicação e minuta. O campo documento se repete em todas as versões do mesmo documento. Os dados vão replicados em conteúdo da versão. Os hashes rastreiam alteração do arquivo. Assinatura pode mudar o hash.

Assinar/autenticar e Editar versão alteram a versão e, com ela, o documento. A edição sai de versão em rascunho. Alteração em rascunho da versão inicial, ou em versão publicada, replica no documento referenciado. Assinar o documento assina a versão atual. Dá para assinar a versão em rascunho e deixar a publicada sem essas assinaturas. Enquanto a primeira versão está em rascunho, o documento também está em rascunho. Ao publicar essa versão inicial, versão e documento passam a publicado. Alteração em versão já publicada, como uma assinatura, também replica no documento.

Editar versão altera título, arquivo (só origem externa) e dados adicionais (`dataForDocumentCreation`), e só corre em rascunho. A edição invalida as assinaturas do objeto. Assinatura, publicação e as demais ações geram Histórico da Ação, ligado ao documento e à versão.

Nova versão cria outra versão em rascunho e não mexe na publicada. Não corre se já existir versão em rascunho daquele documento. Publicar versão só corre a partir de rascunho. A versão passa a publicada, os dados dela, inclusive assinaturas, replicam no documento oficial, e as versões anteriores ficam obsoletas.

## Identificador sequencial de documento oficial

A partir da versão 2.2.7 de Documento Oficial, o identificador sequencial atribui um código ao documento. Pode funcionar como identificador único, ao lado do código de acesso. A sequência é do tipo: todos os documentos daquele tipo compartilham a série, e mais de um tipo pode apontar para a mesma configuração.

O artigo associa Sequência ao id `000000000000000000000083`. O objeto tem identificador, valor atual e incremento. Associa Sequência de Documento Oficial ao id `66e332757863b322847cfc97`. Esse objeto guarda nome, modelo, método gerador das chaves e a sequência embutida.

O modelo é mustache. O padrão do artigo é `{{prefix}}.{{sequence}}/{{year}}`. O número da sequência é calculado à parte. O método gerador preenche as outras chaves do modelo. Recebe o documento oficial e o tipo, e devolve um objeto com os valores das chaves. O tipo sempre vem preenchido. O documento só tem valor quando a sequência nasce na primeira publicação.

A sequência embutida tem a chave mustache que recebe o número, o reinício (anual, zerando no ano novo, ou nunca), o tamanho mínimo (completa com zeros à esquerda), a referência ao objeto Sequência e o último resete, somente leitura, usado no reinício anual.

No tipo, Utilizar a identificação sequencial libera Sequência e Momento da geração. O momento é a criação ou a primeira publicação. Na primeira publicação, o rascunho fica sem o identificador até a versão inicial ser publicada.

## Validador de documentos

Serviço do portal de serviços que confere a autenticidade do documento oficial. A busca usa o código de acesso. Com permissão de acesso ao documento, a tela mostra os dados para consulta e download. O artigo não traz método, parâmetro nem classe.

## Edição de documento oficial via preview

Dois templates. O primeiro leva cabeçalho, rodapé e a variável de conteúdo em chaves triplas, `{{{conteudo}}}`. O segundo leva o texto inicial editável e não leva cabeçalho, rodapé nem configuração que os altere, porque entra dentro do primeiro. O tipo de documento aponta para o primeiro template. O formulário de dados leva as variáveis do primeiro, e não as do segundo.

O texto do segundo template é renderizado no iniciar da atividade e de novo quando o usuário marca que a edição não é necessária. Fora desses dois momentos, o campo de texto editável é a fonte do documento, e as variáveis do segundo template não recarregam. No atualizar rascunho, a remontagem do texto original só ocorre se esse campo mudou. Sem essa checagem, qualquer alteração do formulário devolve o documento ao texto inicial. O preview renderiza o primeiro template com `conteudo` igual ao texto editado, grava HTML (`text/html`, charset `UTF-8`) e converte para PDF (`application/pdf`).

O exemplo do artigo, no ramo em que a edição não é necessária, monta o objeto `viewSegundoTemplate` e chama `mustache.render` com `view2`.

A geração chama `createNewDocument` com os dados do primeiro template e o conteúdo editado em `dataForDocumentCreation`. O retorno usado no exemplo é `.document`. Os ids que o exemplo trata como origem interna e formato nato digital são `5dfa3c18ad0ab2006cefc76d` e `5dc3400ff4fe0d665639aedc`, lidos em `documentSource` e `documentFormat`.

```javascript
const documento = com.sydle.government.officialDocument.officialDocument.createNewDocument({
    "ticket": ticket,
    "documentType": tipoDocumento,
    "title": titulo,
    "fileName": titulo,
    "source": origemInterna,
    "format": formatoNatoDigital,
    "dataForDocumentCreation": {
        "titulo": tituloDocumento,
        "subtitulo": subtituloDocumento,
        "conteudo": textoEditado
    }
}).document;
```

## Word a partir de HTML

A plataforma não gera `.docx` nativo. A lib `html-to-docx.js`, disponível no elo-dev, converte HTML em `.docx` sem biblioteca externa: traz o gerador de ZIP e o parser de HTML/CSS. A instalação é incluir o arquivo na classe de arquivo. O caminho do `require` é o da pasta em que o arquivo ficou. A função devolve Base64 para `_fileHelper.create`. Preserva parágrafo, negrito, itálico, sublinhado, tabela, lista, imagem em data URI e CSS básico de cor, alinhamento e fonte.

HTML malformado gera formatação inconsistente. A conversão pede tags fechadas, imagem em data URI e `_utils` passado no `init`.

```javascript
const HtmlToDocx = require("lib/html-to-docx.js").init({ "_utils": _utils });
const docxBase64 = HtmlToDocx.htmlToDocxBase64(htmlString);
const arquivoGerado = _util._fileHelper.create({
    "targetFileName": "certidao.docx",
    "targetContentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "base64": docxBase64
});
```

## Agente de IA para leitura de datas

O agente lê um arquivo anexado, extrai um dado e preenche o formulário. O objeto de Agente de IA usa missão Missão de Agente - Geração de conteúdo e classificação Geração de conteúdo. O template fica em Configurações de agente. O objeto de Template de documento, no contexto de IA, usa classificação Prompt de IA. O prompt, no campo template, descreve o arquivo e pede a extração em JSON.

O exemplo roda no atualizar rascunho, depois do upload. Converte o arquivo para PDF, abre `_utils.file.pdf.PdfReader` e, em cada página, chama `getText` com `forceOCR` verdadeiro e charset `utf-8`. O leitor fecha no `finally`. O texto acumulado vai em `promptVars`.

`result.success` verdadeiro não garante que a informação pedida veio. O exemplo lê `result.results[0]` como JSON e só então preenche os campos. Sem dado válido, marca erro, limpa o grupo de dados e avisa para preencher à mão. O artigo não define o id do agente nem o corpo do JSON.

```javascript
const resultado = com.sydle.ai.Autopilot.run({
    "_id": idAgente,
    "promptVars": conteudo,
    "method": "generateContent"
});
```

## Integração Docusign

O sybox envia documento para assinatura por um conector e oferece um processo genérico de assinatura. O artigo nomeia o pacote Integração, a classe Docusign Connector, o Formulário de assinantes e os processos Assinatura de Documento via DocuSign e Exemplo Docusign. Não há contrato de método, parâmetro nem passo de configuração no texto.

## Gestão de pendências

A pendência é genérica. Qualquer objeto do ambiente pode originá-la em `objetoOrigem`, inclusive fora de documento e de BPM. Sucede a Pendência de ação do Documento oficial. O legado continua funcionando e aparece no mesmo workspace pela camada de migração. O pacote sai do SYBOX Gestão de Pendências. O atendimento fica no workspace Gestão de Pendências e na classe Pendência.

Pendência é a atividade: destinatário, status, prazo e origem. Tipo de Pendência define a classe de dados adicionais, a classe de origem esperada e se permite lote. A classe do formulário implementa Dados adicionais de pendência e fornece `executarAtendimento` e os hooks. Evento de pendência é o histórico imutável da transição e guarda os dados adicionais preenchidos no atendimento. Dono concede leitura a responsáveis ou superiores. O artigo aponta o detalhe de dono e de hooks para outras páginas, sem listar os nomes dos hooks.

As setas tracejadas do fluxo são hooks observadores: falha neles entra no log e não desfaz a transição. `executarAtendimento` participa da transição: se lançar erro, nada é gravado.

## Gestão de pendências do documento oficial

A pendência liga ações do documento oficial, como exclusão, ciência e assinatura, a outras entidades do ambiente. O ponto único citado é o workspace Pendencias de documentos ou a classe Pendencia de ação, com atendimento em lote. Não há assinatura de método nem lista de campos no texto.

## Portal de serviços

O portal expõe serviços ao cliente: catálogo, categoria e serviço. O catálogo é o item raiz da página principal. A categoria agrupa serviços em níveis. O serviço é conteúdo ou formulário. Conteúdo consulta informação, com imagem, vídeo, arquivo, texto e link. Formulário recebe preenchimento, com ações, texto e arquivo. Conteúdo dinâmico apresenta dados do usuário, como o perfil e os chamados abertos. O rodapé fecha a página.

O frontend citado usa CSS, HTML, Markdown e mustache. O exemplo de frontend em Angular é o portal da PBH DIGITAL. O backend são métodos configurados na Api do portal. O artigo não lista esses métodos.

## Workspace embutido em serviço de portal

Solução para exibir mapa do Analytics 1.0 dentro de um serviço de portal. O Analytics 2.0 não tem componente de mapa. Para outros painéis, com a versão nova do Analytics, o artigo diz que há formas mais simples e não as descreve.

O workspace é da classe WORKSPACE / SISTEMA, com uma view, a do Analytics, essa view na pilha de URLs, e a marca de workspace incorporado. O serviço do portal usa a classificação CONTEÚDO DINÂMICO e um HTML com iframe. A interface de backoffice não aparece.

O iframe aponta para `<<ORG_URL>>/ws1/#/app/<<APPLICATION>>/workspace/<<WORKSPACE_ID>>`. `<<APPLICATION>>` no uso usual do portal é `servicedesk-embedded`. A página escuta `message`. Segue só se a origem for a URL da org, se `event.data` for string e se o JSON tiver `subject` igual a `ready`. Aí envia `authenticate` com o token lido de `localStorage`, na chave `explorer_user_map`, no primeiro usuário da aplicação, em `accessToken.token`. A mensagem leva `source` `SYDLE_EXPLORER`, `subject`, `delay` 0, `body` e `recipient` com `slot` e `target`. O `postMessage` do exemplo usa destino `*`.

```javascript
const mensagem = {
    "source": "SYDLE_EXPLORER",
    "subject": "authenticate",
    "delay": 0,
    "body": {
        "token": tokenUsuario
    },
    "recipient": {
        "slot": null,
        "target": null
    }
};
```

## Workspaces

A classe Workspace fica no pacote Workspaces. O grupo de usuários de acesso define quem vê o workspace. Grupo Padrão abre para todos.

O slot organiza uma ou mais views: tamanho, posição e a configuração própria do tipo, em geral busca e filtro. A listagem de classes escolhe classes, interfaces e pacotes visíveis e a caixa de busca. A listagem de objetos configura cada classe, com busca segmentada (filtro ou query ElasticSearch), busca segmentada padrão na primeira renderização, buscas salvas e o modo de lista. O modo tabela existe desde a versão 2.47.2 do Workspace. Nele entram visibilidade do avatar, colunas com alias e tamanho, e os métodos exibidos nas opções do objeto. O modo card é a listagem já usada no ONE.

Convém ao menos um slot do tipo slot, usado como local de abertura. Por padrão, uma referência empilha outro objeto no mesmo slot. A exibição de objeto, por classe, escolhe o destino da referência: automático, slot atual, outro slot (se não houver slot, cai no automático), subslot ou nova aba.

## Workspaces na wiki de tecnologia

Workspace filtra pacotes, classes, objetos e views. A janela padrão do exemplo fica em 300 por 300, com 10 px de intervalo: posições 0, 310 e 620. A view externa recebe a URL do serviço no campo URL. A listagem de classes controla classes, interfaces, pacotes e a opção Permitir Busca. A listagem de objetos tem classe padrão, busca segmentada e template de busca. O grupo de acesso só controla quem visualiza o workspace. Ver as classes listadas continua dependendo da permissão no método Obter.

## Componente de UI em método de tela

Um método de tela com formulário de entrada vazio abre, no subslot, um componente SYDLE UI no lugar do formulário nativo. O formulário precisa existir, sem campos. O exemplo usa contexto Objeto e Rascunho, destaque na exibição do objeto e menu no rascunho. O id de `inputParameters` sai do JSON da classe, em `methods`, pelo identifier, ou da resposta da classe no navegador, em `object.methods`, no método, em `inputParameters._id`.

O componente implementa `ViewComponent`, de `@sydle/sydle-one-components`. As props que a plataforma injeta são `workspaceId`, `slotId`, `stateId`, `viewId`, `mode`, `refObjectId`, `refClassId`, `methodIdentifier` e `context`. `refresh` e `onClosing` existem mesmo sem lógica. O `onClosing` do exemplo devolve `shouldFocus` falso e `waitFor` com uma promise resolvida em verdadeiro. Em `componentWillLoad`, `CrossOriginMessageService.setLoading(false, this.stateId)` encerra o carregamento.

Depois do deploy, o Pacote UI mostra a versão do build, o bundle `.zip`, as entradas Script (importmap) e Script (module), e as dependências. O pacote entra na lista de dependências da Aplicação UI. Sem esse vínculo, o componente não carrega.

O campo Habilitado para da view só aceita objeto da classe nativa `_class`. O formulário de entrada do método é instância de `_methodParameterClass` e não aparece nessa lista. A view nasce por script, apontando para a classe do método, e um `_patch` troca `class` pelo id do formulário. Levar a view pronta no Sybox falha na validação, porque a referência não é uma classe nativa. O script de criação vai como operação do tipo Script no Sybox. O campo `component` é a tag do decorator `@Component`. Tag diferente abre o método sem renderizar. O exemplo busca a view pelo `identifier` e só cria se `hits.total` for menor que 1.

Os ids de `viewType` e `mode` no script do artigo são `6206ab030d21423bc3df38bd` (classe `6203f1780d21423bc3bdd213`) e `620a47a4bd5aff3ea4e58cd8` (classe `6203f40e0d21423bc3c40910`). A view do exemplo também grava `externalView` falso, `priority` 10 e `useLegacyCrossOriginProtocol` falso.

```javascript
com.sydle.ui.workspaces.View._patch({
    "_id": view._id,
    "_operationsList": [{
        "op": "REPLACE",
        "value": idFormularioEntrada,
        "path": "/class"
    }]
});
```
