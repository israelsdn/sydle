# Releases, destaques e FAQ (documentação oficial)

Contrato destilado das notas de release 8.1 a 8.40 (Alpha), dos índices de release, destaques e FAQ, e do destaque de acompanhamento de armazenamento, da documentação oficial do SYDLE ONE. Entra somente mudança que altera script, busca, modelagem, processo, fila, SYBOX ou API. Assinatura, corpo e formato de retorno que a nota não mostra ficam de fora. Os três índices só declaram a seção, sem corpo. As notas 8.37 e 8.32 declaram mudança estrutural sem melhoria funcional. O artigo titulado 8.15 abre dizendo que descreve a 8.14.

## 8.40 (Alpha)

- **Campo Script.** Disponível sem feature toggle. Deixa de admitir multiplicidade: a opção some na modelagem e cada campo é um único script. Na atualização, campo ainda marcado como múltiplo passa a `multiple: false`; nos objetos persistidos, o valor em lista vira o primeiro item e os demais são descartados, sem preservar encadeamento; classes e objetos afetados são reindexados de forma assíncrona. SYBOX exportado antes, com `multiple: true`, tem a definição corrigida na instalação.
- **Decimal.** Campo de exibição padrão ganha Exibir Zeros à Direita, desligada por padrão, alterável na modelagem ou em `_metadata.fields.<campo>.trailingZeros`. Com 2 casas, 1,5 aparece como 1,50. Campo novo nasce com Número de Casas Decimais 15; o que já existe mantém o número gravado. Na extração analítica, Decimal múltiplo de exibição padrão passa a seguir casas e zeros à direita. Até esta versão saía com até 15 casas: com 2 casas, 1,23456 passa a 1,23.
- **Analytics.** Métodos de tabela e de gráfico aceitam `referenceSortMode` no ordenador, quando a ordenação é pelo próprio agrupador de referência: `ID`, `IDENTITY` ou `NORMALIZED_IDENTITY`. Sem o campo, a ordem permanece a anterior.
- **SSE.** `_utils.sse.Event.send` deixa de garantir entrega e a plataforma não reenvia. Conexão com 256 eventos ainda não consumidos perde o evento seguinte e o servidor a fecha; as demais seguem. Nó atrasado descarta o que já não está no cluster e continua; os eventos ficam disponíveis por até 5 minutos. Toda conexão nova recebe os dados iniciais do endpoint de subscrição. O estado atual vai em `subscriber.addInitialData`; evento é aviso de mudança.
- **Tradução.** `PKI_MESSAGES` fica só com certificado e assinatura, mesmas unidades e textos. Mensagens de token e dos autenticadores SSO vão para `AUTH_MESSAGES`. Mensagens do servidor SSO (identidade SAML e servidor OAuth) vão para `SSO_SERVER_MESSAGES`, junto com `WARN_OAUTH_LOGOUT_CANCELLED` e `ERROR_OAUTH_LOGOUT_FAILED`, que saem de `AUTH_MESSAGES`. Leitura pelo bundle antigo deixa de achar a unidade, como em `_system._translation.getUnit({bundle: 'PKI_MESSAGES', unit: 'TOKEN_EXPIRED'})`.
- **Aplicação e rotas.** Salvar a aplicação recusa autenticador repetido na lista e aceita um único Autenticador de recurso OAuth. Aplicação já salva com repetição só falha no próximo salvamento. Na configuração pública, o Autenticador de token personalizado passa a ter tipo `api`. Salvar a organização recusa rota sob `/webdav/`, `/ws1/` e `/.well-known/oauth-authorization-server/api/`. `/api/`, `/system/` e `/_ws1/` continuam recusadas. Rota sob `/jw/` passa a ser aceita. `/.well-known/oauth-protected-resource/` continua aceita. Organização já salva com rota agora recusada só falha no próximo salvamento. O erro cita o caminho da rota e o do serviço, no formato do exemplo da nota: caminho `/webdav/pasta/*` inválido porque a rota não pode iniciar com `/webdav/*`.
- **OAuth.** Aplicação pode ser anunciada como recurso protegido (RFC 9728). O acesso a um provedor de serviço OAuth sai pelo escopo `app:{aplicação}`. O servidor aceita cliente identificado por URL (OAuth Client ID Metadata Document), configurado no Provedor de serviço OAuth por metadados.
- **SYBOX.** Dependência pode apontar release alpha, beta e rc. A busca continua priorizando versão estável. Na exportação para versão anterior ou na instalação vinda de outra versão, falha de adaptação recusa o objeto com a mensagem dela. Desde a 8.18, a falha deixava o objeto no pacote sem adaptar e a operação terminava sem apontar o problema.
- **Certificado.** Certificado com emissor vazio embutido numa assinatura é recusado. Na leitura por script ou pelo autenticador por certificado, `aki` fica sem valor quando a extensão traz o emissor sem o número de série. `keyUsage` ou `ski` malformado fica sem valor e o restante do certificado é lido. Chave PEM com espaços no fim das linhas passa a ser aceita.

## 8.39 (Beta)

