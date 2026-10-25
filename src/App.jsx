import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import MobileLayout from './components/MobileLayout';
import SystemBottomBar from './components/SystemBottomBar';
import MobilePortal from './pages/MobilePortal';
import MobileKanban from './pages/MobileKanban';
import MobilePredios from './pages/MobilePredios';
import MobileConsorcios from './pages/MobileConsorcios';
import MobileMessages from './pages/MobileMessages';
import MobileClients from './pages/MobileClients';
import MobileGigaMente from './pages/MobileGigaMente';
import MobileLogin from './pages/MobileLogin';
import { biometricService } from './services/biometricService';

// Mapeia o pathname atual para a página correspondente (Padrão inicial: GigaCRM Kanban)
const getPageFromPath = (path) => {
  const cleanPath = path.replace(/\/$/, '');
  if (cleanPath.endsWith('/gigacrm/conversas') || cleanPath.endsWith('/meucrm/conversas') || cleanPath.endsWith('/messages')) {
    return 'messages';
  }
  if (cleanPath.endsWith('/clients')) {
    return 'clients';
  }
  if (cleanPath.endsWith('/gigamente')) {
    return 'gigamente';
  }
  if (cleanPath.endsWith('/predios')) {
    return 'predios';
  }
  if (cleanPath.endsWith('/consorcios')) {
    return 'consorcios';
  }
  return 'gigacrm';
};

