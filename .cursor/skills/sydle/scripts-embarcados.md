# Scripts embarcados

Código que a plataforma executa. Não é o tooling HTTP.

## Ordem do arquivo

1. Cabeçalho entre linhas de `=`, nome em caixa alta, lista numerada do que o script faz.
2. Validação. `throw` se o dado é inválido. `return` se não há o que processar.
3. `require` e constantes de id.
4. Processamento.
5. Efeitos (salvar, permissão, integração).
6. Funções auxiliares no final, na ordem em que são chamadas.

Sem banner `// ===== VALIDAÇÃO =====`. Separar com linha em branco.

```javascript
// =====================================================================
// NOME DO SCRIPT EM CAIXA ALTA
// Descrição de uma linha do gatilho. Este script:
// 1) Primeira responsabilidade
// 2) Segunda responsabilidade
// =====================================================================
```

`require` no topo, com `const`. Ids em `SCREAMING_SNAKE_CASE` (`CLASS_ID_TEMPLATE`). Não inventar id: constante `""` e comentário de que falta preencher.

## Funções

No máximo uma responsabilidade. Mais de 3 parâmetros viram um objeto desestruturado na assinatura. Query (busca) separada de comando (efeito). Função pura quando não há banco nem efeito externo.

Normalizar campo que pode vir único ou lista para array antes de processar. Optional chaining em dado de entrada. Diff de listas com `Set` antes de qualquer efeito.

Comentário de função: o que faz e, quando houver, a regra de negócio.

## Erro no script

```javascript
if (!agente) {
    throw "Agente suprido não encontrado.";
}
```

```javascript
try {
    documento = gerarPDF(template, dadosDocumento, NOME_TERMO);
} catch (err) {
    registrarLogErro("Falha ao gerar o Termo de Formalização", err);
    throw "Não foi possível gerar o Termo de Formalização. Acione o suporte técnico.";
}
```

O mecanismo de log do projeto pode ainda não existir. Se o código depender dele, dizer isso em vez de inventar a persistência do log.
