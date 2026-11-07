# Swagger SIAFE — nota de liquidação

Base: `https://homol-siafe.sefaz.ce.gov.br/siafe-api`. Grupo G1. Autenticação da API SIAFE é `Bearer` JWT, distinta da sessão SYDLE.

Datas de cadastro/consulta no padrão `YYYY-MM-DD`. Competência de documento fiscal: `MM/AAAA`.

## Endpoints

| Método | Path | Uso |
|---|---|---|
| POST | `/nota-liquidacao/{exercicio}` | Consulta uma NL. Body `ParamDocumento`. Resposta `NotaLiquidacaoDTO`. |
| GET | `/nota-liquidacao/{exercicio}/{codigoUG}` | Lista NLs contabilizadas e anuladas da UG. |
| POST | `/nota-liquidacao/{exercicio}/{pagina}/{totalRegistroPagina}` | Consulta paginada. Body `ParamConsultaPaginadaNotasDTO`. Resposta `ParamPaginacao«NotaLiquidacaoDTO»`. |
| POST | `/nota-liquidacao/cadastro/{exercicio}` | Cadastra. Body `ParamCadNLDTO`. Resposta `NLCadastradaDTO` (`id`, `codigo`, `ugEmitenteCodigo`, `dataEmissao`). |
| PUT | `/nota-liquidacao/anulacao/{exercicio}` | Anula. Body `ParamAnulacaoNL`. Resposta `NotaLiquidacaoDTO`. |

## Consulta — `ParamDocumento`

Swagger exige `codigo`, `codigoUG` e `id`. A consulta usada no webservice manda só `codigo` e `codigoUG`.

- `codigo` — número do documento, exemplo `2023PD000001` (o exemplo do swagger é de PD; para NL o código é `AAAANL99999`, como `2026NL002723`).
- `codigoUG` — UG emitente, 6 dígitos (`040101`).
- `id` — id interno do SIAFE. Não usar na consulta por código.

## Consulta paginada — `ParamConsultaPaginadaNotasDTO`

Obrigatórios no swagger: `codigo`, `codigoNE`, `codigoUG`.

Filtros opcionais: `dataInicio` / `dataFim` (contabilização), `dataAnulacaoInicio` / `dataAnulacaoFim`, `tipoCredor`, `codigoCredor`, `codigoContratos`, `numeroOriginalContratos`.

A paginação de resposta traz `possuiProximaPagina`, `totalPaginas`, `totalPaginasRestantes` e `registros` (`NotaLiquidacaoDTO`).

## Cadastro — `ParamCadNLDTO`

Obrigatórios no swagger: `codProcesso`, `dataProcesso`, `observacao`.

| Campo | Observação |
|---|---|
| `dataEmissao`, `dataProcesso`, `dataLiquidacao` | `YYYY-MM-DD` |
| `codigoUG` | UG emitente |
| `codigoNE` | NE vinculada, exemplo `2022NE00001` |
| `tipoContabilizacaoNL` | `CONTABILIZAR_RECONHECER_PASSIVO`, `CONTABILIZAR_LIQUIDAR_NL`, `CONTABILIZAR_LIQUIDAR_E_RECONHECER_PASSIVO`, `CONTABILIZAR_LIQUIDAR_NE` |
| `flgContabilizar` | boolean |
| `statusComplementarNL` | `Indefinido`, `Em liquidação`, `Liquidado`, `Passivo reconhecido e Liquidado` |
| `codigoNLAlterada` | preenchido só em documento de alteração |
| `tipoAlteracao` | `0 - Nenhuma`, `1 - Anulação`, `2 - Reforço`, `3 - Devolução`, `4 - Anulação Restos a Pagar`, `5 - Estorno` |
| `classificacao` | mapa da estrutura classificatória **22** |
| `itens` | `ParamCadNLItemDTO` |
| `retencoes` | `ParamCadNLRetencaoDTO` |
| `documentosFiscais` | `ParamCadNLDocFiscalDTO` |

### Item — `ParamCadNLItemDTO`

Obrigatórios: `classificadores`, `valor`. `classificadores` é o mapa do item (`paramClassificador`).

### Retenção — `ParamCadNLRetencaoDTO`

`valor`, `valorBaseCalculo`, `classificadores`. Os classificadores da retenção são a estrutura **38**.

Na **consulta**, a retenção volta em `retencoesDTO` (`RetencaoDTO`): `credor` (texto), `tipo` (texto, no padrão `"112 - ..."`), `valor`, `justificativa`. Não volta um objeto de credor.

### Documento fiscal — `ParamCadNLDocFiscalDTO`

`numero`, `idTipo`, `data`, `processo`, `competencia` (`05/2022`), `valor`, `codigoTipoSerie`, `descricaoTipoSerie`, `cdVerificacao`, `cdChaveAcesso`.

## Retorno — `NotaLiquidacaoDTO`

O swagger lista um conjunto grande como required (processo, classificação, credor, datas, itens, status). Campos que o importador usa:

