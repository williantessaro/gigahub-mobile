import React, { useState, useEffect, useRef } from 'react';

// Listas canônicas padrão para fallback caso a API ainda não tenha retornado
const CANONICAL_FUNNELS = [
  { id: 'VENDAS', nome: 'Vendas' },
  { id: 'POS_VENDAS', nome: 'Pós-Vendas' }
];

const DEFAULT_VENDAS_STAGES = [
  { id: 'Novo', name: 'Novo', color: '#3b82f6', icon: 'fiber_new' },
  { id: 'Situação', name: 'Situação (S)', color: '#f59e0b', icon: 'explore' },
  { id: 'Problema', name: 'Problema (P)', color: '#6366f1', icon: 'error_outline' },
  { id: 'Implicação', name: 'Implicação (I)', color: '#ec4899', icon: 'trending_down' },
  { id: 'Solução', name: 'Solução (N)', color: '#14b8a6', icon: 'lightbulb' },
  { id: 'Fechado', name: 'Fechado / Cliente', color: '#16a34a', icon: 'check_circle' },
  { id: 'Perdido', name: 'Perdido / Arquivado', color: '#64748b', icon: 'cancel' }
];

const DEFAULT_POS_VENDAS_STAGES = [
  { id: 'Boas-vindas', name: 'Boas-vindas', color: '#3b82f6', icon: 'waving_hand' },
  { id: 'Integração', name: 'Integração', color: '#f59e0b', icon: 'supervised_user_circle' },
  { id: 'Configuração', name: 'Configuração', color: '#6366f1', icon: 'settings_suggest' },
  { id: 'Concluído', name: 'Concluído', color: '#16a34a', icon: 'check_circle' }
];