- **SSE.** O ping de `_utils.sse.Subscriber` pode ir sem dado, como comentário do protocolo, com `.pingMessage(null)` no builder.
- **Fila de indexação complexa.** `INTERFACE_REBUILD` só inicia a operação e cria mensagens `INTERFACE_REBUILD_INTERVAL`. `INDEX_EMBOSSER_OBJECTS` só inicia e cria `INDEX_EMBOSSER_OBJECTS_INTERVAL`. Filtro ou busca que lista os tipos de operação precisa incluir os dois novos.
- **Extração.** Falha de indexação decorrente da extração deixa de ficar Concluída com erro, com documentos parciais indexados, e passa a Cancelada com erro: o índice em construção é descartado. Mensagem e lista de erros continuam no acompanhamento. Depois de corrigir a causa, o método Reiniciar do acompanhamento recomeça a operação.
- **Observadores.** `_save` de Pacote e de Extensão de Classe deixa de ser `NON_OBSERVABLE` e passa a aceitar observadores.
- **Analytics.** Consulta com campo dinâmico devolve erro quando a quantidade de documentos contemplados passa de 1.000.000, padrão inicial. Cláusula de filtro que usa campo dinâmico não entra nessa conta.
- **Log.** A geração de logs e o extrator de logs deixam de poder ser desabilitados na organização.
- **SYBOX.** A validação de instalação fica mais rápida e mantém os mesmos erros e avisos. Na tela do SYBOX de edição, Editar fica em destaque; Editar informações e Editar operações passam ao menu de métodos.
- **API.** A plataforma pode atuar como servidor de autorização OAuth 2.0 / OpenID Connect, fluxo `authorization_code`, emitindo acesso e identidade.

## 8.38

- **Notificação.** Criação, instalação, atualização e exportação de SYBOX, progresso de testes, criação de ambiente virtual Python e menção em Post passam a ser eventos publicados em tópico. `NotificationsConfiguration` nasce com `removeRecipientOnClear` ligado e `suppressElasticSearch` desligado. Com a primeira ligada, `clear` e `clearAll` tiram o destinatário e a exclusão física fica no expurgo. Ligar a segunda faz o contador de não vistas usar evento de diferença. Desligar `removeRecipientOnClear` volta ao delete físico: notificação limpa deixa de se distinguir de uma que nunca existiu, e o expurgo nativo de `_notification`, que procura objeto sem destinatário, fica sem o que excluir.
- **Expurgo de notificação.** A classe passa a ter configuração nativa: sem destinatário, lidas há mais de 1 dia, não lidas criadas há mais de 7 dias. Substitui `NotificationsRemovalJob`. Configuração de expurgo que a organização já tinha em `_notification` é desabilitada (`enablePurge = false`) e desvinculada da classe.
- **SYBOX, migração de dados.** Operação de migração age sobre objeto que já existe no destino. O script já recebe os objetos da classe alvo e a persistência é automática, inclusive objeto não buscável e objeto protegido. A proteção não impede a migração; o objeto migrado continua protegido. Para exportar a operação, a classe alvo precisa estar desprotegida na origem. Cada operação roda uma vez por organização. Reverter a instalação restaura o estado anterior dos objetos migrados.
- **SYBOX, migração de classe.** Configuração de migração versiona o formato com Script de upgrade e Script de downgrade, e declara se uma migração que já existe no destino executa ou não. Atua na leitura do arquivo, antes de persistir o objeto criado pelo SYBOX.
- **Teste.** Limpeza automática reverte escritas de Teste pelo mecanismo de reversão do SYBOX. Teste isolado reverte ao concluir. Teste filho de Coleção gera a reversão ao concluir e a Coleção aplica em cascata, na ordem inversa, quando ela (ou uma Coleção maior) termina. O método Aplicar reversão aplica a pendência na hora. Relatório expurgado aplica a reversão pendente. Em Informações da reversão (`SyboxInfoUndo`), `syboxInstall` foi consolidado em `originObject`.
- **Modelagem.** Todo objeto ganha o campo de sistema `_size`, tamanho estimado em bytes do documento no banco. Acima de um limite por Organização Hospedada, a plataforma emite log de aviso.

## 8.37

A nota declara mudança estrutural, sem melhoria funcional.

## 8.36

- **Extensão de classe.** Interceptors, métodos de extensão, observers, sobrescritas de ACL e dados gerais passam a ser editados por métodos dedicados: Configurar interceptors, Configurar métodos de extensão, Configurar observers, Configurar sobrescritas de ACL de métodos e Editar dados gerais.
- **Modelagem.** A atualização apaga a classe Unidade de trabalho e os objetos dela. Referência de outra classe ou objeto a essa classe fica inconsistente.
- **Busca.** A aba dados passa a listar só referência direta. Referência de nível maior que um deixa de aparecer ali. Objeto já existente só reflete a mudança depois de reindexação.
- **API.** Novo autenticador de fluxo, com vários passos, sem obrigar usuário e senha no primeiro. Novo autenticador OAuth, fluxo `authorization_code`, contra servidor OAuth 2.0 / OpenID.

## 8.35

