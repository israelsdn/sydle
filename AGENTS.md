# SYDLE

Skills e regras do Claude Code para o SYDLE ONE. Cliente e estágio identificam o ambiente (`TJCE` + `DEV`). Abra só o arquivo da tarefa.

| Pedido | Onde |
|---|---|
| Login, API, script embarcado, identifier | skill `sydle` (`.claude/skills/sydle/`) |
| Como a plataforma funciona: método, campo, busca, processo, fila, `_utils`, Sybox, documento oficial, portal, folha, eSocial | skill `sydle-knowledge` (`.claude/skills/sydle-knowledge/`) |
| Liquidação, NL, PD, OB, solicitação de pagamento, credor de retenção, programação de desembolso, ordem bancária ou swagger desses documentos | skill `sydle-settlement` (`.claude/skills/sydle-settlement/`) |
| Criar, autorar ou versionar uma skill | skill `creating-a-skill` (`.claude/skills/creating-a-skill/`) |
| Cadastrar work item, task, PB, feature ou epic no Azure, Azure Boards ou Azure DevOps | skill `register-azure-boards` (`.claude/skills/register-azure-boards/`) |
| Quebra de tarefa, de task, de PB, de Product Backlog Item, de feature ou de epic | skill `task-breakdown` (`.claude/skills/task-breakdown/`) |
| Atualizar o AGENTS.md, o índice, ou incluir uma skill ou regra nova nele | skill `update-agents-md` (`.claude/skills/update-agents-md/`) |
| Script ou classe: consultar o conhecimento da plataforma antes de escrever | `.claude/rules/sydle-conhecimento.md` |
| Motor, erro, modelagem | `.claude/rules/sydle-plataforma.md` |
| Identifier em português | `.claude/rules/sydle-identificadores.md` |
| Script em `scripts/**/*.js` | `.claude/rules/sydle-scripts.md` |

A regra é o recorte curto. O detalhe fica na skill que ela aponta.
