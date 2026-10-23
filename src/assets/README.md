# Arte da cozinha

`restaurant-scene.webp`, `customer-atlas.webp` e `customer-emotions.webp` foram gerados para esta aplicação com a ferramenta de geração de imagens e otimizados para WebP. O cenário não contém interface; os talões, ingredientes, personagens, contadores e ações são elementos do jogo sobrepostos à imagem. O atlas original contém quatro personagens contentes sobre transparência, em quatro colunas; `Customer` apresenta uma coluna de cada vez.

O atlas de emoções mantém os mesmos quatro personagens e a ordem das colunas. Tem duas filas: impacientes em cima e zangados em baixo, sobre transparência. O jogo escolhe a expressão conforme o tempo de espera e mostra temporariamente a expressão contente após uma entrega parcial que recupera paciência.

A referência fornecida pelo utilizador orientou a composição: clientes ao fundo, balcão em perspetiva e preparação em primeiro plano. As imagens da referência não são distribuídas no APK. As três imagens locais são carregadas e descodificadas antes de iniciar o cronómetro da primeira partida, e fazem parte da distribuição offline. Pães, filetes, acompanhamentos, latas e recipientes são ilustrações SVG da interface.
