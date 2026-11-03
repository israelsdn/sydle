# Processos e filas

Contratos de modelagem e execução de processo no SYDLE ONE extraídos da wiki: campos do `_pin`, eventos de mensagem, sinal e temporizador, subprocesso, status, ACL da instância e filas de mensagem. Cada seção resume um artigo. Assinatura, id e comportamento só entram quando o texto os mostra.

## Acionar sinal por meio de link

Método do processo serve de endpoint público para um clique em link (ciência de recebimento). A URL leva o id da instância; o método dispara a mensagem que o fluxo está aguardando, com esse id.

O nível de acesso do método é público. No corpo da notificação, o campo do link entra com três chaves, para o HTML do `<a>` passar pelo mustache. O artigo não mostra a assinatura do método nem o nome do evento.

## Alterar informações da atividade do processo dinamicamente

No script de Iniciar ou Encerrar da atividade no processo, `_object` é a user task e a instância da tarefa está em `_object.sourceObject`. A alteração persiste com `_patch` resolvido por `_utils.getMethod`. O `path` é o identificador do campo (`/name`, `/description` ou `/identificadorDoCampo`), não o rótulo. Várias operações cabem na mesma `_operationsList`.

`replace` só vale se o campo já existe; se puder faltar, a operação é `add`. No script da classe da tarefa, `_object` já é a tarefa, `sourceObject` não existe, e `_patch` direto em `_object` não persiste porque o objeto ainda não foi salvo.

```javascript
_utils.getMethod("_classId", _object.sourceObject._class._id, "_patch")({
    _id: _object.sourceObject._id,
    _operationsList: [
        { op: "replace", path: "/name", value: novoValor }
    ]
});
```

## Atribuir entrada, saída, _pinStarter, _pinRef

A atividade de subprocesso aponta o processo referenciado e a versão. Em "Atribuir entrada do subprocesso", `_output` é a saída do iniciador e o input implícito do subprocesso: campos `_output.*` recebem valores `_pin.*` do iniciador. Em "Finalizar", `_pinRef` é a referência ao subprocesso, no sentido inverso do `_pinStarter`. A leitura é `_object._pinRef`, porque a atividade de subprocesso referencia a instância.

Erros citados: omitir `_output` nos campos do iniciador; escrever `_pin._pinRef` no Finalizar.

## Campos do processo (_pin): _activeElements

Campo interno da instância. Guarda referências das atividades ativas: user task, subprocesso, temporizador, evento de mensagem e demais elementos aguardando execução. Aparece em `_pin._activeElements` e no `_get` da instância.

Cada chave é o identificador do elemento. Sem instância ativa, o valor é um array vazio. Com instância ativa, o array traz objetos com `_classId` e `_id`. O objeto também traz `_class`, `_id`, `_classRevision` e `userTaskIdentifier` (array de identificadores de user task, strings, não referências). Serve para regra que depende de atividade ativa e para saber se um evento de sinal ou mensagem daquela instância está ativo antes de acioná-lo.

A presença da chave não indica atividade: no exemplo, elemento inativo continua no objeto com array vazio.

## Configuração de eventos de mensagem

Evento de mensagem liga um emissor a um receptor e pode iniciar processo. Origem possível: portal, landing page, e-mail ou API.

Envio (final ou intermediário): processo de destino, versões (uma versão, a atual ou todas, inclusive o mesmo processo), identificador do elemento de destino e, se houver payload, campos do `_output` na expressão.

Recebimento (início ou intermediário): tipo processo ou interceptor por classe. O interceptor escuta um método de uma classe (o exemplo usa `salvar`) e pode iniciar o processo quando o objeto é salvo. A condição de recebimento devolve booleano; `return true` aceita sempre. Campos recebidos são os configurados no evento.

## Disparar eventos de mensagem via script

Um método do processo, chamado de fora, dispara o evento de recebimento. Sem input, a chamada é o evento em `current`. Com input, o payload vai dentro de `message`.

```javascript
_process.identificadorDoSeuProcesso.current.identificadorDoSeuEventoDeMensagem({
    message: {
        nomeDoSeuInput: dadosDoInput
    }
});
```

O método do processo é chamado por script com `_utils.getMethod("_classId", idDaClasse, "identificadorDoMetodo")`. O id de classe do exemplo não é contrato de plataforma.

## Integrar o tramitador a um processo de fluxo definido

