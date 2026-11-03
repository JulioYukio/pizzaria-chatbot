const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Bot } = require("../src/bot");

function adiar() {
  let resolver;
  const promessa = new Promise(resolve => { resolver = resolve; });
  return { promessa, resolver };
}

// Executa o conector e o Bot reais; substitui apenas o transporte externo e a mídia.
function simular({
  codigo = fs.readFileSync(path.join(__dirname, "../src/whatsapp.js"), "utf8"),
  imagemDisponivel = true,
  prepararImagem = () => "imagem",
  enviarMidia = async () => {},
  agora = () => Date.now(),
  metadados = async () => {
    if (!imagemDisponivel) throw Object.assign(new Error("Arquivo ausente"), {code:"ENOENT"});
    return {mtimeMs:1, ctimeMs:1, size:10};
  }
} = {}) {
  const eventos = {}, envios = [], respostas = [], erros = [];
  const relogios = new Map(); let proximoRelogio = 0;
  const bot = new Bot();
  class Client {
    on(evento, handler) { eventos[evento] = handler; }
    async sendMessage(...args) { envios.push(args); return enviarMidia(...args); }
    async initialize() {}
  }
  const dependencias = {
    "node:fs": { existsSync: () => imagemDisponivel, promises:{stat:metadados} },
    "node:path": path,
    "whatsapp-web.js": { Client, LocalAuth: class {}, MessageMedia: { fromFilePath: prepararImagem } },
    "qrcode-terminal": {},
    "./bot": { Bot: class { constructor() { return bot; } } }
  };
  const contexto = vm.createContext({
    require: nome => { assert.ok(Object.hasOwn(dependencias, nome)); return dependencias[nome]; },
    __dirname: path.join(__dirname, "../src"),
    console: { log() {}, error: (...args) => erros.push(args) },
    process,
    setTimeout: fn => { const id=++proximoRelogio; relogios.set(id,fn); return id; },
    clearTimeout: id => relogios.delete(id),
    Date: class extends Date { static now() { return agora(); } }
  });
  vm.runInContext(codigo, contexto);
  function enviar(body, from = "a@c.us", extras = {}) {
    return eventos.message({
      from, fromMe: false, type: "chat", body,
      reply: async texto => { respostas.push({ from, texto }); },
      ...extras
    });
  }
  async function dispararAvisos(){
    const tarefas=[...relogios.values()];relogios.clear();
    for(const tarefa of tarefas)await tarefa();
  }
  return { bot, envios, respostas, erros, enviar, contexto, relogios, dispararAvisos };
}

module.exports = { adiar, simular };
