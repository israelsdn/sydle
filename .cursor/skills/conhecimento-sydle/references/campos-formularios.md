# Campos, formulários e metadata

Contrato de campo, formulário e metadata no SYDLE ONE, destilado da wiki EloGroup: o que o método Obter Metadata altera, como o erro aparece no campo, como seção, relevância, referência e indexação mudam a tela e a busca, e em que ordem Salvar e a validação rodam. Artigos de folha, RH, contabilidade, e-mail, processo e API genérica ficaram de fora.

## Obter Metadata

O método Obter Metadata muda características do campo (nome, obrigatoriedade, oculto, somente leitura e outras). Roda ao iniciar a tarefa e de novo a cada alteração de campo. Também roda fora da edição do rascunho, por exemplo na listagem de objetos, e nesse caso chega sem `_object`. O único método com acesso a `_metadata` é o Obter Metadata. Os campos ficam em `_metadata.fields`.

Contrato observado no artigo: atribuir em `_metadata.fields.<identificador>`. Atributos citados com uso: `hidden`, `valueOptions` (array, aceita `push`), `maxMultiplicity`, `minMultiplicity`, `query` (filtro Elasticsearch dos objetos de um campo referência), `name.pt`.

Armadilhas: sem o guarda de `_object`, a listagem quebra o método. Campo oculto por metadata deixa de aparecer como filtro na pesquisa de objetos e deixa de aparecer no Analytics. `maxMultiplicity` e `minMultiplicity` iguais ao tamanho já gravado impedem incluir e excluir itens de um múltiplo na atividade seguinte.

```javascript
if (!_object) {
    return;
}

_metadata.fields.matricula.hidden = true;
_metadata.fields.matricula.valueOptions.push("Novo valor");
_metadata.fields.demandas.maxMultiplicity = max;
_metadata.fields.demandas.minMultiplicity = max;
_metadata.fields.nomeDoCampo.query = {
    "bool": {
        "must": [
            { "terms": { "_id": [OBJETO_ID_1, OBJETO_ID_2] } }
        ]
    }
};
_metadata.fields.intrucoes.name.pt = "";
```

O identificador `intrucoes` e os placeholders `OBJETO_ID_1` e `OBJETO_ID_2` estão no artigo; não são identificadores de plataforma.

## Métodos padrão das classes

Toda classe nasce com Atualizar Rascunho, Criar, Criar Rascunho, Duplicar, Editar, Histórico, Obter, Obter Metadata, Obter Rascunho, Remover, Salvar e Buscar. O artigo não explica o colchete em parte desses nomes.

Contrato: pelo metadata dá para alterar tamanho máximo e mínimo, linha excluível de campo múltiplo, `hidden`, `required`, `name`, `valueOptions` e `readOnly`. O artigo não dá o identificador da linha excluível nem do tamanho máximo e mínimo; os nomes `maxMultiplicity` e `minMultiplicity` estão só no artigo Obter Metadata.

Não há assinatura de chamada.

## Seções

A partir da versão 2.38.x do pacote workspaces, o agrupamento de campos da classe pode ser Nenhum, Seções horizontais (páginas) ou Seções verticais (sanfonas). Seção horizontal pode ter subseções, e subseção é sempre vertical. O campo aponta para a seção ou subseção já cadastrada.

Configuração da seção: Nome, Identificador, Ícone (Material Icons), Subseções (só horizontal), Oculto, Configuracao inicial (aberta ou fechada, só vertical) e Ajuda para edição (o artigo diz que o uso ainda não está mapeado).

Contrato no Obter Metadata: novo atributo `sections` em `_metadata`. Na configuração da seção, `hidden`, `icon` e `name` podem mudar em tempo de execução. O artigo não mostra o caminho de script até uma seção.

Armadilha: `hidden` na seção esconde a seção inteira e os campos de uma vez. A configuração de cada campo permanece. Campo obrigatório continua obrigatório com a seção oculta.

## Mensagem de erro localizada

Erro de validação no formulário. O `throw` de string para no primeiro erro da execução; os `throw` seguintes não aparecem. A mensagem também não aponta o campo, a menos que o texto cite o campo.

Contrato. Feedback no campo sai de duas chamadas. O último argumento, `context`, é o caminho do campo. Sem ele, o feedback não fica no campo. Os scripts que exibem feedback localizado são Salvar, Atualizar Rascunho e Obter Metadata.

```javascript
_utils.addErrorMessage("O valor deve ser ímpar", null, "valor");
throw new ValidationException("O valor deve ser ímpar", null, "valor");
```

Caminhos que o artigo mostra:

