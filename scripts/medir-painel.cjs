const fs=require("node:fs");
const {simularPainel}=require("../test-support/painel.cjs");
(async()=>{
 const codigo=process.argv[2]?fs.readFileSync(process.argv[2],"utf8"):undefined;
 const p=simularPainel({codigo});await p.pronto();
 p.metricas.consultas=0;p.metricas.elementos=0;
 await Promise.all(Array.from({length:50},()=>p.executar("atualizar()")));
 console.log(JSON.stringify({atualizacoes:50,...p.metricas},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
