import React, { useState, useEffect } from 'react';

const MobileClients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para Modal de Criar Lead
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadStore, setNewLeadStore] = useState('');
  const [newLeadError, setNewLeadError] = useState('');
  const [newLeadLoading, setNewLeadLoading] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch('/backend/api/pessoas?origem=gigacrm', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.map(p => ({
          id: p.id,
          name: p.nome || p.whatsapp,
          phone: p.whatsapp,
          status: p.status,
          ...p
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    setNewLeadError('');
    if (!newLeadPhone.trim()) {
      setNewLeadError('O telefone é obrigatório.');
      return;
    }

    let phone = newLeadPhone.replace(/\D/g, '');
    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone;
    }

    setNewLeadLoading(true);

    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch('/backend/api/pessoas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsapp: phone,
          nome: newLeadName.trim() || phone,
          nome_loja: newLeadStore.trim()
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewLeadPhone('');
        setNewLeadName('');
        setNewLeadStore('');
        loadClients(); // Recarrega a listagem
      } else {
        const data = await res.json();
        setNewLeadError(data.error || 'Erro ao cadastrar lead.');
      }
    } catch (err) {
      setNewLeadError('Erro de conexão.');
    } finally {
      setNewLeadLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone || '').includes(searchTerm) ||
    (c.nome_loja || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ background: 'var(--bg-color)', minHeight: '100%', paddingBottom: '30px' }}>
      {/* Cabeçalho da listagem de Leads */}
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Clientes</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{clients.length} Leads</div>
        </div>
        
        {/* Barra de busca consistente com WhatsApp */}
        <div style={{ 
          background: '#202c33', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '2px 14px',
          border: '1px solid var(--glass-border)'
        }}>
          <svg style={{ width: '18px', height: '18px', color: '#8696a0', marginRight: '8px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Buscar leads no CRM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', color: '#e9edef', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      {/* Listagem de Leads */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Carregando leads...</div>
        ) : filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum lead encontrado</div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="card" style={{ margin: '4px 16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '1.2rem', 
                  color: 'var(--primary-color)', border: '1px solid var(--glass-border)'
                }}>
                  {(client.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div style={{ 
                  fontSize: '0.65rem', fontWeight: '800', padding: '4px 8px', borderRadius: '4px', 
                  background: client.status === 'RESPONDEU' ? 'rgba(0, 168, 132, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: client.status === 'RESPONDEU' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  letterSpacing: '0.3px'
                }}>
                  {client.status || 'NOVO'}
                </div>
              </div>

              <div style={{ fontWeight: '600', fontSize: '0.98rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{client.name}</div>
              {client.nome_loja && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginBottom: '4px', fontWeight: '500' }}>{client.nome_loja}</div>
              )}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>{client.phone}</div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`tel:${client.phone}`} style={{ 
                  flex: 1, padding: '10px', borderRadius: '20px', background: '#2a3942', 
                  textAlign: 'center', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>Ligar</a>
                
                <a 
                  href={`https://wa.me/${String(client.phone).replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    flex: 1, padding: '10px', borderRadius: '20px', background: 'var(--primary-color)', 
                    textAlign: 'center', color: '#111b21', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botão Flutuante (Adicionar Lead) */}
      <button className="wa-fab" onClick={() => setShowAddModal(true)}>
        <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>

      {/* MODAL: Adicionar Novo Lead */}
      {showAddModal && (
        <div className="wa-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddLeadSubmit}>
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">Novo Lead no CRM</h3>
                <span onClick={() => setShowAddModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
              </div>
              <div className="wa-modal-body">
                {newLeadError && (
                  <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' }}>
                    {newLeadError}
                  </div>
                )}
                <div className="wa-form-group">
                  <label>WhatsApp (com DDD)</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 11999998888" 
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="wa-input-text"
                    required
                    autoFocus
                  />
                </div>
                <div className="wa-form-group">
                  <label>Nome do Lead/Contato</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pedro de Souza" 
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    className="wa-input-text"
                  />
                </div>
                <div className="wa-form-group">
                  <label>Nome da Loja/Empresa (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Multimarcas Veículos" 
                    value={newLeadStore}
                    onChange={(e) => setNewLeadStore(e.target.value)}
                    className="wa-input-text"
                  />
                </div>
              </div>
              <div className="wa-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={newLeadLoading}
                  style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  {newLeadLoading ? 'Cadastrando...' : 'Cadastrar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileClients;
