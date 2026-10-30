"use strict";
const original = require("./cardapio.json");
const tamanhos = ["BROTO", "MÉDIA", "GRANDE", "FAMÍLIA"];
const dinheiro = centavos => (centavos / 100).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
function tamanhoDe(token) {
 const t=normalizar(token||"");
 return ({B:"BROTO",BROTO:"BROTO",M:"MÉDIA",MEDIA:"MÉDIA",G:"GRANDE",GRANDE:"GRANDE",F:"FAMÍLIA",FAMILIA:"FAMÍLIA"})[t]||null;
}

const opcoesTamanho="B - Broto | M - Média | G - Grande | F - Família";
function distancia(a,b){
 const m=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let anterior=m[0];m[0]=i;
  for(let j=1;j<=b.length;j++){
   const antigo=m[j];
   m[j]=Math.min(m[j]+1,m[j-1]+1,anterior+(a[i-1]===b[j-1]?0:1));
   anterior=antigo;
  }
 }
 return m[b.length];
}
function analisarTamanho(entrada){
 const texto=normalizar(String(entrada||"").trim());
 const exatos={B:"BROTO",BROTO:"BROTO",M:"MÉDIA",MEDIA:"MÉDIA",G:"GRANDE",GRANDE:"GRANDE",F:"FAMÍLIA",FAMILIA:"FAMÍLIA"};
 if(exatos[texto])return {tamanho:exatos[texto]};
 if(texto.length<4)return {};
 const candidatos=["BROTO","MEDIA","GRANDE","FAMILIA"].map(t=>({nome:t,dist:distancia(texto,t)})).sort((a,b)=>a.dist-b.dist);
 if(candidatos[0].dist<=2&&(!candidatos[1]||candidatos[0].dist<candidatos[1].dist)){
  return {sugestao:exatos[candidatos[0].nome]};
 }
 return {};
}