export default function MobileKanban({ onNavigate, onModalStateChange }) {
  // Funis dinâmicos
  const [availableFunnels, setAvailableFunnels] = useState(CANONICAL_FUNNELS);
  const [currentFunnelId, setCurrentFunnelId] = useState('VENDAS');
  const [isCreatingFunnel, setIsCreatingFunnel] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');

  // Colunas / Estágios do Funil Ativo
  const [stages, setStages] = useState(DEFAULT_VENDAS_STAGES);
  const [isCreatingStage, setIsCreatingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  // Leads e Busca
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [transferringId, setTransferringId] = useState(null);
  const [draggedLead, setDraggedLead] = useState(null);

  // Menu Rápido de Mover Etapa
  const [quickMoveLead, setQuickMoveLead] = useState(null);

  // Modal Completo de Detalhes do Lead (Abas: Chat e Dados)
  const [activeModalLead, setActiveModalLead] = useState(null);
  const [modalTab, setModalTab] = useState('chat'); // 'chat' | 'details'
  const [editedLeadData, setEditedLeadData] = useState({});
  const [isSavingLead, setIsSavingLead] = useState(false);

  // Chat integrado
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const chatEndRef = useRef(null);
  const chatPollRef = useRef(null);

  // Agendamento de Mensagem
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleMsgStatus, setScheduleMsgStatus] = useState('');

  // Gravador de Áudio
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

  // Notifica o App se algum modal estiver aberto (para controle do botão Voltar nativo do Android)
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(Boolean(activeModalLead || isScheduleOpen || quickMoveLead || isCreatingFunnel || isCreatingStage));
    }
  }, [activeModalLead, isScheduleOpen, quickMoveLead, isCreatingFunnel, isCreatingStage, onModalStateChange]);

  // Carregar lista de funis da API
  const loadFunnelsList = async () => {
    try {
      const res = await fetch('/backend/api/funis', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAvailableFunnels(data);
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar lista de funis:', err);
    }
  };

  // Carregar colunas e leads reais
  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // 1. Buscar as colunas/listas reais cadastradas para o funil ativo
      const resListas = await fetch(`/backend/api/listas?funil_id=${currentFunnelId}`, {
        headers: getAuthHeaders()
      });

      if (resListas.ok) {
        const listas = await resListas.json();
        if (Array.isArray(listas) && listas.length > 0) {
          const mapped = listas.map(s => ({
            id: s.id,
            name: s.nome || s.label || s.id,
            color: s.cor || s.bg || '#3b82f6',
            icon: s.icon || 'view_kanban'
          }));
          setStages(mapped);
        } else {
          if (currentFunnelId === 'POS_VENDAS') {
            setStages(DEFAULT_POS_VENDAS_STAGES);
          } else {
            setStages(DEFAULT_VENDAS_STAGES);
          }
        }
      } else {
        if (currentFunnelId === 'POS_VENDAS') {
          setStages(DEFAULT_POS_VENDAS_STAGES);
        } else {
          setStages(DEFAULT_VENDAS_STAGES);
        }
      }

      // 2. Buscar todas as pessoas/leads cadastradas (origem=gigacrm)
      const resPessoas = await fetch('/backend/api/pessoas?origem=gigacrm', {
        headers: getAuthHeaders()
      });

      if (resPessoas.ok) {
        const data = await resPessoas.json();
        const targetFunilUpper = String(currentFunnelId || 'VENDAS').toUpperCase();
        const isPosVendas = targetFunilUpper === 'POS_VENDAS';
        const isVendas = targetFunilUpper === 'VENDAS';

        // Lógica de filtragem 100% idêntica ao Funnel.jsx do Desktop
        const filtered = (Array.isArray(data) ? data : []).filter(p => {
          if (p.arquivado === 1 || p.status === 'Arquivado' || p.lista === 'Arquivado') return false;
          if (isPosVendas && (p.arquivado_clientes === 1 || p.arquivado === 1)) return false;
          if (isVendas && (p.arquivado_vendas === 1 || p.arquivado === 1)) return false;

          const leadFunilUpper = String(p.funil || 'VENDAS').toUpperCase();
          return leadFunilUpper === targetFunilUpper;
        });

        setLeads(filtered);
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados do funil:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadFunnelsList();
  }, []);

  useEffect(() => {
    loadData();

    // Sincronização contínua a cada 8 segundos (polling em background)
    const interval = setInterval(() => {
      loadData(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [currentFunnelId]);

  // Filtragem de leads para cada coluna (fidedigno ao desktop)
  const getLeadsForStage = (stageId) => {
    const firstStage = stages[0]?.id;

    return leads.filter(l => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (l.nome || '').toLowerCase().includes(term);
        const matchesPhone = (l.whatsapp || '').includes(searchTerm.trim());
        const matchesStore = (l.nome_loja || '').toLowerCase().includes(term);
        if (!matchesName && !matchesPhone && !matchesStore) {
          return false;
        }
      }

      const currentLista = l.lista || l.status || firstStage;
      const statusMatchesStage = (sId) => String(currentLista || '').toLowerCase() === String(sId).toLowerCase();

      if (stageId === firstStage) {
        return statusMatchesStage(stageId) || currentLista === 'ENVIADO' || !l.lista || !stages.some(s => statusMatchesStage(s.id));
      }
      return statusMatchesStage(stageId);
    });
  };

  // Mover lead para outra coluna dentro do funil atual
  const handleMoveStage = async (lead, targetStageId) => {
    if (!lead || !targetStageId) return;

    // Atualização otimista na interface
    setLeads(prev => prev.map(l =>
      l.id === lead.id ? { ...l, lista: targetStageId, status: targetStageId } : l
    ));

    if (activeModalLead && activeModalLead.id === lead.id) {
      setActiveModalLead(prev => ({ ...prev, lista: targetStageId, status: targetStageId }));
    }

    setQuickMoveLead(null);

    try {
      const res = await fetch('/backend/api/leads/lista', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: lead.id,
          lead_id: lead.id,
          whatsapp: lead.whatsapp,
          lista: targetStageId,
          status: targetStageId,
          origem: lead.origem || 'gigacrm',
          funnelType: currentFunnelId
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao atualizar lista no servidor.');
      }
      loadData(true);
    } catch (err) {
      console.error('Erro ao atualizar etapa do lead:', err);
      loadData(true);
    }
  };

  // Transferir lead para outro funil (ex: VENDAS ➔ POS_VENDAS)
  const handleTransferFunnel = async (e, lead) => {
    e.stopPropagation();

    const isPosVendas = currentFunnelId === 'POS_VENDAS';
    const targetFunnel = isPosVendas ? 'VENDAS' : 'POS_VENDAS';
    const targetLabel = isPosVendas ? 'Funil de Vendas' : 'Pós-Vendas (Clientes)';

    if (!window.confirm(`Deseja transferir "${lead.nome || lead.whatsapp}" para o funil "${targetLabel}"?`)) {
      return;
    }

    setTransferringId(lead.id);

    // Otimista: remove do funil atual
    setLeads(prev => prev.filter(l => l.id !== lead.id));

    try {
      // Buscar primeira coluna do funil destino
      let firstStageId = targetFunnel === 'POS_VENDAS' ? 'Boas-vindas' : 'Novo';
      try {
        const stRes = await fetch(`/backend/api/listas?funil_id=${targetFunnel}`, { headers: getAuthHeaders() });
        if (stRes.ok) {
          const stData = await stRes.json();
          if (Array.isArray(stData) && stData.length > 0) {
            firstStageId = stData[0].id;
          }
        }
      } catch (stErr) {
        console.warn('Usando coluna padrão para transferência de funil');
      }

      const res = await fetch('/backend/api/leads/status', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: lead.id,
          lead_id: lead.id,
          whatsapp: lead.whatsapp,
          status: firstStageId,
          lista: firstStageId,
          origem: lead.origem || 'gigacrm',
          funnelType: targetFunnel
        })
      });

      if (res.ok) {
        loadData(true);
      } else {
        alert('Erro ao transferir lead de funil no servidor.');
        loadData();
      }
    } catch (err) {
      console.error('Erro ao transferir lead de funil:', err);
      alert('Falha ao conectar no servidor.');
      loadData();
    } finally {
      setTransferringId(null);
    }
  };

  // Arquivar card/lead
  const handleArchiveCard = async (e, lead) => {
    e.stopPropagation();

    if (!window.confirm(`Deseja arquivar o contato "${lead.nome || lead.whatsapp}"? Ele não aparecerá mais no quadro.`)) {
      return;
    }

    // Otimista: remove do quadro
    setLeads(prev => prev.filter(l => l.id !== lead.id));

    try {
      await fetch('/backend/api/leads/status', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: lead.id,
          lead_id: lead.id,
          whatsapp: lead.whatsapp,
          status: 'Arquivado',
          lista: 'Arquivado',
          origem: lead.origem || 'gigacrm',
          funnelType: currentFunnelId
        })
      });

      if (lead.whatsapp) {
        await fetch(`/backend/api/chats/${lead.whatsapp}/archive?origem=gigacrm`, {
          method: 'POST',
          headers: getAuthHeaders()
        }).catch(() => {});
      }

      loadData(true);
    } catch (err) {
      console.error('Erro ao arquivar card:', err);
      loadData();
    }
  };

  // Criar Novo Funil
  const handleCreateFunnelSubmit = async (e) => {
    e.preventDefault();
    const nomeTrim = newFunnelName.trim();
    if (!nomeTrim) return;

    const id = nomeTrim.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    try {
      const res = await fetch('/backend/api/funis', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, nome: nomeTrim, ordem: availableFunnels.length })
      });

      if (res.ok) {
        // Criar lista inicial 'Novo'
        await fetch('/backend/api/listas', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            id: 'Novo_' + id,
            funil_id: id,
            nome: 'Novo',
            ordem: 0,
            cor: '#3b82f6',
            icon: 'fiber_new'
          })
        }).catch(() => {});

        setNewFunnelName('');
        setIsCreatingFunnel(false);
        await loadFunnelsList();
        setCurrentFunnelId(id);
      } else {
        alert('Erro ao criar funil no servidor.');
      }
    } catch (err) {
      console.error('Erro ao salvar funil:', err);
      alert('Falha na comunicação com o servidor.');
    }
  };

  // Criar Nova Coluna / Lista no Funil Ativo
  const handleCreateStageSubmit = async (e) => {
    e.preventDefault();
    const labelTrim = newStageName.trim();
    if (!labelTrim) return;

    const id = labelTrim.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const colors = ['#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6', '#10b981'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const res = await fetch('/backend/api/listas', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id,
          nome: labelTrim,
          funil_id: currentFunnelId,
          ordem: stages.length,
          cor: randomColor,
          icon: 'view_kanban'
        })
      });

      if (res.ok) {
        setNewStageName('');
        setIsCreatingStage(false);
        loadData(true);
      } else {
        alert('Erro ao criar nova coluna.');
      }
    } catch (err) {
      console.error('Erro ao criar nova coluna:', err);
      alert('Falha de conexão.');
    }
  };

  // Abertura do Modal de Detalhes Completo
  const openLeadModal = (lead) => {
    setActiveModalLead(lead);
    setModalTab('chat');
    setEditedLeadData({
      nome: lead.nome || '',
      nome_loja: lead.nome_loja || '',
      whatsapp: lead.whatsapp || '',
      email: lead.email || '',
      cidade: lead.cidade || '',
      categoria: lead.categoria || lead.description || '',
      description: lead.description || lead.categoria || '',
      status: lead.status || lead.lista || stages[0]?.id
    });
  };

  // Salvar Alterações dos Dados do Lead
  const handleSaveLeadDetails = async (e) => {
    e.preventDefault();
    if (!activeModalLead) return;

    setIsSavingLead(true);
    try {
      const res = await fetch(`/backend/api/pessoas/${activeModalLead.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editedLeadData)
      });

      if (res.ok) {
        // Se a etapa mudou pelo dropdown, dispara atualização no funil
        if (editedLeadData.status && editedLeadData.status !== (activeModalLead.status || activeModalLead.lista)) {
          await handleMoveStage(activeModalLead, editedLeadData.status);
        }

        // Atualiza objeto em foco
        setActiveModalLead(prev => ({ ...prev, ...editedLeadData }));
        loadData(true);
        alert('✅ Dados do contato salvos com sucesso!');
      } else {
        alert('Erro ao salvar os dados do contato.');
      }
    } catch (err) {
      console.error('Erro ao salvar contato:', err);
      alert('Falha de comunicação ao salvar contato.');
    } finally {
      setIsSavingLead(false);
    }
  };

  // Carregamento de Mensagens do WhatsApp
  const loadChatMessages = async (phone, isPolling = false) => {
    if (!phone) return;
    if (!isPolling) setChatLoading(true);

    try {
      const cleanPhone = String(phone).replace(/\D/g, '');
      const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
      const res = await fetch(`/backend/api/chats/${jid}/messages?origem=gigacrm`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const msgs = await res.json();
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      if (!isPolling) setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeModalLead && modalTab === 'chat') {
      loadChatMessages(activeModalLead.whatsapp);
      chatPollRef.current = setInterval(() => {
        loadChatMessages(activeModalLead.whatsapp, true);
      }, 3500);
    } else {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      setChatMessages([]);
    }

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [activeModalLead, modalTab]);

  useEffect(() => {
    if (modalTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, modalTab]);

  // Envio de Mensagem de Texto no WhatsApp
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !activeModalLead || isSendingMsg) return;

    const text = chatInputText.trim();
    setChatInputText('');
    setIsSendingMsg(true);

    const cleanPhone = String(activeModalLead.whatsapp).replace(/\D/g, '');
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
        loadChatMessages(activeModalLead.whatsapp, true);
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Gravação de Áudio
  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Gravação de áudio não suportada no seu dispositivo.');
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
      alert('Permissão de microfone negada ou erro ao gravar.');
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
        const cleanPhone = String(activeModalLead.whatsapp).replace(/\D/g, '');
        const jid = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

        try {
          await fetch(`/backend/api/chats/${jid}/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ audio: audioBase64, origem: 'gigacrm' })
          });
          loadChatMessages(activeModalLead.whatsapp, true);
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

  // Agendamento de Mensagem
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleText.trim() || !scheduleDate || !scheduleTime || !activeModalLead) return;

    setScheduleLoading(true);
    setScheduleMsgStatus('');

    const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
    const cleanPhone = String(activeModalLead.whatsapp || '').split('@')[0].replace(/\D/g, '');

    try {
      const res = await fetch('/backend/api/schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phone: cleanPhone,
          text: scheduleText,
          scheduledAt: new Date(scheduledAt).toISOString(),
          clientId: activeModalLead.id,
          nome: activeModalLead.nome,
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a1017',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* HEADER FIXO DO TOPO */}
      <header style={{
        padding: '12px 16px 10px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ← Portal
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
                Giga CRM <span style={{ color: '#ff6600', fontSize: '0.85rem' }}>• Kanban</span>
              </h1>
              <p style={{ margin: 0, fontSize: '0.70rem', color: 'rgba(255,255,255,0.55)' }}>
                {leads.length} contatos ativos no funil
              </p>
            </div>
          </div>

          <button
            onClick={() => loadData()}
            disabled={loading}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🔄</span>
            <span>{loading ? '...' : 'Atualizar'}</span>
          </button>
        </div>

        {/* SELETOR DE FUNIS DINÂMICOS (VENDAS, PÓS-VENDAS, CUSTOM) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '8px',
          scrollbarWidth: 'none'
        }}>
          {availableFunnels.map((f) => {
            const isActive = String(currentFunnelId).toUpperCase() === String(f.id).toUpperCase();
            return (
              <button
                key={f.id}
                onClick={() => setCurrentFunnelId(f.id)}
                style={{
                  flexShrink: 0,
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: isActive ? '1.5px solid #ff6600' : '1px solid rgba(255,255,255,0.12)',
                  background: isActive ? 'rgba(255, 102, 0, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{f.id === 'POS_VENDAS' ? '🤝' : '🎯'}</span>
                <span>{f.nome || f.id}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsCreatingFunnel(true)}
            style={{
              flexShrink: 0,
              padding: '6px 10px',
              borderRadius: '999px',
              border: '1px dashed rgba(255,255,255,0.25)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>+</span>
            <span>Novo Funil</span>
          </button>
        </div>

        {/* BUSCA NO QUADRO */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome, loja ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* QUADRO KANBAN COM COLUNAS LADO A LADO E ROLAGEM HORIZONTAL LIVRE */}
      <main style={{
        flex: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 14px 80px',
        WebkitOverflowScrolling: 'touch',
        minHeight: 'calc(100vh - 150px)'
      }}>
        {stages.map((stage) => {
          const stageLeads = getLeadsForStage(stage.id);

          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedLead) {
                  handleMoveStage(draggedLead, stage.id);
                  setDraggedLead(null);
                }
              }}
              style={{
                width: '290px',
                minWidth: '290px',
                maxWidth: '290px',
                backgroundColor: '#121c2a',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 170px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                flexShrink: 0
              }}
            >
              {/* CABEÇALHO DA COLUNA */}
              <div style={{
                padding: '12px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '14px 14px 0 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: stage.color,
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontWeight: '800',
                    fontSize: '0.88rem',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {stage.name}
                  </span>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: `${stage.color}25`,
                  color: stage.color,
                  border: `1px solid ${stage.color}40`,
                  flexShrink: 0
                }}>
                  {stageLeads.length}
                </span>
              </div>

              {/* LISTA VERTICAL DE CARDS DA COLUNA */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {stageLeads.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 10px',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '0.78rem',
                    borderRadius: '10px',
                    border: '1px dashed rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    Nenhum lead nesta etapa
                  </div>
                ) : (
                  stageLeads.map((lead) => {
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
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedLead(lead)}
                        onClick={() => openLeadModal(lead)}
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          borderRadius: '10px',
                          padding: '12px',
                          borderLeft: `4px solid ${stage.color}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        {/* CABEÇALHO DO CARD: NOME E BOTÕES DE AÇÃO RÁPIDA */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <div style={{
                            fontWeight: '800',
                            fontSize: '0.90rem',
                            color: '#0f172a',
                            lineHeight: '1.25',
                            flex: 1
                          }}>
                            {lead.nome_loja ? `${lead.nome || 'Lead'} • ${lead.nome_loja}` : (lead.nome || lead.whatsapp || 'Lead')}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            {/* Botão Transferir Funil */}
                            <button
                              onClick={(e) => handleTransferFunnel(e, lead)}
                              disabled={transferringId === lead.id}
                              title={currentFunnelId === 'POS_VENDAS' ? 'Enviar para Funil de Vendas' : 'Enviar para Pós-Vendas'}
                              style={{
                                background: currentFunnelId === 'POS_VENDAS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 102, 0, 0.15)',
                                border: 'none',
                                color: currentFunnelId === 'POS_VENDAS' ? '#0284c7' : '#ea580c',
                                borderRadius: '6px',
                                padding: '3px 6px',
                                fontSize: '0.70rem',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                            >
                              {currentFunnelId === 'POS_VENDAS' ? '← Vendas' : 'Pós ➔'}
                            </button>

                            {/* Botão Arquivar (X) */}
                            <button
                              onClick={(e) => handleArchiveCard(e, lead)}
                              title="Arquivar lead"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '0.85rem',
                                padding: '2px 4px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* TELEFONE FORMATADO */}
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📞</span>
                          <span>{lead.whatsapp}</span>
                        </div>

                        {/* DESTAQUE VISUAL COPILOTO CREMOSA */}
                        {copilotoSnippet && (
                          <div style={{
                            padding: '5px 7px',
                            background: 'rgba(234, 179, 8, 0.12)',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            borderRadius: '6px',
                            fontSize: '0.70rem',
                            color: '#854d0e',
                            lineHeight: '1.25'
                          }}>
                            <div style={{ fontWeight: '700', color: '#b45309', marginBottom: '2px' }}>
                              💡 Copiloto CReMosa
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {copilotoSnippet}
                            </div>
                          </div>
                        )}

                        {/* RETORNO / AGENDAMENTO */}
                        {returnDate && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(2, 132, 199, 0.1)',
                            color: '#0369a1',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            alignSelf: 'flex-start'
                          }}>
                            <span>❄️ Retorno:</span>
                            <span>{returnDate}</span>
                          </div>
                        )}

                        {/* BARRA INFERIOR DE AÇÃO DO CARD */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '4px',
                          paddingTop: '6px',
                          borderTop: '1px solid #f1f5f9'
                        }}>
                          {/* Botão Rápido para Mover Etapa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickMoveLead(lead);
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.70rem',
                              fontWeight: '700',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span>⇄ Mover</span>
                          </button>

                          {/* Abrir Chat / Detalhes */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#0284c7',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.70rem',
                            fontWeight: '700'
                          }}>
                            <span>💬 Chat</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* BOTÃO PARA ADICIONAR NOVA COLUNA NO FINAL DO QUADRO */}
        <div style={{
          width: '260px',
          minWidth: '260px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: '14px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          cursor: 'pointer',
          flexShrink: 0
        }}
        onClick={() => setIsCreatingStage(true)}
        >
          <span style={{ fontSize: '1.5rem', marginBottom: '6px', color: '#ff6600' }}>+</span>
          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
            Adicionar Nova Lista
          </span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Nova coluna neste funil
          </span>
        </div>
      </main>

      {/* MODAL DE MOVER ETAPA (POPOVER RÁPIDO AO TOCAR EM '⇄ Mover') */}
      {quickMoveLead && (
        <div
          onClick={() => setQuickMoveLead(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#161f2e',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '20px 20px 0 0',
              padding: '20px 18px 30px',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
                  Mover de Etapa
                </h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  {quickMoveLead.nome || quickMoveLead.whatsapp}
                </p>
              </div>
              <button
                onClick={() => setQuickMoveLead(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
              {stages.map((stg) => {
                const currentLista = quickMoveLead.lista || quickMoveLead.status || stages[0]?.id;
                const isCurrent = String(currentLista).toLowerCase() === String(stg.id).toLowerCase();

                return (
                  <button
                    key={stg.id}
                    onClick={() => handleMoveStage(quickMoveLead, stg.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: isCurrent ? `${stg.color}30` : 'rgba(255,255,255,0.05)',
                      border: isCurrent ? `1.5px solid ${stg.color}` : '1px solid rgba(255,255,255,0.08)',
                      color: isCurrent ? '#fff' : 'rgba(255,255,255,0.85)',
                      fontWeight: isCurrent ? '800' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: stg.color }} />
                      <span>{stg.name}</span>
                    </div>
                    {isCurrent && <span style={{ color: stg.color, fontSize: '0.75rem' }}>● Atual</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE DETALHES DO LEAD (ABAS: CHAT E DADOS) */}
      {activeModalLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0b141a',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* HEADER DO MODAL */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#1f2c34',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setActiveModalLead(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00a884',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Voltar ao Quadro"
              >
                ←
              </button>

              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: '800',
                  fontSize: '0.95rem',
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {activeModalLead.nome || activeModalLead.whatsapp}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8696a0' }}>
                  {activeModalLead.whatsapp} {activeModalLead.nome_loja ? `• ${activeModalLead.nome_loja}` : ''}
                </div>
              </div>
            </div>

            {/* SELETOR DE ETAPA NO HEADER DO MODAL */}
            <select
              value={activeModalLead.lista || activeModalLead.status || stages[0]?.id}
              onChange={(e) => handleMoveStage(activeModalLead, e.target.value)}
              style={{
                background: '#111b21',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#38bdf8',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: '700',
                maxWidth: '120px'
              }}
            >
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* ABAS DO MODAL: [💬 WhatsApp] e [📋 Dados do Lead] */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: '#16222a',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <button
              onClick={() => setModalTab('chat')}
              style={{
                padding: '10px',
                border: 'none',
                borderBottom: modalTab === 'chat' ? '2.5px solid #00a884' : '2.5px solid transparent',
                background: 'transparent',
                color: modalTab === 'chat' ? '#00a884' : '#8696a0',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              💬 WhatsApp
            </button>

            <button
              onClick={() => setModalTab('details')}
              style={{
                padding: '10px',
                border: 'none',
                borderBottom: modalTab === 'details' ? '2.5px solid #38bdf8' : '2.5px solid transparent',
                background: 'transparent',
                color: modalTab === 'details' ? '#38bdf8' : '#8696a0',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              📋 Dados do Lead
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: CHAT INTEGRADO WHATSAPP */}
          {modalTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }}>
                {chatLoading ? (
                  <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 0', fontSize: '0.85rem' }}>
                    Sincronizando histórico do WhatsApp...
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 20px', fontSize: '0.82rem' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>💬</div>
                    <div>Nenhuma mensagem no histórico.</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Envie uma mensagem abaixo para falar com o lead.</div>
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
                          fontSize: '0.85rem',
                          lineHeight: '1.35',
                          wordBreak: 'break-word',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                          {msg.mediaUrl || msg.audioUrl ? (
                            <div>
                              <div style={{ fontSize: '0.70rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>🎙️ Áudio</div>
                              <audio controls src={msg.mediaUrl || msg.audioUrl} style={{ width: '100%', height: '34px' }} />
                            </div>
                          ) : (
                            <div>{msg.text || msg.body || msg.content}</div>
                          )}

                          <div style={{
                            fontSize: '0.62rem',
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
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
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
                      Enviar ➔
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSendChatMessage}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#202c33',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Agendar Mensagem"
                  >
                    📅
                  </button>

                  <button
                    type="button"
                    onClick={startAudioRecording}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '4px'
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
                      padding: '9px 12px',
                      borderRadius: '20px',
                      background: '#2a3942',
                      border: 'none',
                      color: '#e9edef',
                      fontSize: '0.85rem',
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
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: chatInputText.trim() ? '#fff' : '#8696a0',
                      fontSize: '1rem',
                      cursor: chatInputText.trim() ? 'pointer' : 'default'
                    }}
                  >
                    ➔
                  </button>
                </form>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: DADOS DO LEAD (EDIÇÃO COMPLETA) */}
          {modalTab === 'details' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <form onSubmit={handleSaveLeadDetails} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Nome do Contato:
                  </label>
                  <input
                    type="text"
                    value={editedLeadData.nome || ''}
                    onChange={e => setEditedLeadData(prev => ({ ...prev, nome: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Nome da Loja / Empresa:
                  </label>
                  <input
                    type="text"
                    value={editedLeadData.nome_loja || ''}
                    onChange={e => setEditedLeadData(prev => ({ ...prev, nome_loja: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={editedLeadData.whatsapp || ''}
                    onChange={e => setEditedLeadData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    E-mail:
                  </label>
                  <input
                    type="email"
                    value={editedLeadData.email || ''}
                    onChange={e => setEditedLeadData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Cidade / Região:
                  </label>
                  <input
                    type="text"
                    value={editedLeadData.cidade || ''}
                    onChange={e => setEditedLeadData(prev => ({ ...prev, cidade: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Observações / Anotações / Copiloto:
                  </label>
                  <textarea
                    rows={4}
                    value={editedLeadData.description || editedLeadData.categoria || ''}
                    onChange={e => setEditedLeadData(prev => ({
                      ...prev,
                      description: e.target.value,
                      categoria: e.target.value
                    }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#161f2e',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingLead}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {isSavingLead ? 'Salvando...' : '💾 Salvar Alterações'}
                </button>
              </form>
            </div>
          )}
        </div>
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

      {/* MODAL CRIAR NOVO FUNIL */}
      {isCreatingFunnel && (
        <div
          onClick={() => setIsCreatingFunnel(false)}
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
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161f2e',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>+ Criar Novo Funil</h3>
            <form onSubmit={handleCreateFunnelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Nome do novo funil..."
                value={newFunnelName}
                onChange={e => setNewFunnelName(e.target.value)}
                autoFocus
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingFunnel(false)}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#ff6600', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVA COLUNA / LISTA */}
      {isCreatingStage && (
        <div
          onClick={() => setIsCreatingStage(false)}
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
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#161f2e',
              borderRadius: '16px',
              padding: '20px',
              width: '100%',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>+ Nova Coluna no Funil</h3>
            <form onSubmit={handleCreateStageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Ex: Em Negociação, Aguardando..."
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                autoFocus
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1117',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingStage(false)}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#0284c7', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Criar Coluna
                </button>
              </div>
            </form>
          </div>
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
          padding: '10px 16px',
          borderRadius: '999px',
          fontWeight: '800',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
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
