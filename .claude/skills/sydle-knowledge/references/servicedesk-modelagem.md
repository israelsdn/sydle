# Modelagem (documentação oficial)

Contrato de modelagem do SYDLE ONE destilado da documentação oficial do service desk: pacote, classe, campo, método, referência, interface, campos de sistema, modificador volátil, histórico, expurgo, extrator, máscara, moeda, vetor denso, campo Script, extensão de classe, substituição de referências, proteção no SYBOX, limpeza de teste e as regras que os guias de reembolso e de compra usam ao modelar. O texto segue o que o artigo escreve. Assinatura, id ou passo que o artigo não mostra não é completado. Quatro páginas só têm título (Coleções, Modelagem, Campo Script e Extensão de classe); o corpo do campo Script está na Visão geral e o da extensão está na Introdução. Os dois destaques repetem os artigos técnicos: o de moeda acrescenta cards e gráficos; o de proteção não acrescenta regra além do artigo de campos desprotegidos.

## Estruturação dos dados

Modelagem é definir pacotes, classes e objetos. Pacote agrupa classes. O nome é texto livre e agrupa as classes nas listagens; dois pacotes com o mesmo nome aparecem como um só agrupamento. O identificador é o caminho em JavaScript e na API: alfanumérico com pontos, na convenção `<domínio_da_organização_invertido>.<nome_do_pacote>`. Os exemplos do artigo são `com.sydle.hr` e `br.com.empresa.crm`.

Classe define conteúdo (campos), relacionamento (referência) e comportamento (métodos). Na criação: nome, identificador (exemplos do artigo: `Usuario`, `NotaFiscal`, `Cliente`), pacote, tipo, interfaces seguidas, objetos buscáveis, campos, métodos, expiração do histórico em segundos e ajuda para edição. Tipo Padrão guarda objetos. Tipo Interface serve de definição para outras classes; objeto de classe que segue a interface aparece onde se espera a interface. Objetos buscáveis desligado é o caso de formulário embutido reaproveitável, como um endereço que só existe dentro de outro objeto.

Campo: nome, identificador (exemplos: `nome`, `valor`, `arquivo`), relevância, tipo, valor padrão, embutido (só referência), obrigatório, somente leitura, múltiplo, oculto e opções disponíveis. Nas opções, identificador é o valor de script e nome é o rótulo. Método: nome, identificador, um ou mais scripts executados na ordem e nível de acesso.

Objeto nasce pelo formulário ou por script, a partir dos campos da classe. O `_id` é gerado na criação, serve para armazenamento, relação e obtenção. Na tela, o primeiro campo de Campos do sistema é o ID. No combo de referência, o formulário de criação do objeto referenciado volta com esse objeto selecionado.

Histórico, neste guia: cada alteração gera uma entrada com a cópia dos campos como estavam antes, o usuário e a data. O detalhe de quando a entrada não nasce está no artigo de histórico.

## Configurações de classes

Relevância tem duas funções. No card entram Identidade e Destaque; Comum e Avançado ficam de fora. Na pesquisa, Identidade pesa mais e Comum pesa menos; Avançado não influencia.

Tipos citados: Booleano (`true`, `false` ou `null`); Data, com hora por padrão, preenchida em script com `Date`; Número inteiro de 32 bits; Número longo de 64 bits; Decimal de 32 bits; Texto; Arquivo; Referência, com a opção Embutido; Dinâmico, que assume qualquer tipo; Coordenada geográfica, latitude e longitude, com Google Maps no formulário.

Objetos buscáveis existem por conta própria e a classe entra na listagem. Não buscáveis são parte de outro objeto e a classe não entra na listagem. O guia de reembolso acrescenta que o conteúdo continua pesquisável dentro do objeto pai.

Referência simples é um link e só aceita classe buscável; é ela que alimenta a aba Dados, onde aparecem os objetos que apontam para o atual. Referência embutida grava o objeto inteiro e aceita classe buscável ou não.

Interface é um índice de pesquisa comum. Buscar pela interface inclui os objetos das classes que a seguem. A interface não é contrato: a classe que a segue não é obrigada a ter os mesmos campos e métodos.

## Automatização de classes

A árvore de expressões lista métodos (navegando pacote e classe), `_object`, `_pin` (instância; o exemplo é `_pin.tripData`), `_user`, `_oldObject`, `_metadata`, `_input`, `_output`, `_util` e `_utils`. Identificador com `_` inicial é nativo.

Toda classe tem operações comuns. Com permissão configurável e comportamento extensível, no que o artigo marca assim:

- Criar `_create`, Obter `_get`, Atualizar `_update`.
- Remover, nomeado `delete` na lista. O script roda logo antes da remoção. O exemplo chama `_delete`.
- Buscar `_search`. A permissão só pode ser alterada quando o nível de acesso do Obter é dinâmico.
- Obter Histórico `_getHistory`.
- Criar Rascunho `_createDraft`: preenche o formulário antes de o usuário vê-lo.
- Atualizar Rascunho `_updateDraft`: roda a cada mudança do rascunho na tela.
- Obter Metadata `_getMetadata`: altera exibição. Roda ao iniciar a tarefa e a cada mudança de campo. É o único método com `_metadata`. Também roda fora do rascunho, por exemplo na listagem, e nesse caso chega sem `_object`.
- Salvar `_save`: roda em toda criação e em toda atualização. Quem pode Criar ou Atualizar pode Salvar. O artigo não transcreve o restante do diagrama de herança.
- Obter Controle Acesso `_getACL`: visível quando algum método está com acesso dinâmico.

```javascript
if (!_object) {
    return;
}

if (_object.civilStatus === "married") {
    _metadata.fields.spouseName.hidden = false;
    _metadata.fields.spouseName.required = true;
}
```

O exemplo de Salvar valida com `throw` de string e preenche código, data e responsável quando estão vazios. O código sai de `_system._sequence.nextVal({ _id }).nextVal`. O artigo não descreve outros parâmetros desse método.

Chamada interna: `<pacote>.<classe>.<método>()`. Entrada e saída são JSON, lidos em `_input` e escritos em `_output`. O exemplo tanto atribui `_output.success` quanto substitui `_output` por um objeto. Se a chamada traz `_id`, a plataforma executa o `_get` da classe do método e, achando o objeto, preenche `_object`. Vários objetos vêm em `_objects`, cada item com `_id` e `_classId`; a plataforma preenche `_objects`.

