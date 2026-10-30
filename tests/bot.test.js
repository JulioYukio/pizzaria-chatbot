const test=require("node:test");const assert=require("node:assert/strict");const {Bot}=require("../src/bot");
function abrir(b){b.falar("a","oi");b.falar("a","2");return b.falar("a","1");}
test("PDF: 79 pizzas, 17 bebidas, Calabresa grande 67 reais",()=>{const b=new Bot();assert.equal(b.produtos.filter(p=>p.tipo==="pizza").length,79);assert.equal(b.produtos.filter(p=>p.tipo==="bebida").length,17);assert.equal(b.produtos.find(p=>p.id===16).precosCentavos.GRANDE,6700);});
test("código 109 solicita escolha e preserva tamanho e quantidade",()=>{for(const [escolha,nome] of [["1","M&M"],["2","Churros"]]){const b=new Bot();abrir(b);assert.match(b.falar("a","109 G 2"),/Qual sabor/);assert.equal(b.sessoes.get("a").itens.length,0);assert.match(b.falar("a",escolha),/Adicionado/);assert.match(b.sessoes.get("a").itens[0].nome,new RegExp(nome));assert.equal(b.sessoes.get("a").itens[0].quantidade,2);assert.equal(b.sessoes.get("a").itens[0].tamanho,"GRANDE");}});
test("M&M's 109M e Churros 120",()=>{for(const [codigo,nome] of [["109M","M&M"],["120","Churros"]]){const b=new Bot();abrir(b);assert.match(b.falar("a",codigo+" G 1"),new RegExp(nome==="M&M"?"M&M":"Churros"));}});
test("pedido direto e preço atualizado",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","16 grande 2"),/134,00/);b.falar("a","2");assert.match(b.falar("a","1"),/P001/);assert.equal(b.pedidos[0].total,13400);});
test("erro no tamanho pede confirmação",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","34 medoi 3"),/MÉDIA/);assert.equal(b.sessoes.get("a").itens.length,0);});

test("código 109 sem tamanho continua perguntando tamanho",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","109"),/Qual sabor/);assert.match(b.falar("a","2"),/Ingredientes/);assert.equal(b.sessoes.get("a").etapa,"tamanho");});
test("escolha inválida mantém seleção de sabores",()=>{const b=new Bot();abrir(b);b.falar("a","109 M 3");assert.match(b.falar("a","invalido"),/Escolha um sabor/);assert.equal(b.sessoes.get("a").etapa,"escolher109");assert.match(b.falar("a","Churros"),/Adicionado/);});
test("mensagens personalizadas",()=>{const b=new Bot();assert.match(b.menu(),/A Fornalha Pizzaria — PROTÓTIPO/);b.falar("a","oi");b.falar("a","2");assert.match(b.falar("a","1"),/duas pizzas de calabresa grande/);});

test("opção 1 mostra apenas instruções do PDF, sem pedido nem quantidade",()=>{
 const b=new Bot();b.falar("a","oi");const msg=b.falar("a","1");
 assert.equal(msg,"Tamanhos: B/Broto, M/Média, G/Grande, F/Família.\\nExemplo: 31 G (Jardineira grande)\\nDigite 'menu' para voltar.".replaceAll("\\n","\n"));
 assert.equal(b.sessoes.get("a").etapa,"ver");
 for(const entrada of ["31 G","31 G 2","0"]){assert.equal(b.falar("a",entrada),b.textoCardapio());assert.equal(b.sessoes.get("a").itens.length,0);}
 assert.equal(b.falar("a","menu"),b.menu());
});
