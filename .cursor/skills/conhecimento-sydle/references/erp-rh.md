# ERP e recursos humanos

Contrato destilado da wiki para quem implementa folha, frequência ou lançamento financeiro no SYDLE ONE: apuradores, as classes da geração da folha, níveis salariais, eSocial, fatura, informe de rendimentos, a classe embutida Buscar Cliente, movimentação do colaborador e o pacote de ponto. Entram campos, métodos, entradas e efeitos que o artigo publica. Onde o texto não traz identificador, assinatura ou passo, isso fica de fora.

## Apuradores de folha de pagamento

**O que é.** A apuração consolida memória de cálculo e valores compartilhados. O apurador gera essa apuração durante o processamento da folha. A associação fica no campo múltiplo Apuradores, na vigência do script do item de remuneração. Cada processamento executa de novo os apuradores.

**Contrato.** A classe de apuração separa campos de identidade, originais da classe, e campos de dados adicionais, próprios de um apurador. O identificador, definido pelas chaves do apurador, funciona como chave primária. A data da apuração entra na lógica de reaproveitamento de apurações com o mesmo identificador. Todo apurador tem uma classe de dados adicionais com os campos calculados e um método `calculate`. O campo Remover caso retorno vazio define o que fazer quando o `_output` desse `calculate` vem vazio. O preenchimento dos dados adicionais da apuração é dinâmico: a classe de dados adicionais é lida do apurador referenciado, pela lógica de `_updateDraft` dessa classe. O mesmo desenho aparece em Movimentação de Colaborador (pacote Recursos humanos, campo `movementData`), Avaliação de desempenho (pacote Gestão de Competências, campo `dadosDoQuestionario`), Forma de pagamento de retroativo (pacote Retroativos, campo `paymentAdditionalData`, formulário de entrada do método Gerar eventos para pagamento da classe Apuração de retroativos calculados) e Conector de consignação (pacote Margem consignável, campo `conector`, formulário de entrada do método Margem - Processar consignações da classe Controle de margem). A classe de dados adicionais pode ter outros métodos; o retorno dos valores continua no fluxo do `calculate`.

O processamento de uma classificação individualiza a chamada por beneficiário de remuneração. Passa por `calculateItems` (classe Demonstrativo de pagamento) e por `calculate` (classe Item de remuneração) em cada item vigente e aplicável. Esse `calculate` lê os apuradores da vigência, chama `calculate` da classe Apurador, e este chama o `calculate` dos dados adicionais. O `calculate` dos dados adicionais recebe, por padrão, um `_input` semelhante ao do script do item. O `_output` é um objeto cujas chaves são idênticas aos campos da classe de dados adicionais modelada. Depois desse retorno, `calculate` da classe Apuração gera a apuração. No `_input` do item, as apurações referenciadas ficam no array `calculations`; os valores calculados ficam em `additionalData`.

Na versão 8.29.7, `com.sydle.hr.Calculator.calculate` recebe: `_id` (id do apurador a chamar), `forceCalculation`, `staffMember`, `securityBenefit`, `competence`, `refMonth`, `compensationItem`, `payroll`, `leave`, `year`, `calculations` (acumulado das apurações), `remunerations`, `additionalRemunerations`, `remuneration`, `additionalRemuneration`, `dependents`, `benefits`, `benefitItem`, `benefitItems`, `consignments`, `consignmentItem`, `consignmentItems`, `supplementaryPension`, `supplementaryPensions`, `items`, `validity`, `numberOfDays`, `remunerationEvents`, `retroativeDate`.

Para exibir valores de itens na apuração, reaproveitar a classe embutida Item de remuneração do colaborador (`embeddedCompensationItem`), a mesma componente da tabela de itens do demonstrativo.

