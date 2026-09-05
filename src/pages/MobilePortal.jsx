import React, { useState, useEffect } from 'react';

export default function MobilePortal({ user, onNavigate, onLogout }) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Estados para novo usuário
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newSystems, setNewSystems] = useState(['gigacrm']);
  const [isCreating, setIsCreating] = useState(false);

  const firstName = user?.name ? user.name.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'Usuário');

  const systems = [
    {
      id: 'gigamente',
      name: 'GigaMente',
      description: 'Inteligência Central, Sala de Reunião com IA e Direção do CheckList.',
      icon: '🧠',
      isGlow: true,
      status: 'Ativo'
    },
    {
      id: 'gigacrm',
      name: 'Giga CRM',
      description: 'Gestão Inteligente de Leads e Integração WhatsApp.',
      icon: '🎯',
      iconColor: '#ff6600',
      status: 'Ativo'
    },
    {
      id: 'predios',
      name: 'Gestor Prédios',
      description: 'Administração completa de condomínios e manutenção.',
      icon: '🏢',
      iconColor: '#ff8800',
      status: 'Ativo'
    }
  ];

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setAdminError('');
    try {
      const token = localStorage.getItem('portal_token') || localStorage.getItem('crm-token');
      let res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.users || []);
        setUsersList(list);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAdminError(errData.error || 'Não foi possível carregar os usuários.');
      }
    } catch (err) {
      setAdminError('Erro de conexão ao carregar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenAdmin = () => {
    setShowAdminModal(true);
    fetchUsers();
  };

  const handleToggleSystem = (sysId) => {
    if (newSystems.includes(sysId)) {
      setNewSystems(newSystems.filter(s => s !== sysId));
    } else {
      setNewSystems([...newSystems, sysId]);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !newPassword) return;
    setIsCreating(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      const token = localStorage.getItem('portal_token') || localStorage.getItem('crm-token');
      let res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
          accessible_systems: newSystems
        })
      });

      if (!res.ok) {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            name: newName,
            role: newRole,
            accessible_systems: newSystems
          })
        });
      }

      if (res.ok) {
        setAdminSuccess('Usuário cadastrado com sucesso!');
        setNewEmail('');
        setNewPassword('');
        setNewName('');
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        setAdminError(errData.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      setAdminError('Erro de conexão ao criar usuário');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      backgroundImage: 'radial-gradient(circle at 10% 10%, rgba(255, 102, 0, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(99, 102, 241, 0.05) 0%, transparent 40%)',
      color: '#ffffff',
      padding: '24px 16px 40px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Barra de Ações Topo Direito */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        width: '100%'
      }}>
        {user?.role === 'admin' && (
          <button
            onClick={handleOpenAdmin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <span>⚙️</span> Gestão
          </button>
        )}

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <span>🚪</span> Sair
        </button>
      </div>

      {/* Cabeçalho do Portal */}
      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#ff6600',
          marginBottom: '4px'
        }}>
          GigaHub - Portal
        </div>
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: '800',
          margin: '0 0 6px 0',
          letterSpacing: '-0.5px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>Giga Portal!</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
              <path d="M6 32 L72 18 L94 28 L94 76 L72 84 L6 72 Z" fill="#1e293b" stroke="#f1f5f9" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M72 18 L72 84" stroke="#f1f5f9" strokeWidth="4"/>
              <path d="M14 30.5 L14 73 M22 28.5 L22 74.5 M30 26.5 L30 76 M38 25 L38 77.5 M46 23 L46 79 M54 21.5 L54 80.5 M62 20 L62 82" stroke="#94a3b8" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M73 40 L93 46.5 M73 60 L93 66.5" stroke="#f1f5f9" strokeWidth="3.5"/>
              <path d="M83 23 L83 80" stroke="#f1f5f9" strokeWidth="3"/>
            </svg>
          </span>
        </h1>
        <p style={{
          margin: 0,
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.6)',
          lineHeight: '1.4'
        }}>
          Escolha um dos sistemas disponíveis para você, {firstName}
        </p>
      </div>

      {/* Grid de Cards dos Sistemas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {systems.map((sys) => {
          const isGigaMente = sys.id === 'gigamente';

          return (
            <div
              key={sys.id}
              onClick={() => onNavigate(sys.id)}
              style={{
                position: 'relative',
                borderRadius: '18px',
                padding: '22px 20px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isGigaMente
                  ? 'linear-gradient(145deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%, rgba(20, 20, 28, 0.8) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: isGigaMente
                  ? '1px solid rgba(99, 102, 241, 0.45)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isGigaMente
                  ? '0 8px 24px rgba(99, 102, 241, 0.18)'
                  : '0 4px 16px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Linha de brilho superior no GigaMente */}
              {isGigaMente && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.8)'
                }} />
              )}

              {/* Ícone e Conteúdo */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  fontSize: '2rem',
                  lineHeight: '1',
                  padding: '12px',
                  borderRadius: '14px',
                  background: isGigaMente ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {sys.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      letterSpacing: '-0.3px'
                    }}>
                      {sys.name}
                    </h2>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      color: '#34d399',
                      background: 'rgba(52, 211, 153, 0.12)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {sys.status}
                    </span>
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: '0.86rem',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: '1.45'
                  }}>
                    {sys.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal / Bottom Sheet de Gestão de Usuários */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#161b22',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid rgba(255,255,255,0.12)',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header do Modal */}
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>⚙️ Gestão de Usuários e Permissões</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                  Controle de acessos aos sistemas GigaHub
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Formulário Novo Usuário */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: '600', color: '#ff6600' }}>
                  + Cadastrar Novo Usuário
                </h4>

                <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="email"
                    placeholder="E-mail de Acesso"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={inputStyle}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={inputStyle}
                    required
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Cargo:</span>
                    <button
                      type="button"
                      onClick={() => setNewRole('user')}
                      style={{
                        ...roleBtnStyle,
                        background: newRole === 'user' ? '#00a884' : 'rgba(255,255,255,0.08)'
                      }}
                    >
                      Operador (User)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('admin')}
                      style={{
                        ...roleBtnStyle,
                        background: newRole === 'admin' ? '#6366f1' : 'rgba(255,255,255,0.08)'
                      }}
                    >
                      Admin
                    </button>
                  </div>

                  <div style={{ marginTop: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                      Sistemas Permitidos:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'gigamente', label: '🧠 GigaMente' },
                        { id: 'gigacrm', label: '🎯 Giga CRM' },
                        { id: 'predios', label: '🏢 Gestor Prédios' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleSystem(item.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: newSystems.includes(item.id) ? 'rgba(255,102,0,0.25)' : 'rgba(255,255,255,0.05)',
                            color: newSystems.includes(item.id) ? '#ff8800' : 'rgba(255,255,255,0.6)',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {newSystems.includes(item.id) ? '✓ ' : ''}{item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {adminError && <div style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '4px' }}>{adminError}</div>}
                  {adminSuccess && <div style={{ color: '#4ade80', fontSize: '0.8rem', marginTop: '4px' }}>{adminSuccess}</div>}

                  <button
                    type="submit"
                    disabled={isCreating}
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: '#ff6600',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isCreating ? 'Salvando...' : 'Salvar Usuário'}
                  </button>
                </form>
              </div>

              {/* Lista de Usuários Existentes */}
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: '600' }}>
                  Usuários Ativos ({usersList.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {usersList.map((u) => (
                    <div
                      key={u.id || u.email}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{u.name || u.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{u.email}</div>
                        <div style={{ fontSize: '0.72rem', color: '#ff8800', marginTop: '2px' }}>
                          Acessos: {Array.isArray(u.accessible_systems) && u.accessible_systems.length > 0
                            ? u.accessible_systems.map(s => {
                                const norm = s === 'meucrm' ? 'gigacrm' : s;
                                if (norm === 'gigamente') return 'GigaMente';
                                if (norm === 'gigacrm') return 'Giga CRM';
                                if (norm === 'predios') return 'Gestor Prédios';
                                return norm;
                              }).join(', ')
                            : 'Todos'}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.1)',
                        color: u.role === 'admin' ? '#818cf8' : 'rgba(255,255,255,0.7)',
                        fontWeight: '600'
                      }}>
                        {u.role === 'admin' ? 'ADMIN' : 'USER'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: '0.85rem',
  boxSizing: 'border-box'
};

const roleBtnStyle = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: 'none',
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: '600',
  cursor: 'pointer'
};
