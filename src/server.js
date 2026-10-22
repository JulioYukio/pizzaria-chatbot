const http=require("node:http");
const fs=require("node:fs/promises");
const path=require("node:path");
const {Bot}=require("./bot");
const bot=new Bot();
function json(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data))}
const assets={"/":"index.html","/app.js":"app.js","/style.css":"style.css"};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,"http://localhost");
  if(req.method==="GET"&&assets[url.pathname]){
   const f=assets[url.pathname],buf=await fs.readFile(path.join(__dirname,"..","public",f));
   res.writeHead(200,{"Content-Type":f.endsWith(".html")?"text/html; charset=utf-8":f.endsWith(".css")?"text/css; charset=utf-8":"application/javascript; charset=utf-8","Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'"});return res.end(buf);
  }
  if(req.method==="GET"&&url.pathname==="/api/pedidos")return json(res,200,{pedidos:bot.pedidos});
  if(req.method==="GET"&&url.pathname==="/api/cardapio")return json(res,200,{produtos:bot.produtos});
  if(req.method==="POST"&&url.pathname==="/api/mensagem"){
   let body="";for await(const chunk of req){body+=chunk;if(body.length>4096)return json(res,413,{erro:"Mensagem muito longa"})}
   let d;try{d=JSON.parse(body)}catch{return json(res,400,{erro:"JSON inválido"})}
   if(typeof d.cliente!=="string"||!/^[a-zA-Z0-9_-]{1,50}$/.test(d.cliente)||typeof d.mensagem!=="string"||d.mensagem.length>1000)return json(res,400,{erro:"Mensagem inválida"});
   return json(res,200,{resposta:bot.falar(d.cliente,d.mensagem)});
  }
  if(req.method==="POST"&&url.pathname==="/api/reiniciar"){bot.reiniciar();return json(res,200,{ok:true})}
  return json(res,404,{erro:"Rota não encontrada"});
 }catch(e){console.error(e);return json(res,500,{erro:"Erro interno"})}
});
if(require.main===module)server.listen(Number(process.env.PORT)||3000,"127.0.0.1",()=>console.log("Demonstração: http://127.0.0.1:"+(process.env.PORT||3000)));
module.exports=server;