Versão de produto citada: 7.6. O processo tem campo de ticket, evento inicial de recebimento de mensagem com o campo Ticket, e um campo de referência embutida à classe do formulário. No script Iniciar, os dados do formulário saem de `ticket.additionalData`.

Na classificação do ticket (Service Desk - Atendimento), "Iniciar processo com fluxo definido?" verdadeiro exibe Processo e depois Evento inicial (eventos de mensagem daquele processo). "Classe de dados adicionais para o formulário de abertura" aponta a classe do formulário. O script de Parâmetros devolve o ticket. Criar o ticket agenda `startProcess`. O ticket expõe o método "Ver processo". O campo Ticket do processo e o campo de dados adicionais são preenchidos.

```javascript
if (_object.ticket) {
    _object.dadosDaSolicitacao = _object.ticket.additionalData;
}
```

```javascript
return {
    ticket: _object
};
```

## Concluir tarefa de usuário via script

Duas vias. `updateStatus` altera o elemento na hora, valida a transição e não grava intervenção manual. `_manualIntervention._create` grava rastro, motivo e autor, e pode iniciar e interromper tarefas.

`_activeElements` fornece as instâncias. Cada elemento usado no aborto tem `_id`, `_class._id` e `status._id`. A constante `_.ELEMENT_INSTANCE_STATUS_ID` mapeia as chaves `waiting`, `halted`, `starting`, `active`, `aborted`, `completing`, `completed` e `error`. Os valores no artigo são placeholders (`id_status_*`), não ids publicados da plataforma.

Estados finais que o exemplo não altera: `aborted`, `completed`, `completing`, `error`. Transição para `aborted` só com `expectedStatusIds` em `waiting`, `halted`, `starting` e `active`.

No `_create`, o código envia `startedTasks` e `userTasksInterrupt`. O comentário do artigo chama a lista de início de `userTasksStart`; a chave gravada no objeto é `startedTasks`. `reason` é multi-idioma (`pt`). `_creationUser` recebe `_user`. `process` e `processInstance` levam `_id` e `_classId`.

```javascript
_process.GraphicalElementInstance.updateStatus({
    elementId: elemento._id,
    elementClassId: elemento._class._id,
    newStatusId: _.ELEMENT_INSTANCE_STATUS_ID["aborted"],
    expectedStatusIds: [
        _.ELEMENT_INSTANCE_STATUS_ID["waiting"],
        _.ELEMENT_INSTANCE_STATUS_ID["halted"],
        _.ELEMENT_INSTANCE_STATUS_ID["starting"],
        _.ELEMENT_INSTANCE_STATUS_ID["active"]
    ]
});
```

```javascript
_process._manualIntervention._create({
    "process": {
        "_id": idProcesso,
        "_classId": idClasseProcesso
    },
    "processInstance": {
        "_id": idInstancia,
        "_classId": idClasseInstancia
    },
    "reason": {
        "pt": motivo
    },
    "startedTasks": tarefasIniciar,
    "userTasksInterrupt": tarefasInterromper,
    "_creationUser": _user
});
```

## Configuração de evento de sinal externo

O recebimento espera um sinal de fora. O identificador do sinal escolhe qual sinal o evento captura (o exemplo usa `documentoAssinadoDevolver`). Campos do evento guardam o payload (no exemplo, `Sinal` e `Justificativa`). A condição de recebimento compara um valor do processo com o campo do sinal (no exemplo, o id do documento oficial).

O envio externo monta o objeto do sinal e chama `addItem` da classe `_queueMessage` no pacote `_system`. O artigo descreve os atributos Sender, Subject e Body. O Body leva o objeto do sinal e o identificador do evento de recebimento. O artigo não mostra a chamada nem o formato do argumento de `addItem`.

## Configuração de eventos de sinais

Sinal é broadcast: toda instância que espera aquele sinal o recebe, em processos diferentes ou não. Mensagem, no mesmo artigo, é ponto a ponto.

Envio: a expressão grava o que os receptores vão validar.

```javascript
_output.campoDoRecebimento = valorDesejado;
```

Recebimento fica em espera até a condição. O campo do receptor tem o mesmo nome e o mesmo tipo do `_output`. A condição devolve booleano.

```javascript
return _object.campoDoRecebimento === valorDesejado;
```

Sem essa condição, broadcasts de outros fluxos com o mesmo campo também satisfazem o receptor.