```javascript
com.sydle.billing.Product.disableProduct({
    "_id": idDoProduto
});
```

```javascript
com.sydle.billing.product.disableProducts({
    "_objects": [
        {
            "_id": idDoProduto,
            "_classId": idDaClasse
        }
    ]
});
```

Os dois caminhos estão como o artigo escreve, inclusive a diferença de caixa em `Product` e `product`.

Criar: entrada são atributos da classe; o que não vier fica `null`; o retorno é o objeto criado; campo obrigatório vazio gera erro. Objeto embutido é um literal. O artigo marca como errado chamar `_create` para o embutido.

```javascript
_object.address = {
    "zipcode": "30535580",
    "city": "Belo Horizonte"
};
```

Obter: entrada `_id`, retorno o objeto. O artigo aponta outro guia para obter por campo único e não mostra essa chamada. Atualizar: entrada `_id` e atributos; o que não vier fica `null`; retorno o objeto atualizado; obrigatório vazio gera erro. Remover: entrada `_id`, retorno o objeto removido, exemplo `._delete({ _id })`. Buscar: entrada query do Elasticsearch, retorno o resultado da busca.

```javascript
com.sydle.billing.contract._search({
    "query": {
        "term": {
            "code": 10520
        }
    }
});
```

A API expõe todo método e devolve "Usuário não autorizado" sem permissão. O contrato escrito é POST em `https://<organização>.sydle.one/api/1/main/<pacote>/<classe>/<método>`, com `Authorization` Basic (credencial em base 64 no formato usuário:senha), `X-Explorer-Account-Token` da organização e `Content-Type: application/json`. O artigo não fixa o corpo além do JSON do método.

## Guia da tabela de campos

Legenda das tabelas dos guias de classe, tarefa de usuário e versão de processo. Os símbolos são Obrigatório, Múltiplo, Somente Leitura, Oculto e Negrito. Negrito é campo de processo e só aparece em tarefa de usuário. O exemplo lê `code` como campo de processo obrigatório, `seller` como referência a Fornecedor, `purchaseItens` como referência embutida múltipla e obrigatória, `totalValue` como somente leitura e `internalCode` como oculto.

## Coleções com cobertura

Cobertura de coleção existe a partir da versão 8.30. Não se configura cobertura na coleção: ela nasce nas coleções que têm executável de teste com cobertura ativa. O relatório mostra resumo, trechos cobertos e execuções. A cobertura da coleção agrega a de cada executável e coleção de testes que ela contém. A página Coleções, no mesmo grupo, não tem corpo.

## Solicitação de reembolso — modelagem de dados

O guia separa o que existe fora do processo (centro de custo, buscável) do que só existe acoplado (despesa, atribuição de custo, dados para depósito, não buscáveis). Pacote de exemplo: nome Financeiro, identificador `{{domínio_da_organização}}.finance`. Classes com o mesmo identificador podem coexistir em pacotes diferentes.

Campo texto com opções: identificador é o usado no script e valor é o apresentado. O guia manda preencher os dois iguais. Data sem hora fica em Avançado, Configurações Adicionais do Campo. Referência a usuário aponta a classe nativa do pacote Sistema.

No Explorer, a listagem à esquerda só mostra classe buscável, agrupada por pacote. O guia cita, para consulta durante a modelagem: Financeiro (centro de custo e, depois, a solicitação); Processo > Instância de Processo; Processo (Modelagem) > Processo e Versão de Processo; Sistema > Classe, Pacote, Grupo de Usuário e Usuário.

## Solicitação de reembolso — modelagem do processo

Processo nasce em Criação de Objetos. Grupo de processo funciona como pacote dos processos; com o mesmo nome do pacote de classes, a listagem junta os dois. Criar o processo cria a versão 1.0. Nova versão é cópia: Processo, Cópia de e Rótulo da versão. Ela só vale para instância nova depois de marcada como Versão atual, e a instância segue a modelagem da última publicação.

Publicar gera as classes de execução. Qualquer alteração, em qualquer parte, só vale depois de publicar de novo.

Campo da versão representa a instância e pode ser usado em vários elementos. Referência a classe não buscável exige Embutido verdadeiro. Nas tarefas, campo em negrito é campo de processo: ao concluir a tarefa, o valor no processo é atualizado para a tarefa seguinte. Campo criado só na tarefa não tem esse efeito.

Papel: nível de acesso, grupos, autorização e Ver no fluxo. No guia, todos os papéis ficam com Ver no fluxo verdadeiro. Autorização Gerenciar permite alterar executor, intervir e excluir instância; a decisão do guia reserva isso ao papel Administrador. A raia recebe o papel de mesmo nome. O papel Administrador não precisa de raia para a autorização valer. Há "Permite exclusão do processo?" na primeira tarefa e "Permite devolução?" nas tarefas em que outro usuário pode assumir.

`_object` na tarefa é a tarefa. Campo que está só no processo lê-se e grava-se em `_pin`. O Iniciar roda quando o fluxo chega na atividade. Para a primeira tarefa abrir sem o clique em Atender, o guia faz `_object._executor = _pin._requestor`. Status com relevância Destaque aparece no card da instância. Ao reentrar numa aprovação, o Iniciar zera o booleano e o motivo com `null`, para a decisão anterior não voltar preenchida.

Obter Metadata roda ao abrir a tarefa e a cada mudança de campo. O guia esconde o motivo até `approved === false` e, na aprovação, também o torna obrigatório. O guarda `if (!_object) return` está nas tarefas que leem `_object`. O filtro do gerente é uma query no campo referência:

```javascript
_metadata.fields.responsibleManager.query = {
    "nested": {
        "path": "aclUserGroups",
        "query": {
            "match": {
                "aclUserGroups.name": "Gerente"
            }
        }
    }
};
```

Atualizar Rascunho preenche valor durante a edição. O título da seção diz Alterar Rascunho; o texto identifica o método como Atualizar Rascunho. Finalizar roda ao Concluir; `throw` de string aparece para o usuário. O guia usa isso para exigir soma de rateio 100 e data de depósito no futuro.

