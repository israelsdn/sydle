# Login

Não há usuário nem senha no `.env`. O `.env` guarda só o link do ambiente (`SYDLE_<CLIENTE>_<AMBIENTE>_URL`). A sessão das chamadas fica em `.sydle-session.json` na raiz do projeto.

A aplicação de login é `elogroup` em qualquer cliente e estágio. A rota de interface é `{origem}/app/elogroup`.

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

1. Abre o Edge com perfil temporário e remote debugging
2. Espera o usuário autenticar (Microsoft Elogroup ou formulário)
3. Captura o token de `explorer_user_map` no `localStorage`
4. Valida com `validateToken`
5. Grava `.sydle-session.json`
6. **Fecha a janela do Edge**

Não pedir usuário nem senha no chat. Só avisar que o Edge abriu e que a janela fecha sozinha após o login.

## Ambientes

Não há lista fechada. Um ambiente entra quando o link é enviado e vira a variável `URL` no `.env`. Sem ela, não conectar e não inventar host.

## Arquivo `.sydle-session.json`

Chave `CLIENTE:AMBIENTE`. Campos: `origem`, `urlApi`, `token`, `expiraEm` (`payload.exp`, segundos Unix), `obtidoEm`, `usuario`.

Após login pelo Explorer, `urlApi` fica `{origem}/api/1/elogroup` (app em que o token do Explorer autentica).

Fora do git, junto com `.env`.

## Uso

```javascript
import { obterAuthorizationSessao } from "./lib/sessao-sydle.mjs";

const authorization = obterAuthorizationSessao("TJCE", "DEV");
```

O retorno já inclui `Bearer `. A função falha se não houver sessão, ou 60 segundos antes de `expiraEm`. Sem sessão válida, rodar `login-edge.mjs` — não abrir browser integrado.

Conferir a sessão:

```http
GET {origem}/api/1/elogroup/sys/auth/validateToken
Authorization: Bearer <token>
```

`200` confirma. Não imprimir o corpo se ele trouxer o token. Não pedir login nem senha para renovar.
