# Validação da versão 1.11

- `npm test`: 36 testes passaram.
- `npm run test:e2e -- --workers=3`: 61 testes passaram no Chromium.
- `npm run android:apk`: distribuição web, sincronização Capacitor e compilação Android concluídas; pacote `pt.treinomontagem.app`, versão 1.11, código 13.
- `apksigner verify --print-certs`: assinatura válida e certificado SHA-256 idêntico ao APK 1.10: `b962e36063b7885ac6dad52a91e3242be5591dc350e5c138cb64d7649a6b00a8`.
- Os seis ficheiros de `dist` coincidem byte a byte com os recursos incluídos no APK. Os únicos outros ficheiros em `assets/public` são os dois ficheiros Cordova gerados pelo Capacitor.
- Tamanho do APK: 5 206 546 bytes.

Os novos testes usam movimentos reais de rato e eventos de toque do Chromium para arrastar produtos até ao cliente, incluindo os formatos 320 × 568 e 740 × 360. Confirmam a rejeição de um destinatário errado, o cancelamento do gesto sem consumir produtos, as entregas parciais e o bónus de paciência. Também verificam que a imagem arrastada tem dimensões adequadas, que não existem os antigos botões de preparar e entregar e que o indicador de capacidade permanece disponível no topo.

A preparação passa a ser automática quando a montagem corresponde à receita. O teste com animações desligadas reproduz dois cliques síncronos no último ingrediente e confirma que apenas uma montagem é contada. A correção lê a montagem atual da referência do serviço em cada toque, em vez de reutilizar os ingredientes da renderização anterior. Quotas, moedas e contadores continuam a ser verificados pelos testes de bandejas, bebidas e pedidos combinados.

Os resultados de vitória e derrota mostram estrelas, clientes servidos e as moedas ganhas. Os testes confirmam que a janela permanece até ser fechada, que o mapa só revela a fase seguinte depois desse gesto, que fechar não volta a pagar o prémio e que uma derrota conserva o dinheiro dos clientes já servidos. Não há reposição das compras ou do progresso anterior.

Os sons de início, conclusão de pedido, vitória e derrota têm sequências distintas. As reações têm três perfis e respeitam som geral, efeitos, volume zero e segundo plano. Os testes verificam que os sons de impaciência e irritação ocorrem nas mudanças de expressão, sem repetição em cada atualização do relógio.

Cada retrato tem um recorte SVG próprio, e a animação de saída apresenta apenas a recompensa em vez de desenhar outro cliente. As capturas da distribuição compilada mostram os recipientes ilustrados: cestos de pão, bandejas de alimentos e bebidas, tigelas com molhos e colher. Os formatos vertical, horizontal e tablet foram inspecionados.

As capturas de cozinha avançada usam inventário e progresso de demonstração. As capturas de vitória e derrota usam os primeiros níveis com pão H1; a derrota mostra moedas ganhas antes de um cliente perder a paciência. `resultado-vitoria-vertical.png` regista também a janela no formato vertical.

O APK foi compilado e a assinatura verificada. A instalação, os gestos de toque no WebView Android, a rotação e o desempenho continuam por confirmar num telemóvel real. Os testes de toque foram executados no Chromium; não substituem esse ensaio. As novas ideias para utilização das moedas estão em `ideias-economia.md` e ainda não estão implementadas.
