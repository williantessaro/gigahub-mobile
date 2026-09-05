import React, { useState, useRef, useEffect } from 'react';

const MobileLayout = ({ children, currentPage, onNavigate, onLogout, onOpenTags, user }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (currentPage === 'gigamente') {
    return (
      <div className="page-container" style={{ background: '#0b141a' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="header">
        <div style={{ fontWeight: '700', fontSize: '1.25rem', color: '#e9edef', letterSpacing: '0.2px' }}>
          GigaHub<span style={{ color: 'var(--primary-color)', fontSize: '0.8rem', marginLeft: '4px', fontWeight: '500', verticalAlign: 'super' }}>Business</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#8696a0' }}>
          {/* Ícone de Câmera decorativo */}
          <svg style={{ width: '22px', height: '22px', cursor: 'pointer' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          
          {/* Ícone de Busca decorativo */}
          <svg style={{ width: '22px', height: '22px', cursor: 'pointer' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          
          {/* Menu Dropdown de 3 pontos */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={menuRef}>
            <svg 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: '22px', height: '22px', cursor: 'pointer', color: menuOpen ? 'var(--primary-color)' : '#8696a0' }} 
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
            
            {menuOpen && (
              <div className="wa-dropdown-menu">
                <div 
                  className="wa-dropdown-item" 
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenTags) onOpenTags();
                  }}
                >
                  Etiquetas
                </div>
                <div 
                  className="wa-dropdown-item" 
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Desconectar
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <nav className="bottom-nav">
        <div 
          className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          {/* Ícone de Loja (Ferramentas) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7H4L2 12h20l-2-5z" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M12 12v6" />
            <path d="M9 12v3a3 3 0 0 0 6 0v-3" />
          </svg>
          <span>Ferramentas</span>
        </div>
        
        <div 
          className={`nav-item ${currentPage === 'messages' ? 'active' : ''}`}
          onClick={() => onNavigate('messages')}
        >
          {/* Ícone de Conversa */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
          </svg>
          <span>Conversas</span>
        </div>
        
        <div 
          className={`nav-item ${currentPage === 'clients' ? 'active' : ''}`}
          onClick={() => onNavigate('clients')}
        >
          {/* Ícone de Clientes */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Clientes</span>
        </div>

        <div 
          className={`nav-item ${currentPage === 'gigamente' ? 'active' : ''}`}
          onClick={() => onNavigate('gigamente')}
        >
          {/* Ícone do GigaMente (IA / Brilho) */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span>GigaMente</span>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
