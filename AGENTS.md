# SYDLE

Skills e regras do Cursor para o SYDLE ONE. Cliente e estágio identificam o ambiente (`TJCE` + `DEV`). Abra só o arquivo da tarefa.

| Pedido | Onde |
|---|---|
| Login, API, script embarcado, identifier | skill `sydle` (`.cursor/skills/sydle/`) |
| Como a plataforma funciona: método, campo, busca, processo, fila, `_utils`, Sybox, documento oficial, portal, folha, eSocial | skill `conhecimento-sydle` (`.cursor/skills/conhecimento-sydle/`) |
| Liquidação, NL, PD, OB, solicitação de pagamento, credor de retenção, programação de desembolso, ordem bancária ou swagger desses documentos | skill `liquidacao` (`.cursor/skills/liquidacao/`) |
| Criar, autorar ou versionar uma skill | skill `creating-a-skill` (`.cursor/skills/creating-a-skill/`) |
| Cadastrar work item, task, PB, feature ou epic no Azure, Azure Boards ou Azure DevOps | skill `register-azure-boards` (`.cursor/skills/register-azure-boards/`) |
| Quebra de tarefa, de task, de PB, de Product Backlog Item, de feature ou de epic | skill `task-breakdown` (`.cursor/skills/task-breakdown/`) |
| Atualizar o AGENTS.md, o índice, ou incluir uma skill ou regra nova nele | skill `update-agents-md` (`.cursor/skills/update-agents-md/`) |
| Motor, erro, modelagem | `.cursor/rules/sydle-plataforma.mdc` |
| Identifier em português | `.cursor/rules/sydle-identificadores.mdc` |
| Script em `scripts/**/*.js` | `.cursor/rules/sydle-scripts.mdc` |

A regra é o recorte curto. O detalhe fica na skill que ela aponta.