Gateway exclusivo escolhe uma saída. As expressões são avaliadas e a primeira que retorna `true` segue; se nenhuma retornar, segue a conexão com Padrão verdadeiro. Campo de processo lido na conexão está em `_pin`. A conexão 1 do guia é `return _pin.responsibleManager && _pin.responsibleManager._id !== _pin._requestor._id`. A linha de explicação do artigo diz o contrário do `!==`: que o verdadeiro seria o gerente ser o próprio solicitante.

Temporizador intermediário dispara na data retornada: `return _pin.depositDate`. Evento de erro acoplado acrescenta um botão; o Código do Erro é o rótulo (no guia, "Não recebido"). O botão conclui a tarefa com erro e o fluxo segue pelo acoplamento. Documentação do processo é HTML, em Avançado, e aparece ao abrir o processo fora do modo de edição.

## Solicitação de compra — modelagem de dados

Mesma distinção do reembolso. Dois pacotes de exemplo: `{{domínio_da_organização}}.internal` (unidade administrativa, buscável) e `{{domínio_da_organização}}.purchase` (fornecedor e pedido buscáveis; item de compra e cotação não buscáveis). Referenciar item não buscável exige Embutido verdadeiro. Opções de texto: identificador e valor iguais; identificador no script, valor na tela. Data da compra é tipo Data, sem a marca de data sem hora nesse campo.

## Solicitação de compra — modelagem do processo

Identificador de exemplo do processo: `purchaseRequest`. Grupo Compras. Publicação, versão copiada, campo de processo, papel, raia e gateway exclusivo seguem as regras do guia de reembolso. O que este guia acrescenta:

Campo múltiplo ligado na versão já fica múltiplo em todo componente que o usa. Relevância Avançado não é Oculto: o campo aparece no bloco Avançado, no rodapé da instância. Oculto não é exibido.

Papel dinâmico: entram no script os objetos de usuário e de grupo em `_acl.users` e `_acl.groups`. Na versão de processo, `_object` é a instância. O papel Técnico deixa de ser Público porque Público ignora o responsável escolhido na instância.

```javascript
if (_object.responsibleForTechnicalAnalysis) {
    _acl.users.push(_object.responsibleForTechnicalAnalysis);
}
```

O exemplo de supervisor, se não houver `superior` no usuário solicitante (`_object._requestor.superior`), obtém o grupo com `_system._userGroup._get({ _id })` e faz `_acl.groups.push`. O exemplo de alçada escreve `_acl.groups.concat(groups)` e não usa o retorno. Os `_id` desses `_get` são os do ambiente do artigo, não um id fixo de plataforma.

Identificador da tarefa só deve ser trocado enquanto ninguém o usou. O guia usa `userTaskFillInPurchaseInformation`, `userTaskAttachProposals` e `userTaskRequestAnalysis` para o Obter Metadata do embutido achar a tarefa. `_parent` é quem contém o objeto. Item dentro de cotação dentro da tarefa sobe dois níveis. Cada passo do caminho é testado antes do acesso.

```javascript
if (!_object) {
    return;
}

if (_object._parent && _object._parent._identifier === "userTaskAttachProposals") {
    _metadata.fields.provider.readOnly = true;
}
```

Travar inclusão e exclusão é igualar `minMultiplicity` e `maxMultiplicity` ao tamanho já gravado, no campo múltiplo da tarefa e no embutido. Opções montadas no metadata usam `valueOptions.push` com `identifier` e `value`. `_metadata.editHelp` aceita HTML. `_metadata.fields.jurisdictionApproved.name = "Aprovado?"` troca o rótulo; o artigo atribui string a `name`, sem caminho de idioma.

Tarefa múltipla: em Avançado, Multiplicidade do tipo Paralelo e Sincronização Todas. O fluxo segue quando todas concluem. Número de Instâncias retorna inteiro (`return _pin.price.length`). No Iniciar, `_object._loopCounter` é o índice, começando em 0. Campo múltiplo recebe array: o guia substitui as cotações pela escolhida com `[_object.price.find(...)]`.

Pedido é objeto de classe concreta, criado no Finalizar com `<pacote>.<classe>._create`. O caminho do guia é `com.sydle.training.order._create`. Sem `_id` no retorno, o guia lança erro. Cotação embutida não passa por `_create`.

Alçada: classe Alçada não buscável (`minValue`, `maxValue`, grupos) embutida na Tabela de alçadas, esta sim buscável. Mínimo vazio significa sem piso; máximo vazio significa sem teto. O método da versão, `getJurisdictionGroups`, devolve `_output.groups`. Ordena as faixas por `minValue` crescente e fica com a primeira em que o total está entre o mínimo e o máximo, tratando vazio como aberto. Sem a tabela, `throw "Tabela de alçadas não foi encontrada."`. A chamada do guia é `_process.purchaseRequest.current.getJurisdictionGroups({ _id })`; o `_id` faz o método enxergar a instância em `_object`. O identificador do processo é o do objeto em Processo (Modelagem) > Processo.

Supervisor aprova é texto com opções Sim, Não e Necessita revisão, identificador igual ao valor. As conexões comparam essas strings em `_pin`. A conexão da alçada só segue se o gestor aprovou e `getJurisdictionGroups` devolveu algum grupo.

## Campos de sistema

Todo objeto nasce com campos de prefixo `_`. Eles não entram no editor de campos. A plataforma calcula o valor; sobrescrever direto é ignorado. Dá para consultar, filtrar e exibir. Os marcados abaixo como raiz não existem em objeto embutido.

- `_id`: gerado na criação, imutável, chave padrão de localizar, referenciar e atualizar, inclusive `{ _id }` nos métodos de sistema. Buscável por padrão.
- `_class`: referência à classe da criação, imutável. Buscável por padrão.
- `_classRevision`: revisão da definição usada na última normalização. Atualiza quando a classe muda e o objeto é regravado.
- `_creationDate`, `_creationUser`: raiz, imutáveis, buscáveis por padrão.
- `_lastUpdateDate`, `_lastUpdateUser`: raiz, atualizados a cada gravação bem-sucedida, buscáveis por padrão.
- `_publishedObject`: só em entrada de histórico; aponta o objeto publicado do qual aquela entrada é versão anterior.
- `_revision`: raiz. Muda a cada atualização bem-sucedida. `_update` e `_patch` rejeitam escrita baseada numa revisão que já não é a vigente.
- `_protected` e `_unprotectedFields`: raiz. Proteção contra sobrescrita; o uso no SYBOX está na seção de campos desprotegidos.
- `_size`: raiz, buscável por padrão. Estimativa em bytes, recalculada a cada gravação, sem configuração extra. Classe e objeto nativos já vêm calculados a partir da 8.38.0; objeto de classe do usuário recebe o valor na próxima gravação. O limite da organização, em bytes, tem padrão 8388608 (8 MiB), abaixo do teto de 16MB do MongoDB. Acima do limite, a gravação emite log de aviso com organização, classe, identificador, tamanho estimado e limite. O artigo não diz que a gravação é recusada.

