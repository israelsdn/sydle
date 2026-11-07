# SYDLE

Este repositório é o workspace do Claude Code para trabalhar no SYDLE ONE e no Azure Boards. Ele reúne skills (`.claude/skills/`), regras (`.claude/rules/`) e um subagent (`.claude/agents/`). A pessoa pede em linguagem natural ou chama a skill pelo nome (`/sydle`, `/task-breakdown`). O Claude lê o [CLAUDE.md](CLAUDE.md), que importa o [AGENTS.md](AGENTS.md), abre só o arquivo da tarefa e executa o fluxo.

Não é preciso decorar endpoint, nome de script nem variável de ambiente. O que precisa ser informado uma vez é o link de cada ambiente. Esse link fica salvo na máquina, fora do git, e os pedidos seguintes reutilizam o mesmo ambiente.

## O que dá para pedir

| Pedido | O que acontece |
|---|---|
| Login, classe, método, script embarcado ou identifier no SYDLE | A skill `sydle` usa o ambiente já salvo, abre o Edge para autenticar quando a sessão falta e segue a regra da plataforma. |
| Quebrar uma especificação em epic, feature, Product Backlog Item e task | A skill `task-breakdown` monta o plano, confirma no card e só lê a plataforma. |
| Cadastrar esses itens no Azure Boards | A skill `register-azure-boards` cria os work items pelo MCP do Azure DevOps, depois da confirmação de projeto, área, iteração e responsável. |
| Criar ou versionar uma skill deste repositório | A skill `creating-a-skill` grava em `.claude/skills/`. |
| Atualizar o índice de skills e regras | A skill `update-agents-md` altera só o `AGENTS.md`. |

Regras sempre ligadas cobrem o motor do SYDLE (erro, modelagem, o que pode ser persistido) e o identifier em português. Script em `scripts/**/*.js` segue a estrutura de script embarcado.

Quando a quebra de tarefa consulta duas ou mais classes, o agente `map-sydle-class` mapeia cada classe em paralelo. A consulta é só de leitura.

## O que precisa estar instalado

- [Claude Code](https://claude.com/claude-code) (CLI, app desktop ou extensão de IDE), aberto nesta pasta.
- [Node.js](https://nodejs.org) no PATH. Os scripts de login são `.mjs` e não usam `npm install`.
- Microsoft Edge no Windows. O login do SYDLE abre o Edge. A autenticação não passa pelo browser integrado do Claude nem pelo Claude in Chrome.
- Para o Azure Boards, o MCP do Azure DevOps (`@azure-devops/mcp`), já declarado em `.mcp.json` para a organização `elotech`. Ele roda por `npx`, sem instalação. Na primeira chamada abre o login da conta Microsoft no navegador padrão e guarda o token. É o único caminho para o Azure.
- Conta com acesso ao ambiente SYDLE e, para cadastro de work item, à organização do Azure DevOps.

As permissões do projeto ficam em `.claude/settings.json`: leitura das skills, os scripts do SYDLE e as ferramentas de leitura do MCP rodam sem pedir confirmação. Criar ou ligar work item continua pedindo.

Não há usuário nem senha em arquivo. O arquivo local guarda só o link. A sessão de login fica num JSON ao lado, também fora do git.

## Passar a URL do ambiente

Basta enviar a URL no chat, junto com o cliente e o estágio. O agente grava o link e ele permanece salvo para os próximos pedidos. Não é obrigatório editar arquivo à mão.

Exemplo:

```text
Ambiente TJCE DEV: https://tjce-dev.sydle.one/api/1/main
```

O que fica gravado:

| Dado | Onde | Nome |
|---|---|---|
| Link do SYDLE | `.claude/skills/sydle/.env` | `SYDLE_<CLIENTE>_<AMBIENTE>_URL` |

A URL do SYDLE termina na aplicação, sem barra no final: `https://<host>/api/1/<aplicacao>`. Cliente e estágio identificam o par, por exemplo `TJCE` e `DEV`, e viram `SYDLE_TJCE_DEV_URL`. Cada ambiente novo é outra URL informada no chat. A lista não é fechada: HOM, PROD ou outro cliente entram do mesmo jeito.

O Azure não precisa de URL: a organização `elotech` já está no `.mcp.json`. Projeto, área, iteração e responsável são escolhidos no card, a partir do que o MCP listar.

O formato de exemplo está em `.claude/skills/sydle/.env.example`. Esse arquivo pode ir para o git. O `.env` preenchido não vai.

Sem a URL daquele cliente e estágio, o agente não conecta e não inventa host. Ele pede o link, grava e só então segue.

## Pedir o trabalho

Com a URL já salva, o pedido no chat é direto:

- `Faz login no TJCE DEV.`
- `Busca a classe Pedido no TJCE DEV.`
- `Quebra esta especificação em epic, feature, PB e task.`
- `Cadastra esse plano no Azure Boards.`

No login, o Edge abre no host da URL salva. A pessoa autentica na janela. No mesmo momento o chat abre um card para confirmar que o login terminou. A sessão só vale depois dessa confirmação e de o token ser aceito. O Edge fecha quando o script termina, também se a validação falhar. A janela fechar não substitui o card.

A sessão fica em `.claude/skills/sydle/.sydle-session.json`, na chave `CLIENTE:AMBIENTE`. O token é cifrado com a proteção do usuário do Windows.

## O que não vai para o git

`.env` e `.sydle-session.json` ficam de fora. Não commite token, sessão nem link preenchido.
