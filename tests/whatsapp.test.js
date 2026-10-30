const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {Bot}=require("../src/bot");

function ambiente({arquivoExiste=true,falhaPDF=false}={}){
 const eventos={},envios=[],respostas=[];
 const bot=new Bot();
 class Client{
  on(nome,fn){eventos[nome]=fn;}
  async sendMessage(destino,corpo,opcoes){if(falhaPDF&&opcoes?.sendMediaAsDocument)throw new Error("Falha PDF");envios.push({destino,corpo,opcoes});}
  async initialize(){}
 }
 const dependencias={
  "node:fs":{existsSync:()=>arquivoExiste},"node:path":path,
  "whatsapp-web.js":{Client,LocalAuth:class {},MessageMedia:{fromFilePath:()=>({mimetype:"application/pdf"})}},
  "qrcode-terminal":{},"./bot":{Bot:class {constructor(){return bot;}}}
 };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../src/whatsapp.js"),"utf8"),{
  require:nome=>{assert.ok(Object.hasOwn(dependencias,nome),nome);return dependencias[nome];},
  __dirname:path.join(__dirname,"../src"),console,process
 });
 return {bot,envios,respostas,enviar:async body=>eventos.message({from:"a@c.us",type:"chat",body,reply:async txt=>respostas.push(txt)})};
}
test("opção 1: um PDF e somente instruções, sem lista de sabores",async()=>{
 const a=ambiente();await a.enviar("oi");await a.enviar("1");
 assert.equal(a.envios.length,1);assert.equal(a.envios[0].opcoes.sendMediaAsDocument,true);
 assert.match(a.respostas.at(-1),/Exemplo: 31 G \(Jardineira grande\)/);
 assert.doesNotMatch(a.respostas.at(-1),/Escolha uma categoria|0 - Fazer pedido|Quantidade|CATÁLOGO COMPLETO/);
 await a.enviar("31 G 2");assert.equal(a.bot.sessoes.get("a@c.us").itens.length,0);
 assert.equal(a.envios.length,1);
 await a.enviar("menu");assert.equal(a.envios.length,1);
});
test("opção 2: pedido permanece funcional",async()=>{
 const a=ambiente();await a.enviar("oi");await a.enviar("2");await a.enviar("1");await a.enviar("16 G 2");
 assert.match(a.respostas.at(-1),/Adicionado/);assert.equal(a.envios.length,0);
});
test("falha no PDF não impede texto",async()=>{
 const a=ambiente({falhaPDF:true});await a.enviar("oi");await a.enviar("1");
 assert.match(a.respostas.at(-1),/Exemplo: 31 G/);
 assert.ok(a.envios.some(x=>/Não consegui enviar o PDF/.test(x.corpo)));
});