## Modificadores

A partir da 8.25.0. Modificador em classe e interface muda armazenamento, processamento e ciclo de vida. Interface já implementada não aceita inclusão, alteração nem remoção de modificador. A classe concreta tem de suportar o modificador da interface: classe padrão não implementa interface volátil, e classe volátil não implementa interface não volátil.

Volátil guarda o objeto só no Elasticsearch, sem o banco, em troca de integridade referencial e de transação. A classe nativa Log, e as classes de extrator de log, são as primeiras nativas voláteis. O artigo indica o modificador para muita criação e pouca atualização ou exclusão: log, telemetria, evento, classe analítica.

Todo objeto volátil é buscável. A indexação padrão é assíncrona, sem garantia de busca imediata. Não há histórico. A concorrência usa `_revision`, como na classe padrão, sem atomicidade estrita. Não há campo calculado nem único. A classe não pode ter referência forte saindo dela nem chegando nela. Referência forte, no artigo, é a que impõe integridade: campos disponíveis para busca diferentes de "Apenas referência" e/ou, na remoção do referenciado, Bloquear, Deletar em cascata ou Atribuir nulo. Volátil pode ser embutido em qualquer classe e só embute outra classe volátil. `_save`, `_delete`, `_getACL` e `_getMetadata` não são extensíveis. Não há tag. Não se adiciona nem se remove o modificador se a classe já tem objetos.

## Configurações avançadas de campos

Opção disponível tem nome (rótulo) e identificador (script). Valor fora dos identificadores lança exceção, inclusive valor vindo de script. Dá para montar a lista no Obter Metadata com `valueOptions.push` de um objeto `identifier` e `value`. O exemplo deste artigo está sem vírgula entre as duas propriedades; o guia de compra escreve o objeto com as duas.

Único: a cada alteração, por formulário ou script, outro objeto com o mesmo valor gera "Já existe um objeto com o <nome_do_campo> = <valor_do_campo>."

Calculado: o script define `_value`. O valor não é gravado pelo usuário. Recalcula quando o objeto é alterado (Momento de cálculo Na escrita). Na leitura existe como opção antiga e está deprecada.

Criptografado não volta na API. Reversível usa AES e o script lê o valor original. Irreversível usa BCrypt: o script não lê o original e pode comparar. Valor que não seja um dado já criptografado pela plataforma gera "Valor criptografado inválido."

Obrigatório é exigido quando o valor obrigatório está verdadeiro imediatamente antes de persistir, nos fluxos `_create`, `_update` e `_patch`. O valor tem de ser diferente de `null`. Em referência embutida obrigatória, a plataforma valida o embutido e os obrigatórios de dentro dele.

Antes de persistir, valor fora do tipo, do formato, do limite ou da unicidade é rejeitado. Nada inválido é gravado em silêncio, convertido ou ignorado. A exceção interrompe a operação e nenhuma alteração daquela operação é persistida. Mensagens que o artigo escreve:

- O campo "<nome_do_campo>" é obrigatório.
- O campo "<nome_do_campo>" não possui "<valor>" na sua lista de valores permitidos.
- O campo "<nome_do_campo>", que é único e múltiplo, não pode ter valores nulos.
- O campo "<nome_do_campo>" deve ser maior ou igual a "<valor_mínimo>", ou menor ou igual a "<valor_máximo>".
- O campo <nome_do_campo> aceita no máximo <valor> caracteres.
- O campo "<nome_do_campo>" deve possuir no mínimo/máximo <valor> itens.
- O valor do campo "<nome_do_campo>" é inválido. Formato válido: 19.9352.
- Não pode ser removido devido à dependência do campo "<campo>" em "<classe>" (não permite valor vazio). Essa última ocorre quando Ao remover atribuiria `null` a um campo obrigatório: a remoção do referenciado é bloqueada.

Arquivo acima do tamanho ou fora das extensões também lança exceção; o artigo não cita o texto.

Booleano: `true`, `false` ou `null`. Obrigatório não aceita `null`.

Data guarda hora, salvo Data sem hora. Script usa `Date` (`_object.dueDate = new Date()`). Tudo é persistido em UTC. Data sem hora grava o dia às `00:00:00Z`. GMT local grava o relógio digitado com sufixo `Z`, sem converter fuso, e a tela mostra esse mesmo relógio para outro fuso. Data com hora converte para o fuso de quem vê. Com Data sem hora, `getDate()` usa o fuso do usuário: o exemplo `2019-11-25T00:00:00.000Z` devolve dia 24 no Brasil. O dia persistido sai de `getUTCDate()`.

Número: inteiro de -2.147.483.648 a 2.147.483.647, com mínimo e máximo opcionais. Número longo: -9.223.372.036.854.775.808 a 9.223.372.036.854.775.807, com mínimo e máximo. Decimal: 32 bits, com mínimo, máximo e, a partir da 8.20, a opção Vetor denso.

Texto: simples (sem quebra de linha), longo, script, HTML, Markdown ou link. Link exige `http://` ou `https://`. Sintaxe do script, a partir da 8.5 no Workspaces novo: JavaScript, JSON, HTML, XML e Python. Placeholder do campo muda em `_metadata.fields.<nome_do_campo>.placeholder`. Internacionalizável existe só em Texto e guarda um valor por idioma do ambiente.

Arquivo: Extrair conteúdo, se verdadeiro, indexa o texto do arquivo para pesquisa.

Referência: Embutido, como no artigo de configuração de classes. Query filtra o combo; o exemplo é `{ "match": { "name": "Gerente" } }`. Ao remover: Bloquear; Atribuir valor nulo; Remover em cascata; Ignorar (o referenciado some e o campo permanece; o artigo diz que é uso mais interno). Campos disponíveis para busca apontam o guia de indexação; este artigo não lista os modos.

