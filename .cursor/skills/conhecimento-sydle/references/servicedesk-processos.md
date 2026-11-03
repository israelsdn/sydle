# Processos e filas (documentação oficial)

Contratos de criação, modelagem, automatização, publicação e atendimento de processo, e de fila assíncrona, extraídos da documentação oficial do SYDLE ONE (service desk). Cada seção resume um artigo útil. Assinatura, campo e comportamento só entram quando o texto os mostra. A página Filas traz só o título da seção e não descreve contrato.

## Criando processos

O módulo BPMS mapeia, executa e monitora processos. O guia cobre Grupo de Processo, Processo e Versão de Processo.

Grupo de Processo agrupa processos como o pacote agrupa classes. As instâncias ficam num pacote com o nome do grupo. Se esse nome já for o de um pacote, as classes aparecem no mesmo lugar da listagem. Campos: Nome e Grupo Pai (árvore). Objetos em Processo (Modelagem) > Grupo de Processo.

Processo. Campos: Cópia de, Grupo, Nome, Identificador, Ativo, Expiração do histórico (segundos, avançado) e Arquivo de Importação (avançado, BPMN e XPDL). Com Ativo verdadeiro é possível criar instâncias. A criação do processo gera a Versão de Processo 1.0. Objetos em Processo (Modelagem) > Processo. A versão abre pelo campo Versão atual ou em Processo (Modelagem) > Versão de Processo.

Versões distintas do mesmo processo executam ao mesmo tempo. Instância nova nasce sempre na versão atual, lida no processo, no campo Versão atual. Criar Versão de Processo pede Processo, Cópia de e Rótulo da versão (padrões citados: 1.0 ou 1_0). A versão criada não vira a versão atual sozinha.

## Modelando processos

A modelagem usa BPMN na Versão de Processo: desenho, elementos, permissão por raia e papel, configuração da versão e documentação.

Eventos. Inicial simples cria instância manualmente. Intermediário simples é genérico e só visual. Final não preenchido termina o fluxo e conclui o processo se não houver outro fluxo em andamento. Terminal preenchido conclui o processo mesmo com outros fluxos abertos. Mensagem liga um emissor a um receptor. Sinal também transmite informação, e um emissor pode ter vários receptores. Dois eventos de conexão equivalem a um fluxo de sequência. Temporizador é instante ou ciclo. Erro finaliza com o status Concluído com Erro. Evento acoplado ocorre durante a atividade; o interruptivo tem borda não tracejada.

Atividades. Humana é completada por um usuário. Genérica é só visual. Tarefa de execução de script é automática. Invocação de serviço funciona como a de script e representa integração externa. Subprocesso referencia um processo já criado. Subprocesso embutido modela um processo dentro do outro.

Gateways. Exclusivo seleciona uma saída e, na unificação, uma entrada basta. Paralelo ativa todas as saídas e espera todas as entradas. Inclusivo segue de um caminho até todos e, na unificação, espera as entradas ativas terminarem.

Conexões. Normal define a ordem. Condicional decide se o caminho segue. Padrão segue quando todas as outras retornam false.

Versão de Processo. Campos de configuração: Processo, Rótulo, Descrição, Campos, Métodos, Papéis, Processos Embutidos, Versão Atual, Documentação (avançado) e Arquivo de Importação (avançado). Campo da versão representa a instância ou é compartilhado entre elementos. A relevância do campo altera o card (o exemplo usa Identidade e Status, e Destaque). Campo da versão entra em busca e Analytics. Campo obrigatório da versão, se não for inicializado, gera erro ao criar a instância.

Métodos da versão, no mesmo modelo dos métodos de classe: Iniciar, uma vez ao criar a instância; Obter Metadata, características internas dos campos; Finalizar, uma vez ao concluir a instância.

Papel. Campos: Nome, Identificador, Nível de acesso, Autorização e Ver no fluxo?. Ver permite visualizar instâncias e atender atividades da raia. Gerenciar, além disso, altera executores, apaga e intervém manualmente. Ver no fluxo? libera ver a evolução dos fluxos. Autorização e Ver no fluxo? valem mesmo sem o papel estar numa raia. O exemplo é o papel Administrador, nível Explícito, grupo Gerência, autorização Gerenciar e Ver no fluxo? verdadeiro.

