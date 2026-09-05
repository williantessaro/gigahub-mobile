import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import MobileLayout from './components/MobileLayout';
import MobilePortal from './pages/MobilePortal';
import MobileKanban from './pages/MobileKanban';
import MobilePredios from './pages/MobilePredios';
import MobileMessages from './pages/MobileMessages';
import MobileClients from './pages/MobileClients';
import MobileGigaMente from './pages/MobileGigaMente';
import MobileLogin from './pages/MobileLogin';

// Mapeia o pathname atual para a página correspondente
const getPageFromPath = (path) => {
  const cleanPath = path.replace(/\/$/, '');
  if (cleanPath.endsWith('/gigacrm/conversas') || cleanPath.endsWith('/meucrm/conversas') || cleanPath.endsWith('/messages')) {
    return 'messages';
  }
  if (cleanPath.endsWith('/gigacrm') || cleanPath.endsWith('/meucrm') || cleanPath.endsWith('/kanban')) {
    return 'gigacrm';
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
  return 'portal';
};

// Mapeia a página interna para o pathname correspondente
const getPathFromPage = (page) => {
  switch (page) {
    case 'messages':
      return '/mobile/gigacrm/conversas';
    case 'gigacrm':
    case 'meucrm':
    case 'kanban':
      return '/mobile/gigacrm';
    case 'clients':
      return '/mobile/clients';
    case 'gigamente':
      return '/mobile/gigamente';
    case 'predios':
      return '/mobile/predios';
    case 'portal':
    default:
      return '/mobile';
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
        if (isChildModalActiveRef.current) {
          // Se houver modal ou chat do lead aberto, fecha o modal primeiro
          setIsChildModalActive(false);
        } else if (currentPageRef.current !== 'portal') {
          // Se estiver em uma tela secundária (Meu CRM, GigaMente, etc.), volta para o Portal
          navigateTo('portal');
        } else {
          // Se estiver na tela inicial do Portal, minimiza/sai do app
          CapApp.exitApp();
        }
      }).then(handle => {
        backListener = handle;
      });
    } catch (err) {
      console.warn('Capacitor App BackButton listener não disponível:', err);
    }

    // Escuta o botão voltar/avançar padrão da History API (popstate)
    const handlePopState = () => {
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    if (!token) {
      token = localStorage.getItem('crm-token') || localStorage.getItem('portal_token') || localStorage.getItem('token');
    }

    if (!token) {
      setChecking(false);
      return;
    }

    localStorage.setItem('crm-token', token);

    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
          localStorage.setItem('crm-user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('crm-token');
          localStorage.removeItem('crm-user');
        }
      })
      .catch(() => {
        localStorage.removeItem('crm-token');
        localStorage.removeItem('crm-user');
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('crm-user', JSON.stringify(userData));
    setCurrentPage('portal');
  };

  const handleLogout = () => {
    localStorage.removeItem('crm-token');
    localStorage.removeItem('crm-user');
    setUser(null);
    setCurrentPage('portal');
  };

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0c', color: '#ff6600'
      }}>
        <div className="animate-pulse" style={{ fontSize: '1.2rem', fontWeight: '700' }}>GigaHub Portal...</div>
      </div>
    );
  }

  if (!user) {
    return <MobileLogin onLogin={handleLogin} />;
  }

  // Telas que possuem layout e cabeçalho próprio
  if (currentPage === 'portal') {
    return <MobilePortal user={user} onNavigate={navigateTo} onLogout={handleLogout} />;
  }

  if (currentPage === 'gigamente') {
    return <MobileGigaMente onNavigate={navigateTo} />;
  }

  if (currentPage === 'gigacrm' || currentPage === 'meucrm' || currentPage === 'kanban') {
    return (
      <MobileKanban 
        onNavigate={navigateTo} 
        onModalStateChange={(isOpen) => setIsChildModalActive(isOpen)} 
      />
    );
  }

  if (currentPage === 'predios') {
    return <MobilePredios onNavigate={navigateTo} />;
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
