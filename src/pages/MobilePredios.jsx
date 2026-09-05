import React, { useState } from 'react';

const PREDIOS_MOCK = [
  { id: 1, nome: 'Residencial Bela Vista', endereco: 'Av. Paulista, 1200 - SP', unidades: 48, ocupacao: '96%', inadimplencia: '2.1%', status: 'Regular' },
  { id: 2, nome: 'Condomínio Solar das Flores', endereco: 'Rua das Palmeiras, 450 - SP', unidades: 32, ocupacao: '100%', inadimplencia: '0%', status: 'Excelente' },
  { id: 3, nome: 'Edifício Central Tower', endereco: 'Rua Augusta, 800 - SP', unidades: 64, ocupacao: '88%', inadimplencia: '4.5%', status: 'Atenção' }
];

export default function MobilePredios({ onNavigate }) {
  const [predios] = useState(PREDIOS_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('predios'); // 'predios', 'manutencoes', 'inquilinos'

  const filtered = predios.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.endereco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0c',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header com Botão Voltar ao Portal */}
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
              color: '#ff8800',
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
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>Gestor Prédios</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Condomínios e Manutenções</p>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          padding: '4px 8px',
          background: 'rgba(255, 136, 0, 0.15)',
          color: '#ff8800',
          borderRadius: '6px',
          fontWeight: '600'
        }}>
          {predios.length} Prédios
        </span>
      </div>

      {/* Abas */}
      <div style={{
        display: 'flex',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 12px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('predios')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'predios' ? '#ff6600' : 'transparent',
            color: activeTab === 'predios' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          🏢 Prédios
        </button>
        <button
          onClick={() => setActiveTab('inquilinos')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'inquilinos' ? '#ff6600' : 'transparent',
            color: activeTab === 'inquilinos' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          👥 Unidades
        </button>
        <button
          onClick={() => setActiveTab('manutencoes')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'manutencoes' ? '#ff6600' : 'transparent',
            color: activeTab === 'manutencoes' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: '600',
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          🛠️ Manutenções
        </button>
      </div>

      {/* Busca */}
      <div style={{ padding: '12px 16px 8px' }}>
        <input
          type="text"
          placeholder="Buscar prédio por nome ou endereço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '0.85rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Lista de Prédios */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {filtered.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>{p.nome}</h3>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>📍 {p.endereco}</div>
              </div>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: p.status === 'Excelente' ? 'rgba(52,211,153,0.15)' : 'rgba(255,102,0,0.15)',
                color: p.status === 'Excelente' ? '#34d399' : '#ff8800',
                fontWeight: '600'
              }}>
                {p.status}
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Unidades</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{p.unidades}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Ocupação</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#34d399' }}>{p.ocupacao}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>Inadimplência</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: p.inadimplencia === '0%' ? '#34d399' : '#f87171' }}>{p.inadimplencia}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