Atividade humana (tarefa de usuário). Campos: Identificador, Campos do Processo, Campos, Métodos, Permite devolução? e Permite exclusão do processo?. Campo do processo referenciado na atividade devolve o valor para a versão quando a tarefa termina. Campo local da atividade é criado como campo de classe.

Raia horizontal usa um papel do processo. Os elementos da raia seguem a permissão desse papel.

Documentação, com HTML, fica no campo avançado do elemento ou do processo, no modo edição.

## Automatização de processos

A árvore de expressões lista atributos e métodos do script. O artigo não descreve o conteúdo dela.

`_pin` é a instância. Nos scripts dos elementos ele expõe os campos da versão. Na atividade humana, o campo do processo selecionado também aparece em `_object`. Ao finalizar a atividade, `_object.campoDoProcesso` sobrescreve `_pin.campoDoProcesso`.

Conexão de saída de gateway exclusivo ou inclusivo: Padrão, Expressão e Ordem. A expressão ativa o fluxo quando retorna true. A padrão segue somente se nenhum outro fluxo foi selecionado. A avaliação percorre as conexões com Ordem, da menor para a maior, depois as sem Ordem, depois a padrão. O exemplo de um booleano é `return _pin.approved;`.

Métodos da atividade humana:

- Iniciar: quando o fluxo chega, isto é, quando a atividade anterior conclui. Uso citado: pré-preencher e definir executor.
- Finalizar: no clique de Concluir. O exemplo rejeita com `throw` e uma frase quando o nome tem menos de 5 caracteres.
- Alterar Rascunho: o corpo do artigo chama o mesmo método de Atualizar Rascunho. Roda a cada alteração de campo no rascunho, em modo edição.
- Obter Metadata: ao iniciar a tarefa e a cada modificação de campo. O exemplo começa com `if (!_object) return;` e, se não aprovado, liga `hidden` e `required` do campo.
- Atender: quando o usuário atende a atividade. O artigo não mostra o script.
- Devolver: quando o usuário devolve a atividade. O artigo não mostra o script.

Com a atividade em Aguardando, ela pode ser atendida. `_object` é a atividade humana. Atribuir `_object._executor` no Iniciar faz a atividade já nascer atendida. O artigo atribui `_pin._requestor` (quem pediu o início), `_user` (usuário atual da instância) ou `_pin.manager`.

Temporizador inicial cria instâncias novas. Tipo Data e Hora, ou Recorrência por cron. Exemplos de cron: `0 0 12 * * ?` (todo dia às 12h), `0 30 2 1 * ?` (dia 1 às 02:30), `0 0/5 * * * ?` (a cada 5 minutos). Temporizador intermediário pausa até a data que o script retorna. O exemplo soma dois dias à data em que o fluxo chega.

Mensagem liga instâncias do mesmo processo ou de processos distintos. Só um receptor recebe a mensagem, mesmo com duas instâncias válidas. Se nenhuma receber, o sistema acusa erro.

Recebimento inicial cria instância. Recebimento intermediário segura o fluxo até o evento; o fluxo precisa chegar nele antes do envio. Configuração: Identificador, Tipo, Campos do Processo, Campos (disponíveis em `_object` na condição) e Expressão de Condição de Recebimento de Mensagem, que retorna booleano. Campos do processo selecionados atualizam no fim do evento, como na atividade humana.

Três modos de recebimento: Processos, Via API e Interceptor por Classe.

No envio entre processos, o receptor é o identificador do evento de recebimento. O script de envio atribui `_output` e não usa `return`. A condição lê a mensagem em `_object`. Se os campos do processo selecionados tiverem os mesmos identificadores dos atributos enviados, a plataforma preenche esses campos. Sem essa seleção, o script da condição atribui `_pin` a partir de `_object` e ainda retorna o booleano.

Via API, o evento de recebimento ganha um endpoint. Método: rótulo do elemento. Identificador: identificador do evento. Endpoint escrito no artigo: `_process.<identificador_do_process>/current/<identificador_do_evento>`. Permissão: a da raia. Entrada dentro da chave `message`. Saída: dados da instância criada. O exemplo, com processo `purchaseRequest` e evento `eventValidateProvider`:

```javascript
const instanceData = _process.purchaseRequest.current.eventValidateProvider({
    message: {
        providerName: _pin.providerName,
        order: _pin.order
    }
});
```