class Bot {
 constructor(){this.reiniciar();}
 reiniciar(){this.produtos=[...structuredClone(original.pizzas),...structuredClone(original.bebidas)].map(p=>({...p,estoque:10}));this.pedidos=[];this.sessoes=new Map();this.sequencia=1;}
 menu(){return "A Fornalha Pizzaria — PROTÓTIPO\n1 - Ver cardápio\n2 - Fazer pedido\n3 - Consultar pedido\nDigite menu para recomeçar.";}
 fazerPedido(){return "🛒 Fazer pedido\nEscolha a categoria:\n1 - Pizzas\n2 - Bebidas\nTamanhos: "+opcoesTamanho+"\nExemplo: 16 grande 2 (2 Calabresas grandes).";}
 listar(tipo) {
   const produtos=this.produtos.filter(p=>p.tipo===tipo);
   const titulo=tipo==="pizza"?"🍕 CATÁLOGO COMPLETO — PIZZAS":"🥤 BEBIDAS";
   const linhas=produtos.map(p=>(p.id===109?"109M":p.id===120?"109C / 120":p.id)+" - "+p.nome+(p.tipo==="bebida"?" — "+dinheiro(p.precoCentavos):""));
   return titulo+"\n"+linhas.join("\n")+"\n\n"+(tipo==="pizza"?"Tamanhos: B/Broto, M/Média, G/Grande, F/Família.\nExemplo: 16 G (Calabresa grande)\nOu: 16 G 2 (duas pizzas de calabresa grande).":"Exemplo: 1001 2 (duas bebidas).")+"\nDigite 'menu' para voltar.";
 }
 total(s){return s.itens.reduce((a,i)=>a+i.preco*i.quantidade,0);}
 adicionar(s,p,tamanho,quantidade){
   if(!Number.isInteger(quantidade)||quantidade<1||quantidade>10)return "Quantidade inválida. Use de 1 a 10 unidades.";
   const ja=s.itens.filter(i=>i.id===p.id).reduce((a,i)=>a+i.quantidade,0);
   if(p.estoque<ja+quantidade)return "Estoque simulado insuficiente. Disponível: "+Math.max(0,p.estoque-ja);
   const atual=s.itens.find(i=>i.id===p.id&&i.tamanho===tamanho);
   if(atual)atual.quantidade+=quantidade;
   else s.itens.push({id:p.id,nome:p.nome,tamanho,preco:tamanho?p.precosCentavos[tamanho]:p.precoCentavos,quantidade});
   s.etapa="mais";
   return "✅ Adicionado: "+quantidade+"x "+p.nome+(tamanho?" "+tamanho:"")+" — "+dinheiro((tamanho?p.precosCentavos[tamanho]:p.precoCentavos)*quantidade)+"\nParcial: "+dinheiro(this.total(s))+"\n\n1 - Adicionar outro produto\n2 - Finalizar pedido";
 }
 falar(cliente,entrada){
   const t=String(entrada??"").trim(),n=Number(t);
   if(!t)return "Digite uma mensagem.";
   if(!this.sessoes.has(cliente)||/^(menu|reiniciar)$/i.test(t)||(t==="0"&&this.sessoes.get(cliente).etapa!=="ver")){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return this.menu();}
   const s=this.sessoes.get(cliente);
   if(s.etapa==="escolher109"){
     const escolha=normalizar(t);
     const codigo=escolha==="1"||escolha==="M&M'S"||escolha==="M&MS"||escolha==="MMS"?"109M":escolha==="2"||escolha==="CHURROS"?"109C":null;
     if(!codigo)return "Escolha um sabor para continuar:\n1 - M&M's\n2 - Churros";
     const pedido=s.pedido109;
     delete s.pedido109;
     s.etapa=s.origem109||"produto";
     delete s.origem109;
     return this.falar(cliente,pedido.replace(/^109(?=\s|$)/,codigo));
   }
   if(s.etapa==="menu"){
     if(t==="1"||t==="2"){s.etapa=t==="1"?"categoriaVer":"categoriaComprar";return t==="2"?this.fazerPedido():"Escolha uma categoria:\n1 - Pizzas\n2 - Bebidas";}
     if(t==="3"){s.etapa="consulta";return "Informe o código do pedido (P001):";}
     return "Opção inválida.\n"+this.menu();
   }
   if(s.etapa==="categoriaVer"||s.etapa==="categoriaComprar"){
     if(t!=="1"&&t!=="2")return "Digite 1 para pizzas ou 2 para bebidas.";
     s.tipo=t==="1"?"pizza":"bebida";
     s.etapa=s.etapa==="categoriaVer"?"ver":"produto";
     return this.listar(s.tipo)+(s.etapa==="ver"?"\n0 - Fazer pedido nesta categoria\nOu envie diretamente o código, tamanho e quantidade acima.":"");
   }
   if(s.etapa==="produto"||s.etapa==="ver"){
     if(s.etapa==="ver"&&t==="0"){
       s.etapa="produto";
       return "🛒 Escolha seu produto pelo código:\n"+this.listar(s.tipo);
     }
     const partes=t.split(/\s+/),id=Number(partes[0]);
     if(s.tipo==="pizza"&&id===109&&!/^109[MC]$/i.test(partes[0])){
       if(partes.length>3)return "Formato inválido. Use: 109 G 2 (código, tamanho e quantidade).";
       s.pedido109=t;s.origem109=s.etapa;s.etapa="escolher109";
       return "Qual sabor você deseja para a pizza 109?\
1 - M&M\u0027s\
2 - Churros\
Responda 1 ou 2 para continuar seu pedido.";
     }
     const codigo=/^109M$/i.test(partes[0])?109:/^109C$/i.test(partes[0])?120:id;
     const p=this.produtos.find(p=>p.id===codigo&&p.tipo===s.tipo);
     if(!p||(!Number.isInteger(id)&&!/^109[MC]$/i.test(partes[0])))return "Código inválido. Consulte a lista e digite o número correto.\n"+this.listar(s.tipo);
     if(p.estoque<1)return "Produto indisponível no estoque simulado. Escolha outro.";
     s.produtoId=p.id;
     if(p.tipo==="pizza"){
       const analise=analisarTamanho(partes[1]);
       const tamanho=analise.tamanho;
       if(partes.length>1&&!tamanho){
         if(analise.sugestao)return "Você quis dizer "+analise.sugestao+"? Reenvie o pedido com o tamanho corrigido. Exemplo: "+p.id+" "+analise.sugestao+(partes.length===3?" "+partes[2]:"");
         return "Tamanho inválido. Escolha: "+opcoesTamanho+". Exemplo: 16 grande 2";
       }
       if(tamanho){
         if(partes.length>3)return "Formato inválido. Use: 16 G 2 (código, tamanho e quantidade).";
         if(partes.length===3)return this.adicionar(s,p,tamanho,Number(partes[2]));
         s.tamanho=tamanho;s.preco=p.precosCentavos[tamanho];s.etapa="quantidade";
         return p.nome+" "+tamanho+" — "+dinheiro(s.preco)+"\nQuantas unidades? (1-10)";
       }
       s.etapa="tamanho";
       return "🍕 "+p.nome+"\nIngredientes: "+p.ingredientes+"\n"+tamanhos.map((v,i)=>(i+1)+" - "+v+": "+dinheiro(p.precosCentavos[v])).join("\n")+"\nEscolha o tamanho (1-4) ou escreva B, M, G, F.";
     }
     if(partes.length>2)return "Formato inválido. Use: 1001 2 (código e quantidade).";
     if(partes.length===2)return this.adicionar(s,p,null,Number(partes[1]));
     s.tamanho=null;s.preco=p.precoCentavos;s.etapa="quantidade";
     return "Quantas unidades de "+p.nome+"? (1-10)";
   }
   if(s.etapa==="tamanho"){
     const analise=analisarTamanho(t);
     const tamanho=analise.tamanho||(/^[1-4]$/.test(t)?tamanhos[Number(t)-1]:null);
     if(!tamanho)return analise.sugestao?"Você quis dizer "+analise.sugestao+"? Digite o tamanho correto para continuar.":"Tamanho inválido. Escolha 1-4 ou "+opcoesTamanho+".";
     const p=this.produtos.find(p=>p.id===s.produtoId);
     s.tamanho=tamanho;s.preco=p.precosCentavos[tamanho];s.etapa="quantidade";
     return p.nome+" "+tamanho+" — "+dinheiro(s.preco)+"\nQuantas unidades? (1-10)";
   }
   if(s.etapa==="quantidade"){
     const p=this.produtos.find(p=>p.id===s.produtoId);
     return this.adicionar(s,p,s.tamanho,n);
   }
   if(s.etapa==="mais"){
     if(t==="1"){s.etapa="categoriaComprar";return this.fazerPedido();}
     if(t==="2"){s.etapa="confirmar";return "Resumo:\n"+s.itens.map(i=>i.quantidade+"x "+i.nome+(i.tamanho?" "+i.tamanho:"")+" — "+dinheiro(i.preco*i.quantidade)).join("\n")+"\nTotal: "+dinheiro(this.total(s))+"\n1 - Confirmar pedido FICTÍCIO\n2 - Cancelar";}
     return "Digite 1 ou 2.";
   }
   if(s.etapa==="confirmar"){
     if(t==="2"){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Pedido cancelado. Digite menu.";}
     if(t!=="1")return "Digite 1 para confirmar ou 2 para cancelar.";
     if(!s.itens.every(i=>this.produtos.find(p=>p.id===i.id).estoque>=s.itens.filter(j=>j.id===i.id).reduce((a,j)=>a+j.quantidade,0))){
       this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Estoque mudou. Pedido cancelado. Digite menu.";
     }
     const pedido={codigo:"P"+String(this.sequencia++).padStart(3,"0"),cliente,itens:structuredClone(s.itens),total:this.total(s),status:"recebido",demonstracao:true};
     for(const i of pedido.itens)this.produtos.find(p=>p.id===i.id).estoque-=i.quantidade;
     this.pedidos.unshift(pedido);this.sessoes.set(cliente,{etapa:"menu",itens:[]});
     return "✅ Pedido DEMONSTRATIVO "+pedido.codigo+" registrado! Total: "+dinheiro(pedido.total)+"\nNenhuma venda real foi realizada. Digite menu.";
   }
   if(s.etapa==="consulta"){
     this.sessoes.set(cliente,{etapa:"menu",itens:[]});
     const pedido=this.pedidos.find(p=>p.codigo.toLowerCase()===t.toLowerCase()&&p.cliente===cliente);
     return pedido?"Pedido "+pedido.codigo+": "+pedido.status+". Digite menu.":"Pedido não encontrado nesta conversa. Digite menu.";
   }
   return this.menu();
 }
}
module.exports={Bot};
