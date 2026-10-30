# Identificadores

Label (nome visível) pode ter artigo, preposição ou conjunção. Identifier não: se o trecho só liga duas palavras, ele não entra.

Partículas: `da`, `das`, `do`, `dos`, `de`, `e`, `a`, `as`, `o`, `os`, e o mesmo tipo de ponte (`em`, `para`, `com`, `por`, `na`, `no`) quando não acrescenta significado.

```javascript
// ruim
numeroDaLiquidacao
codigoDoCredor
dataDeEmissao
tipoDeServicoEFaturamento
NotaDeLiquidacao

// bom
numeroLiquidacao
codigoCredor
dataEmissao
tipoServicoFaturamento
NotaLiquidacao
```

Não cortar quando a partícula faz parte da palavra (`detalhe`, `destino`, `empenhado`, `orgao`, `outros`).

Campo que ainda vai virar referência ou embutida: identifier definitivo + `Alterar` (`dadosEmpenhoAlterar`).

Classe em `PascalCase`. Campo, método, opção e variável em `camelCase`. Idioma do domínio: português. O guia oficial pede inglês; a base existente está em português e misturar agora cria base mista.

Pergunta em forma afirmativa: `isMarried`, nunca `isNotMarried`. Método visível no infinitivo (`Validar CPF`). Identificador do método começa por verbo (`validarCpf`).
