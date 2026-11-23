"use strict";
const fs=require("node:fs"),path=require("node:path");
function lerCache(arquivo){
 try{return JSON.parse(fs.readFileSync(arquivo,"utf8"));}
 catch(e){if(e.code!=="ENOENT")console.warn("Cache local indisponível:",e.message);return null;}
}
function gravarCache(arquivo,dados){
 const temporario=arquivo+".tmp";
 try{
  fs.mkdirSync(path.dirname(arquivo),{recursive:true,mode:0o700});
  fs.writeFileSync(temporario,JSON.stringify(dados),{encoding:"utf8",mode:0o600});
  fs.renameSync(temporario,arquivo);
 }catch(e){
  console.error("Falha ao salvar cache local:",e.message);
  try{fs.unlinkSync(temporario);}catch{}
 }
}
module.exports={lerCache,gravarCache};
