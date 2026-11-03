# Sybox, executável e migração, parte 2 (documentação oficial)

Contrato destilado do service desk sobre o executável (coleção, lote, profiling, relatório, método, HTTP, script e testes), a migração de classe, o SYBOX (exportação, instalação, validação, reversão, dependência, canal, repositório e atualização automática) e o tópico de sistema que leva as notificações do SYBOX. O SYBOX existe para exportar e instalar solução feita na plataforma. Onde dois artigos divergem, os dois contratos ficam registrados. Assinatura que o artigo não mostra não entra.

## Executável

Entidade com tipo, formulário de entrada e formulário de saída. Campos comuns descrevem o executável e a configuração geral. Pode pertencer a uma coleção, e nesse caso herda permissões de leitura e escrita e a configuração de expurgo de relatórios.

Toda execução parte do método `run`. Roda em rascunho, antes da publicação. Executável nunca publicado continua gerando relatório, sem referência ao objeto: o relatório mostra só o nome.

## Acompanhamento de execução

Entidade de acompanhamento em tempo real da execução assíncrona. Disponível a partir da 8.19. Nasce em coleção, execução em lote ou executável de teste.

Status: Em andamento (`IN_PROGRESS`), Concluído (`FINISHED`), Concluído com erro (`FINISHED_WITH_ERROR`), Abortado (`ABORTED`). Origem: Coleção (`COLLECTION`), Execução em lote (`BATCH_EXECUTION`), Teste (`TEST`). O campo Executável aponta o gerador nos casos de coleção e de teste. Também há data de início, data de término, total de executáveis, total executado, total de falhas e relatórios relacionados.

O total é descoberto de forma assíncrona e pode mudar depois que o acompanhamento já começou, em coleção aninhada e em caso de teste. O executável de teste soma os casos encontrados e o próprio executável.

Abortar grava `ABORTED` no acompanhamento e nos relatórios que ainda não concluíram. Só é abortado o que ainda não iniciou. Script já em execução e teste já em processamento seguem.

## Coleção

Tipo de executável que roda um conjunto em sequência ou em paralelo. Disponível a partir da 8.19.

Modo Paralelo enfileira todos ao mesmo tempo, na prioridade da fila. Modo Sequencial espera o anterior terminar. Os dois geram acompanhamento, que permite abortar o pendente. Executar: Todos da coleção, ou Apenas selecionados.

A execução é assíncrona: cada executável sai de uma mensagem da fila, independente. O usuário vai para o relatório da coleção, que mostra a quantidade relacionada e o relatório de cada um. Coleção sem executável relacionado exibe erro e não roda. Coleção pode conter coleção. No momento da execução, os executáveis folha são enfileirados no modo configurado. O acompanhamento mostra encontrados, executados e com erro, e referencia os relatórios.

## Execução em lote

Executa vários executáveis em paralelo, sem coleção. Disponível a partir da 8.19. Nasce da listagem: 2 ou mais selecionados e o botão Executar. O formulário confirma quais o usuário quer executar e para quais tem permissão.

Assíncrona, uma mensagem de fila por executável. Não há entidade central para relatório. O usuário vai para o acompanhamento, que consolida os relatórios.

## Execução com profiling

Captura desempenho da execução. Disponível a partir da 8.25. Indisponível para o ES2005. O método existe no rascunho e no objeto dos executáveis de Script e de Método.

O resultado entra no relatório de saída. Árvore de chamadas: nome e localização, tempo na pilha (a função e as chamadas internas) e tempo de execução (só a própria função), mais o tempo de chamadas de sistema, inclusive banco. Perfil temporal: flamegraph e histograma; a largura do bloco é o tempo na CPU. O perfil é interativo (clique amplia), agrupa recursão e realça a busca pelo nome da função. Os tempos saem em milissegundos.

## Relatório de execução

Consolida execução de qualquer tipo. Disponível a partir da 8.19.

Campos: Nome (executável ainda não publicado), Executável, Tipo de executável, Coleção, Status, Duração (ms), Data de início, Data de finalização, Executor, Saída (embutido do formulário de resposta), Entrada (o artigo também chama de resultado da execução e, em seguida, de embutido do formulário de entrada), Mensagens (emitidas em erro), Anexos, Permissão de leitura (calculada a partir da do executável), Data de expurgo (calculada pelo campo do executável).

Status: Executando (`RUNNING`), Sucesso (`SUCCESS`), Erro (`ERROR`), Intermitente (`FLAKY`), Abortado (`ABORTED`).

## Método

Executa um método avulso, com script de pré-execução para a entrada. O formulário seleciona classe e método. O método fica somente leitura, com pré-visualização do script e das permissões. Alguns métodos de sistema são filtrados de propósito. Métodos de extensão de classe entram na lista. O pré-script acessa pacotes, classes, métodos, `_utils` e `_user`.

Na execução, o pré-script produz `_input`, e esse valor é o parâmetro do método. O método respeita o motor configurado nele. O pré-script usa o motor Graal.

A saída mostra entrada e saída do método. A entrada do formulário é o resultado do pré-script. A saída do método fica em campo script, com tempo e logs. Erro de contexto aparece em Mensagens. O relatório repete a saída e acrescenta data e tempo.

## Request HTTP

Requisição HTTP para API do SYDLE ONE ou API externa. A execução usa o mesmo mecanismo do OneWebConnector dos scripts.