Dinâmico: o tipo e as configurações saem do Obter Metadata. O artigo não nomeia a propriedade de `_metadata` que define o tipo.

Identificador: texto sem as variantes de conteúdo do Texto. Feito para dado hexadecimal, como o ObjectId. É o tipo interno de campos como `_id`. No motor de busca fica `keyword`, comparação exata, sem subcampo de análise.

Coordenada: latitude e longitude em graus decimais, Google Maps no formulário, e pode alimentar Analytics.

## Formatação de moeda

Classe Moeda, identificador `_currency`, segue a ISO 4217. Moeda personalizada nasce sem o campo ISO. O código de três letras é o da lista ISO (o artigo cita BRL e EUR).

No decimal, o tipo de exibição Padrão mantém a formatação numérica. Moeda e Moeda dinâmica formatam pela moeda: ISO usa o padrão internacional; personalizada usa o símbolo escolhido. As casas decimais vêm da moeda, e o valor monetário sai com as casas completas. A localidade padroniza os dois tipos.

Moeda fixa exige a moeda nas configurações de exibição. Moeda dinâmica só existe se a classe tiver pelo menos uma referência à classe Moeda; o decimal escolhe qual campo referenciar. Sem moeda selecionada, a dinâmica usa duas casas e separador de milhar.

O destaque da mesma função afirma que a formatação também aparece em cards e gráficos. Não acrescenta outro contrato.

## Extrator de dados

A partir da 8.26.0, em caráter experimental. Extrai de uma classe, transforma em script e carrega numa classe de destino. A classe de destino não se escolhe no cadastro do extrator: o vínculo é o campo Extrator de dados na classe de destino. Essa classe tem de ter o modificador Volátil. Uma classe tem um extrator, e um extrator carrega uma classe.

Campos do extrator: nome, identificador, classe de extração, filtro opcional, script de transformação, expiração em minutos, paralelismo e notificações. Expirado, o dado é considerado obsoleto e a consulta por objeto de Analytics dispara a regeração. Paralelismo Automático é obrigatório quando a classe de extração é volátil; Manual é um número fixo.

No script, `_input.objects` é o lote e `_output.transformedObjects` é a carga. As duas listas têm o mesmo tamanho, posição a posição. Cada posição é um objeto (1 para 1), uma lista (1 para N) ou `null` (não carrega). Expansão e `null` existem a partir da 8.27.0. Cada objeto de origem gera no máximo 1.000 objetos no destino. O lote é partido pelo paralelismo: o script não depende da quantidade total nem da ordem. A execução é assíncrona.

A carga é completa: no sucesso, os dados anteriores do destino são substituídos. O artigo adia carga incremental para entrega futura. Disparo: ação Extrair e carregar dados, acesso a Analytics com dado expirado, ou script. Os três são assíncronos.

```javascript
_system._dataExtractor.extractAndLoad({
    "_id": "60d5ecb8b4934729837d3a12"
});
```

O `_id` acima é o exemplo do artigo. A entrada obrigatória é `_id` string do extrator. Erro se o `_id` não existe ou se o extrator não tem classe de carregamento. O método não descreve retorno.

## Histórico de objetos

Cada atualização bem-sucedida grava uma entrada: cópia do objeto inteiro como estava imediatamente antes, não um diff e não uma foto periódica. Cinco atualizações geram cinco entradas. A entrada é um objeto navegável. O método de permissão é Histórico, em todas as classes. A tela mostra versão, data e usuário.

`_update` e `_patch` geram histórico. Publicar rascunho também, porque segue o mesmo fluxo. `_create` não gera: a primeira entrada só existe depois da primeira atualização. Gravação sem alteração estrutural, por rascunho, `_patch` ou `_update`, não gera entrada.

Expiração do histórico, em segundos, é configuração da classe. Zero desliga o histórico. Acima de zero, cada entrada vale a partir da própria criação. O padrão é 2.592.000 segundos (30 dias). O expurgo não ocorre na escrita: uma rotina periódica remove o que já passou do prazo, então a entrada pode permanecer além do prazo até a próxima rodada. `_delete` remove o objeto e todas as entradas; não há consulta de histórico de objeto que não existe mais. Classe volátil não gera histórico, como está no artigo de modificadores.

## Vetor denso

A partir da 8.20, configuração adicional do Decimal, mapeada como dense vector no Elasticsearch. Características fixas: não múltiplo, oculto, não único, sem valor padrão. Dimensões de 1 a 4096. Tipo de elemento `float` ou `byte`. Métrica: Produto Escalar ou Cosseno.

O vetor indexado tem de ter dimensão menor ou igual à configurada; se for menor, a plataforma completa com zeros. `byte` só aceita inteiro de -128 a 127; `127.0` vale, `0.5` não. Produto Escalar com `float` exige vetor normalizado, magnitude 1. Cosseno exige magnitude diferente de zero. Fora disso o Elasticsearch erra.

Mudar qualquer configuração do campo reindexa a classe inteira e grava o vetor como nulo no Elasticsearch. Os valores precisam ser redefinidos.

Em script o campo é um array. Não se altera elemento (`meuVetor[0] = 5`) nem se adiciona ou remove item. A única operação é atribuir um array novo (`meuVetor = [1.0, 2.0, 3.0]`). Array mais curto é completado com zeros. A validação ocorre nessa atribuição.

## Campos decimais

A exibição não altera o número gravado. Padrão usa casas, separador de milhar e zeros à direita. Moeda e Moeda dinâmica delegam as casas à moeda, como no artigo de formatação.

Casas decimais são o máximo exibido, com arredondamento (1,237 em duas casas vira 1,24). Separador de milhar liga ou desliga o agrupamento. Exibir zeros à direita existe a partir da 8.40 e nasce desligado. Ligado, completa até o número de casas configurado; o padrão de casas é 15, então ligar a opção sem reduzir as casas exibe 15 casas. Tabelas, extrações e agrupamentos do Analytics seguem a opção. A tela do Workspaces depende da versão do SYBOX WORKSPACES; o artigo não informa o número dessa versão.

No `_getMetadata`, as propriedades são `decimalPrecision`, `thousandSeparator` e `trailingZeros`. O trecho do artigo atribui as duas abaixo; `thousandSeparator` só aparece no nome:

