const test=require("node:test");
const assert=require("node:assert/strict");
const {Bot}=require("../src/bot");
function verCatalogo(b,tipo="1",cliente="a"){
 for(const texto of ["oi","1"])b.falar(cliente,texto);
 return b.falar(cliente,tipo);
}
test("ver cardápio permite avançar com 0 na mesma categoria",()=>{
 for(const [categoria,pedido,tamanho] of [["1","16 G 2","GRANDE"],["2","1001 2",null]]){
  const b=new Bot();
  assert.match(verCatalogo(b,categoria),/0 - Fazer pedido nesta categoria/);
  assert.match(b.falar("a","0"),/Escolha seu produto/);
  assert.equal(b.sessoes.get("a").etapa,"produto");
  assert.match(b.falar("a",pedido),/Adicionado: 2x/);
  assert.equal(b.sessoes.get("a").itens[0].tamanho,tamanho);
 }
});
test("pedido direto no catálogo chega à confirmação e consulta",()=>{
 const b=new Bot();verCatalogo(b);
 for(const texto of ["16 G 2","1","2","1001 1","2","1"])b.falar("a",texto);
 assert.equal(b.pedidos[0].total,13280);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,8);
 b.falar("a","3");assert.match(b.falar("a","P001"),/recebido/);
 b.falar("b","oi");b.falar("b","3");
 assert.match(b.falar("b","P001"),/não encontrado/);
});
test("catálogo aceita código sozinho, tamanho parcial e bebida direta",()=>{
 for(const [categoria,entrada,restante,tamanho] of [
  ["1","16",["Média","2"],"MÉDIA"],
  ["1","16 F",["2"],"FAMÍLIA"],
  ["2","1001",["2"],null],
  ["2","1001 2",[],null]
 ]){
  const b=new Bot();verCatalogo(b,categoria);b.falar("a",entrada);
  for(const texto of restante)b.falar("a",texto);
  assert.equal(b.sessoes.get("a").itens[0].quantidade,2);
  assert.equal(b.sessoes.get("a").itens[0].tamanho,tamanho);
 }
});
test("catálogo valida tamanho, código, categoria, formato, quantidade e estoque",()=>{
 const b=new Bot();verCatalogo(b);
 for(const [entrada,erro] of [
  ["34 medoi 3",/Você quis dizer MÉDIA/],
  ["16 X 2",/Tamanho inválido/],
  ["999 G 2",/Código inválido/],
  ["1001 2",/Código inválido/],
  ["16 G 2 extra",/Formato inválido/],
  ["16 G 0",/Quantidade inválida/],
  ["16 G 11",/Quantidade inválida/],
  ["16 G 1.5",/Quantidade inválida/]
 ]){
  assert.match(b.falar("a",entrada),erro);
  assert.equal(b.sessoes.get("a").itens.length,0);
  assert.equal(b.sessoes.get("a").etapa,"ver");
 }
 b.produtos.find(p=>p.id===16).estoque=1;
 assert.match(b.falar("a","16 G 2"),/Estoque simulado insuficiente/);
 assert.match(b.falar("a","16 grande 1"),/Adicionado/);
 b.falar("a","2");assert.match(b.falar("a","2"),/cancelado/);
 assert.equal(b.pedidos.length,0);
});
test("menu e reiniciar ainda reiniciam; 0 reinicia fora do catálogo",()=>{
 for(const comando of ["menu","reiniciar"]){
  const b=new Bot();verCatalogo(b);
  assert.equal(b.falar("a",comando),b.menu());
  assert.equal(b.sessoes.get("a").etapa,"menu");
 }
 const b=new Bot();verCatalogo(b);b.falar("a","16 G 1");
 assert.equal(b.falar("a","0"),b.menu());
 assert.equal(b.sessoes.get("a").itens.length,0);
 assert.equal(b.falar("novo","0"),b.menu());
});
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