- Raiz: identificador do campo (`valor`).
- Embutido, a partir da classe pai: `embutido.valor`.
- Embutido múltiplo: `embutidoMultiplo.` + `_id` do item + `.valor`.
- Script da própria classe embutida: `_context.objectPath.concatWith("valor")`. O caminho se adapta ao lugar em que a classe está embutida.

```javascript
const path = "embutidoMultiplo." + item._id + ".valor";
_utils.addErrorMessage("O valor deve ser ímpar", null, path);
_utils.addErrorMessage("O valor deve ser negativo", null, _context.objectPath.concatWith("valor"));
```

Armadilhas:

- Vários `addErrorMessage` no mesmo campo aparecem juntos. Vários `throw` na mesma execução, não.
- `throw` no Atualizar Rascunho cancela o método e o usuário perde o que acabou de informar. O artigo manda deixar nesse método só a validação urgente e o resto no Salvar.
- Feedback da classe embutida vale em todo uso dela. Feedback na classe pai enxerga campos irmãos.
- Não há feedback no item do múltiplo. O caminho `embutidoMultiplo.` + `_id` não exibe. Exibe o campo filho (`..._id.valor`) ou o múltiplo inteiro (`embutidoMultiplo`).
- Embutido com exibição Raiz: feedback no próprio campo embutido não aparece. Aparece no filho (`embutidoRaiz.valor`).

## Verificar erros de validação de um formulário

A partir da versão 8.21, `_utils.object.ObjectService.validate` recebe um único parâmetro obrigatório, o objeto, confere a integridade e devolve as quebras. O artigo cita preenchimento obrigatório, unicidade, multiplicidade de múltiplo e validação das referências. Não lança sozinho.

```javascript
const validacao = _utils.object.ObjectService.validate(object);
```

Retorno útil: `erros`, mapa do identificador do campo para uma lista de objetos `{ "code", "text" }`, preenchido na primeira execução; `getErros`, método dos erros daquele objeto. O artigo mostra `code` `ERROR_REQUIRED_FIELD` e `text` no formato `O campo "identificadorDoCampo" é obrigatório.` O mesmo retorno lista métodos de objeto Java (`getClass`, `wait`, `hashCode`, `equals`, `notifyAll`, `toString`, `class`, `notify`); o artigo não descreve o uso deles.

Para pintar o campo, o exemplo passa a mensagem, o código e o caminho:

```javascript
_utils.addErrorMessage(erro.text, erro.code, key);
```

O artigo cita `validateAndThrow` quando o lançamento do erro for o comportamento desejado, e não mostra parâmetros nem retorno.

Armadilha: validar só na tela deixa a API gravar objeto inválido. Validar só no servidor não dá feedback no preenchimento. O exemplo de feedback imediato está no `_updateDraft` e usa `addErrorMessage`, sem interromper a digitação.

## Tipos de relevância de campo

Quatro relevâncias: Identidade, Destaque, Comum e Avançada. Servem à identidade visual e à pesquisa.

No card da listagem aparecem Identidade e Destaque. Comum e Avançada não aparecem. Quanto maior a relevância, maior a ênfase. Avançada fica numa seção final, atrás de um ícone de mais. Em referência embutida múltipla exibida como formulário, o campo Identidade identifica cada item.

Na pesquisa, Identidade, Destaque e Comum são indexados. Avançada não é indexada e não entra em query. Campo que precise ser buscado não pode ser Avançada.

Em referência não embutida, a configuração avançada do campo limita até qual relevância da classe referenciada a busca alcança (Identidade, Destaque ou Comum). Referência embutida não tem essa configuração.

Não há contrato de script. A relevância é escolhida na modelagem do campo.

## Tipos de dados: referência simples

Referência simples guarda um link para outro objeto e é o que cria a aba Dados. Só classe buscável pode ser selecionada. Referência embutida guarda o objeto inteiro. Aceita classe buscável e não buscável. A navegação é pelo link do campo ou pela aba Dados do objeto referenciado, que lista quem aponta para ele.

Configurações adicionais citadas, sem assinatura de script:

- Query: filtro Elasticsearch do que o usuário pode escolher.
- Ao remover: o que ocorre com o objeto quando uma referência que aponta para ele é excluída. O artigo não lista as opções.
- Permitir busca em campos até a seguinte relevância: até que relevância da classe referenciada a query pode descer.
- Opção de listagem de objetos: Apenas acessíveis (o que o usuário pode ver) ou Todos (independe da permissão de ver o objeto).

O restante da página fala de Studio, fases, PCS, campos PROTOCOLO, CPF e CNPJ e do script `formata_ps.js`. Isso não é contrato de campo do SYDLE ONE.

## Parâmetros de indexação em campos

