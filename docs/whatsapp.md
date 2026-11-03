# Execução — protótipo gratuito

## Preparação
Instale Node.js 20+ e clone o repositório.

## Simulador local (sem dependências)
```sh
npm start
```
Abra http://127.0.0.1:3000. Para rodar os testes: `npm test`.

O catálogo atualizado inclui 79 pizzas, quatro tamanhos, e 17 bebidas fornecidos pela pizzaria. A quantidade disponível é **fictícia** (10 por produto); não é estoque real.

Em **1 - Ver cardápio**, o WhatsApp envia `assets/cardapio.pdf` e instruções de tamanho; essa opção não adiciona produtos. Para pedir, envie `menu`, escolha **2 - Fazer pedido**, selecione a categoria e envie `16 G 2` (pizza) ou `1001 2` (bebida). Código sozinho e código com tamanho também funcionam: o bot pergunta os dados restantes. Erros de tamanho exigem correção explícita, sem adicionar automaticamente. `0`, `menu` e `reiniciar` reiniciam a conversa. O código `109` pede escolher entre M&M's e Churros, mantendo o tamanho e a quantidade informados.

Eventos com o mesmo ID são deduplicados em memória, e mensagens do mesmo contato são processadas em ordem. Entradas inválidas seguidas geram um aviso agrupado; uma opção válida cancela o aviso pendente. A mídia PDF é reutilizada enquanto os metadados do arquivo não mudarem.

## WhatsApp Web não oficial (opcional)
A biblioteca é gratuita, mas não é aprovada oficialmente pela Meta e pode provocar suspensão da conta. Use somente uma conta de testes disponível e autorizada, nunca o número comercial da pizzaria.

```sh
npm install whatsapp-web.js qrcode-terminal
npm run whatsapp
```

No celular de testes, abra WhatsApp > Dispositivos conectados > Conectar dispositivo e leia o QR exibido no terminal. Envie "oi" ao número de teste, de outro número autorizado, para iniciar.

O navegador automatizado precisa estar disponível e o computador ligado. O token de sessão fica em `.wwebjs_auth/` e **não deve ser enviado ao GitHub**.

**Limitação importante:** o conector do WhatsApp possui memória de pedidos própria. Assim, pedidos do WhatsApp ainda não aparecem no painel web. Essa integração compartilhada é uma etapa posterior. Não é uma solução de produção.

## Restrições
Não há cobranças por mensagem desta biblioteca, mas pode haver gastos de infraestrutura caso se opte por hospedar, o que não é necessário aqui. Não há vendas, endereços ou pagamentos reais, nem integração com MVC legado. O sistema é local e sem autenticação; não o exponha na internet.
