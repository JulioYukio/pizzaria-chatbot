# Pizzaria Chatbot

Protótipo acadêmico, executado localmente, sem custos de implantação e sem vendas reais.

## Funcionalidades

- Cardápio fornecido pela pizzaria: **77 pizzas** (salgadas, especiais, light e doces) e **18 bebidas**.
- Ingredientes e preços específicos dos tamanhos **Broto, Média, Grande e Família**.
- Chatbot com seleção de produto, tamanho, quantidade, carrinho, confirmação fictícia e consulta de pedido.
- Estoque **simulado** (10 unidades de cada produto), não vinculado ao estoque real.
- Painel web demonstrativo para acompanhar pedidos originados no próprio simulador.
- Conexão opcional com WhatsApp Web não oficial (processo separado).

## Novo fluxo: catálogo completo e pedido direto

O bot apresenta **todos os 77 sabores em uma única mensagem**, sem páginas. Para iniciar, envie `oi`, selecione `2 - Fazer pedido` e depois `1 - Pizzas`.

Responda diretamente com:
- `16 G 2` — 2 pizzas Calabresa **Grandes**
- `16 M` — Calabresa **Média** (o bot só pergunta a quantidade)
- `16` — o bot mostra os ingredientes e os quatro preços, depois pergunta tamanho e quantidade
- `1001 2` — 2 bebidas Coca-Cola 2L (na categoria Bebidas)

Tamanhos aceitos: `B` (Broto), `M` (Média), `G` (Grande), `F` (Família), ou nomes completos sem depender de acentos.

O mesmo fluxo é usado no simulador e no módulo de WhatsApp. O catálogo apresenta nomes resumidos para não tornar a mensagem excessivamente longa, e os ingredientes aparecem quando o cliente envia apenas o código do sabor.

## Início rápido

Instale Node.js 20 ou superior.

```sh
git clone https://github.com/JulioYukio/pizzaria-chatbot.git
cd pizzaria-chatbot
npm start
```

Abra **http://127.0.0.1:3000**. Execute `npm test` para testar o motor de pedidos.

## Teste opcional com WhatsApp

```sh
npm install whatsapp-web.js qrcode-terminal
npm run whatsapp
```

Abra o WhatsApp de uma **conta de testes**, vá até **Dispositivos conectados > Conectar dispositivo** e leia o QR Code no terminal. Em outro número autorizado, envie `oi`. O bot não inicia conversas nem envia mensagens em massa.

**Aviso:** `whatsapp-web.js` é uma biblioteca não oficial. Existe risco de desconexão e bloqueio da conta. Não use o número comercial da pizzaria. As sessões locais estão excluídas do Git.

O WhatsApp utiliza memória própria e os pedidos desse canal **ainda não aparecem no painel web**. Para a apresentação, o simulador de navegador continua disponível independentemente da conexão com WhatsApp.

Consulte [docs/whatsapp.md](docs/whatsapp.md) para instruções e limitações.

## Escopo

Os dados de preços foram copiados do arquivo de cardápio enviado para o projeto, mas não foram verificados comercialmente. Não há cobrança por mensagem pela biblioteca, hospedagem obrigatória ou pagamentos reais. O MVC do semestre anterior ainda não está integrado.

**Status:** Protótipo v0.3 — código publicado; a conexão real por QR Code precisa ser testada em um computador com um número de testes.

## Validação de tamanho e imagem no WhatsApp

- Aceita nomes completos (`grande`, `família`), abreviações (`G`, `F`) e variações sem acentos (`familia`, `media`).
- Quando reconhece erro simples (`grnade`), sugere a correção **sem incluir o produto automaticamente**. O usuário deve reenviar a opção corrigida.
- O texto **2 - Fazer pedido** exibe os quatro tamanhos.
- Quando o cliente digitar `menu` ou escolher `1 - Ver cardápio` na tela principal do WhatsApp, o bot tenta enviar `assets/cardapio.png`; enquanto o arquivo não existir, informa que a imagem ainda não está disponível.
