# Validação da versão 1.10

- `npm test`: 35 testes passaram.
- `npm run test:e2e -- --workers=3`: 56 testes passaram no Chromium.
- `npm run build`: distribuição web concluída, com cenário, personagens e atlas de emoções em WebP.
- `npm run android:apk`: compilação Android concluída; pacote `pt.treinomontagem.app`, versão 1.10, código 12.
- `apksigner verify --print-certs`: assinatura válida e certificado SHA-256 idêntico ao APK 1.9: `b962e36063b7885ac6dad52a91e3242be5591dc350e5c138cb64d7649a6b00a8`.
- Os seis ficheiros de `dist` coincidem byte a byte com os recursos incluídos no APK.
- Tamanho do APK: 5 083 265 bytes.

Os novos testes verificam que uma instalação nova começa só com pão H1, que as moedas compram ingredientes uma única vez, que o inventário persiste e que as fases só sorteiam produtos preparáveis. A migração preserva os ingredientes anteriormente disponíveis nas instalações com progresso. Bebidas novas requerem compra. As receitas completas são preferidas na campanha assim que os ingredientes permitem prepará-las.

Os testes de interface cobrem relógios e expressões dos três clientes ao mesmo tempo, mudança de cliente sem perder a montagem, recuperação limitada de paciência após entregas parciais, pausa de todos os clientes durante as compras e retoma ao fechar a loja. Também verificam compras das três marcas, bebidas a partir do nível 3, rejeição da marca errada e contadores separados de bebidas e sandes. A lógica impede recuperar tempo com entregas repetidas, depois de expirar ou após concluir o pedido.

O catálogo tem três ingredientes por página, sem scroll, em 320 × 568 e 740 × 360. Foram verificados menus com seis produtos diferentes, navegação entre produtos e as páginas da loja nesses formatos. A restante bateria cobre treino livre, níveis, receitas, Double, batatas, moedas, melhorias, recordes, medalhas, animações e movimento reduzido.

As capturas desta versão foram produzidas a partir da distribuição compilada. `primeiro-servico.png` mostra o início com pão H1; `ingredientes.png` usa 34 moedas de demonstração para mostrar as compras. As capturas de clientes e bebidas usam progresso, ingredientes e moedas de demonstração, com diferentes prazos para apresentar as três expressões. A entrega parcial de uma bebida mostra a recuperação de três segundos.

O APK foi compilado e a assinatura verificada. A instalação, a rotação, os gestos das barras do Android e o desempenho gráfico ainda precisam de validação num dispositivo Android real. O comportamento nativo mantém-se nesta versão; o novo atlas de emoções está incluído no carregamento inicial antes de iniciar os relógios.
