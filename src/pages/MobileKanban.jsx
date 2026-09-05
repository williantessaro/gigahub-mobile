import React, { useState, useEffect, useRef } from 'react';

// Listas canônicas padrão para cada funil (caso o banco não tenha customizações ainda)
const DEFAULT_VENDAS_LISTS = [
  { id: 'Novo Lead', name: 'Novo Lead', color: '#38bdf8', icon: 'fiber_new' },
  { id: 'Situação (Respondeu)', name: 'Situação (Respondeu)', color: '#eab308', icon: 'explore' },
  { id: 'Problema (P)', name: 'Problema (P)', color: '#818cf8', icon: 'error_outline' },
  { id: 'Solução (N)', name: 'Solução (N)', color: '#2dd4bf', icon: 'lightbulb' },
  { id: 'Fechado / Cliente', name: 'Fechado / Cliente', color: '#22c55e', icon: 'check_circle' }
];

const DEFAULT_POS_VENDAS_LISTS = [
  { id: 'Boas-vindas', name: 'Boas-vindas', color: '#38bdf8', icon: 'waving_hand' },
  { id: 'Integração', name: 'Integração', color: '#f59e0b', icon: 'supervised_user_circle' },
  { id: 'Configuração', name: 'Configuração', color: '#6366f1', icon: 'settings_suggest' },
  { id: 'Concluído', name: 'Concluído', color: '#16a34a', icon: 'check_circle' }
];

