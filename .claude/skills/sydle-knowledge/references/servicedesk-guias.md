# Primeiros passos e guias (documentação oficial)

A documentação do SYDLE ONE separa o primeiro contato, os exemplos práticos e a explicação objetiva das funcionalidades. Este arquivo guarda o que essas páginas escrevem sobre essa divisão, os processos de solicitação de reembolso e de solicitação de compra, e o painel de monitoramento. Página só com título, ou a arquitetura de referência só com imagem, fica na lista de origem. Método citado sem corpo permanece sem assinatura.

## Organização da documentação

**O que é.** Entrada do produto. O SYDLE ONE é a plataforma all in one da SYDLE: as soluções se acoplam em um único lugar, de maneira nativamente integrada.

**Contrato.** A documentação se divide em quatro seções, com o identificador que a página escreve.

- Primeiros passos (`5cf03cd3dfa2f10913883e9f`): funcionalidades básicas, foco prático, primeiro contato com o SYDLE ONE.
- Guias de utilização (`5cf03cfedfa2f10913887473`): instruções práticas para situações mais específicas.
- Referência técnica (`5cf03d2ddfa2f10913889ac5`): explicações objetivas das funcionalidades e compatibilidade com versões anteriores.
- Release notes (`5e6aada66130dc4c9c3dd18f`): cada atualização de versão da plataforma.

**Armadilhas.** Compatibilidade com versão anterior está na referência técnica. Cada atualização de versão está nas release notes. A introdução da referência técnica aponta outros identificadores para Primeiros passos e para Guias de utilização.

## Guias de utilização

**O que é.** Abertura da seção de exemplos.

**Contrato.** Exemplos práticos de soluções criadas com o SYDLE ONE. Cada exemplo vem com guia passo a passo, do básico ao avançado, para soluções aproveitáveis no dia a dia da organização.

**Armadilhas.** A página não nomeia os exemplos. O passo a passo não está neste texto. Os guias de reembolso e de compra deste conjunto param em requisitos, fluxo, tópicos e perfis.

## Solicitação de reembolso

**O que é.** Criação de um processo em que o funcionário pede reembolso de gastos da atividade da empresa, como viagem e transporte até um cliente.

**Contrato.** Qualquer funcionário inicia. Informa os dados das despesas, com comprovante obrigatório, e a conta para depósito. Atribui os gastos a centros de custo já cadastrados e pode atribuir a mais de um. Um gerente aprova ou recusa, e o solicitante escolhe esse gerente. Depois o financeiro aprova ou recusa; se aprovar, agenda a data de pagamento. Depois dessa data o solicitante informa se o depósito chegou. Se não chegou, a solicitação volta ao financeiro.

No fluxo, o solicitante informa os dados e qual gerente aprova. Aprovação do gerente segue ao financeiro; recusa volta ao solicitante para corrigir. Aprovação do financeiro faz o fluxo aguardar a data de pagamento; recusa volta ao solicitante para corrigir. Depois do agendamento o solicitante confirma o recebimento e finaliza. Confirmação de não recebimento volta ao financeiro.

O guia diz que exemplifica tarefas de usuário, gateways exclusivos, temporizador intermediário e evento acoplado de erro; permissão explícita e definição prévia de executor da tarefa; métodos de tarefas de usuário para a automatização.

**Armadilhas.** Recusa do gerente e recusa do financeiro devolvem ao solicitante para correção. Depósito não recebido devolve ao financeiro. O temporizador intermediário é o tópico alinhado à espera da data de pagamento. O evento acoplado de erro consta só na lista de tópicos, sem caminho. Os métodos de tarefa de usuário constam só pelo nome.

## Perfis de uso do reembolso

**O que é.** Primeiro passo da modelagem: quem usa o processo e em qual contexto.

**Contrato.** Solicitante inicia; no exemplo, qualquer funcionário cria a solicitação. Gerência aprova ou recusa. Financeiro pode reprovar e define a data de pagamento.