Só campo do tipo Referência. Fica na aba Avançado do campo. Três modos:

- Apenas Referência: padrão. O artigo cita `_id` ou Nome.
- Customizados: campos além de nome e `_id`. Vários campos customizados podem entrar.
- Filtrar Campos por Relevância: indexa todo campo com relevância maior ou igual ao nível escolhido. É cumulativo. Avançado inclui Identidade, Destaque, Comum e Avançado.

A indexação é encadeada. A classe referenciada também precisa dos parâmetros no campo do meio. Se o filtro de relevância no meio for mais alto do que o campo desejado, esse campo não entra. Exemplo do artigo: Região é Comum em Estado; Responsável em Reunião no filtro Destaque inclui Estado de Pessoa; Estado em Pessoa precisa do filtro Comum para Região entrar. Com Destaque em Estado, só sigla e nome.

Depois da mudança, a plataforma avisa reindexação. Não é obrigatória. Para efeito imediato: Pacote Sistema, instância Configuração, a organização do ambiente, método Reindexar Classes. O acompanhamento fica em Acompanhamento de Operação.

Armadilhas:

- Classe referenciada marcada como não buscável some da busca direta da classe do meio e continua indexada na classe de fora.
- Um campo Nome não buscável faz a classe do meio indexar pelos outros campos. A classe de fora, se a cadeia foi configurada, continua buscando por esse Nome.
- Usuário sem permissão de `_search` e `_get` nas classes referenciadas não as vê na busca direta da classe do meio. Isso não altera o índice da classe de fora.
- Opção de Listagem de Objetos igual a Todos, na aba Avançado do campo, lista os objetos sem depender da permissão de `_search` e `_get` naquele campo.

Não há assinatura de script para gravar o parâmetro.

## Reindexação de objetos

Indexar grava no Elasticsearch os campos marcados como indexáveis. O utilitário é `_utils.indexing`.

```javascript
_utils.indexing.reindex([_object]);
_utils.indexing.reindex([_object], true);
_utils.indexing.reindexSync([objeto1, objeto2], false);
```

Contrato: `reindex(objects, strictReindex)` é assíncrono, cria mensagem de indexação e devolve `true` se a mensagem foi criada, `false` caso contrário. `reindexSync(objects, strictReindex)` só retorna depois da reindexação e devolve `true` ou `false` conforme o sucesso. `objects` é lista de objetos, obrigatória. `strictReindex` é booleano, obrigatório na tabela do artigo, e o texto diz que o padrão é `false` quando omitido.

`true` reindexa só os objetos passados. `false` reindexa também todo objeto que referencia os passados.

## Salvar

Salvar dispara quando o objeto é publicado depois de criar ou editar, ou logo após Criar. Roda antes da validação padrão de obrigatoriedade. A mensagem do script aparece, e a mensagem de campo obrigatório aparece depois.

Em referência embutida, o Salvar das classes embutidas roda primeiro, da menor prioridade para a maior, e só então o Salvar da classe pai. No exemplo do artigo: Dimensões do Produto, Tipo de Produto, Produto, e em seguida a validação de obrigatoriedade de Produto.

A permissão de Salvar é herdada de Criar e de Editar.

Não há assinatura além do método padrão.

## Remover

`_delete` existe em toda classe. No script recebe um objeto com `_id` e não tem retorno.

```javascript
_utils.getMethod("_classId", idClasse, "_delete")({ "_id": idObjeto });
```

Armadilha de campo: a exclusão falha quando outro campo referencia o objeto. O comportamento está na aba Avançado do campo referência, na criação da classe. O artigo não lista as opções. O artigo de referência simples chama essa opção de Ao remover.

## Substituição de referência

`_utils.object.ObjectService.replaceReference` troca em massa referências simples de um objeto publicado para outro. Os dois precisam ser da mesma classe, do tipo Padrão, e já publicados. `from` e `to` são objetos com `_classId` e `_id`. `configs.maxReplaces` é número opcional; se `configs` não vier, o máximo é 1000, e o teto por chamada é 1000.

```javascript
const fromObject = { "_id": idOrigem, "_classId": idClasse };
const toObject = { "_id": idDestino, "_classId": idClasse };

_output = _utils.object.ObjectService.replaceReference(fromObject, toObject);
```

Retorno: `remaining`, `processed`, `protectedObjects`, `errors`, todos número.

O método altera campo de referência simples. Não altera objeto protegido. Não substitui referência embutida. Não executa o script de Salvar nem interceptor de Salvar. A indexação é a de um `_patch` assíncrono. Gera histórico conforme a classe.

