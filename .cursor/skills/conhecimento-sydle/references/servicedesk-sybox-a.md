# Sybox, executável e migração, parte 1 (documentação oficial)

Contratos de executável (script, método, requisição HTTP, teste, coleção, relatório, acompanhamento, mock, spy e cobertura), de Sybox (OSM, dependência, versionamento, repositório, canal, publicação, preview, reversão e Creator) e de migração de classe e tópicos, no texto deste lote do service desk. A página que só traz título e seção não vira seção.

## Executável

Entidade que executa script, requisição HTTP, método ou teste. O uso fica em desenvolvimento, migração de dados e teste automatizado.

Cinco tipos. Script: script avulso, contexto estático (pacotes, classes e `_utils`), motor Graal, sem classe nem método. Método: chama um método da classe e usa um script de pré-execução como parâmetro. Requisição HTTP: REST para API interna ou externa, com verbo, URL, corpo e headers. Teste: a partir da 8.19, motor de testes nativo no Graal, independente de biblioteca externa, no estilo describe, it, test, beforeAll, beforeEach, afterEach, afterAll e matchers. Coleção: a partir da 8.19, agrupa executáveis; o executável que pertence à coleção pode herdar leitura, escrita e execução. Serve de pipeline de migração ou de suíte de testes.

Toda execução gera relatório. Teste e coleção podem ir para a fila de métodos e, nesse caso, também geram acompanhamento.

## Acompanhamento de execução

A partir da 8.19. Objeto criado na execução em lote (listagem, testes e coleções), atualizado conforme cada execução termina. Dá para abortar os executáveis que ainda não começaram.

## Relatório de execução

A partir da 8.19. Guarda tempo, parâmetros de entrada e resultado. Script, método e requisição HTTP podem rodar de forma síncrona e mostrar o resultado na hora; o relatório fica na listagem da classe Relatório de execução. Teste e coleção podem estourar o timeout da requisição, então correm de forma assíncrona na fila de métodos, e o relatório é exibido ao usuário.

## Testes

A partir da 8.19. Lista de casos; cada caso é um script com este contexto: `on` (retentativa, timeout, spies), `describe` (grupo), `it` e `test` (caso, com expect e matchers), `beforeAll`, `beforeEach`, `afterEach`, `afterAll`, `expect` e matchers. A execução é nativa no Graal.

## Mocks e spies

Só no executável de teste, a partir da 8.22.0. Mock substitui a dependência. Spy observa o objeto real e mantém o comportamento original.

O contexto central é `on.fn`. A função encapsulada nasce spy; `mockImplementation` transforma em mock. O motor guarda a função e aciona o mecanismo a cada chamada.

```javascript
const wrappedFunction = on.fn(function () {});
```

## Cobertura de testes

A partir da 8.30. Opcional, só em executável do tipo Teste e em coleção que contém esse tipo. O relatório sai pelo relatório de execução do teste: resumo e detalhe por método, com os trechos.

Glossário do artigo: linhas encontradas (linhas válidas para execução); linhas executadas; cobertura, a razão executadas/encontradas, arredondada; detalhes no padrão Script.Número / Linha Inicial-Linha Final. Número é a ordem daquela execução do script quando ele roda mais de uma vez. Linha inicial abre o bloco; linha final fecha estrutura (`if`, `for`). O trecho marca se foi coberto.

## Gerenciador de dependências

O OSM instala e atualiza Sybox da organização, inclusive a dependência da dependência. A variação pede versão específica, maior, menor ou release major. Se a variação não for atendida, o OSM instala a versão que a atende.

A partir da 8.40, o OSM só aceita dependência publicada em canal igual ou mais estável que o do pacote que a declara, e prefere a versão mais estável disponível.

## Reversão de instalação do Sybox

A partir da 8.24, ligada a feature toggle. A partir da 8.30, o toggle fica ativo por padrão. Desfaz a instalação pelo conjunto inverso das operações dela.

Escopo: objetos exportados, dependências e scripts executados na instalação. Ação de WebTarget, dado de negócio fora do Sybox e arquivo ficam de fora. A reversão mexe em objeto e metadado.

A mesma instalação gera operações diferentes conforme o estado da organização: organização vazia leva a delete; objeto que já existia leva a update. A ordem é da instalação mais recente para a mais antiga. Reverter uma reversão pode apagar os objetos que ela criou, inclusive por deleção em cascata.

Armadilha: instalação que não alterou o sistema omite o método Gerar reversão, ou omite essa instalação na seleção.

