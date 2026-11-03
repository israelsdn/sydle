---
name: liquidacao
description: >-
  Explica a cadeia de liquidação do TJCE DEV: solicitação de pagamento, nota
  de liquidação, programação de desembolso, ordem bancária, retenção,
  gerenciador de credores e o swagger do SIAFE. Use quando o pedido citar
  liquidação, NL, PD, OB, solicitação de pagamento, credor de retenção,
  programação de desembolso, ordem bancária ou swagger desses documentos.
  Não autentica nem chama a API.
version: 1.0.0
---

# Liquidação

Índice da cadeia no TJCE DEV. IDs desse ambiente. Conexão e sessão ficam na skill `sydle`. Os scripts citados nos references estão no repositório Automação sydle.

## Gatilhos

Pedido sobre liquidação, NL, PD, OB, solicitação de pagamento, credor de retenção, programação de desembolso, ordem bancária ou o swagger desses documentos.

Não entra para login, `_get` genérico ou outra classe fora dessa cadeia (skill `sydle`).

## Entradas

O pedido e os contratos já escritos nos references. Não pede token, senha nem header `Authorization`.

## Saídas

Orientação e código alinhados a esses contratos. Id que não está no reference não é inventado: a constante fica vazia e o texto diz que falta.

## Onde ler

| Precisa de | Arquivo |
|---|---|
| Classes, campos, métodos, scripts, anexos, formas de pagamento | [references/modelo-sydle.md](references/modelo-sydle.md) |
| Endpoints, DTOs e o que o swagger marca como obrigatório | [references/swagger.md](references/swagger.md) |

Webservice `siafeCeApi`: `68e559b5ed7d450967b1fe6c`. Consulta unitária: `POST {recurso}/{exercicio}` com `codigo`, `codigoUG` e `exercicio`. O swagger de `ParamDocumento` também exige `id`; a consulta desta cadeia não envia `id`.

UGs conhecidas: `040001` (TJ), `040101` (FERMOJU), `040301`, `040401`.

| Documento | Classe | Busca |
|---|---|---|
| Solicitação | `6993752b26fb204b7f12dfc5` | `numeroDoProcesso.keyword` |
| NL | `6a91ffd3d9f4fe3b4d5d9416` | `notaLiquidacao.keyword` |
| PD | `6a943c65acc1527b13aafa1a` | `programacaoDesembolso.keyword` |
| OB | `6a949653acc1527b1381efef` | `ordemBancaria.keyword` |
| Credor de retenção | `6ab69d2efbd4546c58ec3355` | `codigoCredor` único |

O único de NL, PD e OB é `identificadorUnico`, oculto, calculado na escrita: código do documento mais `notaEmpenho.UG`.

## Limites

- Não autentica, não chama API e não grava objeto. Isso é a skill `sydle`.
- Não imprime token, senha nem `Authorization`.
- Não inventa id de classe, template ou atribuição.
- Não trata `204` como erro nem `403` como classe inexistente.
- Não manda `tipoPagamento: 9` em PD de retenção nem em PD de lista de favorecidos.
- Não republica `importarNotaLiquidacao` por cima da versão que está na plataforma.

## Verificação

A skill está certa quando o `SKILL.md` tem `name`, `description` e `version`, a description tem até 1024 caracteres e cita solicitação, NL, PD, OB, credor e swagger, e o detalhe está só em `references/`, num nível.

## Critério de falha

Falhou se a description narra o fluxo interno, passa de 1024 caracteres, se um reference aponta para outro, ou se a resposta inventou um id que não está nos references.

## Owner

Israel.
