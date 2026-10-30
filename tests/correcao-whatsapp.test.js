"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {corrigirFonte} = require("../scripts/corrigir-whatsapp-web");

const trecho = [
  "window.WWebJS.sendMessage = async () => {",
  "        const message = {",
  "            id: newMsgKey,",
  "            ...mediaOptions,",
  "        };",
  "        // Bot's won't reply if canonicalUrl is set (linking)",
  "        return message;",
  "};"
].join("\n");

test("patch de PDF remove __x_id e é idempotente", () => {
  const primeira = corrigirFonte(trecho);
  assert.equal(primeira.estado, "corrigido");
  assert.match(primeira.fonte, /delete message\.__x_id;/);
  const segunda = corrigirFonte(primeira.fonte);
  assert.equal(segunda.estado, "ja_corrigido");
  assert.equal(segunda.fonte, primeira.fonte);
});
test("patch não altera estrutura desconhecida", () => {
  const fonte = "window.WWebJS.sendMessage = () => {};\n";
  const resultado = corrigirFonte(fonte);
  assert.equal(resultado.estado, "nao_reconhecido");
  assert.equal(resultado.fonte, fonte);
});
