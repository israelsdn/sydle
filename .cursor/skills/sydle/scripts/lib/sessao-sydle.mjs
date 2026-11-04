// =====================================================================
// SESSÃO DO SYDLE
// Lê e grava a sessão em .sydle-session.json, na pasta da skill.
// O token fica cifrado com DPAPI do usuário atual do Windows.
// Esse arquivo não deve ser versionado. Não há usuário nem senha.
// =====================================================================

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { desprotegerTexto, protegerTexto } from "./cofre-windows.mjs";

const PASTA_SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ARQUIVO_SESSAO = resolve(PASTA_SKILL, ".sydle-session.json");
const ARQUIVO_ENV = resolve(PASTA_SKILL, ".env");
const PROTECAO = "dpapi-usuario";
const tokensEmMemoria = new Map();

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
    if (!sessao?.token) {
        throw new Error("A sessão não tem token para proteger.");
    }

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

    gravarMapaProtegido(mapa);
}

export function migrarSessoesTextoPuro() {
    if (!existsSync(ARQUIVO_SESSAO)) {
        return false;
    }

    const mapa = lerMapaSessao();
    const temTextoPuro = Object.keys(mapa).some((chave) => mapa[chave] && mapa[chave].token);

    if (temTextoPuro) {
        gravarMapaProtegido(mapa);
    } else {
        restringirArquivoAoUsuario(ARQUIVO_SESSAO);
    }

    return temTextoPuro;
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

    if (!sessao || (!sessao.token && !sessao.tokenProtegido)) {
        throw new Error(
            "Não há sessão salva para " + chave + "."
        );
    }

    if (sessao.token) {
        salvarSessao(cliente, ambiente, sessao);
        return obterSessao(cliente, ambiente);
    }

    if (sessao.protecao && sessao.protecao !== PROTECAO) {
        throw new Error(
            "A sessão do SYDLE usa uma proteção desconhecida. Faça o login de novo."
        );
    }

    return {
        origem: sessao.origem,
        urlApi: sessao.urlApi,
        token: tokenEmMemoria(chave, sessao.tokenProtegido),
        expiraEm: sessao.expiraEm || null,
        obtidoEm: sessao.obtidoEm || null,
        usuario: sessao.usuario || null,
    };
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

function gravarMapaProtegido(mapa) {
    const protegido = {};
    const tokensEmClaro = [];

    tokensEmMemoria.clear();

    for (const chave of Object.keys(mapa)) {
        const sessao = mapa[chave];

        if (!sessao || typeof sessao !== "object") {
            continue;
        }

        if (sessao.token) {
            tokensEmClaro.push(sessao.token);
            protegido[chave] = {
                origem: sessao.origem,
                urlApi: sessao.urlApi,
                protecao: PROTECAO,
                tokenProtegido: protegerTexto(sessao.token),
                expiraEm: sessao.expiraEm || null,
                obtidoEm: sessao.obtidoEm || new Date().toISOString(),
                usuario: sessao.usuario || null,
            };
            continue;
        }

        if (!sessao.tokenProtegido) {
            continue;
        }

        protegido[chave] = {
            origem: sessao.origem,
            urlApi: sessao.urlApi,
            protecao: PROTECAO,
            tokenProtegido: sessao.tokenProtegido,
            expiraEm: sessao.expiraEm || null,
            obtidoEm: sessao.obtidoEm || null,
            usuario: sessao.usuario || null,
        };
    }

    const conteudo = JSON.stringify(protegido, null, 4) + "\n";

    for (const token of tokensEmClaro) {
        if (conteudo.includes(token)) {
            throw new Error("A sessão foi recusada porque o token ficaria em texto puro.");
        }
    }

    const temporario = ARQUIVO_SESSAO + ".tmp";
    writeFileSync(temporario, conteudo, "utf8");
    renameSync(temporario, ARQUIVO_SESSAO);
    restringirArquivoAoUsuario(ARQUIVO_SESSAO);
}

function tokenEmMemoria(chave, blob) {
    const item = tokensEmMemoria.get(chave);

    if (item && item.blob === blob) {
        return item.token;
    }

    const token = desprotegerTexto(blob);
    tokensEmMemoria.set(chave, { blob, token });
    return token;
}

function restringirArquivoAoUsuario(arquivo) {
    if (process.platform !== "win32" || !existsSync(arquivo)) {
        return;
    }

    const usuario = usuarioAtual();

    if (!usuario) {
        console.error("Não foi possível identificar o usuário para restringir o arquivo de sessão.");
        return;
    }

    try {
        execFileSync(
            "icacls",
            [arquivo, "/inheritance:r", "/grant:r", usuario + ":(F)", "*S-1-5-18:(F)"],
            { stdio: "ignore", windowsHide: true }
        );
    } catch (erro) {
        console.error("A sessão foi cifrada, mas a permissão do arquivo não pôde ser restringida.");
    }
}

function usuarioAtual() {
    try {
        return execFileSync("whoami", {
            encoding: "utf8",
            windowsHide: true,
        }).trim();
    } catch (erro) {
        return "";
    }
}

function normalizarNome(valor) {
    return String(valor || "").trim().toUpperCase();
}