## Diferença entre mensagem e mensagem da fila

Mensagem é o conteúdo BPMN: notificação, output/input e orquestração ponto a ponto, síncrona no fluxo ou quase síncrona entre processos (envio, espera do receptor, continuidade).

Mensagem da fila é o envelope assíncrono de um worker. O exemplo é `_queues.methodExecutionQueue`. Serve para desacoplar, agendar, trocar o usuário de contexto e reprocessar erro. Estados: `PENDING`, `WAITING`, `EXECUTING`, `DONE` ou `ERROR`.

Parâmetros da fila citados: tempo de retenção (segundos) até expirar; timeout de recebimento (segundos) até `ERROR`; limite de entregas (entradas em `EXECUTING`; o timeout seguinte vai direto a `ERROR`); tentativas de recuperação e delay para `ERROR`; timeout de pendência e ação `COMMIT` (`PENDING` vai para `WAITING`) ou `ROLLBACK` (remove). Tipo `STANDARD` ou `FIFO`. Classe do corpo define o schema; classe da mensagem é a executora. Visualização e gerenciamento referenciam permissão.

A fila também recebe temporizador (data ou CRON), sinal (cada envio gera pendência nos receptores), evento de mensagem (o recebimento espera pela fila) e erro de tarefa (`ERROR` com classe, método e linha, reprocessável).

`parameter` passa por `_utils.stringifyAsJson`. Objetos em Sistema > Mensagem (v7.5), filtro Execução de Métodos. Supervisão: no máximo 1000 mensagens, as mais novas; intervalo mínimo de 1 hora para reprocesso e alerta. Reprocesso exige consumidor idempotente.

```javascript
_queues.methodExecutionQueue._create({
    sender: objetoSender,
    schedulingDate: dataExecucao,
    body: {
        invokerUser: usuarioContexto,
        parameter: _utils.stringifyAsJson(parametros),
        targetClass: classeMetodo,
        targetMethod: "identificadorDoMetodo"
    }
});
```

## Evento acoplado interruptivo

Evento preso à atividade que, ao disparar, interrompe essa atividade. Tipos: erro, mensagem, sinal e temporizador.

Erro só existe como interruptivo. Sinaliza inconformidade planejada e impede o desfecho positivo. Em atividade humana, aparece como opção da tarefa. Mensagem e sinal interruptivos tratam o recebimento como verdadeiro ou falso, seguem outro ramo e interrompem a atividade. Temporizador interruptivo encerra a atividade no prazo (o exemplo é 2 minutos) e segue o outro ramo.

O artigo não mostra assinatura de script.

## Evento acoplado não interruptivo

Dispara durante a atividade e não a encerra. Os dois fluxos seguem juntos. O evento arma quando o fluxo chega na atividade.

Temporizador: a contagem começa quando a atividade fica disponível. No exemplo, 15 dias disparam um script de notificação e a user task do formulário continua pendente; o processo só acaba quando o formulário é preenchido. Modelar o prazo depois da tarefa só começa a contar depois do preenchimento.

Mensagem: intervenção enquanto a tarefa está pendente. Sinal: vários receptores com o mesmo identificador disparam juntos, inclusive em outros processos; a condição de recebimento restringe quais.

## Evento contábil

Configuração de lançamento, não elemento BPMN. Campos: nome, classe do objeto (exemplo Fatura), valor do lançamento, data do lançamento e configurações de lançamento (plano de contas, filtros, distribuição, status, descrição). Status: Pendente (exige aprovação posterior) ou Contabilizado.

Dentro da distribuição: filtros sobre o objeto; tipo Débito ou Crédito; conta contábil; histórico (referência a Histórico Padrão); valor (campo único ou campo de tabela, e neste caso filtros de agregação); regras tributárias; expressão avançada. A expressão devolve valores calculados. No exemplo, o retorno traz `history` e substitui o histórico padrão.

"Permite múltiplos lançamentos para o mesmo objeto?" fica verdadeiro quando o mesmo objeto gera mais de um lançamento (várias naturezas financeiras, ou dois momentos como emissão e pagamento da fatura).

Histórico Padrão: nome, classe, descrição de débito e descrição de crédito. Sem assinatura de método.

## Evento temporizador