export default function MobileKanban({ onNavigate, onModalStateChange }) {
  // Separador de FUNIL: 'vendas' ou 'clientes-inicio' (Pós-Venda)
  const [activeFunnel, setActiveFunnel] = useState('vendas');

  // Categorizador de LISTAS do funil ativo
  const [lists, setLists] = useState(DEFAULT_VENDAS_LISTS);
  const [selectedListId, setSelectedListId] = useState('Novo Lead');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [transferringId, setTransferringId] = useState(null);

  // Estados do Chat Integrado do Lead (Slide-Over / Modal Completo)
  const [activeChatLead, setActiveChatLead] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatEndRef = useRef(null);
  const chatPollRef = useRef(null);

  // Estados de Agendamento de Mensagem
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsgStatus, setScheduleMsgStatus] = useState('');

  // Estados de Gravação de Áudio
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('crm-token') || localStorage.getItem('portal_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Notifica o App se algum modal estiver aberto (para botão Voltar do Android)
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(Boolean(activeChatLead || isScheduleOpen));
    }
  }, [activeChatLead, isScheduleOpen, onModalStateChange]);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const currentOrigem = activeFunnel === 'clientes-inicio' ? 'clientes-inicio' : 'gigacrm';

      // 1. Carregar as LISTAS reais do banco de dados para o Funil ativo
      const stRes = await fetch(`/backend/api/statuses?origem=${currentOrigem}`, { headers: getAuthHeaders() });
      let loadedLists = [];
      if (stRes.ok) {
        const stData = await stRes.json();
        if (Array.isArray(stData) && stData.length > 0) {
          loadedLists = stData.map(s => ({
            id: s.id || s.label,
            name: s.label || s.name || s.id,
            color: s.bg || s.color || '#38bdf8',
            icon: s.icon || 'list'
          }));
        }
      }

      if (loadedLists.length === 0) {
        loadedLists = activeFunnel === 'clientes-inicio' ? DEFAULT_POS_VENDAS_LISTS : DEFAULT_VENDAS_LISTS;
      }

      setLists(loadedLists);
      setSelectedListId(prev => {
        const exists = loadedLists.some(l => l.id === prev);
        return exists ? prev : loadedLists[0].id;
      });

      // 2. Carregar pessoas/leads reais do banco de dados
      const res = await fetch('/backend/api/pessoas?origem=gigacrm', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const activeLeads = Array.isArray(data) ? data.filter(p => 
          p.status !== 'Arquivado' && 
          p.status !== 'arquivado'
        ) : [];
        setLeads(activeLeads);
      }
    } catch (err) {
      console.error('Erro ao sincronizar listas e funil do CRM:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Sincronização contínua em tempo real
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [activeFunnel]);

  // Mensagens do Chat Integrado do Lead
  const loadChatMessages = async (phone, isPolling = false) => {
    if (!phone) return;
    if (!isPolling) setChatLoading(true);

    try {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      const res = await fetch(`/backend/api/chats/${jid}/messages?origem=gigacrm`, { headers: getAuthHeaders() });
      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens do lead:', err);
    } finally {
      if (!isPolling) setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeChatLead) {
      loadChatMessages(activeChatLead.whatsapp);
      chatPollRef.current = setInterval(() => {
        loadChatMessages(activeChatLead.whatsapp, true);
      }, 3500);
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      setChatMessages([]);
    }

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeChatLead]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Mapeamento fidedigno do Lead para a LISTA do Funil selecionado
  const matchLeadToList = (lead, listId) => {
    const isClientesInicio = activeFunnel === 'clientes-inicio';
    const firstListId = lists[0]?.id;

    if (isClientesInicio) {
      // Pertence ao Funil de Pós-Venda
      if (lead.funil !== 'clientes-inicio') return false;
      if (lead.arquivado_clientes === 1) return false;

      const rawStatus = (lead.status || firstListId || 'Boas-vindas').trim().toLowerCase();
      const targetList = String(listId).trim().toLowerCase();

      if (listId === firstListId || targetList.includes('boas-vindas') || targetList.includes('inicio')) {
        return rawStatus === targetList || !lead.status || !lists.some(l => rawStatus === l.id.toLowerCase());
      }
      return rawStatus === targetList;
    } else {
      // Pertence ao Funil de Vendas (padrão)
      if (lead.funil && lead.funil !== 'vendas') return false;
      if (lead.arquivado_vendas === 1) return false;

      const rawStatus = (lead.status || firstListId || 'Novo Lead').trim().toLowerCase();
      const targetList = String(listId).trim().toLowerCase();

      if (listId === firstListId || targetList.includes('novo')) {
        return (
          rawStatus === 'novo lead' ||
          rawStatus === 'novo' ||
          rawStatus === 'enviado' ||
          !lead.status ||
          !lists.some(l => rawStatus === l.id.toLowerCase() || rawStatus === l.name.toLowerCase())
        );
      }

      if (targetList.includes('situa') || targetList.includes('respondeu')) {
        return rawStatus.includes('situa') || rawStatus.includes('respondeu');
      }

      if (targetList.includes('problema')) return rawStatus.includes('problema');
      if (targetList.includes('implica')) return rawStatus.includes('implica');
      if (targetList.includes('solu')) return rawStatus.includes('solu');
      if (targetList.includes('fechado') || targetList.includes('cliente') || targetList.includes('ganho')) {
        return rawStatus.includes('fechado') || rawStatus.includes('cliente') || rawStatus.includes('ganho');
      }
      if (targetList.includes('perdido')) return rawStatus.includes('perdido');

      return rawStatus === targetList;
    }
  };

  const getLeadsForList = (listId) => {
    return leads.filter(lead => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (lead.nome || '').toLowerCase().includes(term);
        const matchesPhone = (lead.whatsapp || '').includes(term);
        const matchesStore = (lead.nome_loja || '').toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesStore) return false;
      }
      return matchLeadToList(lead, listId);
    });
  };

  // Mover lead entre LISTAS do mesmo funil
  const handleMoveList = async (leadId, newListId) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newListId } : l));
    if (activeChatLead && activeChatLead.id === leadId) {
      setActiveChatLead(prev => ({ ...prev, status: newListId }));
    }

    try {
      await fetch(`/backend/api/pessoas/${leadId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newListId })
      });
      loadData(true);
    } catch (err) {
      console.error('Erro ao atualizar lista do lead:', err);
    }
  };

  // Flechinha (➔ / ←) para transferir o Lead para o outro FUNIL
  const handleTransferFunnel = async (e, lead) => {
    e.stopPropagation();

    const isClientesInicio = activeFunnel === 'clientes-inicio';
    const targetFunnel = isClientesInicio ? 'vendas' : 'clientes-inicio';
    const targetLabel = isClientesInicio ? 'Funil de Vendas' : 'Pós-Venda (Clientes)';
    const firstTargetList = isClientesInicio ? 'Novo Lead' : 'Boas-vindas';

    setTransferringId(lead.id);

    // Atualização otimista local
    setLeads(prev => prev.map(l => 
      l.id === lead.id ? { ...l, funil: targetFunnel, status: firstTargetList } : l
    ));

    try {
      const res = await fetch('/backend/api/leads/status', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          whatsapp: lead.whatsapp,
          status: firstTargetList,
          origem: 'gigacrm',
          funnelType: targetFunnel
        })
      });

      if (res.ok) {
        loadData(true);
      }
    } catch (err) {
      console.error('Erro ao transferir lead de funil:', err);
      loadData(true);
    } finally {
      setTransferringId(null);
    }
  };

  // Enviar Mensagem de Texto Diretamente pelo CRM
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeChatLead || isSendingMsg) return;

    const text = chatInputText.trim();
    setChatInputText('');
    setIsSendingMsg(true);

    const cleanPhone = String(activeChatLead.whatsapp).replace(/\D/g, '');
    const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    const tempMsg = {
      id: `temp-${Date.now()}`,
      fromMe: true,
      text,
      timestamp: Date.now() / 1000
    };
    setChatMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/backend/api/chats/${jid}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: text, origem: 'gigacrm' })
      });

      if (res.ok) {
        loadChatMessages(activeChatLead.whatsapp, true);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Gravação e Envio de Áudio no Chat do Lead
  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Seu navegador não suporta gravação de áudio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };

      const recorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Permissão de microfone negada ou erro ao iniciar gravação.');
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const finishAndSendAudio = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioBase64 = reader.result;
        const cleanPhone = String(activeChatLead.whatsapp).replace(/\D/g, '');
        const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

        try {
          await fetch(`/backend/api/chats/${jid}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ audio: audioBase64, origem: 'gigacrm' })
          });
          loadChatMessages(activeChatLead.whatsapp, true);
        } catch (e) {
          console.error('Erro ao enviar áudio do WhatsApp:', e);
        }
      };
      reader.readAsDataURL(audioBlob);

      setIsRecordingAudio(false);
      setRecordingSeconds(0);
    };

    recorder.stop();
  };

  // Agendamento de Mensagem Automática
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleText.trim() || !scheduleDate || !scheduleTime || !activeChatLead) return;

    setScheduleLoading(true);
    setScheduleMsgStatus('');

    const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
    const rawPhone = activeChatLead.whatsapp || activeChatLead.phone;
    const cleanPhone = String(rawPhone || '').split('@')[0].replace(/\D/g, '');

    try {
      const res = await fetch('/backend/api/schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phone: cleanPhone,
          text: scheduleText,
          scheduledAt: new Date(scheduledAt).toISOString(),
          clientId: activeChatLead.id,
          nome: activeChatLead.nome,
          channel_id: activeChatLead.channel_id || null,
          origem: 'gigacrm'
        })
      });

      if (res.ok) {
        setScheduleMsgStatus('✅ Mensagem agendada com sucesso!');
        setTimeout(() => {
          setIsScheduleOpen(false);
          setScheduleText('');
          setScheduleDate('');
          setScheduleTime('');
          setScheduleMsgStatus('');
        }, 1500);
      } else {
        setScheduleMsgStatus('❌ Falha ao agendar mensagem.');
      }
    } catch (err) {
      setScheduleMsgStatus('❌ Erro de conexão ao agendar.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentList = lists.find(l => l.id === selectedListId) || lists[0] || DEFAULT_VENDAS_LISTS[0];
  const currentLeads = getLeadsForList(currentList.id);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a1017',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px',
      position: 'relative'
    }}>
      {/* HEADER SUPERIOR */}
      <header style={{
        padding: '14px 16px 10px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onNavigate('portal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#38bdf8',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Portal
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
                Giga CRM {activeFunnel === 'clientes-inicio' ? '(Pós-Venda)' : '(Vendas)'}
              </h1>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
                Funil de contatos sincronizado com o banco
              </p>
            </div>
          </div>

          <button
            onClick={() => loadData()}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔄 {loading ? '...' : 'Atualizar'}
          </button>
        </div>

        {/* SEPARADOR DE FUNIL (ABAS VENDAS E PÓS-VENDA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '10px'
        }}>
          <button
            onClick={() => setActiveFunnel('vendas')}
            style={{
              padding: '7px 4px',
              borderRadius: '7px',
              border: 'none',
              background: activeFunnel === 'vendas' ? '#ff6600' : 'transparent',
              color: activeFunnel === 'vendas' ? '#fff' : 'rgba(255,255,255,0.7)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🎯</span> Funil de Vendas
          </button>

          <button
            onClick={() => setActiveFunnel('clientes-inicio')}
            style={{
              padding: '7px 4px',
              borderRadius: '7px',
              border: 'none',
              background: activeFunnel === 'clientes-inicio' ? '#ff6600' : 'transparent',
              color: activeFunnel === 'clientes-inicio' ? '#fff' : 'rgba(255,255,255,0.7)',
              fontWeight: '800',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>🤝</span> Pós-Venda (Clientes)
          </button>
        </div>

        {/* BUSCA NO FUNIL */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome, loja ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>
      </header>

      {/* PÍLULAS DE LISTAS REAIS DO FUNIL ATIVO */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        padding: '12px 16px 8px',
        gap: '8px',
        backgroundColor: '#0a1017',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        scrollbarWidth: 'none'
      }}>
        {lists.map((list) => {
          const isSelected = selectedListId === list.id;
          const count = getLeadsForList(list.id).length;

          return (
            <button
              key={list.id}
              onClick={() => setSelectedListId(list.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                border: isSelected ? `1.5px solid ${list.color}` : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? `${list.color}22` : '#1e293b',
                color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                fontSize: '0.82rem',
                fontWeight: isSelected ? '800' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: list.color }} />
              <span>{list.name}</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 7px',
                borderRadius: '999px',
                background: isSelected ? list.color : 'rgba(255,255,255,0.1)',
                color: isSelected ? '#000' : '#fff',
                fontWeight: '800'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LISTA DE CARDS DA LISTA ATIVA */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: currentList.color }} />
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>
              Lista: {currentList.name}
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
            {currentLeads.length} contatos
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Sincronizando lista do funil...
          </div>
        ) : currentLeads.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '16px',
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
            <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Nenhum lead nesta lista</div>
            <div style={{ fontSize: '0.78rem' }}>Mova leads de outras listas ou funis para cá.</div>
          </div>
        ) : (
          currentLeads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setActiveChatLead(lead)}
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                borderRadius: '12px',
                padding: '14px 16px',
                borderLeft: `5px solid ${currentList.color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative'
              }}
            >
              {/* TOPO DO CARD: NOME + FLECHINHA DE TRANSFERÊNCIA DE FUNIL */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', lineHeight: '1.3', flex: 1 }}>
                  {lead.nome || lead.whatsapp || 'Lead Sem Nome'}
                </div>

                {/* FLECHINHA PARA ENVIAR PARA PÓS-VENDA OU VENDAS */}
                <button
                  onClick={(e) => handleTransferFunnel(e, lead)}
                  disabled={transferringId === lead.id}
                  title={activeFunnel === 'clientes-inicio' ? 'Enviar para Funil de Vendas' : 'Enviar para Pós-Venda (Clientes)'}
                  style={{
                    background: activeFunnel === 'clientes-inicio' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 102, 0, 0.15)',
                    border: activeFunnel === 'clientes-inicio' ? '1px solid #38bdf8' : '1px solid #ff6600',
                    color: activeFunnel === 'clientes-inicio' ? '#0284c7' : '#ea580c',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{activeFunnel === 'clientes-inicio' ? '← Vendas' : 'Pós-Venda ➔'}</span>
                </button>
              </div>

              {lead.nome_loja && (
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '600' }}>
                  🏬 {lead.nome_loja}
                </div>
              )}

              {/* Destaque Visual do Copiloto Comercial CReMosa no Mobile */}
              {(() => {
                const desc = lead.description || lead.categoria || '';
                const isCopiloto = desc.includes('💡 [Copiloto CReMosa]');
                const returnDateMatch = desc.match(/(?:retorno|data prevista|agendado para|agendado|geladeira)[:\s]+([0-9]{2}\/[0-9]{2}(?:\/[0-9]{2,4})?|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
                const returnDate = lead.data_retorno || (returnDateMatch ? returnDateMatch[1] : null);

                let copilotoSnippet = null;
                if (isCopiloto) {
                  const afterTag = desc.substring(desc.indexOf('💡 [Copiloto CReMosa]') + 21).trim();
                  copilotoSnippet = afterTag.split('\n\n')[0].replace(/^-\s*/, '').trim();
                }

                return (
                  <>
                    {copilotoSnippet && (
                      <div style={{
                        marginTop: '6px',
                        marginBottom: '6px',
                        padding: '6px 8px',
                        background: 'rgba(234, 179, 8, 0.12)',
                        border: '1px solid rgba(234, 179, 8, 0.35)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        color: '#fef08a',
                        lineHeight: '1.3'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: '#fbbf24', marginBottom: '2px' }}>
                          <span>💡</span>
                          <span>Copiloto CReMosa</span>
                        </div>
                        <div style={{ color: '#fef9c3', fontWeight: '500' }}>
                          {copilotoSnippet}
                        </div>
                      </div>
                    )}

                    {returnDate && (
                      <div style={{
                        marginTop: '4px',
                        marginBottom: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#7dd3fc',
                        fontSize: '0.68rem',
                        fontWeight: '700'
                      }}>
                        <span>❄️ Retorno: {returnDate}</span>
                      </div>
                    )}
                  </>
                );
              })()}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '4px'
              }}>
                <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <span>📞</span>
                  <span>{lead.whatsapp}</span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#0284c7',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '700'
                  }}
                >
                  <span>💬</span> Abrir Chat
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CENTRAL DE CONVERSAS INTEGRADA DO LEAD */}
      {activeChatLead && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0b141a',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* HEADER DO CHAT DO LEAD */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#202c33',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setActiveChatLead(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00a884',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Voltar ao Funil"
              >
                ←
              </button>

              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {activeChatLead.nome || activeChatLead.whatsapp}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8696a0' }}>
                  {activeChatLead.whatsapp} {activeChatLead.nome_loja ? `• ${activeChatLead.nome_loja}` : ''}
                </div>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE LISTA NO TOPO DO CHAT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                value={activeChatLead.status || lists[0]?.id}
                onChange={(e) => handleMoveList(activeChatLead.id, e.target.value)}
                style={{
                  background: '#111b21',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#38bdf8',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '700'
                }}
              >
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              <button
                onClick={() => setIsScheduleOpen(true)}
                style={{
                  background: 'rgba(255, 102, 0, 0.15)',
                  border: '1px solid rgba(255, 102, 0, 0.3)',
                  color: '#ff8800',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Agendar Mensagem"
              >
                📅 Agendar
              </button>
            </div>
          </div>

          {/* LISTA DE MENSAGENS REAIS DO WHATSAPP */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}>
            {chatLoading ? (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 0', fontSize: '0.88rem' }}>
                Carregando histórico do WhatsApp...
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
                <div>Nenhuma mensagem no histórico.</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Envie uma mensagem abaixo para iniciar o atendimento.</div>
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = Boolean(msg.fromMe || msg.sender === 'user' || msg.sender === 'me');

                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '82%',
                      padding: '8px 12px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      backgroundColor: isMe ? '#005c4b' : '#202c33',
                      color: '#e9edef',
                      fontSize: '0.88rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}>
                      {msg.mediaUrl || msg.audioUrl ? (
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>🎙️ Mensagem de Áudio</div>
                          <audio controls src={msg.mediaUrl || msg.audioUrl} style={{ width: '100%', height: '36px' }} />
                        </div>
                      ) : (
                        <div>{msg.text || msg.body || msg.content}</div>
                      )}

                      <div style={{
                        fontSize: '0.65rem',
                        color: isMe ? '#86efac' : '#8696a0',
                        textAlign: 'right',
                        marginTop: '3px'
                      }}>
                        {msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        {isMe && ' ✓✓'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* BARRA DE DIGITAÇÃO / GRAVAÇÃO DE ÁUDIO */}
          {isRecordingAudio ? (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#202c33',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700', fontSize: '0.85rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span>Gravando: {formatTimer(recordingSeconds)}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={cancelAudioRecording}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={finishAndSendAudio}
                  style={{ background: '#00a884', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Enviar Áudio ➔
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSendChatMessage}
              style={{
                padding: '10px 12px',
                backgroundColor: '#202c33',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <button
                type="button"
                onClick={startAudioRecording}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  padding: '6px'
                }}
                title="Gravar Áudio"
              >
                🎙️
              </button>

              <input
                type="text"
                placeholder="Mensagem para o cliente..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '20px',
                  background: '#2a3942',
                  border: 'none',
                  color: '#e9edef',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!chatInputText.trim() || isSendingMsg}
                style={{
                  background: chatInputText.trim() ? '#00a884' : 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: chatInputText.trim() ? '#fff' : '#8696a0',
                  fontSize: '1.1rem',
                  cursor: chatInputText.trim() ? 'pointer' : 'default'
                }}
              >
                ➔
              </button>
            </form>
          )}

          {/* MODAL DE AGENDAMENTO DE MENSAGEM */}
          {isScheduleOpen && (
            <div
              onClick={() => setIsScheduleOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box'
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: '#161b22',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  padding: '20px',
                  width: '100%',
                  maxWidth: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#ff8800' }}>
                    📅 Agendar Mensagem
                  </h3>
                  <button
                    onClick={() => setIsScheduleOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#8696a0', display: 'block', marginBottom: '4px' }}>Data do Disparo:</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#0d1117',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#8696a0', display: 'block', marginBottom: '4px' }}>Horário:</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#0d1117',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#8696a0', display: 'block', marginBottom: '4px' }}>Mensagem Automática:</label>
                    <textarea
                      rows={3}
                      placeholder="Olá! Conforme combinamos, estou entrando em contato..."
                      value={scheduleText}
                      onChange={e => setScheduleText(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: '#0d1117',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        boxSizing: 'border-box',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {scheduleMsgStatus && (
                    <div style={{ fontSize: '0.82rem', textAlign: 'center', color: scheduleMsgStatus.includes('✅') ? '#4ade80' : '#f87171' }}>
                      {scheduleMsgStatus}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={scheduleLoading}
                    style={{
                      marginTop: '6px',
                      padding: '12px',
                      background: '#ff6600',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    {scheduleLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTÃO FLUTUANTE CREMOSA AI */}
      <button
        onClick={() => onNavigate('gigamente')}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '16px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '999px',
          fontWeight: '800',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45)',
          cursor: 'pointer',
          zIndex: 900
        }}
      >
        <span>🧁</span>
        <span>CReMosa AI</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
      </button>
    </div>
  );
}
