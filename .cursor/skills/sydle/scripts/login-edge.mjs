// =====================================================================
// LOGIN SYDLE VIA EDGE
// Abre o Microsoft Edge (nunca o browser integrado do Cursor), espera o
// usuário autenticar, grava .sydle-session.json e fecha a janela do Edge.
// Uso: node scripts/login-edge.mjs <CLIENTE> <AMBIENTE>
// =====================================================================

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    origemApi,
    salvarSessao,
    urlApiAmbiente,
} from "./lib/sessao-sydle.mjs";

const PORTA_DEBUG = Number(process.env.SYDLE_EDGE_DEBUG_PORT || 9222);
const TEMPO_MAXIMO_MS = Number(process.env.SYDLE_LOGIN_TIMEOUT_MS || 10 * 60 * 1000);
const INTERVALO_POLL_MS = 2000;

const cliente = process.argv[2];
const ambiente = process.argv[3];

if (!cliente || !ambiente) {
    console.error("Uso: node scripts/login-edge.mjs <CLIENTE> <AMBIENTE>");
    process.exit(1);
}

const urlApiEnv = urlApiAmbiente(cliente, ambiente);
const origem = origemApi(urlApiEnv);
const urlLogin = origem + "/app/elogroup";
const urlApiSessao = origem + "/api/1/elogroup";
const perfilEdge = join(tmpdir(), "sydle-edge-login-" + cliente + "-" + ambiente);

let processoEdge = null;

try {
    await garantirPortaLivre(PORTA_DEBUG);
    limparPerfil(perfilEdge);
    mkdirSync(perfilEdge, { recursive: true });

    processoEdge = abrirEdge(urlLogin, perfilEdge, PORTA_DEBUG);
    console.log("Edge aberto em " + urlLogin);
    console.log("Faça o login. A janela fecha sozinha quando a sessão for capturada.");

    const credencial = await esperarToken(PORTA_DEBUG, TEMPO_MAXIMO_MS);
    await validarToken(origem, credencial.token);

    salvarSessao(cliente, ambiente, {
        origem,
        urlApi: urlApiSessao,
        token: credencial.token,
        expiraEm: credencial.expiraEm,
        usuario: credencial.usuario,
    });

    console.log(
        "Sessão salva para " +
            String(cliente).toUpperCase() +
            ":" +
            String(ambiente).toUpperCase() +
            (credencial.usuario ? " (" + credencial.usuario + ")" : "") +
            "."
    );
} catch (erro) {
    console.error(String(erro && erro.message ? erro.message : erro));
    process.exitCode = 1;
} finally {
    await fecharEdge(PORTA_DEBUG, processoEdge);
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
        process.env.SYDLE_EDGE_PATH,
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "msedge",
    ].filter(Boolean);

    for (const candidato of candidatos) {
        if (candidato === "msedge" || existsSync(candidato)) {
            return candidato;
        }
    }

    throw new Error("Microsoft Edge não encontrado. Defina SYDLE_EDGE_PATH.");
}

async function esperarToken(porta, tempoMaximoMs) {
    const inicio = Date.now();

    while (Date.now() - inicio < tempoMaximoMs) {
        try {
            const paginas = await listarPaginas(porta);
            const paginaSydle = paginas.find(
                (pagina) =>
                    pagina.type === "page" &&
                    /sydle\.one/i.test(pagina.url || "") &&
                    pagina.webSocketDebuggerUrl
            );

            if (paginaSydle) {
                const credencial = await lerCredencialPagina(paginaSydle.webSocketDebuggerUrl);

                if (credencial?.token) {
                    return credencial;
                }
            }
        } catch {
            // Edge ainda subindo ou página sem sessão.
        }

        await dormir(INTERVALO_POLL_MS);
    }

    throw new Error("Tempo esgotado aguardando login no Edge.");
}

async function lerCredencialPagina(webSocketUrl) {
    const { send, close } = await conectarCdp(webSocketUrl);

    try {
        const expressao = (() => {
            const bruto = localStorage.getItem("explorer_user_map");

            if (!bruto) {
                return null;
            }

            const mapa = JSON.parse(bruto);
            const aplicativo = mapa.elogroup || Object.values(mapa)[0];
            const usuario = aplicativo && aplicativo.users && aplicativo.users[0];
            const acesso = usuario && usuario.accessToken;

            if (!acesso || !acesso.token) {
                return null;
            }

            return {
                token: acesso.token,
                expiraEm: acesso.payload && acesso.payload.exp ? acesso.payload.exp : null,
                usuario: usuario.login || usuario.name || null,
            };
        }).toString();

        const resultado = await send("Runtime.evaluate", {
            expression: "(" + expressao + ")()",
            returnByValue: true,
        });

        return resultado?.result?.value || null;
    } finally {
        close();
    }
}

async function validarToken(origemBase, token) {
    const resposta = await requisitarJson(
        "GET",
        origemBase + "/api/1/elogroup/sys/auth/validateToken",
        { Authorization: "Bearer " + token }
    );

    if (resposta.status !== 200) {
        throw new Error("Token capturado, mas validateToken retornou " + resposta.status + ".");
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

function limparPerfil(perfil) {
    try {
        rmSync(perfil, { recursive: true, force: true });
    } catch {
        // Perfil em uso residual; Edge reaproveita.
    }
}

async function garantirPortaLivre(porta) {
    try {
        const versao = await getJson("http://127.0.0.1:" + porta + "/json/version");

        if (versao?.webSocketDebuggerUrl) {
            await fecharEdge(porta, null);
            await dormir(800);
        }
    } catch {
        // Porta livre.
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

function requisitarJson(metodo, url, headers, body) {
    return new Promise((resolve, reject) => {
        const alvo = new URL(url);
        const dados = body == null ? null : JSON.stringify(body);
        const req = https.request(
            {
                hostname: alvo.hostname,
                path: alvo.pathname + alvo.search,
                method: metodo,
                headers: {
                    ...headers,
                    Accept: "application/json",
                    ...(dados
                        ? {
                              "Content-Type": "application/json",
                              "Content-Length": Buffer.byteLength(dados),
                          }
                        : {}),
                },
            },
            (res) => {
                let corpo = "";
                res.on("data", (chunk) => {
                    corpo += chunk;
                });
                res.on("end", () => {
                    let parsed = null;

                    if (corpo) {
                        try {
                            parsed = JSON.parse(corpo);
                        } catch {
                            parsed = corpo.slice(0, 200);
                        }
                    }

                    resolve({ status: res.statusCode, body: parsed });
                });
            }
        );

        req.on("error", reject);

        if (dados) {
            req.write(dados);
        }

        req.end();
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
