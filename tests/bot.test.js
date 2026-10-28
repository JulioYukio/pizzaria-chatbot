const test=require("node:test");const assert=require("node:assert/strict");const {Bot}=require("../src/bot");
function abrir(b){b.falar("a","oi");b.falar("a","1");return b.falar("a","1");}
test("PDF: 79 pizzas, 17 bebidas, Calabresa grande 67 reais",()=>{const b=new Bot();assert.equal(b.produtos.filter(p=>p.tipo==="pizza").length,79);assert.equal(b.produtos.filter(p=>p.tipo==="bebida").length,17);assert.equal(b.produtos.find(p=>p.id===16).precosCentavos.GRANDE,6700);});
test("código 109 duplicado exige esclarecimento",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","109 G 1"),/duplicado/);assert.equal(b.sessoes.get("a").itens.length,0);assert.match(b.falar("a","109C G 1"),/Churros/);});
test("M&M's 109M e Churros 120",()=>{for(const [codigo,nome] of [["109M","M&M"],["120","Churros"]]){const b=new Bot();abrir(b);assert.match(b.falar("a",codigo+" G 1"),new RegExp(nome==="M&M"?"M&M":"Churros"));}});
test("pedido direto e preço atualizado",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","16 grande 2"),/134,00/);b.falar("a","2");assert.match(b.falar("a","1"),/P001/);assert.equal(b.pedidos[0].total,13400);});
test("erro no tamanho pede confirmação",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","34 medoi 3"),/MÉDIA/);assert.equal(b.sessoes.get("a").itens.length,0);});