**Armadilhas.** A mesma condição de chaves gera apuração só na primeira chamada. Com Beneficiário de remuneração entre as chaves, a geração fica no item de ordem mais baixa. Sem segregação por colaborador ou beneficiário, quem gera é o item de ordem mais baixa da primeira execução da folha. Para cada chamada com as mesmas chaves atualizar a apuração, dividir em dois apuradores, o segundo alimentado pelo primeiro. Forçar atualização fora desse fluxo dificulta depuração e manutenção. Chave a mais duplica ou impede a geração. A maioria dos casos usa Competência, Apurador e Folha de pagamento; apuração por colaborador ou beneficiário inclui também Beneficiário de remuneração. O artigo de arquitetura da folha chama o método da classe de dados de "Apurar", na interface Gerador de apuração / Recursos Humanos. Este artigo chama `calculate` em dados adicionais, Apurador e Apuração. Os textos não publicam o mapa entre o rótulo e o identificador.

```javascript
const calculation = com.sydle.hr.Calculator.calculate({
    _id: _id,
    forceCalculation: forceCalculation,
    staffMember: staffMember,
    securityBenefit: securityBenefit,
    competence: competence,
    refMonth: refMonth,
    compensationItem: compensationItem,
    payroll: payroll,
    leave: leave,
    year: year,
    calculations: calculations,
    remunerations: remunerations,
    additionalRemunerations: additionalRemunerations,
    remuneration: remuneration,
    additionalRemuneration: additionalRemuneration,
    dependents: dependents,
    benefits: benefits,
    benefitItem: benefitItem,
    benefitItems: benefitItems,
    consignments: consignments,
    consignmentItem: consignmentItem,
    consignmentItems: consignmentItems,
    supplementaryPension: supplementaryPension,
    supplementaryPensions: supplementaryPensions,
    items: items,
    validity: validity,
    numberOfDays: numberOfDays,
    remunerationEvents: remunerationEvents,
    retroativeDate: retroativeDate
});
```

O `_output` abaixo é o exemplo do apurador de base de cálculo do INSS, não o formato universal. O formato universal é a chave igual ao campo modelado.

```javascript
_output = {
    compensationItems: compensationItems,
    baseValue: calculateBaseValue(items)
};
```

## Arquitetura básica da folha de pagamento

**O que é.** A geração da folha se apoia em Colaborador, Apurador, Apuração, Item de remuneração, Evento de remuneração, Demonstrativo de pagamento e Folha de pagamento. Benefício, gratificação e afastamento podem entrar no cálculo, conforme a rubrica e o lugar do dado.

**Contrato.** O colaborador precisa existir para ser processado. A folha usa: Pessoa (nome, documentos, contatos, e-mails, endereços, falecimento e dados bancários), Empresa, Matrícula, Tipo de vínculo, Cargo e nível, Cargo adicional e nível adicional, Data de início, Data de saída, Remuneração e remuneração adicional, Dependentes, Status do colaborador e Dados adicionais.

O apurador tem Nome, Identificador e Classe de dados de apuração. Esse campo referencia uma classe da interface Gerador de apuração / Recursos Humanos, com os campos da apuração e o método "Apurar". Exemplo citado: apurador de frequência gera consolidados de frequência, dias em afastamento e cargas horárias do colaborador no mês. A apuração guarda o resultado para o cálculo dos itens e o histórico.

Item de remuneração é a rubrica. Tem Código, Descrição, Tabela do eSocial e Dados adicionais. A vigência tem data de início, data de fim, tipos de vínculo, cargos, benefício e classificações de folha; a combinação diz em que caso o item se aplica. O exemplo Estágio Nível Médio vale para tipo de vínculo Estagiário, cargo Estagiário Nível Médio e classificação Mensal. Também entram tipo, natureza, códigos de incidência de IRRF, RGPS, RPPS e FGTS, compõe teto remuneratório, repercute no 13º, repercute nas férias, Ordem de cálculo, Apuradores e Script de cálculo. Os apuradores da vigência são gerados antes do script e disponibilizados no input.

Input do script do item: `refMonth`, `staffMember`, `remuneration`, `additionalRemuneration`, `dependents`, `benefitItems`, `payroll`, `calculations` (o artigo chama de objeto com apurações), `items` (itens já calculados) e `validity`. Item não calculado retorna nulo. Item calculado retorna `reference` (`number` e `unit`), `salary`, `discount` e `cost`.