Interceptor por Classe segue a ideia da Extensão de classe: Classe e Método. Cada execução do método processa a mensagem; a condição true dispara o evento. Se a chamada leva o `_id` de um objeto da classe, os atributos estão em `_listener._object`. Vale para Salvar, Remover e método personalizado. Salvar também roda na atualização. Criação, no artigo:

```javascript
const oldObject = _listener._oldObject;
const isCreation = !oldObject || !oldObject._id;
```

Envio final ou intermediário. Configuração: Identificador, Processo de Destino, Versão de Processo de Destino, Identificador do Elemento de Destino e Expressão (`_output`). A mensagem sai quando o fluxo chega. Busca em todas as instâncias: avalia cada instância que tem o elemento de destino; a primeira condição true recebe e a busca para; se nenhuma aceitar, há erro. Instância específica: só o `_id` em `_pinId`, forma que o artigo recomenda quando a instância destino é conhecida. O exemplo de cancelamento coloca em `_output` o `_pinId` (`_pin.purchaseInstance._id`) e o motivo (`_pin.reason`).

## Publicando processos

Publicar, no diagrama em edição, gera as classes de execução a partir da modelagem e passa a permitir instâncias. Alteração em qualquer parte do processo só tem efeito depois de publicar de novo. A instância abre pelo menu de criação, pelo nome do processo. Ver no fluxo acompanha a evolução no tempo.

## Atendendo atividades

O workspace Processos é a central dos processos que o usuário pode ver. À esquerda, os processos por grupo, mais a seção Todos (instâncias de todos os processos). No centro, as instâncias do processo selecionado, chamadas de chamados. À direita, a instância selecionada.

Filtros da listagem do processo atual: Inbox (instâncias com atividade pendente para o usuário atual), Todos, Criados por mim, Não finalizados e Finalizados (concluídas sem erro).

Abas: Detalhes (campos padrão, entre eles Status e Data da Conclusão, mais os campos da versão), Dados (objetos que referenciam a instância) e Timeline (atividades abertas e concluídas, erros de execução e intervenções). Atividade concluída guarda executor e momento, das mais recentes para as antigas. Com permissão, aparece Atender e a instância entra no Inbox. Depois de atender, o usuário é o executor e outro usuário não atende essa tarefa. Ver no fluxo também abre da instância.

## Introdução

Filas centralizam, organizam e priorizam operações assíncronas. A fila distribui itens para execução automática pelo sistema ou para consumo sob demanda, manual ou por integração. Cada mensagem é processada ou acessada de forma controlada, inclusive com volume alto e acesso simultâneo.

## Estrutura

Fila. Campos: Nome, Identificador único, Tipo de fila, Classe do corpo da mensagem e Permissões. Tipo Padrão é o de alta volumetria e não garante ordem estrita. FIFO garante a ordem de entrada; o artigo o marca como depreciado e diz que fila FIFO nova não pode mais ser criada. Visualização consulta o conteúdo. Gerenciamento altera, reprocessa ou exclui mensagens manualmente.

Criar a fila cria uma classe no pacote Filas, com o mesmo nome e o mesmo identificador. Essa classe persiste a mensagem até o consumo ou a expiração. O campo Fila da mensagem referencia a fila e, na 8.39, indexa o nome e a prioridade da fila, o que favorece busca e o agrupamento pela prioridade. As filas internas `simpleIndexingQueue`, `complexIndexingQueue` e `methodExecutionQueue` não seguem essa indexação.

## Processamento e consumo

Tipo de processamento, só em fila Padrão: Customizado (o sistema não consome; script ou API retiram o item), Execução de métodos (consumo automático para método de negócio) e Indexação simples ou complexa (indexação interna). A partir da 8.26 esse campo depende de feature toggle na Organização Hospedada.

Status do processamento, só em fila consumida pelo sistema: Ativo processa; Pausado aceita e guarda mensagem nova e não processa até reativar.

Prioridade da fila, só em fila consumida pelo sistema: Alta, Média-Alta, Média, Baixa-Média ou Baixa. O peso intracategoria só se compara com filas da mesma categoria; peso 10 tem o dobro da chance de peso 5. A partir da 8.26 o peso também depende de feature toggle na Organização Hospedada.

## Resiliência