O método de tela fica em Organização/Sistema, no grupo Administrador. A lista de classes desse campo só traz classes buscáveis. Classe não buscável pede o script.

## Substituição de referências em massa

O mesmo método de tela, descrito para a versão 8.4. Campos: Classe (qual classe tem as referências), De, Para, Limite de substituições. Saída na tela: Objetos restantes, Objetos processados, Objetos protegidos, Erros.

Condições, restrições e garantias repetem o artigo de script: objetos publicados, classe Padrão, mesma classe, sem objeto protegido, sem referência embutida, sem Salvar e sem interceptor, teto de 1000 por chamada, só referência simples, histórico conforme a classe. Este artigo diz que a indexação é a de um `_patch`, sem dizer assíncrona.

Não há segunda assinatura.

## Campo customizado (Sydle UI)

Campo customizado ata uma classe a um componente. Onde a classe aparecer, inclusive como campo embutido, a plataforma renderiza o componente. O objeto da classe Campo customizado aponta para essa classe, e a tag do objeto é a tag do componente Stencil.

O componente declara três props, que o artigo não nomeia: acesso ao campo, valor do `_object` e caminho desde a classe que usa o componente até o campo customizado. O campo da classe entra com `<sy-one-field>` e o identificador do campo. O componente pode ouvir o evento de mudança de valor. A biblioteca citada é `@sydle/sydle-one-components`. O exemplo local sobe na porta 3333.

Armadilha: script de atualizar rascunho, metadata e salvar continua valendo. O componente não substitui esses métodos.

Não há assinatura dos props.

## Mudanças Sydle UI

Web component feito com Stencil entra como campo de formulário, no portal e em qualquer formulário do ONE. A classe anterior de Portal foi descontinuada. A configuração de portal passou para a classe Aplicação UI. A migração dos portais ocorre depois da importação do Sybox do Service Desk 5.0.0. O artigo cita Sybox de SYDLE UI 2.7.0, Service Desk 5.0.0 e SYDLE ONE WS1 8.3 (8.3.48).

Não há contrato de método nem de metadata. O artigo manda a documentação do Service Desk para o detalhe.

## Tabela dinâmica e formulário de método

Numa aplicação SYDLE UI, `CustomAPI` recebe o id da classe e `fetch` chama um método público. O exemplo usa `fetch("getPessoasAtivas", {})`. `response.error` interrompe; `response.data` é a lista. `metodoInput` é o que o método lê em `_input`. `metodoOutput` é o retorno. No exemplo, a entrada é vazia e a saída tem Nome, Email, CPF e Id.

O formulário do método de tela é o componente `sy-one-method-input-form`, com `method`, `classId`, `objectId`, `input` e `settings`. O `settings` mostrado tem `hideDefaultActionButtons`, `alwaysCreateNewDraft` e `disableCancelConfirmation`. A rota que abre a tela vem da Aplicação UI (`navigate` com o identificador da rota). O id de classe do exemplo é de um ambiente de parceiro, não um id de plataforma.

## Tela externa de visualização

A view de exibição, em Editar a classe e depois Avançado, substitui a tela padrão de ver o objeto por um frontend externo. A URL que a plataforma abre traz query string. O artigo lê `viewName`, `cid` (id da classe) e `id` (id do objeto).

```javascript
const queryParameters = new URLSearchParams(window.location.search);
const viewName = queryParameters.get("viewName");
const cid = queryParameters.get("cid");
const id = queryParameters.get("id");
```

O exemplo busca com GET `"/teste/TesteWikiReact/_get?_id=" + id`. `TesteWikiReact` é a classe do tutorial, não uma classe de plataforma. O retorno do exemplo preenche `nome` e `cpf`.

Armadilha: a view não foi feita para rotas de um projeto React. O artigo sugere navegação sem rotas. HashRouter é citado como não verificado.

## Listagem de objetos em formato de tabela

A tabela da listagem é configurada por classe, na classe View do pacote Workspace, no registro Listagem de Objetos, seção Configuração por Classe, opção Tabela. Dá para ligar Avatar e Tabela Listrada. Cada coluna é um atributo da classe. A grade tem rolagem horizontal; Expandir mostra mais colunas.

Não há contrato de script.

## Metadata em arquivo utilitário

Arquivo `.js` do ECM não enxerga `_metadata` sozinho. A função exportada recebe `EXTERNAL_SCOPE`, e `_metadata` é uma das chaves, junto de `_object`, `_utils` e os demais contextos que o artigo lista.

```javascript
module.exports = function (EXTERNAL_SCOPE) {
    const _metadata = EXTERNAL_SCOPE._metadata;

    return {};
};
```

Não há outro contrato de campo nesse artigo.
