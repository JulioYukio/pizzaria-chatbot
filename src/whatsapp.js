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
client.on('message',async msg=>{
 if(msg.fromMe||msg.from==='status@broadcast'||msg.from.endsWith('@g.us')||msg.type!=='chat')return;
 try{
  if(/^(menu|reiniciar|0|1)$/i.test(String(msg.body||"").trim()) &&
     (/^(menu|reiniciar|0)$/i.test(String(msg.body||"").trim()) ||
      bot.sessoes.get(msg.from)?.etapa==="menu")){
   const file=path.join(__dirname,"..","assets","cardapio.png");
   if(fs.existsSync(file))await client.sendMessage(msg.from,MessageMedia.fromFilePath(file),{caption:"Cardápio — sabores e preços"});
   else await client.sendMessage(msg.from,"Cardápio em imagem ainda não disponível. Em breve!");
  }
  await msg.reply(bot.falar(msg.from,msg.body));
 }catch(e){console.error('Erro ao responder:',e.message);}
});
client.initialize().catch(e=>{console.error('Falha ao iniciar:',e);process.exitCode=1;});
