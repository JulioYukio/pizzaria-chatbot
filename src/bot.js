"use strict";
const original = require("./cardapio.json");
const {lerCache,gravarCache}=require("./cache");
const tamanhos = ["BROTO", "MÉDIA", "GRANDE", "FAMÍLIA"];
const moeda = new Intl.NumberFormat("pt-BR", {style:"currency",currency:"BRL"});
const dinheiro = centavos => moeda.format(centavos / 100);
const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase();
const tamanhosPorNome={B:"BROTO",BROTO:"BROTO",M:"MÉDIA",MEDIA:"MÉDIA",G:"GRANDE",GRANDE:"GRANDE",F:"FAMÍLIA",FAMILIA:"FAMÍLIA"};

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
  const exatos=tamanhosPorNome;
 if(exatos[texto])return {tamanho:exatos[texto]};
  if(texto.length<4||texto.length>9)return {};
 const candidatos=["BROTO","MEDIA","GRANDE","FAMILIA"].map(t=>({nome:t,dist:distancia(texto,t)})).sort((a,b)=>a.dist-b.dist);
 if(candidatos[0].dist<=2&&(!candidatos[1]||candidatos[0].dist<candidatos[1].dist)){
  return {sugestao:exatos[candidatos[0].nome]};
 }
 return {};
}