## Criação dinâmica de Sybox de reversão

`_utils.sybox.Creator`, a partir da 8.35. Um script registra o CRUD e produz um `.sybox` de reversão sem Sybox de instalação de origem.

Intercepta criação, atualização e deleção de objetos. WebTarget, mensagem de fila já processada e alteração em classe do sistema ficam de fora.

`undoOnFailure(true)` aplica a reversão gerada quando o status final é FAILED. O metadado de origem fica SCRIPT_EXECUTION (instalação padrão fica SYBOX_INSTALL). Reversão antiga sem o campo Origem vale como SYBOX_INSTALL. O método Visualizar origem da reversão mostra essa origem.

O retorno traz status (SUCCESS ou FAILED), output do script, mensagens do contexto e o arquivo de reversão.

## Repositório de Sybox

Repositório centraliza Sybox, permissão de download e regra de download. Toda organização tem um Repositório de Sybox Padrão.

Permissão obter chama Obter (download do pacote), Obter Metadata do Sybox e Listar Versões Disponíveis. Permissão publicar chama Publicar, que cria artefato a partir de um link de download do arquivo.

Canais: LTS (operação crítica, estável por longo período), Stable (produção), RC (perto do lançamento, correção de bug), Beta (funcionalidade em teste, pode ter bug), Alpha (teste interno) e Snapshot (gerado a cada alteração, instável; o artigo não recomenda produção).

Artefato é qualquer arquivo Sybox do repositório. Há um Artefato Padrão. Implementação própria segue a interface Artefato de Sybox e os métodos `get`, `getMetadata`, `listAvaliableVersions` e `publish` (grafia do artigo).

## Versionamento

Versão semântica MAJOR.MINOR.PATCH. MAJOR quebra compatibilidade, MINOR adiciona função compatível, PATCH corrige bug. Pacote e versão são únicos no ambiente. O exemplo do artigo: 1.2.3 pode ir a 2.0.0, 1.3.0 ou 1.2.4.

Deprecar um Sybox de instalação já aplicado impede que a versão antiga bloqueie a instalação de dependência nova.

Dependência paralela é exigida pela instalação e não é instalada junto. A configuração é por organização e não impede a instalação manual do Sybox. O grafo do artigo, CRM que puxa IA que puxa GED: `com.sydle.crm@2.12.0`, `com.sydle.ia@1.2.3`, `com.sydle.ged@1.0.0`.

## Tópicos

Canal com nome e identificador. Publicar envia tipo de evento e dados. A assinatura liga um tipo de evento a um método. O schema do tipo de evento só documenta o payload: a plataforma não valida os campos do schema.

A publicação não espera os assinantes. Não há ordem garantida; o payload traz `sequence` para o consumidor ordenar. Há fila principal, fila de overflow e execução de fallback. A entrega pode falhar em sobrecarga ou falha interna. `publish` devolve `status`: DISPATCHED aceita o evento para processamento assíncrono. ERROR_DISPATCHING e INTERNAL_ERROR significam que o evento não foi entregue e nenhum assinante roda. O artigo remete a lista completa de status para outra página; os valores além desses três não estão neste texto.

Falha de um assinante não afeta os outros do mesmo evento.

Topic e TopicSubscriber não exportam em Sybox para plataforma anterior à 8.35; a exportação falha na validação.

## Suíte de testes

Coleção, a partir da 8.19. Na criação ainda não dá para configurar o modo de execução entre "Todos da coleção" e "Apenas selecionados", porque a coleção ainda não existe para ser referenciada. Depois de publicar, os executáveis entram na coleção e aparecem na aba Dados.

O botão Executar abre o relatório da coleção, que referencia o relatório de cada executável. Dá para filtrar quais testes entram. O modo de execução escolhe mensagens da fila em paralelo ou fila em que um teste roda por vez. A execução sequencial serve a pipeline de migração: o próximo só começa quando o anterior termina, e o processo para na primeira falha. Suítes podem ser aninhadas.

## Executável de método

Chama um método sem classe de teste. O formulário tem classe e método, script de pré-execução e o método selecionado (permissões, entrada e saída). O script de pré-execução roda antes e o valor de `_input` é o parâmetro do método. O resultado mostra a saída da pré-execução e a entrada usada na chamada.

## Testando queries

O guia aponta o método `_search` da classe Classe. O script de pré-execução atribui `_input` com a query; o exemplo conta classes cujo `name` começa com "C" e pede `size` 0 para não trazer hits. A saída aparece no campo Saída.

