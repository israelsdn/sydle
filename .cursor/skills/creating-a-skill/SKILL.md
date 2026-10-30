---
name: creating-a-skill
description: >-
  Cria, autora ou versiona uma skill em .cursor/skills. Use quando o usuário
  pedir para criar, autorar ou versionar uma skill. Não é create-skill (guia
  de formato), nem create-rule, nem um agent.
version: 1.0.0
---

# Criar uma skill

Portão para gravar uma skill de projeto. Funciona em qualquer workspace. Não exige conhecimento prévio do projeto.

A skill fica em `<workspace>/.cursor/skills/<name>/` e viaja com o repositório. Enquanto você não conferir o arquivo nesse caminho, ela é um arquivo no disco.

## Quando usar

Use quando a pessoa pedir para criar, autorar ou versionar uma skill.

Não use para:

- montar um agent ou subagent
- escrever regra em `.cursor/rules/` ou instrução de `AGENTS.md` (`create-rule`)
- explicar o formato de um `SKILL.md` (`create-skill`)
- transformar um fluxo em skill por conta própria, sem pedido

`create-skill` é o guia de formato. Esta skill é o portão: spec, conflito, plano, sim, escrita, prova.

## Description

A `description` é o que decide se a skill entra. O corpo não participa dessa escolha.

- Terceira pessoa. Abra com o verbo e o objeto que a pessoa digitaria ("cria, autora ou versiona uma skill"), não com o mecanismo.
- Diga quando alcançar a skill. Não resuma o fluxo ("planeja, escreve, valida"): isso ensina a parar no resumo.
- Feche com a fronteira do vizinho mais próximo, entre parênteses ou numa frase curta: o que esta skill não é.
- Teto do Cursor: 1024 caracteres. Escreva curta desde o início. Não redija a versão longa para cortar depois.
- Não existe `when_to_use`. Gatilho que não está na `description` não chega na escolha.

`disable-model-invocation: true` só quando a pessoa quiser a skill exclusivamente pelo nome. Se o pedido "crie uma skill…" deve alcançá-la, omita o campo. Esta skill omite: ela entra nesse pedido e não entra porque você julgou que um fluxo merecia virar skill.

## O que falta, pergunte no card

Use o AskQuestion. Não pergunte no texto da resposta. Até 4 perguntas por chamada. A primeira opção é o valor que você sugere; as outras são alternativas reais. O card já oferece texto livre.

Perguntas independentes na mesma chamada (nome e versão juntos). Campo que depende da resposta anterior fica na chamada seguinte.

Sem o card (execução sem pessoa): infira o que der, declare cada suposição, e pergunte em prosa só o que bloqueia a escrita.

Sem um campo, diga qual é.

| Campo | Chave | Por que |
|---|---|---|
| nome / versão | `name`, `version` | `name` em kebab-case; `version` no frontmatter |
| objetivo | `objective` | para que serve, numa linha |
| entradas / saídas | `inputs`, `outputs` | o que lê e o que produz |
| gatilhos | `triggers` | quando deve ser alcançada |
| limites | `limits` | o que nunca pode fazer |
| owner | `owner` | quem responde |
| permissões | `permissions`, `egress`, `writes` | o que declara; nunca alargar |
| verificação | `verification` | como saber que funcionou |
| falha | `failure_criteria` | como saber que não funcionou |

Listas são listas de frases. Três recusas são absolutas: sem owner, sem limites, ou sem critério verificável, não se autora.

## O que gravar

Um diretório por nome, sem segmento de versão. A versão fica no frontmatter. Dois diretórios do mesmo nome seriam duas skills.

```
.cursor/skills/<name>/
├── SKILL.md
├── references/<topico>.md    # só se o corpo passar de ~500 linhas
└── scripts/                   # só para passo determinístico, sem juízo
```

`SKILL.md` tem frontmatter `name`, `description`, `version` e as seções da spec: gatilhos, entradas, saídas, limites, verificação, critério de falha, owner.

O `SKILL.md` é um índice, não um manual. Até ~500 linhas. Passou disso, o detalhe vai para `references/<topico>.md`, um nível só: o `SKILL.md` aponta para o reference; um reference não aponta para outro.

Formato fino do arquivo (name com no máximo 64 caracteres, letras minúsculas, números e hífen; description em terceira pessoa, com o quê e o quando) está na skill `create-skill`. Leia essa skill na hora de redigir o arquivo, não antes.

