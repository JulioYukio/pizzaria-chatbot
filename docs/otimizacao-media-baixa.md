# Otimização de média e baixa prioridade

> Atualização de integração: os conflitos com `main` foram conciliados preservando o PDF, os 79 sabores/17 bebidas, preços e menus atuais. Os resultados de desempenho abaixo são o registro histórico da otimização antes dessa integração. A validação combinada está registrada no final deste documento.

Base de continuação: `fd3e171`, branch `fix/whatsapp-confiabilidade`. A `main` possui mudanças independentes de menu/PDF e não será sobrescrita ou mesclada à força. As correções de alta prioridade já estão nesta branch e serão preservadas.

## Plano por impacto, risco e complexidade

| Pendência | Prioridade | Impacto / risco / complexidade | Execução |
| --- | --- | --- | --- |
| Formatação monetária e agregações repetidas | Baixa | CPU alto em catálogos / baixo / baixa | Reutilizar Intl e remover varreduras desnecessárias |
| Função morta e mapa duplicado de tamanhos | Baixa | Manutenção / baixo / baixa | Remover `tamanhoDe` e manter um mapa |
| Eventos WhatsApp repetidos | Média | Pedidos/respostas incorretos / médio / média | Deduplicar por contato + ID, cache limitado e com prazo |
| Leitura repetida de mídia | Baixa | Disco e CPU / baixo / média | Verificar metadados de forma assíncrona e reutilizar uma mídia enquanto não mudar |
| Consultas e reconstrução do painel | Média | Rede/DOM/CPU / baixo / média | Agrupar atualizações concorrentes e renderizar somente dados modificados |
| Instalação não reproduzível | Média | Estabilidade / alto após auditoria / média | Tentativa de lock retirada por vulnerabilidades transitivas; pendente |
| Sessões sem expiração | Média | RAM / alto / alta | Não expirar silenciosamente: isso descartaria carrinhos e mudaria o fluxo |
| Estados separados web/WhatsApp | Média | Dados e arquitetura / alto / alta | Não unificar sem migração/contrato: preservação dos estados existentes |

## Validação

- [x] Confirmar estado do Git, instruções e pendências já resolvidas; 25/25 testes iniciais.
- [x] Medir e simplificar o motor sem mudar textos/regras.
- [x] Testar e implementar deduplicação limitada.
- [x] Testar e implementar cache da mídia com invalidação.
- [x] Testar e reduzir trabalho redundante do painel.
- [x] Investigar instalação reproduzível; tentativa descartada por segurança, conforme evidências abaixo.
- [x] Revisão independente e correção do problema encontrado; suíte final 37/37.
- [x] Verificar escopo e ausência de arquivos sensíveis; API, catálogo, manifesto e exclusões do Git preservados.
- Publicação: commit da otimização na branch de continuação, sem force push; hash e links confirmados no relatório final da conversa.

Não existem chamadas ou dependências de IA nesta versão. Não há dependências declaradas sem uso para remover. O histórico visual e os estados de conversa não serão apagados como forma de economizar memória.

## Melhorias concluídas

Média: deduplicação por contato e ID do WhatsApp, incluindo eventos simultâneos. Guarda no máximo mil IDs concluídos por dez minutos; não guarda corpos de mensagens nem apaga carrinhos. IDs pendentes acompanham a promessa em andamento e são liberados no fim. Eventos sem ID continuam funcionando. O cache é local ao processo; não garante deduplicação após reinício, expiração ou expulsão pelo limite. Falhas de envio ambíguas não provocam repetição automática da operação de negócio.

Média: o painel agrupa consultas concorrentes, faz uma consulta adicional quando chega pedido de atualização durante o carregamento, e não recria linhas se os dados forem idênticos. Preserva histórico e renderização por `textContent`. Falha HTTP ao reiniciar não apaga o histórico nem mostra confirmação falsa.

Baixa: removida a função sem uso `tamanhoDe` e sua tabela duplicada. O motor e o painel reutilizam um `Intl.NumberFormat`. A validação de tamanho evita calcular distância para textos maiores que o máximo matematicamente elegível. Adição ao carrinho soma e procura o item em uma passagem. Confirmação calcula quantidades por produto uma vez, preservando a revalidação de estoque entre clientes e tamanhos.

Baixa: metadados da imagem são verificados de forma assíncrona. Uma mídia é reutilizada enquanto tamanho, mtime e ctime não mudarem; remoção/inacessibilidade invalida o cache. Não há cache negativo, logo uma imagem colocada depois é encontrada. A primeira preparação de uma nova versão ainda usa a função síncrona existente da biblioteca. Isso evita repetir a leitura sem introduzir um caminho de codificação de mídia novo. Não altera quais comandos enviam imagem.

## Medidas e testes

Node.js v22.13.1, mesma máquina, sem conta WhatsApp, navegador automatizado ou envio externo. Comparação com cópias dos arquivos de `fd3e171` guardadas fora do repositório.