O script devolve uma data. Nessa data o elemento fica concluído e o fluxo segue. Há temporizador intermediário, separado no fluxo, e acoplável. O acoplável comum interrompe a atividade. O não interruptivo usa relógio pontilhado e não interrompe.

```javascript
return new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000));
```

Alterar o script não reagenda instância que já espera: ela continua na expressão anterior. Recorrência em intervalo curto gera volume alto, sobrecarrega a instância e pode falhar a criação.

## Eventos acoplados

Ação durante uma atividade. Ao disparar, executa o ramo ligado a ela. Não interruptivo tem borda tracejada e segue os dois fluxos. Interruptivo tem borda cheia e interrompe a atividade ao iniciar. Erro acoplado só existe interruptivo. Os demais existem nas duas formas. A configuração de cada um está nos artigos de sinal, temporizador e mensagem.

## Eventos geradores de mensagens da fila

Temporizador inicial, com data explícita ou CRON, cria mensagem na fila ao publicar o processo. Uma instância nasce nessa data. Retirar o temporizador e publicar de novo remove a mensagem.

Envio de sinal cria mensagem na fila. O receptor declara campo de mesmo nome e tipo e a expressão de condição. Recebimento de mensagem também cria mensagem na fila, porque o evento fica esperando. Mensagem tem um receptor; sinal tem vários. O envio de mensagem informa processo, elemento de destino e `_output`.

Tarefa com erro interrompe o fluxo, aparece na timeline e gera mensagem com status `ERROR`. O campo de erro cita classe, método, script, linha, coluna e a exceção. Corrigido o script, a mensagem pode ser reprocessada.

## Filas

Objeto da classe Fila (`_queue`) guarda a configuração. O exemplo é `methodExecutionQueue`.

| Campo | Função |
|---|---|
| Tipo | Texto `STANDART` ou `FIFO` |
| Visualização de Mensagens | Referência a Permissão (`_permission`): quem vê |
| Gerenciamento de Mensagens | Referência a Permissão: quem administra |
| Classe do Corpo da Mensagem | Schema do body |
| Tempo de Retenção (segundos) | Espera até a mensagem ser removida. No exemplo, 90 dias |
| Timeout de Recebimento (segundos) | Prazo de processamento. No exemplo, 2400; estoura como `ERROR` do tipo timeout |
| Limite de Entregas | Cada ida a `EXECUTING` soma 1 em Contador de Recebimentos. No limite, o próximo timeout de recebimento vai a `ERROR` em vez de `WAITING` |
| Tentativas de Recuperação de Erros | Reprocessos de `ERROR`; cada um soma Contador de Erros |
| Delay para Recuperação de Erros (segundos) | Espera antes da nova tentativa |
| Classe da Mensagem | Classe do pacote `_queues` que segue a interface `_message` |
| Timeout de Pendência (segundos) | Tempo em `PENDING` |
| Ação Após Timeout de Pendência | `COMMIT` passa a `WAITING`; `ROLLBACK` remove a mensagem |

O artigo da fila grafa a opção `STANDART`. O artigo que compara mensagem e fila grafa `STANDARD`.

## Gatilho evento com filtro

Gatilho de notificação com filtro na estrutura da própria classe, pelo componente de filtro, sem script. O gatilho Evento, com script, continua sendo a via quando o critério cruza entidades ou calcula.

Não funciona de modo correto quando o interceptor está em método sem contexto de objeto. A notificação depende do objeto nesse contexto. Não há assinatura de método.

## Linter para processos no BPM

Dois métodos percorrem a modelagem, um para BPM 1.0 e outro para BPM 2.0. O artigo não publica o identificador deles. BPM 1.0 tem o método `publicar`; BPM 2.0 não tem. Método incompatível com a versão devolve mensagem indicando o compatível.

Verificam processo principal (nome e documentação), conexões (identificador personalizado e documentação), elementos (identificador personalizado e documentação), raias horizontais (documentação) e raias verticais (nome personalizado). Níveis: Warning (crítico, correção obrigatória), Alert (recomendado) e Info.

Instalação pelo SYBOX Métodos Utilitários no ELO DEV. A relevância fica em Pacote Sistema > Classe Configuração: "Configuração de análise de processo" e "Configuração de análise de processo BPM 2.0". A relevância padrão do artigo deve ser revista no projeto.

## Mensagens da fila