Evento de remuneração cobre rubrica eventual, fora da regra mensal (devolução, diferença, diária). Campos: Data do evento, Data de vencimento (mês/ano, alinhada à competência da folha em que o evento entra), Colaborador, Classificação, Observação e Itens de remuneração (rubrica e valor). Na geração, entra o evento que ainda não entrou em folha nenhuma e que casa com classificação e competência; ele é preenchido com o demonstrativo correspondente.

O demonstrativo é o contracheque de uma folha e competência. Traz folha, tipo de vínculo, nível, cargo, status e a tabela Itens de remuneração: referência do item, Vencimento, Desconto, Custo e Referência (número e unidade; o exemplo do artigo é 30 dias).

A folha tem Identificador (padrão de nomenclatura incrementado automaticamente; o texto não publica o padrão), Classificação, Empresa, Dados adicionais (interface gerador de folha de pagamento, com data de pagamento e competência de pagamento, entre outras), Status (exemplos: aberta, fechada), Itens (somatório), Vencimentos, Descontos, Valor líquido e Custos.

Geração: `generatePayroll` dos colaboradores; escolha de empresa, competência e classificação; criação da folha ou atualização da folha de mesma competência e classificação que esteja com status aberto; `generatePayroll` do gerador de folha da classificação; seleção dos colaboradores; demonstrativos processados de forma assíncrona. No demonstrativo: criar ou atualizar o objeto ligado à folha, integrar os eventos de remuneração e executar `calculateItems`. Esse método filtra os itens pela vigência, cria as apurações quando a vigência tem apuradores e aciona o script.

**Armadilhas.** São dois `generatePayroll`: o dos colaboradores e o do gerador da classificação. Demonstrativo é assíncrono. Folha de mesma competência e classificação só é atualizada se o status estiver aberto. Evento de remuneração que já entrou em alguma folha não entra de novo. O input do item lista `calculations` como objeto; o artigo de apuradores lista `calculations` como array, com o valor em `additionalData`.

```javascript
return {
    reference: {
        number: DIAS_MES,
        unit: "days"
    },
    salary: 0,
    discount: valorRetornado,
    cost: 0
};
```

## Níveis salariais de cargo

**O que é.** A classe Níveis Salariais de Cargo (`JobSalaryLevels`), tipo Padrão, complementa Cargo (`jobTitle`) com faixas e histórico de remuneração do cargo. É usada no modelo de folha.

**Contrato.** Campos: `jobTitle`, `startDate`, `endDate`, `salaryLevels` (faixas, inclusive mínimo, médio e máximo), `note`, `attachments`, `remunerationAdjustmentReason` e `additionalData`. Para criar o registro, Cargo e Data de início são obrigatórios. Data de início abre a vigência; Data de fim encerra. Períodos diferentes guardam configurações próprias.

Na classe Cargo há os métodos Alterar níveis salariais e Alterar níveis salariais por porcentagem. O de porcentagem seleciona cargos e aplica o percentual a todos os colaboradores enquadrados em algum nível impactado. Obrigatórios nesse método: Cargos, Porcentagem (%) e Data de início de vigência. A Data dos efeitos remuneratórios controla quando o impacto financeiro passa a valer. Complementam: Grupos de cargo, Tipo de cargo, Observação, Anexos e Motivo de ajuste da remuneração. O artigo não publica identificador nem assinatura desses métodos.

**Armadilhas.** Data de início de vigência e Data dos efeitos remuneratórios são campos distintos. O percentual atinge o colaborador enquadrado no nível, não só a tabela do cargo.

## Como funciona o eSocial

**O que é.** O eSocial é o sistema do Governo Federal que unifica informações trabalhistas, previdenciárias e fiscais. O módulo do Sydle One cobre o ciclo do evento: cadastro, geração, envio e retorno.

**Contrato.** Eventos de tabela descrevem empregador e operação e vão antes dos demais, a partir do S-1000 (Informações do Empregador/Contribuinte). Eventos não periódicos não têm data fixa (admissão, alteração cadastral ou salarial, afastamento, acidente de trabalho, desligamento). O S-2200 (Cadastramento Inicial do Vínculo e Admissão/Ingresso de Trabalhador) precede um evento de pagamento. Eventos periódicos são recorrentes (folha e contribuições). O S-1210 (Pagamentos de Rendimentos do Trabalho) depende do S-1200 (Remuneração do Trabalhador), e este depende de outros eventos. Eventos da mesma categoria também dependem entre si.

