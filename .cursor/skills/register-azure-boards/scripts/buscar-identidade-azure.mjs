// =====================================================================
// BUSCAR IDENTITY AZURE (Assigned To)
// Uso:
//   node scripts/buscar-identidade-azure.mjs --texto "nome ou email"
// Saída: JSON em stdout. Sem PAT. Não inventa identity.
// =====================================================================

import { buscarIdentidades, organizacaoDaUrl } from "./lib/api-azure.mjs";
import { urlAzureDevops } from "./lib/sessao-azure.mjs";

const args = lerArgs(process.argv.slice(2));

try {
    if (!args.texto) {
        throw new Error(
            "Uso: node buscar-identidade-azure.mjs --texto <consulta>"
        );
    }

    const identities = await buscarIdentidades(args.texto, {
        top: args.top ? Number(args.top) : 20,
    });

    console.log(
        JSON.stringify(
            {
                org: organizacaoDaUrl(urlAzureDevops()),
                texto: String(args.texto),
                identities,
            },
            null,
            2
        )
    );
} catch (erro) {
    console.error(String(erro && erro.message ? erro.message : erro));
    process.exitCode = 1;
}

function lerArgs(lista) {
    const saida = {};

    for (let i = 0; i < lista.length; i += 1) {
        const atual = lista[i];

        if (!atual.startsWith("--")) {
            continue;
        }

        const nome = atual.slice(2);
        const valor =
            lista[i + 1] && !lista[i + 1].startsWith("--")
                ? lista[++i]
                : "true";
        saida[nome] = valor;
    }

    return saida;
}