```javascript
_metadata.fields.decimalField.decimalPrecision = 2;
_metadata.fields.decimalField.trailingZeros = true;
```

## Máscaras de campo

Só em campo texto. O objeto é da classe Máscara, em Sistema > Máscara, criado por Administrador ou Modelador de classes, e referenciado nas configurações de exibição do campo. Campos da máscara: Nome, Prefixo, Máscara, Limpar se não cumprir e Descartar caracteres especiais. O valor mascarado aparece em formulário, card, analytics e objeto.

Prefixo é exibido na edição e na visualização e não é armazenado, mesmo com Descartar caracteres especiais falso. Tokens: `0` dígito, `9` dígito opcional, `A` letra ou dígito, `#` letra ou dígito opcional, `S` letra, `P` letra opcional. `*` é multiplicidade de 1 a N do tipo anterior (`0*` é dígito ilimitado). Caractere opcional pode impedir remontar a máscara na visualização se os especiais forem descartados. Especiais de formatação: `- ; / @ ( [ ) ] , " . ' : +` e espaço. Descartar caracteres especiais grava sem eles. Limpar se não cumprir apaga o que não cumprir a máscara.

## Expurgo de objetos

A partir da 8.5. A rotina roda em dias do ambiente; a periodicidade está no acompanhamento de operação, não neste artigo. Classe padrão, buscável ou não, e interface com objetos buscáveis têm, nas configurações avançadas, um campo Configuração de Expurgo. Cada classe tem uma configuração, e o campo só lista a configuração da própria classe. A configuração entra na próxima rodada se estiver salva nesse campo e com Habilitar Expurgo verdadeiro.

Configuração de Expurgo: classe de expurgo (padrão, buscável ou não; interface só se for buscável; interface selecionável a partir da 8.22), habilitar, classe de busca, consulta, descrição (a partir da 8.22) e classes a serem expurgadas antes. A classe de busca oferece as interfaces que a classe de expurgo segue e a própria classe, se ela for buscável. A consulta roda no `_search` dessa classe. Serve quando a classe de expurgo não é buscável, mas uma interface é, ou quando o campo só é buscável na interface.

A consulta é o miolo da Query DSL, o que ficaria dentro de `query`. `{ "query": { "match_all": {} } }` é o exemplo inválido do método Validar Consulta. `{ "match_all": {} }` é o válido. Com classe de busca interface, campo da classe concreta usa o prefixo `_concreteFields.`: `{ "term": { "_concreteFields.identifier": "cpf" } }`. Validar Consulta roda no rascunho. Testar Consulta roda no objeto salvo e devolve uma amostra mais o total.

Classes a serem expurgadas antes resolvem referência que bloquearia a remoção. A execução é uma classe depois da outra. A ordem só é garantida por essa lista.

Acompanhamento de Expurgo fica na interface Acompanhamento de Operação e permanece depois da rotina. Status: Em andamento, Concluído, Concluído com erro, Abortado e Interrupção resolvida. Abortar execução, só em andamento, para antes do próximo lote e marca Abortado. Interrupção de Expurgo nasce quando falhas ou percentual de erro atingem um valor predeterminado; o artigo não informa esse valor. Enquanto o acompanhamento tiver interrupção, a configuração não entra na rodada seguinte. Marcar Interrupção como Resolvida apaga a interrupção e libera a configuração.

A rotina remove em lote. O script do método Remover não roda nesse caminho.

## Substituição de referências

Troca em massa referências simples de um objeto publicado (`from`) por outro (`to`). Os dois são da mesma classe, tipo Padrão, e já publicados. Na tela, o método Substituir referências está na classe Organização/Sistema (interface Configuração/Sistema), no menu Mais opções, para o grupo Administrador. O combo de classes da tela só lista classe buscável. Classe não buscável fica no método de script.

Não altera objeto protegido. Não substitui referência embutida. Não executa o script de Salvar nem interceptador associado a essa atualização. A indexação é a de um `_patch` com indexação assíncrona. O histórico de cada objeto alterado segue a configuração da classe dele. Campo Único que ficaria duplicado não é trocado; o erro entra na contagem e, em executável de script, o log usa o marker `UNEXPECTED_REPLACE_REFERENCE_ERROR`.

O artigo descreve a entrada como objeto com `from`, `to` e `configs`. `from` e `to` aceitam o retorno de `_search` ou `_get`, ou um objeto com `_classId` e `_id`. `configs.maxReplaces` é número, teto 1000 por chamada; sem `configs`, o valor usado é 1000. O exemplo de chamada passa dois argumentos posicionais:

```javascript
_output = _utils.object.ObjectService.replaceReference(from, to);
```

A saída tem `remaining`, `processed`, `protectedObjects` e `errors`, todos número. O exemplo de Grupo de Usuário usa `_classId` `000000000000000000000005`. Log de executável de script traz `objectId`, `classId`, `path`, `from` e `to` de cada troca.

## Campo do tipo Script

O arquivo Campo Script não tem corpo. O contrato está no artigo Visão geral. Disponível a partir da 8.26 do SYDLE ONE e da 2.53 do Workspaces. Diferente do Texto com conteúdo Script, o valor é objeto e a execução é o método `execute`, sem `eval`.

Propriedades: `content` (pode ser `null`), `name` (I18n, pode ser `null`; se ausente, o nome exibido deriva do campo, do índice se for múltiplo, e da extensão), `language` (obrigatório: `JS` ou `PY`; Python está no artigo próprio) e `version` (`RHINO`, `GRAAL` ou `DEFAULT`). O padrão de `version` é `GRAAL`. O artigo diz que, no momento, não dá para selecionar outro valor.

`execute` recebe um único objeto. Cada propriedade vira variável global no `content`, com o mesmo nome. O retorno do `content` é o que for atribuído a `_output`. Lista ou argumentos posicionais não viram globais. Em campo múltiplo, os itens rodam do índice 0 em diante, compartilham `_output` e os parâmetros, e `perform` segue a mesma regra dos métodos de classe. No exemplo, os trechos anteriores ao `perform` rodam na ordem dos índices e os posteriores voltam na ordem inversa.

Usado como string, concatenação ou `String(...)`, o objeto vira `content`. `name._current` é o idioma atual; `name.pt` e `name.en` são os idiomas citados.