Tempo de retenção (segundos): depois dele a mensagem expira e é removida. Limite de entregas: ao ultrapassar sem sucesso, a mensagem fica Erro. Timeout de recebimento (segundos): tempo máximo em Executando; sem confirmação, volta para Aguardando se o limite de entregas não foi atingido, ou vai para Erro se foi. Tentativas de recuperação de erros: reprocessa automático uma mensagem em Erro, só se o limite de entregas e o limite de erros ainda não foram atingidos. Delay para recuperação de erros (segundos): espera entre a falha e a próxima tentativa automática. Timeout de pendência (segundos): limite para mensagem presa em Pendente. Ação após esse timeout: Rollback apaga a mensagem; Commit efetiva e passa para Aguardando.

## Priorização

A priorização descrita entrou na 8.26 e exige feature toggle na Organização Hospedada.

A escolha da próxima mensagem é uma roleta em duas etapas. Primeiro o sistema sorteia a categoria pelas porcentagens globais. Depois, dentro da categoria, sorteia a fila pelo peso intracategoria. Categoria sem fila com mensagem pendente sai do sorteio e a probabilidade dela se redistribui. Fila sem pendência, dentro da categoria sorteada, também sai, e o peso se redistribui entre as que têm pendência.

Porcentagens globais: no objeto Filas da classe Configurações, na ação Repriorizar filas da listagem, ou pelos métodos de configuração global. Categoria da fila: no cadastro da fila. Peso intracategoria: pela ação Repriorizar filas, que também edita a categoria, ou pelos métodos de gerenciamento da fila. Repriorizar filas altera em massa categoria, peso e as porcentagens globais. Definir status de processamento altera Ativo ou Pausado de uma ou mais filas.

## Execução de métodos

Fila com processamento Execução de métodos é consumida pelo sistema para invocar script de forma assíncrona. Usos citados: rotina longa ou de duração indeterminada, agendamento, troca de contexto pelo `invokerUser` e desacoplamento do fluxo principal. A fila nativa é `_queues.methodExecutionQueue`. A partir da 8.26, fila customizada desse tipo depende de feature toggle na Organização Hospedada. A estrutura do objeto é a mesma na fila nativa e na customizada.

```javascript
_queues.methodExecutionQueue._create({
    sender: {
        _id: _object._id,
        _classId: _object._class._id
    },
    schedulingDate: new Date(new Date().getTime() + 20000),
    body: {
        targetClass: {
            _classId: "000000000000000000000000",
            _id: _object._class._id
        },
        targetMethod: "generate",
        parameter: _utils.stringifyAsJson({
            _id: _object._id
        }),
        invokerUser: _user
    }
});
```

`sender` é o objeto que gerou a mensagem; ela aparece na aba Dados desse objeto enquanto o status é Aguardando, Executando ou Erro. `schedulingDate` nulo segue a prioridade da fila e executa assim que possível; o exemplo soma 20 segundos. `body.targetClass` é a referência da classe do método. No exemplo, `_classId` dessa referência é vinte e quatro zeros e `_id` é a classe do objeto. `targetMethod` é o identificador do método. `parameter` é a string JSON do `_input`, montada com `_utils.stringifyAsJson`. `invokerUser` é o usuário tratado como `_user` na execução.

`onSuccess` é o corpo da mensagem gerada se a execução principal termina sem erro. Não precisa ser do mesmo tipo de `body`. `onSuccess._class`, se omitido, assume a classe Execução Assíncrona de Método. `onSuccessTargetQueue` é a fila dessa mensagem. A classe do corpo da fila de destino tem de ser a classe definida em `onSuccess`. O exemplo de `onSuccess` repete classe e método (`updateStatus`), manda outro `invokerUser` e aponta a fila de destino com `_id` e `_classId`. Esses ids literais do exemplo não são contrato. Na interface da mensagem, as propriedades avançadas configuram o mesmo encadeamento; com a classe padrão, a tela pede classe, método, parâmetros, usuário de contexto e fila de destino.

## Métodos disponíveis

Cada fila expõe o ciclo da mensagem em `_system._queues.<identificadorDaFila>`. A classe Fila expõe a administração em `_system._queue`. A configuração global fica em `_system.QueuesConfiguration`.

`receive` obtém um lote e garante entrega única: a mesma mensagem não sai em duas chamadas simultâneas. As mensagens passam para Executando. Uso: fila com processamento Customizado. Entrada obrigatória: `maxMessages`, número de 1 a 100. Retorno: `messages` e `receiptUuid`.

```javascript
const result = _system._queues.orderProcessing.receive({
    maxMessages: 10
});
```