O ciclo exemplificado é o S-1000. Cadastrar a empresa com CNPJ válido na classe "empresa" e o empregador na classe "empregador". A integração exige o campo Certificado digital, emitido por autoridade ICP-Brasil, série A, tipo A1 ou A3, e-CPF (e-PF) ou e-CNPJ (e-PJ). No objeto do empregador, o botão Sincronizar com o eSocial abre o formulário; a confirmação cria um Evento do eSocial. Criar o evento não envia. O botão pode se chamar Sincronizar com o eSocial ou Gerar o evento do eSocial, conforme o tipo de evento. O envio é uma execução da classe Enviar eventos para o eSocial, com empregador, tipo de ambiente, tipo de envio, grupo (tabela, não periódico ou periódico), tipo de evento e demais dados do formulário. O envio automático ocorre na confirmação.

Quatro processos compõem o envio: Gerar lote de eventos do eSocial, Processar lote de eventos do eSocial, Importar retorno de lote de eventos do eSocial e Processar recibo do eSocial. Erro em um deles se reprocessa nesse objeto. O acompanhamento é a classe Evento do eSocial.

**Armadilhas.** Ambiente de produção restrita é o código 2 (teste). Ambiente de produção é o código 1 (oficial). Antes do envio o status é "Aguardando processamento". Retorno correto fica "Processado". Erro de cadastro fica "Erro", com XML do que está incorreto ou faltando; o código fica no fim da página, no campo Avançado.

## Contas a pagar/receber (Classe Fatura)

**O que é.** Fatura é o registro financeiro A Receber ou A Pagar: valores, datas, participantes e status de cobrança. Pode ter itens de cobrança.

**Contrato.** O artigo lista como necessárias para criar: Tipo (A Receber ou A Pagar); Código, gerado pelo sistema; Pagador, referência a Cliente, quem paga; Beneficiário, referência a Cliente, quem recebe; Mês de referência; Status, referência a Status de Cobrança (exemplos: Emitida, Paga); Moeda; Valor total; Valor pago; Data de vencimento; Data de agendamento do pagamento; Data de pagamento; Classificação, referência a Classificação de Fatura (exemplo: Imposto); Forma de pagamento; Código externo; Código de barras.

Item: Tipo (texto), Tributo (referência a Tributo), Valor (decimal) e Moeda.

Registrar pagamento recebe Data de pagamento, Valor pago e Data de repasse. Depois, o status fica Paga.

Remover pagamento recebe Valor removido. Depois, o status fica Emitida.

Alterar forma de pagamento exibe a forma atual, somente leitura, e pede Nova forma de pagamento (referência a Forma de Pagamento), Arrecadar imediatamente (booleano: cobra na hora com a nova forma) e Cancelar remessas em aberto (booleano: cancela remessas ainda não processadas da forma anterior). A operação atualiza o cadastro e preserva o histórico. O artigo não publica identificador desses métodos.

**Armadilhas.** Pagador e beneficiário são os dois referências a Cliente. Registrar pagamento leva o status a Paga. Remover pagamento leva o status a Emitida. O artigo não descreve status intermediário nem o efeito de um valor removido parcial.

## Geração de Informe de Rendimentos

**O que é.** O informe é o comprovante anual da fonte pagadora para o beneficiário. O método Gerar Informe De Rendimento, identificador `generateIncomeReport`, da classe Colaborador, monta o comprovante pelas remunerações e folhas do ano, classificando cada rubrica pela natureza e pela incidência de Imposto de Renda.

**Contrato.** Cinco etapas: entrada (colaborador, ano e responsável pelas informações); busca das remunerações do ano; classificação da rubrica; totais no padrão brasileiro de duas casas (0,00); PDF. O PDF exige Colaborador com pessoa e empresa, Ano e Responsável pelas informações. Sem pessoa ou sem empresa, o PDF não sai.