Não há valor único nem valor padrão do campo inteiro. Linguagem e versão padrão ficam nas configurações adicionais. Identidade ou Destaque destaca `name`. Na persistência de múltiplo: `name` não se repete, todos os itens têm a mesma `version`, e a lista não tem `null` nem `undefined`. A configuração de exibição pode impedir trocar a linguagem pela IDE.

Configurações adicionais: `language`, `version` e `isAsync` (Promises com async/await, só JS e GRAAL). `additionalContext` documenta os parâmetros de `execute` e aparece na árvore da IDE. Não valida o que foi passado. Cada item tem chave obrigatória, descrição I18n opcional, tipo obrigatório e configuração do tipo. Tipos: `string`, `integer`, `long`, `double`, `date`, `boolean`, `object`, `function`, `file`, `geopoint`. Número, número longo, decimal, data, booleano, arquivo e coordenada têm Múltiplo e Opcional. Texto também tem Internacionalizável. Objeto é referência a uma classe (`classRef` com `_id` e `_classId`) ou lista de subcampos; Múltiplo e Opcional valem para o objeto inteiro. Função pode declarar parâmetros e retorno. No `_getMetadata` a lista se altera como `valueOptions`: o artigo mostra `push`, `indexOf` e `length()` e, nas linhas de exemplo, usa os identificadores `minhaRegra`, `numericalField` e `stringField`.

```javascript
_metadata.fields.minhaRegra.additionalContext.push({
    "key": "loteId",
    "description": "Identificador do lote em processamento",
    "type": "string",
    "typeConfig": {
        "multiple": false,
        "optional": false,
        "isI18n": false
    }
});
```

## Python no campo Script

Experimental a partir da 8.27, só com motor `GRAAL`. O retorno continua em `_output`. Dá para chamar método da plataforma (`_get`, `_getMetadata`, `_utils`, método customizado) e há interoperabilidade com JavaScript no GRAAL: um script chama método feito na outra linguagem e usa o retorno. O exemplo percorre `metadata.fields` e lê `field.required` e `field.name`. Data devolvida por `_utils.calculateNextDate` é usada com `strftime` e com `.year`, `.month` e `.day`. A expressão cron do exemplo é `"0 0 0 ? * * *"`. O artigo não documenta outros parâmetros desses métodos aqui.

Ambiente virtual Python, experimental a partir da 8.31, lista bibliotecas. Nesta entrega só entram bibliotecas puramente Python. Salvar valida a biblioteca e as dependências; o que usa recurso não suportado não passa. A construção do ambiente é assíncrona e gera notificação. Os exemplos citados são `attrs`, `fastjsonschema`, `packaging`, `pyparsing`, `toolz` e `typing_extensions`. Biblioteca compilada, como pandas e numpy, não é suportada.

Exportação de SYBOX para versão anterior não é suportada quando há objeto ou classe com Python. Biblioteca nativa do Python, como `math`, não exporta para anterior à 8.27. Biblioteca do ambiente virtual não exporta para anterior à 8.31.

## Extensão de classe

O arquivo Extensão de classe não tem corpo. O contrato está na Introdução. Uma extensão é objeto da classe de sistema `_eClassExtension`. Ela aponta a classe estendida e pode reunir observadores, interceptadores, métodos de extensão e sobrescrita de ACL. Os dados gerais (nome, classe estendida, prioridade e views) ficam em Editar dados gerais. Cada função tem o método de tela Configurar correspondente; a chamada de interceptadores e a de métodos de extensão substituem a lista anterior por inteiro, como dizem os artigos dessas funções.

Várias extensões podem apontar a mesma classe. `priority` ordena a precedência: quanto menor o número, maior a precedência. O padrão, quando não informado, é 10. `NON_EXTENSIBLE` impede interceptar o método. `NON_OBSERVABLE` impede observador.

## Observadores

A partir da 8.35. Reagem a um método da classe estendida chamando um método de outra classe, de forma assíncrona, sem bloquear o fluxo. Disparam em toda execução do método observado, venha de script, API ou outro mecanismo. Método `NON_OBSERVABLE` não aparece na lista.

Numa extensão, no máximo um observador por par método e momento. O segundo para o mesmo par é erro de validação. Outro observador no mesmo momento exige outra extensão. Momentos: Antes da execução (entrada e, quando houver, o objeto) e Depois da execução (entrada e resultado). Ao salvar, a plataforma cria o tópico da classe estendida, se ainda não existe, e registra o subscriber para a classe e o método observador.

O observador lê `_input.data`:

- `input`: parâmetros do método observado, nos dois momentos.
- `output`: só depois. Formato `isSuccess`, `value` no sucesso e `error` na falha.
- `object` e `oldObject`: dependem do método e do momento.
- `subscriberIdentifier`: nos dois momentos.

Para `_create`, `_update` e `_patch`, que compartilham `_save`: antes, `object` é o estado atual e não existe no `_create`; `oldObject` não vem. Depois, `object` é o resultado e `oldObject` é o estado anterior, ausente no `_create`. Nos demais métodos, `object` é a instância quando a chamada trouxe `_id`. `oldObject` só existe em `_delete`, com o mesmo valor de `object`, já no Antes.

Se o método observador chamar de novo o método observado, a plataforma não dispara observador nessa chamada interna.

## Criando um observador

O passo a passo usa uma extensão da classe observada e o método Configurar observadores. O exemplo observa Atualizar e aponta Registrar log de outra classe, no momento Depois da execução. O script lê `_input.data.output` e `_input.data.input` e registra com o logger abaixo. Falha do método observador não altera o resultado: o método observado já retornou. O log fica nos objetos da classe Log.

```javascript
const output = _input.data.output;
const input = _input.data.input;
const logger = _utils.logging.Logger.getLogger("Produto.atualizar");

if (output.isSuccess === true) {
    logger.info("Método atualizar executado com sucesso.");
} else {
    logger.atError()
        .withMessage("Método atualizar falhou.")
        .addKeyValue("erro", output.error)
        .log();
}
```

`Produto.atualizar` é o nome de logger do exemplo. O artigo não descreve outros métodos de `Logger`.

## Interceptadores