`ack` confirma o sucesso. A mensagem é excluída. Se houver callback de sucesso, uma mensagem nova entra na fila de destino configurada ou na fila padrão de execução de métodos. Entrada obrigatória: `messageId` e `receiptUuid` (o recibo do `receive`). Erro se o `messageId` não existe, se o `receiptUuid` não é o da última entrega, ou se a mensagem não está Executando.

```javascript
_system._queues.orderProcessing.ack({
    messageId: "60d5ecb8b4934729837d3a12",
    receiptUuid: "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
});
```

`nak` registra falha. A mensagem sai de Executando e vai para Erro, o contador de erros aumenta, e `error.message` e `error.debug` ficam no objeto. `messageId` e `receiptUuid` são obrigatórios. `error`, `error.message` e `error.debug` são opcionais. Os três erros são os mesmos do `ack`. Os ids do exemplo não são contrato.

```javascript
_system._queues.orderProcessing.nak({
    messageId: "60d5ecb8b4934729837d3a12",
    receiptUuid: "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
    error: {
        message: "Falha de conexão com API externa",
        debug: "Timeout connection error: 500 server internal error..."
    }
});
```

`reprocess` devolve mensagens em Erro para Aguardando. Entrada: `_objects`, lista de referências; o artigo marca o parâmetro como Sim*. Cada item traz `_id` e `_classId`. `_classId` de outra fila é ignorado. Mensagem que não está em Erro é ignorada. Se nenhuma for recuperada, o método retorna erro.

```javascript
_system._queues.orderProcessing.reprocess({
    _objects: [
        {
            _id: "60d5ecb8b4934729837d3a12",
            _classId: "50d5ecb8b4934729837d3a08"
        }
    ]
});
```

`commit` efetiva mensagens Pendente: passam para Aguardando. Entrada obrigatória: `messages`, lista de `_id`. O artigo descreve o erro como falha na exclusão quando o id não existe ou não está Pendente.

```javascript
_system._queues.orderProcessing.commit({
    messages: [
        "60d5ecb8b4934729837d3a12"
    ]
});
```

`rollback` apaga mensagens Pendente sem processá-las. A entrada e o erro descritos são os do `commit`.

```javascript
_system._queues.orderProcessing.rollback({
    messages: [
        "60d5ecb8b4934729837d3a12"
    ]
});
```

`_system._queue.changePriority` troca a categoria. Entrada obrigatória: `_id` da fila e `priority` (exemplos do artigo: `"HIGH"` e `"MEDIUM"`). Retorno: a fila atualizada. Erro se o `_id` é inválido ou inexistente, ou se `priority` não é uma categoria válida. O artigo não publica o identificador de cada rótulo da interface.

`_system._queue.changeIntracategoryPriority` troca o peso usado na roleta. Entrada obrigatória: `_id` e `intracategoryPriority` (número). Retorno: a fila atualizada. Erro se o `_id` é inválido ou inexistente, ou se o peso não é um número válido.

```javascript
_output = _system._queue.changeIntracategoryPriority({
    _id: "60d5ecb8b4934729837d3a12",
    intracategoryPriority: 8
});
```

`_system._queue.changeMessageProcessingStatus` pausa ou ativa o consumo. Entrada obrigatória: `_id` e `messageProcessingStatus` (`"ACTIVE"` ou `"PAUSED"`). Retorno: a fila atualizada. Erro se o `_id` é inválido ou inexistente, ou se o status não é um desses dois.

```javascript
_output = _system._queue.changeMessageProcessingStatus({
    _id: "60d5ecb8b4934729837d3a12",
    messageProcessingStatus: "PAUSED"
});
```

`_system.QueuesConfiguration.changePriorityCategoriesPercentagesFriendly` altera as porcentagens da roleta. Entrada obrigatória: `priorityCategoriesPercentages`, objeto cuja chave é o identificador da categoria e o valor é o número. O exemplo usa `HIGH`, `MEDIUM` e `LOW`. Não é obrigatório enviar todas as categorias, desde que o resultado desejado se mantenha; o sistema valida se a soma final é 100%. O método não tem retorno. Erro se a soma das porcentagens fornecidas não é exatamente 100%, ou se alguma é menor ou igual a 0 ou maior que 100.

```javascript
_system.QueuesConfiguration.changePriorityCategoriesPercentagesFriendly({
    priorityCategoriesPercentages: {
        HIGH: 60,
        MEDIUM: 30,
        LOW: 10
    }
});
```
