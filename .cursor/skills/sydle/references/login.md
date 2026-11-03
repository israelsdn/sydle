# Login

Não há usuário nem senha no `.env`. O `.env` guarda só o link do ambiente (`SYDLE_<CLIENTE>_<AMBIENTE>_URL`). A sessão das chamadas fica em `.sydle-session.json`. Os dois arquivos ficam em `.cursor/skills/sydle/`, junto com a skill.

O Edge abre `{origem}`, o host de `SYDLE_<CLIENTE>_<AMBIENTE>_URL`. Não há rota fixa de aplicação na interface.

## Regra do browser

**Sempre** abrir o **Microsoft Edge** do Windows. **Nunca** usar o browser integrado do Cursor (`cursor-ide-browser`) para login.

Fluxo obrigatório quando não houver sessão válida:

```bash
node .cursor/skills/sydle/scripts/login-edge.mjs <CLIENTE> <AMBIENTE>
```

Exemplo:

```bash
node .cursor/skills/sydle/scripts/login-edge.mjs TJCE DEV
```

O script:

1. Abre o Edge em `{origem}`, com perfil temporário e remote debugging
2. Espera o usuário autenticar (Microsoft Elogroup ou formulário)
3. Lê o token de `explorer_user_map` no `localStorage`
4. **Não grava o primeiro token**: o Explorer costuma emitir um access token curto (~1 min) e só depois renovar. O script só aceita quando a validade restante passa de `SYDLE_TOKEN_MIN_TTL_S` (padrão 300 s) e a leitura se estabiliza
5. Valida com `validateToken`
6. Grava `.sydle-session.json`
7. **Fecha** a janela do Edge ao terminar, também quando a validação falha

Não pedir usuário nem senha no chat. O fechamento acontece depois que a sessão é gravada. A verificação não espera essa janela fechar: o card de confirmação é que libera o próximo passo.

## Confirmação

Na mesma hora em que o Edge abrir, abrir um card `AskQuestion`. O card é o que libera o próximo passo. Não seguir só porque o processo do script acabou ou porque a janela fechou.

Pergunta: "O Edge está aberto para o login. Confirme para verificar se a sessão foi concluída."

Opções, nesta ordem:

1. `verificar` — "Já autentiquei. Verificar a sessão."
2. `aguardar` — "Ainda não terminei."

Subir o script em segundo plano (`block_until_ms` curto, só até aparecer "Edge aberto"). No mesmo turno, abrir o card. Não bloquear o turno até o Edge fechar.

- `verificar`: ler `.sydle-session.json` da chave `CLIENTE:AMBIENTE` e chamar `validateToken`. `200` confirma. Não imprimir o corpo nem o token. Dizer se a sessão foi concluída e o usuário, quando houver. Sem token gravado, ou com `validateToken` diferente de 200, dizer que a sessão não foi concluída e abrir o card de novo.
- `aguardar`: abrir o card de novo. Não encerrar o login. A janela segue aberta até a sessão ser gravada.

Depois de gravar a sessão, o script fecha o Edge. Não usar esse fechamento como sinal para verificar.

## Ambientes

Não há lista fechada. Um ambiente entra quando o link é enviado e vira a variável `URL` no `.env`. Sem ela, não conectar e não inventar host.

## Arquivo `.sydle-session.json`

Chave `CLIENTE:AMBIENTE`. Campos: `origem`, `urlApi`, `token`, `expiraEm` (`payload.exp`, segundos Unix), `obtidoEm`, `usuario`.

Após login pelo Explorer, `urlApi` fica `{origem}/api/1/elogroup` (app em que o token do Explorer autentica).

Fora do git, na pasta da skill, junto com `.env`.

## Uso

```javascript
import { obterAuthorizationSessao } from "./lib/sessao-sydle.mjs";

const authorization = obterAuthorizationSessao("TJCE", "DEV");
```

O retorno já inclui `Bearer `. A função falha se não houver sessão, ou 60 segundos antes de `expiraEm`. Sem sessão válida, rodar `login-edge.mjs` e abrir o card de confirmação na mesma hora. Não abrir o browser integrado. Não esperar a janela fechar para verificar. O script fecha o Edge depois de gravar a sessão.

Conferir a sessão:

```http
GET {origem}/api/1/elogroup/sys/auth/validateToken
Authorization: Bearer <token>
```

`200` confirma. Não imprimir o corpo se ele trouxer o token. Não pedir login nem senha para renovar.