Execução assíncrona de método, com usuário de contexto e data próprios. Chamada síncrona usa o usuário da sessão e executa na hora. A fila evita travar o processo: falha de API deixa a mensagem em `ERROR`, de onde se lê o erro e se reprocessa. Também agenda método recursivo com intervalo.

`_queues.methodExecutionQueue._create`. `sender` (opcional) amarra a execução a um objeto. `schedulingDate` (opcional, date) agenda; sem ele, executa logo após criar o objeto. `body` é obrigatório.

No body: `invokerUser` (opcional, interface Usuário de Acesso; sem ele, usuário da sessão); `parameter` (opcional conforme o método, sempre `_utils.stringifyAsJson`); `targetClass` (obrigatório, objeto da classe Classe/Sistema); `targetMethod` (obrigatório, string do identificador). O artigo marca o id da classe Classe/Sistema como `000000000000000000000000`. O id de usuário do exemplo é o da classe Servidor naquele ambiente, não um id fixo de plataforma.

Os objetos ficam em Sistema > Mensagem (v7.5), filtro Execução de Métodos, com filtro adicional por status e `sender`. A resolução dos objetos usa `_utils.getMethod` com ids em constante.

## Metadata: itens de lista (removable, hidden e findById)

Em Obter Metadata, campo referência embutido e múltiplo expõe os itens em `_metadata.fields.IDENTIFICADOR_DO_CAMPO.items`. `findById` recupera o item pelo `_id`. `hidden` (booleano) oculta ou mostra o item. `removable` (booleano) define se o item pode ser removido na criação ou edição.

```javascript
const item = _metadata.fields.identificadorCampo.items.findById(idItem);
item.hidden = false;
item.removable = true;
```

## Método getACL da classe Instância de Processo

Roda no contexto da instância (`_object`) e monta `_acl` em três passos.

Herda do processo pai, por `_id` e `_classId`: `manageAuthorization`, `viewAuthorization`, `viewFlowAuthorization` e `abortProcessAuthorization`.

Percorre métodos AdHoc de acesso dinâmico. Aplica o filtro condicional do diagrama (bloqueia se não atender), acha o papel pela raia e exige instância em status ativo. Satisfeito isso, a tarefa recebe as permissões do papel.

Distribui o herdado: `_get` recebe `viewAuthorization`; `abort` recebe `abortProcessAuthorization`, salvo se a versão do processo já tiver regra própria de cancelamento; intervenção manual e `_delete` recebem `manageAuthorization`.

O retorno lista cada método com `users` e `groups`. Mover a tarefa de raia troca o papel sem alterar código. Matrizes de Gestão, Visualização e Cancelamento do processo pai alimentam a próxima execução de `getACL` nos métodos get, abort, manualIntervention e delete.

O exemplo de ACL dinâmica faz `_acl.users.push` e `_acl.groups.push`. O comentário do artigo também cita `_acl.{{metodo}}.users` e `_acl.{{metodo}}.groups`.

```javascript
_process._processInstance.getACL({ _id: _object._id });
```

## Padrão de documentação de processos

A documentação da versão fica nas configurações do processo, no avançado, no fim da página. Aparece à direita da modelagem, em modo leitura. O modelo HTML cobre título, vínculo com serviço e portal, objetivos, início, etapas, fim e raias (dinâmica ou explícita, com grupos). Cada atividade tem documentação própria, no avançado da atividade. Não há contrato de execução.

## Priorização de filas

Jobs citados e o que abastecem:

- `LegacyQueueMessageExecutionJob`: fila legada, execução síncrona dos elementos de processo BPM. O mesmo nome aparece de novo como fila de indexação complexa de coleções.
- `MethodExecutionJob`: fila de execução de métodos; operações assíncronas de processos e APIs.
- `SimpleIndexingJob`: indexação simples de objetos.

Processos e APIs concorrem numa JOB com lógica FIFO. A priorização cria filas priorizadas e, para cada uma, consumidores virtuais na fila de execução de métodos, na proporção configurada. O consumidor é uma mensagem dessa fila que busca a fila priorizada. Ao executar, cria outra mensagem para manter a alocação. Sem mensagem na sua prioridade, o consumidor passa à prioridade seguinte.

O comportamento só se mantém se nenhum outro recurso abastecer a fila de execução de métodos: toda operação assíncrona do ambiente entra numa fila priorizada.

## Processo de minuta

