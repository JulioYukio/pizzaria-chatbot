const catalogo = require("./cardapio.json");
class Bot {
 constructor(){this.produtos=structuredClone(catalogo);this.sessoes=new Map();this.pedidos=[];this.sequencia=1}
 falar(cliente,texto){
  texto=String(texto||"").trim();
  if(!texto)return "Digite uma mensagem.";
  if(!this.sessoes.has(cliente)||/^(menu|reiniciar|0)$/i.test(texto)){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return this.menu()}
  const s=this.sessoes.get(cliente),n=Number(texto);
  if(s.etapa==="menu"){
   if(texto==="1")return this.cardapio()+"\n\nDigite 2 para pedir ou menu para voltar.";
   if(texto==="2"){s.etapa="produto";return this.cardapio()+"\n\nQual o número do produto?"}
   if(texto==="3"){s.etapa="consulta";return "Informe o código do pedido (ex.: P001):"}
   return "Opção inválida.\n"+this.menu();
  }
  if(s.etapa==="produto"){
   const p=this.produtos.find(p=>p.id===n);
   if(!p)return "Produto inválido.\n"+this.cardapio();
   if(p.estoque<=0)return "Esse produto está esgotado. Escolha outro.";
   s.produto=p.id;s.etapa="quantidade";return "Quantas unidades de "+p.nome+"? (1 a 10)";
  }
  if(s.etapa==="quantidade"){
   if(!Number.isInteger(n)||n<1||n>10)return "Escolha uma quantidade entre 1 e 10.";
   const p=this.produtos.find(p=>p.id===s.produto),atual=s.itens.find(i=>i.id===p.id);
   if(n+(atual?.quantidade||0)>p.estoque)return "Estoque insuficiente. Disponível: "+(p.estoque-(atual?.quantidade||0));
   if(atual)atual.quantidade+=n;else s.itens.push({id:p.id,nome:p.nome,preco:p.preco,quantidade:n});
   s.etapa="mais";return "Adicionado! Parcial: "+this.dinheiro(this.total(s))+"\n1 - Adicionar outro item\n2 - Finalizar";
  }
  if(s.etapa==="mais"){
   if(texto==="1"){s.etapa="produto";return this.cardapio()+"\n\nQual o próximo produto?"}
   if(texto==="2"){s.etapa="confirmar";return "Resumo:\n"+s.itens.map(i=>i.quantidade+"x "+i.nome).join("\n")+"\nTotal: "+this.dinheiro(this.total(s))+"\n1 - Confirmar pedido FICTÍCIO\n2 - Cancelar"}
   return "Digite 1 ou 2.";
  }
  if(s.etapa==="confirmar"){
   if(texto==="2"){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Pedido cancelado. Digite menu."}
   if(texto!=="1")return "Digite 1 para confirmar ou 2 para cancelar.";
   if(!s.itens.every(i=>this.produtos.find(p=>p.id===i.id).estoque>=i.quantidade)){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Estoque alterado. Pedido não registrado. Digite menu."}
   const pedido={codigo:"P"+String(this.sequencia++).padStart(3,"0"),cliente,itens:structuredClone(s.itens),total:this.total(s),status:"recebido",demonstracao:true};
   for(const i of s.itens)this.produtos.find(p=>p.id===i.id).estoque-=i.quantidade;
   this.pedidos.unshift(pedido);this.sessoes.set(cliente,{etapa:"menu",itens:[]});
   return "Pedido DEMONSTRATIVO "+pedido.codigo+" registrado! Total: "+this.dinheiro(pedido.total)+"\nNenhuma compra real foi realizada. Digite menu.";
  }
  if(s.etapa==="consulta"){
   this.sessoes.set(cliente,{etapa:"menu",itens:[]});
   const p=this.pedidos.find(p=>p.codigo.toLowerCase()===texto.toLowerCase()&&p.cliente===cliente);
   return p?"Pedido "+p.codigo+": "+p.status+". Digite menu.":"Pedido não encontrado para esta conversa. Digite menu.";
  }
  return this.menu();
 }
 menu(){return "🍕 Pizzaria — PROTÓTIPO (sem vendas reais)\n1 - Ver cardápio\n2 - Fazer pedido\n3 - Consultar pedido\nDigite menu para reiniciar."}
 dinheiro(v){return (v/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
 cardapio(){return "Cardápio fictício:\n"+this.produtos.map(p=>p.id+" - "+p.nome+" — "+this.dinheiro(p.preco)+" ("+p.estoque+" em estoque)").join("\n")}
 total(s){return s.itens.reduce((s,i)=>s+i.preco*i.quantidade,0)}
}
module.exports={Bot};