Campos: Método (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`); URL; Tipo de autenticação (`Bearer`, `Basic`, `Sem autenticação`); Cabeçalhos (chave e valor, ativáveis); Parâmetros da URL (chave e valor, ativáveis, sincronizados com a URL); Tipo de corpo (`Nenhum`, `Texto`, `x-www-form-urlencoded`, `form-data`); Corpo conforme o tipo. Texto aceita JSON, Javascript, XML, HTML e Texto simples. `form-data` distingue arquivo e texto. Os dois tipos de formulário configuram os headers sozinhos. Certificado do cliente (referência para Certificado Privado, ou efetuar autenticação com certificado); Protocolo SSL (`TLS`, `SSL`); Timeout da conexão (ms); Timeout de leitura (ms); Gerar log da requisição (o artigo manda não habilitar com dado sensível); Seguir redirecionamento.

A saída traz headers, corpo, status e, se houver, cookies. Corpo arquivo é armazenado e exibido. O relatório repete a saída e acrescenta data e tempo.

## Script

Um campo: o script. Só existe `_output`. Não há `_input`. Pacotes, classes, `_utils` e `_user` estão no contexto.

Roda como o script de um método, sem `eval`. Código que funciona aqui deve funcionar no método. O executável usa Graal em toda execução. Método em Rhino pode ser incompatível com script feito no executável. Valem os mesmos limites do script de método. Script pesado pode estourar timeout; o resultado, nesse caso, só aparece no relatório.

A resposta fica no campo Resposta, em campo Script. Log, se houve, e o tempo ficam nos campos avançados. O relatório guarda fotografia do script, tempo, status e saída.

## Executável de testes

Casos de teste automatizados. O tipo está disponível a partir da 8.19. O artigo diz que parte das informações vale a partir da 8.12 e da 8.38, nos executáveis de Script e de Método, pelos campos de Casos de teste.

Formulário: Nome, Tipo (Teste), Coleção, tabela Casos de teste (Ativo, Descrição, Script) e Escopo de teste (Pacote, Classe, Método; o método pode ficar em branco quando o escopo é a classe). Vários escopos. O escopo é opcional e serve a analytics, listagem e detecção por entidade. O artigo recomenda não misturar contextos no mesmo executável. Caso inativo não roda. Os campos Gerar reversão e Limpeza automática revertem escritas do teste sem `afterAll` manual. O artigo não mostra o passo de habilitação.

O motor não é compatível por completo com Jest. O contexto de teste traz `describe`, `it`/`test`, `beforeEach`, `beforeAll`, `afterEach`, `afterAll` e `on`. Hook dentro de `describe` vale só naquele `describe`. `describe` pode aninhar e pode ter irmão. `it`/`test` não pode nascer dentro de outro teste, nem dentro de hook. `describe` não pode nascer dentro de `it`.

`on.retryTimes(number)` define quantas vezes cada teste pode rodar de novo quando um matcher falha.

Ordem: `beforeAll` uma vez; para cada teste, `beforeEach`, o teste, `afterEach`; `afterAll` uma vez. Erro não coberto por assertion (o artigo cita null pointer e stack overflow) interrompe os testes seguintes.

## Persistência de objetos e mocks

A partir da 8.22.0, mock e spy simulam persistência. Por padrão o teste não altera método nativo; o mock pode sobrescrever. O artigo exemplifica com `com.sydle.billing.Contract._create` e `_get`.

`on.fn` devolve a função encapsulada. O retorno é a API de limpeza do spy. `spy.clear()` limpa chamadas e retornos. `spy.remove()` remove o spy. `on.clearAllSpies()` limpa todos.

```javascript
const spy = on.fn(com.sydle.billing.Contract._create);
spy.mockImplementation((args) => {
    return args;
});
spy.clear();
spy.remove();
on.clearAllSpies();
```

## Matchers padrões

`expect(valor)` afirma o valor produzido. O argumento do matcher é o valor esperado. Trocar os dois ainda pode passar, com mensagem de erro confusa. O motor aceita matcher do desenvolvedor via `expect.extend`.

`toBe`: comparação estrita, inclusive referência. Serve a primitivo. Em objeto e array compara referência. `toEqual`: estrutura, ignora referência. `toBeTruthy`: o que não é `false`, `0`, `""`, `null`, `undefined` ou `NaN`; array e objeto vazios passam. `toBeFalsy`: `false`, `0`, `""`, `null`, `undefined`, `NaN`. `toHaveLength`: tamanho de array e de string. `toMatchObject`: subconjunto de propriedades. `toHaveProperty(caminho)` e `toHaveProperty(caminho, valor)`; caminho aninhado no formato `"a.b.c"`. `toContain`: presença em array, iterável ou string; o artigo diz que o comportamento é o de `===`. `toContainEqual`: comparação profunda. `toThrow()`, `toThrow(Error)` e `toThrow("mensagem")`, recebendo uma função. `toBeNull`: só `null`; `undefined` não passa.

`not` inverte o matcher e fica antes dele. Vale para matcher assimétrico, exceto `any` e `anything`. Não encadeia: o artigo veta `expect().not.not.toBeNull()`.

## Matchers adicionais

Matcher de spy, matcher assimétrico (a partir da 8.33) e matcher customizado. Assimétrico só entra como valor esperado, pelo objeto `expect`: `expect.anything()`.

Customizado: função registrada com `expect.extend`. O retorno é `{ message, pass }`, e `message` é função. Dá para sobrescrever matcher padrão pelo mesmo nome.

```javascript
function toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass === true) {
        return {
            message: () => "esperado estar dentro do intervalo",
            pass: true
        };
    }
    return {
        message: () => "esperado estar entre o piso e o teto",
        pass: false
    };
}
expect.extend({ toBeWithinRange: toBeWithinRange });
```

Spies, a partir de `on.fn`: `toHaveBeenCalled`; `toHaveBeenCalledTimes(number)`; `toHaveBeenCalledWith(...args)`; `toHaveBeenNthCalledWith(n, ...args)`; `toHaveBeenLastCalledWith(...args)`; `toHaveReturned`; `toHaveReturnedTimes(number)`; `toHaveReturnedWith(value)`; `toHaveLastReturnedWith(value)`; `toHaveNthReturnedWith(n, value)`. "Retornou" no artigo é conclusão com sucesso, não qualquer chamada.

Assimétricos: `expect.any(constructor)` só o tipo. Tipos do ONE, via `OneType.TIPO`: `I18n`, `GeoPoint`, `Reference`, `File`, `Encrypted`, `EObject`, `DenseVector`. `expect.anything()` é qualquer valor diferente de `null` e de `undefined`. `expect.arrayContaining([valores])` ignora ordem e itens extras. `expect.objectContaining({ props })` exige o subconjunto. `expect.stringContaining(str)` e `expect.stringMatching(re)` operam sobre string e não aceitam outro matcher dentro. `arrayContaining` e `objectContaining` aceitam matcher aninhado. `anything` e `any` são folha.

Assimétrico customizado também passa por `expect.extend`, com objeto que tenha `asymmetricMatch`. O artigo escreve `asymmetriMatch` numa frase e `asymmetricMatch` no código. Uso: `expect.objectIsFilled()` e `expect.not.objectIsFilled()`. Assimétrico não é simétrico, e o inverso também.

`toEqual`, `toMatchObject`, `toContainEqual` e `toHaveProperty` delegam a propriedade ao assimétrico quando encontram um. O mesmo vale para `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith`, `toHaveBeenNthCalledWith`, `toHaveReturnedWith`, `toHaveLastReturnedWith` e `toHaveNthReturnedWith`.

Numéricos, com os dois lados numéricos: `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan`, `toBeLessThanOrEqual`. Igualdade falha nos estritos e passa nos `OrEqual`. O artigo repete `toThrow` e `toBeNull` neste texto, com o mesmo contrato dos padrões. `not` vale aqui também.

## Testes parametrizados

`.each(tabela)` em `describe`, `test` ou `it`. A tabela é uma lista de listas: cada linha vira uma instância, e os valores entram nos parâmetros do callback. O título usa `%i`. `describe.each` parametriza a suíte inteira: dois testes internos e três linhas geram seis testes. `it.each` parametriza só aquele teste.

O exemplo aninhado passa uma lista plana de números para `describe.each`, e dentro usa `it.each` com lista de listas. `only` e `skip` valem com `.each` e atingem todos os testes gerados. O artigo mostra `describe.only.each`.

## Cobertura

Disponível a partir da 8.30. O formulário é o de testes, com o campo Cobertura de testes. A execução é a do executável de testes e gera o relatório de cobertura. Coleção que possua executáveis também gera relatório de cobertura.

No relatório de testes, a referência Cobertura de testes abre o relatório. Campos: Status (produção da cobertura), Resumo, Detalhamento. No detalhe: Script (nome do método), Linhas encontradas (código executável, sem linha em branco, comentário e fechamento de bloco), Linhas executadas, Cobertura (%) (razão arredondada). Cada item abre trechos. O texto da linha segue `"Script.NÚMERO / LinhasI-LinhaF"`, com o índice do script no método. Trecho coberto não significa que todas as linhas internas rodaram.

## Migração de classe

A Configuração de migração versiona o formato dos objetos da classe. Cada migração tem Script de upgrade e Script de downgrade. A instalação do SYBOX usa isso no objeto que o arquivo carrega, na leitura, antes de gravar.

A classe aponta para um objeto Configuração de migração, com a Classe da migração e a lista de Migrações. Campos da migração: Identificador (único na configuração); Se a migração já existir no destino (`Não executar` ou `Executar`); Ordem (inteiro, só quando a classe da migração é interface); Script de upgrade; Script de downgrade (só para `Não executar`); Alias (identificadores que esta substitui).

Ao salvar: a classe da migração está desprotegida; identificadores únicos; alias não colide com identificador da mesma configuração; `Executar` não tem downgrade; em interface, Ordem única. Selecionar `Executar` esconde o downgrade e descarta o valor.

Ordem em classe padrão: o campo não aparece; a ordem é a posição na lista. Em interface: preenchimento manual, único; em branco recebe a primeira ordem livre a partir de 10, de 10 em 10; a lista é gravada ordenada por Ordem. Migrações de interface rodam junto com as das outras interfaces da classe.

Objeto comum usa as migrações da própria classe. Objeto de classe (a modelagem) usa as migrações das interfaces que a classe implementa. Interface não tem armazenamento e não é migrada: quem migra é a classe `STANDARD` que a implementa. Para versionar o schema, a configuração fica na interface. Migração de interface não se aplica a classe que, na versão do SYBOX, não implementa essa interface. A autoridade do schema é o objeto de classe trazido pelo arquivo.

O que a instalação executa, comparando origem e destino:

| Situação | Executa |
|---|---|
| `Não executar` nos dois lados | Nada |
| `Não executar` só na origem | Downgrade |
| `Não executar` só no destino | Upgrade |
| `Executar` presente no destino | Upgrade, sempre |

Primeiro todos os downgrades, da maior ordem para a menor; depois todos os upgrades, da menor para a maior. Se o SYBOX leva a configuração de um objeto que já existe no destino, só `Executar` roda: `Não executar` passa a existir nos dois lados.

Empate de Ordem só entre configurações diferentes. Desempate: interface antes da classe concreta; entre interfaces, a alterada há mais tempo (data da última alteração). O artigo pede que o autor defina a ordem em vez de depender do desempate.

`Executar` aplica o upgrade em toda instalação em que a migração exista no destino, mesmo com o identificador na origem, mesmo coberta por squash, e nunca contribui downgrade.

Alias no squash: identificador coberto conta como presente, então a migração consolidada não reexecuta. `Executar` ignora essa cobertura.

Na leitura de cada objeto, a migração de classe é a última etapa: 1 normalização (objeto protegido, Não sobrescrever, campos de sistema); 2 configuração de campos; 5 migração de classe. O número 5 é o que o artigo numera; não há etapas 3 e 4 nesse texto. A configuração de campos já alterou o valor que a migração recebe. Objeto que a normalização decide não sobrescrever sai do fluxo e não chega à migração.

O mesmo script roda na validação e na instalação. `_input.validating === true` é validação; `false` é instalação. Transformar o objeto recebido é seguro nas duas: o resultado da validação é descartado. CRUD em outro objeto roda duas vezes. A validação também roda quando a instalação não acontece. O artigo mostra a guarda e, nas recomendações, a comparação estrita:

```javascript
if (_input.validating === false) {
}
```

Escopo: o script recebe o objeto posicionado no caminho do valor. Depois do raiz, percorre embutidos que existam nesse resultado e cuja classe tenha migração; não repete o percurso. Embutido ausente ou nulo não é visitado. Só a migração do raiz cria embutido de um jeito que a migração da classe desse embutido também rode. Embutido criado pela migração de outro embutido fica como o script o criou. Embutido removido por algo acima dele não tem a migração interna aplicada. Devolver nulo para o raiz interrompe a instalação com erro. O motor é GRAAL.

Recomendações do artigo: downgrade de `Não executar` como inverso do upgrade; `Executar` só para normalização idempotente; em classe padrão, reordenar é reordenar a lista; em interface, deixar folga na Ordem.

## Exportação

Fase em que se escolhe objeto, dependência e o comportamento na instalação. Criar exige Administrador, Modelador de classe ou Exportador de Sybox.

Campos: Nome (obrigatório); Pacote (opcional; ao preencher, Versão aparece); Versão; Operações (obrigatório, múltiplo); Notas de Versão. A ordem das operações entra na validação: operação que depende de outra vem depois.

Configurações adicionais, a partir da 8.31. Tipo Reversão, os dois scripts obrigatórios: Script de pré reversão e Script de pós reversão. Na geração da reversão, cada um vira operação `SCRIPT` com o nome "Ações de reversão pré definidas pelo dono do SYBOX": o pré entra como primeira operação, o pós como última, mesmo se a instalação original foi parcial.

Operação de objetos. Recálculo de dependências: Automática, ou Manual (com dependência desatualizada, o botão Recalcular é obrigatório). Objetos a Exportar. Dependências, calculadas. Configurações de campos, opcional.

Por classe, uma configuração por operação: Classe do objeto; Modo de Seleção (`Todos`, `Individual`, `Avançado`); Objetos (no Individual); Filtro (no Avançado); Proteger; Incluir dependências; Bloquear sobreescrita; Configurações específicas. Avançado só considera classe buscável. Sem filtro, o artigo diz que o sistema assume `match_all` dos objetos buscáveis, nas permissões do usuário. `Todos` pega todos os objetos, buscável ou não. A exportação, em qualquer modo, depende da permissão `_get`. Configuração específica do objeto substitui a geral da classe, com ou sem filtro.

Dependência da classe, quando Incluir dependências é verdadeiro: Classe da dependência, Ignorar, Remover protegidos, Proteger, Bloquear sobreescrita, e a lista Dependências. Cada dependência repete Ignorar, Remover protegidos, Proteger e Bloquear sobreescrita. Agrupada, a partir da 8.21, tem Grupo e a lista interna. Não agrupada tem o campo Dependência.

Operação de script: campo múltiplo de scripts. Há seleção de motor. Mensagem e log vão para o detalhe da instalação. O contexto é a operação: `_object` é a operação. `_input` e `_output` não existem.

Operação de dependência, no texto da exportação: Pacote e Versão são texto livre (a versão não precisa existir na organização); Variação; Tipo de criação. Automática é o padrão: o sistema busca e cria. Manual não cria sozinho; se a versão no destino não satisfaz a variação, a instalação para e pede criação manual no intervalo. Se B é Manual, A que depende de B também não pode ser criado automaticamente, e isso sobe a árvore.

Auto-dependência: o pacote depende dele mesmo, com outra restrição de versão. Só é criada automaticamente se já existir na organização um SYBOX do mesmo pacote aplicado e com versão menor. Regras: é a primeira operação; a versão do próprio SYBOX não é menor que o intervalo; a versão do próprio SYBOX não está contida no range.

| Situação da auto-dependência | Comportamento |
|---|---|
| Versão instalada satisfaz o intervalo | Resolvida |
| Versão instalada é maior que o intervalo | Não atendida, e a instalação do pai segue |
| Versão mais nova na organização satisfaz o intervalo | Essa versão é instalada antes |
| Nenhuma versão satisfaz | Resolução pelo repositório |

Prefixos que o artigo tabela: `^` aceita minor e patch (`^1.2.3` é `>=1.2.3 <2.0.0`); `~` só patch (`~1.2.3` é `>=1.2.3 <1.3.0`); `*` é `>=0.0.0`; versão sem operador é exata; intervalo explícito, como `>=1.2.0 <2.0.0`.

Operação de deleção existe só para uso interno. Não se cria nem se exporta arquivo com operação de deleção.

Operação de migração, no texto da exportação, a partir da 8.38. Transforma objeto que já existe no destino. Não leva objeto no arquivo. Não é a operação de script: o fluxo carrega os objetos e persiste a alteração. Campos: Identificador (obrigatório, único no SYBOX; repetido, o save é reprovado); Classe da migração (só classe padrão desprotegida; interface não); Script (em lote, sobre `_objects`; o artigo não espera CRUD, porque a persistência é do fluxo); Script de compatibilidade (opcional, para plataforma anterior à 8.38; vira operação de script e não recebe contexto); Ignorar migração se a classe não existir; Executar scripts (`true` dispara `_save` e `_getMetadata`; `false` não dispara nenhum). `_input` e `_output` não existem. `_objects` e campos de sistema (`_id`, `_class`, `_creationDate` e os demais) são somente leitura; alterá-los interrompe a instalação.

Entram no lote só os objetos que existem no destino na hora da operação. Objeto levado por operação posterior, ou criado depois, fica de fora. Objeto protegido no destino é migrado e continua protegido. A classe desprotegida é exigência da origem, na autoria. Interface: uma operação por classe padrão que a implementa. A geração falha com a mensagem "Classes do tipo interface não permitem configurar operações de migração". Classe protegida na origem impede gerar o arquivo. Classe que o SYBOX não leva, com ignorar desmarcado, gera aviso.

CRUD no script é interceptado para o UNDO e não tem tratamento de erro da migração. Apagar e alterar o objeto do lote: a instalação falha ao persistir objeto que não existe mais; a exclusão já ocorreu e não é desfeita; o registro fica Erro e a migração roda de novo na instalação seguinte. Apagar sem alterar: conclui, e o objeto permanece apagado.

O identificador marca execução única no Registro de migrações do SYBOX do pacote. Aplicada: ignorada. Erro: roda de novo e acumula histórico. Sem registro: roda e cria o registro. Reverter a instalação remove a entrada. Ignorar porque a classe não existe: não executa e, ainda assim, grava status Aplicado.

Para plataforma anterior à 8.38: com script de compatibilidade, vira operação de script; sem ele, a operação não é exportada e há aviso; SYBOX só de migrações e nenhuma com compatibilidade faz a geração falhar. A ordem é manual. O artigo manda colocá-la depois da operação que instala a classe nova. Antes disso, escreve em campo inexistente ou reprova a validação, e a instalação para.

Gerar arquivo tem as permissões de criar. A quantidade de objetos decide síncrono ou assíncrono. Ao fim, preenche Versão da Plataforma e Data de geração. Pode sair com Mensagens do sistema. Enquanto a geração assíncrona não termina, com sucesso ou erro, gerar de novo não está disponível.

Atualizar Informações, mesmas permissões de Gerar Arquivo, síncrono. Antes, confirmar Nome, Pacote, Versão e Versionado. Não altera script nem objeto exportado, nem a data de geração.

Remover Arquivos, mesmas permissões de Criar. Remove um ou mais arquivos e Versão da Plataforma, data e o arquivo. Irreversível.

Gerar por script, como o artigo escreve:

```javascript
com.sydle.one.sybox.Sybox.generate({
    "_id": "syboxObjectId",
    "targetVersion": "systemVersion"
});
```

O comentário do artigo descreve `targetVersion` como versão do sistema, com exemplo `"8.3"` e `"8.4"`. Campo criptografado pode ser exportado a partir da versão 8.0. O artigo não detalha o formato.

## Configuração de campos

Manipulação de campo, inclusive embutido, aplicada na instalação. A partir da 8.25 dá para configurar por objeto, não só pela classe.

Campos: Classe; Modo de seleção (`Todos`, padrão, ou `Por objeto`); Objetos (obrigatório no modo por objeto, ou então uma configuração específica); Campos; Configurações específicas (substituem, naquele objeto, os mesmos campos da configuração geral).

Por campo: Campo; Exportar (`Valor do objeto` mantém; `Valor fixo` grava o valor no contexto da exportação); Na atualização (`Manter destino`, `Sobrescrever`, `Sobrescrever se destino for nulo`); Ignorar dependência (só referência; o recálculo ignora a dependência desse campo); Valor fixo (quando Exportar é Valor fixo).

O bloco Comportamentos chama o segundo eixo de "Na instalação", com as grafias Sobreescrever e Sobreescrever se for nulo. Valor fixo é atribuído na exportação; na instalação, Sobrescrever prevalece o exportado, Manter destino preserva objeto já existente, e Sobrescrever se nulo só grava se o destino estiver nulo.

Configuração de campos no objeto de Configuração do SYBOX da organização, para a mesma classe e os mesmos objetos, perde para a configuração do SYBOX.

## Instalação

A partir de um arquivo `.sybox`. Criar exige Administrador, Modelador de classes ou Importador de SYBOX, no objeto SYBOX de Instalação. Ao salvar, carrega Nome, Versão, Observações, Operações (tipo, rótulo, SYBOX de Origem quando veio de dependência, detalhe com classes, configurações e quantidade), Registro de alteração, Arquivo, Instalações (início, responsável, término, status e log por operação) e Versão do Sistema com a qual o arquivo foi gerado.

A instalação é sempre assíncrona, em três etapas: validação (falhou, o arquivo não é carregado e não instala; a ordem das operações entra nessa etapa); upload dos arquivos; instalação (cria ou atualiza, e executa script).

Status do detalhe: Não Aplicado, Validado, Erro de validação, Aplicando, Aplicado, Erro.

O método de tela Instalar inicia ou agenda. Agendado guarda a referência do agendamento. Alterar agendamento muda a data, instala na hora ou cancela.

Operação de objetos: a validação confere classe e objeto no destino ou no próprio SYBOX. Aplicado escreve quantos foram criados e atualizados. Erro traz as mensagens.

Operação de script: a validação confere `require` e classes e pacotes dos métodos, no destino ou no SYBOX. Não há garantia de indexação dos objetos criados pela exportação na hora do script; o artigo cita `_search` como caso que quebra. A saída grava Mensagens de Execução (info, warning, error e log) e Log (arquivo).

Operação de migração, neste artigo, a partir da 8.36. Age sobre o que já está no destino, com registro de execução única. A validação exige a classe no destino ou numa operação anterior, salvo Ignorar migração se a classe não existir, que aprova sempre. O Registro de migrações do SYBOX é por pacote, ou pelo id do SYBOX de Instalação quando não há pacote. A chave é o Identificador. Aplicado: ignora, com mensagem informativa. Erro: executa de novo e acrescenta histórico. Sem entrada: executa e cria. Cada entrada guarda identificador, status da última execução, histórico, o SYBOX de Instalação que disparou, o identificador da instalação e os logs. Reverter remove a entrada. Script com sucesso e falha ao gravar o registro: a operação fica Erro, e o artigo manda Recuperar instalação a partir dessa operação. Classe ausente com ignorar: não executa e grava Aplicado.

O script recebe os objetos do destino. Protegido é alterado e permanece protegido. Persiste só o objeto alterado. Conta como alteração atribuir campo ou mudar lista de embutidos (`push`, `splice`, índice, campo do elemento). Campo de sistema não pode ser alterado. Executar scripts desmarcado: `_save` e `_getMetadata` não disparam; a validação de plataforma vale nos dois casos. Indexação é assíncrona. Classe sem objeto conclui com sucesso e a mensagem de que nada foi feito. Saída: Mensagens de Execução e Log (objetos atualizados, eventos e mensagens).

Campo dinâmico: o tipo vem do metadata, não do valor atribuído. Com `_getMetadata` definindo o tipo, Executar scripts precisa estar marcado. Sem isso, ou sem tipo para o valor novo, o campo mantém o tipo anterior, e valor que não cabe não é gravado. O exemplo do artigo: campo que guardava `true` (Booleano) recebe texto e termina sem valor.

O primeiro erro de script ou de atualização de objeto encerra a operação, não processa o resto e aborta a instalação. Com arquivo de UNDO, a reversão restaura pela pré-imagem. O que já migrou fica no log, e o registro fica Erro, para a próxima instalação executar de novo.

Solicitar reexecução, no Registro de migrações, lista só status Aplicado. Cada selecionada vai para Reexecução solicitada, com histórico de quem pediu e quando; o histórico anterior permanece. A execução é na próxima instalação, não na hora. Cancelar solicitação de reexecução grava Solicitação de reexecução cancelada e devolve Aplicado. Status no registro: Aplicado (ignorada depois), Erro (reexecuta sozinha; não há por que solicitar), Reexecução solicitada, Solicitação de reexecução cancelada (só no histórico).

Depois de erro, Aplicar some e entra Recuperar instalação, a partir da operação que falhou ou de uma anterior. O resultado volta por notificação.

Criar e instalar por script, como o artigo escreve. Na instalação por arquivo, carrega e já instala.

```javascript
const arquivo = _ecm._file.getFileByPath({ "path": "mySybox.sybox" });
if (arquivo !== null) {
    com.sydle.one.sybox.SyboxInstall._create({
        "file": arquivo.content
    });
}
com.sydle.one.sybox.SyboxInstall.install({ "_id": "mySyboxID" });
com.sydle.one.sybox.SyboxInstall.install({ "file": arquivo.content });
```

## Reversão de SYBOX

Desfaz as operações da instalação. O SYBOX de reversão só instala se o original for elegível. SYBOX versionado que não é a última versão aplicada na organização não instala, e a reversão dele também não. Recuperar instalação não existe em SYBOX de reversão. Se a reversão não ficar Aplicado, o artigo recomenda reverter a instalação com erro antes de tentar de novo.

Arquivo UNDO. Estratégia em disco: o arquivo é associado antes de a instalação retornar concluída. Estratégia Mongo, padrão: a montagem é em segundo plano, depois da conclusão; o campo fica vazio nesse intervalo, e quem depende dele consulta de novo. Sucesso atualiza a notificação com a instrução de reversão. Falha gera notificação avulsa; reprocessar a instalação pede a geração de novo. Pedir reversão com geração em andamento, ou com falha, devolve aviso. Dependência cujo arquivo ainda gera não é revertida, e o resultado traz o aviso.

Script com CRUD vira, na reversão, operação Ações em Lote: as ações inversas, na ordem contrária.

Dependência não é revertida automaticamente. Surge operação de reversão de dependência só se a instalação original tiver instalado essa dependência. O restante é manual, na ordem inversa. No SYBOX de reversão, Configuração de dependência escolhe o que forçar. Observações: Instalação já revertida; Não gerou arquivo de reversão; Reversão recomendada (a instalação da dependência não foi a primeira ação do original).

O tempo máximo para gerar a reversão fica na organização hospedada. O padrão é 30 dias depois da instalação. Depois do prazo, aquela instalação não gera mais reversão.

Fila: mensagem ainda não executada é removida pela reversão. Mensagem já executada não tem o efeito desfeito; a reversão só conhece o agendamento. Efeito de mensagem processada é tratamento manual.

Falha ao aplicar a reversão: a reversão fica Erro, e o original fica Erro ao reverter. Erro na reversão não significa que nada mudou. O artigo recomenda, quando possível, reverter a própria reversão para voltar ao estado em que o original estava aplicado.

## Validação

Antes da instalação, confere integridade dos objetos, unicidade, presença do que os scripts precisam e restrição de dependência. Falhou, não instala.

`SyboxInstall.validate` recebe o `_id` do SYBOX de Instalação e devolve `SyboxFailure` se houver erro. Há método de tela em destaque na classe.

```javascript
_output = com.sydle.one.sybox.SyboxInstall.validate({
    "_id": idSyboxInstalacao
});
```

`SyboxFailure`: `syboxId` (string), `errors` (`OperationFailure[]`). `OperationFailure`: `operationId`, `type` (`OBJECT`, `SCRIPT`, `DEPENDENCY`), `name`, `errors` (`Failure[]`).

`ObjectFailure`: `_id`, `_classId`, `errors`. O artigo nomeia, sem tabela de campos: `FieldNotFoundFailure`, `InvalidReferenceFailure`, `ProtectedFailure`, `ReferenceNotFoundFailure`, `UniqueFieldFailure`, `UnprotectedFailure`, `WrongInterfaceImplementationFailure`. O exemplo de `REFERENCE_NOT_FOUND` traz `object` (`_id`, `_classId`), `reference` (`_id`, `_classId`), `type` e `field` (lista de caminhos). `ScriptFailure` e `DependencyFailure`: `errors` como `String[]`. `UnexpectedErrorFailure`: `type` igual a `UNEXPECTED_ERROR`, `message`. Todo erro desses implementa `toString()`.

Arquivo: unicidade do nome dentro do diretório. Para trocar um arquivo de mesmo nome e diretório, a primeira operação renomeia o existente e a seguinte cria o novo. Objetos da mesma operação instalam sem ordem garantida. A validação olha os objetos da operação atual e das anteriores, sem essa sequência; erro de ordem pode passar na validação e estourar na instalação.

## Mensagens do sistema

A partir da 8.18, a geração do arquivo pode gravar alertas no campo Mensagens do sistema. Arquivo gerado com alerta dispara notificação; o clique abre o SYBOX nesse campo.

## Utilitários SyboxRepoConfigs

Métodos de script para o arquivo cuja propriedade "Permitir atualização automática?" é verdadeira. As assinaturas abaixo são as linhas do artigo. O artigo de configurações de repositório escreve o mesmo grupo com o prefixo `_utils.com.sydle.one.sybox.SyboxRepoConfigs`.

`disableVersioning(file)` exige SYBOX versionado. Remove as propriedades de versionamento e de obtenção de atualização. Devolve o `File` alterado.

`enableVersioning(file, configs)` exige SYBOX não versionado. `update(file, configs)` exige versionado. Os dois devolvem o `File`. `configs` é objeto. O artigo marca como obrigatórios: `updateCheckUrl` (string), `updateCheckHeaders` (object), `updateDownloadUrl` (string), `updateDownloadHeaders` (object), `systemVersion` (string), `updateMessage` (I18n), `package` (string), `version` (string), `syboxKey` (string), `getDependencyUrl` (string).

`getVersioningInfo(file)` devolve `updateCheckUrl`, `updateCheckHeaders`, `updateDownloadUrl`, `updateDownloadHeaders`, `platformVersion`, `updateMessage`, `syboxPackage`, `syboxVersion`, `syboxName`, `versioned`. A descrição do parâmetro diz "ID do Sybox de Instalação" e o tipo diz `File`.

`com.sydle.one.sybox.Sybox.getVersions(package, systemVersions, range)` lista versões da organização no intervalo. O SYBOX precisa estar versionado. Os três parâmetros são string obrigatória, na linha de assinatura.

`getCompletedMetadata(file)` devolve o `File` JSON do metadata.

`insertChannel(file, channel)` devolve o `File` com o canal inserido. `channel` é string.

`getAvailaibleVersion()`, grafia do artigo. A linha de assinatura não tem parâmetro. A tabela tem `systemVersion` string opcional; omitido, vale a versão do sistema em que o método rodou. Saída: lista de versões de plataforma compatíveis.

`checkUpdate(_id)`, `_id` string do SYBOX de instalação. Neste artigo a saída é `avaliableArtifacts` (channel e version) e `avaliableVersionsNotSatisfied` (ranges e version em conflito).

I18n, como o artigo escreve:

```javascript
_system._translation.toI18n({
    "pt": "Valor em PT",
    "en": "Valor em EN",
    "es": "Valor em ES"
});
```

## Utilitários do repositório de SYBOX

Repete o grupo acima, com as mesmas regras de versionado e não versionado e a mesma descrição contraditória de `getVersioningInfo` (id na descrição, `File` no tipo). A diferença de contrato está em `checkUpdate`: aqui os campos se chamam `availableArtifacts` e `availableVersionsNotSatisfied`.

## Criação dinâmica de SYBOX de reversão

`_utils.sybox.Creator` roda JavaScript num contexto isolado, intercepta CRUD e produz `.sybox` do tipo UNDO.

Cadeia: `withScript(script)` (string; devolve o Creator); `undoOnFailure(booleano)` (`false` é o padrão; `true` chama `apply()` no arquivo se o status for `FAILED` e houver arquivo; sem CRUD, `file` é nulo e a aplicação automática é ignorada); `name(string ou objeto de idiomas)`; `configs(objeto)`; `run()`.

`name` string usa o idioma atual. Objeto é mapa (`pt`, `en`, `es` no exemplo). Omitido, o nome é "Reversão — Execução de script".

Callbacks de `configs`: `onSuccess`, `onFailure`, `onFinish`, tipo string no artigo. Recebem o `SyboxScriptResult` serializado em `_input`. Erro de callback entra em `messages` com o prefixo da chave e não corta os outros. Chave desconhecida ou valor nulo é ignorada. `run` lança `SyboxValidationException` se o script for nulo ou vazio, ou se já houver Creator em andamento.

`SyboxScriptResult`: `status` (`SUCCESS` ou `FAILED`); `output` (o `_output` do script, ausente ou nulo na falha); `file` (`ApplicableFile`, nulo se nada foi interceptado); `messages`.

`ApplicableFile.content` é o `File`, para `_ecm` ou para criar `SyboxInstall`. `apply()` cria o SYBOX de Instalação do tipo Reversão, instala e devolve a referência. `apply()` repetido reusa o SYBOX criado na primeira chamada e só repete a instalação.

```javascript
_output = com.sydle.one.sybox.SyboxInstall._create({
    "file": result.file.content
});
```

Metadado Informações da reversão: `source` = `SCRIPT_EXECUTION`; `sourceScript` é o código passado a `withScript`, visível só para Auditor de SYBOX, no método Visualizar origem da reversão. `source` também pode ser `SYBOX_INSTALL` (reversão de instalação padrão). Reversão antiga sem o campo é tratada como `SYBOX_INSTALL`.

Interceptação: create, update e delete, na ordem de execução; a reversão aplica o inverso. Operação depois de um `throw` não entra; a anterior entra. Sem CRUD, `file` é nulo e `messages` ganha aviso.

Limites do artigo: não captura chamada externa (o exemplo é WebTarget); mensagem de fila já processada não é afetada; valem as classes irreversíveis do mecanismo padrão (classe de sistema, log, mensagem de indexação); callback não gera outro arquivo de reversão; SYBOX instalado pelo script principal não é revertido pelo `apply()` do Creator; Creator aninhado, inclusive a partir de callback, lança `SyboxValidationException`. Chamada sequencial, fora do aninhamento, é permitida.

## Configuração do repositório

No objeto Repositório de SYBOX, Configurações de Repositório tem Regras de download e Canais Inscritos.

Regras de download: Incluir padrões e Excluir padrões funcionam como regex. Incluir pacotes nasce `*`. Excluir pacotes nasce nulo. O artigo mostra `com.sydle.one` com incluir `*` e excluir nulo ou `com` como incluído; excluir `com.*` exclui; `com.sydle` com incluir `com` é excluído; `com.sydle.workspace` com incluir `com.sydle.*` e excluir `com.sydle.workspace` é excluído.

Canais Inscritos: par pacote/canal. Pacote é regex. Canal referencia a classe Canal. A partir da 8.40, a inscrição restringe o canal em que o OSM aceita o pacote como dependência: naquele repositório, valem os canais aceitos ao mesmo tempo pela inscrição e pelo pacote que declara a dependência.

Estabilidade, do mais estável ao menos: Long Term Support (LTS) 5, Stable 4, Release Candidate (rc) 3, Beta 2, Alpha 1, Snapshot 0. Inscrição num canal menos estável faz a busca de atualização partir desse nível e poder incluir canal mais estável. O exemplo `com.sydle.one / beta` não busca `com.teste / stable` nem deixa `com.* / stable` aceitar `com.sydle / beta`; aceita o mesmo pacote em beta e em stable.

Política por canal: Somente atualizações de segurança (versão marcada como atualização de segurança), ou Permitir qualquer atualização elegível (sem breaking change, e com os outros critérios de compatibilidade).

## Notificações

Os fluxos publicam no tópico de sistema `SYBOX_NOTIFICATIONS`. Só a plataforma publica. O tópico não aceita assinatura nova. O assinante monta a mensagem e cria ou atualiza a notificação. Falha ao publicar não interrompe o fluxo; o log usa o marker `NOTIFICATION_TOPIC`.

| Tipo | Quando | Assinante em SyboxNotifications |
|---|---|---|
| `CREATE_SYBOX_INSTALL` | Carga do arquivo e instalação automática | `notifySyboxInstallCreation` |
| `INSTALLATION` | Instalação local e remota | `notifyInstallation` |
| `UPDATE` | Busca de atualização e aviso de versão | `notifyUpdate` |
| `EXPORT` | Exportação, regeração de arquivo e publicação | `notifyExport` |

Campos comuns em `data`; nulo não é enviado: `identifier` (correlação; sem ele, cada evento é notificação isolada), `status` (`NEW`, `UPDATE`, `FINALIZE_WITH_SUCCESS`, `FINALIZE_WITH_ERROR`), `code`, `user` (omitido, vale o usuário do contexto), `critical`.

Atributos extras: `CREATE_SYBOX_INSTALL` leva `syboxInstall`, `syboxName`, `syboxVersion`, `securityUpdate`, `parentId`, `hasUpdate`, `currentOperation`, `details`. `INSTALLATION` leva `syboxInstall`, `totalSteps`, `completedSteps`, `currentOperation`, `syboxTargetVersion`, `organizationId`, `hasGeneratedUndo`, `details`. `UPDATE` leva `syboxInstall`, `syboxName`, `syboxVersion`, `syboxTargetVersion`, `securityUpdate`, `breakingChange`, `subject`. `EXPORT` leva `sybox`, `syboxTargetVersion`, `hasWarnings`, `fileName`, `fileId`, `details`. Em erro de instalação, `details` tem `unit` e `localizedErrors`. Nos outros fluxos, `details` é o detalhe do erro.

Códigos de `CREATE_SYBOX_INSTALL`: sem código e `NEW` no início; `LOADING_SYBOX_INSTALL_FILE` em `UPDATE` a cada arquivo; sem código em `FINALIZE_WITH_SUCCESS` ou `FINALIZE_WITH_ERROR`; `ERROR_ON_CREATE_SYBOX_INSTALL` em `FINALIZE_WITH_ERROR`; `AUTOMATIC_INSTALL_WITH_SUCCESS`, `AUTOMATIC_INSTALL_WITH_ERROR` e `AUTOMATIC_INSTALL_CREATION_ERROR`, os três em `NEW`.

Códigos de `INSTALLATION`: sem código `NEW` no início; `WAITING_INSTALLATION` `NEW`; `ONE_VERSION_VALIDATION`, `SYBOX_VERSION_VALIDATION`, `POPULATING_SYBOX_CACHE`, `UPLOADING_FILES`, `OPERATION_VALIDATION`, `VALIDATING_SYBOX_INSTALL` e `OPERATION_INSTALLATION` em `UPDATE`; sem código em `FINALIZE_WITH_SUCCESS`; `SYBOX_REMOTE_INSTALLED` e `SYBOX_REMOTE_INSTALL_ERROR` em `NEW`; `ERROR_SIMULTANEOUS_IMPORT` em `FINALIZE_WITH_ERROR`; `ERROR_SUBSCRIBING_CHANNEL` em `NEW`. No erro, `code` recebe o status de erro do SYBOX de instalação (o exemplo é `ERROR_VALIDATION`) e `details.unit` é `VALIDATION_ERROR`, `ERROR_INSTALLING_SYBOX` ou `ERROR_INSTALLING_OPERATION`.

Códigos de `UPDATE`: sem código `NEW` no início; `SEARCH_UPDATE_BY_REPOSITORY`, `SEARCH_UPDATE_BY_API`, `SEARCH_UPDATE_WITH_CONFLICT`, `CHECKING_FOR_CONFLICTS` e `FIND_UPDATE` em `UPDATE`; `UPDATE_NOT_FOUND` em `FINALIZE_WITH_SUCCESS`; `NEW_VERSION_AVAILABLE`, `NEW_VERSION_AVAILABLE_CONFLICT` e `NEW_VERSION_AVAILABLE_CUSTOM` em `NEW` (`subject` na customizada); `FIND_UPDATE_WITH_CONFLICT`, `FIND_UPDATE_CANT_BE_OBTAINED` e `ERROR_OCCURRED_WHILE_TRYING_GET_UPDATE` em `FINALIZE_WITH_ERROR`.

Códigos de `EXPORT`: sem código no início (`NEW`), no sucesso (`FINALIZE_WITH_SUCCESS`, e `hasWarnings` indica alerta) e na falha (`FINALIZE_WITH_ERROR`). Em `NEW`: `SYBOX_UPDATED_FILES_METADATA`, `WARNING_NOT_POSSIBLE_TO_EXPORT_SELF_DEPENDENCY`, `REPOSITORY_PUBLISHED`, `FILE_OF_THE_SYBOX_NOT_FOUND`, `ERROR_PATCH_UPDATING_SYBOX_INFOS`, `ERROR_SCHEDULING_FILES_UPDATE`.

O status escolhe a mensagem. Abrir ou atualizar a notificação não depende dele. Aviso sem evento de início sai como `NEW`, e o desfecho está no `code`.

Consolidação: mesmo `identifier` atualiza a mesma notificação. Sem notificação para atualizar, qualquer status abre uma nova. `sequence` do payload ordena; evento com ordem menor ou igual à registrada é descartado, inclusive o crítico. O contador é por tópico e tipo de evento. Notificação limpa pelo usuário fica no banco sem destinatário até o expurgo, e o fluxo seguinte é ignorado; só evento crítico traz o card de volta. `critical` mostra toast e atravessa a limpeza; não autoriza abrir a notificação nem fura a ordem.

## Configuração de API

Métodos recebem JSON. URL no formato do artigo, com identificador da organização, da aplicação, do pacote, da classe e do método. Por script: identificador do pacote, da classe e do método. Quem chama pertence aos grupos configurados no método. O artigo não lista esses grupos.

Classe SYBOX.

Gerar arquivo: `targetVersion` string opcional, `MAJOR.MINOR` (`8.4`, `8.3`, `8.2`); omitida, vale a versão da organização. `_id` string obrigatório. Síncrono ou assíncrono conforme as operações. Saída: referência a `File`, ou JSON vazio se assíncrono. O artigo de exportação mostra a chamada `Sybox.generate` com os dois campos.

Excluir arquivos, síncrono: `archives` (array de ids) e `_id`, ambos obrigatórios. Saída: JSON com os nomes excluídos.

Checar atualização, com "Permitir atualização automática?" verdadeiro: `syboxKey` e `systemVersion`, strings obrigatórias. Saída: `updateAvailable` (boolean), `syboxKey` (string), `dependencies` (lista de `package`, `version` e `dependencies` aninhadas no mesmo formato).

Obter atualização, nesta classe: só `systemVersion` string obrigatória. Saída: `File`, ou nulo se o arquivo não existe.

Obter dependência. A linha de assinatura é `com.sydle.one.sybox.Sybox.getDependency(parentKey, systemVersion, dependency, dependency.package, dependency.version)`. JSON: `parentKey`, `systemVersion`, `dependency`, `dependency.package`, `dependency.version`, todos obrigatórios. Sucesso devolve o arquivo da versão de sistema pedida, ou da mais atual encontrada. Senão, nulo.

Classe SYBOX de Instalação.

Instalar: `_id` string obrigatório. Assíncrono, gera objeto da classe Execução de Métodos. Saída: JSON vazio. A notificação avisa o fim. O artigo de instalação também mostra `install` por arquivo; esta tabela da API só documenta `_id`.

Obter atualização, nesta classe: `_id` obrigatório, e o SYBOX de Instalação precisa permitir atualização automática. Saída: o SYBOX de Instalação criado com o arquivo obtido.

`com.sydle.one.sybox.SyboxInstall.preview(file, operationsFilter, showAllObjects)`. `file` obrigatório. `operationsFilter` é lista de ids; omitida ou vazia, entram todas as operações. `showAllObjects` boolean; quando não é `true`, a página padrão tem 100 objetos por classe. Saída: operações, objetos e metadados do arquivo.

`com.sydle.one.sybox.Sybox.preview(package, version, systemVersions, showAllObjects)`, por script. `showAllObjects` existe a partir da 8.10, com a mesma regra dos 100 objetos. Entrada obrigatória: `package` (string), `systemVersions` (`strings[]`), `version` (string). Saída nomeada: `package`, `includeFile` (boolean; arquivo de dependência incluso), `changelog`, `range`, `version`, `systemVersion`, `variation` (variação legada), `operations`, `versions`, `name`, `repositoryConfigs`, `id`, `api`.

## Configurações de repositório no arquivo

O ONE gera as URLs de atualização. Dá para trocá-las. Parâmetros, todos opcionais: `updateCheckUrl`, `updateCheckHeaders` (objeto chave/valor), `updateDownloadUrl`, `updateDownloadHeaders`, `syboxKey` (deprecado; único por objeto), `updateMessage` (i18n; o texto padrão do artigo é "Há uma nova versão do {0}! Baixe agora e mantenha sua organização atualizada!"), `getDependencyUrl` (deprecado), `api` (`SyboxApi`).

`SyboxApi`: `baseUrl` string obrigatória, `syboxKey` string obrigatória, `headers` objeto opcional. O artigo cita o uso em `getDependency` e em `preview`.

Os métodos de arquivo, neste artigo, estão em `_utils.com.sydle.one.sybox.SyboxRepoConfigs`: `getVersioningInfo(file)`, `enableVersioning(file, configs)`, `update(file, configs)`, `disableVersioning(file)`.

## Operação de dependência

Garante instalação só com as dependências instaladas. Para o tipo aparecer: SYBOX versionado com arquivo gerado, ou SYBOX de Instalação versionado. O artigo de exportação, para o mesmo tipo, pede SYBOX versionado ou SYBOX de Instalação versionado, sem citar arquivo gerado.

Campos: Rótulo (I18n, opcional); Dependências (obrigatório). No seletor: Pacote e Versão (opções dos objetos presentes no ambiente), Range (obrigatório, variação NPM), Incluir dependência no arquivo `.sybox` (boolean). Verdadeiro embute o arquivo. Falso obtém por HTTP na instalação.

Ranges do artigo: `^1.0.0` é `>= 1.0.0` e `< 2.0.0`; `~1.0.0` é `>= 1.0.0` e `< 1.1.0`; `1.0.0 - 3.0.0` é `>= 1.0.0` e `<= 3.0.0`. A variação cobre versão exata, versão mínima, só hotfix, ou funcionalidade sem breaking change. A versão é a que o OSM obtém quando o destino não atende a variação.

A criação só conclui se o SYBOX e as dependências forem válidos para o destino. Se a variação não é atendida, o OSM cria a versão indicada se ela for superior à maior já instalada e se não conflitar com solução instalada, salvo solução marcada obsoleta.

## Breaking change

Dependência indireta com quebra de compatibilidade não instala. O exemplo do artigo: CRM 2.0.0 depende de IA 3.1.0, e a organização tem CRM 1.0.0 e IA 1.0.0; a validação pede IA 3.1.0 antes. Instalado o IA, o CRM instala mesmo sendo breaking change, porque entra direto, não como dependência.

Instalação direta de breaking change não é impedida. O SYBOX é tagueado na criação. O release notes aparece antes de confirmar. Checagem de atualização e obtenção automática avisam a quebra.

```javascript
com.sydle.one.sybox.SyboxInstall.isBreakingChange({
    "package": pacote,
    "version": versao
});
```

O artigo declara retorno boolean: `true` quando há quebra.

## Dependências paralelas

Registro por organização. Quem exporta SYBOX usa a tela; por script:

```javascript
_utils.sybox.PeerDependency.register("my_package");
_utils.sybox.PeerDependency.get();
_utils.sybox.PeerDependency.unregister("my_package");
```

O objeto de Configuração do SYBOX, em Configuração, lista, inclui e remove. Pacote registrado como paralela não é instalado automaticamente quando outro pacote depende dele. O status passa a Instalado e a tag é Dependência Paralela. A instalação manual continua possível.

## OneSemVer

`com.sydle.one.sybox.OneSemVer`, no contexto de objeto e em script. O artigo exige versão ou range válido, sem candidato de pré-release, no padrão SemVer do NPM. A chamada é objeto nomeado. `compare`, `major`, `minor` e `patch` declaram retorno string. Comparadores booleanos e `validRange` lançam `Error` com parâmetro inválido. `sort` e `rsort` lançam `Invalid Range`.

```javascript
const resultado = com.sydle.one.sybox.OneSemVer.satisfies({
    "version": "1.0.0",
    "range": "1.0.0 - 2.0.0"
});
```

| Método | Entrada | Saída que o artigo declara |
|---|---|---|
| `valid` | `version` | a própria string, ou `null` |
| `compare` | `v1`, `v2` | string: o texto lista `1` se a primeira é menor, `1` se a primeira é maior e `0` se iguais; a linha da maior tem um hífen a mais, e o sinal não fica legível |
| `eq`, `neq`, `gt`, `gte`, `lt`, `lte` | `v1`, `v2` | boolean |
| `gtr`, `ltr` | `version`, `range` | boolean; `true` se a versão é maior, ou menor, que todas as do range |
| `intersects` | `r1`, `r2` | boolean |
| `major`, `minor`, `patch` | `version` | string do componente |
| `maxSatisfying`, `minSatisfying` | `range`, `versions` | string, ou `null` |
| `minVersion` | `range` | string da menor versão do range |
| `prerelease` | `version` | array dos candidatos, ou `null`; o exemplo usa `"1.0.0-alpha"` |
| `sort`, `rsort` | `versions` | array; `rsort` é a ordem decrescente |
| `satisfies` | `version`, `range` | boolean |
| `validRange` | `range` | string no formato `>=x <=y`, ou `null` |

## Canal das dependências

A partir da 8.40. Antes disso, dependência resolve só em `stable` e `lts`, qualquer que seja o canal do SYBOX que declara.

O canal considerado é o do SYBOX pai, o que declara a dependência. Um SYBOX só depende de canal igual ou mais estável que o dele, e ainda da inscrição da organização. Sem canal (arquivo instalado direto, fora de repositório) é tratado como `stable`.

| Canal do pai | Canais aceitos |
|---|---|
| sem canal, `lts`, `stable` | `stable`, `lts` |
| `rc` | `rc`, `stable`, `lts` |
| `beta` | `beta`, `rc`, `stable`, `lts` |
| `alpha` | `alpha`, `beta`, `rc`, `stable`, `lts` |
| `snapshot` | `snapshot`, `alpha`, `beta`, `rc`, `stable`, `lts` |

Em A → B → C, o canal de B escolhe o canal de C. O canal de A não valida a dependência de B. `snapshot` declarado por um pai `beta` conflita. A regra vale em cada nível.

Busca em até duas passadas, na ordem de prioridade dos repositórios. Primeira: só `stable` e `lts`, em todos os repositórios, sem olhar a inscrição. Segunda: só se nenhuma versão `stable` ou `lts` satisfaz a variação; aí entram os outros canais aceitos pelo pai. Pai `stable`, `lts` ou sem canal não tem segunda passada. Estabilidade precede prioridade do repositório e versão maior em canal menos estável. Com `^1.0.0`, `1.0.0` em `stable` ganha de `1.1.0` em `beta`. Versão só num canal que o pai não aceita é ignorada. O arquivo baixado é o do canal em que a versão foi encontrada.

A inscrição não amplia o que o pai aceita; só restringe a segunda passada, pela interseção. Pai `beta` inscrito só em `rc` busca `rc`, `stable` e `lts` nessa passada. Inscrição em `lts` não acrescenta canal na segunda passada. O exemplo do artigo: inscrição `snapshot` num pai `beta` ainda busca `beta`, `rc`, `stable` e `lts`.

Versão já instalada pode ser reusada sem a checagem de canal. Um pai `stable` reusa beta já instalada. Isso não muda a busca de versão nova.

Auto-dependência: o próprio SYBOX é o pai, e a mesma regra de canal vale.

Conflito de canal, quando a versão existe só em canal que o pai não aceita. O artigo dá a frase: a dependência "com.exemplo 1.0.0" existe no repositório, mas apenas no canal "beta", incompatível com o canal mínimo exigido "stable". Conflito de inscrição nomeia o repositório e o canal encontrado. Dependência ausente em todo canal disponível falha como não encontrada.

Canal publicado não é sufixo de versão. O número continua sem pré-release (`1.0.0-beta` não entra no padrão aceito).

## Atualizações automáticas

Atualização de segurança aplica sozinha quando: há SYBOX aplicado; o pacote está inscrito em canal compatível; a versão nova está marcada como atualização de segurança; não é breaking change; nenhuma dependência está em conflito; o repositório permite o automático (em geral ou só de segurança). A flag é definida na publicação.

Aplicada, a versão fica registrada como instalada e saem notificações. Dependência que impede a instalação não aplica e marca a tag Atualização com conflito. Várias versões de segurança sem breaking change: aplica a mais recente. Breaking change não aplica sozinha, mesmo marcada como segurança. Atualização aplicada automaticamente não pode ser revertida.

## Rotina de checagem de atualização automática

Duas rotinas, com a mesma lógica de aplicação, e tratamento diferente do que não é segurança.

Versões de plataforma no artigo: incluir o SYBOX na rotina antes da 8.15 exige o campo Permitir checar atualização; fluxo completo a partir da 8.15 (marcação e conflito); aplicação automática a partir da 8.16; rotina de atualizações de segurança a partir da 8.26.

As duas percorrem a última versão aplicada de cada SYBOX, conferem canal, versão nova e classificação. Segurança sem breaking change: aplica. Segurança com breaking change: tag Atualização disponível. A rotina de segurança ignora o que não é segurança, sem tag. A rotina de checagem marca o que não é segurança, e qualquer versão com breaking change, como Atualização disponível. Falha de acesso ao repositório: Erro ao Sincronizar. Voltar ao fluxo: método Atualizar; sincronização bem-sucedida tira a tag de erro.

Aplicação automática, a partir da 8.16, só se for segurança, sem breaking change, em canal compatível e dentro da política do repositório. Versão comum não aplica sozinha.

## APIs do artefato de repositório

O artigo nomeia os métodos e o JSON. Não mostra classe nem caminho de chamada.

`get`: baixa o arquivo. Entrada: `package` obrigatório; `systemVersions`, `ranges` e `channels` opcionais, tipo string na tabela. Sem `channels`, os canais são `["stable", "lts"]`. Saída: `file`.

`getMetadata`: o mesmo contrato de entrada, inclusive o padrão `stable` e `lts`. Saída: `file` de metadata. O artigo aponta `_utils.sybox.SyboxRepoConfigs.getCompletedMetadata` como outro meio de obter o metadata.

`listAvaliableVersions`, grafia do artigo. Mesmos campos de entrada. A tabela não repete o padrão de canais. Saída: `Array[Artefato]`.

`publish`: cria artefato a partir de um link. `fileUrl` e `channel` obrigatórios; `securityUpdate` boolean opcional. Saída: `_redirectURL` e `artifact`.

## Estrutura de tópicos

Classe `Topic`, `com.sydle.one.Topic`. Campos: `name` (I18n), `identifier` (texto, único, alfanumérico, começa com letra), `active`, `allowSubscription` (`false` bloqueia assinatura nova, exceto administrador ou fluxo interno autorizado), `eventTypes`.

Cada tipo: `type` (único no tópico) e `eventSchema` (referência opcional, só documentação). O schema não valida o publicado. Uma assinatura trata um tipo. Várias assinaturas podem tratar o mesmo tipo.

Classe `TopicSubscriber`, `com.sydle.one.TopicSubscriber`: `identifier`, `topic`, `executionClass`, `executionMethod`, `supportedEventType` (só tipo configurado no tópico).

Publicar localiza as assinaturas ativas daquele tópico e daquele tipo e executa o método de cada uma de forma assíncrona, com o payload de parâmetro. Falha numa assinatura não impede as outras. A ordem entre assinaturas não é garantida.

Payload do assinante:

```javascript
const payload = {
    "eventId": "identificador",
    "sequence": 3,
    "data": {},
    "eventTime": 1780428338007,
    "topic": "syboxInstallations",
    "eventType": "notificationA"
};
```

`eventTime` aqui é número, milissegundos Unix. `data` pode divergir do schema. `sequence` pode faltar: a sequência nasce com o tipo de evento, no par `topicIdentifier_eventType`; se a obtenção falha, a publicação segue e o campo não vai no payload.

Identificador de tópico e de assinatura: letra, depois alfanumérico ou `_`, sem espaço, único no contexto.

## Métodos de tópico

`com.sydle.one.Topic.publish` recebe `topicIdentifier`, `eventType` e `data`. Devolve assim que o despacho é aceito, sem esperar assinante. `data` não é validado pelo schema. `status` diferente de `DISPATCHED` significa que nenhum assinante será executado. `DISPATCHED` não garante que o assinante processe com sucesso.

```javascript
com.sydle.one.Topic.publish({
    "topicIdentifier": "identifier",
    "eventType": "eventA",
    "data": {
        "fieldA": "valorA"
    }
});
```

Retorno: `topicIdentifier`, `eventId`, `eventTime` (string ISO-8601 UTC, diferente do número que o assinante recebe), `sequence` (pode faltar), `eventType`, `data`, `status`. Status: `DISPATCHED`, `INVALID_TOPIC_IDENTIFIER`, `INVALID_EVENT_TYPE`, `TOPIC_NOT_FOUND`, `TOPIC_DISABLED`, `ERROR_DISPATCHING` (sobrecarga da fila), `INTERNAL_ERROR`.

`subscribe`: `_id` do tópico, `supportedEventType`, `executionClass`, `executionMethod`, `identifier`. Um tipo por assinatura. O identificador segue a mesma regra de nome.

```javascript
com.sydle.one.Topic.subscribe({
    "_id": idDoTopico,
    "supportedEventType": "eventA",
    "executionClass": classId,
    "executionMethod": methodIdentifier,
    "identifier": identificadorUnico
});
```

`createTopic`: `name`, `identifier`, `active`, `allowSubscription`. Exige o Feature Toggle de Tópicos com Permitir criação verdadeiro. O toggle só bloqueia tópico novo. Tópico já existente continua publicando com o toggle desligado.

```javascript
com.sydle.one.Topic.createTopic({
    "name": "Novo Tópico",
    "identifier": "novoTopico",
    "active": true,
    "allowSubscription": true
});
```

`unsubscribe` recebe `subscriptions`, lista de `{ "_id": idDaAssinatura }`, e exclui os objetos. O artigo diz que a operação não pode ser desfeita.

```javascript
com.sydle.one.Topic.unsubscribe({
    "subscriptions": [
        { "_id": idDaAssinatura }
    ]
});
```

## Destaque: migração de classe e objeto

Anúncio das duas operações. A Operação de Migração trata objeto e registro que já existem na organização. A Migração de Classe adequa o objeto que a instalação do SYBOX vai gravar ao formato que o ambiente espera, antes de salvar. O texto não acrescenta campo, status nem assinatura.

## Destaque: seleção por filtros

Anúncio do Modo de Seleção Avançado na exportação de objetos: um filtro de busca escolhe o conjunto, no lugar da seleção item a item. O contrato do modo, inclusive classe buscável, `match_all` e permissão `_get`, está na exportação. Este texto não acrescenta campo.

## Destaque: reversão de instalações

Anúncio da reversão como restauração do estado anterior, limitada a elemento controlado pelo SYBOX (objeto exportado e script). Não lista exceção, prazo, fila nem dependência. O contrato está na reversão técnica e na FAQ de reversão.

## FAQ: bloquear instalação de dependência

O bloqueio da instalação automática é registrar a dependência como paralela. O registro é da organização, não do SYBOX. Cada organização decide.

## FAQ: conflito de dependências

O OSM, ao analisar conflito, considera só SYBOX não obsoleto. Versão não obsoleta não instala se houver conflito. Marcar o SYBOX como obsoleto, depois de avaliar o breaking change, permite instalar com o conflito ainda existente. O passo de marcar obsoleto está noutro guia; esta FAQ não o mostra.

## FAQ: maior versão da dependência

O artigo responde que o SYBOX não instala automaticamente a maior versão disponível. A dependência especifica a versão, e o OSM busca essa versão no destino. O artigo de operação de dependência é o que define variação e a versão obtida quando o destino não atende a variação. O artigo de canal é o que escolhe entre versões que satisfazem a variação.

## FAQ: reversão

Instalação não gera arquivo de reversão sozinha: a funcionalidade precisa estar habilitada na organização, por um administrador. Erro na geração mantém o status da instalação, grava mensagem, e aquela instalação não reverte.

O método de reversão só aparece se a funcionalidade está habilitada e existe instalação ainda não revertida com arquivo de reversão disponível.

Reversão com erro: o original vai para Erro ao reverter, e a reversão com erro não se reverte sozinha. Gerar e aplicar a reversão dela, quando possível, volta ao estado anterior à instalação original.

Há configuração de reversão automática de instalação com erro. O padrão do artigo é Verdadeiro. Alterar é com um administrador.

Dependência não reverte sozinha, porque pode ser compartilhada. O sistema gera arquivo de reversão das dependências, e o usuário decide pelo método Gerar reversão. A ordem é a inversa da instalação: dependência, em geral a primeira operação, reverte por último. Dependência que já estava instalada não gera reversão, porque aquela instalação não a modificou. Reverter fora de ordem pode ficar incorreto ou impossível.

Objetos irreversíveis citados: classe do sistema, mensagem de indexação, log, informação de armazenamento.

Ao gerar a reversão, aplicam-se as configurações de campo da organização do momento em que o SYBOX foi instalado. Instalar o SYBOX de reversão não processa script de criação, de deleção ou de salvar da classe.

## FAQ: pré-release

O número da versão não aceita pré-release, como beta e alpha. O exemplo é `1.0.0-beta`. O canal em que a versão é publicada é outra informação: `1.0.0` pode estar no canal beta. A partir da 8.40, dependência em canal não estável segue o artigo de canal.