class Bot {
 constructor({cacheFile=null}={}){this.cacheFile=cacheFile;this.reiniciar();this.carregarCache();}
 carregarCache(){
  if(!this.cacheFile)return;
  const d=lerCache(this.cacheFile);
  if(!d||d.versao!==1)return;
  const agora=Date.now();
  for(const par of (Array.isArray(d.sessoes)?d.sessoes:[])){
   if(!Array.isArray(par)||par.length!==2)continue;
   const [cliente,s]=par;
   if(typeof cliente!=="string"||!s||!Array.isArray(s.itens)||typeof s.etapa!=="string")continue;
   if(!Number.isFinite(s.ultimaAtividade)||agora-s.ultimaAtividade>7*24*60*60*1000)continue;
   this.sessoes.set(cliente,s);
  }
  if(Array.isArray(d.pedidos))this.pedidos=d.pedidos;
  if(Number.isSafeInteger(d.sequencia)&&d.sequencia>0)this.sequencia=d.sequencia;
  if(Array.isArray(d.estoques))for(const item of d.estoques){
   if(!Array.isArray(item))continue;
   const p=this.produtos.find(p=>p.id===item[0]);
   if(p&&Number.isInteger(item[1])&&item[1]>=0&&item[1]<=10)p.estoque=item[1];
  }
 }
 salvarCache(){
  if(!this.cacheFile)return;
  gravarCache(this.cacheFile,{versao:1,sessoes:[...this.sessoes],pedidos:this.pedidos,sequencia:this.sequencia,estoques:this.produtos.map(p=>[p.id,p.estoque])});
 }
 falar(cliente,entrada){
  const resposta=this.processar(cliente,entrada);
  const s=this.sessoes.get(cliente);
  if(s)s.ultimaAtividade=Date.now();
  this.salvarCache();
  return resposta;
 }
 reiniciar(){this.produtos=[...structuredClone(original.pizzas),...structuredClone(original.bebidas)].map(p=>({...p,estoque:10}));this.pedidos=[];this.sessoes=new Map();this.sequencia=1;}
 textoCardapio(s){return "Tamanhos: B/Broto, M/Média, G/Grande, F/Família.\nPara fazer seu pedido, informe o código da pizza e o tamanho, como neste exemplo: 31 G (Jardineira grande)."+(s?.itens?.length?"\n9 - Cancelar adição e finalizar pedido":"")+"\n88 - Voltar à escolha de categoria\nDigite 'menu' para voltar.";}
 menu(){return "A Fornalha Pizzaria — PROTÓTIPO\n1 - Ver cardápio\n2 - Fazer pedido\n3 - Ver pedido atual\nDigite menu para voltar ao início.";}
 fazerPedido(s){return "🛒 Fazer pedido\nEscolha a categoria:\n1 - Pizzas\n2 - Bebidas"+(s?.itens?.length?"\n9 - Cancelar adição e finalizar pedido":"")+"\nTamanhos: "+opcoesTamanho+"\nExemplo: 16 grande 2 (2 Calabresas grandes).";}
 resumo(s){return "Resumo:\n"+s.itens.map(i=>i.quantidade+"x "+i.nome+(i.tamanho?" "+i.tamanho:"")+" — "+dinheiro(i.preco*i.quantidade)).join("\n")+"\nTotal: "+dinheiro(this.total(s))+"\n1 - Confirmar pedido FICTÍCIO\n2 - Adicionar outro produto\n3 - Cancelar";}
 listar(tipo,s) {
   if(tipo==="pizza")return this.textoCardapio(s);
   const produtos=this.produtos.filter(p=>p.tipo===tipo);
   const titulo=tipo==="pizza"?"🍕 CATÁLOGO COMPLETO — PIZZAS":"🥤 BEBIDAS";
   const linhas=produtos.map(p=>(p.id===109?"109M":p.id===120?"109C / 120":p.id)+" - "+p.nome+(p.tipo==="bebida"?" — "+dinheiro(p.precoCentavos):""));
   return titulo+"\n"+linhas.join("\n")+"\n\n"+(tipo==="pizza"?"Tamanhos: B/Broto, M/Média, G/Grande, F/Família.\nExemplo: 16 G (Calabresa grande)\nOu: 16 G 2 (duas pizzas de calabresa grande).":"Exemplo: 1001 2 (duas bebidas).")+(s?.itens?.length?"\n9 - Cancelar adição e finalizar pedido":"")+"\n88 - Voltar à escolha de categoria\nDigite 'menu' para voltar.";
 }
 total(s){return s.itens.reduce((a,i)=>a+i.preco*i.quantidade,0);}
 adicionar(s,p,tamanho,quantidade){
   if(!Number.isInteger(quantidade)||quantidade<1||quantidade>10)return "Quantidade inválida. Use de 1 a 10 unidades.";
   let ja=0,atual;
   for(const item of s.itens){if(item.id===p.id){ja+=item.quantidade;if(item.tamanho===tamanho)atual=item;}}
   if(p.estoque<ja+quantidade)return "Estoque simulado insuficiente. Disponível: "+Math.max(0,p.estoque-ja);
   if(atual)atual.quantidade+=quantidade;
   else s.itens.push({id:p.id,nome:p.nome,tamanho,preco:tamanho?p.precosCentavos[tamanho]:p.precoCentavos,quantidade});
   s.etapa="mais";
   return "✅ Adicionado: "+quantidade+"x "+p.nome+(tamanho?" "+tamanho:"")+" — "+dinheiro((tamanho?p.precosCentavos[tamanho]:p.precoCentavos)*quantidade)+"\nParcial: "+dinheiro(this.total(s))+"\n\n1 - Adicionar outro produto\n2 - Finalizar pedido";
 }
 processar(cliente,entrada){
   const t=String(entrada??"").trim(),n=Number(t);
   if(!t)return "Digite uma mensagem.";
   if(!this.sessoes.has(cliente)){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return this.menu();}
   if(/^reiniciar$/i.test(t)||t==="0"){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return this.menu();}
   const s=this.sessoes.get(cliente);
   if(/^menu$/i.test(t)){s.etapa="menu";return this.menu();}
   if(t==="9"&&["categoriaComprar","produto","tamanho","quantidade","escolher109"].includes(s.etapa)&&s.itens.length){
    s.etapa="confirmar";delete s.pedido109;delete s.origem109;
    return this.resumo(s);
   }
   if(t==="88"&&["produto","tamanho","quantidade","escolher109"].includes(s.etapa)){
    s.etapa="categoriaComprar";delete s.pedido109;delete s.origem109;
    return this.fazerPedido(s);
   }
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
     if(t==="1"){s.etapa="produto";s.tipo="pizza";return this.textoCardapio(s);}
     if(t==="2"){s.etapa="categoriaComprar";return this.fazerPedido(s);}
     if(t==="3"){if(!s.itens.length)return "Seu carrinho está vazio.\n"+this.menu();s.etapa="confirmar";return this.resumo(s);}
     return "Opção inválida.\n"+this.menu();
   }
   if(s.etapa==="categoriaComprar"){
     if(t!=="1"&&t!=="2")return "Digite 1 para pizzas ou 2 para bebidas.";
     s.tipo=t==="1"?"pizza":"bebida";
     s.etapa="produto";
     return s.tipo==="pizza"?this.textoCardapio(s):this.listar(s.tipo,s);
   }
   if(s.etapa==="produto"){
     const partes=t.split(/\s+/),id=Number(partes[0]);
     if(s.tipo==="pizza"&&id===109&&!/^109[MC]$/i.test(partes[0])){
       if(partes.length>3)return "Formato inválido. Use: 109 G 2 (código, tamanho e quantidade).";
       s.pedido109=t;s.origem109=s.etapa;s.etapa="escolher109";
       return "Qual sabor você deseja para a pizza 109?\n1 - M&M\u0027s\n2 - Churros\nResponda 1 ou 2 para continuar seu pedido.";
     }
     const codigo=/^109M$/i.test(partes[0])?109:/^109C$/i.test(partes[0])?120:id;
     const p=this.produtos.find(p=>p.id===codigo&&p.tipo===s.tipo);
     if(!p||(!Number.isInteger(id)&&!/^109[MC]$/i.test(partes[0])))return "Código inválido. Consulte a lista e digite o número correto.\n"+this.listar(s.tipo,s);
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
     if(t==="1"){s.etapa="categoriaComprar";return this.fazerPedido(s);}
     if(t==="2"){s.etapa="confirmar";return this.resumo(s);}
     return "Digite 1 ou 2.";
   }
   if(s.etapa==="confirmar"){
     if(t==="2"){s.etapa="categoriaComprar";return this.fazerPedido(s);}
     if(t==="3"){this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Pedido cancelado. Digite menu.";}
     if(t!=="1")return "Digite 1 para confirmar, 2 para adicionar outro produto ou 3 para cancelar.";
      const quantidades=new Map();
      for(const item of s.itens)quantidades.set(item.id,(quantidades.get(item.id)||0)+item.quantidade);
      if(![...quantidades].every(([id,quantidade])=>this.produtos.find(p=>p.id===id).estoque>=quantidade)){
       this.sessoes.set(cliente,{etapa:"menu",itens:[]});return "Estoque mudou. Pedido cancelado. Digite menu.";
     }
     const pedido={codigo:"P"+String(this.sequencia++).padStart(3,"0"),cliente,itens:structuredClone(s.itens),total:this.total(s),status:"recebido",demonstracao:true};
     for(const i of pedido.itens)this.produtos.find(p=>p.id===i.id).estoque-=i.quantidade;
     this.pedidos.unshift(pedido);this.sessoes.set(cliente,{etapa:"menu",itens:[]});
     return "✅ Pedido demonstrativo confirmado! Total: "+dinheiro(pedido.total)+"\nNenhuma venda real foi realizada. Digite menu.";
   }
   return this.menu();
 }
}
module.exports={Bot};