// Mapeia a página interna para o pathname correspondente
const getPathFromPage = (page) => {
  switch (page) {
    case 'messages':
      return '/mobile/gigacrm/conversas';
    case 'clients':
      return '/mobile/clients';
    case 'gigamente':
      return '/mobile/gigamente';
    case 'predios':
      return '/mobile/predios';
    case 'consorcios':
      return '/mobile/consorcios';
    case 'gigacrm':
    case 'meucrm':
    case 'kanban':
    case 'portal':
    default:
      return '/mobile/gigacrm';
  }
};

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [openTagsModalTrigger, setOpenTagsModalTrigger] = useState(0);
  const [isChildModalActive, setIsChildModalActive] = useState(false);

  const currentPageRef = useRef(currentPage);
  const isChildModalActiveRef = useRef(isChildModalActive);
  const childBackHandlerRef = useRef(null);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    isChildModalActiveRef.current = isChildModalActive;
  }, [isChildModalActive]);

  // Navega atualizando o histórico do navegador (History API)
  const navigateTo = (page) => {
    setCurrentPage(page);
    const targetPath = getPathFromPage(page);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Intercepta o botão VOLTAR físico/gesto nativo do Android
  useEffect(() => {
    let backListener = null;

    try {
      CapApp.addListener('backButton', () => {
        if (childBackHandlerRef.current && childBackHandlerRef.current()) {
          return;
        }
        if (isChildModalActiveRef.current) {
          setIsChildModalActive(false);
          return;
        }
        if (
          currentPageRef.current !== 'gigacrm' &&
          currentPageRef.current !== 'meucrm' &&
          currentPageRef.current !== 'kanban' &&
          currentPageRef.current !== 'portal'
        ) {
          navigateTo('gigacrm');
        } else {
          CapApp.exitApp();
        }
      }).then(handle => {
        backListener = handle;
      });
    } catch (err) {
      console.warn('Capacitor App BackButton listener não disponível:', err);
    }

    const handlePopState = () => {
      if (childBackHandlerRef.current && childBackHandlerRef.current()) {
        return;
      }
      const page = getPageFromPath(window.location.pathname);
      setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, []);

  // Autenticação Resiliente e Auto-Relogin com credenciais salvas
  useEffect(() => {
    async function checkSession() {
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('token');

      if (!token) {
        token = localStorage.getItem('crm-token') || localStorage.getItem('portal_token') || localStorage.getItem('token');
      }

      // 1. Se existir token, tentar validar no servidor
      if (token) {
        localStorage.setItem('crm-token', token);
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.user) {
              setUser(data.user);
              localStorage.setItem('crm-user', JSON.stringify(data.user));
              setChecking(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Servidor indisponível ou offline. Usando cache local:', err);
          const cachedUser = localStorage.getItem('crm-user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
              setChecking(false);
              return;
            } catch (e) {}
          }
        }
      }

      // 2. Se o token expirou ou não for válido, tentar auto-login silencioso com credenciais salvas (Lembrar Senha)
      try {
        const creds = await biometricService.getSavedCredentials();
        if (creds.email && creds.password && creds.rememberPassword) {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: creds.email, password: creds.password, recaptchaToken: 'localhost-bypass' })
          });

          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData && loginData.token) {
              localStorage.setItem('crm-token', loginData.token);
              localStorage.setItem('crm-user', JSON.stringify(loginData.user));
              setUser(loginData.user);
              setChecking(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Tentativa de auto-login silencioso falhou:', err);
      }

      // 3. Se nenhuma tentativa funcionar, carregar dados em cache se existirem para não travar
      const cachedUser = localStorage.getItem('crm-user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {}
      }

      setChecking(false);
    }

    checkSession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('crm-user', JSON.stringify(userData));
    setCurrentPage('gigacrm');
  };

  const handleLogout = () => {
    localStorage.removeItem('crm-token');
    localStorage.removeItem('crm-user');
    biometricService.clearCredentials();
    setUser(null);
    setCurrentPage('gigacrm');
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0c', color: '#ff6600'
      }}>
        <div className="animate-pulse" style={{ fontSize: '1.2rem', fontWeight: '700' }}>Giga CRM...</div>
      </div>
    );
  }

  if (!user) {
    return <MobileLogin onLogin={handleLogin} />;
  }

  // Telas principais com rodapé global dos 4 sistemas
  if (currentPage === 'gigamente') {
    return (
      <>
        <MobileGigaMente onNavigate={navigateTo} />
        {!isChildModalActive && <SystemBottomBar currentPage={currentPage} onNavigate={navigateTo} />}
      </>
    );
  }

  if (currentPage === 'predios') {
    return (
      <>
        <MobilePredios onNavigate={navigateTo} />
        {!isChildModalActive && <SystemBottomBar currentPage={currentPage} onNavigate={navigateTo} />}
      </>
    );
  }

  if (currentPage === 'consorcios') {
    return (
      <>
        <MobileConsorcios onNavigate={navigateTo} />
        {!isChildModalActive && <SystemBottomBar currentPage={currentPage} onNavigate={navigateTo} />}
      </>
    );
  }

  if (currentPage === 'gigacrm' || currentPage === 'meucrm' || currentPage === 'kanban' || currentPage === 'portal') {
    return (
      <>
        <MobileKanban 
          user={user}
          onLogout={handleLogout}
          onNavigate={navigateTo} 
          onModalStateChange={(isOpen) => setIsChildModalActive(isOpen)}
          onRegisterBackHandler={(fn) => { childBackHandlerRef.current = fn; }}
        />
        {!isChildModalActive && <SystemBottomBar currentPage="gigacrm" onNavigate={navigateTo} />}
      </>
    );
  }

  // Telas do CRM clássico (Conversas e Clientes)
  return (
    <MobileLayout 
      currentPage={currentPage} 
      onNavigate={navigateTo} 
      onLogout={handleLogout}
      onOpenTags={() => {
        navigateTo('messages');
        setOpenTagsModalTrigger(prev => prev + 1);
      }}
      user={user}
    >
      {currentPage === 'clients' ? (
        <MobileClients onNavigate={navigateTo} />
      ) : (
        <MobileMessages openTagsTrigger={openTagsModalTrigger} user={user} onNavigate={navigateTo} />
      )}
    </MobileLayout>
  );
}

export default App;