| Campo | Uso |
|---|---|
| `codigo` | vira `notaLiquidacao` |
| `codigoUG`, `nomeUG` | UG não é persistida na NL; serve para achar a NE |
| `codigoEmpenhoVinculado` / `exercicioNE` | NE vinculada |
| `codigoCredor`, `nomeCredor` | credor da NL, não o credor da retenção |
| `codProcesso`, `dataProcesso` | processo |
| `dataEmissao`, `dataContabilizacao`, `dataCancelamento` | datas |
| `statusDocumento` | rótulo no swagger: `Não contabilizado`, `Contabilizado`, `Anulado`, `Excluído`. Ao vivo também chega `CONTABILIZADO`, `NAO_CONTABILIZADO`, `ANULADO` |
| `tipoAlteracao` | mesmo enum do cadastro |
| `codigoDocAlterado` | NL alterada |
| `valor` | valor bruto |
| `observacao` | observação |
| `codContrato`, `numOriginalContrato` | contrato |
| `codFonte`, `codNatureza`, `codClassificacao`, `classificadores` | classificação. Estrutura do documento: **22** |
| `itens` | itens (`ParamDocumentoItem`) |
| `retencoesDTO` | retenções |
| `documentosFiscaisDTO` | fiscais |
| `valorSaldoEmpenho` | saldo da NE |

## Anulação — `ParamAnulacaoNL`

Obrigatórios: `codigo`, `codigoSistemaExterno`, `codigoUGEmitente`, `dataEmissaoCancelamento`, `idCorrelacao`, `justificativaCancelamento`.

`codigo` no exemplo `9999NL99999`. `dataEmissaoCancelamento` é a data em que o cancelamento é apropriado.

## Tipos de retenção

`GET /apoio-geral/tipo-retencao/{exercicio}` devolve `{ codigo, titulo }`. Não devolve credor. No webservice o método é `obterTipoRetencao`.

## Programação de desembolso

Consulta unitária, body `ParamDocumento` (`codigo`, `codigoUG`; sem `id` no projeto):

| Tipo | POST | Resposta |
|---|---|---|
| Orçamentária | `/programacao-desembolso-orcamentaria/{exercicio}` | `ProgramacaoDesembolsoOrcamentariaDTO` |
| Retenção | `/programacao-desembolso-retencao/{exercicio}` | `ProgramacaoDesembolsoRetencaoDTO` |
| Extraorçamentária | `/programacao-desembolso-extra-orcamentaria/{exercicio}` | `ProgramacaoDesembolsoExtraOrcamentariaDTO` |
| Transferência | `/programacao-desembolso-transferencia/{exercicio}` | `ProgramacaoDesembolsoTransferenciaDTO` |

Listagem: `GET /{recurso}/{exercicio}/{codigoUG}` e o mesmo path com `{dataInicio}` ou `{dataInicio}/{dataFim}`. Data `YYYY-MM-DD`.

### Retorno orçamentário

Além do miolo comum (`codigo`, `codigoUG`, `codigoCredor`, `nomeCredor`, `statusDocumento`, `valor`, `observacao`, `codProcesso`, `dataProcesso`, `itens`, `classificadores`):

`codigoNL`, `codigoNE`, `codigoOB`, `codUgPagadora`, `competencia`, `dataLancamento`, `dataProgramacao`, `dataVencimento`, `domicilioBancarioOrigem`, `domicilioBancarioDestino`, `obLine`, `pagamento`, `pagamentoCodigoBarras`, `statusEnvioOB`, `statusExecucao`, `tipoPD`, `tipoOB`, `valorTotalPD`.

`statusExecucao` no swagger: `Paga`, `Executando`, `Agendada`, `Disponível`, `Erro`, `Autorizada`, `Aguardando Autorização`. Ao vivo também aparece `STATUS_EXECUTADA`.

`statusEnvioOB` é texto. Letras do swagger, no campo da PD: `A` aguardando envio, `E` enviado ao banco, `G` aguardando geração de RE, `J` enviado manualmente, `N` não enviado, `P` parcialmente pago, `R` erro no pagamento, `S` processado e pago.

### Retorno de retenção

Igual ao orçamentário no miolo, mais `codigoCredorRetencao`, `nomeCredorRetencao`, `codigoTipoRetencao`, `tipoRetencao`, `notasVinculadas`, `codigoOBRegularizacao`. O credor da retenção é `codigoCredorRetencao`, não `codigoCredor`.

### Cadastro de retenção — `ParamProgramacaoDesembolsoRetencao`

`POST /programacao-desembolso-retencao/cadastro/{exercicio}`. Resposta `ProgramacaoDesembolsoCadastradoDTO`.

Obrigatórios no swagger: `codigoTipoRetencao`, `codigoUgEmitente`, `codigoUgPagadora`, `dataEmissao`, `dataProcesso`, `dataProgramacao`, `dataVencimento`, `domicilioBancarioDestino`, `domicilioBancarioOrigem`, `obLine`, `ugEmitenteCodigo`, `ugPagadoraCodigo`.

