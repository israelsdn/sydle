---
description: Restrições do motor e da modelagem do SYDLE ONE
---

# Plataforma SYDLE

`let` tem escopo de função, não de bloco. Não repetir o nome e não declarar `let` dentro de laço. `const` por padrão. Nunca `var`. Aspas duplas, ponto e vírgula, 4 espaços, `===`.

`_utils` chama método de classe. `_util` é helper de arquivo. Não trocar um pelo outro.

Não persistir em rascunho nem em `_getMetadata`. Integração só quando o campo mudou em relação a `_oldObject` (em tela, `_input` e `_oldInput`).

Referência de interface inclui `_classId` junto do `_id`. Não inventar id de classe, template ou atribuição.

Erro que o usuário vê: `throw "frase."`. Erro técnico capturado e logado: `new Error`, com `stack` no log e frase limpa para o usuário. Sem `useTranslation`. Sem `catch` vazio.

Detalhe na skill `sydle`, arquivo `references/plataforma.md`.
