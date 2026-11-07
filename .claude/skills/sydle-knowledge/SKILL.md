---
name: sydle-knowledge
description: >-
  Explica o comportamento da plataforma SYDLE ONE a partir da Wiki Sydle
  e da documentação oficial do service desk: métodos, campos, busca,
  processos, filas, _utils, Sybox, documento oficial, portal, folha e
  eSocial. Use quando o pedido perguntar como um mecanismo da plataforma
  funciona, a assinatura de _utils, a query de _search, o _pin do processo
  ou o contrato de um pacote. Não autentica nem chama a API (skill sydle)
  e não cobre a cadeia de liquidação (skill sydle-settlement).
version: 2.0.0
---

# SYDLE knowledge

Índice do que a Wiki Sydle da EloGroup e a documentação oficial do service desk registram sobre a plataforma. Login, sessão e chamada HTTP ficam na skill `sydle`. Ids e regras de liquidação ficam na skill `sydle-settlement`. A wiki e a documentação oficial do mesmo tema ficam em arquivos separados.

## Gatilhos

Pedido sobre como um mecanismo da plataforma funciona: método, campo, metadata, formulário, busca, `_search`, processo, fila, `_pin`, `_utils`, `_util`, Sybox, documento oficial, portal, folha ou eSocial.

Não entra para login, sessão, token ou gravação na plataforma (skill `sydle`). Não entra para nota de liquidação, programação de desembolso ou ordem bancária (skill `sydle-settlement`).

## Entradas

O pedido e o reference do tema. Assinatura, id ou passo que o reference não traz não é completado.

## Saídas

O arquivo do tema, aberto sob demanda, e a resposta alinhada a esse contrato.

## Onde ler

| Precisa de | Arquivo |
|---|---|
| Classes, métodos padrão, script embarcado | [references/classes-metodos.md](references/classes-metodos.md) |
| Campo, metadata, formulário, relevância, indexação | [references/campos-formularios.md](references/campos-formularios.md) |
| `_search` e query | [references/busca.md](references/busca.md) |
| Processo, tarefa, evento, fila, sinal | [references/processos-filas.md](references/processos-filas.md) |
| `_utils` e `_util` | [references/utils.md](references/utils.md) |
| Sybox, extensão, webservice, notificação, API do portal | [references/pacotes-construcao.md](references/pacotes-construcao.md) |
| Documento oficial, pendência, view de componente | [references/documento-portal.md](references/documento-portal.md) |
| Folha, frequência, eSocial, fatura | [references/erp-rh.md](references/erp-rh.md) |
| Métodos e scripts na documentação oficial | [references/servicedesk-metodos.md](references/servicedesk-metodos.md) |
| Modelagem na documentação oficial | [references/servicedesk-modelagem.md](references/servicedesk-modelagem.md) |
| Busca e indexação na documentação oficial | [references/servicedesk-busca.md](references/servicedesk-busca.md) |
| Processos e filas na documentação oficial | [references/servicedesk-processos.md](references/servicedesk-processos.md) |
| Sybox, executável e migração, parte 1 | [references/servicedesk-sybox-a.md](references/servicedesk-sybox-a.md) |
| Sybox, executável e migração, parte 2 | [references/servicedesk-sybox-b.md](references/servicedesk-sybox-b.md) |
| Segurança, arquivo, log e integração na documentação oficial | [references/servicedesk-integracao.md](references/servicedesk-integracao.md) |
| Releases 8.1 a 8.40, destaques e FAQ | [references/servicedesk-releases.md](references/servicedesk-releases.md) |
| Primeiros passos e guias na documentação oficial | [references/servicedesk-guias.md](references/servicedesk-guias.md) |

## Limites

- Não autentica, não chama API e não grava objeto. Isso é a skill `sydle`.
- Não inventa assinatura, id de classe, template ou passo que o reference não mostra.
- Não trata a wiki como cópia: o reference é o contrato destilado.
- Não cobre a cadeia de liquidação do TJCE.

## Verificação

A skill está certa quando o `SKILL.md` tem `name`, `description` e `version`, a description tem até 1024 caracteres e cita métodos, busca, processos, `_utils`, Sybox, documento, portal e folha, e o detalhe está só em `references/`, num nível.

## Critério de falha

Falhou se a description narra o fluxo interno, passa de 1024 caracteres, se um reference aponta para outro, ou se a resposta completou uma assinatura que o reference não traz.

## Owner

Israel.