- **Arquivo.** `ZipFolder` ganha `importZip`: arquivo zip, caminho de destino e senha opcional. Na geração do zip final, o conteúdo importado é extraído nesse caminho.
- **Tópicos.** Publicação de evento por tipo e dados; assinante roda em método, de forma assíncrona, sem bloquear a publicação e sem garantia de ordem. Ordenação fica a cargo de um campo `sequence` incremental por tipo, validado antes do uso. O feature toggle de Tópicos controla só a criação; tópico existente continua.
- **Tag.** `_system._tagging.tag({ object, tag })` indexa de forma síncrona. `_indexStrategy: "queue"` agenda a indexação na fila.
- **SYBOX.** `_utils.sybox.Creator` executa um script com interceptores ativos, registra o CRUD e gera um arquivo `.sybox` de reversão, para aplicar na hora ou guardar. Nome com internacionalização. Callbacks `onSuccess`, `onFailure` e `onFinish`. Log de auditoria por objeto na instalação, com download, e data e hora de início e fim de cada operação.
- **Observers.** Método de outra classe dispara de forma assíncrona, sobre tópicos, antes ou depois do método observado, sem alterar a classe observada. O modificador `NON_OBSERVABLE` impede observação. Na mesma extensão, no máximo um observer por momento para o mesmo método. Outro observer no mesmo momento exige outra extensão.
- **Teste.** Matchers `toBeGreaterThan`, `toBeGreaterThanOrEqual`, `toBeLessThan` e `toBeLessThanOrEqual`.
- **API.** Falha de autenticação deixa de ser sempre 401. A nota lista 403 para restrição de IP, 500 para erro interno, 429 para excesso de tentativas e 400 para erro da requisição. Todo 401 inclui o cabeçalho `WWW-Authenticate`. Endpoint não público sem credencial, que devolvia 403, passa a devolver 401.
- **SYBOX, preview e origem.** Informações da reversão ganha o campo Origem. Reversão sem o campo é tratada como `SYBOX_INSTALL`; a migration preenche as existentes. O preview de operação de deleção deixa de devolver a lista `objects` e passa a devolver a lista paginada `descriptions`: cada item tem `ref`, `object` e `clazz`.

## 8.34

- **Script.** Método no motor GRAAL ganha a opção Uso de promises. O script roda em função assíncrona e `await` vale no nível mais externo. Vale em método customizado e em método de sistema com script de usuário, como `_delete` e `_getMetadata`. A espera resolve no ponto de espera ou no fim da execução, na mesma thread.
- **PDF.** A página devolvida por `nextPage()` do PdfReader ganha `getPageAsBase64()`, um PDF de uma página em Base64.
- **SSE.** Método pode devolver conexão persistente para outro método postar mensagem nela.
- **Autenticador SSO.** Cada autenticador configura restrição por IP do redirecionamento e expiração em segundos. O campo Habilitar verificação de endereço IP em Login SSO nasce verdadeiro.

## 8.33

- **Teste.** Matcher assimétrico, no exemplo da nota `expect(result).toEqual(expect.any(String))`.
- **ACL padrão de classe nova.** Classe e processo já existentes mantêm o permissionamento. Em classe nova, a herança da nota é: `_get` para `_search` e `_getMetadata`; `_create` para `_update`, `_duplicate`, `_getHistory`, `_delete`, `_save`, `_updateDraft`, `_createDraft`, `_getDraft` e `_getMetadata`.
- **Script.** `_utils.object.StreamService` percorre campos do objeto, com valor armazenado e metadado, e materializa um Array JavaScript.
- **Fila.** Nova fila Execução de processos, para a mensagem que antes usava a classe Mensagem da Fila / Sistema. O roteamento depende de feature experimental dos administradores de infraestrutura. Mensagem agendada para menos de 1 minuto pode ir para memória: no máximo 100 simultâneas por organização; o teto de agendamento oscila entre 5 e 60 segundos conforme a ocupação. Fora do limite, segue o fluxo normal da fila.
- **Arquivo.** O modo otimizado do conversor `html.pdf.one.v2` passa a ser o padrão.
- **Modelagem.** Na criação e na atualização de classe, extensão de classe e pacote, nome de classe, campo, método, extensão e pacote é cortado em 255 caracteres, tem espaço de borda e espaço interno repetido reduzidos, perde caractere de controle, quebra de linha, tab e marcador de direção, e é normalizado para NFC. O que já existe não é reprocessado.

## 8.32

A nota declara mudança estrutural, sem melhoria funcional.

## 8.31

- **Campo Script.** Ambiente virtual Python, experimental, habilitado na organização hospedada, para um conjunto limitado de bibliotecas Python puras.
- **SYBOX.** O modelador define script antes e depois da reversão; esses scripts entram como operações do SYBOX de reversão. Dependência com criação manual não é criada sozinha: a instalação para até o SYBOX de Instalação trazer a dependência na versão configurada. Token de registro em repositório pode ter data de expiração; rotina diária à 00h expira os vencidos.

## 8.30

- **SYBOX, reversão.** O método Validar, antes de instalar a reversão, alerta os ids dos objetos alterados depois da instalação original. O prazo padrão para instalar a reversão passa a 30 dias. A instalação da reversão não tem mais etapa prévia de validação: a validação ocorre junto da instalação. Forçar a reversão de dependência instalada pelo SYBOX original cria e instala a reversão dessa dependência, sem reverter o que essa dependência instalou. Toda instalação que altera objeto gera SYBOX de reversão.
- **SYBOX, dependência.** A versão da dependência é texto livre, sem lista automática das versões presentes na organização. Auto-dependência aponta outra versão do mesmo pacote: precisa ser a primeira operação de dependência; a versão do próprio SYBOX não pode ser menor que a variação nem estar contida nela; a criação automática só ocorre se já houver versão menor aplicada. O suporte a dependência em arquivo para a versão 8.4 foi removido.
- **Campo Script.** No GRAAL, o campo Script em JavaScript ganha Habilitar o uso de Promises, com `await` no nível mais externo. Python no campo Script, pelo GRAAL, é experimental e exige habilitação na organização hospedada.
- **Modelagem.** Campo de texto do tipo Script, Markdown ou HTML novo não aceita relevância identidade nem destaque. Campo já existente com essa relevância passa a exibir só o nome, em card e accordion.
- **API.** Mensagem de contexto passa a sair mesmo com `_output` em `[]`, `null` ou `undefined`. O retorno que era `null` passa a vir com `_singleValue` nulo e `_messages`, cada item com `type` (`ERROR`, `WARNING` ou `INFO`), `code`, `context` e `text`.
- **Indexação.** Dois campos de sistema estavam mapeados de forma dinâmica no Elasticsearch. A primeira alteração de modelagem que dispare `put_mapping` pode ser rejeitada e o SYDLE ONE reindexa o índice uma vez. Instalação de SYBOX que mude modelagem pode aumentar a fila de indexação complexa nessa primeira vez.

