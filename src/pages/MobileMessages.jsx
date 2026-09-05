import React, { useState, useEffect, useRef } from 'react';

const PREDEFINED_COLORS = [
  '#00a884', // Verde WhatsApp
  '#3b82f6', // Azul
  '#eab308', // Amarelo
  '#f97316', // Laranja
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#8b5cf6', // Roxo
  '#64748b'  // Cinza
];

function AudioMessagePlayer({ src, isSent }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => {
        console.warn('Erro ao reproduzir áudio:', err);
      });
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="wa-audio-player" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '4px 0',
      minWidth: '200px',
      maxWidth: '280px'
    }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: '#00a884',
          border: 'none',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ marginLeft: '2px' }}>
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '4px',
            accentColor: '#00a884',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: isSent ? '#d1d7db' : '#8696a0' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : 'Áudio'}</span>
        </div>
      </div>
      
      <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>🎤</span>
    </div>
  );
}

const MobileMessages = ({ openTagsTrigger, user }) => {
  const currentUser = user || JSON.parse(localStorage.getItem('crm-user') || 'null');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [usersList, setUsersList] = useState([]);
  
  // Tags e Etiquetas
  const [tags, setTags] = useState([]);
  const [leadTags, setLeadTags] = useState({}); // { phone: [tags] }
  const [filterTag, setFilterTag] = useState(null);
  
  // Modais
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showTagsManagerModal, setShowTagsManagerModal] = useState(false);
  const [showTagEditorModal, setShowTagEditorModal] = useState(false);
  const [showLabelLeadModal, setShowLabelLeadModal] = useState(false);
  
  // Estado para Criar/Editar Tag
  const [editingTag, setEditingTag] = useState(null); // null se criando nova
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PREDEFINED_COLORS[0]);
  const [tagEmoji, setTagEmoji] = useState('🏷️');

  // Estado para Novo Chat Rápido
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatError, setNewChatError] = useState('');
  const [newChatLoading, setNewChatLoading] = useState(false);

  // Dropdown interno do chat
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  // Estado para Agendamento de Mensagem
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('');

  // Estado para Gravação de Áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const scrollRef = useRef(null);
  const chatMenuRef = useRef(null);

  // Gatilho do menu global para abrir gerenciador de etiquetas
  useEffect(() => {
    if (openTagsTrigger > 0) {
      setShowTagsManagerModal(true);
    }
  }, [openTagsTrigger]);

  // Buscar lista de usuários do sistema caso o usuário logado seja admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const token = localStorage.getItem('crm-token');
      fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setUsersList(Array.isArray(data) ? data : []);
        })
        .catch(e => console.error('Erro ao buscar usuarios:', e));
    }
  }, [currentUser]);

  const handleAssignChat = async (userId) => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch(`/backend/api/chats/${selectedClient.id}/assign?origem=gigacrm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: userId ? parseInt(userId, 10) : null })
      });
      if (res.ok) {
        const uId = userId ? parseInt(userId, 10) : null;
        const uName = userId ? usersList.find(u => u.id === uId)?.name : null;
        setSelectedClient(prev => ({
          ...prev,
          assigned_user_id: uId,
          assigned_user_name: uName
        }));
        syncChats();
      } else {
        console.error('Falha ao atribuir conversa');
      }
    } catch (e) {
      console.error('Erro ao atribuir conversa:', e);
    }
  };

  // Fechar menu de chat ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setChatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar todas as etiquetas da API
  const loadAllTags = async () => {
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch(`/backend/api/tags?origem=gigacrm`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (e) {
      console.error('Erro ao carregar tags:', e);
    }
  };

  // Carregar tags de um lead específico
  const fetchLeadTags = async (phone) => {
    if (!phone) return;
    const cleanPhone = String(phone).replace(/\D/g, '');
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch(`/backend/api/leads/${cleanPhone}/tags?origem=gigacrm`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const tagsData = await res.json();
        setLeadTags(prev => ({
          ...prev,
          [phone]: tagsData
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar tags do lead:', phone, error);
    }
  };

  // Sincronizar conversas (Chats)
  const syncChats = async () => {
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch(`/backend/api/chats?origem=gigacrm&_t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const dbChats = await res.json();
        const updated = dbChats.map(c => ({
          ...c,
          name: c.nome || c.phone,
          image: c.profilePic || null
        }));
        setClients(updated);

        // Disparar carregamento de tags para cada telefone
        updated.forEach(chat => {
          if (chat.phone) {
            fetchLeadTags(chat.phone);
          }
        });

        // Sincronizar o cliente atualmente selecionado
        if (selectedClient) {
          const freshSelected = updated.find(c => c.id === selectedClient.id);
          if (freshSelected) {
            setSelectedClient(prev => {
              if (!prev) return null;
              // Só atualiza se houver mudança relevante para evitar loops ou re-renderizações desnecessárias
              if (
                prev.assigned_user_id !== freshSelected.assigned_user_id ||
                prev.assigned_user_name !== freshSelected.assigned_user_name ||
                prev.status !== freshSelected.status ||
                prev.name !== freshSelected.name
              ) {
                return {
                  ...prev,
                  ...freshSelected
                };
              }
              return prev;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing chats:', error);
    }
  };

  useEffect(() => {
    loadAllTags();
    syncChats();
    const interval = setInterval(syncChats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Carregar histórico de mensagens
  useEffect(() => {
    if (!selectedClient) return;
    
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('crm-token');
        const res = await fetch(`/backend/api/chats/${selectedClient.id}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const dbMessages = await res.json();
          setHistory(dbMessages.map(msg => ({
            ...msg,
            time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
          })));
        }
      } catch (error) {
        console.error("Error loading history", error);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedClient]);

  // Rolar para o final do chat ao carregar novas mensagens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Limpar recursos de áudio
  const stopAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  // Iniciar Gravação de Áudio (Toque Único)
  const startRecording = async () => {
    if (!selectedClient) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
      else if (MediaRecorder.isTypeSupported('audio/webm')) options = { mimeType: 'audio/webm' };
      else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
      else if (MediaRecorder.isTypeSupported('audio/ogg')) options = { mimeType: 'audio/ogg' };
      else if (MediaRecorder.isTypeSupported('audio/wav')) options = { mimeType: 'audio/wav' };

      const recorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      setIsRecording(true);
      setRecordingSeconds(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Permissão de microfone negada ou erro ao iniciar gravação.');
      stopAudioStream();
      setIsRecording(false);
    }
  };

  // Cancelar Gravação de Áudio
  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }
    stopAudioStream();
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Parar e Enviar Áudio Gravado
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !isRecording || !selectedClient) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      stopAudioStream();
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (audioBlob.size < 200) {
        setIsRecording(false);
        setRecordingSeconds(0);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioBase64 = reader.result;
        const now = Date.now();
        const optimisticMsg = {
          id: now.toString(),
          text: '🎤 Áudio',
          mediaUrl: audioBase64,
          mediaType: 'audio',
          sender: 'me',
          time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sending',
          timestamp: now
        };
        setHistory(prev => [...prev, optimisticMsg]);

        try {
          const token = localStorage.getItem('crm-token');
          await fetch('/backend/api/messages/send-media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              remoteJid: selectedClient.id,
              type: 'ptt',
              mediaUrl: audioBase64,
              channel_id: selectedClient.channel_id,
              nome: selectedClient.name
            })
          });
        } catch (e) {
          console.error('Erro ao enviar áudio:', e);
        }
      };
      reader.readAsDataURL(audioBlob);

      setIsRecording(false);
      setRecordingSeconds(0);
      audioChunksRef.current = [];
    };

    recorder.stop();
  };

  // Enviar Mensagem
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || !selectedClient) return;

    const now = Date.now();
    const msgText = message;
    setMessage('');

    // UI Otimista
    const optimisticMsg = { 
      id: now.toString(), 
      text: msgText, 
      sender: 'me', 
      time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      status: 'sending',
      timestamp: now 
    };
    setHistory(prev => [...prev, optimisticMsg]);

    try {
      const token = localStorage.getItem('crm-token');
      await fetch('/backend/api/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          remoteJid: selectedClient.id,
          text: msgText,
          sender: 'me',
          timestamp: now,
          nome: selectedClient.name
        })
      });
    } catch (e) {
      console.error('Send error:', e);
    }
  };

  // Agendar Mensagem
  const handleSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || !selectedClient) {
      alert('Por favor, digite uma mensagem para agendar.');
      return;
    }

    const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
    if (isNaN(new Date(scheduledAt).getTime())) {
      alert('Data ou hora inválida.');
      return;
    }

    try {
      const token = localStorage.getItem('crm-token');
      const rawPhone = selectedClient.phone || selectedClient.id;
      const cleanPhone = String(rawPhone || '').split('@')[0].replace(/\D/g, '');

      const res = await fetch('/backend/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: cleanPhone,
          text: message,
          scheduledAt: new Date(scheduledAt).toISOString(),
          clientId: selectedClient.id,
          nome: selectedClient.name || selectedClient.nome,
          channel_id: selectedClient.channel_id || null,
          origem: 'gigacrm'
        })
      });

      if (res.ok) {
        alert('Mensagem agendada com sucesso!');
        setShowScheduleModal(false);
        setMessage('');
      } else {
        const err = await res.json();
        alert('Erro ao agendar: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('Erro de rede ao agendar mensagem.');
    }
  };

  // Gerenciamento de Tags: Salvar (Criar ou Editar)
  const handleSaveTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const newTag = {
      id: editingTag ? editingTag.id : 'tag_' + Date.now().toString(),
      name: tagName.trim(),
      color: tagColor,
      emoji: tagEmoji,
      origem: 'gigacrm'
    };

    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch('/backend/api/tags', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTag)
      });

      if (res.ok) {
        loadAllTags();
        // Recarregar os chats para atualizar badges
        syncChats();
        setShowTagEditorModal(false);
        setTagName('');
        setEditingTag(null);
      }
    } catch (e) {
      console.error('Erro ao salvar tag:', e);
    }
  };

  // Gerenciamento de Tags: Deletar
  const handleDeleteTag = async (tagId) => {
    if (!confirm('Deseja realmente excluir esta etiqueta?')) return;
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch(`/backend/api/tags/${tagId}?origem=gigacrm`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadAllTags();
        syncChats();
      }
    } catch (e) {
      console.error('Erro ao deletar tag:', e);
    }
  };

  // Gerenciamento de Tags: Toggle em um lead
  const handleToggleTag = async (tagId) => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('crm-token');
      const res = await fetch('/backend/api/tags/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsapp: selectedClient.phone,
          tagId: tagId,
          origem: 'gigacrm'
        })
      });

      if (res.ok) {
        // Recarregar tags do lead selecionado
        fetchLeadTags(selectedClient.phone);
      }
    } catch (e) {
      console.error('Erro ao associar tag:', e);
    }
  };

  // Fluxo de Iniciar Novo Chat Rápido
  const handleStartNewChat = async (e) => {
    e.preventDefault();
    setNewChatError('');
    if (!newChatPhone.trim()) {
      setNewChatError('Por favor, informe o WhatsApp.');
      return;
    }

    let phone = newChatPhone.replace(/\D/g, '');
    if (!phone) {
      setNewChatError('Por favor, informe apenas números no telefone.');
      return;
    }
    
    // Adicionar código de país se não estiver presente
    if (phone.length === 10 || phone.length === 11) {
      phone = '55' + phone;
    }

    setNewChatLoading(true);

    try {
      const token = localStorage.getItem('crm-token');
      
      // 1. Cadastra a pessoa (Lead) no banco
      const res = await fetch('/backend/api/pessoas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsapp: phone,
          nome: newChatName.trim() || phone
        })
      });

      if (res.ok) {
        // 2. Abre a conversa imediatamente
        const newClient = {
          id: phone + '@s.whatsapp.net',
          phone: phone,
          name: newChatName.trim() || phone,
          status: 'Novo'
        };

        setSelectedClient(newClient);
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
        // Forçar sincronismo
        syncChats();
      } else {
        const data = await res.json();
        setNewChatError(data.error || 'Erro ao iniciar conversa no servidor.');
      }
    } catch (error) {
      setNewChatError('Erro de conexão com o servidor.');
    } finally {
      setNewChatLoading(false);
    }
  };

  // Filtro de Conversas
  const filteredClients = clients.filter(c => {
    // 1. Termo de Busca
    const matchesSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.phone || '').includes(searchTerm);
    if (!matchesSearch) return false;

    // 2. Filtro por Tag (Lista)
    if (filterTag) {
      const clientTags = leadTags[c.phone] || [];
      return clientTags.some(t => t.id === filterTag.id);
    }

    return true;
  });

  // Interface da tela interna do Chat aberto
  if (selectedClient) {
    const activeTagsForSelected = leadTags[selectedClient.phone] || [];
    
    return (
      <div className="animate-fade" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        background: 'var(--wa-chat-bg)', zIndex: 1000, display: 'flex', flexDirection: 'column' 
      }}>
        {/* Cabeçalho do Chat */}
        <header className="header" style={{ borderRadius: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              onClick={() => setSelectedClient(null)} 
              className="btn-back-action"
              style={{ 
                fontSize: '1.5rem', 
                padding: '12px 16px 12px 8px', 
                cursor: 'pointer', 
                color: '#e9edef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '4px'
              }}
            >←</div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: '#64748b', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden'
            }}>
              {selectedClient.image ? <img src={selectedClient.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.98rem', color: '#e9edef' }}>{selectedClient.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span>{selectedClient.status || 'Cliente'}</span>
                
                {currentUser?.role === 'admin' ? (
                  <select
                    value={selectedClient.assigned_user_id || ''}
                    onChange={(e) => handleAssignChat(e.target.value)}
                    style={{
                      background: '#202c33',
                      color: '#e9edef',
                      border: '1px solid #3b4a54',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      padding: '1px 4px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Sem atendente</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                ) : (
                  (selectedClient.assigned_user_id || selectedClient.assigned_user_name) && (
                    <span style={{ fontSize: '0.68rem', color: '#00a884', fontWeight: '600' }}>
                      👤 {selectedClient.assigned_user_name || 'Atribuído'}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#8696a0' }}>
            {/* Ícone de Vídeo decorativo */}
            <svg style={{ width: '22px', height: '22px', cursor: 'pointer' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            
            {/* Ícone de Chamada de Voz decorativo */}
            <svg style={{ width: '20px', height: '20px', cursor: 'pointer' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>

            {/* Menu 3 pontos do Chat */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={chatMenuRef}>
              <svg 
                onClick={() => setChatMenuOpen(!chatMenuOpen)}
                style={{ width: '22px', height: '22px', cursor: 'pointer', color: chatMenuOpen ? 'var(--primary-color)' : '#8696a0' }} 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
              
              {chatMenuOpen && (
                <div className="wa-dropdown-menu">
                  <div 
                    className="wa-dropdown-item" 
                    onClick={() => {
                      setChatMenuOpen(false);
                      setShowLabelLeadModal(true);
                    }}
                  >
                    Etiquetar conversa
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Fundo do Chat contendo os balões de conversa */}
        <div ref={scrollRef} className="wa-chat-container">
          {history.map((msg, i) => {
            const isAudio = msg.mediaType === 'audio' || msg.mediaType === 'ptt' || (msg.mediaUrl && (msg.mediaUrl.startsWith('data:audio') || msg.mediaUrl.match(/\.(mp3|ogg|opus|wav|m4a|webm|aac)($|\?)/i))) || msg.audioUrl;
            const isImage = msg.mediaType === 'image' || (msg.mediaUrl && (msg.mediaUrl.startsWith('data:image') || msg.mediaUrl.match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i)));
            const isSent = msg.sender === 'me';
            const audioSrc = msg.mediaUrl || msg.audioUrl;

            return (
              <div key={i} className={`wa-bubble ${isSent ? 'sent' : 'received'}`}>
                {isImage && (
                  <div style={{ marginBottom: '6px', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%' }}>
                    <img src={msg.mediaUrl} alt="Mídia" style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                {isAudio && audioSrc ? (
                  <AudioMessagePlayer src={audioSrc} isSent={isSent} />
                ) : (
                  msg.text && <div>{msg.text}</div>
                )}
                {isAudio && msg.text && msg.text !== '🎤 Áudio' && !msg.text.startsWith('🎤 Áudio:') && (
                  <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>{msg.text}</div>
                )}
                <div className="wa-bubble-meta">
                  <span>{msg.time}</span>
                  {isSent && (
                    <span className="wa-ticks read">✓✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar inferior ou Barra de Gravação de Áudio */}
        {isRecording ? (
          <div className="wa-recording-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: '#202c33',
            borderRadius: '24px',
            margin: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ef4444',
                display: 'inline-block'
              }} />
              <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.95rem' }}>
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span style={{ color: '#8696a0', fontSize: '0.85rem' }}>Gravando áudio...</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={cancelRecording}
                title="Cancelar gravação"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: 'none',
                  color: '#ef4444',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>

              <button
                type="button"
                onClick={stopAndSendRecording}
                title="Enviar áudio"
                className="wa-send-btn"
                style={{
                  background: '#00a884',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="wa-input-container">
            <div className="wa-input-wrapper">
              <div className="wa-input-icon">
                {/* Ícone de Emoji decorativo */}
                <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              
              <input 
                type="text" 
                placeholder="Mensagem" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="wa-input-field"
              />
              
              {/* Ícone de Relógio para Agendamento */}
              <div 
                className="wa-input-icon" 
                onClick={() => {
                  if (!message.trim()) {
                    alert('Por favor, digite uma mensagem primeiro para agendar.');
                    return;
                  }
                  setScheduleDate(new Date().toISOString().split('T')[0]);
                  setScheduleTime('');
                  setShowScheduleModal(true);
                }}
                title="Agendar Mensagem"
                style={{ color: message.trim() ? 'var(--primary-color)' : 'var(--text-secondary)' }}
              >
                <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>

              <div className="wa-input-icon">
                {/* Ícone de Clipe/Anexo decorativo */}
                <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={(e) => {
                if (message.trim()) {
                  handleSend(e);
                } else {
                  startRecording();
                }
              }} 
              className="wa-send-btn"
              title={message.trim() ? "Enviar mensagem" : "Gravar áudio"}
            >
              {message.trim() ? (
                /* Avião de Enviar */
                <svg viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              ) : (
                /* Microfone */
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1v10M19 10v1a7 7 0 0 1-14 0v-1M12 18v5M8 23h8"/>
                  <rect x="9" y="5" width="6" height="8" rx="3" ry="3"/>
                </svg>
              )}
            </button>
          </form>
        )}

        {/* MODAL: Etiquetar Lead dentro do Chat */}
        {showLabelLeadModal && (
          <div className="wa-modal-backdrop" onClick={() => setShowLabelLeadModal(false)}>
            <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">Etiquetar conversa</h3>
                <span onClick={() => setShowLabelLeadModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
              </div>
              <div className="wa-modal-body" style={{ padding: '10px 20px' }}>
                <p style={{ fontSize: '0.82rem', color: '#8696a0', marginBottom: '15px' }}>
                  Marque as etiquetas para o cliente <strong>{selectedClient.name}</strong>:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tags.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#8696a0', textAlign: 'center', padding: '20px' }}>
                      Nenhuma etiqueta cadastrada no sistema.
                    </div>
                  ) : (
                    tags.map(tag => {
                      const isChecked = activeTagsForSelected.some(t => t.id === tag.id);
                      return (
                        <label 
                          key={tag.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            cursor: 'pointer',
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem' }}>{tag.emoji || '🏷️'}</span>
                            <span 
                              className="wa-label-badge" 
                              style={{ 
                                background: tag.color || '#3b82f6', 
                                color: '#111b21', 
                                fontWeight: '700',
                                marginTop: 0
                              }}
                            >
                              {tag.name}
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => handleToggleTag(tag.id)}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="wa-modal-footer">
                <button 
                  className="btn-primary" 
                  onClick={() => setShowLabelLeadModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: Agendar Mensagem */}
        {showScheduleModal && (
          <div className="wa-modal-backdrop" onClick={() => setShowScheduleModal(false)}>
            <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
              <form onSubmit={handleSchedule}>
                <div className="wa-modal-header">
                  <h3 className="wa-modal-title">Agendar Mensagem</h3>
                  <span onClick={() => setShowScheduleModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
                </div>
                <div className="wa-modal-body">
                  <p style={{ fontSize: '0.82rem', color: '#8696a0', marginBottom: '15px' }}>
                    Escolha a data e hora para enviar esta mensagem para <strong>{selectedClient.name}</strong>:
                  </p>
                  
                  <div className="wa-form-group">
                    <label>Data de Envio</label>
                    <input 
                      type="date" 
                      value={scheduleDate} 
                      onChange={e => setScheduleDate(e.target.value)} 
                      className="wa-input-text"
                      required
                    />
                  </div>

                  <div className="wa-form-group">
                    <label>Hora de Envio</label>
                    <input 
                      type="time" 
                      value={scheduleTime} 
                      onChange={e => setScheduleTime(e.target.value)} 
                      className="wa-input-text"
                      required
                    />
                  </div>
                  
                  <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mensagem a ser enviada:</label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '4px 0 0 0', fontStyle: 'italic', wordBreak: 'break-word' }}>
                      "{message}"
                    </p>
                  </div>
                </div>
                <div className="wa-modal-footer">
                  <button 
                    type="button" 
                    onClick={() => setShowScheduleModal(false)}
                    style={{ background: 'transparent', border: 'none', color: '#8696a0', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.85rem' }}
                  >
                    Agendar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Busca e Barra de Filtros */}
      <div style={{ padding: '12px 16px 8px 16px' }}>
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
            placeholder="Pesquisar ou começar uma nova conversa"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', color: '#e9edef', outline: 'none', fontSize: '0.9rem' }}
          />
        </div>
        
        {/* Barra de Filtro de Etiquetas Ativo */}
        {filterTag && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginTop: '8px',
            background: 'rgba(0,168,132,0.08)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid rgba(0,168,132,0.2)'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#8696a0' }}>Filtrado por:</span>
            <span 
              className="wa-label-badge" 
              style={{ 
                background: filterTag.color || '#3b82f6', 
                color: '#111b21', 
                fontWeight: '700',
                margin: 0
              }}
            >
              {filterTag.emoji} {filterTag.name}
            </span>
            <span 
              onClick={() => setFilterTag(null)}
              style={{ 
                marginLeft: 'auto', 
                cursor: 'pointer', 
                color: '#ef4444', 
                fontSize: '0.8rem', 
                fontWeight: '700',
                padding: '2px 6px'
              }}
            >
              Limpar Filtro [X]
            </span>
          </div>
        )}
      </div>

      {/* Lista de Conversas */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {filteredClients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--text-secondary)' }}>
            Nenhum chat encontrado {filterTag && 'com essa etiqueta'}.
          </div>
        ) : (
          filteredClients.map(c => {
            const clientTags = leadTags[c.phone] || [];
            return (
              <div 
                key={c.id} 
                onClick={() => {
                  setSelectedClient(c);
                  // Zerar notificações não lidas no clique
                  if (c.unreadCount > 0) {
                    const token = localStorage.getItem('crm-token');
                    fetch(`/backend/api/chats/${c.id}/read`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    }).then(() => syncChats());
                  }
                }}
                className="wa-chat-item"
                style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  gap: '12px', 
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--glass-border)',
                  background: c.unreadCount > 0 ? 'rgba(0, 168, 132, 0.05)' : 'transparent'
                }}
              >
                {/* Avatar */}
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', background: '#202c33', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  {c.image ? <img src={c.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                </div>
                
                {/* Nome, snippet e tags */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{ fontWeight: '500', fontSize: '0.96rem', color: '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: c.unreadCount > 0 ? 'var(--primary-color)' : '#8696a0', fontWeight: c.unreadCount > 0 ? '600' : '400' }}>
                      {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      {c.lastMessage || 'Sem mensagens'}
                    </div>
                    
                    {c.unreadCount > 0 && (
                      <div style={{ 
                        background: 'var(--primary-color)', 
                        color: '#111b21', 
                        fontSize: '0.7rem', 
                        minWidth: '18px', 
                        height: '18px', 
                        borderRadius: '50%', 
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px'
                      }}>
                        {c.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Atendente atribuído (Apenas para admin) */}
                  {currentUser?.role === 'admin' && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', marginBottom: '2px' }}>
                      <span 
                        style={{ 
                          background: c.assigned_user_id ? 'rgba(0, 168, 132, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                          color: c.assigned_user_id ? '#00a884' : '#ef4444',
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontWeight: '600',
                          border: c.assigned_user_id ? '1px solid rgba(0, 168, 132, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        👤 {c.assigned_user_name || 'Sem atendente'}
                      </span>
                    </div>
                  )}

                  {/* Badges de etiquetas */}
                  {clientTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                      {clientTags.map(tag => (
                        <span 
                          key={tag.id} 
                          className="wa-label-badge" 
                          style={{ 
                            background: tag.color || '#3b82f6', 
                            color: '#111b21',
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: '700'
                          }}
                        >
                          {tag.emoji} {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB: Botão Flutuante Iniciar Conversa */}
      <button className="wa-fab" onClick={() => setShowNewChatModal(true)}>
        <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
      </button>

      {/* MODAL: Iniciar nova conversa */}
      {showNewChatModal && (
        <div className="wa-modal-backdrop" onClick={() => setShowNewChatModal(false)}>
          <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleStartNewChat}>
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">Iniciar nova conversa</h3>
                <span onClick={() => setShowNewChatModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
              </div>
              <div className="wa-modal-body">
                {newChatError && (
                  <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' }}>
                    {newChatError}
                  </div>
                )}
                <div className="wa-form-group">
                  <label>WhatsApp (com DDD)</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 11999998888" 
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    className="wa-input-text"
                    required
                    autoFocus
                  />
                </div>
                <div className="wa-form-group">
                  <label>Nome do Lead/Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: João Silva" 
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    className="wa-input-text"
                  />
                </div>
              </div>
              <div className="wa-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowNewChatModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={newChatLoading}
                  style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  {newChatLoading ? 'Iniciando...' : 'Iniciar Conversa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gerenciador de Etiquetas */}
      {showTagsManagerModal && (
        <div className="wa-modal-backdrop" onClick={() => setShowTagsManagerModal(false)}>
          <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
            <div className="wa-modal-header">
              <h3 className="wa-modal-title">Etiquetas</h3>
              <span onClick={() => setShowTagsManagerModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
            </div>
            
            <div className="wa-modal-body" style={{ maxHeight: '50vh' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tags.length === 0 ? (
                  <div style={{ color: '#8696a0', fontSize: '0.9rem', textAlign: 'center', padding: '30px' }}>
                    Nenhuma etiqueta cadastrada.
                  </div>
                ) : (
                  tags.map(tag => (
                    <div 
                      key={tag.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#2a3942',
                        borderRadius: '6px'
                      }}
                    >
                      {/* Clicar na tag aplica o filtro */}
                      <div 
                        onClick={() => {
                          setFilterTag(tag);
                          setShowTagsManagerModal(false);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{tag.emoji || '🏷️'}</span>
                        <span 
                          className="wa-label-badge" 
                          style={{ 
                            background: tag.color || '#3b82f6', 
                            color: '#111b21',
                            fontWeight: '700',
                            marginTop: 0
                          }}
                        >
                          {tag.name}
                        </span>
                      </div>
                      
                      {/* Ações */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {/* Editar */}
                        <svg 
                          onClick={() => {
                            setEditingTag(tag);
                            setTagName(tag.name);
                            setTagColor(tag.color || PREDEFINED_COLORS[0]);
                            setTagEmoji(tag.emoji || '🏷️');
                            setShowTagEditorModal(true);
                          }}
                          style={{ width: '18px', height: '18px', color: '#8696a0', cursor: 'pointer' }} 
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        
                        {/* Excluir */}
                        <svg 
                          onClick={() => handleDeleteTag(tag.id)}
                          style={{ width: '18px', height: '18px', color: '#ef4444', cursor: 'pointer' }} 
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="wa-modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => {
                  setEditingTag(null);
                  setTagName('');
                  setTagColor(PREDEFINED_COLORS[0]);
                  setTagEmoji('🏷️');
                  setShowTagEditorModal(true);
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '4px', fontSize: '0.9rem' }}
              >
                + Criar Nova Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AUXILIAR: Criar/Editar Etiqueta Individual */}
      {showTagEditorModal && (
        <div className="wa-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowTagEditorModal(false)}>
          <div className="wa-modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSaveTag}>
              <div className="wa-modal-header">
                <h3 className="wa-modal-title">{editingTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}</h3>
                <span onClick={() => setShowTagEditorModal(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>✕</span>
              </div>
              <div className="wa-modal-body">
                <div className="wa-form-group">
                  <label>Nome da Etiqueta</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Novo Cliente" 
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="wa-input-text"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="wa-form-group">
                  <label>Emoji</label>
                  <input 
                    type="text" 
                    placeholder="Emoji identificador (ex: 🏷️)" 
                    value={tagEmoji}
                    onChange={(e) => setTagEmoji(e.target.value)}
                    className="wa-input-text"
                    maxLength="5"
                  />
                </div>

                <div className="wa-form-group">
                  <label>Cor da Etiqueta</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                    {PREDEFINED_COLORS.map(color => (
                      <div 
                        key={color} 
                        onClick={() => setTagColor(color)}
                        style={{ 
                          height: '36px', 
                          background: color, 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          border: tagColor === color ? '3px solid white' : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: tagColor === color ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="wa-modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowTagEditorModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#8696a0', padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Voltar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '8px 16px', borderRadius: '4px', fontSize: '0.85rem' }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMessages;
