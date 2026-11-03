const chat=document.querySelector("#chat"),form=document.querySelector("#form"),input=document.querySelector("#msg");
const cliente="demonstracao";
const moeda=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const dinheiro=centavos=>moeda.format(centavos/100);
function bolha(msg,user=false){
 const el=document.createElement("div");el.className="bubble"+(user?" user":"");
 el.textContent=msg;chat.append(el);chat.scrollTop=chat.scrollHeight;
}
async function mensagem(texto){
 bolha(texto,true);
 try{
  const r=await fetch("/api/mensagem",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cliente,mensagem:texto})});
  const d=await r.json();bolha(d.resposta||d.erro||"Falha");await atualizar();
 }catch{bolha("Não foi possível conectar ao servidor.");}
}
form.addEventListener("submit",e=>{
 e.preventDefault();const t=input.value.trim();if(t){input.value="";mensagem(t);}
});
let ultimosPedidos=null,ultimoEstoque=null,atualizacao=null,atualizacaoPendente=false;
async function ler(url){
 const resposta=await fetch(url);
 if(!resposta.ok)throw new Error("Falha ao atualizar painel");
 return resposta.json();
}
async function carregarPainel(){
 try{
  const [p,c]=await Promise.all([ler("/api/pedidos"),ler("/api/cardapio")]);
  const pedidos=document.querySelector("#pedidos"),estoque=document.querySelector("#estoque");
  const assinaturaPedidos=JSON.stringify(p.pedidos),assinaturaEstoque=JSON.stringify(c.produtos);
  if(assinaturaPedidos!==ultimosPedidos){
   pedidos.replaceChildren();
   if(!p.pedidos.length)pedidos.textContent="Nenhum pedido registrado.";
   for(const item of p.pedidos){
    const el=document.createElement("div");el.className="item";
    el.textContent=item.codigo+" — "+item.itens.map(i=>i.quantidade+"x "+i.nome+(i.tamanho?" "+i.tamanho:"")).join(", ")+" — "+dinheiro(item.total)+" ("+item.status+")";
    pedidos.append(el);
   }
   ultimosPedidos=assinaturaPedidos;
  }
  if(assinaturaEstoque!==ultimoEstoque){
   estoque.replaceChildren();
   for(const item of c.produtos){
    const el=document.createElement("div");el.className="item";
    el.textContent=item.nome+" ["+item.tipo+"]"+(item.tipo==="pizza"?" — "+Object.entries(item.precosCentavos).map(([t,v])=>t+": "+dinheiro(v)).join(" | "):" — "+dinheiro(item.precoCentavos))+" — estoque fictício: "+item.estoque;
    estoque.append(el);
   }
   ultimoEstoque=assinaturaEstoque;
  }
 }catch{
  document.querySelector("#pedidos").textContent="Servidor indisponível.";
  ultimosPedidos=null;
 }
}
function atualizar(){
 if(atualizacao){atualizacaoPendente=true;return atualizacao;}
 atualizacao=(async()=>{
  try{
   do{atualizacaoPendente=false;await carregarPainel();}while(atualizacaoPendente);
  }finally{atualizacao=null;}
 })();
 return atualizacao;
}
document.querySelector("#refresh").addEventListener("click",atualizar);
document.querySelector("#reset").addEventListener("click",async()=>{
 if(!confirm("Apagar todos os pedidos fictícios e reiniciar estoque?"))return;
 try{
  const resposta=await fetch("/api/reiniciar",{method:"POST"});
  if(!resposta.ok)throw new Error("Falha ao reiniciar");
  chat.replaceChildren();await atualizar();bolha("Demonstração reiniciada. Escreva oi.");
 }catch{bolha("Não foi possível reiniciar a demonstração.");}
});
bolha("Olá! Digite oi para começar a demonstração.");atualizar();