A vigência lida é a da rubrica na data da folha. Os dois pontos são o código de incidência de IR (tributável, isento ou retenção) e a natureza. Desconto entra negativo. O que não é desconto entra pelo vencimento.

O campo "Somente para demonstrativos pagos?" / filtro "Somente remunerações pagas" muda a seleção. Sem o filtro, o agrupamento é pela competência (mês e ano de referência da folha). Com o filtro, a busca usa a data de pagamento ou a data de recolhimento ocorrida dentro do ano, e a remuneração precisa estar com status "pago". Valor trabalhado em dezembro e depositado em janeiro fica no informe do ano do recebimento.

Quadro 3, tributáveis:

- Total dos rendimentos: incidência de IR 11 ou 13.
- Contribuição previdenciária oficial: descontos de natureza 9201, exceto o INSS do 13º (código 32).
- Previdência complementar / FAPI: descontos de IR 46, 48, 61, 63 ou 66.
- Pensão alimentícia: descontos de IR 51 ou 53.
- Imposto sobre a renda retido na fonte: descontos de natureza 9203, exceto o IR do 13º (código 32).

Quadro 4, isentos:

- Diárias e ajuda de custo: naturezas 1601 a 1604 ou 1650 a 1652 com IR de isenção (código começando em 7).
- Lucros e dividendos / PLR: natureza 1300.
- Indenizações por rescisão: naturezas 6003, 6101 a 6107 e 6129.
- Outros: IR de isenção (código começando em 7) fora das naturezas acima. O artigo cita desconto de férias e vale-alimentação.

Quadro 5, exclusiva:

- Décimo terceiro: naturezas de 13º (o artigo exemplifica 5001, 5504 e 6001), exceto parcelas isentas de IR 71, menos as deduções legais atreladas.
- IRRF sobre o 13º: descontos de natureza 9203 com incidência 32.

Quadro 6, RRA: só folhas classificadas como RRA. Extrai número do processo, meses e despesas judiciais da última folha processada.

No objeto, o método fica no menu do colaborador e gera só aquele objeto. Geração em lote não é nativa; é extensão de classe, pode não existir ou variar, e o lugar mais comum é a listagem de Colaboradores.

A chamada via script espera `staffMember`, `person`, `enterprise`, `year` e `responsible`. O exemplo do artigo usa o placeholder `ID_CLASSE_COLABORADOR`; o texto não publica o id da classe.

**Armadilhas.** Competência e regime de caixa são seleções diferentes, ligadas ao filtro de demonstrativos pagos. Natureza 9203 com incidência 32 é o IR do 13º (quadro 5), não o IRRF do quadro 3. Isenção é código que começa em 7. As naturezas 5001, 5504 e 6001 são exemplo, não a lista fechada de 13º.

```javascript
_utils.getMethod("_classId", ID_CLASSE_COLABORADOR, "generateIncomeReport")({
    staffMember: staffMember,
    person: person,
    enterprise: enterprise,
    year: year,
    responsible: responsible
});
```

## Instruções para utilização da classe Buscar Cliente

**O que é.** Buscar Cliente preenche pessoa física ou empresa. O formulário troca os campos conforme Física ou Jurídica, busca Pessoa ou Empresa do CRM ao digitar CPF ou CNPJ e completa os dados. Criação e atualização usam metadata configurada na classe pai, que embute Buscar Cliente. Atualização citada no artigo: 13/11/2023. Se o ambiente não tiver a classe, o artigo indica um Sybox de instalação nomeado Buscar Cliente - DEV (ambiente SEMAS-PA). O texto não traz a URL do arquivo.

**Contrato.** Sequência publicada: criar a classe de dados de pessoa ou empresa; se houver troca entre Física e Jurídica, criar nela o campo de tipo; criar o campo referência embutida para Buscar Cliente. O padrão da classe é Física (CPF, nome, nome da mãe, data de nascimento e outros). Tipo fixo: script em Criar Rascunho. Troca durante o preenchimento: script em Atualizar Rascunho. Um script de Buscar Cliente renderiza os campos do tipo selecionado.

