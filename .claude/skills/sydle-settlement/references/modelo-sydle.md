# Modelo SYDLE — Nota de Liquidação (TJCE DEV)

Classe `NotaLiquidacao`, id `6a91ffd3d9f4fe3b4d5d9416`, pacote Solicitação de Pagamento. Implementa a interface de objeto `000000000000000000000087`.

## Campos

| Identifier | Tipo | Regra |
|---|---|---|
| `notaLiquidacao` | STRING | obrigatório, identidade, **não** único. Máscara de documento. Busca: `notaLiquidacao.keyword` |
| `identificadorUnico` | STRING | único, oculto, calculado `ON_WRITE`: `` `${notaLiquidacao}_${notaEmpenho.UG}` `` |
| `statusDocumento` | REFERENCE | obrigatório → `StatusDocumento` `6a957beccae6593700c81eb5`. Casar por `codigoExterno` |
| `notaEmpenho` | REFERENCE | obrigatório → `NotaEmpenho` `6929dd0ad933df1509871d42`. A UG mora aqui |
| `codigoProcesso` | REFERENCE | interface `000000000000000000000087`. Busca: `codigoProcesso._id` |
| `contratoRdp` | REFERENCE | `68b0ca7cf3f88178f6c7f3ff` |
| `tipoDeContabilizacao` | REFERENCE | `699742b76d17651293d3f047` |
| `codigoDocumentoAlterado` | REFERENCE | outra NL |
| `tipoAlteracao` | STRING | opções usadas no importador: `reforco`, `anulacao` |
| `observacao` | STRING | obrigatório |
| `nomeCredor`, `codigoCredor` | STRING | obrigatórios. Credor da NL |
| `dataEmissao`, `dataProcesso` | DATE | obrigatórias. `YYYY-MM-DD` do SIAFE vira `YYYY-MM-DDT12:00:00.000Z` |
| `dataCancelamento`, `dataContabilizacao` | DATE | |
| `valorBrutoOriginal`, `valorBrutoAtualizado`, `valorLiquidoBruto`, `valorLiquidoAtualizado` | DOUBLE | líquido = bruto − soma das retenções |
| `itensPatrimoniais` | REFERENCE múltipla | obrigatório → `6997673ed2edc06bd53a39d7`. Item da NL usa `valorASolicitar` e `dea` |
| `retencao` | REFERENCE múltipla | `69989ac0f4e4a90bd12f7e93` (tabela embutida da solicitação) |
| `classificacaoOrcamentaria` | REFERENCE | `6a95a0000fb75f2a6deecea3` |
| `classificacaoOrcamentariaIdentificador` | STRING | |
| `acao`, `elemento`, `fonte`, `outros` | STRING | ocultos |
| `codigoExterno` | STRING | oculto |
| `anexoDaNotaDeLiquidacao` | FILE | anexo da NL. Não recebe anexo de PD nem de OB |
| `tabelaProdutos` | REFERENCE | `69974c2ed2edc06bd57cbafe` |
| `signatarios` | REFERENCE | `6a95a3a420683b046621caa5` |
| `temMaisAssinatura` | BOOLEAN | |

`StatusDocumento` também tem `RASCUNHO`. A tradução da NL só reconhece `CONTABILIZADO`, `NAO_CONTABILIZADO` e `ANULADO`. `Excluído` do swagger não vira status.

## Métodos da classe

| Identifier | Papel |
|---|---|
| `importarNotaLiquidacao` | Formulário: `exercicio`, `codigoUG` (040001, 040101, 040301, 040401), `codigo`. Consulta o SIAFE e cria ou atualiza. |
| `obterNotaLiquidacao` | Leitura |
| `resumoDasNotasDeLiquidacao` | Resumo |
| `retencoesNotasLiquidacao` | Retenções |

Publicar método com formulário em dois patches: primeiro o método com `inputParameters: null`, depois o formulário. Criar método e formulário no mesmo patch gera `NumberFormatException` em `inputParameters`. Clonar o molde de um campo de negócio, nunca de campo de sistema (`_revision`).

## Scripts

| Arquivo | Papel |
|---|---|
| `scripts/sydle/importar-nota-liquidacao.js` | Importação manual. Atualiza se `notaLiquidacao.keyword` já existe; senão cria a partir da NE. |
| `scripts/sydle/listar-notas-liquidacao.js` | Conector. Só sincroniza NL **já cadastrada**. UG e exercício saem da NE. Lotes de 100 consultas. |
| `scripts/sydle/converter-notas-liquidacao.js` | Converte o retorno da listagem para o objeto SYDLE. |
| `scripts/sydle/montar-itens-nota-liquidacao.js` | Itens patrimoniais. |
| `scripts/sydle/montar-retencoes-nota-liquidacao.js` | Retenções da NL para o mapa da estrutura 38. |
| `scripts/adicionar-importar-nota-liquidacao.mjs` | Publica o método e o formulário. Republicar sobrescreve o script que estiver na plataforma. |

NE ausente na importação: buscar `identificadorUnico.keyword` = `{UG}_{codigoNE}` (exemplo `040101_2026NE000365`). Se não achar, `_extCriarOuAtualizarNEAPartirDaConsulta` com `codigoNE`, `codigoUG`, `exercicio`.

