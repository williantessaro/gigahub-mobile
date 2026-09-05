import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Configuração do backend para o app mobile
// Servidor de produção canônico na Hostinger: https://app.gigahub.site
const isNativeApp = window.location.hostname === 'localhost' || window.location.hostname === '';
const PRODUCTION_SERVER_URL = 'https://app.gigahub.site';
const LOCAL_USB_SERVER_URL = 'http://localhost:3100';

export function getServerUrl() {
  if (!isNativeApp) return '';
  return localStorage.getItem('crm_server_url') || PRODUCTION_SERVER_URL;
}

export function setServerUrl(url) {
  if (url) {
    localStorage.setItem('crm_server_url', url.trim().replace(/\/$/, ''));
  }
}

const originalFetch = window.fetch;

async function fetchWithTimeout(url, init, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new Error(`Timeout de conexão (${timeoutMs}ms)`)), timeoutMs);
  
  if (init?.signal) {
    init.signal.addEventListener('abort', () => controller.abort(init.signal.reason));
  }
  
  const mergedInit = { ...init, signal: controller.signal };
  try {
    const res = await originalFetch.call(window, url, mergedInit);
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// Interceptador global de fetch para direcionar requisições para a Hostinger
window.fetch = async function (resource, init) {
  if (typeof resource === 'string' && (resource.startsWith('/api') || resource.startsWith('/backend'))) {
    const currentBase = getServerUrl();
    const primaryUrl = currentBase ? `${currentBase.replace(/\/$/, '')}${resource}` : resource;
    
    try {
      return await fetchWithTimeout(primaryUrl, init, 8000);
    } catch (primaryErr) {
      if (isNativeApp && currentBase !== PRODUCTION_SERVER_URL) {
        // Se falhar em servidor local, tenta a produção na Hostinger
        const fallbackUrl = `${PRODUCTION_SERVER_URL}${resource}`;
        console.warn(`[API Fallback] ${primaryUrl} falhou. Tentando servidor de produção na Hostinger (${fallbackUrl})`);
        try {
          const fallbackRes = await fetchWithTimeout(fallbackUrl, init, 8000);
          setServerUrl(PRODUCTION_SERVER_URL);
          return fallbackRes;
        } catch (fallbackErr) {
          throw new Error(`Falha ao conectar no servidor (${primaryUrl} e ${PRODUCTION_SERVER_URL}).`);
        }
      }
      throw primaryErr;
    }
  }
  return originalFetch.call(this, resource, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