## 8.29

- **SAML.** Como IdP, o ONE aceita requisição não assinada. Como SP, a assinatura da requisição é configurável. A resposta pode trafegar assertions criptografadas. Formulário e importação/exportação de conexão passam a carregar esses parâmetros.
- **Log.** Objeto com marcador `ACTION_COMPLETED` passa a expor métricas de uso: quantidade e tempo de query no Elasticsearch e no MongoDB, e efetividade do cache de objetos. A classe Log ganha ID da máquina, Perfil da máquina e Métricas de sistema. Dados adicionais passa a se chamar Dados extraídos. O campo Identificador é removido. Identificador da thread, Versão da plataforma, Tipo de erro e Stack trace passam a relevância Avançado.
- **Busca.** O campo Tempo (ms) do extrator Extrator de tempo de execução de Ações, marcador `ACTION_COMPLETED`, fica deprecado para filtro e busca. O mesmo dado está nas métricas de uso de recursos, identificador `action_time`.
- **Teste.** `describe.each()` e `it.each()`, com tabela de parâmetros e descrição por interpolação, no formato que a nota mostra: `it.each([[1, 2, 3], [4, 5, 9]])` e `describe.each([[1, 2, 3]])("%i + %i = %i")`.

## 8.28

- **Script.** Método de `_utils` com limite de caracteres, entre eles `_utils.stringifyAsJson` e `_utils.log`, emite warn quando o valor passa do limite.
- **Fila.** O processamento passa a reagir à carga do MongoDB e do Elasticsearch.

## 8.27

- **SYBOX.** Configuração avançada da instalação permite forçar dependência com breaking change pendente. A lista traz só dependência não aplicada, com breaking change pendente e que não seja peer. Sem usar a opção, a instalação permanece a anterior.
- **Extrator.** Até a 8.26.0 o script de transformação devolve a mesma quantidade de objetos da origem. A partir desta versão um objeto de origem pode virar N objetos de carga ou ser ignorado.

## 8.26

- **Fila.** Mensagem de fila crítica tem preferência, sem impedir fila de prioridade menor.
- **Extrator.** Primeira versão experimental de extração, transformação por script e carga em classe de destino, com expiração configurável do armazenamento temporário.
- **Histórico.** A compactação passa a guardar delta no padrão JSON Patch (RFC 6902), no lugar do registro completo.
- **SYBOX.** Rotina de atualização de segurança às 03h, 09h, 15h e 21h. Exportação de objetos ganha modo avançado com filtro. Campo protegido tem o valor controlado pelo SYBOX; campo desprotegido fica com o usuário. SYBOX da 8.26 com campo desprotegido, instalado em versão anterior, ignora essa configuração. Trocar o modo de seleção na edição de uma operação de Exportação de Objetos restaura as configurações de exportação para o padrão.
- **Arquivo.** No modo otimizado de `html.pdf.one.v2`, ainda ligado só por administrador, o HTML convertido não pode conter JavaScript e o PDF final fica limitado a 30MB. `getImageCard`, `getImageCardByToken` e `_util._fileHelper.toDownload` passam a registrar GET de arquivo. O log de arquivo pode trazer o `path` no objeto quando a plataforma consegue obtê-lo.

## 8.25

- **Modificador Volátil.** Classe volátil persiste só no Elasticsearch, sem o banco, abrindo mão de integridade referencial estrita e de consistência transacional. Log e as classes de extrator de log nativas passam a ser voláteis. Classe que implementa a interface Dados Adicionais de Log também passa a ser volátil na atualização.
- **Campo desprotegido.** Objeto protegido pode declarar campos editáveis. Os demais ficam somente leitura. Alterar outro campo, por tela, API ou script, devolve erro de objeto protegido. Nesta versão a configuração vale para objetos nativos: Configuração de expurgo em Log, Notificação e Acompanhamento de Recálculo, entre outras; Expiração de histórico em Classe, Aplicação e Executável, entre outras; Limite de Entregas e Tentativas de Recuperação de Erros nas filas Execução de Métodos, Indexação - Operações Complexas e Indexação - Operações Simples.
- **SYBOX.** Configuração de campo passa a valer para objeto específico, na criação do SYBOX e na configuração global da organização.
- **Script.** A resolução padrão da árvore de scripts muda de implementação. Feature toggle na Organização Hospedada volta à implementação anterior; a alteração do toggle é pedida ao time de infraestrutura.

## 8.24

- **SYBOX.** Reversão de instalação, experimental, habilitada na organização, desfaz as alterações da instalação correspondente. O método Visualização do SYBOX e do SYBOX de instalação passa a se chamar Visualizar conteúdo. No SYBOX de instalação, o método vai para destaque.
- **Autenticador básico.** Validação de senha pode usar Regras de Complexidade. A nota não mostra a assinatura.

