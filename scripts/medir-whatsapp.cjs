// Sem rede, conta WhatsApp ou dependências opcionais. Execute com Node.js.
const fs = require("node:fs");
const { performance } = require("node:perf_hooks");
const { setTimeout: aguardar } = require("node:timers/promises");
const { simular } = require("../test-support/whatsapp.cjs");

const codigo = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : undefined;
const contatos = 200;
const mediana = valores => [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)];

async function medir() {
  const tempos = [];
  let corretos = 0, respostas = 0;
  // Uma rodada de aquecimento e sete amostras. Cada imagem simula 5 ms de rede.
  for (let rodada = 0; rodada < 8; rodada++) {
    const s = simular({ codigo, enviarMidia: () => aguardar(5) });
    for (let i = 0; i < contatos; i++) s.bot.falar(`cliente${i}@c.us`, "oi");
    const inicio = performance.now();
    const tarefas = [];
    for (let i = 0; i < contatos; i++) {
      const contato = `cliente${i}@c.us`;
      // Os mesmos textos são produzidos antes/depois; só a ordem deve mudar.
      tarefas.push(s.enviar("menu", contato), s.enviar("2", contato));
    }
    await Promise.all(tarefas);
    const duracao = performance.now() - inicio;
    if (rodada > 0) tempos.push(duracao);
    corretos = [...s.bot.sessoes.values()].filter(s => s.etapa === "categoriaComprar").length;
    respostas = s.respostas.length;
  }
  const f = simular({ codigo, enviarMidia: async () => { throw new Error("Falha simulada de mídia"); } });
  await Promise.all(Array.from({ length: contatos }, (_, i) => f.enviar("menu", `cliente${i}@c.us`)));
  const ms = mediana(tempos);
  console.log(JSON.stringify({
    node: process.version, contatos, mensagensPorRodada: contatos * 2,
    atrasoMidiaSimuladoMs: 5, amostras: tempos.map(t => Number(t.toFixed(3))),
    medianaMs: Number(ms.toFixed(3)),
    mensagensPorSegundo: Math.round(contatos * 2 * 1000 / ms),
    conversasNaEtapaCorreta: corretos, respostasSemFalha: respostas,
    respostasTextuaisComFalhaDeMidia: f.respostas.length
  }, null, 2));
}

medir().catch(erro => { console.error(erro); process.exitCode = 1; });