Não grave `capability.yaml`, suíte `tests/test_<name>.py`, nem arquivo em `.encoder/`. Isso não faz parte deste workspace. Não grave em `~/.cursor/skills-cursor/` (reservado ao Cursor). `~/.cursor/skills/<name>/` só se a pessoa pedir skill pessoal, fora do repositório.

O entregável é a pasta da skill. Rascunho de spec não fica dentro dela, nem na raiz do workspace. Se precisar de rascunho, use o scratchpad da sessão e não o deixe no repositório.

`scripts/` só quando a spec nomear um passo determinístico (checagem, consulta, transformação sem juízo). Esse passo vira script. Passo com juízo fica em prosa. Não embuta bloco de shell injetado no markdown (exclamação seguida de comando).

## Conflito

Antes de escrever, liste. Não decida de cabeça.

- `.cursor/skills/*/SKILL.md` neste workspace
- `~/.cursor/skills/*/SKILL.md`
- nomes já reservados em `~/.cursor/skills-cursor/` (`create-skill`, `create-rule`, `create-hook` e os demais que a listagem mostrar)

Nome já usado, ou gatilho que outra skill do workspace já cobre, bloqueia. Reporte o conflito. Não contorne com outro nome em silêncio. Skill de `skills-cursor` ou de `~/.cursor/skills` com o mesmo nome também bloqueia: não sobrescreva skill que você não autorou aqui.

Versionar uma skill que esta skill já gravou neste projeto é substituição: novo sim, mesma pasta, `version` maior no frontmatter. Isso não libera sobrescrever skill de outro tier.

## Ordem

1. Feche a spec na conversa. Diga cedo qual campo ainda falta.
2. Rode a checagem de conflito acima.
3. Mostre o plano e pare: `name`, `version`, arquivos, conflitos. Sem sim, não escreva. Quem aprovou entra na sua resposta (`aprovado por <quem>`), não num flag de CLI.
4. No sim, grave os arquivos. Não componha o pacote antes desse sim.
5. Prove o arquivo. Leia o `SKILL.md` gravado e confira: o path é `.cursor/skills/<name>/SKILL.md`; o frontmatter tem `name`, `description` e `version`; a `description` tem até 1024 caracteres; o `name` não colide com o que a checagem listou. Não existe `verify-skill` nem `encoder skills` aqui. Não diga que o catálogo confirmou. O app recarrega sozinho; se a skill não aparecer, a pessoa roda `/reload-skills`.
6. Confira os gatilhos uma vez, no AskQuestion, com duas opções: "Confirmar gatilhos" e "Ajustar gatilhos". Mostre de três a cinco pedidos que devem alcançar esta skill e dois ou três que não devem. Compare com a `description` exatamente como foi gravada. Frase que deveria disparar e não compartilha vocabulário com a description, ou frase que não deveria e casa palavra por palavra, pede outra description — não outro corpo. Só rode a prova de novo se a description mudar.

Um "aprovo" que chega depois da prova não reabre a tarefa. Responda em uma linha.

Desfazer uma skill recém-gravada é apagar `.cursor/skills/<name>/`. Diga isso ao entregar, no lugar de um token de rollback.

## Se não aparecer

O app recarrega o catálogo depois que os arquivos existem, inclusive nos chats já abertos. Se não aparecer, a pessoa roda `/reload-skills` e tenta de novo. Se continuar fora, o problema é o path ou o frontmatter — a prova do passo 5 diz qual.

## Limites

- Não escrever sem o sim de quem pediu.
- Não autorar sem owner, sem limites ou sem critério verificável.
- Não gravar em `.encoder/`, em `~/.cursor/skills-cursor/`, nem dentro da pasta da skill como rascunho.
- Não sobrescrever skill de outro tier, nem renomear em silêncio para fugir de conflito.
- Não alargar permissão, egress ou escrita além do que a spec declara.
- Não anunciar a skill como carregada no catálogo. Anuncie o path e o resultado da prova do arquivo.
- Não disparar esta skill sem pedido de criar, autorar ou versionar uma skill.

## Verificação

A skill está pronta quando os seis itens da ordem 5 passam na leitura do arquivo gravado, o plano foi aprovado por uma pessoa, e a checagem de gatilhos foi feita uma vez.

## Critério de falha

Falhou se gravou sem sim, se faltou owner, limites ou verificação, se a description passa de 1024 caracteres ou narra o fluxo, se o nome colide e mesmo assim foi gravado, ou se a resposta disse que o catálogo carregou a skill.

## Owner

Israel.