```javascript
_input = {
    "query": {
        "match_phrase_prefix": {
            "name": {
                "query": "C"
            }
        }
    },
    "size": 0
};
```

## Requisição HTTP

Formulário com URL, método, corpo, headers e parâmetros de URL. O botão Executar dispara a chamada. O formulário de resposta mostra o retorno. Vale para API externa e para a API do próprio ONE.

## Serviços externos

O mesmo executável de requisição HTTP. O guia faz um GET em API pública sem header e sem parâmetro de URL, e um POST com corpo. O resultado aparece no campo Resultado. Não há assinatura de método da plataforma além dos campos do formulário.

## Comportamento da API

O guia chama, pelo executável HTTP, um método que devolve status pela chave `_response`. Sem autenticação a chamada recebe 403. O tipo de autenticação do exemplo é Bearer, com o JWT de quem executa. O artigo não mostra o valor do token.

Sem `_input`, o exemplo responde 400. Com `giveCustomHeaders` verdadeiro, responde 200 e o header `CustomHeader`. Com `giveCustomStatus` verdadeiro, o status da resposta é `_input.status`.

```javascript
_output = {
    "_response": {
        "status": 400
    }
};
```

## Executável de script

Script avulso, executado no próprio objeto, sem classe e sem método. A saída vai para `_output` e aparece no campo Resultado. O botão Executar roda o script sem publicar o executável.

## Processando dados do ambiente

O guia busca usuários ativos pela interface `_aclUser` em `_system._aclUser._search`: `size` 0 lê `hits.total`; as páginas seguintes usam `size` e `from` e mapeiam `hits.hits` para `_source`. O script devolve os nomes em `_output`.

Armadilha escrita no guia: o mesmo nome aparece mais de uma vez porque classes diferentes implementam `_aclUser`.

## Primeiro teste

A partir da 8.19. Tipo Teste, casos no campo Casos de teste. O script padrão do caso é o bloco abaixo. Executar funciona sem publicar e abre o relatório, atualizado a cada caso.

```javascript
describe("", () => {
    test("", () => {
        expect(1).not.toBe(2);
    });
});
```

## Testando métodos

A partir da 8.19. O guia chama o método no formato pacote, classe e método, com o parâmetro em objeto, e valida com `toBeTruthy`, `toBe` e `toThrow`. `toBeTruthy` sozinho aceita objeto vazio. Dá para desativar um caso e rodar só o outro. O método e o CEP do exemplo são do cenário do guia, não um método de plataforma.

## Utilizando mocks e spies

A partir da 8.22.0, só em teste. `on.fn` aceita o método, o trio pacote/classe/método em texto, ou a classe e o nome do método. `mockImplementation` troca o corpo. No exemplo, `_id` igual a `"qualquervalor"` devolve um objeto estático; os demais argumentos devolvem `on.originalImplementation`, flag para o motor rodar o código original, sem guardar a função antiga. Mock também é spy: `toHaveBeenCalled` e `toHaveReturnedWith` valem nos dois.

`on.clearAllSpies` limpa todos os spies. `clear` no spy limpa um. Limpar só no `beforeAll` deixa um caso contaminar o seguinte; o guia manda limpar no `beforeEach`.

Armadilha do próprio exemplo: o spy é criado em `_utils.acl.checkPerm` e a chamada escrita no teste é `_utils.checkPerm`.

```javascript
const getSpy = on.fn(com.sydle.one.ide.Runnable._get);
const getSpyByNames = on.fn("com.sydle.one.ide", "Runnable", "_get");
const getSpyByClass = on.fn(com.sydle.one.ide.Runnable, "_get");
```

## Executando testes com cobertura

A partir da 8.30. No teste já criado, marcar Cobertura de testes e executar. O relatório de execução referencia o relatório de cobertura, com resumo e trechos por método. O exemplo do guia chama `com.sydle.one.ide.Runnable._getMetadata` sem argumento dentro do `test`.

## Limpeza automática de teste

A partir da 8.38. Reaproveita a reversão de Sybox e desfaz as escritas do teste sem `afterAll` manual. O campo Gerar reversão liga a interceptação e o arquivo. Com ele ligado, Limpeza automática fica editável. Desligar Gerar reversão desliga Limpeza automática.

