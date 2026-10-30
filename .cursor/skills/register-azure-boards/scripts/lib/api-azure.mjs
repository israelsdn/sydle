// =====================================================================
// API AZURE DEVOPS (create-only + listagens)
// Autentica com cookie da sessão Edge + SessionToken. Sem PAT.
// Não imprimir cookie nem token.
// =====================================================================

import {
    montarHeaderCookie,
    obterSessaoAzure,
    urlAzureDevops,
} from "./sessao-azure.mjs";

const API_VERSION = "7.1";
const APP_ID_SESSAO = "00000000-0000-0000-0000-000000000000";

export function organizacaoDaUrl(urlOrg) {
    const parseada = new URL(urlOrg || urlAzureDevops());
    const partes = parseada.pathname.split("/").filter(Boolean);

    if (!partes.length) {
        throw new Error("AZURE_DEVOPS_URL precisa incluir a organização.");
    }

    return partes[0];
}

export async function obterBearerAzure(sessao) {
    const sessaoAtual = sessao || obterSessaoAzure();
    const cookie = montarHeaderCookie(sessaoAtual);
    const url =
        urlAzureDevops() +
        "/_apis/WebPlatformAuth/SessionToken?api-version=7.1-preview.1";

    const resposta = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: cookie,
        },
        body: JSON.stringify({
            appId: APP_ID_SESSAO,
            force: false,
        }),
    });

    const texto = await resposta.text();
    let corpo;

    try {
        corpo = JSON.parse(texto);
    } catch {
        corpo = null;
    }

    if (!resposta.ok || !corpo?.token) {
        throw new Error(
            "Falha ao obter SessionToken Azure (" +
                resposta.status +
                ")."
        );
    }

    return String(corpo.token);
}

export async function requestAzureJson(caminhoRelativo, opcoes = {}) {
    const sessao = obterSessaoAzure();
    const bearer = await obterBearerAzure(sessao);
    const metodo = opcoes.method || "GET";
    const orgUrl = urlAzureDevops();
    const url = caminhoRelativo.startsWith("http")
        ? caminhoRelativo
        : orgUrl.replace(/\/$/, "") +
          (caminhoRelativo.startsWith("/")
              ? caminhoRelativo
              : "/" + caminhoRelativo);

    const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + bearer,
        Cookie: montarHeaderCookie(sessao),
        ...(opcoes.headers || {}),
    };

    const resposta = await fetch(url, {
        method: metodo,
        headers,
        body: opcoes.body,
    });

    const texto = await resposta.text();
    let corpo;

    try {
        corpo = texto ? JSON.parse(texto) : null;
    } catch {
        corpo = null;
    }

    if (!resposta.ok) {
        const mensagem =
            corpo?.message || texto.slice(0, 300) || "erro sem corpo";
        throw new Error(
            "Azure " + metodo + " " + url + " (" + resposta.status + "): " + mensagem
        );
    }

    return corpo;
}

export async function listarProjetos() {
    const corpo = await requestAzureJson(
        "/_apis/projects?api-version=" + API_VERSION + "&$top=200"
    );

    return (corpo?.value || []).map((projeto) => ({
        id: projeto.id,
        name: projeto.name,
        state: projeto.state,
    }));
}

export async function listarAreas(projeto) {
    return listarClassificationPaths(projeto, "Areas");
}

export async function listarIterations(projeto) {
    return listarClassificationPaths(projeto, "Iterations");
}

async function listarClassificationPaths(projeto, estrutura) {
    const nomeProjeto = String(projeto || "").trim();

    if (!nomeProjeto) {
        throw new Error("projeto é obrigatório para listar " + estrutura + ".");
    }

    const corpo = await requestAzureJson(
        "/" +
            encodeURIComponent(nomeProjeto) +
            "/_apis/wit/classificationnodes/" +
            estrutura +
            "?$depth=10&api-version=" +
            API_VERSION
    );

    return achatarNosClassificacao(corpo, []);
}

function achatarNosClassificacao(no, caminhoPai) {
    if (!no || typeof no !== "object") {
        return [];
    }

    const segmento = no.name ? String(no.name) : null;
    const caminho = segmento
        ? caminhoPai.concat(segmento)
        : caminhoPai.slice();
    const path = caminho.join("\\");
    const saida = path
        ? [
              {
                  path,
                  name: segmento,
                  hasChildren: Boolean(no.hasChildren),
              },
          ]
        : [];

    const filhos = Array.isArray(no.children) ? no.children : [];

    for (const filho of filhos) {
        saida.push(...achatarNosClassificacao(filho, caminho));
    }

    return saida;
}

