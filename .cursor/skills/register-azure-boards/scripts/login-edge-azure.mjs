// =====================================================================
// LOGIN AZURE DEVOPS VIA EDGE
// Abre o Microsoft Edge (nunca o browser integrado do Cursor), espera o
// usuário autenticar na URL do .env (AZURE_DEVOPS_URL), grava
// .azure-session.json e fecha a janela. Projeto/área entram depois, no card.
// Uso: node scripts/login-edge-azure.mjs
// =====================================================================

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { salvarSessaoAzure, urlAzureDevops } from "./lib/sessao-azure.mjs";

const PORTA_DEBUG = Number(process.env.AZURE_EDGE_DEBUG_PORT || 9223);
const TEMPO_MAXIMO_MS = Number(process.env.AZURE_LOGIN_TIMEOUT_MS || 10 * 60 * 1000);
const INTERVALO_POLL_MS = 2000;
const perfilEdge = join(tmpdir(), "azure-edge-login");

let processoEdge = null;

try {
    const URL_LOGIN = urlAzureDevops();
    const jaAberto = await portaEmUso(PORTA_DEBUG);

    if (!jaAberto) {
        limparPerfil(perfilEdge);
        mkdirSync(perfilEdge, { recursive: true });
        processoEdge = abrirEdge(URL_LOGIN, perfilEdge, PORTA_DEBUG);
    }

    console.log("Edge aberto em " + URL_LOGIN);
    console.log("Faça o login. A janela fecha sozinha quando a sessão for gravada.");

    const sessao = await esperarSessao(PORTA_DEBUG, TEMPO_MAXIMO_MS);
    salvarSessaoAzure(sessao);

    console.log(
        "Sessão Azure salva" +
            (sessao.usuario ? " (" + sessao.usuario + ")" : "") +
            "."
    );

    await fecharEdge(PORTA_DEBUG, processoEdge);
} catch (erro) {
    console.error(String(erro && erro.message ? erro.message : erro));
    process.exitCode = 1;
}

function abrirEdge(url, perfil, porta) {
    const executavel = acharEdge();
    const args = [
        "--user-data-dir=" + perfil,
        "--remote-debugging-port=" + String(porta),
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-features=TranslateUI",
        url,
    ];

    const filho = spawn(executavel, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
    });

    filho.unref();
    return filho;
}

function acharEdge() {
    const candidatos = [
        process.env.AZURE_EDGE_PATH || process.env.SYDLE_EDGE_PATH,
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "msedge",
    ].filter(Boolean);

    for (const candidato of candidatos) {
        if (candidato === "msedge" || existsSync(candidato)) {
            return candidato;
        }
    }

    throw new Error("Microsoft Edge não encontrado. Defina AZURE_EDGE_PATH.");
}

async function esperarSessao(porta, tempoMaximoMs) {
    const inicio = Date.now();

    while (Date.now() - inicio < tempoMaximoMs) {
        try {
            const paginas = await listarPaginas(porta);
            const paginaAzure = paginas.find(
                (pagina) =>
                    pagina.type === "page" &&
                    /dev\.azure\.com|visualstudio\.com/i.test(pagina.url || "") &&
                    !/login\.microsoftonline\.com/i.test(pagina.url || "") &&
                    pagina.webSocketDebuggerUrl
            );

            if (paginaAzure) {
                const capturada = await capturarSessaoPagina(
                    paginaAzure.webSocketDebuggerUrl
                );

                if (capturada?.cookies?.length) {
                    return capturada;
                }
            }
        } catch {
            // Edge ainda subindo ou página sem sessão.
        }

        await dormir(INTERVALO_POLL_MS);
    }

    throw new Error("Tempo esgotado aguardando login no Azure (Edge).");
}