Teste fora de coleção: a reversão aplica ao terminar. O campo Estado de reversão do relatório vai para Aplicado, ou Erro na aplicação. Teste dentro de coleção: ao terminar, o estado fica Gerado; a aplicação espera o fim da execução da coleção (o executável disparado). A notificação acompanha cada filho e fecha com a quantidade revertida e a quantidade com falha. Cancelamento da coleção, ou falha de infraestrutura, deixa as escritas no banco.

Estados: Não gerado (sem Gerar reversão, ou teste ainda aberto); Gerado (arquivo pronto, aplicação aguardando a coleção); Aplicado; Nada a reverter (nenhuma escrita); Erro na geração; Erro na aplicação. Erro na aplicação de um teste não interrompe a limpeza dos outros; as escritas daquele teste permanecem.

## Migração de classe

A Configuração de migração versiona o formato dos objetos da classe. Cada migração tem identificador, a opção se já existir no destino (Não executar ou Executar), script de upgrade, script de downgrade e alias. A instalação usa essas migrações no objeto que o arquivo traz, na leitura, antes de gravar. A Operação de Migração de Dados transforma objeto que já existe na organização de destino.

A classe aponta para um objeto de Configuração de migração, com a classe da migração e a lista. Identificador único na configuração. Ordem é inteiro e só aparece quando a classe da migração é interface. Downgrade só existe para Não executar. Alias lista identificadores que esta migração substitui.

Ao salvar: a classe da migração está desprotegida; identificadores únicos; alias não colide com identificador de outra migração da mesma configuração; Executar não tem script de downgrade; em interface, duas migrações não compartilham Ordem. Escolher Executar esconde o downgrade e descarta o valor.

Classe padrão: Ordem não aparece; a sequência é a posição na lista. Interface: Ordem é preenchida à mão, única na configuração; em branco recebe a primeira ordem livre a partir de 10, de 10 em 10; a lista é gravada ordenada por esse campo. As migrações da interface correm junto com as das outras interfaces da classe, por isso o número precisa existir.

Objeto comum migra pela própria classe. Objeto de classe (a modelagem) migra pelas interfaces que implementa. Interface não tem armazenamento e não é migrada; quem migra é a classe STANDARD que a implementa. Para versionar o schema, a configuração fica na interface. Migração de interface não se aplica a uma classe que, na versão trazida pelo Sybox, não implementa essa interface. A autoridade do schema é o objeto de classe do arquivo.

Comparação origem e destino:

| Situação | O que executa |
|---|---|
| Não executar nos dois lados | Nada |
| Não executar só na origem | Downgrade |
| Não executar só no destino | Upgrade |
| Executar presente no destino | Upgrade, sempre |

Primeiro todos os downgrades, da maior ordem para a menor; depois todos os upgrades, da menor para a maior. Se o Sybox leva a configuração de uma classe ou de um objeto que já existe no destino, só as migrações Executar rodam: as Não executar passam a existir nos dois lados.

A Ordem é única dentro de uma configuração. Entre configurações, o desempate é: migração de interface antes da classe concreta; entre interfaces, a alterada há mais tempo (data da última alteração). O empate só ocorre entre configurações diferentes.

Executar aplica o upgrade em toda instalação em que a migração existe no destino, mesmo com o identificador também na origem, e mesmo coberta por squash. Não tem downgrade, então não transforma de volta.

No squash, o identificador antigo declarado no alias conta como presente e não é reexecutado. Executar ignora essa cobertura.

A migração de classe é a última etapa da conversão de cada objeto. O artigo numera, nesta ordem, 1 normalização (objeto protegido, Não sobrescrever, campos de sistema), 2 configuração de campos (manipulação declarada na exportação) e 5 migração de classe. Os números 3 e 4 não aparecem. FieldChange roda antes da migração: o script recebe o valor já manipulado. Objeto que a normalização decide não sobrescrever sai do fluxo e não chega à migração.

O mesmo script roda na validação e na instalação. `_input.validating` verdadeiro é validação; falso é instalação. Transformar o objeto recebido é seguro nas duas: o resultado da validação é descartado. CRUD em outro objeto na validação executa de novo na instalação. A validação também roda quando a instalação não ocorre (erro de validação ou instalação não confirmada).

```javascript
if (_input.validating === false) {
}
```

O script recebe o objeto no caminho do valor a migrar. Depois da raiz, a instalação percorre os embutidos como o objeto ficou após a migração da raiz, e não repete o percurso. Embutido ausente ou nulo não é visitado. Só a migração da raiz cria um embutido de um jeito que a migração da classe desse embutido também rode. Embutido criado pela migração de outro embutido fica como o script o criou. Embutido removido por uma migração acima não é recriado para migrar o que havia dentro. Devolver nulo na raiz interrompe a instalação com erro. Os scripts rodam no motor GRAAL.

