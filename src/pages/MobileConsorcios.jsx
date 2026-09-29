import React, { useState, useEffect } from 'react';

const CATEGORY_MAP = {
  PROPERTY: 'Imobiliário',
  VEHICLE: 'Automotivo',
  TRUCK: 'Veículos Pesados',
  MOTORCYCLE: 'Motocicleta',
  EQUIPMENT: 'Equipamentos',
  SERVICE: 'Serviços',
  OTHER: 'Outros'
};

const CATEGORY_REVERSE_MAP = {
  'Imobiliário': 'PROPERTY',
  'Automotivo': 'VEHICLE',
  'Veículos Pesados': 'TRUCK',
  'Motocicleta': 'MOTORCYCLE',
  'Equipamentos': 'EQUIPMENT',
  'Serviços': 'SERVICE',
  'Outros': 'OTHER'
};

const STATUS_MAP = {
  ACTIVE: 'Ativa',
  CONTEMPLATED: 'Contemplada',
  BID_OFFERED: 'Em Lance',
  CANCELLED: 'Cancelada',
  FINISHED: 'Finalizada'
};

export default function MobileConsorcios({ onNavigate }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cotas'); // 'cotas', 'contemplados', 'grupos'

  // Estado para Modal de Inserção / Edição
  const [showModal, setShowModal] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    administrator_name: '',
    group_number: '',
    quota_number: '',
    card_number: '',
    category: 'PROPERTY',
    current_credit: '',
    current_installment: '',
    total_installments: '',
    paid_installments: '',
    status: 'ACTIVE',
    notes: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('portal_token') || localStorage.getItem('crm-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  };

  const fetchCards = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/backend/api/consorcios/cartas', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCards(Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || 'Erro ao carregar consórcios do servidor.');
      }
    } catch (err) {
      console.error('Erro de conexão com API Consórcios:', err);
      setError('Erro de conexão ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleOpenNewModal = () => {
    setEditingCardId(null);
    setFormData({
      administrator_name: '',
      group_number: '',
      quota_number: '',
      card_number: `CARTA-${Date.now().toString().slice(-6)}`,
      category: 'PROPERTY',
      current_credit: '',
      current_installment: '',
      total_installments: '180',
      paid_installments: '0',
      status: 'ACTIVE',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (card) => {
    setEditingCardId(card.id);
    setFormData({
      administrator_name: card.administrator_name || '',
      group_number: card.group_number || card.group_code || '',
      quota_number: card.quota_number || '',
      card_number: card.card_number || '',
      category: card.category || 'PROPERTY',
      current_credit: card.current_credit || card.original_credit || '',
      current_installment: card.current_installment || card.original_installment || '',
      total_installments: card.total_installments || '',
      paid_installments: card.paid_installments || '0',
      status: card.status || 'ACTIVE',
      notes: card.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja remover esta carta de consórcio?')) return;

    try {
      const res = await fetch(`/backend/api/consorcios/cartas/${cardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchCards();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Erro ao excluir carta.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir carta.');
    }
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!formData.current_credit || !formData.current_installment) {
      alert('Por favor, informe ao menos o Valor do Crédito e a Parcela.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        card_number: formData.card_number || `CARTA-${Date.now().toString().slice(-6)}`,
        quota_number: formData.quota_number,
        group_number: formData.group_number,
        category: formData.category,
        original_credit: Number(formData.current_credit || 0),
        current_credit: Number(formData.current_credit || 0),
        original_installment: Number(formData.current_installment || 0),
        current_installment: Number(formData.current_installment || 0),
        total_installments: Number(formData.total_installments || 0),
        paid_installments: Number(formData.paid_installments || 0),
        status: formData.status,
        notes: formData.notes
      };

      const url = editingCardId
        ? `/backend/api/consorcios/cartas/${editingCardId}`
        : '/backend/api/consorcios/cartas';
      const method = editingCardId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        fetchCards();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Erro ao salvar consórcio.');
      }
    } catch (err) {
      alert('Erro de conexão ao salvar consórcio.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = cards.filter(c => {
    const admin = (c.administrator_name || '').toLowerCase();
    const group = (c.group_number || c.group_code || '').toLowerCase();
    const quota = (c.quota_number || c.card_number || '').toLowerCase();
    const cat = (CATEGORY_MAP[c.category] || c.category || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = admin.includes(term) || group.includes(term) || quota.includes(term) || cat.includes(term);

    if (activeTab === 'contemplados') {
      return matchesSearch && (c.status === 'CONTEMPLATED' || c.status === 'Contemplada');
    }
    return matchesSearch;
  });

  const formatMoney = (val) => {
    const num = Number(val || 0);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header do Gestor Consórcios */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: '#161b22',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onNavigate('portal')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#10b981',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Portal
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>Gestor Consórcios</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Base Real de Cotas & Grupos</p>
          </div>
        </div>

        <button
          onClick={handleOpenNewModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
        >
          <span>+</span> Novo Consórcio
        </button>
      </div>

      {/* Abas de Navegação */}
      <div style={{
        display: 'flex',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 12px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('cotas')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'cotas' ? '#10b981' : 'transparent',
            color: activeTab === 'cotas' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          📋 Todas Cotas ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab('contemplados')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'contemplados' ? '#10b981' : 'transparent',
            color: activeTab === 'contemplados' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          🏆 Contempladas
        </button>
      </div>

      {/* Barra de Busca e Atualização */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Buscar por administradora, grupo, cota..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '0.85rem',
            boxSizing: 'border-box'
          }}
        />
        <button
          onClick={fetchCards}
          title="Recarregar dados do servidor"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          🔄
        </button>
      </div>

      {/* Mensagem de Erro / Loading */}
      {error && (
        <div style={{ margin: '0 16px 8px', padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#10b981' }}>
          Carregando consórcios da base real...
        </div>
      ) : (
        /* Lista de Consórcios Reais */
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              Nenhum consórcio encontrado na base de dados.
            </div>
          ) : (
            filtered.map((c) => {
              const statusLabel = STATUS_MAP[c.status] || c.status || 'Ativa';
              const categoryLabel = CATEGORY_MAP[c.category] || c.category || 'Geral';
              const groupCode = c.group_number || c.group_code || 'G-GERAL';
              const quotaNum = c.quota_number || c.card_number;

              return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '700' }}>
                          Grupo {groupCode} {quotaNum ? `• Cota ${quotaNum}` : ''}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                          {categoryLabel}
                        </span>
                      </div>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                        {c.administrator_name || 'Administradora Padrão'}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: c.status === 'CONTEMPLATED' || c.status === 'Contemplada' ? 'rgba(52,211,153,0.15)' : c.status === 'BID_OFFERED' ? 'rgba(251,191,36,0.15)' : 'rgba(59,130,246,0.15)',
                        color: c.status === 'CONTEMPLATED' || c.status === 'Contemplada' ? '#34d399' : c.status === 'BID_OFFERED' ? '#fbbf24' : '#60a5fa',
                        fontWeight: '600'
                      }}>
                        {statusLabel}
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(c)}
                        style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '0.9rem', cursor: 'pointer', padding: '2px 4px' }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteCard(c.id)}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.9rem', cursor: 'pointer', padding: '2px 4px' }}
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Crédito</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#34d399' }}>
                        {formatMoney(c.current_credit || c.original_credit)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Parcela</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>
                        {formatMoney(c.current_installment || c.original_installment)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Parcelas</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#60a5fa' }}>
                        {c.paid_installments || 0}/{c.total_installments || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Inserção e Edição */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>
                {editingCardId ? 'Editar Consórcio' : 'Cadastrar Novo Consórcio'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Administradora</label>
                <input
                  type="text"
                  placeholder="Ex: Cresol, Bradesco, Itaú..."
                  value={formData.administrator_name}
                  onChange={(e) => setFormData({ ...formData, administrator_name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Grupo</label>
                  <input
                    type="text"
                    placeholder="Ex: G-2045"
                    value={formData.group_number}
                    onChange={(e) => setFormData({ ...formData, group_number: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nº da Cota</label>
                  <input
                    type="text"
                    placeholder="Ex: 112"
                    value={formData.quota_number}
                    onChange={(e) => setFormData({ ...formData, quota_number: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={inputStyle}
                >
                  <option value="PROPERTY">Imobiliário</option>
                  <option value="VEHICLE">Automotivo</option>
                  <option value="TRUCK">Veículos Pesados</option>
                  <option value="MOTORCYCLE">Motocicleta</option>
                  <option value="EQUIPMENT">Equipamentos</option>
                  <option value="SERVICE">Serviços</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Valor do Crédito (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="350000.00"
                    value={formData.current_credit}
                    onChange={(e) => setFormData({ ...formData, current_credit: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Valor Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1850.00"
                    value={formData.current_installment}
                    onChange={(e) => setFormData({ ...formData, current_installment: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Parcelas Totais</label>
                  <input
                    type="number"
                    placeholder="180"
                    value={formData.total_installments}
                    onChange={(e) => setFormData({ ...formData, total_installments: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Parcelas Pagas</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.paid_installments}
                    onChange={(e) => setFormData({ ...formData, paid_installments: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Status da Cota</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="ACTIVE">Ativa (Aguardando Sorteio)</option>
                  <option value="CONTEMPLATED">Contemplada</option>
                  <option value="BID_OFFERED">Em Lance</option>
                  <option value="FINISHED">Finalizada</option>
                  <option value="CANCELLED">Cancelada</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Observações</label>
                <textarea
                  rows="2"
                  placeholder="Informações adicionais..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                {isSaving ? 'Salvando no Banco Real...' : 'Salvar no Banco de Dados'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: '0.78rem',
  color: 'rgba(255,255,255,0.7)',
  marginBottom: '4px',
  display: 'block'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: '0.85rem',
  boxSizing: 'border-box'
};
