// =====================================================================
// LISTAR DESTINO AZURE (projetos / areas / iterations)
// Uso:
//   node scripts/listar-destino-azure.mjs
//   node scripts/listar-destino-azure.mjs --projeto ERP
// Saída: JSON em stdout. Sem PAT. Não inventa path.
// =====================================================================

import {
    listarAreas,
    listarIterations,
    listarProjetos,
    organizacaoDaUrl,
} from "./lib/api-azure.mjs";
import { urlAzureDevops } from "./lib/sessao-azure.mjs";

const args = lerArgs(process.argv.slice(2));

try {
    const orgUrl = urlAzureDevops();
    const org = organizacaoDaUrl(orgUrl);

    if (!args.projeto) {
        const projetos = await listarProjetos();
        console.log(
            JSON.stringify(
                {
                    org,
                    orgUrl,
                    projetos,
                },
                null,
                2
            )
        );
        process.exit(0);
    }

    const projeto = String(args.projeto).trim();
    const [areas, iterations] = await Promise.all([
        listarAreas(projeto),
        listarIterations(projeto),
    ]);

    console.log(
        JSON.stringify(
            {
                org,
                orgUrl,
                projeto,
                areas,
                iterations,
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
