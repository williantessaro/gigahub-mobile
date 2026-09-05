import React, { useState } from 'react';
import { getServerUrl, setServerUrl } from '../main';

const MobileLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('williantessaroo@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverEndpoint, setServerEndpoint] = useState(getServerUrl() || 'https://app.gigahub.site');
  const [showConfig, setShowConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState('');

  const handleSaveServer = (url) => {
    const target = url || serverEndpoint;
    setServerUrl(target);
    setServerEndpoint(target);
    setConfigStatus(`Servidor ativo: ${target}`);
    setTimeout(() => setConfigStatus(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Salva a URL selecionada
    setServerUrl(serverEndpoint);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password, recaptchaToken: 'localhost-bypass' })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('crm-token', data.token);
        onLogin(data.user);
      } else {
        setError(data.error || data.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      const target = getServerUrl() || serverEndpoint;
      setError(`Falha ao conectar no servidor (${target}). Toque em "⚙️ Opções de Servidor" para ajustar.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      background: 'radial-gradient(circle at top right, #005c4b, #0b141a 60%)',
      color: '#fff'
    }}>
      <div className="animate-fade" style={{ maxWidth: '420px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.4rem', margin: '0 0 8px 0', fontWeight: '800', letterSpacing: '-0.5px' }}>
          GigaHub<span style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginLeft: '6px', fontWeight: '600' }}>Business</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px', fontSize: '0.95rem' }}>
          Acesse sua central móvel do CRM e GigaMente.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-input-wrapper">
            <input 
              type="text" 
              placeholder="E-mail"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input-field"
              required
            />
          </div>

          <div className="glass-input-wrapper">
            <input 
              type="password" 
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input-field"
              required
            />
          </div>

          {error && (
            <div style={{
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.82rem',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        {/* Configuração de Servidor */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ⚙️ {showConfig ? 'Ocultar Opções de Servidor' : '⚙️ Servidor: ' + (serverEndpoint.includes('app.gigahub.site') ? 'Hostinger (Nuvem)' : serverEndpoint)}
          </button>

          {showConfig && (
            <div style={{
              marginTop: '14px',
              padding: '16px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'left'
            }}>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                Endereço do Servidor:
              </label>
              <input 
                type="text" 
                value={serverEndpoint}
                onChange={(e) => setServerEndpoint(e.target.value)}
                placeholder="https://app.gigahub.site"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: '10px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSaveServer('https://app.gigahub.site')}
                  style={{ fontSize: '0.75rem', padding: '7px 12px', borderRadius: '6px', background: serverEndpoint === 'https://app.gigahub.site' ? 'var(--primary-color, #00a884)' : 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontWeight: '500' }}
                >
                  ☁️ Hostinger Oficial (app.gigahub.site)
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveServer('http://localhost:3100')}
                  style={{ fontSize: '0.75rem', padding: '7px 12px', borderRadius: '6px', background: serverEndpoint === 'http://localhost:3100' ? 'var(--primary-color, #00a884)' : 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontWeight: '500' }}
                >
                  🔌 USB Local (localhost:3100)
                </button>
              </div>
              {configStatus && (
                <div style={{ color: '#86efac', fontSize: '0.75rem', marginTop: '10px', textAlign: 'center' }}>
                  {configStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;