Tipo de retenção na importação: achar em `TipoRetencao` `68e416e9f9ee7374010c6559` pelo código que vem no texto `retencoesDTO.tipo`. Credor da retenção entra como texto (`codigoDoCredor`), não como o credor da NL.

## Anexo vindo do processo

Cada anexo vai para a própria classe, casando o processo:

| Formulário | Classe | Busca | Campo |
|---|---|---|---|
| `anexoDaNotaDeLiquidacao` | `6a91ffd3d9f4fe3b4d5d9416` | `codigoProcesso._id` | `anexoDaNotaDeLiquidacao` |
| `anexoDaProgramacaoDeDesembolso` | `6a943c65acc1527b13aafa1a` | `numeroProcesso._id` | `anexoProgramacaoDesembolso` |
| `anexoDaOrdemBancaria` | `6a949653acc1527b1381efef` | `codigoProcesso._id` | `anexoOrdemBancaria` |

O `_id` do objeto no patch é o `hit._id` do `_search`, não um `_id` dentro de `_source`.

## Programação de desembolso

Classe `ProgramacaoDesembolso` `6a943c65acc1527b13aafa1a`. Método `importarProgramacaoDesembolso`. Formulário: `exercicio`, `codigoUG`, `tipoProgramacao` (`orcamentaria` ou `retencao`), `codigo`. Sempre cria. Código já cadastrado interrompe antes de puxar NE ou NL.

`identificadorUnico` oculto: `` `${programacaoDesembolso}_${notaEmpenho.UG}` ``. O código `programacaoDesembolso` não é único.

Obrigatórios: `programacaoDesembolso`, `statusDocumento`, `contratoRdp`, `numeroProcesso`, `notaEmpenho`, `notaLiquidacao`, `valor`, `observacao`, `nomeCredor`, `codigoCredor`, `dataLancamento`, `dataVencimento`, `dataProgramacao`, `classificacaoOrcamentariaIdentificador`, `itensPatrimoniais`.

`numeroProcesso` é referência à interface `000000000000000000000087`. A importação prefere `notaLiquidacao.codigoProcesso`. A solicitação só entra se a NL não tiver processo, e a busca nela é `numeroDoProcesso.keyword` — esse campo na solicitação é STRING.

`ordemBancaria` é referência opcional para a OB. `statusExecucao` é texto livre.

Item da PD é outra classe, `SecaoItens` `6a95a147fd0bca533865a8cd`: `valor` e `DEA` (referência). Não usar `valorASolicitar` nem `dea` da NL.

| Arquivo | Papel |
|---|---|
| `scripts/sydle/importar-programacao-desembolso.js` | Importação manual. Tipo com `retenc` chama a consulta de retenção. |
| `scripts/sydle/cadastrar-pd-orcamentaria.js` | Atividade do processo. Cadastra no SIAFE sem contabilizar. Exige NL e domicílio de origem e de destino. |
| `scripts/sydle/cadastrar-pd-retencao.js` | Uma PD por linha de `formularioDeSolicitacao.retencao`. Sai se `temRetencao` for falso ou se não houver linha. |
| `scripts/sydle/montar-itens-programacao-desembolso.js` | Itens da PD orçamentária. |
| `scripts/sydle/montar-itens-pd-retencao.js` | Itens da PD de retenção. O credor da retenção fica no body (`codigoCredorRetencao`), não no item. |
| `scripts/sydle/cadastrar-pagamento-codigo-barras.js` | Antes da PD, quando o tipo bancário é código de barras. Grava `_pin.idsPagamentoCodigoBarras`. |

## Ordem bancária

Classe `OrdemBancaria` `6a949653acc1527b1381efef`. Sem método de importação na classe: a importação é o script do conector.

`identificadorUnico` oculto: `` `${ordemBancaria}_${notaEmpenho.UG}` ``. `ordemBancaria` não é único. `codigoProcesso` está oculto.

Obrigatórios: `ordemBancaria`, `statusDocumento`, `statusExecucao`, `statusEnvioOrdemBancaria`, `instrumento`, `notaEmpenho`, `valor`, `observacao`, `nomeCredor`, `codigoCredor`, `classificacaoOrcamentariaIdentificador`, `classificacaoOrcamentaria`, `itensPatrimoniais`. `notaLiquidacao` e `programacaoDesembolso` são opcionais.

`statusEnvioOrdemBancaria` é texto. Letras do swagger e códigos `STATUS_*` da listagem ao vivo convivem. Mapa da letra: `A` aguardando envio, `E` enviado ao banco, `G` aguardando geração de RE, `J` enviado manualmente, `N` não enviado, `P` parcialmente pago, `R` erro no pagamento, `S` processado e pago.