## 8.23

- **Log.** `ACTION_COMPLETED` ganha contexto de criação, alteração e exclusão de objeto, de objeto devolvido na API e de algumas operações de arquivo. O desenvolvedor também grava esse contexto por script. A nota não mostra a chamada.
- **Redirecionamento.** O redirecionamento de método passa a valer mesmo com o pacote ou a classe original ainda existentes. Redirecionamento antigo que depende da fila deixa de funcionar.
- **SYBOX.** Configuração de instalação protege objeto da organização contra sobrescrita na instalação.
- **Busca.** Utilitário converte `FilterExpression` e `Filter` em query do Elasticsearch. A nota não mostra a assinatura.
- **API de cards.** `getObjectListCards` e as demais APIs de card aceitam `getCardsOptions.fields`, array de paths. Com esse parâmetro, `features` volta vazio e os dados pedidos vão em `fields`.

## 8.22

- **Script.** Conexão SFTP nativa. Utilitário associa um método à escrita do corpo da resposta HTTP; o método recebe uma function JavaScript de escrita. A resposta de `_utils.connector.web(...).request` passa a oferecer readers. A nota não mostra as assinaturas.
- **Expurgo.** Interface com objetos buscáveis pode ter expurgo. O método Executar expurgo, no menu da classe, agenda mensagem na fila de execução de métodos, cria Acompanhamento de expurgo e vincula o usuário de criação a quem executou.
- **Busca.** Falha de busca devolve notificação genérica com um código. O stack e a mensagem ficam no log da organização, localizado por esse código.
- **Analytics.** Mais de um campo de referência múltipla na visualização em tabela faz o sistema remover colunas até restar uma referência múltipla, com alerta. Subcampo de referência múltipla dentro de outro campo de referência múltipla pode aparecer junto.
- **Teste.** API de mock nos executáveis de teste: sobrescreve método da plataforma e espiona o uso. A nota não mostra a assinatura.
- **Integração.** Conexão nativa com AWS Athena e Redshift. A nota não mostra a assinatura.
- **Modelagem.** Arquivo e Arquivo padrão ganham campo de resumo.
- **API.** A plataforma pode ser provedor de identidade SAML. Autenticador SAML importa e exporta XML de descritor e aceita certificado próprio do cliente.

## 8.21

- **SYBOX.** Edição separada em Atualizar informações e Atualizar operações, cada um podendo atualizar os arquivos ao salvar. Observações e Registro de Alterações viram Notas de Versão. Observações fica deprecado. Não sobrescrever passa a se chamar Bloquear Sobrescrita. A configuração Remover Protegidos tira objeto protegido ao incluir dependência. Objeto protegido incluído como dependência nasce com Bloquear sobrescrita. Atualizar informações ao gerar SYBOX fica deprecado. Dependência de objeto pode ser agrupada; a classe Classe agrupa por Pacote, salvo outro critério. O método de listar as últimas versões aplicadas vale por tela e por script. Se a listagem da classe ou dos objetos de SYBOX não abrir, a nota pede reindexação manual da classe do SYBOX.
- **Indexação.** A mensagem Reconstruir índice só inicia a operação e cria mensagens Reconstruir intervalo de índice. O tempo dessas mensagens é limitado, padrão 5 minutos. Cada reindexação gera Acompanhamento de Operação, com pausar, continuar, cancelar e ajuste do paralelismo.
- **Arquivo padrão.** Só os grupos Administrador, Modelador de Classe e Modelador de Processos alteram a variável Conteúdo pelo método `www`. A visibilidade pública sai do formulário e vai para `setPublicVisibility` (Definir Visibilidade Pública). Alterar o conteúdo redefine a visibilidade: o link público exige rodar o método de novo. Extensão de classe pode sobrescrever a ACL desse método.
- **Modelagem.** Classe ganha seções; o formulário de detalhe e de edição agrupa os campos nelas. A nota condiciona a visualização ao Workspaces 2.37. Moeda customizada passa a aceitar casas decimais.
- **Script.** `_utils.object.ObjectService.validate` valida integridade do objeto em tempo de execução. A nota não mostra a assinatura.
- **BPM.** SYBOX de BPM aplicado depois da atualização do ONE precisa ser 3.4.0 ou superior e ter sido gerado para o ONE 8.21 ou superior. Ambiente que já usava versão inferior antes da atualização do ONE não precisa de ação.

## 8.20

- **Modelagem.** Subtipo Vetor Denso: campo Decimal armazenado como dense vector no Elasticsearch.
- **Script.** A partir de certificado privado criado pelos utilitários, dá para obter o certificado público. A partir do público, dá para obter o PEM. A nota não mostra as assinaturas.
- **Aplicação.** Com acesso limitado a métodos específicos, a aplicação pode liberar edição de objeto por formulário e chamada de método customizado a partir do formulário de entrada.
- **SYBOX.** Dependência de classe passa a incluir as configurações de exibição, que deixam de ser exclusivas da plataforma.
- **Histórico.** Alteração de objeto causada por atualização de versão, em classe com histórico habilitado, gera histórico. O usuário da última alteração fica Sistema.

## 8.19

- **Executável.** Novo tipo Coleção, para agrupar executáveis. Teste deixa o tipo antigo e vai para um tipo dedicado: os objetos são duplicados, os casos migram para o formulário novo e os criados na migração recebem a tag Criado por migração. Os objetos anteriores permanecem.

## 8.18