| Cenário | Antes | Depois | Observação |
| --- | ---: | ---: | --- |
| 300 listagens de bebidas, mediana de 7 amostras após aquecimento | 260,553 ms | 6,353 ms | Cerca de 97,6% menos tempo neste trabalho local; não é latência de rede |
| Hash SHA-256 do catálogo gerado | `438596045a8fc931539fc8797ea40e538ca301e99eeb358ba2400cc32158dc8a` | igual | Texto/preços preservados |
| 100 solicitações da mesma mídia | 100 preparações | 1 preparação | Transporte simulado; ainda são 100 envios solicitados |
| 50 atualizações simultâneas do painel | 100 GETs | 4 GETs | Inclui uma atualização de acompanhamento |
| Novas linhas no mesmo cenário, dados idênticos | 50 | 0 | Fixture com um produto, após renderização inicial |

Scripts reproduzíveis: `node scripts/medir-motor.cjs` e `node scripts/medir-painel.cjs`. Cada um aceita como argumento opcional um arquivo anterior correspondente. A contagem da mídia está no teste automatizado de cache. São reduções medidas de CPU/operações/DOM; não foi medida redução de RSS, heap ou memória do Chromium.

`npm.cmd test`: 25 testes iniciais e 37 finais. Cobrem pedidos, cancelamento, consulta por cliente, tamanhos, estoque agregado e concorrente, entradas inválidas, ordem entre mensagens, continuidade após falhas, filtros, deduplicação/expiração/limite, cache/invalidação, painel atualizado e recuperação de erros. Testes novos de deduplicação, cache e agrupamento foram observados falhando antes das correções.

Revisão independente: um P2 encontrado na finalização do agrupamento de consultas. Um POST concluído numa janela de microtarefas podia perder sua atualização. A reprodução falhou antes da correção; a limpeza foi movida para o mesmo bloco assíncrono do laço, e o teste passou para 12 agendamentos distintos. Suíte completa após a correção: 37/37. Nenhum outro bloqueio foi encontrado na revisão.

## Pendências e decisões de preservação

- Sessões sem prazo e histórico visual completo: expirar/remover esses dados mudaria a experiência e poderia descartar carrinhos. Não implementado sem uma política de retenção e recuperação. Consequência: memória desses dados ainda pode crescer.
- Estado separado do painel e WhatsApp: unificar requer definir fonte de verdade e migrar o armazenamento, além de mudar como os processos são iniciados. Não é uma otimização segura isolada; permanece pendente.
- Dependências: o lock experimental de `whatsapp-web.js@1.34.7` e `qrcode-terminal@0.12.0` gerou 17 alertas no `npm audit --package-lock-only` (11 altos, 6 moderados). A sugestão automática de `whatsapp-web.js@1.34.2` muda Puppeteer para a linha 18.2.1 e não foi aplicada sem teste real. Manifesto e instruções de instalação foram restaurados, e o lock experimental removido. Nenhuma biblioteca nova, downgrade ou lock vulnerável será publicado. Necessário validar uma combinação compatível e segura dos pacotes existentes.
- A fila de um contato continua aguardando se o envio nunca terminar; os outros contatos seguem independentes. Timeout/reenvio e persistência da deduplicação exigem política de entrega para não repetir pedidos.
- Medir RAM e latência em uso prolongado e testar mídia numa conta autorizada continuam pendentes; os testes aqui substituem somente transporte externo, mídia e DOM.
- A `main` divergiu antes desta tarefa e mudou menus/PDF. A publicação está destinada à branch de continuação, sem force push ou alteração dessas funcionalidades na `main`; integração entre as linhas exige resolver os conflitos separadamente.

## Arquivos desta otimização

Produção: `src/bot.js`, `src/whatsapp.js`, `public/app.js`.

Testes e suporte: `tests/bot.test.js`, `tests/whatsapp.test.js`, `tests/painel.test.js`, `test-support/whatsapp.cjs`, `test-support/painel.cjs`.

Medições e registro: `scripts/medir-motor.cjs`, `scripts/medir-painel.cjs`, este relatório.

API HTTP, catálogo, manifesto, autenticação e persistência existente não foram modificados. Não foi removida nenhuma dependência: os dois pacotes referenciados são usados pelo conector.

## Integração com a main

Base incorporada: `5a42a0a`. Mantidos o PDF como documento na opção 1, instruções sem pedido nessa tela, seleção do sabor 109, catálogo/preços atualizados, identificação do sistema e correção idempotente da biblioteca. O servidor, catálogo, PDF e manifesto são idênticos aos da main. Reaplicadas as otimizações do motor, cache de mídia agora para PDF, fila/deduplicação e painel.

Corrigidas inconsistências verificadas em testes: a classificação de entrada inválida usa a etapa anterior à transição para não atrasar as instruções iniciais do PDF; o teste de `0` passou a refletir o reinício que o código da main já fazia; e a opção válida do PDF cancela aviso inválido antes de aguardar a mídia. A última corrida foi confirmada por revisão independente e teve teste observado falhando antes da correção.

Os testes da main foram mantidos e combinados com os testes de otimização; os antigos testes de compra na tela de visualização foram substituídos pelos da regra atual (PDF/instruções nessa opção). Não houve acesso ou alteração ao stash do usuário.

Validação combinada: `npm.cmd test`, 41/41 aprovados. Simulação atualizada para opção 1/PDF seguida de menu: 200/200 conversas na etapa correta, 400 respostas normais e 200 respostas textuais mantidas no cenário de falha de mídia. O teste do catálogo confirma preços atuais; o pedido de duas Calabresas grandes e uma Coca-Cola 2L totaliza R$ 151,00. Comparação de arquivos confirmou catálogo, PDF, servidor e manifesto idênticos à base incorporada.
