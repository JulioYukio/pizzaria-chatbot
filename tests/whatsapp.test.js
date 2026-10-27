const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {Bot}=require("../src/bot");

test("WhatsApp: 0 no catálogo avança sem reenviar imagem ou aviso",async()=>{
 for(const imagemDisponivel of [true,false]){
  const eventos={},envios=[],respostas=[];
  const bot=new Bot();
  class Client {
   on(evento,handler){eventos[evento]=handler;}
   async sendMessage(...args){envios.push(args);}
   async initialize(){}
  }
  const dependencias={
   "node:fs":{existsSync:()=>imagemDisponivel},
   "node:path":path,
   "whatsapp-web.js":{Client,LocalAuth:class {},MessageMedia:{fromFilePath:()=>"imagem"}},
   "qrcode-terminal":{},
   "./bot":{Bot:class {constructor(){return bot;}}}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/whatsapp.js"),"utf8"),{
   require:nome=>{assert.ok(Object.hasOwn(dependencias,nome));return dependencias[nome];},
   __dirname:path.join(__dirname,"../src"),console,process
  });
  async function enviar(body){
   await eventos.message({from:"a@c.us",type:"chat",body,reply:async texto=>respostas.push(texto)});
  }
  for(const texto of ["oi","1","1"])await enviar(texto);
  assert.equal(envios.length,1);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"ver");
  await enviar("0");
  assert.equal(envios.length,1);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"produto");
  assert.match(respostas.at(-1),/Escolha seu produto/);
  await enviar("16 G 2");assert.match(respostas.at(-1),/Adicionado/);
  await enviar("0");assert.equal(envios.length,2);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"menu");
  await enviar("menu");assert.equal(envios.length,3);
 }
});
