# Pizzaria Chatbot — A Fornalha

Protótipo acadêmico de atendimento automatizado para pizzaria, desenvolvido em **Node.js**. Permite simular pedidos pelo navegador e testar atendimento individual pelo WhatsApp com uma integração **não oficial**.

> **Atenção:** este sistema é exclusivamente demonstrativo. Não realiza vendas, cobranças, entregas nem controla estoque real. Para testar o WhatsApp, utilize apenas uma conta de testes autorizada, nunca o número comercial da pizzaria.

## 1. O que está incluído

- **79 pizzas**, com ingredientes e preços por tamanho: Broto, Média, Grande e Família.
- **17 bebidas** cadastradas individualmente a partir do cardápio da pizzaria.
- Arquivo oficial em **`assets/cardapio.pdf`**, com cinco páginas. Ele já está no GitHub, então não precisa ser enviado separadamente.
- Atendimento com consulta de sabores, adição de produtos, cálculo de subtotal, carrinho, confirmação fictícia e consulta de pedidos.
- Estoque **simulado de 10 unidades por produto**, reiniciado com o processo.
- Interface web com chat e painel demonstrativo de pedidos.
- Integração opcional com WhatsApp por `whatsapp-web.js` (não oficial).

### Estrutura principal

```text
pizzaria-chatbot/
├── assets/
│   └── cardapio.pdf       # PDF enviado pelo WhatsApp
├── docs/                  # documentação complementar
├── public/
│   ├── index.html         # estrutura da interface web
│   ├── style.css          # aparência da interface
│   └── app.js             # interação do navegador com o servidor
├── src/
│   ├── bot.js             # lógica de atendimento e pedidos
│   ├── cardapio.json      # produtos, ingredientes e preços
│   ├── server.js          # servidor do simulador web
│   └── whatsapp.js        # integração com WhatsApp Web
├── tests/                 # testes automatizados
├── package.json           # comandos npm
└── README.md
```

## 2. Requisitos para executar no Windows