Fluxo definido para várias pessoas elaborarem um Documento Oficial. Início pelo método "Criar nova minuta" da classe Documento Oficial.

Criar Minuta define ticket, tipo, origem, formato, dados adicionais e arquivo (arquivo só para origem externa), lista opcional de revisão, lista opcional de assinatura e lista obrigatória de publicação. Cada selecionado vira pendência.

Elaborar/Revisar é cíclica até não restar pendência de revisão. Conclui pendências daquele usuário ou de grupo dele. Cria ou atualiza versão em rascunho; se o documento já tinha assinatura, as assinaturas são excluídas.

Assinar Minuta é cíclica até não restar pendência de assinatura. Publicar Minuta tem quatro ações: Publicar (encerra; só finaliza se o executor assinou ou se o documento não puder ser assinado por ele); Adicionar revisores (volta à elaboração e invalida todas as assinaturas); Adicionar signatários (volta à assinatura e mantém as assinaturas já feitas); Cancelar (exclui a criação e encerra).

No fim, o rascunho é publicado e o processo fica `publicado`, ou o rascunho é excluído e o processo fica `cancelado`.

## Processo de solicitações gerais

Fluxo do ticket: formulário, Analisar Pedido (deferido, indeferido ou ajuste), documento oficial e assinatura conforme a classificação, cancelamento pela flag e encerramento com notificação e script da situação. O processo só aciona o script declarado na classificação.

A configuração fica na classificação do ticket.

Situação de atendimento: Deferido, Indeferido e Cancelado. Cada uma aponta classes e métodos. Papel `visualizadorDoProcesso`: acesso Explícito ou Dinâmico, grupos, usuários e script de ACL. O exemplo resolve um usuário com `_get` na classe `000000000000000000000002` e, se houver retorno, faz `_acl.users.push`. Tags: só nível Explícito.

Atividades principais: Analisar Pedido e Assinar Documento. Formulário adicional torna obrigatórias as configurações extras. Cada passo da sequência de atendimento tem nível de acesso (Explícito ou Dinâmico), grupos, usuários, script de ACL, condições, geração de documento, configuração de campos, autorização do formulário adicional (só se houver formulário adicional) e Permite Cancelamento. Condições de atendimento leem o formulário "Dados da Solicitação": campo, operador e valor. Geração de documento liga a edição do documento oficial naquele passo. Permite Cancelamento falso aborta a user task "Solicitar Cancelamento".

Gestão do documento oficial: tipo, assinatura obrigatória, sequencial, permissão dinâmica e o script dessa permissão (roda na geração e manipula usuários e grupos do documento).

Fluxo: na abertura do ticket, um receptor de sinal fica armado e o fluxo segue para Analisar Pedido. No iniciar de Analisar Pedido e de Assinar Documento, a flag do passo decide o sinal. Flag verdadeira e sem "Solicitar Cancelamento" ativa envia sinal que liga essa tarefa. A tarefa tem receptor de sinal acoplado para abortá-la. Flag falsa e tarefa ativa envia sinal a esse receptor, aborta a tarefa e rearma o receptor inicial. Executar "Solicitar Cancelamento" roda os scripts da situação Cancelado e encerra.

Indeferido notifica, roda os scripts Indeferido e encerra. Ajuste devolve ao solicitante. Deferido percorre a sequência; sem outra análise, ou gera documento ou encerra com os scripts Deferido. Documento com sequencial gera número antes da criação. Assinatura obrigatória percorre Assinar Documento até esgotar a sequência.

## Processos: interface current

Publicar gera classes do processo. `current` tem identificador `current`, o nome do processo, campos, métodos, configuração e as instâncias de todas as versões publicadas. Edição não publicada não entra em `current`. Cada versão publicada também gera uma classe cujo identificador é o número da versão, que segue a interface `current` e guarda só aquela versão.

O id de `current` muda por ambiente: o Sybox leva a versão; publicar no destino gera outro id. Busca pela árvore `_process.<identificador>.current` quebra se o identificador da classe mudar. Busca por `_utils.getMethod("_classId", id, "_search")` depende do id daquele ambiente.

O `_search` do exemplo filtra com `query.term` num campo. Um script lê `.hits` e depois trata de novo `.hits`. O script pela árvore lê `.hits.hits`.

Evento inicial de mensagem em `current` cria instância. O payload fica em `message` e os campos são os configurados no evento.