Executam script antes, depois ou em volta do método, no mesmo fluxo, de forma síncrona. Cada chamada de Configurar interceptadores substitui a lista da extensão. Vários interceptadores no mesmo método, na mesma extensão ou em outras, ordenam-se por `order`: o menor executa primeiro e envolve os seguintes até o método original.

Método `NON_EXTENSIBLE` não entra na lista. Interceptador que já existia antes do método ficar `NON_EXTENSIBLE` continua na lista. Sem `perform()`, o método original roda ao fim do script. Com `perform()`, o original, ou o próximo interceptador, roda naquele ponto. O interceptador roda mesmo se o método não tem script próprio, e também quando a chamada é indireta.

```javascript
_utils.log("antes do método original");
perform();
_utils.log("depois do método original");
```

Exceção do método original, chamada via `perform()`, continua para quem chamou. Um `try/catch` em volta de `perform()` não a silencia.

Sobrescrita de ACL ou método de extensão com acesso `DYNAMIC` exige interceptador de `_getACL` na extensão. Se não houver, a plataforma cria. Se for removido enquanto ainda existir configuração `DYNAMIC`, ele volta e um aviso é exibido.

## Métodos de extensão

Acrescentam método novo à classe estendida, chamável por script, API e o restante dos mecanismos, e visível no autocomplete. Configurar métodos de extensão substitui a lista inteira. O identificador começa com `_ext`. Se o rascunho for salvo sem o prefixo, a plataforma o acrescenta. Não pode coincidir com método de sistema nem com redirecionamento já existente na classe.

ACL: `PUBLIC`, `EXPLICIT`, `INHERIT` ou `DYNAMIC`. `DYNAMIC` exige o interceptador de `_getACL`; se faltar, é criado. Dois métodos de extensão com o mesmo identificador na mesma classe: vale o da extensão com `priority` numericamente menor. Trocar a classe estendida mantém os métodos, exceto os `DYNAMIC`, removidos se o `_getACL` da nova classe for `NON_EXTENSIBLE`.

## Sobrescrita de ACL de métodos

Troca o nível de acesso de um método existente e preserva script e identificador. Nunca aparecem na lista: `_getACL`, `_save`, `_updateDraft`, `_createDraft`, `_getMetadata`, `_patch`, `_patchDraft` e `_getDraft`.

`accessLevel`: `PUBLIC`, `EXPLICIT`, `INHERIT` ou `DYNAMIC`. Grupos e usuários explícitos aparecem em `EXPLICIT` e em `DYNAMIC`. `aclSpecifiedBy` aparece em `INHERIT` e indica de quais métodos a ACL é herdada. `DYNAMIC` cria o interceptador de `_getACL` se ele não existir. Duas sobrescritas do mesmo método: prevalece a extensão com `priority` numericamente menor.

## Limpeza automática de testes e coleções

A partir da 8.38. Ao fim de um executável de teste, as escritas CRUD interceptadas viram um arquivo `.sybox` de Reversão, cuja instalação desfaz o que o teste gravou. Coleção não gera reversão própria: encadeia a limpeza dos filhos que a têm ligada.

No teste, em Configurações comuns: `generatesUndo` (Gerar reversão) intercepta as escritas e gera o arquivo; `autoCleanUp` (Limpeza automática) aplica esse arquivo sem ação manual. Limpeza automática só liga com Gerar reversão; desligar Gerar reversão desliga a limpeza. Coleção não tem os dois campos.

Teste isolado aplica a reversão ao concluir. Teste filho de coleção só gera o arquivo e fica com Estado de reversão Gerado; a aplicação espera o executável raiz terminar, para um teste não apagar dado que o seguinte ainda usa. No fim, a árvore é percorrida do último filho ao primeiro. Coleção sequencial reverte na ordem inversa da execução. Coleção paralela reverte todos os elegíveis, sem ordem entre irmãos. Falha num teste não para os outros e não sobe para a coleção: fica como Erro na aplicação naquele teste.

O cascade não roda se a raiz é abortada ou falha por infraestrutura; as escritas ficam para investigação. Erro ou Instável de asserção é conclusão normal e dispara o cascade. `applyUndo` (Aplicar reversão), no relatório `RunnableReport`, existe mesmo sem limpeza automática, desde que o estado seja Gerado. Na coleção, aplica todo filho Gerado, com ou sem limpeza automática. A aplicação manual notifica cada teste. O cascade automático suprime essas notificações e usa uma só, na coleção raiz: progresso indeterminado no início, contagem a cada teste, e ao fim um resumo de sucessos e falhas que força o toast de novo. O resumo não é gravado no relatório da coleção.

A data de expurgo do relatório é a criação mais os dias configurados no teste, ou os herdados da coleção. Antes de apagar o relatório, reversão Gerado pendente é aplicada. Expurgo de coleção expurga, e portanto reverte, os filhos. A limpeza é do executável inteiro; não há reversão de um caso dentro de um teste com vários casos.

## Campos desprotegidos no SYBOX

Introduzido na 8.25. Não existe em 8.24 ou anterior. SYBOX exportado a partir da 8.26 com essa configuração não aplica o comportamento ao instalar em 8.24 ou anterior: a configuração é ignorada. `_protected` e `_unprotectedFields` estão na seção de campos de sistema.

Campo protegido é marcado quando o objeto é escolhido para proteção pelo SYBOX. O usuário não o desprotege. Campo desprotegido é o que o usuário configura. Prioridade geral, da maior para a menor: objeto, depois classe. Configuração no objeto prevalece sobre a da classe mesmo se estiver vazia.

Só se configura campo com proteger verdadeiro, e só campo raiz. Qualquer tipo, exceto campo de sistema. A configuração pode estar na classe, no objeto ou na dependência. Em dependência a prioridade é objeto, grupo, classe, e o objeto só prevalece sobre grupo ou classe se a configuração do objeto não estiver vazia; vazio cai no grupo e, sem grupo, na classe.

Objeto protegido novo já vem com os campos desprotegidos preenchidos, editáveis. Não se desprotege um campo protegido. Na instalação, campo desprotegido é criado e não é atualizado, salvo configuração que force a sobrescrita. Objeto protegido com campo desprotegido continua editável nesses campos, se o usuário tiver permissão.

O destaque da mesma função repete essa governança. O exemplo é uma fila protegida com os rótulos Limite de Entregas e Tentativas de Recuperação de Erros deixados desprotegidos. O destaque não informa identificador nem outra regra.