1. Um computador com **Windows 10 ou 11** e conexão com a internet para baixar o projeto e instalar o WhatsApp Web.
2. **Node.js 20 ou superior**, instalado pelo [site oficial](https://nodejs.org/). Recomenda-se uma versão LTS atual.
3. **Visual Studio Code**, opcional, disponível no [site oficial](https://code.visualstudio.com/).
4. **Git**, opcional caso o projeto seja baixado em ZIP, disponível em [git-scm.com](https://git-scm.com/).
5. Para testar o WhatsApp: **um número separado de testes** e outro número autorizado para enviar mensagens à conta conectada.

Depois de instalar o Node.js, feche e reabra o terminal ou VS Code. Abra **Terminal → New Terminal** no VS Code e verifique:

```powershell
node -v
npm.cmd -v
```

Os dois comandos precisam imprimir números de versão. No PowerShell, usamos `npm.cmd` porque algumas configurações do Windows bloqueiam a execução de `npm.ps1`.

Se `node` não for reconhecido, reinicie o VS Code ou verifique se o Node.js foi adicionado ao **PATH** na instalação.

## 3. Baixar o código do GitHub

**Repositório:** https://github.com/JulioYukio/pizzaria-chatbot

### Opção A — download de ZIP (mais simples)

1. Acesse o repositório pelo navegador.
2. Clique em **Code → Download ZIP**.
3. Extraia o arquivo ZIP (não execute os comandos dentro do ZIP).
4. Abra a pasta extraída no VS Code: **File → Open Folder**.
5. Confirme que o arquivo `package.json` está visível na raiz da pasta aberta.

### Opção B — clonar com Git

Abra o PowerShell na pasta em que deseja salvar o projeto:

```powershell
git clone https://github.com/JulioYukio/pizzaria-chatbot.git
cd pizzaria-chatbot
```

Se o comando `git` não for reconhecido, instale o Git ou use a opção ZIP.

**Verifique o PDF:** o arquivo `assets/cardapio.pdf` deve existir dentro da pasta baixada.

## 4. Rodar os testes automatizados (antes de iniciar)

No terminal, dentro da pasta que contém `package.json`, execute:

```powershell
npm.cmd test
```

O script executa `node --test`. Confira o resumo final: a quantidade de testes com falha deve ser **0**. Esses testes simulam o motor de pedidos e eventos de WhatsApp; **não** confirmam uma conexão real com o WhatsApp.

Se aparecer um erro, copie a mensagem completa do terminal para investigar antes de continuar.

## 5. Iniciar o simulador no navegador

Na mesma pasta do projeto, execute:

```powershell
npm.cmd start
```

Você deverá ver algo semelhante a:

```text
Demonstração: http://127.0.0.1:3000
```

Abra no navegador desse computador: **http://127.0.0.1:3000**.

O servidor usa a interface de loopback `127.0.0.1`: o endereço funciona **somente no próprio computador**, não no celular ou em outro PC da rede.

### Teste rápido do pedido

1. No chat do simulador, envie `oi` para abrir o menu.
2. Envie `2` (**Fazer pedido**).
3. Envie `1` (**Pizzas**).
4. Envie `16 grande 2` — duas Calabresas grandes.
5. Confira que o parcial é **R$ 134,00** (R$ 67,00 cada no PDF atualizado).
6. Envie `2` para **Finalizar pedido**.
7. Confira o resumo e envie `1` para **Confirmar pedido fictício**.
8. O sistema deverá mostrar um código semelhante a `P001`.
9. Para consultar, envie `3` na tela do menu e informe o código do pedido criado **na mesma conversa**.

O painel web consulta os pedidos gerados por esse próprio simulador. Ao reiniciar o servidor, a memória de pedidos é apagada.

**Observação:** o simulador web apresenta o cardápio em **texto**. O envio automático do arquivo PDF está implementado no módulo separado do **WhatsApp**, não na interface web.

### Consultar somente o PDF

Na tela inicial, digite `1`. O WhatsApp envia o PDF e o bot exibe somente:

```text
Tamanhos: B/Broto, M/Média, G/Grande, F/Família.
Exemplo: 31 G (Jardineira grande)
Digite 'menu' para voltar.
```

Nesta tela não há seleção de categoria, quantidade ou adição ao carrinho. Para pedir, use `menu` → `2 - Fazer pedido`.

### Outras formas de pedir

- `16 G 2` ou `16 grande 2`: informa produto, tamanho e quantidade de uma vez.
- `16`: mostra ingredientes e preços e pergunta tamanho e quantidade.
- `16 média`: pergunta apenas a quantidade.
- **1 - Ver cardápio:** no WhatsApp, envia o PDF e as instruções de tamanhos; não realiza pedidos nessa opção. Para comprar, digite `menu` e selecione `2 - Fazer pedido`.
- `34 medoi 3`: o bot sugere **MÉDIA**, mas exige que o cliente reenvie a opção corrigida.
- `menu` ou `reiniciar`: volta ao início e descarta o carrinho atual.
- Fora da tela de visualização do catálogo, `0` também reinicia a conversa.

Para encerrar o simulador no terminal, pressione **Ctrl+C**.

## 6. Instalar as dependências do WhatsApp (opcional)

O simulador web **não precisa** das bibliotecas externas de WhatsApp. Para testar o atendimento no WhatsApp, abra um **segundo terminal** na pasta do projeto e execute:

```powershell
npm.cmd install whatsapp-web.js qrcode-terminal
```

Essa instalação pode baixar componentes necessários para controlar um navegador. Aguarde o fim do comando e observe possíveis mensagens de erro. Uma instalação bem-sucedida cria a pasta local `node_modules`.

> O `whatsapp-web.js` é uma biblioteca **não oficial**, que depende do funcionamento do WhatsApp Web. Pode apresentar falhas após mudanças na plataforma, desconexões ou **bloqueio da conta**. Não há garantia de disponibilidade contínua. Use somente um número de testes autorizado.

## 7. Conectar o WhatsApp de testes

Com as dependências instaladas e na pasta do projeto, execute:

```powershell
npm.cmd run whatsapp
```

1. Observe o **QR Code** que deverá aparecer no terminal.
2. No celular que utiliza o **número de testes**, abra o WhatsApp.
3. Acesse **Dispositivos conectados → Conectar dispositivo** (a nomenclatura pode variar entre Android e iPhone).
4. Escaneie o QR Code apresentado no computador.
5. Aguarde a mensagem do terminal:

```text
WhatsApp de teste conectado. Respostas somente a mensagens privadas recebidas.
```

**Não escaneie o QR Code com uma conta de WhatsApp que não deva ser usada no teste.** A autenticação cria uma sessão local, normalmente salva em `.wwebjs_auth/`; não copie nem publique essa pasta.

O bot deve permanecer em execução com o **computador ligado** e o terminal aberto. Para interromper, pressione **Ctrl+C**. Se a sessão continuar válida, o próximo início pode não exigir novo QR Code.

### O que o bot responde e o que ele ignora

- Responde a **mensagens privadas de texto** recebidas pela conta de teste.
- Ignora mensagens dos **grupos** e mensagens enviadas pela própria conta.
- Envia `assets/cardapio.pdf` como **documento** somente ao selecionar `1 - Ver cardápio` no menu principal.
- Comandos de reinício, como `menu`, não reenviam o PDF automaticamente.
- Envia o PDF somente se o arquivo existir com o nome e caminho exatos `assets/cardapio.pdf`.

## Ajuste de compatibilidade do envio do PDF (WhatsApp)

Se o WhatsApp conectar, mas ao selecionar **1 - Ver cardápio** aparecer
`Data passed to getter must include an id property`, trata-se de uma falha
conhecida em algumas versões do `whatsapp-web.js` quando envia mídia.
Referência: https://github.com/wwebjs/whatsapp-web.js/issues/201922

O comando `npm.cmd run whatsapp` agora executa antes um **ajuste local e
idempotente**, em versões reconhecidas da biblioteca instalada. O ajuste aplica
a correção pública `delete message.__x_id;` na construção da mensagem de
mídia, sem modificar os arquivos do nosso chatbot. Em versões diferentes
a correção é ignorada com aviso, para evitar alterações incompatíveis.

Se mesmo assim o envio falhar, o bot informa que não conseguiu enviar o PDF
e **continua o atendimento por texto**, permitindo escolher a categoria e pedir
normalmente. Se houver erro na resposta com citação, o bot tenta responder
como mensagem simples. O projeto ainda precisa ser testado numa conexão real.

### Nome do dispositivo conectado

O `src/whatsapp.js` usa `deviceName` conforme o sistema operacional que
executa o Node.js: `Windows`, `macOS` ou `Linux`, com navegador `Chrome`.
Isso **não muda o sistema operacional real** nem necessariamente renomeia uma
sessão **já vinculada**. Se a identificação antiga continuar aparecendo,
confirme qual sessão pertence ao bot, encerre o programa com **Ctrl+C**,
desconecte **apenas essa sessão** em WhatsApp → Dispositivos conectados,
e inicie novamente `npm.cmd run whatsapp` para escanear o novo QR Code.

### Personalizar as mensagens de atendimento

As falas ficam principalmente em **`src/bot.js`**:

- `menu()`: saudação e menu inicial.
- `fazerPedido()`: escolha da categoria e instruções.
- `listar(tipo)`: apresentação da lista de sabores.
- `adicionar(...)`: item adicionado, preço parcial e próximos passos.
- `falar(...)`: demais perguntas, validações, confirmação e consulta.

Em **`src/whatsapp.js`** ficam a legenda do PDF e os avisos específicos
do WhatsApp. Edite **apenas os textos entre aspas**: não altere variáveis,
condições, operações de preço ou códigos. Alguns testes validam partes das
mensagens; depois de editar rode `npm.cmd test`.

## 8. Teste completo no WhatsApp

Use **outro telefone / outra conta de WhatsApp autorizada** para mandar mensagens privadas ao número que foi conectado no passo anterior.

| Mensagem enviada pelo cliente | Resultado esperado |
| --- | --- |
| `oi` | Exibe o menu inicial |
| `1` | Envia o PDF e mostra apenas as instruções de tamanho |
| `menu` | Retorna ao menu inicial |
| `2` | Abre Fazer pedido e solicita categoria |
| `1` | Mostra a lista de pizzas em texto para realizar pedido |
| `16 grande 2` | Adiciona duas Calabresas grandes: R$ 134,00 |
| `2` | Mostra o resumo com a opção de finalizar |
| `1` | Confirma um pedido **fictício**, como `P001` |
| `3` | No menu, solicita o código para consulta |
| `P001` | Consulta o pedido na **mesma conversa**, se o número existir |

Para testar o tratamento de erros, inicie outro pedido e envie `34 medoi 3`: a resposta deve sugerir **MÉDIA**, sem adicionar um item incorreto.

### Atenção ao código 109 duplicado

O PDF oficial imprime **109** tanto para M&M's quanto para Churros. Para evitar um pedido errado, o chatbot diferencia:

- `109M G 1` → M&M's grande.
- `109C G 1` ou `120 G 1` → Churros grande.
- `109 G 1` → pede esclarecimento.

A pizzaria deve corrigir essa duplicidade na arte original antes de um eventual uso comercial.

## 9. Problemas comuns e soluções

| Sintoma | O que verificar |
| --- | --- |
| `node` ou `npm.cmd` não reconhecido | Instale/reinstale o Node.js e reabra o terminal. |
| `npm.ps1` bloqueado pelo PowerShell | Utilize **`npm.cmd`**, como indicado neste guia. |
| `Cannot find module 'whatsapp-web.js'` | Execute `npm.cmd install whatsapp-web.js qrcode-terminal` na pasta do projeto. |
| `package.json` não encontrado | Abra o terminal na pasta raiz correta do projeto. |
| A página localhost não abre | Confirme que `npm.cmd start` está em execução e use `http://127.0.0.1:3000` no mesmo PC. |
| Porta `3000` ocupada | Encerre o servidor anterior com **Ctrl+C** ou, no PowerShell, inicie com `$env:PORT=3001; npm.cmd start` e acesse a porta 3001. |
| QR Code não aparece | Verifique os erros do terminal, a instalação das dependências e a capacidade de iniciar o navegador automatizado. |
| QR Code aparece, mas não conecta | Confirme acesso à internet e tente novamente com a conta de testes. Veja os erros exibidos pelo terminal. |
| Bot conectado, mas não responde | Envie **mensagem privada de texto** de outro número; grupos, mensagens próprias e outros tipos de mensagem são ignorados. |
| PDF não chega | Confirme `assets/cardapio.pdf` na pasta local e observe as mensagens de erro no terminal. |
| Pedido não aparece no painel web | Os processos do WhatsApp e do simulador mantêm **memórias separadas**. |
| Pedidos desapareceram | O armazenamento é somente em memória e é perdido ao reiniciar o processo. |

## 10. Como obter atualizações do GitHub

Se o projeto foi **clonado com Git**, abra um terminal na pasta e rode:

```powershell
git pull origin main
```

Se foi baixado como **ZIP**, baixe uma nova cópia pelo botão **Code → Download ZIP** e extraia novamente. Guarde eventuais alterações locais feitas por você antes de substituir arquivos.

Não é necessário reenviar manualmente o PDF: ele já faz parte do repositório.

## 11. Limitações atuais e segurança

- **Não existe banco de dados**: os pedidos são perdidos ao reiniciar cada processo.
- **Não existe venda real**, pagamento, entrega ou confirmação com a pizzaria.
- O painel web demonstra **somente os pedidos feitos pelo simulador web**; não recebe automaticamente os do WhatsApp.
- O sistema web **não possui login/autenticação** e se limita ao uso local. **Não exponha o servidor à internet.**
- O estoque de 10 unidades por produto é fictício.
- O sistema não está integrado ao MVC de outro semestre.
- Não há suporte a conversas de grupo nem a processamento de mensagens de áudio.
- A conexão pelo `whatsapp-web.js` deve ser tratada exclusivamente como **experimento acadêmico**. Não utilize o número comercial.

## 12. Arquivos úteis para estudar o projeto

- [`src/bot.js`](src/bot.js) — estados da conversa, carrinho, validação e pedidos.
- [`src/cardapio.json`](src/cardapio.json) — dados das pizzas e bebidas.
- [`src/server.js`](src/server.js) — servidor e endpoints do simulador.
- [`src/whatsapp.js`](src/whatsapp.js) — conexão e envio de respostas do WhatsApp.
- [`tests/bot.test.js`](tests/bot.test.js) — testes das regras de pedidos.
- [`tests/whatsapp.test.js`](tests/whatsapp.test.js) — simulação de mensagens e envio de mídia.
- [`docs/cardapio.md`](docs/cardapio.md) — observações sobre o documento oficial.
- [`docs/whatsapp.md`](docs/whatsapp.md) — documentação complementar.

---

**Sequência recomendada para apresentação:** baixar o projeto → verificar `node -v` → rodar `npm.cmd test` → iniciar `npm.cmd start` e simular um pedido → instalar as dependências opcionais → iniciar `npm.cmd run whatsapp` → escanear o QR Code com a conta de testes → testar o recebimento do PDF e um pedido fictício.