export async function buscarIdentidades(texto, opcoes = {}) {
    const consulta = String(texto || "").trim();

    if (!consulta) {
        throw new Error("Informe texto para buscar identities.");
    }

    const top = Number(opcoes.top) > 0 ? Number(opcoes.top) : 20;
    const org = organizacaoDaUrl();
    const url =
        "https://vssps.dev.azure.com/" +
        encodeURIComponent(org) +
        "/_apis/identities?searchFilter=General&filterValue=" +
        encodeURIComponent(consulta) +
        "&queryMembership=None&api-version=7.1";

    const corpo = await requestAzureJson(url);
    const valor = Array.isArray(corpo?.value)
        ? corpo.value
        : Array.isArray(corpo)
          ? corpo
          : [];

    return valor.slice(0, top).map((identity) => {
        const props = identity.properties || {};
        const account =
            lerPropIdentity(props, "Account") ||
            identity.providerDisplayName ||
            null;
        const mail =
            lerPropIdentity(props, "Mail") ||
            lerPropIdentity(props, "MailAddress") ||
            null;

        return {
            id: identity.id || identity.descriptor || null,
            displayName: identity.providerDisplayName || account || mail,
            uniqueName: mail || account,
            descriptor: identity.descriptor || null,
        };
    });
}

function lerPropIdentity(props, chave) {
    const bruto = props?.[chave];

    if (bruto == null) {
        return null;
    }

    if (typeof bruto === "string" || typeof bruto === "number") {
        return String(bruto);
    }

    if (typeof bruto === "object" && bruto.$value != null) {
        return String(bruto.$value);
    }

    return null;
}

export async function criarWorkItemAzure(opcoes) {
    const projeto = String(opcoes.projeto || "").trim();
    const tipo = String(opcoes.tipo || "").trim();
    const titulo = String(opcoes.titulo || "").trim();
    const areaPath = String(opcoes.areaPath || "").trim();
    const iterationPath = String(opcoes.iterationPath || "").trim();
    const assignedTo = opcoes.assignedTo
        ? String(opcoes.assignedTo).trim()
        : null;
    const descricao = opcoes.descricao ? String(opcoes.descricao) : null;
    const idPai = opcoes.idPai != null ? Number(opcoes.idPai) : null;

    if (!projeto || !tipo || !titulo) {
        throw new Error("projeto, tipo e titulo são obrigatórios.");
    }

    if (!areaPath) {
        throw new Error("areaPath é obrigatório.");
    }

    if (!iterationPath) {
        throw new Error("iterationPath é obrigatório.");
    }

    const sessao = obterSessaoAzure();
    const bearer = await obterBearerAzure(sessao);
    const orgUrl = urlAzureDevops();
    const url =
        orgUrl +
        "/" +
        encodeURIComponent(projeto) +
        "/_apis/wit/workitems/$" +
        encodeURIComponent(tipo) +
        "?api-version=" +
        API_VERSION;

    const patch = [
        {
            op: "add",
            path: "/fields/System.Title",
            value: titulo,
        },
        {
            op: "add",
            path: "/fields/System.AreaPath",
            value: areaPath,
        },
        {
            op: "add",
            path: "/fields/System.IterationPath",
            value: iterationPath,
        },
    ];

    if (assignedTo) {
        patch.push({
            op: "add",
            path: "/fields/System.AssignedTo",
            value: assignedTo,
        });
    }

    if (descricao) {
        patch.push({
            op: "add",
            path: "/fields/System.Description",
            value: descricao,
        });
    }

    if (idPai) {
        patch.push({
            op: "add",
            path: "/relations/-",
            value: {
                rel: "System.LinkTypes.Hierarchy-Reverse",
                url:
                    orgUrl +
                    "/_apis/wit/workItems/" +
                    String(idPai),
            },
        });
    }

    const resposta = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json-patch+json",
            Authorization: "Bearer " + bearer,
            Cookie: montarHeaderCookie(sessao),
        },
        body: JSON.stringify(patch),
    });

    const texto = await resposta.text();
    let corpo;

    try {
        corpo = JSON.parse(texto);
    } catch {
        corpo = null;
    }

    if (!resposta.ok) {
        const mensagem =
            corpo?.message ||
            texto.slice(0, 300) ||
            "erro sem corpo";
        throw new Error(
            "Falha ao criar " +
                tipo +
                " (" +
                resposta.status +
                "): " +
                mensagem
        );
    }

    return {
        id: corpo.id,
        tipo,
        titulo: corpo.fields?.["System.Title"] || titulo,
        url: corpo._links?.html?.href || corpo.url,
        areaPath: corpo.fields?.["System.AreaPath"] || areaPath,
        iterationPath:
            corpo.fields?.["System.IterationPath"] || iterationPath,
        assignedTo:
            corpo.fields?.["System.AssignedTo"]?.uniqueName ||
            corpo.fields?.["System.AssignedTo"]?.displayName ||
            assignedTo ||
            null,
        idPai: idPai || null,
    };
}
