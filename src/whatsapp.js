"use strict";
// Integração NÃO OFICIAL. Use conta de testes e mensagens consentidas.
// Este processo usa o mesmo motor de conversa, mas mantém seus pedidos em memória separada do painel web.
let Client,LocalAuth,qr;
try{({Client,LocalAuth}=require('whatsapp-web.js'));qr=require('qrcode-terminal');}
catch{console.error('Dependências opcionais ausentes. Execute: npm install whatsapp-web.js qrcode-terminal');process.exit(1);}
const {Bot}=require('./bot');const bot=new Bot();
const client=new Client({authStrategy:new LocalAuth({clientId:'pizzaria-demo'})});
client.on('qr',code=>{console.log('Escaneie com o número de WhatsApp de TESTES:');qr.generate(code,{small:true});});
client.on('ready',()=>console.log('WhatsApp de teste conectado. Respostas somente a mensagens privadas recebidas.'));
client.on('auth_failure',e=>console.error('Falha de autenticação:',e));
client.on('disconnected',reason=>console.log('Sessão desconectada:',reason));
client.on('message',async msg=>{
 if(msg.fromMe||msg.from==='status@broadcast'||msg.from.endsWith('@g.us')||msg.type!=='chat')return;
 try{await msg.reply(bot.falar(msg.from,msg.body));}catch(e){console.error('Erro ao responder:',e.message);}
});
client.initialize().catch(e=>{console.error('Falha ao iniciar:',e);process.exitCode=1;});
