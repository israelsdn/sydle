// =====================================================================
// CRIAR WORK ITEMS (create-only)
// Lê um JSON de hierarquia e cria epic → feature → PBI → task.
// Exige areaPath e iterationPath (root ou por item). assignedTo opcional.
// Uso:
//   node scripts/criar-workitems.mjs --projeto ERP --arquivo plano.json
// Não apaga nem edita itens existentes. Sem PAT.
// =====================================================================

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { criarWorkItemAzure } from "./lib/api-azure.mjs";
import { urlAzureDevops } from "./lib/sessao-azure.mjs";

const args = lerArgs(process.argv.slice(2));

try {
    if (!args.projeto || !args.arquivo) {
        throw new Error(
            "Uso: node criar-workitems.mjs --projeto <nome> [--area <path>] [--iteration <path>] --arquivo <plano.json>"
        );
    }

    const plano = JSON.parse(readFileSync(resolve(args.arquivo), "utf8"));
    const areaPath = args.area || plano.areaPath;
    const iterationPath = args.iteration || plano.iterationPath;

    if (!areaPath || !iterationPath) {
        throw new Error(
            "areaPath e iterationPath são obrigatórios (CLI ou plano JSON)."
        );
    }

    const criados = [];

    console.log(
        "Org " +
            urlAzureDevops() +
            " | projeto " +
            args.projeto +
            " | área " +
            areaPath +
            " | iteration " +
            iterationPath
    );

    const epic = await criarNivel({
        tipo: plano.epic?.tipo || "Epic",
        titulo: plano.epic?.titulo,
        areaPath: plano.epic?.areaPath || areaPath,
        iterationPath: plano.epic?.iterationPath || iterationPath,
        assignedTo: plano.epic?.assignedTo || null,
        projeto: args.projeto,
        idPai: null,
        criados,
    });

    const feature = await criarNivel({
        tipo: plano.feature?.tipo || "Feature",
        titulo: plano.feature?.titulo,
        areaPath: plano.feature?.areaPath || areaPath,
        iterationPath: plano.feature?.iterationPath || iterationPath,
        assignedTo: plano.feature?.assignedTo || null,
        projeto: args.projeto,
        idPai: epic.id,
        criados,
    });

    const pbi = await criarNivel({
        tipo: plano.pbi?.tipo || "Product Backlog Item",
        titulo: plano.pbi?.titulo,
        areaPath: plano.pbi?.areaPath || areaPath,
        iterationPath: plano.pbi?.iterationPath || iterationPath,
        assignedTo: plano.pbi?.assignedTo || null,
        projeto: args.projeto,
        idPai: feature.id,
        criados,
    });

    const tasks = Array.isArray(plano.tasks) ? plano.tasks : [];

    for (const task of tasks) {
        await criarNivel({
            tipo: task.tipo || "Task",
            titulo: task.titulo,
            areaPath: task.areaPath || areaPath,
            iterationPath: task.iterationPath || iterationPath,
            assignedTo: task.assignedTo || null,
            projeto: args.projeto,
            idPai: pbi.id,
            criados,
        });
    }

    console.log(JSON.stringify({ criados }, null, 2));
} catch (erro) {
    console.error(String(erro && erro.message ? erro.message : erro));
    process.exitCode = 1;
}

async function criarNivel(opcoes) {
    if (!opcoes.titulo) {
        throw new Error("Título ausente para tipo " + opcoes.tipo);
    }

    const criado = await criarWorkItemAzure({
        projeto: opcoes.projeto,
        tipo: opcoes.tipo,
        titulo: opcoes.titulo,
        areaPath: opcoes.areaPath,
        iterationPath: opcoes.iterationPath,
        assignedTo: opcoes.assignedTo,
        idPai: opcoes.idPai,
    });

    opcoes.criados.push(criado);
    console.log(
        criado.tipo +
            " #" +
            criado.id +
            " — " +
            criado.titulo +
            (criado.assignedTo ? " → " + criado.assignedTo : "") +
            (criado.url ? " — " + criado.url : "")
    );
    return criado;
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
