const test=require("node:test");const assert=require("node:assert/strict");const {Bot}=require("../src/bot");
test("pedido completo atualizado, código interno e cancelamento",()=>{
 const b=new Bot();
 for(const t of ["oi","2","1","16 G 2","1","2","1001 1","2","1"])b.falar("a",t);
 assert.equal(b.pedidos[0].total,15100);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,8);
 assert.equal(b.pedidos[0].codigo,"P001");
 assert.equal(b.pedidos[0].status,"recebido");
 b.falar("b","oi");assert.match(b.falar("b","3"),/carrinho está vazio/);
 for(const t of ["menu","2","1","16 G 1","2","3"])b.falar("a",t);
 assert.equal(b.pedidos.length,1);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,8);
});
function abrir(b){b.falar("a","oi");b.falar("a","2");return b.falar("a","1");}
test("PDF: 79 pizzas, 17 bebidas, Calabresa grande 67 reais",()=>{const b=new Bot();assert.equal(b.produtos.filter(p=>p.tipo==="pizza").length,79);assert.equal(b.produtos.filter(p=>p.tipo==="bebida").length,17);assert.equal(b.produtos.find(p=>p.id===16).precosCentavos.GRANDE,6700);});
test("código 109 solicita escolha e preserva tamanho e quantidade",()=>{for(const [escolha,nome] of [["1","M&M"],["2","Churros"]]){const b=new Bot();abrir(b);assert.match(b.falar("a","109 G 2"),/Qual sabor/);assert.equal(b.sessoes.get("a").itens.length,0);assert.match(b.falar("a",escolha),/Adicionado/);assert.match(b.sessoes.get("a").itens[0].nome,new RegExp(nome));assert.equal(b.sessoes.get("a").itens[0].quantidade,2);assert.equal(b.sessoes.get("a").itens[0].tamanho,"GRANDE");}});
test("M&M's 109M e Churros 120",()=>{for(const [codigo,nome] of [["109M","M&M"],["120","Churros"]]){const b=new Bot();abrir(b);assert.match(b.falar("a",codigo+" G 1"),new RegExp(nome==="M&M"?"M&M":"Churros"));}});
test("pedido direto e preço atualizado",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","16 grande 2"),/134,00/);b.falar("a","2");assert.match(b.falar("a","1"),/Pedido demonstrativo confirmado/);assert.equal(b.pedidos[0].total,13400);});
test("erro no tamanho pede confirmação",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","34 medoi 3"),/MÉDIA/);assert.equal(b.sessoes.get("a").itens.length,0);});

test("código 109 sem tamanho continua perguntando tamanho",()=>{const b=new Bot();abrir(b);assert.match(b.falar("a","109"),/Qual sabor/);assert.match(b.falar("a","2"),/Ingredientes/);assert.equal(b.sessoes.get("a").etapa,"tamanho");});
test("escolha inválida mantém seleção de sabores",()=>{const b=new Bot();abrir(b);b.falar("a","109 M 3");assert.match(b.falar("a","invalido"),/Escolha um sabor/);assert.equal(b.sessoes.get("a").etapa,"escolher109");assert.match(b.falar("a","Churros"),/Adicionado/);});
test("mensagens personalizadas",()=>{const b=new Bot();assert.match(b.menu(),/A Fornalha Pizzaria — PROTÓTIPO/);b.falar("a","oi");b.falar("a","2");assert.match(b.falar("a","1"),/Para fazer seu pedido/);});

test("opção 1 permite pedido imediato após o PDF",()=>{
 const b=new Bot();b.falar("a","oi");const texto=b.falar("a","1");
 assert.match(texto,/Para fazer seu pedido, informe o código da pizza e o tamanho/);
 assert.match(texto,/31 G \(Jardineira grande\)/);
 assert.equal(b.sessoes.get("a").etapa,"produto");
 assert.match(b.falar("a","31 G"),/Quantas unidades/);
 assert.equal(b.sessoes.get("a").etapa,"quantidade");
 assert.equal(b.sessoes.get("a").itens.length,0);
 assert.match(b.falar("a","2"),/Adicionado: 2x Jardineira GRANDE/);
 assert.equal(b.sessoes.get("a").itens.length,1);
 assert.equal(b.falar("a","menu"),b.menu());
});
test("opção 1 preserva escolha do sabor duplicado e voltar",()=>{
 const b=new Bot();b.falar("a","oi");b.falar("a","1");
 assert.match(b.falar("a","999 G"),/Código inválido/);
 assert.match(b.falar("a","109 G"),/Qual sabor/);
 assert.match(b.falar("a","2"),/Quantas unidades/);
 assert.match(b.falar("a","1"),/Adicionado: 1x Churros GRANDE/);
 assert.equal(b.falar("a","menu"),b.menu());
});

test("confirmação agrega tamanhos do mesmo produto e revalida estoque concorrente",()=>{
 const b=new Bot();
 for(const t of ["oi","2","1","16 G 3","1","1","16 M 2","2"])b.falar("a",t);
 assert.equal(b.sessoes.get("a").etapa,"confirmar");
 // Outro cliente usa parte do saldo antes da confirmação do primeiro.
 for(const t of ["oi","2","1","16 G 6","2","1"])b.falar("b",t);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,4);
 assert.match(b.falar("a","1"),/Estoque mudou/);
 assert.equal(b.pedidos.length,1);
 assert.equal(b.produtos.find(p=>p.id===16).estoque,4);
});
test("catálogo mantém moeda e preços enquanto erros longos não alteram o carrinho",()=>{
 const b=new Bot();
 assert.match(b.listar("bebida"),/R\$\s*17,00|R\$\s*\d+,\d{2}/);
 for(const t of ["oi","2","1"])b.falar("a",t);
 assert.match(b.falar("a","16 "+"x".repeat(1000)+" 2"),/Tamanho inválido/);
 assert.equal(b.sessoes.get("a").itens.length,0);
});

test("ao escolher Pizzas em Fazer pedido, mostra orientações do PDF sem lista de sabores",()=>{
 const b=new Bot();
 b.falar("a","oi");b.falar("a","2");
 const texto=b.falar("a","1");
 assert.equal(texto,b.textoCardapio());
 assert.doesNotMatch(texto,/CATÁLOGO COMPLETO|1 - Alho|79 pizzas/);
 assert.equal(b.sessoes.get("a").etapa,"produto");
 assert.match(b.falar("a","55 G"),/Criativa GRANDE/);
 assert.match(b.falar("a","2"),/Adicionado: 2x Criativa GRANDE/);
 // O carrinho não é perdido ao adicionar outra pizza.
 b.falar("a","1");
 assert.equal(b.falar("a","1"),b.textoCardapio());
 assert.match(b.falar("a","31 G 1"),/Adicionado: 1x Jardineira GRANDE/);
 assert.equal(b.sessoes.get("a").itens.length,2);
});
test("bebidas permanecem listadas em texto após Fazer pedido",()=>{
 const b=new Bot();b.falar("a","oi");b.falar("a","2");
 const msg=b.falar("a","2");
 assert.match(msg,/BEBIDAS/);
 assert.match(msg,/1002 - Coca-Cola Zero 2L/);
 assert.match(b.falar("a","1002 4"),/Adicionado: 4x Coca-Cola Zero 2L/);
});

test("resumo: opção 2 adiciona produtos sem limpar carrinho, e opção 3 cancela",()=>{
 const b=new Bot();
 for(const t of ["oi","1","45 F","3","2"])b.falar("a",t);
 let resumo=b.falar("a","2");
 assert.match(resumo,/1 - Confirmar pedido FICTÍCIO/);
 assert.match(resumo,/2 - Adicionar outro produto/);
 assert.match(resumo,/3 - Cancelar/);
 assert.equal(b.sessoes.get("a").etapa,"categoriaComprar");
 assert.equal(b.sessoes.get("a").itens.length,1);
 assert.equal(b.sessoes.get("a").itens[0].quantidade,3);
 assert.match(b.falar("a","2"),/BEBIDAS/);
 assert.match(b.falar("a","1002 4"),/Adicionado: 4x Coca-Cola Zero 2L/);
 resumo=b.falar("a","2");
 assert.match(resumo,/3x Pizzaiolo FAMÍLIA/);
 assert.match(resumo,/4x Coca-Cola Zero 2L/);
 assert.match(resumo,/R\$\s*305,00/);
 assert.match(b.falar("a","abc"),/Digite 1 para confirmar, 2 para adicionar outro produto ou 3 para cancelar/);
 assert.equal(b.sessoes.get("a").itens.length,2);
 assert.match(b.falar("a","3"),/Pedido cancelado/);
 assert.equal(b.sessoes.get("a").itens.length,0);
 assert.equal(b.pedidos.length,0);
});
test("resumo: opção 2 permite outra pizza e confirmação mantém tudo",()=>{
 const b=new Bot();
 for(const t of ["oi","1","45 F 3","2","2","1","31 G 1","2","1"])b.falar("a",t);
 assert.equal(b.pedidos.length,1);
 assert.equal(b.pedidos[0].itens.length,2);
 assert.equal(b.pedidos[0].itens[0].nome,"Pizzaiolo");
 assert.equal(b.pedidos[0].itens[1].nome,"Jardineira");
});

test("menu preserva carrinho e opção 3 recupera resumo",()=>{
 const b=new Bot();for(const t of ["oi","1","59 F 2","menu"])b.falar("a",t);
 assert.equal(b.sessoes.get("a").itens.length,1);
 assert.match(b.falar("a","3"),/2x Rúcula FAMÍLIA/);
 assert.match(b.falar("a","2"),/Escolha a categoria/);
 assert.match(b.falar("a","9"),/2x Rúcula FAMÍLIA/);
 assert.match(b.falar("a","1"),/Pedido demonstrativo confirmado/);
});
test("opção 9 cancela adição em pizzas e bebidas e mantém pedido",()=>{
 const b=new Bot();for(const t of ["oi","1","45 F 3","1"])b.falar("a",t);
 assert.match(b.falar("a","9"),/3x Pizzaiolo FAMÍLIA/);
 b.falar("a","2");
 assert.match(b.falar("a","1"),/9 - Cancelar adição/);
 assert.match(b.falar("a","9"),/3x Pizzaiolo FAMÍLIA/);
 b.falar("a","2");
 assert.match(b.falar("a","2"),/BEBIDAS/);
 assert.match(b.falar("a","9"),/3x Pizzaiolo FAMÍLIA/);
 assert.equal(b.sessoes.get("a").itens.length,1);
});
test("reiniciar elimina carrinho, menu não",()=>{
 const b=new Bot();for(const t of ["oi","1","59 F 2","menu"])b.falar("a",t);
 assert.equal(b.sessoes.get("a").itens.length,1);
 b.falar("a","reiniciar");
 assert.equal(b.sessoes.get("a").itens.length,0);
});

test("não oferece consulta nem divulga o identificador interno ao cliente",()=>{
 const b=new Bot();
 assert.doesNotMatch(b.menu(),/Consultar pedido|4 - Ver pedido atual/);
 assert.match(b.menu(),/3 - Ver pedido atual/);
 b.falar("a","oi");assert.match(b.falar("a","3"),/carrinho está vazio/);
 b.falar("a","1");b.falar("a","16 G 1");b.falar("a","2");
 const confirmacao=b.falar("a","1");
 assert.match(confirmacao,/Pedido demonstrativo confirmado/);
 assert.doesNotMatch(confirmacao,/P\d{3}|código|identificador/i);
 assert.equal(b.pedidos[0].codigo,"P001");
 b.falar("a","menu");assert.match(b.falar("a","3"),/carrinho está vazio/);
});
test("código aleatório não permite consultar pedido",()=>{
 const b=new Bot();b.falar("a","oi");
 assert.match(b.falar("a","P001"),/Opção inválida/);
 assert.equal(b.sessoes.get("a").etapa,"menu");
});

test("pizzas exibem opção 9 uma única vez e permitem voltar sem perder carrinho",()=>{
 const b=new Bot();
 for(const t of ["oi","1","43 F 2","1","1"])b.falar("a",t);
 const msg=b.textoCardapio(b.sessoes.get("a"));
 assert.equal(msg.split("9 - Cancelar adição e finalizar pedido").length-1,1);
 assert.match(msg,/88 - Voltar à escolha de categoria/);
 assert.match(b.falar("a","88"),/Escolha a categoria/);
 assert.equal(b.sessoes.get("a").itens[0].quantidade,2);
 assert.match(b.falar("a","9"),/2x Pepperoni FAMÍLIA/);
});
test("bebidas permitem voltar para escolha de categoria e finalizar sem nova adição",()=>{
 const b=new Bot();
 for(const t of ["oi","1","43 F 2","1","2"])b.falar("a",t);
 const lista=b.listar("bebida",b.sessoes.get("a"));
 assert.match(lista,/88 - Voltar à escolha de categoria/);
 assert.match(lista,/9 - Cancelar adição e finalizar pedido/);
 assert.match(b.falar("a","88"),/1 - Pizzas/);
 assert.match(b.falar("a","2"),/BEBIDAS/);
 assert.match(b.falar("a","9"),/2x Pepperoni FAMÍLIA/);
 assert.equal(b.sessoes.get("a").itens.length,1);
});

test("código 8 da pizza Baiacatu continua disponível e 88 volta",()=>{
 const b=new Bot();b.falar("a","oi");b.falar("a","2");b.falar("a","1");
 assert.match(b.falar("a","8"),/Baiacatu/);
 assert.match(b.falar("a","88"),/Escolha a categoria/);
});
