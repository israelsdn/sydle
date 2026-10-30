// =====================================================================
// SESSÃO DO SYDLE
// Lê e grava a sessão em .sydle-session.json, na pasta da skill.
// Esse arquivo não deve ser versionado. Não há usuário nem senha.
// =====================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PASTA_SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_SESSAO = resolve(PASTA_SKILL, ".sydle-session.json");
const ARQUIVO_ENV = resolve(PASTA_SKILL, ".env");

export function chaveSessao(cliente, ambiente) {
    return normalizarNome(cliente) + ":" + normalizarNome(ambiente);
}

export function lerEnv() {
    if (!existsSync(ARQUIVO_ENV)) {
        throw new Error(
            "Arquivo .env não encontrado em .cursor/skills/sydle/."
        );
    }

    const env = {};
    const texto = readFileSync(ARQUIVO_ENV, "utf8");

    for (const linha of texto.split(/\r?\n/)) {
        const textoLinha = linha.trim();

        if (!textoLinha || textoLinha.startsWith("#") || !textoLinha.includes("=")) {
            continue;
        }

        const separador = textoLinha.indexOf("=");
        const nome = textoLinha.slice(0, separador).trim();
        const valor = textoLinha.slice(separador + 1).trim();

        env[nome] = valor;
    }

    return env;
}

export function urlApiAmbiente(cliente, ambiente) {
    const env = lerEnv();
    const nomeVariavel = "SYDLE_" + normalizarNome(cliente) + "_" + normalizarNome(ambiente) + "_URL";
    const url = env[nomeVariavel];

    if (!url) {
        throw new Error("Variável " + nomeVariavel + " não está preenchida no .env.");
    }

    return url.replace(/\/$/, "");
}

export function origemApi(urlApi) {
    return new URL(urlApi).origin;
}

export function salvarSessao(cliente, ambiente, sessao) {
    const mapa = lerMapaSessao();
    const chave = chaveSessao(cliente, ambiente);

    mapa[chave] = {
        origem: sessao.origem,
        urlApi: sessao.urlApi,
        token: sessao.token,
        expiraEm: sessao.expiraEm || null,
        obtidoEm: new Date().toISOString(),
        usuario: sessao.usuario || null,
    };

    writeFileSync(ARQUIVO_SESSAO, JSON.stringify(mapa, null, 4) + "\n", "utf8");
}

export function obterAuthorizationSessao(cliente, ambiente) {
    const sessao = obterSessao(cliente, ambiente);

    if (sessaoExpirada(sessao)) {
        throw new Error(
            "A sessão do SYDLE (" + chaveSessao(cliente, ambiente) + ") expirou."
        );
    }

    return "Bearer " + sessao.token;
}

export function obterSessao(cliente, ambiente) {
    const mapa = lerMapaSessao();
    const chave = chaveSessao(cliente, ambiente);
    const sessao = mapa[chave];

    if (!sessao?.token) {
        throw new Error(
            "Não há sessão salva para " + chave + "."
        );
    }

    return sessao;
}

function lerMapaSessao() {
    if (!existsSync(ARQUIVO_SESSAO)) {
        return {};
    }

    try {
        const mapa = JSON.parse(readFileSync(ARQUIVO_SESSAO, "utf8"));
        return mapa && typeof mapa === "object" ? mapa : {};
    } catch {
        return {};
    }
}

function sessaoExpirada(sessao) {
    if (!sessao.expiraEm) {
        return false;
    }

    const agoraEmSegundos = Date.now() / 1000;

    // Margem para não usar um token que expira no meio da chamada.
    return agoraEmSegundos >= Number(sessao.expiraEm) - 60;
}

function normalizarNome(valor) {
    return String(valor || "").trim().toUpperCase();
}
