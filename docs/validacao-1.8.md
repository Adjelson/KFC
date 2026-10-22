# Validação da versão 1.8

- `npm test`: 28 testes passaram.
- `npm run test:e2e -- --workers=3`: 47 testes passaram no Chromium.
- `npm run build`: compilação web concluída.
- `npm run android:apk`: compilação Android concluída e assinatura verificada; versão 1.8, código 10, pacote `pt.treinomontagem.app`.
- Os três ficheiros de distribuição web incluídos no APK coincidem byte a byte com `dist`.
- O certificado SHA-256 coincide com o APK 1.7, permitindo atualizar a instalação existente.

A interface foi verificada em 320 × 568, 390 × 844, 740 × 360 e 1024 × 768. Os testes novos cobrem montagens independentes ao trocar de cliente, pausa de todos os relógios, clientes simultâneos, bandeja cheia, entregas parciais, quotas, atribuição única de moedas, compras e preferências persistentes, medalhas, planos de recorde idênticos, movimento reduzido e talões de cinco produtos com três clientes sem scroll na cozinha. Os fluxos anteriores de treino, Double, batatas e regresso ao mapa continuam cobertos.

A rotação usa um plugin Capacitor local, registado na atividade Android, e a preferência pode ser desativada nas definições. O código nativo foi compilado, mas a rotação física, a instalação e o desempenho ainda precisam de validação num telemóvel Android real.

As imagens de documentação usam progresso e moedas de demonstração; uma instalação nova começa sem moedas nem melhorias.
