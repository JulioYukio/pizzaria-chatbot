"use strict";
// Integração NÃO OFICIAL. Utilize apenas uma conta de WhatsApp de testes.
// O WhatsApp e o simulador web possuem pedidos em memória separada.
const fs = require("node:fs");
const path = require("node:path");
const {Bot} = require("./bot");

let Client, LocalAuth, MessageMedia, qr;
try {
  ({Client, LocalAuth, MessageMedia} = require("whatsapp-web.js"));
  qr = require("qrcode-terminal");
} catch (erro) {
  console.error("Dependências ausentes. Execute: npm.cmd install whatsapp-web.js qrcode-terminal");
  console.error(erro.message);
  process.exit(1);
}

const bot = new Bot();
// A identificação mostrada nos dispositivos conectados acompanha o sistema do computador.
// Não é o nome físico do computador; o WhatsApp pode manter o nome da sessão anterior.
const nomesSistema = {win32:"Windows", darwin:"macOS", linux:"Linux"};
const sistema = nomesSistema[process.platform] || "Computador";
const client = new Client({
  authStrategy: new LocalAuth({clientId:"pizzaria-demo"}),
  deviceName: sistema,
  browserName: "Chrome"
});

client.on("qr", codigo => {
  console.log("Escaneie o QR Code com o número de WhatsApp de TESTES:");
  qr.generate(codigo, {small:true});
});
client.on("ready", () => console.log("WhatsApp de teste conectado. Respostas somente a mensagens privadas recebidas."));
client.on("auth_failure", erro => console.error("Falha de autenticação:", erro));
client.on("disconnected", motivo => console.log("Sessão desconectada:", motivo));

function deveEnviarCardapio(entrada, etapa) {
  if (entrada === "0" && etapa === "ver") return false; // 0 avança à compra
  return /^(menu|reiniciar|0)$/i.test(entrada) || (entrada === "1" && etapa === "menu");
}

async function enviarTextoSeguro(destino, texto) {
  try {
    await client.sendMessage(destino, texto);
  } catch (erro) {
    console.error("Falha ao enviar mensagem de aviso:", erro.message);
  }
}

client.on("message", async msg => {
  if (msg.fromMe || msg.from === "status@broadcast" || msg.from.endsWith("@g.us") || msg.type !== "chat") return;
  const entrada = String(msg.body || "").trim();

  try {
    // O envio do arquivo fica separado do processamento da conversa.
    // Falhas na mídia não devem impedir a resposta do menu.
    if (deveEnviarCardapio(entrada, bot.sessoes.get(msg.from)?.etapa)) {
      const arquivo = path.join(__dirname, "..", "assets", "cardapio.pdf");
      if (!fs.existsSync(arquivo)) {
        await enviarTextoSeguro(msg.from, "O PDF do cardápio não foi encontrado em assets/cardapio.pdf. Você ainda pode consultar os sabores por texto.");
      } else {
        try {
          const midia = MessageMedia.fromFilePath(arquivo);
          await client.sendMessage(msg.from, midia, {
            sendMediaAsDocument: true,
            caption: "Cardápio completo da pizzaria — sabores e preços."
          });
        } catch (erro) {
          console.error("Falha ao enviar PDF (verifique a versão do whatsapp-web.js):", erro.message);
          await enviarTextoSeguro(msg.from, "Não consegui enviar o PDF agora. Você pode consultar os sabores pelo chat e continuar seu pedido normalmente.");
        }
      }
    }

    const resposta = bot.falar(msg.from, entrada);
    try {
      await msg.reply(resposta);
    } catch (erro) {
      console.error("Falha ao responder com reply, tentando mensagem simples:", erro.message);
      await enviarTextoSeguro(msg.from, resposta);
    }
  } catch (erro) {
    console.error("Erro ao processar mensagem:", erro.message);
  }
});

client.initialize().catch(erro => {
  console.error("Falha ao iniciar o WhatsApp:", erro);
  process.exitCode = 1;
});