```javascript
_process.identificadorProcesso.current.identificadorEventoInicial({
    "message": {
        "campo": valor
    }
});
```

## Status do processo

Campo automático da instância. Valores da classe Status do Processo: Aberto (iniciado, em andamento ou aguardando), Concluído (fim sem pendência), Concluído com Erro (fim com falha), Completado (atividades executadas; finalização distinta de Concluído) e Abortado (interrompido antes do fim).

No BPM 2.0 está em Detalhes > Avançado. Nas versões anteriores, na raiz de Detalhes. O `_patch` usa `_object` ou `_pin` conforme o contexto. O `value` é o identificador do status. O artigo não publica esses ids; o exemplo usa a constante `STATUS_PROCESSO_ID.CONCLUIDO`. O `path` muda com a versão do BPM e, no artigo, não leva barra inicial.

```javascript
_utils.getMethod("_classId", _pin._class._id, "_patch")({
    "_id": _pin._id,
    "_operationsList": [{
        "op": "replace",
        "path": "_status",
        "value": STATUS_PROCESSO_ID.CONCLUIDO
    }]
});
```

```javascript
_utils.getMethod("_classId", _pin._class._id, "_patch")({
    "_id": _pin._id,
    "_operationsList": [{
        "op": "replace",
        "path": "processInstanceControl.status",
        "value": STATUS_PROCESSO_ID.CONCLUIDO
    }]
});
```

O primeiro path é BPM 1.0. O segundo é BPM 2.0.

## Subprocessos: multiplicidade e sincronismo (loopCounter)

Subprocesso embutido ou referenciado pode ter multiplicidade Sequencial ou Paralelo.

Sequencial: a próxima instância só nasce quando a anterior termina. Pelo menos um script é obrigatório. "Condição da Atividade Cíclica" devolve booleano; o exemplo continua enquanto o estado não é `"finalizado"`. "Número Máximo de Repetições" devolve inteiro ou o tamanho de uma lista. O exemplo de lista está grafado `lenght`.

Paralelo: "Número de Instâncias da Atividade" é obrigatório e devolve inteiro. Sincronização: Nenhuma (o fluxo segue sem esperar), Uma (espera uma instância), Todas (espera todas), Complexa (script devolve booleano).

Na atribuição de entrada, `_object._loopCounter` é o índice da instância.

```javascript
return _object.exemplo.estado !== "finalizado";
```

```javascript
_output.valor = valor[_object._loopCounter];
_output.outroValor = outroValor;
```

## Subprocessos embutidos

Processo desenhado dentro de um único pai. Não é reutilizado como o referenciado. Entrada por `_output` com campos do `_pin` do pai. No finalizar, os campos do embutido saem de `_object._pinEmbedded`.

Herda os papéis do pai. Publicar o pai compila as mudanças do embutido. Erro conhecido, sem causa no artigo: "Erro ao atribuir entrada do subprocesso."

```javascript
_output = {
    nomeDoSolicitante: _pin.nomeCompleto,
    idadeDoSolicitante: _pin.idade
};
```

```javascript
_pin.parecer = _object._pinEmbedded.parecerDoSolicitante;
```

## Supervisão das filas de mensagem

Pacote que reprocessa métodos em `ERROR` e notifica erros, por execução periódica de método. As classes "Mensagens travadas a Reprocessar" e "Mensagens travadas a Notificar" guardam objetos de Mensagem / Sistema em erro. A configuração é "Configuração - Supervisão da Fila".

Campos: Ativar Reprocessamento; Ativar para todos os métodos; configuração por método (classe, método em texto, limitar ou não o número, intervalos em horas desde a última tentativa); filas (id e identificador, copiados da classe Fila no pacote Sistema); ativar notificações; endereços; intervalo entre notificações em horas.

Sem limite, o método continua até o `ERROR` sumir. Teto da plataforma citado: 1000 mensagens travadas, as mais novas. Intervalo menor que 1 hora não é possível, nem no reprocesso nem na notificação.

## Obter ACL de tarefa de usuário

Método utilitário. Entrada: `usertaskIdentifier` (string) e `process` (instância). Sem um dos dois, lança `"Parametros não informados para execução do método;"`.

