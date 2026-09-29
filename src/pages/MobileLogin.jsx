import React, { useState, useEffect } from 'react';
import { getServerUrl, setServerUrl } from '../main';
import { biometricService } from '../services/biometricService';

const MobileLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('williantessaroo@gmail.com');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(true);
  const [enableBiometricsCheckbox, setEnableBiometricsCheckbox] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverEndpoint, setServerEndpoint] = useState(getServerUrl() || 'https://app.gigahub.site');
  const [showConfig, setShowConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState('');
  
  // Estado para Biometria e Credenciais
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  
  // Modal de ativação biométrica pós-login
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState(null);

  useEffect(() => {
    async function loadSavedState() {
      const creds = await biometricService.getSavedCredentials();

      if (creds.email) setUsername(creds.email);
      if (creds.password && creds.rememberPassword) {
        setPassword(creds.password);
        setHasSavedPassword(true);
      }
      setRememberPassword(creds.rememberPassword);
      setIsBiometricEnabled(creds.biometricEnabled);

      // Se a biometria estiver ativada e tivermos credenciais salvas, solicitar biometria automaticamente ao abrir a tela
      if (creds.biometricEnabled && creds.password && creds.email) {
        handleBiometricLogin(creds.email, creds.password);
      }
    }
    loadSavedState();
  }, []);

  const handleSaveServer = (url) => {
    const target = url || serverEndpoint;
    setServerUrl(target);
    setServerEndpoint(target);
    setConfigStatus(`Servidor ativo: ${target}`);
    setTimeout(() => setConfigStatus(''), 3000);
  };

  const handleBiometricLogin = async (overrideEmail, overridePassword) => {
    const targetEmail = overrideEmail || username;
    const targetPassword = overridePassword || password;

    if (!targetEmail || !targetPassword) {
      setError('Por favor, faça login com e-mail e senha ao menos uma vez para salvar o acesso biométrico.');
      return;
    }

    setLoading(true);
    setError('');

    const success = await biometricService.authenticateBiometric('Autentique-se para entrar no GigaHub');
    if (!success) {
      setLoading(false);
      setError('Autenticação por biometria cancelada. Digite sua senha para entrar.');
      return;
    }

    // Biometria confirmada com sucesso! Fazer login com as credenciais salvas.
    await executeLogin(targetEmail, targetPassword, true);
  };

  const executeLogin = async (emailToUse, passwordToUse, isBiometricFlow = false) => {
    setLoading(true);
    setError('');
    setServerUrl(serverEndpoint);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, password: passwordToUse, recaptchaToken: 'localhost-bypass' })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('crm-token', data.token);

        const shouldEnableBio = isBiometricFlow || isBiometricEnabled || enableBiometricsCheckbox;

        // Salvar as credenciais localmente se a opção lembrar senha ou biometria estiver ativa
        if (rememberPassword || shouldEnableBio) {
          await biometricService.saveCredentials(
            emailToUse,
            passwordToUse,
            rememberPassword,
            shouldEnableBio
          );
        }

        // Se ainda não estava ativada a biometria explicitamente e não veio do fluxo biométrico, exibir o modal amigável
        if (!isBiometricEnabled && !isBiometricFlow && !enableBiometricsCheckbox) {
          setPendingLoginData({ user: data.user, email: emailToUse, password: passwordToUse });
          setShowBiometricModal(true);
          setLoading(false);
        } else {
          onLogin(data.user);
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(username, password, false);
  };

  const handleEnableBiometricPromptResponse = async (enable) => {
    setShowBiometricModal(false);
    if (!pendingLoginData) return;

    if (enable) {
      const bioSuccess = await biometricService.authenticateBiometric('Confirme sua biometria para ativá-la no GigaHub');
      if (bioSuccess) {
        await biometricService.saveCredentials(
          pendingLoginData.email,
          pendingLoginData.password,
          true,
          true
        );
      }
    } else {
      await biometricService.saveCredentials(
        pendingLoginData.email,
        pendingLoginData.password,
        rememberPassword,
        false
      );
    }

    onLogin(pendingLoginData.user);
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
          GigaHub<span style={{ color: 'var(--primary-color, #00a884)', fontSize: '1.2rem', marginLeft: '6px', fontWeight: '600' }}>Business</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Acesse sua central móvel do CRM e GigaMente.
        </p>

        {/* Botão de Biometria rápido (exibido se biometria estiver ativa ou houver senha salva) */}
        {(isBiometricEnabled || hasSavedPassword) && (
          <button
            type="button"
            onClick={() => handleBiometricLogin()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 168, 132, 0.8)',
              background: 'linear-gradient(135deg, rgba(0, 168, 132, 0.4), rgba(0, 92, 75, 0.6))',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 6px 16px rgba(0, 168, 132, 0.25)'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>👆</span> Entrar com Biometria / Rosto
          </button>
        )}

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox"
                id="rememberPassword"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00a884', cursor: 'pointer' }}
              />
              <label htmlFor="rememberPassword" style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', cursor: 'pointer' }}>
                Lembrar minha senha neste celular
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox"
                id="enableBiometricsCheckbox"
                checked={enableBiometricsCheckbox}
                onChange={(e) => setEnableBiometricsCheckbox(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#00a884', cursor: 'pointer' }}
              />
              <label htmlFor="enableBiometricsCheckbox" style={{ fontSize: '0.88rem', color: '#86efac', fontWeight: '500', cursor: 'pointer' }}>
                👆 Activar Biometria / Rosto nos próximos acessos
              </label>
            </div>
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

      {/* Modal de confirmação para ativar biometria */}
      {showBiometricModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            background: '#111b21',
            borderRadius: '16px',
            border: '1px solid rgba(0, 168, 132, 0.5)',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', fontWeight: '700' }}>Ativar Login por Biometria?</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '24px' }}>
              Entrar no GigaHub rapidamente usando a impressão digital ou leitor facial do seu celular.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleEnableBiometricPromptResponse(true)}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#00a884',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                👆 Confirmar e Ativar Biometria
              </button>
              <button
                type="button"
                onClick={() => handleEnableBiometricPromptResponse(false)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Usar apenas senha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileLogin;
