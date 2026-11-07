# Plataforma

## Vocabulário

Método é componente da classe. Função é bloco `function` dentro de um script.

Label visível: só a primeira letra maiúscula, exceto siglas. Método no infinitivo. Tarefa de usuário no infinitivo. Atividade automática no presente, 3ª pessoa (`Envia notificação para gerente`).

## Motor

`let` tem escopo de **função**, não de bloco. Não declarar dois `let` com o mesmo nome, nem `let` dentro de `for`.

`const` por padrão. `let` só com reatribuição. Nunca `var`. Aspas duplas, ponto e vírgula, indentação de 4 espaços. Igualdade estrita (`===`). Condicional de negócio compara explícito: `0`, `""` e `null` são valores válidos e são falsy.

Comentário fica na linha de cima, com uma linha em branco antes, exceto na primeira linha do bloco. Comentário diz a intenção, não a sintaxe.

## Erro

Quem lê a mensagem decide o lançamento.

- Validação de negócio, texto que a interface mostra: string crua. `throw "Agente suprido não encontrado."`
- Falha técnica que será capturada e logada: `new Error`. No `catch`, registrar `err.stack` quando existir e devolver ao usuário uma frase limpa, sem detalhe técnico.
- `catch` vazio é proibido.
- Não usar pacote de tradução (`useTranslation`). O sistema é monolíngue; mensagem literal em português.

## Execução

`_getMetadata` e `_updateDraft` rodam o tempo todo. Não fazer `_search` pesado nem persistir neles. Persistência no script final: rascunho no `_save`, método de tela depois do envio.

Integração externa só na transição do valor (`_object.campo !== _oldObject.campo`). Em tela, o par é `_input` e `_oldInput`.

Referência cuja classe é interface: sempre `_id` e `_classId`. Sem o `_classId` o sistema varre todas as concretas.

Campo calculado "Na leitura" reindexa referências à toa. Relevância Avançada não entra em busca. Indexação assíncrona: `_indexStrategy: "queue"` — a busca pelo campo alterado pode ficar inconsistente até a fila terminar.

`_search` devolve no máximo 10.000. Paginar com `sort: ["_id_doc_value"]` e `search_after`. Preferir `filter` a `must`.

Fila de métodos (`_utils._queues.methodExecutionQueue`) quando o lote pode passar de 30 minutos ou precisa reprocessar item a item. Espaçar o agendamento. A assinatura exata da fila precisa ser confirmada na referência antes de gerar código.

## Modelagem

Classe embutida: "Objetos buscáveis?" falso e sem permissão nos métodos padrões. Desenhar classes e relatórios antes de criar na plataforma. Biblioteca compartilhada é arquivo em ECM >> Arquivo, `module.exports`, `require` no topo do script.

Globais distintos, não trocar um pelo outro:

- `_utils.getMethod("_classId", CLASS_ID, "_get")({ "_id": id })`
- `_util._fileHelper.create(...)` e `_util._fileHelper.convert(...)`

Contexto: `_input` (recebido), `_object` (estado anterior à atualização), `_user` (quem disparou).
