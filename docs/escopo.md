# Escopo do protótipo

## Objetivo
Demonstrar a experiência de fazer um pedido fictício para uma pizzaria sem custos para a proprietária.

## Disponível nesta versão
- Conversa interativa no navegador.
- Cardápio e estoque fictícios.
- Carrinho, confirmação e consulta de pedidos de demonstração.
- Painel local da atendente para acompanhar pedidos.
- Testes automatizados com Node.js.

## Não incluído
- Vendas, pagamentos e entregas reais.
- Armazenamento persistente (reiniciar o servidor apaga os pedidos).
- Integração com o MVC antigo: depende de obter o código e conhecer sua tecnologia.
- Integração com WhatsApp: será desenvolvida separadamente e exigirá um número dedicado para testes; bibliotecas não oficiais podem causar bloqueios.

## Execução
Instale Node.js 20+; execute `npm start` e abra `http://127.0.0.1:3000`.
Execute `npm test` para rodar os testes.
Não exponha este servidor na internet: não há autenticação porque é uma demonstração local.