Não executar leva downgrade que é o inverso do upgrade. Executar fica para normalização idempotente. Efeito fora do objeto só com `_input.validating === false`. Em interface, deixe folga na Ordem para encaixar migração nova. Se a sequência entre interface e classe concreta importa, use ordens diferentes.

## Criar tópico

O método Criar Tópico fica na listagem da classe Topic, com o feature toggle de tópicos ativo. O booleano Permitir criação só controla tópico novo. Tópico já existente continua publicando com o toggle desligado.

Campos: Nome; Identificador (alfanumérico e `_`, começando com letra, único); Ativo (já recebe publicação e processa assinatura); Permite Inscrição (aceita assinatura nova).

## Criar assinatura

O método Inscrever fica no objeto Topic. Só aparece com Permite Inscrição ligado e ao menos um tipo de evento.

Campos: Identificador (mesma regra de caracteres, único); Tipo de Evento; Classe de execução; Método de execução (chamado quando o evento é publicado).

## Cancelar assinatura

O método Desinscrever fica no objeto Topic e só aparece se houver assinatura. Cada assinatura selecionada é excluída de forma permanente.

## Operação de dependência

Exige arquivo Sybox já gerado na organização. Campos: Pacote (o exemplo é `com.exemplo`), Versão, Variação (o que a organização aceita na instalação) e Incluir Dependências no Arquivo. O artigo afirma que versões futuras só aceitam dependência que não incluiu o próprio arquivo. A operação não gera esses arquivos; eles são gerados antes.

## Agrupador de dependências

No objeto Sybox da classe Configuração, uma Configuração de Classe nova escolhe a classe e o campo de agrupamento. Campo válido: Texto, Inteiro, Referência ou Id.

## Deprecar versão

No Sybox de Instalação já instalado, o método Tornar obsoleto tira a versão das validações. Reativar devolve as restrições de dependência às instalações futuras. Sybox que não está instalado não entra nesse método.

## Reverter uma instalação

Quem tem permissão de Administrador ou de Instalador de Sybox. O Sybox de Instalação está aplicado, e a geração cabe no timeout de reversão da organização. O método Gerar Reversão cria outro Sybox de instalação, do tipo Reversão, com as operações inversas, ligado à instalação escolhida.

Com várias instalações do mesmo Sybox, reverta a mais recente. Reverter uma anterior tenta remover objeto que instalação posterior alterou. O método Validar, antes de aplicar, alerta objeto cuja data de atualização difere da data gravada na instalação original, mesmo que o conteúdo seja o mesmo. Ao aplicar, objetos são restaurados, atualizados ou removidos conforme a operação inversa, e o status do Sybox de reversão e o da instalação original passam a Revertido.

## Utilitário Creator

`_utils.sybox.Creator.withScript` recebe o script em string e devolve um builder. `run` executa e devolve SyboxScriptResult.

| Campo | Contrato |
|---|---|
| status | `"SUCCESS"` ou `"FAILED"` (houve exceção) |
| output | valor de `_output` |
| file | ApplicableFile do `.sybox` de reversão; null se não houve CRUD rastreável |
| messages | mensagens do contexto (`_utils.addInfoMessage`, `_utils.addErrorMessage` e equivalentes) |

`file.content` é o arquivo. `file.apply()` cria e instala o Sybox de reversão e devolve a referência do Sybox de Instalação. `com.sydle.one.sybox.SyboxInstall._create` com `file` em `result.file.content` só cria, para instalar depois. Sem CRUD, `file` é null e uma mensagem entra em `messages`.

`undoOnFailure(true)` aplica a reversão antes do retorno quando o status é FAILED. Em SUCCESS não faz nada. O padrão, `undoOnFailure(false)` ou o método omitido, exige `apply()` na mão.

O nome padrão é "Reversão — Execução de script". `name` aceita texto ou mapa com as chaves `pt`, `en` e `es`.

`configs` recebe callbacks em string, cada um com SyboxScriptResult em `_input`. `onSuccess` roda só em SUCCESS, `onFailure` só em FAILED, `onFinish` sempre. A ordem é o callback do status e depois `onFinish`. Erro de callback vira mensagem com prefixo `[onSuccess]`, `[onFailure]` ou `[onFinish]` e não interrompe o callback seguinte.

