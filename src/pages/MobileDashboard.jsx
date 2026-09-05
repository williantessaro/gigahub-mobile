import React, { useState, useEffect } from 'react';

const MobileDashboard = () => {
  const [stats, setStats] = useState({
    leadsHoje: 0,
    interacoes: 0,
    taxaEntrega: '99.1%',
    funil: { novo: 0, atendimento: 0, quente: 0, fechado: 0, perdido: 0 }
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('crm-token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const statsRes = await fetch('/backend/api/stats/dashboard?origem=gigacrm', { headers });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(prev => ({ ...prev, ...data }));
        }

        const actRes = await fetch('/backend/api/stats/activity?origem=gigacrm', { headers });
        if (actRes.ok) {
          const acts = await actRes.json();
          setRecentActivities(acts.slice(0, 5).map(a => ({
            phone: a.chatPhone,
            name: a.name || a.chatPhone,
            time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora',
            sender: a.sender
          })));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="animate-fade" style={{ background: 'var(--bg-color)', minHeight: '100%', paddingBottom: '20px' }}>
      {/* Mensagem de Boas-Vindas */}
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>Olá, Bem-vindo!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Métricas e atividade comercial de hoje.</p>
      </div>

      {/* Grid de Métricas Principais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px' }}>
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Novos Leads</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '6px', color: 'var(--text-primary)' }}>{stats.leadsHoje}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-color)', marginTop: '6px', fontWeight: '600' }}>+12% vs ontem</div>
        </div>
        
        <div className="card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Interações</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', marginTop: '6px', color: 'var(--text-primary)' }}>{stats.interacoes}</div>
          <div style={{ fontSize: '0.72rem', color: '#8696a0', marginTop: '6px', fontWeight: '500' }}>Conversas ativas</div>
        </div>
      </div>

      {/* Gráfico do Funil */}
      <div className="card" style={{ padding: '16px', margin: '12px 16px' }}>
        <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Funil de Vendas</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          {Object.entries(stats.funil).map(([key, val]) => (
            <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ height: '50px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', padding: '0 4px' }}>
                <div style={{ 
                  width: '12px', 
                  height: `${Math.max(10, Math.min(100, (val / (Object.values(stats.funil).reduce((a,b)=>a+b,0) || 1)) * 100))}%`, 
                  background: 'var(--primary-color)',
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.85
                }}></div>
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.2px' }}>{key}</div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Atividade Recente */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Atividade Recente</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhuma atividade registrada hoje.</div>
          ) : (
            recentActivities.map((act, i) => (
              <div 
                key={i} 
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'var(--surface-color)',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: act.sender === 'me' ? 'rgba(0,168,132,0.15)' : 'rgba(134,150,160,0.15)',
                  color: act.sender === 'me' ? 'var(--primary-color)' : '#8696a0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '700'
                }}>
                  {act.sender === 'me' ? '↗' : '↙'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{act.phone}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{act.time}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
