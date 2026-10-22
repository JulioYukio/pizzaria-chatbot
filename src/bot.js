"use strict";
const original=require('./cardapio.json');
const tamanhos=['BROTO','MÉDIA','GRANDE','FAMÍLIA'];
const dinheiro=v=>(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
class Bot {
 constructor(){this.reiniciar();}
 reiniciar(){this.produtos=[...structuredClone(original.pizzas),...structuredClone(original.bebidas)].map(p=>({...p,estoque:10}));this.pedidos=[];this.sessoes=new Map();this.sequencia=1;}
 menu(){return '🍕 Pizzaria — PROTÓTIPO, SEM VENDAS REAIS\n1 - Ver cardápio\n2 - Fazer pedido\n3 - Consultar pedido\nDigite menu para voltar.';}
 listar(tipo,pagina){const itens=this.produtos.filter(p=>p.tipo===tipo);const max=Math.ceil(itens.length/10);return '📋 '+(tipo==='pizza'?'Pizzas':'Bebidas')+' — página '+pagina+'/'+max+'\n'+itens.slice((pagina-1)*10,pagina*10).map(p=>p.id+' - '+p.nome+(p.tipo==='pizza'?' ('+p.ingredientes+')':' — '+dinheiro(p.precoCentavos))).join('\n')+'\n\nDigite o número do produto, próxima, anterior ou menu.';}
 total(s){return s.itens.reduce((a,i)=>a+i.preco*i.quantidade,0);}
 falar(cliente,entrada){
  const t=String(entrada??'').trim(),n=Number(t);
  if(!t)return 'Digite uma mensagem.';
  if(!this.sessoes.has(cliente)||/^(menu|reiniciar|0)$/i.test(t)){this.sessoes.set(cliente,{etapa:'menu',itens:[],pagina:1});return this.menu();}
  const s=this.sessoes.get(cliente);
  if(s.etapa==='menu'){
   if(t==='1'||t==='2'){s.etapa=t==='1'?'categoriaVer':'categoriaComprar';return 'Escolha uma categoria:\n1 - Pizzas\n2 - Bebidas';}
   if(t==='3'){s.etapa='consulta';return 'Informe o código do pedido (P001):';}
   return 'Opção inválida.\n'+this.menu();
  }
  if(s.etapa==='categoriaVer'||s.etapa==='categoriaComprar'){
   if(t!=='1'&&t!=='2')return 'Digite 1 para pizzas ou 2 para bebidas.';
   const ver=s.etapa==='categoriaVer';s.tipo=t==='1'?'pizza':'bebida';s.pagina=1;s.etapa=ver?'ver':'produto';return this.listar(s.tipo,1)+(ver?'\nPara pedir, digite menu e depois 2.':'');
  }
  if(s.etapa==='produto'||s.etapa==='ver'){
   if(/^(próxima|proxima|anterior)$/i.test(t)){const max=Math.ceil(this.produtos.filter(p=>p.tipo===s.tipo).length/10);s.pagina=Math.max(1,Math.min(max,s.pagina+(/anterior/i.test(t)?-1:1)));return this.listar(s.tipo,s.pagina);}
   if(s.etapa==='ver')return 'Para fazer um pedido, digite menu e depois 2.\n'+this.listar(s.tipo,s.pagina);
   const p=this.produtos.find(p=>p.id===n&&p.tipo===s.tipo);
   if(!p||!Number.isInteger(n))return 'Código inválido.\n'+this.listar(s.tipo,s.pagina);
   if(p.estoque<1)return 'Indisponível no estoque simulado. Escolha outro.';
   s.produtoId=p.id;
   if(p.tipo==='pizza'){s.etapa='tamanho';return '🍕 '+p.nome+'\nIngredientes: '+p.ingredientes+'\n'+tamanhos.map((v,i)=>(i+1)+' - '+v+': '+dinheiro(p.precosCentavos[v])).join('\n')+'\nEscolha um tamanho (1-4).';}
   s.tamanho=null;s.preco=p.precoCentavos;s.etapa='quantidade';return 'Quantas unidades de '+p.nome+'? (1-10)';
  }
  if(s.etapa==='tamanho'){
   if(!Number.isInteger(n)||n<1||n>4)return 'Tamanho inválido. Escolha 1, 2, 3 ou 4.';
   const p=this.produtos.find(p=>p.id===s.produtoId);s.tamanho=tamanhos[n-1];s.preco=p.precosCentavos[s.tamanho];s.etapa='quantidade';
   return p.nome+' '+s.tamanho+' — '+dinheiro(s.preco)+'\nQuantas unidades? (1-10)';
  }
  if(s.etapa==='quantidade'){
   if(!Number.isInteger(n)||n<1||n>10)return 'Digite uma quantidade entre 1 e 10.';
   const p=this.produtos.find(p=>p.id===s.produtoId),existente=s.itens.filter(i=>i.id===p.id).reduce((a,i)=>a+i.quantidade,0);
   if(existente+n>p.estoque)return 'Estoque simulado insuficiente. Disponível: '+(p.estoque-existente);
   const i=s.itens.find(i=>i.id===p.id&&i.tamanho===s.tamanho);
   if(i)i.quantidade+=n;else s.itens.push({id:p.id,nome:p.nome,tamanho:s.tamanho,preco:s.preco,quantidade:n});
   s.etapa='mais';return 'Adicionado! Parcial: '+dinheiro(this.total(s))+'\n1 - Adicionar outro produto\n2 - Finalizar pedido';
  }
  if(s.etapa==='mais'){
   if(t==='1'){s.etapa='categoriaComprar';return '1 - Pizzas\n2 - Bebidas';}
   if(t==='2'){s.etapa='confirmar';return 'Resumo:\n'+s.itens.map(i=>i.quantidade+'x '+i.nome+(i.tamanho?' '+i.tamanho:'')+' — '+dinheiro(i.preco*i.quantidade)).join('\n')+'\nTotal: '+dinheiro(this.total(s))+'\n1 - Confirmar pedido FICTÍCIO\n2 - Cancelar';}
   return 'Digite 1 ou 2.';
  }
  if(s.etapa==='confirmar'){
   if(t==='2'){this.sessoes.set(cliente,{etapa:'menu',itens:[]});return 'Pedido cancelado. Digite menu.';}
   if(t!=='1')return 'Digite 1 para confirmar ou 2 para cancelar.';
   if(!s.itens.every(i=>this.produtos.find(p=>p.id===i.id).estoque>=s.itens.filter(j=>j.id===i.id).reduce((a,j)=>a+j.quantidade,0))){this.sessoes.set(cliente,{etapa:'menu',itens:[]});return 'Estoque mudou. Pedido cancelado. Digite menu.';}
   const pedido={codigo:'P'+String(this.sequencia++).padStart(3,'0'),cliente,itens:structuredClone(s.itens),total:this.total(s),status:'recebido',demonstracao:true};
   for(const i of pedido.itens)this.produtos.find(p=>p.id===i.id).estoque-=i.quantidade;
   this.pedidos.unshift(pedido);this.sessoes.set(cliente,{etapa:'menu',itens:[]});
   return '✅ Pedido DEMONSTRATIVO '+pedido.codigo+' registrado! Total: '+dinheiro(pedido.total)+'\nNenhuma venda real foi realizada. Digite menu.';
  }
  if(s.etapa==='consulta'){
   this.sessoes.set(cliente,{etapa:'menu',itens:[]});
   const p=this.pedidos.find(p=>p.codigo.toLowerCase()===t.toLowerCase()&&p.cliente===cliente);
   return p?'Pedido '+p.codigo+': '+p.status+'. Digite menu.':'Pedido não encontrado nesta conversa. Digite menu.';
  }
  return this.menu();
 }
}
module.exports={Bot};
