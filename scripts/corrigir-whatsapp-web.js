"use strict";
/**
 * Correção temporária para versões do whatsapp-web.js que falham ao enviar PDFs/mídias:
 * https://github.com/wwebjs/whatsapp-web.js/issues/201922
 * O patch oficial remove a propriedade interna __x_id da mensagem construída.
 * Não modifica versões cuja estrutura não corresponda ao trecho conhecido.
 */
const fs = require("node:fs");
const path = require("node:path");
const alvo = path.join(__dirname, "..", "node_modules", "whatsapp-web.js", "src", "util", "Injected", "Utils.js");

function corrigirFonte(fonte) {
  const inicio = fonte.indexOf("const message = {");
  const marcador = "        // Bot's won't reply if canonicalUrl is set (linking)";
  const pos = fonte.indexOf(marcador, inicio >= 0 ? inicio : 0);
  if (inicio < 0 || pos < 0) return {fonte, estado:"nao_reconhecido"};
  const bloco = fonte.slice(inicio, pos);
  if (bloco.includes("delete message.__x_id;")) return {fonte, estado:"ja_corrigido"};
  if (!bloco.includes("...mediaOptions,") || !bloco.includes("};")) return {fonte, estado:"nao_reconhecido"};
  const corrigida = fonte.slice(0, pos) + "        delete message.__x_id;\n" + fonte.slice(pos);
  return {fonte:corrigida, estado:"corrigido"};
}

function executar() {
  if (!fs.existsSync(alvo)) {
    console.error("whatsapp-web.js não instalado. Execute: npm.cmd install whatsapp-web.js qrcode-terminal");
    process.exitCode = 1;
    return;
  }
  try {
    const original = fs.readFileSync(alvo, "utf8");
    const resultado = corrigirFonte(original);
    if (resultado.estado === "corrigido") {
      fs.writeFileSync(alvo, resultado.fonte, "utf8");
      console.log("Correção de compatibilidade de mídia aplicada ao whatsapp-web.js instalado.");
    } else if (resultado.estado === "ja_corrigido") {
      console.log("Correção de compatibilidade de mídia já presente.");
    } else {
      console.warn("Versão do whatsapp-web.js diferente da versão afetada; não foi aplicado patch.");
      console.warn("Se o PDF falhar, o bot continuará por texto. Verifique atualizações da biblioteca.");
    }
  } catch (erro) {
    console.warn("Não foi possível aplicar o ajuste de mídia:", erro.message);
    console.warn("O bot ainda poderá responder por texto caso o PDF não seja enviado.");
  }
}

if (require.main === module) executar();
module.exports = {corrigirFonte};
