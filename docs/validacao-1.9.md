# Validação da versão 1.9

- `npm test`: 28 testes passaram.
- `npm run test:e2e -- --workers=3`: 50 testes passaram no Chromium.
- `npm run build`: distribuição web concluída, incluindo o cenário e o atlas de personagens em WebP.
- `npm run android:apk`: compilação Android concluída; pacote `pt.treinomontagem.app`, versão 1.9, código 11.
- `apksigner verify --print-certs`: assinatura válida e certificado SHA-256 idêntico ao APK 1.8.
- Os cinco ficheiros de `dist` coincidem byte a byte com os recursos incluídos no APK.
- Tamanho do APK: 4 781 963 bytes.

Os testes novos verificam que a cozinha usa toda a largura e altura em 740 × 360 e 1280 × 720, que o cabeçalho fica sobre o cenário, que os recipientes ocupam ambos os lados da montagem, que se pode selecionar cada um dos três clientes sem tapar os controlos e que ajuda, definições e saída continuam acessíveis. Um teste retém o carregamento da imagem de personagens e confirma que o cronómetro só começa depois de a imagem estar disponível. Os testes anteriores continuam a cobrir o formato vertical, treino livre, bandejas com quatro produtos, menus de cinco produtos, contagens, moedas, melhorias, recordes, pausas e animações.

O plugin Android oculta as barras de estado e navegação durante o carregamento e a partida, permite mostrá-las temporariamente com um gesto e volta a ocultá-las ao retomar a partida. Ao sair da cozinha, mostra as barras e liberta a orientação. O código nativo foi compilado; a instalação, os gestos de sistema, a rotação e o desempenho gráfico ainda precisam de validação num dispositivo Android real.

As imagens de documentação são capturas da distribuição compilada, com progresso e moedas de demonstração. Uma instalação nova continua a começar sem moedas nem melhorias; a atualização preserva as chaves existentes de progresso, receitas, contadores e preferências.
