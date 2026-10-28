# Pizzaria Chatbot — protótipo gratuito

O catálogo foi atualizado a partir do PDF **Cardápio - A Fornalha (12).pdf**, com 79 pizzas e 17 bebidas. O estoque (10 unidades por produto) e os pedidos são fictícios.

## Iniciar

Node.js 20+:

```sh
npm start
npm test
```

Abra http://127.0.0.1:3000.

## WhatsApp — demonstração não oficial

```sh
npm install whatsapp-web.js qrcode-terminal
npm run whatsapp
```

Coloque o PDF do cardápio em **assets/cardapio.pdf**. Ao digitar **menu** ou escolher **1 - Ver cardápio** no WhatsApp, o bot tentará enviar o documento. O texto de cardápio e pedidos permanece disponível.

Pedidos diretos: `16 grande 2` (2 Calabresas grandes) ou `0` no cardápio para avançar à compra.

**Atenção: código 109 duplicado no impresso:** M&M's e Churros estão marcados 109 no PDF. No bot, `109M` identifica M&M's; `109C` ou `120` identifica Churros. Somente `109` exige esclarecimento. A pizzaria deve corrigir o documento impresso antes de uso comercial.

A biblioteca de WhatsApp não é oficial e pode causar suspensão da conta. Use apenas número de testes autorizado. Não há pagamentos, pedidos ou entregas reais. Pedidos do WhatsApp e do painel ainda ficam em memórias separadas. Não exponha a aplicação local na internet.
