// =====================================================================
// SESSÃO AZURE DEVOPS
// Lê e grava .azure-session.json na pasta da skill.
// O .env guarda só o link (AZURE_DEVOPS_URL). Sem PAT nem senha.
// Não imprimir cookie nem token.
// =====================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PASTA_SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_SESSAO = resolve(PASTA_SKILL, ".azure-session.json");
const ARQUIVO_ENV = resolve(PASTA_SKILL, ".env");
const NOME_VAR_URL = "AZURE_DEVOPS_URL";

export function caminhoSessaoAzure() {
    return ARQUIVO_SESSAO;
}

export function caminhoEnvAzure() {
    return ARQUIVO_ENV;
}

export function lerEnvAzure() {
    if (!existsSync(ARQUIVO_ENV)) {
        return {};
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

export function urlAzureDevops() {
    const env = lerEnvAzure();
    const url = env[NOME_VAR_URL];

    if (!url) {
        throw new Error(
            "Variável " + NOME_VAR_URL + " não está preenchida no .env da skill."
        );
    }

    return normalizarUrlAzure(url);
}

export function gravarUrlAzureDevops(urlInformada) {
    const url = normalizarUrlAzure(urlInformada);
    const linhas = existsSync(ARQUIVO_ENV)
        ? readFileSync(ARQUIVO_ENV, "utf8").split(/\r?\n/)
        : [
              "# Copie de .env.example. Só o link da organização; sem PAT nem senha.",
              "",
          ];

    let encontrada = false;
    const saida = linhas.map((linha) => {
        const textoLinha = linha.trim();

        if (!textoLinha || textoLinha.startsWith("#") || !textoLinha.includes("=")) {
            return linha;
        }

        const separador = textoLinha.indexOf("=");
        const nome = textoLinha.slice(0, separador).trim();

        if (nome !== NOME_VAR_URL) {
            return linha;
        }

        encontrada = true;
        return NOME_VAR_URL + "=" + url;
    });

    if (!encontrada) {
        if (saida.length && saida[saida.length - 1] !== "") {
            saida.push("");
        }
        saida.push(NOME_VAR_URL + "=" + url);
    }

    writeFileSync(ARQUIVO_ENV, saida.join("\n").replace(/\n*$/, "\n"), "utf8");
    return url;
}

export function salvarSessaoAzure(sessao) {
    const atual = lerMapaSessao();
    let origemPadrao = "https://dev.azure.com";

    try {
        origemPadrao = new URL(urlAzureDevops()).origin;
    } catch {
        // Sem .env ainda; mantém fallback só para a sessão.
    }

    atual.obtidoEm = new Date().toISOString();
    atual.origem = sessao.origem || origemPadrao;
    atual.usuario = sessao.usuario || null;
    atual.cookies = Array.isArray(sessao.cookies) ? sessao.cookies : [];
    atual.expiraEm = sessao.expiraEm || null;

    writeFileSync(ARQUIVO_SESSAO, JSON.stringify(atual, null, 4) + "\n", "utf8");
}

function normalizarUrlAzure(urlInformada) {
    const texto = String(urlInformada || "").trim().replace(/\/$/, "");

    if (!texto) {
        throw new Error("Informe o link da organização Azure DevOps.");
    }

    let parseada;

    try {
        parseada = new URL(texto);
    } catch {
        throw new Error("Link Azure inválido: " + texto);
    }

    if (!/^https?:$/i.test(parseada.protocol)) {
        throw new Error("Link Azure precisa ser http(s): " + texto);
    }

    if (!/dev\.azure\.com|visualstudio\.com/i.test(parseada.hostname)) {
        throw new Error(
            "Link Azure esperado em dev.azure.com ou visualstudio.com: " + texto
        );
    }

    return texto;
}

export function obterSessaoAzure() {
    const sessao = lerMapaSessao();

    if (!Array.isArray(sessao.cookies) || sessao.cookies.length === 0) {
        throw new Error("Não há sessão Azure salva. Rode login-edge-azure.mjs.");
    }

    if (sessaoExpirada(sessao)) {
        throw new Error("A sessão Azure expirou. Rode login-edge-azure.mjs de novo.");
    }

    return sessao;
}

export function montarHeaderCookie(sessao) {
    const cookies = sessao?.cookies || obterSessaoAzure().cookies;

    return cookies
        .map((cookie) => String(cookie.name) + "=" + String(cookie.value))
        .join("; ");
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
    const limite = expiracaoEfetiva(sessao);

    if (!limite) {
        return false;
    }

    return Date.now() / 1000 >= limite - 60;
}

function expiracaoEfetiva(sessao) {
    const cookies = Array.isArray(sessao?.cookies) ? sessao.cookies : [];
    const candidatos = cookies
        .filter((cookie) => {
            const nome = String(cookie.name || "");
            const dominio = String(cookie.domain || "");
            const expira = Number(cookie.expires) || 0;

            if (expira <= 0) {
                return false;
            }

            // Ignora cookies curtos de AAD; a sessão útil fica em VstsSession.
            if (/AadAuthenticationSet/i.test(nome)) {
                return false;
            }

            return /vsts|azure|visualstudio/i.test(nome + " " + dominio);
        })
        .map((cookie) => Number(cookie.expires));

    if (candidatos.length) {
        return Math.max(...candidatos);
    }

    if (sessao?.expiraEm) {
        return Number(sessao.expiraEm);
    }

    return null;
}
