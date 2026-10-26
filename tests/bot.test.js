const test=require("node:test");
const assert=require("node:assert/strict");
const {Bot}=require("../src/bot");
test("catálogo completo sem paginação",()=>{
 const b=new Bot();b.falar("a","oi");b.falar("a","2");
 const resposta=b.falar("a","1");
 assert.match(resposta,/1 - Alho/);assert.match(resposta,/16 - Calabresa/);assert.match(resposta,/120 - Churros/);
 assert.doesNotMatch(resposta,/próxima|página/i);
});
test("pedido 16 G 2 + bebida em mensagem compacta",()=>{
 const b=new Bot();let ultima="";
 for(const t of ["oi","2","1","16 G 2","1","2","1001 1","2","1"])ultima=b.falar("a",t);
 assert.match(ultima,/P001/);assert.equal(b.pedidos[0].total,13280);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,8);
});
test("tamanho separado permanece disponível",()=>{
 const b=new Bot();for(const t of ["oi","2","1","16","3","2","2","1"])b.falar("a",t);
 assert.equal(b.pedidos[0].total,11580);
});
test("quantidade acima do estoque é recusada",()=>{
 const b=new Bot();for(const t of ["oi","2","1"])b.falar("a",t);
 assert.match(b.falar("a","16 G 11"),/Quantidade inválida/);
 assert.equal(b.pedidos.length,0);
});
test("cancelamento não gera pedido",()=>{
 const b=new Bot();for(const t of ["oi","2","1","16 G 1","2"])b.falar("a",t);
 assert.match(b.falar("a","2"),/cancelado/);assert.equal(b.pedidos.length,0);
});

test("tamanhos por extenso e acentos",()=>{
 const b=new Bot();for(const t of ["oi","2","1"])b.falar("a",t);
 assert.match(b.falar("a","16 grande 2"),/2x Calabresa GRANDE/);
});
test("erro pequeno sugere correção sem colocar pedido no carrinho",()=>{
 const b=new Bot();for(const t of ["oi","2","1"])b.falar("a",t);
 const resposta=b.falar("a","16 grnade 2");
 assert.match(resposta,/Você quis dizer GRANDE/);
 assert.equal(b.sessoes.get("a").itens.length,0);
 assert.match(b.falar("a","16 grande 2"),/Adicionado/);
});
test("tamanho isolado aceita nome completo e sugere correção",()=>{
 const b=new Bot();for(const t of ["oi","2","1","16"])b.falar("a",t);
 assert.match(b.falar("a","grnade"),/Você quis dizer GRANDE/);
 assert.equal(b.sessoes.get("a").etapa,"tamanho");
 assert.match(b.falar("a","Grande"),/Quantas unidades/);
});