A tabela associa Solicitante ao Grupo Padrão, Gerência ao grupo Gerente e Financeiro ao grupo Financeiro. A coluna Usuário não traz nome. Grupo Padrão é nativo e todos os usuários o possuem, então qualquer usuário inicia uma solicitação. Os grupos em negrito se criam pelo menu Criação de Objetos, no canto superior direito, em Grupo de Usuário.

**Armadilhas.** A frase seguinte corta em "usuários que pertençam ao grupo Gerente" e não fecha quem executa a gerência. O artigo não diz que o gerente escolhido pelo solicitante precisa pertencer ao grupo Gerente. O negrito da tabela não veio no texto extraído.

## Solicitação de compra

**O que é.** Processo genérico em que o funcionário requisita material da área de trabalho, de uma cadeira a um conjunto de notebooks.

**Contrato.** Qualquer funcionário inicia e lista os itens. Informa a unidade, os possíveis fornecedores e um documento com o escopo técnico. A solicitação passa pela aprovação do superior. Se aprovada, compras cota os itens com os fornecedores selecionados e, se achar necessário, encaminha as cotações à equipe técnica, que classifica por uma nota. Elege-se a melhor cotação. Segue a aprovação do gestor de compras e, conforme o valor, a de outro grupo segundo uma tabela de alçadas. Cadastra-se o pedido e o funcionário confirma o recebimento.

No fluxo, o solicitante define contratação de serviço ou compra de material, a unidade, os fornecedores potenciais e o escopo. O supervisor aprova o seguimento para compras ou a solicitação é cancelada. Compras anexa as cotações com detalhes técnicos e valores e pode mandar para análise técnica. A análise avalia e qualifica as cotações para compras decidir a melhor opção. O comprador define o fornecedor a partir das cotações e da análise técnica, quando houver. A solicitação com o fornecedor escolhido passa pelo gestor de compras e pelo gerente da unidade, segundo as configurações da alçada. Se passar, o comprador gera o pedido. O solicitante confirma o recebimento do material ou do serviço.

O guia diz que exemplifica tarefas de usuário, tarefas de execução de script, gateways exclusivos e temporizador acoplado não-interruptivo; permissão explícita e dinâmica; uso de `_getMetadata` e `_updateDraft` na automatização de classes e de tarefas de usuário; criação de objetos de uma classe via script.

**Armadilhas.** No fluxo, a decisão negativa do supervisor cancela a solicitação. A análise técnica ocorre quando compras achar necessário. Temporizador acoplado não-interruptivo, permissão dinâmica, `_getMetadata`, `_updateDraft` e criação de objeto via script constam como tópicos, sem corpo. O valor pré-definido e as linhas da tabela de alçadas não vêm escritos.

## Perfis de uso da compra

**O que é.** Quem usa a solicitação de compra e em qual contexto.

**Contrato.** Solicitante: qualquer funcionário inicia. Supervisor: o supervisor direto aprova ou recusa. Compras: cota os itens, define o fornecedor e, na conclusão, gera o pedido. Gestor de compras: analisa a solicitação depois da escolha do fornecedor. Alçadas: valor maior que o pré-definido exige aprovação de grupos especiais. Técnico: o responsável pelas compras decide se as cotações precisam de análise técnica.

A tabela, na ordem do texto, traz Solicitante, Grupo Padrão, Supervisor, Dinâmico, Compras, Compras, Gestor de compras, Gestor de compras, Alçadas, Gerência, Diretoria, Técnico, Dinâmico. A coluna Usuário não traz nome. Grupo Padrão é nativo e todos os usuários o possuem. Os grupos em negrito se criam em Criação de Objetos, canto superior direito, Grupo de Usuário.

**Armadilhas.** Supervisor e Técnico aparecem como Dinâmico, no lugar de um grupo fixo. Diretoria fica entre Gerência e Técnico; o artigo não diz a coluna. O negrito da tabela não veio no texto extraído.

## Introdução da referência técnica

**O que é.** Entrada da documentação avançada de modelagem, automatização de processos e estruturação de dados.

**Contrato.** Quem é novo na plataforma começa pelo guia de Primeiros passos (`5d9f78353bb1220267f9bf45`) ou pelos Guias de utilização (`5d9f782d3bb1220267f9bca7`).