- **SYBOX.** A geração do arquivo pode preencher o campo Mensagens do sistema com informativo e alerta, por exemplo ao exportar recurso novo para versão legada.

## 8.17

- **Notificação.** Métodos facilitadores criam notificação com progresso. O identificador do valor do progresso deixa de ser `value` e passa a ser `progressValue`.
- **Busca.** Customização de campos buscáveis em referência, embutida ou não, e em arquivo sai do feature toggle e fica ligada por padrão.
- **Script.** `_utils.security.signature.CMSSignature` assina, resume, autentica ou criptografa dados no formato CMS, com assinatura destacada em arquivo `.p7s`. A nota não mostra a assinatura dos métodos.

## 8.16

- **SYBOX.** Inscrição em canal e política de atualização aplicam atualização automática. Arquivo publicado como segurança entra nessa rotina. Inscrição e política só valem para arquivo gerado a partir da 8.16. SYBOX com dependência exige repositório capaz de resolvê-la.

## 8.15

- **Busca.** Customização de campos buscáveis em referência embutida e em arquivo, ainda experimental.
- **Rascunho.** Método em contexto de rascunho pode alterar `_object`; a alteração persiste no rascunho ao fim da execução. `_patchDraft` nesse contexto deixa de ser suportado.
- **Modelagem.** Ao salvar, interface embutida obrigatória exige a classe concreta explícita. Script que cria o objeto sem informar a concreta passa a falhar.

## 8.14

- **Busca.** Campo de referência ganha a opção Customizados em Campos disponíveis para busca, experimental, para escolher campos da referência em vários níveis. Na exportação para ONE anterior à 8.14, escolha que junte relevância Identidade e Destaque vira Filtrar campos por relevância, com Permitir busca em campos até a seguinte relevância igual a Destaque. O número de campos buscáveis pode subir. Campo customizado que não seria buscável na classe referenciada gera incompatibilidade de busca.

## 8.13

- **Busca.** O mapeamento de campos buscáveis no Armazenamento de Classe ganha os usos no Elasticsearch, referentes aos últimos 30 dias.
- **E-mail.** O envio por script aceita o parâmetro opcional `contentEncoding`. A nota não mostra a chamada.
- **Modelagem.** O identificador das classes Campo e Método passa a ser identidade.
- **Listagem.** A ordenação da listagem de objetos aceita campo dinâmico do Elasticsearch. A nota não mostra o parâmetro.

## 8.12

- **Teste.** Criação e execução de teste nativos no ONE.
- **SYBOX.** Repositório, canal de publicação e inscrição. SYBOX publicado por repositório não é obtido nem atualizado em versão inferior à 8.12; nessas versões continua o fluxo Permitir atualização automática ao gerar o arquivo.
- **Script.** `responseText` de `XMLHttpRequest` fica lazy. Cada transição de status chama `onReadyStateChange`. `send` vai para `loading` e só vai para `done` quando `responseText` é acionado. Antes, a transição para `done` ocorria logo depois de `loading`, sem exigir `responseText`.

## 8.11

- **PDF.** Utilitário de leitura percorre páginas e, em cada uma, faz OCR e extração de imagem. A nota não mostra a assinatura.
- **Busca.** Armazenamento de Classe lista os campos indexados no Elasticsearch. O mapeamento atualiza na reindexação da classe ou na rotina Cálculo de informações de armazenamento. Classe cujos objetos não são buscáveis não tem mapeamento. Campo Arquivo com relevância Identidade e sem Extrair conteúdo é marcado como não buscável; a busca pode ser reativada no campo.
- **Executável.** O campo Tipo nasce Script. A resposta do parâmetro de saída é tipada como JSON quando o retorno é JSON válido.

## 8.10

- **Script.** Utilitário de assinatura e verificação com RSA. Utilitário regenera os tokens de um objeto de aplicação. A nota não mostra as assinaturas.
- **SYBOX.** A notificação de instalação passa a detalhar etapas e percentual. Preview lista todos os objetos exportados. A nota não mostra o método.

## 8.9

- **Script.** Utilitário gera chaves RSA. A nota aponta a seção RSA / Geração de chaves e não mostra a assinatura.
- **Log.** Escrita de objeto (criação, alteração, remoção) pode gerar log `OBJECT_WRITING`, experimental e só em organizações habilitadas. Operação sobre objeto de mensagem não gera esse log.

## 8.8

- **Arquivo.** Conversor experimental de HTML para PDF, com leitura maior de HTML e CSS. A nota aponta a seção Provedores de conversão de arquivo. Upload em partes passa a valer também com armazenamento em disco. O tamanho máximo de arquivo criado via JavaScript, como zip e fileWriter, fica parametrizável: padrão 500MB em organização nova e 2GB em organização já existente.
- **Busca.** Campo arquivo novo nasce não buscável.
- **Erro.** Mensagem de erro de campo múltiplo passa a exibir o id do campo, no lugar do índice.

## 8.7

A nota descreve otimização interna do processamento de fila e da indexação, e um limite de tamanho total de logs por requisição, sem contrato novo de script, busca, modelagem ou API.

## 8.6

- **Busca.** Em campo múltiplo, o filtro Não contido em passa a selecionar objeto em que nenhum valor do campo está na lista do filtro, o oposto de Contido em. O comportamento anterior selecionava quando algum valor estava fora da lista. Campo múltiplo do tipo data já seguia o comportamento novo.
- **Listagem.** Com Organizado por, os cards de cada grupo ordenam primeiro pelo campo escolhido, na direção configurada, e o empate ordena alfabeticamente crescente pelos campos de relevância identidade. Fora de data e coordenada geográfica, o grupo inteiro tem o mesmo valor e vale só a segunda ordenação.
- **SYBOX.** Método de tela exclui arquivo gerado. A nota não mostra o identificador.