`_getTree` na classe da instância devolve `diagram`. A tarefa é `diagram.tasks` com o mesmo `identifier`. A raia é `diagram.horizontalLanes` cujo `_id` é `userTask.horizontalLane`. O papel é `process._processVersion.processRoles` cujo `_id` é `raia.settings.processRole`; usa-se `papel.identifier`. `_getAclProcessRole` devolve a ACL. Os usuários do papel estão em `acl[identificadorDoPapel].users`. Cada grupo é expandido por `_system._aclUserGroup._extGetUsersByUserGroup({ aclUserGroup: grupo })` e os usuários entram na mesma lista. A saída é essa lista.

A extensão em Grupo de Usuário exige `aclUserGroup._id`. O id `000000000000000000000039` devolve array vazio. Os demais buscam a classe de usuário `000000000000000000000002`, query `nested` em `aclUserGroups` com `term` em `aclUserGroups._id`, `size` 9999, e mapeiam `hits.hits` para `_source`. O artigo deixa em aberto a busca pela interface `_aclUser` (`000000000000000000000070`) e o ajuste quando o resultado passa do limite.

```javascript
const arvore = _utils.getMethod("_classId", processo._classId, "_getTree")(processo);
const acl = _utils.getMethod("_classId", processo._classId, "_getAclProcessRole")(processo);
const usuariosGrupo = _system._aclUserGroup._extGetUsersByUserGroup({ aclUserGroup: grupo });
```

## Gerador de evento de remuneração

Carga de rubricas por planilha, uma linha por evento de remuneração de colaborador. Colunas: Matrícula, ID do Item de Remuneração, Referência Número, Referência Unidade (exemplos `days`, `hours`, `value`), Vencimento, Desconto e Custo. Só um dos três valores é preenchido; os outros ficam zerados. Referência Número repete o valor preenchido. Outro formato nasce na classe "Template – Planilha".

Uso descrito: competência, classificação do evento, "Utilizar arquivo para gerar eventos de remuneração" como Sim, arquivo carregado, "Utilizar processador de arquivo" como Não, pré-visualização em modo avançado, salvar, e o botão "Gerar evento de remuneração". Sem assinatura de método.

## _aclInbox

Campo interno da instância: lista de ids de grupo de usuário e de usuário que podem atender alguma atividade aberta. Recalculado a cada atualização da instância, pelas atividades abertas e seus papéis. O valor `any` é sentinela.

No Obter Controle de Acesso do ticket, cada id diferente de `any` entra em `_acl.attendProcess.groups` e em `_acl.attendProcess.users`, ambos com `{ _id: inbox }`. O valor `any` empurra `PADRAO_GROUP` só em `groups`. O artigo não define `PADRAO_GROUP`.

Filtro de inbox: a lista de termos começa com `any` e `_user._id`, soma delegadores de `_system._aclUser._getDelegators({ userId: _user._id }).delegatorsList` e os grupos desses delegadores, e soma `_user.aclUserGroups`. O retorno é `terms` sobre `_aclInbox`.

```javascript
_system._aclUser._getDelegators({ userId: _user._id }).delegatorsList;
```

```javascript
return {
    "terms": {
        "_aclInbox": termos
    }
};
```

## _pinStarter

Atributo do subprocesso: referência à instância do processo que o iniciou. Só aparece na árvore dentro de um subprocesso. Lê qualquer campo do pai e também serve como o próprio pai.

Uma script task do filho chama método do pai passando `_pin._pinStarter`. Esse método executa com essa instância em `_object`. No exemplo, o método do pai dispara um evento de mensagem com `message.pinId` igual a `_object._id`. O texto uma vez grafa `_pinstarter`; o código usa `_pin._pinStarter`.

```javascript
_process.identificadorProcessoPai.current.identificadorMetodo(_pin._pinStarter);
```

## _elements

Campos do `_pin` (no script do próprio processo, o artigo lê `_object`) com um array de instâncias por elemento da modelagem. Várias passagens pelo mesmo elemento ficam no array. Não aceita `_patch`.

Cada instância expõe `_status`, `_executor` (quem executou), `_multiplicityData` (quantas instâncias existem, quantas completaram e se executou), `_nexts` (elementos seguintes) e `_waitingGateway` (gateway aguardando naquela instância).

O exemplo só lê o índice 0 quando `length > 1`. Uma única instância não entra nesse `if`.

```javascript
if (_object && _object._elements && _object._elements.userTask1 && _object._elements.userTask1.length > 1) {
    const taskStatus = _object._elements.userTask1[0]._status;
}
```