| Arquivo | Papel |
|---|---|
| `scripts/sydle/importar-ordem-bancaria.js` | Acha a PD, consulta o tipo certo, cria ou atualiza a OB e grava a referência na PD. |
| `scripts/sydle/cadastrar-ordem-bancaria-processo.js` | Atividade do processo. |
| `scripts/sydle/listar-ordens-bancarias.js` | Conector. Consulta a PD orçamentária e, se não achar, a de retenção. A OB segue o mesmo tipo. |
| `scripts/sydle/converter-ordens-bancarias.js` | Converte a listagem. |

Monitorar OB no processo: para cada item de `listaMonitoramento` com `ordemBancariaCadastradaSydle === false`, consultar a PD pelo `tipoProgramacaoDeDesembolso` (texto com `RETENC` usa os métodos de retenção) e gravar `envioStatus` em `statusExecucaoOrdemBancaria` e o código em `codigoOrdemBancaria`. A UG sai de `programacoesDeDesempenhoCadastradas`, casando `numero` ou `codigoExterno`.

## Solicitação de pagamento

Processo `6993752b26fb204b7f12dfc5`, nome Solicitação de Pagamento. Formulário embutido `formularioDeSolicitacaoDePagamento` `69961a7455390437744906c6`.

O processo lê e mostra: `numeroDoProcesso` (STRING, busca `.keyword`), `numeroNotaLiquidacao`, `numeroProgramacaoDesembolso`, `numeroDaOrdemBancaria`, `temRetencao`, `statusDoProcesso`. Formulários de PD: `formularioDeProgramacaoDeDesembolsoOrcamentario` `6aa832f3214e1343dffb9cd5` e `formularioDeProgramacaoDeDesembolsoOrcamentarioRetencao` `6aa98a03b99b6536a1514041`.

Anexos no processo, copiados para o documento: `anexoDaNotaDeLiquidacao`, `anexoDaProgramacaoDeDesembolso`, `anexoDaOrdemBancaria`. Logs: `logMonitorarNotaLiquidacao`, `logMonitorarProgramaDesembolso`, `logMonitorarPagamentoCodigoBarras`, `logMonitorarListafavorecidos`. PDs criadas: `programacoesDeDesempenhoCadastradas`. Retenções cadastradas: `retornosProgramacaoDesembolsoRetencao`. Acompanhamento da OB: `listaMonitoramento`.

No formulário, o que alimenta a liquidação:

| Campo | Uso |
|---|---|
| `tipoDePagamento` | `orcamentario` abre empenho, instrumento e contabilização. Extraorçamentário é outro ramo. |
| `numeroDoEmpenho` | NE. A UG usada na PD é `numeroDoEmpenho.UG`. |
| `instrumento` | vira `contratoRdp` |
| `tipoDeContabilizacao` | vai para a NL e para a montagem dos itens |
| `descricaoDoPagamento` | observação da PD |
| `dataDoProcesso` | competência e data de processo |
| `itensPatrimoniais` | itens da NL (`6997673ed2edc06bd53a39d7`: `valorASolicitar`, `dea`) |
| `retencao` | linhas que geram PD de retenção |
| `credor` | credor do pagamento, não o credor da retenção |
| `tipoDePagamentoBancario` | referência `6998c055e6f9e745195f8a65` |
| `anexosDeBoletos` | boletos do código de barras |
| `anexarListaDePagamento` | arquivo da lista de favorecidos. Aparece no tipo em lista e esconde a troca de dados bancários |

Tipos bancários usados no formulário: código de barras `6998c07bb9153459b124958a`, PIX QR `6998c081b9153459b125e888`, em lista `6a32b785a634a265838472b5`.

Métodos do processo que montam o SIAFE: `configurarItensNotaLiquidacao`, `configurarRetecoesNotaLiquidacao`, `configurarItensProgramacaoOrcamentaria`, `configurarItensProgramacaoRetencao`.

## Gerenciador de credores de retenção

Classe `GerenciadorCredoresRetencao` `6ab69d2efbd4546c58ec3355`. A tabela de retenção aponta este objeto em `credor`.

| Campo | Regra |
|---|---|
| `codigoCredor` | obrigatório e único |
| `nomeCredor` | oculto |
| `encontradoSiafe` | boolean |
| `aviso`, `sincronizar` | ocultos |

Método `adicionarNovaCredorDeRetencao` só faz `_create` do objeto recebido em `_input.gerenciadorCredoresRetencao`.

Não há endpoint SIAFE de “credores possíveis de retenção”. A carga feita no DEV veio dos `codigoCredorRetencao` distintos das PDs de retenção de 2026 nas quatro UGs (178 códigos) mais dois que já existiam na classe e não apareceram nesse exercício. `codigoCredor` da PD de retenção não é esse credor: na listagem ele quase não vem, e quando vem pode ser outro papel.

## Tipo de retenção e status

`TipoRetencao` `68e416e9f9ee7374010c6559`: `codigo`, `titulo`, `exercicio`, `codigoExterno` (único), `identidade` calculada, `ativo`. Origem: `GET apoio-geral/tipo-retencao/{exercicio}`.

`StatusDocumento` `6a957beccae6593700c81eb5`: `nome`, `codigoExterno` único. Códigos usados na tradução: `CONTABILIZADO`, `NAO_CONTABILIZADO`, `ANULADO`. A classe também tem `RASCUNHO`.