Metadata (visibilidade, obrigatoriedade, nome) passa pelo campo que o artigo escreve `AlteraraçãoDeMetadata`, com a classe Alteração de Metadata, em script de Criar Rascunho ou Atualizar Rascunho da classe pai. O trio é Campo (identificador), Propriedade (`name`, `readOnly`, `hidden`) e valor (booleano, string ou número). Caminhos: dados gerais da raiz (e-mail, telefone, endereço) em `buscarCliente.alteracaoDeMetadata`; pessoa física em `buscarCliente.dadosPessoa.alteracaoDeMetadata`; pessoa jurídica em `buscarCliente.dadosEmpresa.alteracaoDeMetadata`. O script que aplica esse metadata já é padrão da classe; o artigo não cola o corpo.

O método "[Sydle] Criar ou Atualizar Cliente no Sydle" recebe o próprio formulário. As flags Criar nova Pessoa/Empresa e Atualizar Pessoa/Empresa saem do formulário. Na chamada via script, o body é a Buscar Cliente embutida. O artigo não cola a assinatura.

**Armadilhas.** Não editar Buscar Cliente: a classe serve a vários projetos. Campo que não existe nela fica na classe pai. A grafia do campo no texto é `AlteraraçãoDeMetadata`; os caminhos usam `alteracaoDeMetadata`.

## Movimentação do colaborador

**O que é.** A movimentação registra admissão, desligamento, alteração cadastral e contratual, benefício, consignação, afastamento, dependente e pensão, com validação e vínculo com o eSocial. Ela substitui o método Editar no objeto do colaborador. O conjunto das movimentações é o histórico funcional.

**Contrato.** A admissão, pelo método Realizar movimentação da classe Colaborador, gera Pessoa se ainda não existir, Colaborador, dependentes e remuneração. O objeto Movimentação do colaborador resultante tem Colaborador, Data, Tipo de movimentação, Evento do eSocial e Dados da movimentação.

Tipo de movimentação: Ativo (booleano), Gerar evento do eSocial? (booleano), Tipo de evento do eSocial e Classe de dados da movimentação. Há outros campos de permissionamento e de filtro de cargo e código funcional; o artigo não os nomeia.

Dados da movimentação segue a interface Dados de movimentação (`MovementData`). Os campos montam o formulário de Realizar movimentação e seguem para os métodos.

Três métodos obrigatórios:

- Realizar movimentação, identificador `performMovement`, chamado pelo Realizar movimentação do Colaborador. O da interface chama os outros métodos da classe de dados.
- Validar operações, identificador `validateOperations`. Lança erro e impede a execução. No afastamento temporário, o artigo cita: colaborador com CPF; data de início do afastamento igual ou posterior à data de início do colaborador; inexistência de afastamento sem data de fim; inexistência de afastamento no período informado.
- Realizar operações, identificador `performOperations`, é o efeito. Na reintegração, o artigo cita: atualizar a remuneração pelo nível salarial se houve atualização desde a saída; remover a data de saída; ativar período aquisitivo se existir.

Com eSocial, entram Deve gerar evento do eSocial? (`shouldGenerateESocialEvent`), opcional, e Gerar evento do eSocial (`generateESocialEvent`). Sem o opcional, a geração segue a opção Gerar evento do eSocial do tipo. `generateESocialEvent` recebe no `_input` os mesmos campos de Realizar movimentação. Com a opção desligada, o método Gerar evento do eSocial no objeto da movimentação ainda gera o evento manualmente.

Movimentação fora do produto é prevista. O exemplo é Representação: cargo adicional, novo objeto de Representação, cargo adicional e remuneração adicional no colaborador, e evento de eSocial da alteração contratual.

**Armadilhas.** As checagens de CPF e de afastamento sobreposto são do exemplo de afastamento temporário, não uma regra de toda movimentação. `shouldGenerateESocialEvent` ausente deixa o booleano do tipo no controle. Desligar o booleano não remove o método manual no objeto.

```javascript
_output = com.sydle.hr.MovementData.performMovement(_input);
```

## Registro de ponto e frequência mensal

