const test=require("node:test");
const assert=require("node:assert/strict");
const vm=require("node:vm");
const {adiar,simular}=require("../test-support/whatsapp.cjs");

test("WhatsApp: 0 no catálogo avança sem reenviar imagem ou aviso",async()=>{
 for(const imagemDisponivel of [true,false]){
  const {bot,envios,respostas,enviar}=simular({imagemDisponivel});
  for(const texto of ["oi","1","1"])await enviar(texto);
  assert.equal(envios.length,1);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"ver");
  await enviar("0");
  assert.equal(envios.length,1);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"produto");
  assert.match(respostas.at(-1).texto,/Escolha seu produto/);
  await enviar("16 G 2");assert.match(respostas.at(-1).texto,/Adicionado/);
  await enviar("0");assert.equal(envios.length,2);
  assert.equal(bot.sessoes.get("a@c.us").etapa,"menu");
  await enviar("menu");assert.equal(envios.length,3);
 }
});

test("WhatsApp: mensagens do mesmo contato mantêm a ordem durante envio da imagem",async()=>{
 const inicio=adiar(),liberar=adiar();
 const s=simular({enviarMidia:async()=>{inicio.resolver();await liberar.promessa;}});
 await s.enviar("oi");
 const primeira=s.enviar("1");
 await inicio.promessa;
 const segunda=s.enviar("2");
 liberar.resolver();
 await Promise.all([primeira,segunda]);
 assert.equal(s.bot.sessoes.get("a@c.us").etapa,"ver");
 assert.equal(s.bot.sessoes.get("a@c.us").tipo,"bebida");
 assert.match(s.respostas[1].texto,/Escolha uma categoria/);
 assert.match(s.respostas[2].texto,/BEBIDAS/);
});

test("WhatsApp: aguarda a resposta anterior do contato sem bloquear outro contato",async()=>{
 const inicio=adiar(),liberar=adiar(),entregas=[];
 const s=simular();
 const primeira=s.enviar("oi","a@c.us",{reply:async()=>{
  inicio.resolver();await liberar.promessa;entregas.push("primeira");
 }});
 await inicio.promessa;
 const segunda=s.enviar("2","a@c.us",{reply:async()=>entregas.push("segunda")});
 await s.enviar("oi","b@c.us");
 const entregasAntesDeLiberar=[...entregas];
 liberar.resolver();
 await Promise.all([primeira,segunda]);
 assert.deepEqual(entregasAntesDeLiberar,[]);
 assert.deepEqual(entregas,["primeira","segunda"]);
 assert.equal(s.respostas[0].from,"b@c.us");
 assert.equal(s.bot.sessoes.get("a@c.us").etapa,"categoriaComprar");
});

test("WhatsApp: falha na resposta não bloqueia mensagens seguintes ou repete pedido",async()=>{
 const s=simular();
 for(const texto of ["oi","2","1","16 G 2","2"])await s.enviar(texto);
 const primeira=s.enviar("1","a@c.us",{reply:async()=>{throw new Error("Sem conexão");}});
 const segunda=s.enviar("3");
 await Promise.all([primeira,segunda]);
 await s.enviar("P001");
 assert.equal(s.bot.pedidos.length,1);
 assert.equal(s.bot.produtos.find(p=>p.id===16).estoque,8);
 assert.match(s.respostas.at(-1).texto,/P001: recebido/);
 assert.equal(s.erros.length,1);
});

test("WhatsApp: filtros não criam sessões nem enviam respostas",async()=>{
 const s=simular();
 for(const extras of [{fromMe:true},{from:"status@broadcast"},{from:"grupo@g.us"},{type:"image"}]){
  await s.enviar("menu","a@c.us",extras);
 }
 assert.equal(s.bot.sessoes.size,0);
 assert.equal(s.envios.length,0);
 assert.equal(s.respostas.length,0);
});

test("WhatsApp: filas concluídas são liberadas sem perder mensagens já enfileiradas",async()=>{
 const s=simular();
 // Inspeção somente no contexto de teste, sem expor estado interno em produção.
 for(let i=0;i<50;i++){
  await Promise.all([s.enviar("oi",`cliente${i}@c.us`),s.enviar("2",`cliente${i}@c.us`)]);
 }
 assert.equal(vm.runInContext("filas.size",s.contexto),0);
 assert.equal([...s.bot.sessoes.values()].filter(s=>s.etapa==="categoriaComprar").length,50);
});

test("WhatsApp: concluir uma tarefa não remove a fila de uma resposta ainda pendente",async()=>{
 const inicio=adiar(),liberar=adiar();
 const s=simular();
 const primeira=s.enviar("oi");
 const segunda=s.enviar("2","a@c.us",{reply:async()=>{
  inicio.resolver();await liberar.promessa;
 }});
 await primeira;
 await inicio.promessa;
 const terceira=s.enviar("1");
 await s.enviar("oi","b@c.us");
 const etapaAntesDeLiberar=s.bot.sessoes.get("a@c.us").etapa;
 liberar.resolver();
 await Promise.all([segunda,terceira]);
 assert.equal(etapaAntesDeLiberar,"categoriaComprar");
 assert.equal(s.bot.sessoes.get("a@c.us").etapa,"produto");
 assert.equal(s.bot.sessoes.get("a@c.us").tipo,"pizza");
 assert.equal(vm.runInContext("filas.size",s.contexto),0);
});

for(const [nome,opcoes] of [
 ["preparação da imagem",{prepararImagem:()=>{throw new Error("Arquivo ilegível");}}],
 ["envio da imagem",{enviarMidia:async()=>{throw new Error("Envio indisponível");}}],
 ["envio do aviso de imagem ausente",{imagemDisponivel:false,enviarMidia:async()=>{throw new Error("Envio indisponível");}}]
]){
 test(`WhatsApp: falha em ${nome} mantém resposta textual e continuidade`,async()=>{
  const s=simular(opcoes);
  await s.enviar("oi");
  await s.enviar("1");
  assert.match(s.respostas.at(-1).texto,/Escolha uma categoria/);
  assert.equal(s.bot.sessoes.get("a@c.us").etapa,"categoriaVer");
  assert.equal(s.erros.length,1);
  await s.enviar("2");
  assert.match(s.respostas.at(-1).texto,/BEBIDAS/);
  assert.equal(s.bot.sessoes.get("a@c.us").etapa,"ver");
 });
}

test("WhatsApp: rejeição sem Error na mídia preserva o texto",async()=>{
 for(const motivo of [undefined,null,"Falha do transporte"]){
  const s=simular({enviarMidia:async()=>{throw motivo;}});
  await s.enviar("menu");
  assert.equal(s.respostas.length,1);
  assert.match(s.respostas[0].texto,/Fazer pedido/);
 }
});

test("WhatsApp: rejeição sem Error na resposta não inutiliza a fila",async()=>{
 for(const motivo of [undefined,null,"Falha do transporte"]){
  const s=simular();
  const primeira=s.enviar("oi","a@c.us",{reply:async()=>{throw motivo;}});
  const segunda=s.enviar("2");
  const resultados=await Promise.allSettled([primeira,segunda]);
  assert.deepEqual(resultados.map(r=>r.status),["fulfilled","fulfilled"]);
  assert.match(s.respostas.at(-1).texto,/Escolha a categoria/);
  assert.equal(s.bot.sessoes.get("a@c.us").etapa,"categoriaComprar");
  assert.equal(vm.runInContext("filas.size",s.contexto),0);
 }
});