Também entram `codigoCredorRetencao`, `competencia`, `processoCodigo`, `observacao`, `tipoRegularizacao`, `codigoListaFavorecidoOB`, `contabiliza`, `itens`.

`tipoRegularizacao`: `REG_OB_JA_ENCAMINHADA`, `REG_OB_TRANSFERENCIA_VOLUNTARIA`, `REG_OB_PAGA_POR_OFICIO`, `REG_OB_PREVIAMENTE_PAGA_POR_OB_EXTRA`, `REG_OB_REGULARIZACAO_CONTABEIS_DIVERSAS`, `REG_OB_VALOR_RETIDO_TRANSFERIDO`, `REG_OB_IR_CUTE`, `REG_OB_COMPLEMENTAR`, `REG_PAGAMENTO_GRE`.

Domicílio (`ParamDomicilioBancarioCadastroPD`): `bancoCodigo`, `agenciaCodigo`, `codigo` (conta com dígito). Procedimentos aceitos na conta de destino pela regra de contabilização: `DEPJU`, `REGULARIZA`, `LISTA`, `AUTENTICAC`, `CQAVULSO`, `CODBARRAS`, `LISTABRADESCO`.

`ugEmitenteCodigo` e `ugPagadoraCodigo` são inteiros legados. O que vale é `codigoUgEmitente` / `codigoUgPagadora` com os 6 dígitos. Inteiro com zero à esquerda vira nulo.

### Cadastro orçamentário

O grupo G1 atual não publica o POST de cadastro da PD orçamentária. O processo cadastra pelo webservice `cadastrarProgramacaoDeDesempenho`, com body montado em `scripts/sydle/cadastrar-pd-orcamentaria.js`: `tipo: "TIPO_ORCAMENTARIA"`, `notaLiquidacaoCodigo`, UG emitente e pagadora, domicílios, `competencia`, `processoCodigo`, `contabiliza: false`, `itens`. Código de barras acrescenta `tipoPagamento: 9` e `idsPagamentos`. Lista de favorecidos acrescenta `codigoListaFavorecidoOB` e troca o destino para `LISTA`.

## Ordem bancária

O G1 atual só publica:

- `GET /ordem-bancaria-extra-orcamentaria/{exercicio}/{codigoUG}`
- `POST /ordem-bancaria/{exercicio}/{pagina}/{totalRegistroPagina}` com `ParamConsultaPaginadaOBDTO`

O webservice do projeto consulta mesmo assim, no mesmo desenho da NL:

| Tipo | POST |
|---|---|
| Orçamentária | `/ordem-bancaria-orcamentaria/{exercicio}` |
| Retenção | `/ordem-bancaria-retencao/{exercicio}` |

Listagem usada no projeto: `GET /ordem-bancaria-orcamentaria/{exercicio}/{codigoUG}/{dataInicio}/{dataFim}` e o equivalente `ordem-bancaria-retencao`. Essas listagens devolvem `envioStatus` em código `STATUS_*`, não a letra do swagger. `statusExecucao` e `statusEnvioOB` vieram vazios nessa listagem.

`STATUS_RETORNADO_SUCESSO_PARCIAL`: o banco processou a lista de beneficiários e alguma linha falhou. O documento pode continuar contabilizado. `STATUS_ENVIADO`: a remessa saiu no registro de envio e o banco ainda não devolveu sucesso, parcial ou erro.

## Código de barras e lista de favorecidos

Fora do G1 atual. O webservice já chama:

| Método SYDLE | POST |
|---|---|
| `cadastrarPagamentoCodigoBarras` | `/codigo-barras/{exercicio}` |
| `consultarListaDeFavorecidos` | `/lista-favorecido-ob/consulta/{exercicio}/` |
| `cadastrarListaDeFavorecidos` | `/lista-favorecido-ob/{exercicio}` |

Cadastro do código de barras (`ParamCadPagamentoDTO`): `codUG`, `tipoCodigoBarra` (`BOLETO`, `FATURA`, `BOLETO_JUDICIAL`, `FATURA_GRU`), `codigoBarraFormatado`, `linhaDigitavel`, `codCredor`, `codBeneficiario`, `tipoCredor`, `valorLiquido`, `status: "LIBERADO"`. Retorno: `idPagamento`. Na PD orçamentária isso vira `tipoPagamento: 9` e `idsPagamentos`.

Cadastro da lista (`paramCadastroLB`): `codigo`, `unidadeGestora`, `nome`, `folhaPagamento`, `status`, `itens`. Item obrigatório: `tipo` (`PF` ou `PJ`), `codigoCredor`, `banco`, `agencia`, `conta`, `valor`. O `codigo` da lista é o `codigoListaFavorecidoOB` da PD. Lista vinculada a PD ou OB não pode mais ser alterada nem excluída.
