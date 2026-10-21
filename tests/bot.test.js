const test=require("node:test");const assert=require("node:assert/strict");const {Bot}=require("../src/bot");
test("menu e cardápio",()=>{const b=new Bot();assert.match(b.falar("a","oi"),/Pizzaria/);assert.match(b.falar("a","1"),/Calabresa/)});
test("pedido fictício desconta estoque",()=>{const b=new Bot();b.falar("a","oi");b.falar("a","2");b.falar("a","1");b.falar("a","2");b.falar("a","2");assert.match(b.falar("a","1"),/P001/);assert.equal(b.pedidos[0].total,9000);assert.equal(b.produtos[0].estoque,6)});
test("cancelamento não gera pedido",()=>{const b=new Bot();b.falar("a","oi");b.falar("a","2");b.falar("a","1");b.falar("a","1");b.falar("a","2");b.falar("a","2");assert.match(b.falar("a","2"),/cancelado/);assert.equal(b.pedidos.length,0)});
