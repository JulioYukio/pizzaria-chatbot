const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { performance } = require("node:perf_hooks");
const alvo = path.resolve(__dirname, "../src/bot.js");
const modulo = new Module(alvo, module);
modulo.filename = alvo;
modulo.paths = Module._nodeModulePaths(path.dirname(alvo));
modulo._compile(fs.readFileSync(process.argv[2] || alvo, "utf8"), alvo);
const { Bot } = modulo.exports;
const b = new Bot(), amostras = [];
let texto;
for (let rodada = 0; rodada < 8; rodada++) {
  const inicio = performance.now();
  for (let i = 0; i < 300; i++) texto = b.listar("bebida");
  const ms = performance.now() - inicio;
  if (rodada) amostras.push(ms);
}
const mediana = [...amostras].sort((a,b) => a-b)[3];
console.log(JSON.stringify({ node:process.version, listasPorRodada:300,
  amostrasMs:amostras.map(n=>+n.toFixed(3)), medianaMs:+mediana.toFixed(3),
  caracteres:texto.length, sha256:require("node:crypto").createHash("sha256").update(texto).digest("hex") }, null, 2));