async function capturarSessaoPagina(webSocketUrl) {
    const { send, close } = await conectarCdp(webSocketUrl);

    try {
        const expressao = (() => {
            const host = location.hostname || "";
            const caminho = location.pathname || "";
            const logado =
                /dev\.azure\.com|visualstudio\.com/i.test(host) &&
                !/\/_signin|\/login/i.test(caminho);

            if (!logado) {
                return null;
            }

            let usuario = null;

            try {
                const textos = Array.from(document.querySelectorAll("[aria-label], [title], img"))
                    .map((el) => el.getAttribute("aria-label") || el.getAttribute("title") || "")
                    .filter(Boolean);
                const candidato = textos.find((t) => /@/.test(t));
                usuario = candidato || null;
            } catch {
                usuario = null;
            }

            return {
                origem: location.origin,
                usuario,
            };
        }).toString();

        const resultado = await send("Runtime.evaluate", {
            expression: "(" + expressao + ")()",
            returnByValue: true,
        });

        const meta = resultado?.result?.value;

        if (!meta) {
            return null;
        }

        // Network.* só existe no target da página no Edge; o target do
        // browser (/json/version) responde -32601 e a sessão nunca grava.
        await send("Network.enable");
        const resultadoCookies = await send("Network.getAllCookies");
        const cookies = (resultadoCookies?.cookies || [])
            .filter((cookie) =>
                /azure|visualstudio|microsoft|live\.com|login/i.test(
                    String(cookie.domain || "")
                )
            )
            .map((cookie) => ({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                expires: cookie.expires,
                httpOnly: cookie.httpOnly,
                secure: cookie.secure,
            }));

        if (!cookies.length) {
            return null;
        }

        const expiracoes = cookies
            .filter((cookie) => {
                const nome = String(cookie.name || "");
                const dominio = String(cookie.domain || "");
                const expira = Number(cookie.expires) || 0;

                if (expira <= 0 || /AadAuthenticationSet/i.test(nome)) {
                    return false;
                }

                return /vsts|azure|visualstudio/i.test(nome + " " + dominio);
            })
            .map((cookie) => Number(cookie.expires));
        const expiraEm = expiracoes.length ? Math.max(...expiracoes) : null;

        return {
            origem: meta.origem || new URL(urlAzureDevops()).origin,
            usuario: meta.usuario || null,
            cookies,
            expiraEm,
        };
    } finally {
        close();
    }
}

async function fecharEdge(porta, processo) {
    try {
        const versao = await getJson("http://127.0.0.1:" + porta + "/json/version");

        if (versao?.webSocketDebuggerUrl) {
            const { send, close } = await conectarCdp(versao.webSocketDebuggerUrl);
            try {
                await send("Browser.close");
            } catch {
                // Já fechando.
            } finally {
                close();
            }
        }
    } catch {
        // Debugging já caiu.
    }

    if (processo && !processo.killed && processo.pid) {
        try {
            if (process.platform === "win32") {
                spawn("taskkill", ["/PID", String(processo.pid), "/T", "/F"], {
                    stdio: "ignore",
                    windowsHide: true,
                });
            } else {
                process.kill(-processo.pid, "SIGTERM");
            }
        } catch {
            // Processo já encerrado.
        }
    }

    await dormir(500);
}

async function portaEmUso(porta) {
    try {
        const versao = await getJson("http://127.0.0.1:" + porta + "/json/version");
        return Boolean(versao?.webSocketDebuggerUrl);
    } catch {
        return false;
    }
}

function limparPerfil(perfil) {
    try {
        rmSync(perfil, { recursive: true, force: true });
    } catch {
        // Perfil em uso residual.
    }
}

function listarPaginas(porta) {
    return getJson("http://127.0.0.1:" + porta + "/json/list");
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout: 2000 }, (res) => {
            let corpo = "";
            res.on("data", (chunk) => {
                corpo += chunk;
            });
            res.on("end", () => {
                try {
                    resolve(JSON.parse(corpo));
                } catch (erro) {
                    reject(erro);
                }
            });
        });

        req.on("error", reject);
        req.on("timeout", () => {
            req.destroy();
            reject(new Error("timeout"));
        });
    });
}

function conectarCdp(webSocketUrl) {
    const ws = new WebSocket(webSocketUrl);
    let id = 0;
    const pendentes = new Map();

    ws.addEventListener("message", (evento) => {
        const mensagem = JSON.parse(evento.data);

        if (mensagem.id && pendentes.has(mensagem.id)) {
            const { resolve, reject } = pendentes.get(mensagem.id);
            pendentes.delete(mensagem.id);

            if (mensagem.error) {
                reject(new Error(JSON.stringify(mensagem.error)));
            } else {
                resolve(mensagem.result);
            }
        }
    });

    const pronto = new Promise((resolve, reject) => {
        ws.addEventListener("open", resolve);
        ws.addEventListener("error", reject);
    });

    function send(method, params = {}) {
        const msgId = ++id;

        return new Promise((resolve, reject) => {
            pendentes.set(msgId, { resolve, reject });
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    function close() {
        try {
            ws.close();
        } catch {
            // ignore
        }
    }

    return pronto.then(() => ({ send, close }));
}

function dormir(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
