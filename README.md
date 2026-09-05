# GigaHub Mobile 📱

Superfície móvel dedicada do ecossistema GigaHub para gestão de clientes, funil de vendas, conversas de WhatsApp e interação com o assistente **GigaMente**.

Opera com a arquitetura moderna **Capacitor Live Remote**: a casca nativa Android (`site.gigahub.app`) instalada no smartphone conecta-se diretamente ao contêiner em nuvem servido sob `https://mobile.gigahub.site`.

---

## 🚀 Vantagens do Modelo Live Remote

1. **Zero Cabos (Over-The-Air)**: Qualquer alteração comitada e enviada para a branch `main` é automaticamente publicada via GitHub Actions na VPS Hostinger.
2. **Atualização Instantânea**: O app no smartphone atualiza imediatamente no próximo início sem necessidade de downloads manuais de APK.
3. **Poder Nativo Preservado**: Acesso irrestrito ao hardware (microfone de alta fidelidade para o GigaMente, reprodução de áudio, síntese TTS offline do Android e notificações).

---

## 🛠️ Comandos de Desenvolvimento

### Instalação de Dependências
```bash
npm install
```

### Executar em Desenvolvimento Local
```bash
npm run dev
```

### Compilar SPA React
```bash
npm run build
```

---

## 🐳 Execução em Contêiner Docker

O serviço roda em contêiner Nginx Alpine ultra-leve (~25MB), orquestrado pelo Docker Compose e roteado pelo Traefik com SSL automático.

```bash
docker compose up -d --build
```

---

## 📲 Geração da Casca Nativa Android (Uma única vez)

Para gerar a casca APK inicial para o seu smartphone (Poco X7 Pro):

```bash
# 1. Sincronizar configuração do Capacitor
npm run cap:sync

# 2. Compilar APK via Gradle
cd android
./gradlew assembleDebug
```
O arquivo gerado estará em `android/app/build/outputs/apk/debug/app-debug.apk`.
