import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const versionJsonPath = path.join(distDir, 'mobile-version.json');

const VERSION_CODE = 27;
const VERSION_NAME = '2.7.0';
const CHANGELOG = 'Estúdio Giga Vídeos Mobile + Atualização Instantânea OTA sem reinstalar APK';

if (!fs.existsSync(indexHtmlPath)) {
  console.error('[OTA Bootloader] dist/index.html não encontrado.');
  process.exit(1);
}

let html = fs.readFileSync(indexHtmlPath, 'utf8');
const jsMatch = html.match(/assets\/(index-[A-Za-z0-9_-]+\.js)/);
const cssMatch = html.match(/assets\/(index-[A-Za-z0-9_-]+\.css)/);

const scriptFile = jsMatch ? jsMatch[1] : '';
const cssFile = cssMatch ? cssMatch[1] : '';

const versionData = {
  versionCode: VERSION_CODE,
  versionName: VERSION_NAME,
  buildHash: scriptFile || `v${VERSION_CODE}`,
  scriptFile,
  cssFile,
  changelog: CHANGELOG,
  builtAt: new Date().toISOString()
};

fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8');

if (scriptFile) {
  const otaLoaderScript = `<script type="module">
      window.__GIGAHUB_EMBEDDED_VERSION__ = ${VERSION_CODE};
      window.__GIGAHUB_EMBEDDED_BUILD__ = "${scriptFile}";
      window.__GIGAHUB_RUNNING_VERSION__ = ${VERSION_CODE};
      window.__GIGAHUB_RUNNING_BUILD__ = "${scriptFile}";

      (async function bootGigaHubMobile() {
        const localScript = "./assets/${scriptFile}";
        const isNativeApk = window.location.hostname === "localhost" || window.location.hostname === "";
        if (isNativeApk && navigator.onLine !== false) {
          try {
            const rawOta = localStorage.getItem("gigahub_ota_bundle");
            if (rawOta) {
              const ota = JSON.parse(rawOta);
              if (ota && ota.scriptUrl && ota.buildHash && ota.buildHash !== "${scriptFile}" && Number(ota.versionCode || 0) >= ${VERSION_CODE}) {
                if (ota.cssUrl) {
                  const link = document.createElement("link");
                  link.rel = "stylesheet";
                  link.crossOrigin = "anonymous";
                  link.href = ota.cssUrl;
                  document.head.appendChild(link);
                }
                window.__GIGAHUB_RUNNING_VERSION__ = Number(ota.versionCode) || ${VERSION_CODE};
                window.__GIGAHUB_RUNNING_BUILD__ = ota.buildHash;
                await import(/* @vite-ignore */ ota.scriptUrl);
                console.log("[GigaHub OTA] Bundle remoto carregado com sucesso:", ota.buildHash);
                return;
              }
            }
          } catch (err) {
            console.warn("[GigaHub OTA] Falha ao carregar bundle OTA remoto, usando bundle local do APK:", err);
            window.__GIGAHUB_RUNNING_VERSION__ = ${VERSION_CODE};
            window.__GIGAHUB_RUNNING_BUILD__ = "${scriptFile}";
          }
        }
        await import(localScript);
      })();
    </script>`;

  html = html.replace(
    new RegExp(`<script[^>]*src=["']\\.?\\/assets\\/${scriptFile.replace('.', '\\.')}["'][^>]*><\\/script>`),
    otaLoaderScript
  );
  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log(`[OTA Bootloader] Injetado com sucesso em dist/index.html (buildHash: ${scriptFile}, v${VERSION_CODE})`);
}
