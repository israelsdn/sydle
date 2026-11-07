// =====================================================================
// COFRE DA SESSÃO NO WINDOWS
// Cifra o token com DPAPI no escopo do usuário atual. Outro usuário
// ou outra máquina não recupera o texto. O segredo entra pelo stdin
// e não aparece na linha de comando.
// =====================================================================

import { spawnSync } from "node:child_process";

const SCRIPT_PROTEGER = [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    "[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false",
    "[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false",
    "Add-Type -AssemblyName System.Security",
    "$plain = [Console]::In.ReadToEnd()",
    "if ([string]::IsNullOrEmpty($plain)) { exit 2 }",
    "$bytes = [System.Text.Encoding]::UTF8.GetBytes($plain)",
    "$blob = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)",
    "[Console]::Out.Write([Convert]::ToBase64String($blob))",
].join("\n");

const SCRIPT_DESPROTEGER = [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    "[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false",
    "[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false",
    "Add-Type -AssemblyName System.Security",
    "$b64 = [Console]::In.ReadToEnd()",
    "if ([string]::IsNullOrWhiteSpace($b64)) { exit 2 }",
    "$blob = [Convert]::FromBase64String($b64.Trim())",
    "$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($blob, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)",
    "[Console]::Out.Write([System.Text.Encoding]::UTF8.GetString($bytes))",
].join("\n");

export function protegerTexto(texto) {
    return executarCofre(SCRIPT_PROTEGER, texto);
}

export function desprotegerTexto(textoProtegido) {
    return executarCofre(SCRIPT_DESPROTEGER, textoProtegido).replace(/\r?\n$/, "");
}

function executarCofre(script, entrada) {
    if (process.platform !== "win32") {
        throw new Error("A proteção da sessão SYDLE exige Windows.");
    }

    if (!entrada) {
        throw new Error("Não foi possível usar a proteção de dados do Windows para a sessão SYDLE.");
    }

    const comando = Buffer.from(script, "utf16le").toString("base64");
    const resultado = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-EncodedCommand", comando],
        {
            input: entrada,
            windowsHide: true,
        }
    );

    if (resultado.error || resultado.status !== 0 || !resultado.stdout || resultado.stdout.length === 0) {
        throw new Error(
            "Não foi possível usar a proteção de dados do Windows para a sessão SYDLE. Faça o login de novo."
        );
    }

    return resultado.stdout.toString("utf8").replace(/^\uFEFF/, "").trim();
}
