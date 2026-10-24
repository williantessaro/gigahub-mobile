import React from 'react';

const SYSTEMS = [
  {
    id: 'gigacrm',
    name: 'Giga CRM',
    icon: '🎯',
    activeColor: '#ff6600',
    activeBg: 'rgba(255, 102, 0, 0.16)',
    activeBorder: 'rgba(255, 102, 0, 0.5)'
  },
  {
    id: 'gigamente',
    name: 'GigaMente',
    icon: '🧠',
    activeColor: '#38bdf8',
    activeBg: 'linear-gradient(145deg, rgba(99, 102, 241, 0.22) 0%, rgba(6, 182, 212, 0.14) 100%)',
    activeBorder: 'rgba(99, 102, 241, 0.55)',
    isGlow: true
  },
  {
    id: 'predios',
    name: 'Gestor Prédios',
    icon: '🏢',
    activeColor: '#ff8800',
    activeBg: 'rgba(255, 136, 0, 0.16)',
    activeBorder: 'rgba(255, 136, 0, 0.5)'
  },
  {
    id: 'consorcios',
    name: 'Gestor Consórcios',
    icon: '🤝',
    activeColor: '#10b981',
    activeBg: 'rgba(16, 185, 129, 0.16)',
    activeBorder: 'rgba(16, 185, 129, 0.5)'
  }
];

export default function SystemBottomBar({ currentPage, onNavigate }) {
  const normalizedCurrent =
    currentPage === 'meucrm' || currentPage === 'kanban' || currentPage === 'portal'
      ? 'gigacrm'
      : currentPage;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0a0a0c',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 10px calc(8px + env(safe-area-inset-bottom, 0px))',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        zIndex: 400,
        boxShadow: '0 -6px 24px rgba(0, 0, 0, 0.65)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {SYSTEMS.map((sys) => {
        const isActive = normalizedCurrent === sys.id;

        return (
          <button
            key={sys.id}
            type="button"
            onClick={() => onNavigate(sys.id)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '7px 4px',
              borderRadius: '12px',
              border: isActive
                ? `1px solid ${sys.activeBorder}`
                : '1px solid rgba(255, 255, 255, 0.07)',
              background: isActive
                ? sys.activeBg
                : 'rgba(255, 255, 255, 0.03)',
              color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'all 0.18s ease',
              boxShadow: isActive && sys.isGlow
                ? '0 4px 14px rgba(99, 102, 241, 0.25)'
                : isActive
                ? '0 4px 12px rgba(0, 0, 0, 0.35)'
                : 'none'
            }}
          >
            {/* Linha superior de destaque (estilo card do Portal) */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: sys.isGlow
                    ? 'linear-gradient(90deg, #6366f1, #06b6d4)'
                    : sys.activeColor
                }}
              />
            )}

            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{sys.icon}</span>

            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: isActive ? '800' : '600',
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'
              }}
            >
              {sys.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