**Armadilhas.** Esses identificadores diferem dos da introdução do produto (`5cf03cd3dfa2f10913883e9f` e `5cf03cfedfa2f10913887473`). A página não lista os tópicos avançados.

## Painel de monitoramento

**O que é.** Visão centralizada da plataforma e das aplicações desenvolvidas: erros, desempenho dos ambientes e uso de recursos. Feita com o módulo Data Analytics, materializa as soluções de Observabilidade em dashboards interativos e consultas pré-configuradas. Essas consultas dispensam desenvolvimento customizado para estas funções de monitoramento.

**Contrato.** Os painéis escritos na página:

- Resumo: as métricas mais importantes dos demais painéis, para achar problema e situação pouco performática em um lugar.
- Execução de métodos: saúde dos métodos das classes, a partir da execução de todos os métodos. Mostra onde a aplicação gasta mais tempo, a tendência dos principais ofensores e o comportamento ao longo do tempo. Aponta gargalo, ação mais custosa, lentidão incomum depois de uma atualização e comparação do tempo das tarefas. Consumo de tempo por métrica é o percentual de cada ação, considerando todos os métodos. Métodos com maior duração ranqueiam média e tempo total. Duração ao longo do tempo mostra tendência e comportamento fora do padrão depois de uma alteração. A tabela de performance traz cada método, quantas vezes foi acionado e as métricas temporais; variação drástica entre tempo mínimo e máximo indica problema pontual ou intermitente.
- Armazenamento e indexação: gasto operacional de cada classe, em espaço na memória e em importância (quantidade de buscas e de campos buscáveis). Aponta o que ocupa mais o banco de dados e o motor de buscas. Diferencia o armazenamento por tipo e compara com os arquivos internos, qualquer documento armazenado na organização. As classes mais buscadas complementam as classes mais custosas.
- Filas e erros: performance das filas, com foco em atraso e erro das principais. Disponibilidade, mensagens criadas, mensagens com erro e a evolução no tempo. Acompanha o processamento assíncrono, a mensagem que causa o gargalo e os erros mais frequentes, para melhorar a performance e evitar acúmulo de mensagem de erro.
- SYBOX: últimos SYBOXes instalados, o canal pelo qual foram obtidos e pacotes desatualizados. Mostra a versão atual e serve para falha de dependência na instalação.
- Banco de dados: quantidade e performance de buscas, principais ações e o consumo de tempo de cada uma.
- Motor de buscas: quantidade e performance de consultas, principais ações e o consumo de tempo de cada uma.
- Manipulação de arquivos: relação download e upload, evolução no tempo e quantidade total de transferências. Armazenamento interno acima do esperado se investiga pela ferramenta "Explorar dados" dos gráficos.
- Conexões externas: pontes com serviços de parceiros, consultas a bancos de dados externos e envios de arquivos. Tempo de resposta de consulta de imagem (OCR), transferência de arquivo (SFTP) e busca em banco mostra se a lentidão é interna ou do fornecedor.
- E-mail: enviados e recebidos pelo sistema, volume da movimentação e tempo até o destino. Taxa de sucesso e atraso (latência) mostram lote que falhou ou recebimento lento.
- Cache: memória de alta velocidade que guarda temporariamente a informação mais usada, para evitar recalcular ou buscar o mesmo dado no banco. Mostra quando o cache funcionou e quando falhou; a falha obriga o sistema a trabalhar mais.
- Rotinas do sistema: tarefas automáticas e rotinas agendadas em segundo plano, sem atuação do usuário. Ranking de esforço e de duração. Processos pesados sobrepostos geram lentidão geral. A linha do tempo mostra lentidão depois de uma atualização ou rotina pouco performática; o artigo aponta otimizar o código ou readequar o horário de execução.

**Armadilhas.** Os gráficos de métodos partem da execução de todos os métodos. Variação forte entre mínimo e máximo indica problema pontual ou intermitente. Lentidão percebida pelo usuário pode estar na conexão externa (OCR, SFTP ou banco externo). O painel de SYBOX mostra canal, versão e pacote desatualizado. Rotina de segundo plano se ajusta no código ou no horário.
