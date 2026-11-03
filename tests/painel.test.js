const test=require("node:test");
const assert=require("node:assert/strict");
const {simularPainel}=require("../test-support/painel.cjs");
const {adiar}=require("../test-support/whatsapp.cjs");
test("painel agrupa atualizações concorrentes e mantém linhas quando dados não mudam",async()=>{
 const p=simularPainel();await p.pronto();
 p.metricas.consultas=0;p.metricas.elementos=0;
 await Promise.all(Array.from({length:20},()=>p.executar("atualizar()")));
 assert.ok(p.metricas.consultas<=4,`Consultas: ${p.metricas.consultas}`);
 assert.equal(p.metricas.elementos,0);
 assert.match(p.nos.get("#estoque").children[0].textContent,/estoque fictício: 10/);
});
test("painel atualiza estoque e pedidos modificados",async()=>{
 const p=simularPainel();await p.pronto();
 p.dados.produtos[0].estoque=8;
 p.dados.pedidos.push({codigo:"P001",itens:[{nome:"Água",quantidade:2}],total:1000,status:"recebido"});
 await p.executar("atualizar()");
 assert.match(p.nos.get("#estoque").children[0].textContent,/estoque fictício: 8/);
 assert.match(p.nos.get("#pedidos").children[0].textContent,/P001/);
});
test("painel recupera a lista após falha mesmo que os dados sejam os mesmos",async()=>{
 let falhar=false;
 const p=simularPainel({fetchExtra:async()=>{if(falhar)throw new Error("Offline");}});
 await p.pronto();falhar=true;await p.executar("atualizar()");
 assert.equal(p.nos.get("#pedidos").textContent,"Servidor indisponível.");
 falhar=false;await p.executar("atualizar()");
 assert.equal(p.nos.get("#pedidos").textContent,"Nenhum pedido registrado.");
});
test("atualização pedida durante consulta em curso também busca os dados mais recentes",async()=>{
 const entrou=adiar(),liberar=adiar();let segurar=false;
 const p=simularPainel({fetchExtra:async url=>{
  if(url==="/api/cardapio"&&segurar){
   segurar=false;const produtos=structuredClone(p.dados.produtos);
   entrou.resolver();await liberar.promessa;
   return {ok:true,json:async()=>({produtos})};
  }
 }});
 await p.pronto();segurar=true;
 const primeira=p.executar("atualizar()");await entrou.promessa;
 p.dados.produtos[0].estoque=7;
 const segunda=p.executar("atualizar()");liberar.resolver();
 await Promise.all([primeira,segunda]);
 assert.match(p.nos.get("#estoque").children[0].textContent,/estoque fictício: 7/);
});
test("falha HTTP no reinício mantém o histórico e informa o erro",async()=>{
 const p=simularPainel({fetchExtra:async url=>url==="/api/reiniciar"?{ok:false}:null});
 await p.pronto();const antes=p.nos.get("#chat").children[0];
 await p.nos.get("#reset").handlers.click();
 assert.equal(p.nos.get("#chat").children[0],antes);
 assert.match(p.nos.get("#chat").children.at(-1).textContent,/Não foi possível reiniciar/);
});
test("POST concluído na finalização de uma consulta não perde a atualização do painel",async()=>{
 for(let turnos=0;turnos<12;turnos++){
  const iniciouPost=adiar(),post=adiar();let capturar=false;
  const p=simularPainel({fetchExtra:async url=>{
   if(url==="/api/mensagem")return {ok:true,json:()=>{iniciouPost.resolver();return post.promessa;}};
   if(url==="/api/cardapio"&&capturar){
    capturar=false;const produtos=structuredClone(p.dados.produtos);
    return {ok:true,json:async()=>{
     (async()=>{
      for(let i=0;i<turnos;i++)await Promise.resolve();
      p.dados.produtos[0].estoque=8;post.resolver({resposta:"Atualizado"});
     })();
     return {produtos};
    }};
   }
  }});
  await p.pronto();
  const mensagem=p.executar("mensagem('2')");await iniciouPost.promessa;
  capturar=true;await p.executar("atualizar()");await mensagem;
  assert.match(p.nos.get("#estoque").children[0].textContent,/estoque fictício: 8/,`Agendamento ${turnos}`);
 }
});