```javascript
const result = _utils.sybox.Creator
    .withScript(script)
    .undoOnFailure(true)
    .name({
        "pt": "Reversão mensal",
        "en": "Monthly reversion",
        "es": "Reversión mensual"
    })
    .run();
```

`apply()` instala. `_create` só grava o Sybox de instalação. O artigo usa um ou outro, e só quando `file` existe.

```javascript
if (result.status === "FAILED" && result.file) {
    result.file.apply();
}
```

```javascript
if (result.file) {
    _output = com.sydle.one.sybox.SyboxInstall._create({
        "file": result.file.content
    });
}
```

## Preview

A partir da 8.10. Método de tela no Sybox e no Sybox de Instalação. A visualização amigável percorre as operações e exige permissão de exportar Sybox. Por script, o artigo só remete a outra página; a assinatura não está aqui.

Arquivo antigo gerado com "exportar todos os objetos" pode não ter os objetos nos metadados, e o preview os omite. Exportação para versão antiga da plataforma pode mostrar só a referência, sem descrição, quando objeto ou classe ainda não existe no destino. Sybox gerado a partir da 8.35, no método Visualizar Arquivo, mostra o nome amigável no lugar de só o `_id`.

## Configuração de repositório

Exige Administrador de Repositório de Sybox.

Criar Repositório de Sybox, na listagem. Incluir Padrões traz, por padrão, todos os padrões de nome de pacote. Atualizar informações do repositório, no objeto. Configurar Repositório, no objeto: padrões de nome permitidos ou excluídos no download, e canais inscritos. Editar Credencias, no objeto (grafia do artigo): permite ou revoga acesso. Configurar Prioridade, na listagem: o primeiro da lista é o mais prioritário.

A partir da 8.40, a prioridade define a ordem de consulta dos repositórios, e a estabilidade vem antes: versão em stable ou lts de qualquer repositório é escolhida antes de versão em canal menos estável de um repositório mais prioritário.

## Download do arquivo

`generateDownloadToken`, na classe Sybox. Entrada JSON: `fileId` (id do arquivo `.sybox`, string obrigatória) e `_id` (id do Sybox, string obrigatória). Saída: string usada para montar a URL de download. Caminho de script: `com.sydle.one.sybox.Sybox.generateDownloadToken`. Caminho HTTP: `/api/1/{{identificador-da-aplicação}}/com.sydle.one.sybox/Sybox/generateDownloadToken` no host da organização. A URL de download concatena `{{url-base}}/api/1/{{identificador-da-aplicação}}/sybox-repository/get/` com essa string. O artigo não mostra um token.

```javascript
const downloadToken = com.sydle.one.sybox.Sybox.generateDownloadToken({
    "fileId": fileId,
    "_id": syboxId
});
```

## Publicar Sybox

Método de tela Publicar, no objeto Sybox, com Administrador de Repositório de Sybox. O campo Habilitar Versionamento? está verdadeiro e existe ao menos um arquivo gerado. A tela pede o repositório e qual arquivo publicar. O retorno é o artefato, com o arquivo Sybox, o arquivo de metadado e as informações do Sybox.

O mesmo artefato em outro canal só altera o campo canal. O mesmo artefato no mesmo canal não altera o arquivo. Conteúdo já publicado (script, objeto novo) pede outra versão.

## Inscrição no canal

A inscrição faz a organização receber aviso de versão nova. O administrador inscreve pelo método Configurar Repositório.

Instalar um Sybox inscreve esse Sybox em todos os repositórios da organização, no canal em que foi publicado. A dependência não entra nessa inscrição. Tirar inscrição, ou ligar atualização automática de uma dependência, é configuração manual no repositório.

## Token de repositório

O guia transfere Sybox de DEV para HOM pelo repositório. Em DEV, no repositório, o método Criar Token pede o identificador da organização de destino (pacote Sistema, classe Configuração, objeto da organização, campo Identificador da organização) e a permissão obter. O token vale 15 minutos. Em HOM, na listagem de Repositório de Sybox, o método Registrar Token passa a permitir que HOM obtenha atualização do Sybox de DEV. O artigo termina nesse efeito e não mostra o valor de nenhum token.

## Atualização com conflito

A verificação acha versão nova de um Sybox de Instalação aplicado e a tag fica "Atualização com conflito" por restrição de dependência. O método Checar atualizações lista as versões em conflito; a versão escolhida mostra o que gerou o conflito. A resolução do artigo é tornar obsoleto o Sybox que causa o conflito.
