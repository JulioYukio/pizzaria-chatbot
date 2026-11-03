const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

function simularPainel({codigo,fetchExtra}={}){
 const metricas={consultas:0,elementos:0},nos=new Map();
 function elemento(){return {children:[],value:"",handlers:{},_texto:"",
  addEventListener(tipo,fn){this.handlers[tipo]=fn;},
  append(el){this.children.push(el);},replaceChildren(){this.children=[];this._texto="";},
  get textContent(){return this._texto;},set textContent(v){this._texto=v;this.children=[];}
 };}
 for(const id of ["chat","form","msg","pedidos","estoque","refresh","reset"])nos.set("#"+id,elemento());
 const dados={pedidos:[],produtos:[{id:1001,nome:"Água",tipo:"bebida",precoCentavos:500,estoque:10}]};
 const contexto=vm.createContext({
  document:{querySelector:id=>nos.get(id),createElement:()=>{metricas.elementos++;return elemento();}},
  confirm:()=>true,
  fetch:async(url,opcoes)=>{
   metricas.consultas++;
   if(fetchExtra){const resposta=await fetchExtra(url,opcoes);if(resposta)return resposta;}
   return {ok:true,json:async()=>url==="/api/pedidos"?{pedidos:dados.pedidos}:url==="/api/cardapio"?{produtos:dados.produtos}:{resposta:"Resposta"}};
  }
 });
 vm.runInContext(codigo||fs.readFileSync(path.join(__dirname,"../public/app.js"),"utf8"),contexto);
 const executar=codigo=>vm.runInContext(codigo,contexto);
 return {metricas,nos,dados,executar,pronto:()=>executar("atualizar()")};
}
module.exports={simularPainel};
