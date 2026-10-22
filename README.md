# Monta & Treina

Simulador de treino para Android, em português de Portugal. Quatro receitas, rondas de 30/60/90 segundos, ingredientes selecionáveis, revisão de erros e recordes por produto e duração guardados no dispositivo. Funciona offline no APK; não usa conta, servidor, análise de utilização ou serviços externos.

## Instalar no telemóvel

[Descarregar o APK de teste para Android](https://github.com/Adjelson/KFC/raw/refs/heads/main/downloads/monta-treino-debug.apk) · Android 7.0 ou superior · 4,1 MB.

Abre o ficheiro no Android e permite a instalação desta origem, se solicitado. A assinatura do APK foi verificada; ainda não foi feita validação num telemóvel real.

## Desenvolvimento

Node.js 24 e npm 11:

```sh
npm ci
npm run dev
npm test
npm run test:e2e
npm run build
```

Os testes da interface usam Chromium em `/usr/bin/chromium`. Ajustar `playwright.config.js` para o Chromium disponível noutra máquina. O modo de desenvolvimento web requer o servidor Vite; a distribuição Android inclui todos os ficheiros.

## APK Android

Java 21, Python 3, Android SDK plataforma 36 e build-tools 36.0.0. Neste ambiente o SDK encontra-se em `/workspace/android-sdk`. Para outra máquina, definir `ANDROID_HOME`.

```sh
npm run android:apk
```

Este comando compila os recursos web, sincroniza o projeto Capacitor, executa Gradle e verifica a assinatura do APK. Resultado: `artifacts/monta-treino-debug.apk`. A compilação respeita o proxy HTTPS da máquina e mantém a verificação TLS. Dependências, SDK e distribuição Gradle precisam de internet na primeira compilação; o APK não precisa.

O APK é uma versão de teste assinada com chave de desenvolvimento, para instalação direta em Android 7.0 ou superior (SDK mínimo 24). Não é uma publicação na Play Store. Permitir instalação desta origem quando o Android o solicitar. Atualizações do mesmo APK precisam da mesma chave de assinatura; a chave de desenvolvimento não deve ser usada para distribuição pública.

## Receitas e limites do treino

Ingredientes transcritos das descrições fornecidas pelo utilizador:

- Krunch Clássico: pão com sementes, 1 filete de frango, alface, maionese.
- Krunch BBQ: pão mini de sésamo, 1 tender de frango, queijo, molho BBQ.
- O’Cheddar: pão brioche, 1 filete de frango, queijo, bacon, molho cheddar, maionese.
- Clássica: pão com sementes, 1 filete de frango, tomate, alface, maionese.

O jogo avalia a presença dos ingredientes, sem avaliar ordem, gramagens ou número de fatias. Os limites de tempo são regras do jogo, não padrões oficiais de preparação. Os ícones são ilustrativos. Aplicação independente, sem afiliação à KFC.

A contagem continua se a aplicação ficar em segundo plano; a ronda termina ao voltar se o prazo tiver passado. Só rondas concluídas corretamente antes do prazo contam para o recorde. Os recordes são locais e podem desaparecer ao limpar os dados ou desinstalar a aplicação.