**O que é.** O colaborador registra o ponto; Registro de ponto diário armazena as batidas; Frequência mensal do colaborador consolida; o sistema gera o espelho; o envio à análise do gestor é opcional. São classes de produto: a extensão e os dados adicionais são o caminho de ajuste. O artigo recomenda um serviço com formulário para o registro, um método de registrar (formulário de entrada para o colaborador e de saída para o retorno) e um método de validar, com a classe de parâmetros de frequência para limites como dois pontos em dois minutos. Esses métodos de serviço não têm identificador no texto.

**Contrato.** Registro de ponto diário:

- `staffMember`: referência a Colaborador, pacote Recursos Humanos.
- `date`: data do registro.
- `dayOfTheWeek`: número. 0 é domingo, 1 é segunda.
- `timeRecords`: referência a Horário de registro de ponto, pacote Frequência. A classe referenciada tem dados adicionais.
- `additionalData`: referência à interface Dados adicionais de registro de ponto diário.
- `externalCode`: número, para registro vindo de outra base, ligando o objeto a um já existente por hash.

Métodos: `generateReceipt` gera o PDF do comprovante; `nsrMigration` acha registro sem NSR/Hash e cria hash, para ponto importado; `generateRecordWithHash` gera identificador único e evita duplicidade de dia ou de ponto no mesmo dia; `getTimeRecordsByCompetence` recebe competência no estilo MMYYYY (exemplo do artigo: 042026) e colaborador, e devolve os registros dessa competência; `recordTime` recebe `additionalData`, cria o registro do usuário autenticado e define o colaborador por esse usuário.

Frequência mensal do colaborador:

- `staffMember`: referência a Colaborador.
- `competence`: texto do mês e ano. Exemplo do artigo: 04/2026, máscara MMYYYY.
- `status`: referência a Situação de frequência mensal do colaborador. Exemplos: Aberta, Em fechamento, Fechada.
- `validationTime`: data e hora da validação.
- `observations`: texto.
- `dailyRecords`: referência à classe Registro de ponto, pacote Frequência; lista do mês.
- `additionalData`: referência à interface de dados adicionais de frequência mensal do colaborador.
- `staffMemberWorkSchedule`: referência à Grade de horário do colaborador; base de hora normal, hora extra, falta e débito.
- `approver`: referência a Usuário de acesso, pacote Frequência.

Métodos: `upsert` recebe competência (exemplo 042026), colaborador e os campos a criar ou atualizar; acha pela competência e pelo colaborador, cria se não existir e atualiza se existir. `consolidateStaffMember` recebe competência (exemplo 042026) e colaborador; cria a frequência sintetizando o registro de ponto diário. `consolidateDay` recebe data opcional do tipo moment, competência (exemplo 042026) e colaborador; consolida um dia. `submit` gera a síntese para a chefia apreciar cada dia. `generateMirrorFile` gera o documento com colaborador, grade, registros e, no fim, dias, situação e ocorrências em texto. `getStaffMemberMonthlyAttendance` recebe data opcional do tipo moment, competência (exemplo 042026) e colaborador. `reconsolidate` recebe competência (exemplo 042026) e colaborador; roda sobre a consolidação usando o objeto que já existe.

A classe de pontos diários, dentro dessa frequência, destaca `timeRecords` (múltiplo, horários de entrada e saída), `modality` (presencial, teletrabalho, remoto), `occurrences` (tipos de hora do dia) e `additionalData`. O nome "situação de apreciação" é o campo de situação do colaborador. Situação e situação do colaborador referenciam a classe situação de ponto. O artigo diz que outros dois campos ficaram ocultos e não os nomeia. O processador não altera os dados adicionais; apenas os mantém. O controle de abono e de crédito fica em serviço externo.

**Armadilhas.** `recordTime` não recebe colaborador no input: o colaborador é o usuário que executa. O campo `competence` exemplifica 04/2026; as entradas dos métodos exemplificam 042026. `reconsolidate` reaproveita objeto existente; `consolidateStaffMember` cria o objeto na síntese. Serviço de frequência e processador se separam pelos dados adicionais: o processador não escreve esse campo.
