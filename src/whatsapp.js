"use strict";
// Integração NÃO OFICIAL. Use conta de testes e mensagens consentidas.
// Este processo usa o mesmo motor de conversa, mas mantém seus pedidos em memória separada do painel web.
const fs=require("node:fs");
const path=require("node:path");
let Client,LocalAuth,MessageMedia,qr;
try{({Client,LocalAuth,MessageMedia}=require('whatsapp-web.js'));qr=require('qrcode-terminal');}
catch{console.error('Dependências opcionais ausentes. Execute: npm install whatsapp-web.js qrcode-terminal');process.exit(1);}
const {Bot}=require('./bot');const bot=new Bot();
const client=new Client({authStrategy:new LocalAuth({clientId:'pizzaria-demo'})});
client.on('qr',code=>{console.log('Escaneie com o número de WhatsApp de TESTES:');qr.generate(code,{small:true});});
client.on('ready',()=>console.log('WhatsApp de teste conectado. Respostas somente a mensagens privadas recebidas.'));
client.on('auth_failure',e=>console.error('Falha de autenticação:',e));
client.on('disconnected',reason=>console.log('Sessão desconectada:',reason));
const arquivoCardapio=path.join(__dirname,"..","assets","cardapio.png");
let cacheCardapio=null;
async function obterCardapio(){
 try{
  const info=await fs.promises.stat(arquivoCardapio);
  const versao=`${info.mtimeMs}:${info.ctimeMs}:${info.size}`;
  if(cacheCardapio?.versao!==versao){
   cacheCardapio=null;
   cacheCardapio={versao,midia:MessageMedia.fromFilePath(arquivoCardapio)};
  }
  return cacheCardapio.midia;
 }catch(e){
  cacheCardapio=null;
  if(e?.code==='ENOENT')return null;
  throw e;
 }
}
async function responder(msg){
 try{
  if(/^(menu|reiniciar|0|1)$/i.test(String(msg.body||"").trim()) &&
     (/^(menu|reiniciar|0)$/i.test(String(msg.body||"").trim()) ||
      bot.sessoes.get(msg.from)?.etapa==="menu") &&
     !(String(msg.body||"").trim()==="0"&&bot.sessoes.get(msg.from)?.etapa==="ver")){
   try{
    const midia=await obterCardapio();
    if(midia)await client.sendMessage(msg.from,midia,{caption:"Cardápio — sabores e preços"});
    else await client.sendMessage(msg.from,"Cardápio em imagem ainda não disponível. Em breve!");
   }catch(e){console.error('Erro ao enviar cardápio:',e?.message||'Falha desconhecida');}
  }
  await msg.reply(bot.falar(msg.from,msg.body));
 }catch(e){console.error('Erro ao responder:',e?.message||'Falha desconhecida');}
}
const filas=new Map();
const idsPendentes=new Map(),idsConcluidos=new Map();
const PRAZO_ID_MS=10*60*1000,LIMITE_IDS=1000;
function limparIds(agora){
 for(const [id,prazo] of idsConcluidos){
  if(prazo>agora&&idsConcluidos.size<=LIMITE_IDS)break;
  idsConcluidos.delete(id);
 }
}
client.on('message',async msg=>{
 if(msg.fromMe||msg.from==='status@broadcast'||msg.from.endsWith('@g.us')||msg.type!=='chat')return;
 const serial=msg.id?._serialized;
 const id=typeof serial==='string'&&serial.length>0&&serial.length<=256?JSON.stringify([msg.from,serial]):null;
 if(id){
  const agora=Date.now();limparIds(agora);
  if(idsPendentes.has(id))return idsPendentes.get(id);
  if(idsConcluidos.get(id)>agora)return;
 }
 // Inclui os envios na fila para preservar a ordem sem bloquear outros contatos.
 const anterior=filas.get(msg.from)||Promise.resolve();
 const tarefa=anterior.then(()=>responder(msg));
 filas.set(msg.from,tarefa);
 if(id)idsPendentes.set(id,tarefa);
 try{await tarefa;}finally{
  if(filas.get(msg.from)===tarefa)filas.delete(msg.from);
  if(id){
   idsPendentes.delete(id);
   const agora=Date.now();idsConcluidos.set(id,agora+PRAZO_ID_MS);limparIds(agora);
  }
 }
});
client.initialize().catch(e=>{console.error('Falha ao iniciar:',e);process.exitCode=1;});
