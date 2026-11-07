@AGENTS.md

As regras de `.claude/rules/` entram sozinhas: as sem `paths` em toda sessão, a `sydle-scripts.md` só ao mexer em `scripts/**/*.js`.

Login do SYDLE é sempre pelo Microsoft Edge, pelos scripts da skill. Nunca pelo browser integrado do app nem pelo Claude in Chrome.

Azure Boards vai pelo MCP `azure-devops` (`.mcp.json`, organização `elotech`); o login é o da conta Microsoft que o próprio servidor abre. Não há outro caminho para o Azure. Ferramenta de leitura do MCP roda direto; criação e link de work item pedem confirmação.