## 8.5

- **Log.** Visualização de log, logger com API fluente e clássica, marcador e extrator que grava na modelagem do Log. Experimental: a nota pede para não amarrar lógica de negócio a esses recursos.
- **Rascunho.** Método de tela novo passa a gerar rascunho.
- **Redirecionamento.** Identificador de método, classe e pacote pode mudar com as chamadas de API e de script preservadas. A plataforma não altera os scripts nem as chamadas.
- **Motor.** Método novo nasce no motor novo. O motor antigo não aparece na criação. Método antigo pode continuar nele. A classe pode ser configurada para o motor antigo por utilitário; a nota não mostra a chamada. Na saída da escolha de motor dos recursos experimentais, as organizações passam a ter Rhino como padrão: organização que usava Graal como padrão precisa configurá-lo de novo.
- **Expurgo.** Consulta configurada remove objetos da classe em dias definidos. Experimental: a nota pede para não amarrar lógica de negócio a esse recurso.
- **Método.** Campo Modificadores. O modificador Não extensível impede interceptor na extensão de classe.
- **Analytics.** Agregador Distintos devolve a quantidade de valores distintos do campo em cada grupo.
- **Campo Script.** Sintaxes de visualização JavaScript, JSON, HTML, XML e Python, sem equivaler à capacidade de execução. Além de Configurações adicionais, `_getMetadata` altera `scriptSyntax`. O campo Query da configuração de Referências já usa a sintaxe correspondente.
- **Busca.** Campo Buscável separa indexação e Analytics da relevância. Antes, todo campo era buscável, exceto relevância Avançada. Referência ganha Campos disponíveis para busca, com opção de indexar só `_id`.

## 8.4

- **Motor.** Graal deixa de ser experimental.
- **Método.** Contexto de exibição restringe as localizações configuráveis. O modo pode ser Menu, Destaque, os dois ou nenhum. A migração preserva o comportamento e limpa combinação inconsistente, como Destaque com local Rascunho sem o contexto Rascunho. `getMenuMethods()` muda a estrutura de retorno; a nota só mostra a diferença numa imagem, sem descrever os campos.
- **Referência.** A opção `IGNORAR` em referência não embutida deixa de aparecer na criação de campo novo e permanece nos campos que já a usam.
- **Requisição.** `_user.request` traz headers, IP de origem, `pathParams` e `queryParams`. Script pode definir status HTTP, headers e tipo do body. A nota não mostra a chamada.
- **Script.** Utilitários de criptografia para Hmac, Bcrypt, RSA e AES. Utilitário faz parse de JWS e valida assinatura e expiração. Autenticador de token customizado, ligado à aplicação, valida por script e identifica o usuário. A nota não mostra as assinaturas. Executável do tipo script, e o script de pré-execução do tipo método, rodam em ECMA2022. A chamada de método durante o executável usa o motor configurado nesse método.
- **View.** O campo Receber token de acesso? fica deprecado: não cria objeto com a opção nem liga a opção em objeto que não a usava. Recebimento já existente continua. `getViewAccessToken` fica deprecado. A alternativa indicada é o pacote de ferramentas da SYDLE UI.
- **PDF.** A escolha do produtor dos PDF gerados pela plataforma sai da organização hospedada. O produtor passa a ser sempre SYDLE.

## 8.3

- **Rascunho.** Método com contexto de execução Rascunho e visibilidade em destaque do rascunho ou no menu pode rodar no rascunho. O menu configura o local: objeto publicado, rascunho ou listagem. Método com exibição em Destaque deixa de aparecer no Menu.
- **Executável.** Requisição HTTP, com importação de cURL, script avulso e método de classe com script de pré-execução, compartilhável com usuário e grupo.
- **Script.** `_utils.ObjectService.replaceReferences(args)` troca referências de um objeto por outro; há também método de tela no objeto da organização. `_utils.object.DiffService.diff(from, to)` compara dois objetos da mesma classe, inclusive histórico e ambientes diferentes, e devolve lista de diferenças `ADD`, `UPDATE` ou `DELETE`.
- **Indexação.** Índice no Elasticsearch existe enquanto recebe busca. Classe buscável pode ficar sem índice. Criar a classe não cria o índice. Objeto de classe sem índice não é indexado na criação nem na atualização. Busca em índice removido reconstrói na hora se o índice é pequeno, ou de forma assíncrona, com notificação, se é grande. Classe consultada só de forma agrupada sai do Elasticsearch com o tempo. `_search` nessa classe, quando a indexação dispara e há mais de 30.000 objetos, devolve erro; a tentativa seguinte espera a reconstrução. A configuração de indexação permanente evita a remoção.
- **Assinatura.** Assinador Pdf passa a se chamar Assinador Documento e também assina XML, no documento inteiro ou em partes, com carimbo de tempo de uma TSA.
- **Autenticador.** Recuperação de senha habilitável no autenticador. O template, antes só com `{{URL}}`, passa a aceitar `{{user.id}}`, `{{user.name}}`, `{{user.email}}`, `{{user.login}}`, `{{user.active}}`, `{{user.superior}}` e `{{user.groups}}`. Template por JavaScript lê `_input.url` e devolve o HTML em `_output.html`.
- **Grupo.** Desenvolvedor deixa de ser grupo da plataforma, fica desprotegido e deixa de nascer com a organização; passa ao SYBOX de Projetos. O acesso a `_utils.debug` vai para Modelador de Classe e Modelador de Processo.
- **API.** Login OAuth 2.0 Client Credentials no caminho `/{app}/sys/auth/oauth/token/{authenticatorIdentifier}`. Envio de e-mail por script aceita headers. A depreciação de Receber token de acesso? e de `getViewAccessToken` na classe View é a mesma descrita na 8.4.

## 8.2

- **Assinatura.** Assinatura de PDF no formulário, por objeto da interface Assinador Pdf. A plataforma oferece Assinador Pdf Interno, Lacuna, Signer Digital e gov.br. Quem já usava Lacuna é migrado para essa estrutura. Utilitários leem certificado, validam vigência, cadeia e revogação, e leem dados de assinatura. A nota não mostra as assinaturas.
- **SYBOX.** Versão semântica `MAJOR.MINOR.PATCH` entra nas validações e automações. Repositório e atualização automática só com SYBOX versionado. Rotina avisa o instalador quando a origem gera versão nova.
- **Autenticação.** Fator de segurança TOTP nativo.
- **Script e API.** Campo múltiplo único vazio passa a devolver lista vazia. Nome de arquivo `aux` é recusado. `_patch` com caminho `"/"` ou `""` gera erro. ECMAScript 2022, ainda experimental nesta nota, roda em strict mode.
- **Aplicação.** O campo Autenticadores deixa de ser referência à classe Autenticador e passa a ser embutido, com o autenticador e os fatores de segurança. Onde havia `application.authenticators`, a nota manda usar `application.authenticators.map(a => a.authenticator)`. Recuperação de senha do SYBOX de ServiceDesk depende da versão 3.8.4 ou superior desse SYBOX.

## 8.1

- **API da organização.** Domínios aceitos ficam na Organização Hospedada e são replicados somente leitura na Organização. Rota da organização direciona domínio e caminho para classe, objeto opcional, método e aplicação. Aplicação associa Pacote de cabeçalhos HTTP a toda chamada ou método a método, para qualquer status, só sucesso ou só erro.
- **SYBOX.** A instalação pode ser agendada por mensagem de fila, reagendada, cancelada ou disparada na hora. Com status Erro, um método de tela retoma a partir da operação que falhou. Status de instalação: Não aplicado, Aplicado, Instalando, Erro, Erro de validação, Agendado. SYBOX gerado na 8.0 instala na 8.1. O caminho inverso usa Gerar arquivo para versões anteriores. O campo Arquivos vira Arquivos gerados, um arquivo por versão da plataforma. Script que use recurso exclusivo de uma das versões pode falhar no destino.
- **Processo.** Inbox de Tarefa de Usuário, além da timeline da instância. Filtros: Inbox, Executadas por mim, Todas, Finalizadas e Não finalizadas. Processo existente precisa ser publicado ou compilado para a inbox valer.
- **Patch.** O método Atualizar parcialmente segue a RFC 6902 e passa a aceitar a operação `test`. A ordem importa: `test` depois de `replace` no mesmo caminho confere o valor já substituído. Falha de `test` e alteração concorrente do objeto devolvem HTTP 409. A concorrência a nível de objeto, que devolvia 400, também passa a 409.
- **Campo único.** API e script obtêm objeto pelo valor de um campo único, além do `_id`. A nota não mostra a chamada, salvo o pacote de tradução: `_system._translation._get({identifier: 'FRONTEND_MESSAGES'})`.
- **Mongo.** O método Codificar string de conexão, na listagem de Conexão com Mongo, grava a senha criptografada na string.
- **Tradução.** `_translationBundle` ganha ACL de leitura e de escrita por objeto. Pacote existente recebe o grupo Administrador nessas ACLs. `FRONTEND_MESSAGES` fica com leitura pública.
- **Inicialização.** Erro no script de atualização da organização Sistema impede a plataforma de subir. Organização hospedada só atualiza depois que Sistema atualizou e está disponível.
- **Script.** A partir da 8.1.17, `_utils.security.token.JWS.builder()` monta um JWS para integração externa. A nota não mostra os parâmetros.
- **Organização.** A classe deixa de ser buscável e passa a seguir a interface Configuração / Sistema. `_system._organization._search({}).hits.hits[0]._source` é substituído por `_user._organization`. O identificador da organização fica somente leitura e só muda pela Organização hospedada.
- **Unicidade.** Campo múltiplo único garante cada valor uma vez no objeto e uma vez entre objetos da classe. Campo múltiplo único que não é texto passa a ser não único. Campo internacionalizável, criptografado, referência embutida ou dinâmico não pode mais ser único; o que era único desses tipos passa a ser não único.
- **Busca.** Em `_searchFilterClause`, `field` deixa de ser texto e passa a ser referência embutida a `_fieldSelector`. Cláusula já instanciada é adequada. Script que cria cláusula precisa usar essa modelagem.

## Acompanhamento de uso de armazenamento

O objeto Armazenamento de classe concentra o armazenamento da classe no MongoDB e no Elasticsearch, pelo painel Dados e pela listagem. Na seção do Elasticsearch estão os campos buscáveis, o mapeamento dos subcampos conforme as regras de operação complexa de indexação, e a quantidade de usos desses campos nos últimos 30 dias. A quantidade de usos é atualizada a cada 7 dias por rotina.
