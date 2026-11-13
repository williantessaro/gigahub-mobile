import React, { useState, useEffect, useRef } from 'react';

export default function MobileGigaMente({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'roadmap' ou 'agents'

  // Estados do Chat e Sessões
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null); // null = draft novo chat
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Estados de Gravação de Áudio Real (WhatsApp Voice Note)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveRecordingTranscript, setLiveRecordingTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const speechTranscriptRef = useRef('');
  const recognitionRef = useRef(null);

  // Estados da Chamada de Voz ao Vivo (Live Audio Call - Falar e Ouvir sem Clicar)
  const [isInLiveCall, setIsInLiveCall] = useState(false);
  const [liveCallSeconds, setLiveCallSeconds] = useState(0);
  const [liveCallStatus, setLiveCallStatus] = useState('GigaMente ouvindo...'); // 'ouvindo', 'pensando', 'falando'
  const [liveUserSpokenText, setLiveUserSpokenText] = useState('');
  const [liveAiResponseText, setLiveAiResponseText] = useState('');
  const [isCallMuted, setIsCallMuted] = useState(false);
  const liveCallTimerRef = useRef(null);
  const liveCallRecognitionRef = useRef(null);
  const liveCallSilenceTimerRef = useRef(null);

  // Estados do Roadmap
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [roadmapFilter, setRoadmapFilter] = useState('ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // Estados da CReMosa 2.0 no Mobile
  const [cremosaMetrics, setCremosaMetrics] = useState({
    status: 'ACTIVE',
    today_count: 0,
    today_limit: 100,
    hour_count: 0,
    hour_limit: 20,
    window_open: true,
    circuit_breaker_tripped: false,
    history: []
  });
  const [showCremosaModal, setShowCremosaModal] = useState(false);
  const [isCremosaLoading, setIsCremosaLoading] = useState(false);
  const [cremosaFeedback, setCremosaFeedback] = useState(null);

  // Estados para a aba Agentes e Modal de Detalhes
  const [selectedAgentForModal, setSelectedAgentForModal] = useState(null);
  const [agentFilter, setAgentFilter] = useState('ALL');

  // =========================================================================
  // ESTADOS DO ESTÚDIO GIGA VÍDEOS NO MOBILE (AVATARES, ROTEIRO IA & GALERIA)
  // =========================================================================
  const [videoSubTab, setVideoSubTab] = useState('produce'); // 'produce' | 'clones' | 'gallery'
  const [showQuickVideoSheet, setShowQuickVideoSheet] = useState(false);
  const [videoStudioSummary, setVideoStudioSummary] = useState({
    clones_count: 0,
    jobs_total: 0,
    jobs_pending: 0,
    jobs_completed: 0,
    gpu_worker_online: false,
    active_worker: null
  });
  const [videoClones, setVideoClones] = useState([]);
  const [videoJobs, setVideoJobs] = useState([]);

  // Formulário de Produção de Vídeo
  const [selectedCloneName, setSelectedCloneName] = useState('');
  const [videoScriptText, setVideoScriptText] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState('9:16');
  const [isCreatingVideoJob, setIsCreatingVideoJob] = useState(false);
  const [videoActionFeedback, setVideoActionFeedback] = useState('');

  // Assistente de Roteiro IA & Ditado por Voz
  const [showAiScriptBox, setShowAiScriptBox] = useState(false);
  const [aiScriptPrompt, setAiScriptPrompt] = useState('');
  const [aiScriptTone, setAiScriptTone] = useState('natural, confiante e persuasivo');
  const [isImprovingScript, setIsImprovingScript] = useState(false);
  const [isDictatingScript, setIsDictatingScript] = useState(false);
  const scriptDictationRef = useRef(null);
  const [jobSceneMediaBase64, setJobSceneMediaBase64] = useState('');
  const [jobSceneMediaType, setJobSceneMediaType] = useState('');
  const [jobSceneMediaName, setJobSceneMediaName] = useState('');

  // Formulário de Criação / Atualização de Avatar (Foto, Vídeo 2-em-1 e Gravação de Voz)
  const [newCloneName, setNewCloneName] = useState('');
  const [newCloneGender, setNewCloneGender] = useState('M');
  const [newClonePhotoBase64, setNewClonePhotoBase64] = useState('');
  const [newCloneVoiceBase64, setNewCloneVoiceBase64] = useState('');
  const [newCloneVoiceName, setNewCloneVoiceName] = useState('');
  const [isSavingClone, setIsSavingClone] = useState(false);
  const [isExtractingFromVideo, setIsExtractingFromVideo] = useState(false);
  const [isRecordingCloneVoice, setIsRecordingCloneVoice] = useState(false);
  const [cloneVoiceRecSeconds, setCloneVoiceRecSeconds] = useState(0);
  const cloneVoiceRecorderRef = useRef(null);
  const cloneVoiceChunksRef = useRef([]);
  const cloneVoiceStreamRef = useRef(null);
  const cloneVoiceTimerRef = useRef(null);

  // Estados de Configuração VPS (Interno/Transparente)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [vpsEngineUrl, setVpsEngineUrl] = useState('http://2.25.114.101:5005/api/gigamente/webhook');
  const [vpsApiKey, setVpsApiKey] = useState('gigamente-secret-key-prod-2026');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  // Personalização da Fala (ADR 0018: Velocidade, Tom e Seleção de Voz)
  const [ttsRate, setTtsRate] = useState(() => localStorage.getItem('gigamente_tts_rate') || '1.15');
  const [ttsPitch, setTtsPitch] = useState(() => localStorage.getItem('gigamente_tts_pitch') || '1.0');
  const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('gigamente_tts_voice') || '');
  const [availableVoices, setAvailableVoices] = useState([]);

  const handleUpdateTtsRate = (newRate) => {
    setTtsRate(newRate);
    localStorage.setItem('gigamente_tts_rate', newRate);
    if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.setSpeechRate === 'function') {
      window.AndroidTTS.setSpeechRate(parseFloat(newRate));
    }
  };

  const handleUpdateTtsPitch = (newPitch) => {
    setTtsPitch(newPitch);
    localStorage.setItem('gigamente_tts_pitch', newPitch);
    if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.setPitch === 'function') {
      window.AndroidTTS.setPitch(parseFloat(newPitch));
    }
  };

  const handleUpdateTtsVoice = (newVoice) => {
    setTtsVoice(newVoice);
    localStorage.setItem('gigamente_tts_voice', newVoice);
    if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.setVoice === 'function') {
      window.AndroidTTS.setVoice(newVoice);
    }
  };

  const handleTestVoice = () => {
    speakTextAloud('Fala! Essa é a velocidade e o tom da minha voz no GigaMente.');
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('crm-token') || localStorage.getItem('portal_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Carregar sessões e configs ao montar
  useEffect(() => {
    fetchConfig();
    fetchSessions();
    fetchRoadmap();
    fetchCremosaMetrics();
    fetchVideoStudioSummary();

    const cremosaPoll = setInterval(fetchCremosaMetrics, 30000);

    // Começa sempre em um NOVO CHAT em branco (conforme solicitado no alinhamento)
    setActiveSessionId(null);
    setMessages([]);

    // Carregar vozes nativas do Android ou do navegador
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.getVoices === 'function') {
        try {
          const raw = window.AndroidTTS.getVoices();
          const parsed = JSON.parse(raw || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAvailableVoices(parsed);
          }
        } catch (e) {
          console.warn('Erro ao carregar vozes Android:', e);
        }
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices().filter(x => (x.lang || '').toLowerCase().startsWith('pt'));
        if (v.length > 0) {
          setAvailableVoices(v.map(x => ({ name: x.name, locale: x.lang })));
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Aplicar configurações iniciais salvas no AndroidTTS
    if (typeof window !== 'undefined' && window.AndroidTTS) {
      if (typeof window.AndroidTTS.setSpeechRate === 'function') window.AndroidTTS.setSpeechRate(parseFloat(ttsRate));
      if (typeof window.AndroidTTS.setPitch === 'function') window.AndroidTTS.setPitch(parseFloat(ttsPitch));
      if (ttsVoice && typeof window.AndroidTTS.setVoice === 'function') window.AndroidTTS.setVoice(ttsVoice);
    }

    // Configurar SpeechRecognition em paralelo para capturar a transcrição do áudio gravado
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            speechTranscriptRef.current = transcript.trim();
            setLiveRecordingTranscript(transcript.trim());
          }
        };

        recognitionRef.current = recognition;
      }
    } catch (e) {
      console.warn('SpeechRecognition não suportado no navegador móvel atual:', e);
    }

    return () => {
      stopAudioStream();
      stopLiveCall();
      stopCloneVoiceRecordingStream();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (cloneVoiceTimerRef.current) clearInterval(cloneVoiceTimerRef.current);
      clearInterval(cremosaPoll);
    };
  }, []);

  // Atualização em tempo real do Estúdio Giga Vídeos (progresso e status do motor RTX)
  useEffect(() => {
    const shouldPollFast = activeTab === 'videos' || showQuickVideoSheet || videoStudioSummary.jobs_pending > 0;
    const intervalMs = shouldPollFast ? 4000 : 15000;
    const t = setInterval(() => {
      fetchVideoStudioSummary();
      if (activeSessionId && videoStudioSummary.jobs_pending > 0) {
        fetchMessages(activeSessionId);
      }
    }, intervalMs);
    return () => clearInterval(t);
  }, [activeTab, showQuickVideoSheet, videoStudioSummary.jobs_pending, activeSessionId]);

  // Ajustar altura do Textarea conforme o usuário digita
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Rolar para a última mensagem
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/backend/api/gigamente/config', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.engine_url) setVpsEngineUrl(data.engine_url);
        if (data.api_key) setVpsApiKey(data.api_key);
      }
    } catch (err) {
      console.warn('Erro ao carregar configs do GigaMente:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/backend/api/gigamente/sessions', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Erro ao buscar sessões:', err);
    }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await fetch(`/backend/api/gigamente/sessions/${sessionId}/messages`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setShowHistoryDrawer(false);
    fetchMessages(sessionId);
  };

  const handleStartNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowHistoryDrawer(false);
  };

  const ensureSessionExists = async (initialTitle = 'Nova Conversa') => {
    if (activeSessionId) return activeSessionId;

    try {
      const res = await fetch('/backend/api/gigamente/sessions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: initialTitle })
      });
      if (res.ok) {
        const data = await res.json();
        const newId = data.session.id;
        setActiveSessionId(newId);
        fetchSessions();
        return newId;
      }
    } catch (err) {
      console.error('Erro ao criar sessão automática:', err);
    }
    return `session-${Date.now()}`;
  };

  const fetchRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const res = await fetch('/backend/api/gigamente/roadmap', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRoadmapItems(data.items || []);
      }
    } catch (err) {
      console.error('Erro ao buscar roadmap:', err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const stopAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  };

  const cleanTextForSpeech = (rawText) => {
    if (!rawText) return '';
    let text = rawText;

    // 1. Remover todos os emojis para o TTS não falar "foguete", "gráfico", "microfone", etc.
    text = text.replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{FE0F}\u{200D}\u{FE0E}]/gu, '');

    // 2. Remover divisores horizontais (---, ___, ===) para não falar "hífen hífen hífen"
    text = text.replace(/^[ \t]*[-_=]{3,}[ \t]*$/gm, '. ');
    text = text.replace(/[-_=]{3,}/g, '. ');

    // 3. Remover títulos markdown (###, ##, #) para não falar "hashtag" ou "jogo da velha"
    text = text.replace(/#{1,6}\s?/g, '');

    // 4. Remover formatações de negrito, itálico e tachado (**, *, __, _, ~~) para não falar "asterisco"
    text = text.replace(/\*\*/g, '');
    text = text.replace(/\*/g, '');
    text = text.replace(/_{2,}/g, '');
    text = text.replace(/~/g, '');

    // 5. Remover marcadores de listas (*, -, +) no início de linhas ou entre itens
    text = text.replace(/^[ \t]*[-*+]\s+/gm, '');
    text = text.replace(/\s+[-*+]\s+/g, '. ');

    // 6. Limpar códigos inline e blocos de código
    text = text.replace(/`{1,3}[^`]*`{1,3}/g, '');
    text = text.replace(/`{1,3}/g, '');

    // 7. Limpar links markdown [texto](url) mantendo apenas o texto
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // 8. Normalizar pontuação e quebras de linha para pausas naturais na fala
    text = text.replace(/[\r\n]+/g, '. ');
    text = text.replace(/\.\s*\.+/g, '.');
    text = text.replace(/\s+/g, ' ');

    return text.trim();
  };

  const formatInlineStyles = (text) => {
    if (!text) return null;
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining) {
      const match = remaining.match(/(\*\*(.+?)\*\*|`([^`]+)`|\*([^*]+)\*)/);
      if (!match) {
        parts.push(remaining);
        break;
      }

      const matchIndex = match.index;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      if (match[2]) {
        parts.push(<strong key={`b-${keyIdx++}`} className="gm-md-bold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<code key={`c-${keyIdx++}`} className="gm-md-code">{match[3]}</code>);
      } else if (match[4]) {
        parts.push(<em key={`i-${keyIdx++}`} className="gm-md-italic">{match[4]}</em>);
      }

      remaining = remaining.substring(matchIndex + match[0].length);
    }

    return parts;
  };

  const formatMarkdownContent = (rawText) => {
    if (!rawText) return null;

    // Normalizar divisores ou subtítulos grudados
    let text = rawText
      .replace(/\s*---\s*/g, '\n\n---\n\n')
      .replace(/([^\n])\s*(#{1,6}\s+)/g, '$1\n\n$2')
      .replace(/([^\n])\s*(\*\s+\*\*)/g, '$1\n* **');

    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];

    const flushParagraph = (keyPrefix) => {
      if (currentParagraph.length > 0) {
        const pText = currentParagraph.join(' ').trim();
        if (pText) {
          elements.push(
            <p key={`${keyPrefix}-${elements.length}`} className="gm-md-p">
              {formatInlineStyles(pText)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph(idx);
        return;
      }

      if (trimmed === '---' || trimmed === '___') {
        flushParagraph(idx);
        elements.push(<hr key={`hr-${idx}`} className="gm-md-divider" />);
        return;
      }

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph(idx);
        const level = headingMatch[1].length;
        const hContent = formatInlineStyles(headingMatch[2]);
        if (level <= 2) {
          elements.push(<h3 key={`h-${idx}`} className="gm-md-h3">{hContent}</h3>);
        } else {
          elements.push(<h4 key={`h-${idx}`} className="gm-md-h4">{hContent}</h4>);
        }
        return;
      }

      const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/);
      if (bulletMatch) {
        flushParagraph(idx);
        elements.push(
          <div key={`li-${idx}`} className="gm-md-list-item">
            <span className="gm-md-bullet">•</span>
            <div className="gm-md-list-content">{formatInlineStyles(bulletMatch[1])}</div>
          </div>
        );
        return;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        flushParagraph(idx);
        elements.push(
          <div key={`num-${idx}`} className="gm-md-num-item">
            <span className="gm-md-num-badge">{numMatch[1]}</span>
            <div className="gm-md-num-content">{formatInlineStyles(numMatch[2])}</div>
          </div>
        );
        return;
      }

      currentParagraph.push(trimmed);
    });

    flushParagraph('end');
    return <div className="gm-md-container">{elements}</div>;
  };

  const speakTextAloud = (text, onEnd) => {
    try {
      const cleanedText = cleanTextForSpeech(text);

      // 1. Android Nativo via JavascriptInterface (100% gratuito, offline, sem consumo de créditos)
      if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.speak === 'function') {
        if (typeof window.AndroidTTS.setSpeechRate === 'function') window.AndroidTTS.setSpeechRate(parseFloat(ttsRate));
        if (typeof window.AndroidTTS.setPitch === 'function') window.AndroidTTS.setPitch(parseFloat(ttsPitch));
        if (ttsVoice && typeof window.AndroidTTS.setVoice === 'function') window.AndroidTTS.setVoice(ttsVoice);

        window.onAndroidTTSEnd = () => {
          window.onAndroidTTSEnd = null;
          if (onEnd) onEnd();
        };
        window.AndroidTTS.speak(cleanedText);
        return;
      }

      // 2. Fallback Web SpeechSynthesis (Navegadores desktop / Chrome)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'pt-BR';
        utterance.rate = parseFloat(ttsRate) || 1.15;
        utterance.pitch = parseFloat(ttsPitch) || 1.0;

        if (ttsVoice) {
          const matchedVoice = window.speechSynthesis.getVoices().find(v => v.name === ttsVoice);
          if (matchedVoice) utterance.voice = matchedVoice;
        }

        let hasFinished = false;
        const finishOnce = () => {
          if (!hasFinished) {
            hasFinished = true;
            if (onEnd) onEnd();
          }
        };

        utterance.onend = finishOnce;
        utterance.onerror = finishOnce;

        // Fallback de timeout caso onend não dispare
        setTimeout(finishOnce, Math.max(3000, cleanedText.length * 90));

        window.speechSynthesis.speak(utterance);
        return;
      }

      if (onEnd) onEnd();
    } catch (e) {
      console.warn('Erro na síntese de voz:', e);
      if (onEnd) onEnd();
    }
  };

  const toggleLiveCall = () => {
    if (isInLiveCall) {
      stopLiveCall();
    } else {
      startLiveCall();
    }
  };

  const startLiveCall = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('O modo de chamada de voz ao vivo exige suporte a reconhecimento de voz no seu navegador.');
      return;
    }

    setIsInLiveCall(true);
    setLiveCallSeconds(0);
    setLiveUserSpokenText('');
    setLiveAiResponseText('');
    setLiveCallStatus('GigaMente ouvindo...');

    liveCallTimerRef.current = setInterval(() => {
      setLiveCallSeconds(prev => prev + 1);
    }, 1000);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      if (isCallMuted) return;

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        interim += event.results[i][0].transcript;
      }

      if (interim.trim()) {
        setLiveUserSpokenText(interim.trim());
        setLiveCallStatus('Você falando...');
        if (liveCallSilenceTimerRef.current) clearTimeout(liveCallSilenceTimerRef.current);

        liveCallSilenceTimerRef.current = setTimeout(() => {
          if (interim.trim().length > 2) {
            handleLiveCallSpokenMessage(interim.trim());
          }
        }, 1500);
      }
    };

    recognition.onerror = (e) => {
      console.warn('Erro recognition LiveCall:', e);
    };

    try {
      recognition.start();
      liveCallRecognitionRef.current = recognition;
    } catch (e) {
      console.error('Falha ao iniciar reconhecimento na LiveCall:', e);
    }
  };

  const handleLiveCallSpokenMessage = async (spokenText) => {
    if (isThinking) return;

    if (liveCallRecognitionRef.current) {
      try { liveCallRecognitionRef.current.stop(); } catch (e) {}
    }

    setLiveUserSpokenText(spokenText);
    setLiveAiResponseText('');
    setLiveCallStatus('GigaMente pensando...');
    setIsThinking(true);

    const sessionId = await ensureSessionExists(spokenText.slice(0, 30));

    const tempUserMsg = { id: `temp-${Date.now()}`, sender: 'user', content: spokenText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/backend/api/gigamente/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: spokenText, sender: 'user' })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          data.userMessage,
          data.aiMessage
        ]);
        fetchRoadmap();

        const aiText = data.aiMessage?.content || 'Entendido!';
        setLiveAiResponseText(aiText);
        setLiveCallStatus('GigaMente falando...');
        speakTextAloud(aiText, () => {
          setLiveCallStatus('GigaMente ouvindo...');
          if (liveCallRecognitionRef.current) {
            try { liveCallRecognitionRef.current.start(); } catch (e) {}
          }
        });
      }
    } catch (err) {
      console.error('Erro na chamada ao vivo:', err);
      setLiveCallStatus('GigaMente ouvindo...');
      if (liveCallRecognitionRef.current) {
        try { liveCallRecognitionRef.current.start(); } catch (e) {}
      }
    } finally {
      setIsThinking(false);
    }
  };

  const stopLiveCall = () => {
    setIsInLiveCall(false);
    setLiveCallSeconds(0);
    setLiveUserSpokenText('');
    setLiveAiResponseText('');
    if (liveCallTimerRef.current) clearInterval(liveCallTimerRef.current);
    if (liveCallSilenceTimerRef.current) clearTimeout(liveCallSilenceTimerRef.current);
    
    if (liveCallRecognitionRef.current) {
      try { liveCallRecognitionRef.current.stop(); } catch (e) {}
      liveCallRecognitionRef.current = null;
    }
    try {
      if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.stop === 'function') {
        window.AndroidTTS.stop();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Seu navegador não suporta gravação de áudio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }

      const recorder = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      speechTranscriptRef.current = '';

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }

      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Permissão de microfone negada ou erro ao iniciar gravação.');
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }

    stopAudioStream();
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    setLiveRecordingTranscript('');
  };

  const finishAndSendAudioRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const recorder = mediaRecorderRef.current;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      stopAudioStream();

      const reader = new FileReader();
      reader.onloadend = async () => {
        const audioBase64 = reader.result;
        const transcript = speechTranscriptRef.current.trim() || liveRecordingTranscript.trim() || '';
        await sendAudioMessage(audioBase64, transcript);
        setLiveRecordingTranscript('');
      };
      reader.readAsDataURL(audioBlob);

      setIsRecordingAudio(false);
      setRecordingSeconds(0);
    };

    recorder.stop();
  };

  const sendAudioMessage = async (audioBase64, transcriptContent) => {
    if (isSending) return;

    setIsSending(true);
    setIsThinking(true);

    const initialTitle = transcriptContent ? ('Áudio: ' + transcriptContent.slice(0, 25)) : 'Mensagem de voz';
    const sessionId = await ensureSessionExists(initialTitle);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: transcriptContent || '',
      audio_url: audioBase64,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/backend/api/gigamente/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: transcriptContent || '',
          audio_url: audioBase64,
          sender: 'user'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          data.userMessage,
          data.aiMessage
        ]);
        fetchRoadmap();
      }
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
    } finally {
      setIsSending(false);
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const content = textToSend || inputText;
    if (!content.trim() || isSending) return;

    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setIsSending(true);
    setIsThinking(true);

    const sessionId = await ensureSessionExists(content.slice(0, 30));

    const tempUserMsg = { id: `temp-${Date.now()}`, sender: 'user', content, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/backend/api/gigamente/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, sender: 'user' })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          data.userMessage,
          data.aiMessage
        ]);
        fetchRoadmap();
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSending(false);
      setIsThinking(false);
    }
  };

  const handleKeyDownTextarea = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickChipClick = (promptText) => {
    handleSendMessage(promptText);
  };

  const handleCreateRoadmapTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/backend/api/gigamente/roadmap', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTaskTitle, category: 'Geral', priority: 'alta' })
      });
      if (res.ok) {
        setNewTaskTitle('');
        fetchRoadmap();
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(`/backend/api/gigamente/roadmap/${task.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchRoadmap();
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    setConfigMessage('');
    try {
      const res = await fetch('/backend/api/gigamente/config', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          engine_url: vpsEngineUrl,
          api_key: vpsApiKey,
          openai_api_key: openaiApiKey,
          groq_api_key: groqApiKey
        })
      });
      if (res.ok) {
        setConfigMessage('✅ Configuração salva com sucesso!');
        setTimeout(() => setShowConfigModal(false), 1500);
      } else {
        setConfigMessage('❌ Falha ao salvar configurações.');
      }
    } catch (err) {
      setConfigMessage('❌ Erro de conexão ao salvar.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Funções da CReMosa 2.0
  const fetchCremosaMetrics = async () => {
    try {
      const res = await fetch('/backend/api/cremosa/metrics', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCremosaMetrics(prev => ({ ...prev, ...data }));
      }
    } catch (e) {}
  };

  const handleToggleCremosaPause = async () => {
    setIsCremosaLoading(true);
    const isCurrentlyActive = cremosaMetrics.status === 'ACTIVE';
    const endpoint = isCurrentlyActive ? '/backend/api/cremosa/pause' : '/backend/api/cremosa/resume';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        setCremosaMetrics(prev => ({ ...prev, status: isCurrentlyActive ? 'PAUSED' : 'ACTIVE' }));
        fetchCremosaMetrics();
      }
    } catch (e) {
      alert('Erro ao comunicar com a VPS.');
    } finally {
      setIsCremosaLoading(false);
    }
  };

  const handleRunSalesCycleNow = async () => {
    if (!window.confirm('Iniciar varredura comercial autônoma agora?')) return;
    setIsCremosaLoading(true);
    setCremosaFeedback('Varredura em andamento...');
    try {
      const res = await fetch('/backend/api/cremosa/sales-cycle', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ manual_trigger: true })
      });
      if (res.ok) {
        const data = await res.json();
        setCremosaFeedback(`✅ Concluído! ${data.leads_analyzed ? `${data.leads_analyzed} leads analisados.` : 'Ciclo finalizado.'}`);
        fetchCremosaMetrics();
      } else {
        setCremosaFeedback('⚠️ Falha ao processar varredura.');
      }
    } catch (e) {
      setCremosaFeedback('❌ Falha de conexão com a VPS.');
    } finally {
      setIsCremosaLoading(false);
      setTimeout(() => setCremosaFeedback(null), 6000);
    }
  };

  // =========================================================================
  // FUNÇÕES DO MÓDULO GIGA VÍDEOS NO MOBILE
  // =========================================================================
  // Resolve URLs de mídia (/api/v1/videos/... ou /downloads/...) quando rodando dentro do APK Android nativo (localhost)
  const resolveMediaUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    const isApkLocal = window.location.hostname === 'localhost' || window.location.hostname === '';
    const base = isApkLocal ? (localStorage.getItem('crm_server_url') || 'https://app.gigahub.site') : '';
    return base ? `${base.replace(/\/$/, '')}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}` : rawUrl;
  };

  const fetchVideoStudioSummary = async () => {
    try {
      const res = await fetch('/backend/api/videos/summary', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.studio) setVideoStudioSummary(data.studio);
        if (Array.isArray(data.clones)) {
          setVideoClones(data.clones);
          setSelectedCloneName(prev => prev || (data.clones[0] ? data.clones[0].name : ''));
        }
        if (Array.isArray(data.jobs)) {
          setVideoJobs(data.jobs);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar resumo do Giga Vídeos:', err);
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Upload de Foto da Câmera ou Galeria
  const handleClonePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToDataUrl(file);
      setNewClonePhotoBase64(b64);
      setVideoActionFeedback('📸 Foto do rosto carregada com sucesso!');
    } catch (_) {
      setVideoActionFeedback('❌ Não foi possível ler a imagem selecionada.');
    }
  };

  // Upload de Arquivo de Áudio ou Vídeo para Voz
  const handleCloneVoiceFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToDataUrl(file);
      setNewCloneVoiceBase64(b64);
      setNewCloneVoiceName(file.name);
      setVideoActionFeedback(`🎙️ Amostra de voz "${file.name}" carregada!`);
    } catch (_) {
      setVideoActionFeedback('❌ Não foi possível ler o arquivo de voz.');
    }
  };

  // Upload de Vídeo Falando 2-em-1: Extrai automaticamente a Foto do Rosto (Frame HD) + Amostra de Voz!
  const handleCloneVideoSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingFromVideo(true);
    setVideoActionFeedback('⏳ Extraindo foto do rosto e amostra de voz do seu vídeo...');
    try {
      const videoB64 = await fileToDataUrl(file);
      // 1. Define o vídeo como fonte da amostra de voz (o motor FFmpeg + XTTS-v2 extrai o áudio limpo em 22kHz)
      setNewCloneVoiceBase64(videoB64);
      setNewCloneVoiceName(`${file.name} (Voz extraída do vídeo)`);

      // 2. Extrai um frame nítido do rosto usando HTML5 <video> + <canvas>
      const frameB64 = await new Promise((resolve) => {
        const vid = document.createElement('video');
        vid.preload = 'metadata';
        vid.muted = true;
        vid.playsInline = true;
        const objUrl = URL.createObjectURL(file);
        vid.src = objUrl;

        const cleanup = () => {
          try { URL.revokeObjectURL(objUrl); } catch (_) {}
        };

        vid.onloadeddata = () => {
          const targetTime = Math.min(1.0, Math.max(0.2, (vid.duration || 2) * 0.25));
          vid.currentTime = targetTime;
        };

        vid.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 1080;
            let w = vid.videoWidth || 720;
            let h = vid.videoHeight || 1280;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            cleanup();
            resolve(dataUrl);
          } catch (_) {
            cleanup();
            resolve('');
          }
        };

        vid.onerror = () => {
          cleanup();
          resolve('');
        };
      });

      if (frameB64) {
        setNewClonePhotoBase64(frameB64);
        setVideoActionFeedback('✅ Rosto e voz extraídos automaticamente do vídeo! Agora clique em Salvar Avatar.');
      } else {
        setVideoActionFeedback('🎙️ Voz extraída do vídeo! Selecione também uma foto do seu rosto abaixo.');
      }
    } catch (err) {
      setVideoActionFeedback('❌ Erro ao processar vídeo: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsExtractingFromVideo(false);
    }
  };

  // Gravar Amostra de Voz do Avatar direto no Microfone do Celular (15 a 30s)
  const stopCloneVoiceRecordingStream = () => {
    if (cloneVoiceStreamRef.current) {
      cloneVoiceStreamRef.current.getTracks().forEach(t => t.stop());
      cloneVoiceStreamRef.current = null;
    }
  };

  const startCloneVoiceRecording = async () => {
    if (isRecordingCloneVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cloneVoiceStreamRef.current = stream;
      cloneVoiceChunksRef.current = [];
      setCloneVoiceRecSeconds(0);
      setIsRecordingCloneVoice(true);

      cloneVoiceTimerRef.current = setInterval(() => {
        setCloneVoiceRecSeconds(prev => prev + 1);
      }, 1000);

      let options = {};
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };
        else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
        else if (MediaRecorder.isTypeSupported('audio/ogg')) options = { mimeType: 'audio/ogg' };
      }

      const recorder = new MediaRecorder(stream, options);
      cloneVoiceRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) cloneVoiceChunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(cloneVoiceChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewCloneVoiceBase64(String(reader.result || ''));
          setNewCloneVoiceName(`Gravação no Celular (${cloneVoiceRecSeconds || 15}s)`);
          setVideoActionFeedback('🎙️ Sua voz foi gravada e anexada ao Avatar! Clique em Salvar Avatar.');
        };
        reader.readAsDataURL(blob);
        stopCloneVoiceRecordingStream();
      };

      recorder.start();
    } catch (err) {
      alert('Permita o uso do microfone no celular para gravar sua amostra de voz.');
      setIsRecordingCloneVoice(false);
    }
  };

  const stopCloneVoiceRecording = () => {
    if (!isRecordingCloneVoice) return;
    setIsRecordingCloneVoice(false);
    if (cloneVoiceTimerRef.current) clearInterval(cloneVoiceTimerRef.current);
    const rec = cloneVoiceRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    } else {
      stopCloneVoiceRecordingStream();
    }
  };

  // Salvar ou Atualizar Avatar
  const handleSaveClone = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCloneName.trim()) {
      setVideoActionFeedback('⚠️ Digite o nome do Avatar (ex: Eu Giga Tessaro).');
      return;
    }
    if (!newClonePhotoBase64) {
      setVideoActionFeedback('⚠️ Envie uma foto ou vídeo do rosto para salvar o Avatar.');
      return;
    }

    setIsSavingClone(true);
    setVideoActionFeedback('');
    try {
      const res = await fetch('/backend/api/videos/clones', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newCloneName.trim(),
          gender: newCloneGender,
          photo_base64: newClonePhotoBase64,
          voice_sample_base64: newCloneVoiceBase64 || null
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao salvar avatar.');
      }

      setVideoActionFeedback(`✅ Avatar "${data.clone.name}" salvo com sucesso!`);
      setSelectedCloneName(data.clone.name);
      setNewCloneName('');
      setNewClonePhotoBase64('');
      setNewCloneVoiceBase64('');
      setNewCloneVoiceName('');
      await fetchVideoStudioSummary();
      setTimeout(() => setVideoSubTab('produce'), 900);
    } catch (err) {
      setVideoActionFeedback(`❌ ${err.message}`);
    } finally {
      setIsSavingClone(false);
    }
  };

  const handleDeleteClone = async (cloneId, cloneName) => {
    if (!window.confirm(`Deseja remover o avatar "${cloneName}"?`)) return;
    try {
      await fetch(`/backend/api/videos/clones/${cloneId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchVideoStudioSummary();
    } catch (_) {}
  };

  // Ditado por Voz para o Roteiro (Script)
  const toggleScriptDictation = () => {
    if (isDictatingScript) {
      setIsDictatingScript(false);
      try { scriptDictationRef.current?.stop(); } catch (_) {}
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador atual não suporta ditado direto. Você pode usar o microfone do teclado do celular!');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = false;
      scriptDictationRef.current = rec;
      setIsDictatingScript(true);

      rec.onresult = (ev) => {
        let spoken = '';
        for (let i = 0; i < ev.results.length; i++) {
          spoken += ev.results[i][0].transcript + ' ';
        }
        if (spoken.trim()) {
          setVideoScriptText(prev => (prev ? `${prev.trim()} ${spoken.trim()}` : spoken.trim()));
        }
      };
      rec.onend = () => setIsDictatingScript(false);
      rec.onerror = () => setIsDictatingScript(false);
      rec.start();
    } catch (_) {
      setIsDictatingScript(false);
    }
  };

  // ✨ Criar / Melhorar Roteiro com IA
  const handleImproveScriptWithAi = async () => {
    const idea = aiScriptPrompt.trim() || videoScriptText.trim();
    if (!idea) {
      setVideoActionFeedback('⚠️ Digite ou fale sobre o que é o vídeo (ou escreva um rascunho) para a IA montar o roteiro!');
      return;
    }
    setIsImprovingScript(true);
    setVideoActionFeedback('✨ GigaMente criando um roteiro natural e persuasivo...');
    try {
      const res = await fetch('/backend/api/videos/improve-script', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: aiScriptPrompt.trim(),
          current_script: videoScriptText.trim(),
          clone_name: selectedCloneName || 'Giga Tessaro',
          tone: aiScriptTone
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao melhorar roteiro.');
      }
      setVideoScriptText(data.script_text);
      setShowAiScriptBox(false);
      setVideoActionFeedback('✅ Roteiro criado pela IA! Revise abaixo e toque em Produzir Vídeo.');
    } catch (err) {
      setVideoActionFeedback(`❌ ${err.message}`);
    } finally {
      setIsImprovingScript(false);
    }
  };

  // Selecionar Foto ou Vídeo de Cena na hora do pedido
  const handleSelectJobSceneMedia = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setJobSceneMediaBase64(String(reader.result || ''));
      setJobSceneMediaType(isVideo ? 'video' : 'image');
      setJobSceneMediaName(file.name || (isVideo ? 'cena.mp4' : 'cena.jpg'));
      setVideoActionFeedback(
        isVideo
          ? `🎥 Vídeo de cena "${file.name}" anexado ao pedido! O motor usará este vídeo em movimento com sua voz.`
          : `📸 Foto de cena "${file.name}" anexada ao pedido! O motor animará esta cena mantendo o enquadramento.`
      );
    };
    reader.readAsDataURL(file);
  };

  // Criar Vídeo na Fila
  const handleCreateVideoJob = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedCloneName.trim()) {
      setVideoActionFeedback('⚠️ Escolha qual Avatar vai falar no vídeo.');
      return;
    }
    if (!videoScriptText.trim()) {
      setVideoActionFeedback('⚠️ Digite, dite ou peça para a IA criar o roteiro que o Avatar vai falar.');
      return;
    }

    setIsCreatingVideoJob(true);
    setVideoActionFeedback('');
    try {
      const res = await fetch('/backend/api/videos/jobs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          clone_name: selectedCloneName.trim(),
          script_text: videoScriptText.trim(),
          aspect_ratio: videoAspectRatio,
          session_id: activeSessionId,
          scene_media_base64: jobSceneMediaBase64 || null,
          scene_media_type: jobSceneMediaType || null
        })
      });
      const data = await res.json();

      if (res.status === 404 && data.code === 'CLONE_NOT_FOUND') {
        setNewCloneName(data.missing_clone_name || selectedCloneName.trim());
        setShowQuickVideoSheet(false);
        setActiveTab('videos');
        setVideoSubTab('clones');
        setVideoActionFeedback(`📸 O avatar "${selectedCloneName}" ainda não existe. Envie sua foto ou vídeo abaixo para criá-lo!`);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar vídeo para a fila.');
      }

      setVideoScriptText('');
      setJobSceneMediaBase64('');
      setJobSceneMediaType('');
      setJobSceneMediaName('');
      setShowQuickVideoSheet(false);
      setVideoActionFeedback(`🎬 Vídeo #${data.job.id} na fila! Acompanhe o progresso na Galeria.`);
      await fetchVideoStudioSummary();
      setActiveTab('videos');
      setVideoSubTab('gallery');
    } catch (err) {
      setVideoActionFeedback(`❌ ${err.message}`);
    } finally {
      setIsCreatingVideoJob(false);
    }
  };

  const handleRetryVideoJob = async (jobId) => {
    try {
      await fetch(`/backend/api/videos/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      setVideoActionFeedback(`🔄 Vídeo #${jobId} reenviado para a fila do motor RTX!`);
      fetchVideoStudioSummary();
    } catch (_) {}
  };

  const handleDeleteVideoJob = async (jobId) => {
    if (!window.confirm(`Deseja excluir permanentemente o vídeo #${jobId}?`)) return;
    try {
      const res = await fetch(`/backend/api/videos/jobs/${jobId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setVideoActionFeedback(`🗑️ Vídeo #${jobId} excluído.`);
        fetchVideoStudioSummary();
      }
    } catch (_) {}
  };

  // Compartilhamento Nativo no Celular (WhatsApp, Reels, TikTok, Telegram)
  const handleShareVideo = async (job) => {
    const rawUrl = resolveMediaUrl(job?.video_url || `/api/v1/videos/jobs/${job?.id}/download`);
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `${window.location.origin}${rawUrl}`;
    try {
      if (navigator.share) {
        // Tenta compartilhar o arquivo MP4 direto se o navegador suportar canShare({ files })
        try {
          const resp = await fetch(fullUrl);
          if (resp.ok) {
            const blob = await resp.blob();
            const file = new File([blob], `GigaVideo-${job?.id || 'avatar'}.mp4`, { type: 'video/mp4' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `Giga Vídeos — ${job?.clone_name || 'Avatar'}`,
                text: job?.script_text || 'Vídeo gerado no Giga Vídeos',
                files: [file]
              });
              return;
            }
          }
        } catch (_) {}

        await navigator.share({
          title: `Giga Vídeos — ${job?.clone_name || 'Avatar'}`,
          text: `${job?.script_text || 'Confira este vídeo!'}\n${fullUrl}`,
          url: fullUrl
        });
        return;
      }
      await navigator.clipboard.writeText(fullUrl);
      alert('🔗 Link do vídeo MP4 copiado! Cole no WhatsApp ou onde desejar.');
    } catch (_) {}
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const filteredRoadmap = roadmapItems.filter(item => {
    if (roadmapFilter === 'PENDING') return item.status !== 'COMPLETED';
    if (roadmapFilter === 'COMPLETED') return item.status === 'COMPLETED';
    return true;
  });

  const handleStartChatWithAgent = (agent) => {
    setActiveTab('chat');
    setSelectedAgentForModal(null);
    if (agent && agent.defaultPrompt) {
      setInputText(agent.defaultPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 200);
    }
  };

  const agentsList = [
    {
      id: 'gigamente_core',
      name: 'GigaMente Core',
      role: 'Motor Estratégico & Multi-agente',
      category: 'CORE',
      icon: '🧠',
      badge: 'Ativo',
      badgeType: 'active',
      tag: 'Motor Central VPS',
      shortDesc: 'Orquestrador central de inteligência, análise de dados e checklist.',
      fullDesc: 'Motor primário do ecossistema GigaHub. Responsável por planejar ações operacionais, analisar o funil do CRM, processar regras de negócio e orientar tomadas de decisão estratégicas.',
      highlights: ['Orquestração Multi-agente', 'CheckList Integrado', 'Tomada de Decisão', 'Conexão VPS 24/7'],
      metrics: [
        { label: 'Status', val: '🟢 Operacional' },
        { label: 'Latência', val: '~420ms' },
        { label: 'Modelo', val: 'VPS Engine' }
      ],
      defaultPrompt: 'GigaMente Core, faça um diagnóstico estratégico das nossas prioridades atuais.'
    },
    {
      id: 'cremosa',
      name: 'CReMosa 2.0',
      role: 'Gerente Comercial Autônoma',
      category: 'SALES',
      icon: '💃',
      badge: cremosaMetrics.status === 'ACTIVE' ? 'Ativa' : 'Pausada',
      badgeType: cremosaMetrics.status === 'ACTIVE' ? 'active' : 'standby',
      tag: 'Voz WhatsApp & Conversão',
      shortDesc: 'Copiloto de vendas com áudios hiper-realistas e recuperação de leads no WhatsApp.',
      fullDesc: 'Especialista em fechamento e nutrição comercial. Envia mensagens e áudios com tom humano, respeitando limites anti-bloqueio (CReMosa Protocol 2.0), conduzindo leads pelo funil até o fechamento.',
      highlights: ['Áudios Naturais WhatsApp', 'Limite Inteligente de Envios', 'Gatilhos de Urgência', 'Sincronia com Kanban'],
      metrics: [
        { label: 'Hoje', val: `${cremosaMetrics.today_count}/${cremosaMetrics.today_limit}` },
        { label: 'Janela', val: cremosaMetrics.window_open ? 'Aberta' : 'Fechada' },
        { label: 'Velocidade', val: `${ttsRate}x` }
      ],
      hasCustomAction: true,
      customActionLabel: '💃 Painel CReMosa',
      defaultPrompt: 'Oi CReMosa! Como podemos aumentar a conversão dos leads parados na coluna Proposta hoje?'
    },
    {
      id: 'prospector',
      name: 'Operador de Prospecção',
      role: 'Mineração & Validação Ativa',
      category: 'OPS',
      icon: '🔍',
      badge: 'Operacional',
      badgeType: 'active',
      tag: 'Mineração de Contatos',
      shortDesc: 'Varre contatos qualificados, valida números no WhatsApp e cadastra no CRM.',
      fullDesc: 'Braço de aquisição rápida do GigaHub. Encontra contatos segmentados, verifica se possuem conta ativa no WhatsApp e cadastra automaticamente na coluna Entrada do funil comercial com dados completos.',
      highlights: ['Varredura Segmentada', 'Validação WhatsApp Real', 'Auto-cadastro no CRM', 'Etiquetagem por Nicho'],
      metrics: [
        { label: 'Validador', val: 'Online' },
        { label: 'Alvo', val: 'B2B / Local' },
        { label: 'Injeção CRM', val: 'Automática' }
      ],
      defaultPrompt: 'Operador de Prospecção, preciso de uma nova lista de contatos qualificados. Como procedemos?'
    },
    {
      id: 'gigavideos',
      name: 'Giga Vídeos',
      role: 'Estúdio de Clones IA & Lip-Sync 3D',
      category: 'SALES',
      icon: '🎬',
      badge: videoStudioSummary.gpu_worker_online ? 'Motor RTX Online' : 'Motor desligado',
      badgeType: videoStudioSummary.gpu_worker_online ? 'active' : 'standby',
      tag: 'XTTS-v2 + SadTalker 3D',
      shortDesc: 'Cria vídeos ultra-realistas com seu avatar, voz clonada em português e roteiro IA pelo celular.',
      fullDesc: 'Estúdio móvel completo integrado à sua placa NVIDIA RTX 2060. Cadastre seu avatar enviando um vídeo seu falando ou foto + voz, peça roteiros persuasivos para a IA e baixe ou compartilhe os vídeos MP4 direto no WhatsApp e Reels.',
      highlights: ['Extração 2-em-1 de Rosto e Voz por Vídeo', 'Clonagem de Voz Real XTTS-v2', 'Roteirista IA Integrado', 'Compartilhamento Direto WhatsApp/Reels'],
      metrics: [
        { label: 'Avatares', val: `${videoClones.length}` },
        { label: 'Vídeos', val: `${videoJobs.length}` },
        { label: 'Motor PC', val: videoStudioSummary.gpu_worker_online ? '🟢 Online' : '🔴 Desligado' }
      ],
      hasCustomAction: true,
      customActionLabel: '🎬 Estúdio',
      defaultPrompt: 'Giga Vídeos, crie um vídeo com o clone Giga Tessaro falando: Olá pessoal, estou testando meu novo clone com inteligência artificial!'
    },
    {
      id: 'guardiao',
      name: 'Guardião de Atendimento',
      role: 'Suporte & Triagem 24/7',
      category: 'OPS',
      icon: '🛡️',
      badge: 'Standby',
      badgeType: 'standby',
      tag: 'Triagem & Condomínio',
      shortDesc: 'Responde dúvidas frequentes, tria chamados de inquilinos e agenda retornos.',
      fullDesc: 'Atendente de primeira linha para chamados de clientes e moradores do Gestor Prédios. Funciona ininterruptamente, classificando emergências, respondendo perguntas habituais e gerando protocolos.',
      highlights: ['Atendimento Ininterrupto', 'Triagem de Manutenção', 'Classificação de Urgência', 'Registro Automático'],
      metrics: [
        { label: 'Cobertura', val: '24 Horas' },
        { label: 'Nível', val: 'N1 Triagem' },
        { label: 'Status', val: 'Aguardando' }
      ],
      defaultPrompt: 'Guardião de Atendimento, quais chamados e solicitações de clientes requerem atenção hoje?'
    }
  ];

  const filteredAgents = agentsList.filter(ag => {
    if (agentFilter === 'ALL') return true;
    return ag.category === agentFilter;
  });

  return (
    <div
      className="gm-mobile-container dedicated-room"
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: 'calc(66px + env(safe-area-inset-bottom, 0px))',
        boxSizing: 'border-box'
      }}
    >
      {/* GAVETA LATERAL (DRAWER) DE HISTÓRICO DE CHATS */}
      {showHistoryDrawer && (
        <div
          onClick={() => setShowHistoryDrawer(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '80%',
              maxWidth: '320px',
              height: '100%',
              background: '#161b22',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 16px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#fff' }}>💬 Histórico de Chats</div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <button
              onClick={handleStartNewChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: 'none',
                color: '#fff',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <span>+</span> Novo Chat em Branco
            </button>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  Nenhum chat anterior.
                </div>
              ) : (
                sessions.map(sess => (
                  <button
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: activeSessionId === sess.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: activeSessionId === sess.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      color: '#fff',
                      textAlign: 'left',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <span>💬</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sess.title || `Sessão ${sess.id.slice(0, 8)}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER DA SALA DO GIGAMENTE */}
      <header className="gm-mobile-header">
        <div className="gm-mobile-brand">
          <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>
            {activeTab === 'videos' ? '🎬' : '🧠'}
          </span>

          <div className="gm-title-block">
            <div className="gm-brand-row">
              <span className="gm-mobile-title">
                {activeTab === 'chat' && 'GigaMente AI'}
                {activeTab === 'videos' && 'Giga Vídeos IA'}
                {activeTab === 'roadmap' && 'CheckList'}
                {activeTab === 'agents' && 'Agentes'}
              </span>
              <div
                className="gm-status-dot"
                title={
                  activeTab === 'videos'
                    ? (videoStudioSummary.gpu_worker_online ? 'Motor RTX Online' : 'Motor desligado')
                    : 'Sistema Operacional'
                }
                style={
                  activeTab === 'videos' && !videoStudioSummary.gpu_worker_online
                    ? { background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }
                    : undefined
                }
              />
            </div>
            <span className="gm-mobile-subtitle">
              {activeTab === 'chat' && (activeSessionId ? 'Conversa Ativa' : 'Pronto para Conversar')}
              {activeTab === 'videos' && (videoStudioSummary.gpu_worker_online ? '🟢 Motor RTX 2060 Online' : '🔴 Motor desligado')}
              {activeTab === 'roadmap' && `${roadmapItems.length} tarefas mapeadas`}
              {activeTab === 'agents' && 'Equipe Autônoma Ativa'}
            </span>
          </div>
        </div>

        <div className="gm-mobile-header-actions">
          {activeTab === 'chat' && (
            <>
              <button
                className={`gm-call-pill-btn ${isInLiveCall ? 'active' : ''}`}
                onClick={toggleLiveCall}
                title={isInLiveCall ? 'Encerrar Chamada ao Vivo' : 'Iniciar Chamada de Voz ao Vivo (Falar & Ouvir)'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{isInLiveCall ? 'Ao Vivo' : 'Voz'}</span>
              </button>

              <button className="gm-icon-btn" onClick={handleStartNewChat} title="Novo Chat em Branco">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>

              <button
                className="gm-icon-btn"
                onClick={() => setShowHistoryDrawer(true)}
                title="Histórico de Conversas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </>
          )}

          {activeTab === 'videos' && (
            <button
              className="gm-icon-btn"
              onClick={fetchVideoStudioSummary}
              title="Atualizar Estúdio Giga Vídeos"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}

          {activeTab === 'roadmap' && (
            <button
              className="gm-icon-btn"
              onClick={fetchRoadmap}
              title="Atualizar Checklist"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}

          {activeTab === 'agents' && (
            <button
              className="gm-icon-btn"
              onClick={() => setShowCremosaModal(true)}
              title="Painel CReMosa 2.0"
              style={{
                background: cremosaMetrics.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${cremosaMetrics.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                color: '#fff',
                fontSize: '1rem'
              }}
            >
              💃
            </button>
          )}

          <button className="gm-icon-btn" onClick={() => setShowConfigModal(true)} title="Ajustes de Voz & Motor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ABAS INTERNAS DO GIGAMENTE NO TOPO (CHAT, VÍDEOS, CHECKLIST, AGENTES) */}
      <div style={{
        display: 'flex',
        backgroundColor: '#111b21',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '6px 8px',
        gap: '6px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: activeTab === 'chat' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
            background: activeTab === 'chat' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2))' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'chat' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: activeTab === 'chat' ? '700' : '600',
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          💬 Chat
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('videos');
            fetchVideoStudioSummary();
          }}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: activeTab === 'videos' ? '1px solid rgba(168, 85, 247, 0.65)' : '1px solid rgba(168, 85, 247, 0.25)',
            background: activeTab === 'videos'
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.32), rgba(236, 72, 153, 0.24))'
              : 'rgba(168, 85, 247, 0.08)',
            color: activeTab === 'videos' ? '#fff' : '#e9d5ff',
            fontWeight: activeTab === 'videos' ? '800' : '700',
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>🎬 Vídeos</span>
          {videoStudioSummary.jobs_pending > 0 && (
            <span style={{
              background: '#a855f7',
              color: '#fff',
              borderRadius: '999px',
              padding: '1px 5px',
              fontSize: '0.65rem',
              fontWeight: '800'
            }}>
              {videoStudioSummary.jobs_pending}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: activeTab === 'roadmap' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
            background: activeTab === 'roadmap' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2))' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'roadmap' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: activeTab === 'roadmap' ? '700' : '600',
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          ☑️ CheckList
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('agents')}
          style={{
            flex: 1,
            padding: '7px 4px',
            borderRadius: '8px',
            border: activeTab === 'agents' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
            background: activeTab === 'agents' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.2))' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'agents' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: activeTab === 'agents' ? '700' : '600',
            fontSize: '0.76rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🤖 Agentes
        </button>
      </div>

      {/* OVERLAY DE CHAMADA DE VOZ AO VIVO */}
      {isInLiveCall && (
        <div className="gm-live-call-overlay">
          <div className="gm-live-call-badge">🔴 CANAL DE ÁUDIO AO VIVO ({formatTimer(liveCallSeconds)})</div>
          
          <div className="gm-live-visualizer">
            <div className="gm-wave-bar"></div>
            <div className="gm-wave-bar"></div>
            <div className="gm-wave-bar"></div>
            <div className="gm-wave-bar"></div>
            <div className="gm-wave-bar"></div>
          </div>

          <div className="gm-live-status-text">{liveCallStatus}</div>

          {/* Legendas ao vivo na tela */}
          {(liveUserSpokenText || liveAiResponseText) && (
            <div className="gm-live-captions-box" style={{
              margin: '14px auto',
              maxWidth: '350px',
              width: '90%',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'left',
              maxHeight: '160px',
              overflowY: 'auto'
            }}>
              {liveUserSpokenText && (
                <div style={{ fontSize: '0.84rem', color: '#93c5fd', lineHeight: '1.4' }}>
                  <span style={{ color: '#60a5fa', fontWeight: '600' }}>Você:</span> "{liveUserSpokenText}"
                </div>
              )}
              {liveAiResponseText && (
                <div style={{ fontSize: '0.86rem', color: '#f3f4f6', lineHeight: '1.4' }}>
                  <span style={{ color: '#34d399', fontWeight: '600' }}>🧠 GigaMente:</span> {cleanTextForSpeech(liveAiResponseText).slice(0, 240)}{cleanTextForSpeech(liveAiResponseText).length > 240 ? '...' : ''}
                </div>
              )}
            </div>
          )}

          <p className="gm-live-hint">Fale livremente. O GigaMente responderá em voz alta e continuará escutando você.</p>

          <div className="gm-live-call-controls">
            <button className={`gm-call-ctrl-btn ${isCallMuted ? 'muted' : ''}`} onClick={() => setIsCallMuted(!isCallMuted)}>
              {isCallMuted ? '🔇 Muted' : '🎙️ Mic'}
            </button>
            <button className="gm-call-ctrl-btn hangup" onClick={stopLiveCall}>
              📞 Encerrar
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA SALA */}
      <main className="gm-room-body">
        {activeTab === 'chat' && (
          <div className="gm-chat-pane">
            {/* CHIPS DE ATALHO RÁPIDO */}
            <div className="gm-chips-scroll">
              <button
                className="gm-chip"
                onClick={() => {
                  fetchVideoStudioSummary();
                  setShowQuickVideoSheet(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.2))',
                  borderColor: 'rgba(168, 85, 247, 0.5)',
                  color: '#f3e8ff',
                  fontWeight: '700'
                }}
              >
                🎬 Criar Vídeo / Escolher Avatar
              </button>
              <button className="gm-chip" onClick={() => handleQuickChipClick('Oi CReMosa! Como estão as abordagens dos leads de hoje e o funil comercial?')}>
                💃 Falar com CReMosa
              </button>
              <button className="gm-chip" onClick={() => handleQuickChipClick('Resumo de vendas do dia e status de leads')}>
                📊 Resumo do Dia
              </button>
              <button className="gm-chip" onClick={() => handleQuickChipClick('Quais são as tarefas prioritárias de hoje?')}>
                📝 Tarefas de Hoje
              </button>
            </div>

            {/* FEED DE MENSAGENS */}
            <div className="gm-messages-feed">
              {messages.length === 0 ? (
                <div className="gm-empty-state" style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>🧠</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#fff' }}>Novo Chat com o GigaMente</h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto 16px' }}>
                    Envie uma mensagem, grave um áudio ou toque no botão 🎬 abaixo para escolher seu Avatar e gerar um vídeo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      fetchVideoStudioSummary();
                      setShowQuickVideoSheet(true);
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.2))',
                      color: '#f3e8ff',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer'
                    }}
                  >
                    🎬 Escolher Avatar / Enviar Foto ou Vídeo
                  </button>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`gm-msg-row ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                    <div className="gm-msg-bubble">
                      <div className="gm-msg-sender">
                        {msg.sender === 'user' ? 'Você' : (msg.meta?.agent === 'gigavideos' ? '🎬 Giga Vídeos' : 'GigaMente')}
                      </div>
                      
                      {msg.audio_url ? (
                        <div className="gm-audio-player-wrapper">
                          <div className="gm-audio-badge">🎙️ Mensagem de Voz</div>
                          <audio controls src={msg.audio_url} className="gm-audio-element" />
                          {msg.content && !msg.content.startsWith('[Mensagem de voz') && msg.content !== '🎤 Áudio' && (
                            <div className="gm-msg-content gm-audio-transcript">{formatMarkdownContent(msg.content)}</div>
                          )}
                        </div>
                      ) : (
                        <div className="gm-msg-content">{formatMarkdownContent(msg.content)}</div>
                      )}

                      {/* PLAYER VERTICAL 9:16 DIRETO NO CHAT QUANDO O VÍDEO FICA PRONTO */}
                      {msg.meta?.video_url && (
                        <div style={{
                          marginTop: '10px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          borderRadius: '12px',
                          padding: '10px',
                          border: '1px solid rgba(168, 85, 247, 0.4)'
                        }}>
                          <video
                            controls
                            playsInline
                            src={resolveMediaUrl(msg.meta.video_url)}
                            style={{
                              width: '100%',
                              maxHeight: '340px',
                              borderRadius: '8px',
                              background: '#000',
                              display: 'block'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleShareVideo({
                                id: msg.meta.job_id,
                                clone_name: msg.meta.clone_name,
                                video_url: msg.meta.video_url
                              })}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              📲 Compartilhar
                            </button>
                            <a
                              href={resolveMediaUrl(msg.meta.job_id ? `/api/v1/videos/jobs/${msg.meta.job_id}/download` : `${msg.meta.video_url}?download=1`)}
                              download={`GigaVideo-${msg.meta.job_id || 'clone'}.mp4`}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(168, 85, 247, 0.25)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                color: '#f3e8ff',
                                fontWeight: '700',
                                fontSize: '0.76rem',
                                textDecoration: 'none',
                                textAlign: 'center'
                              }}
                            >
                              ⬇️ Salvar MP4
                            </a>
                          </div>
                        </div>
                      )}

                      {/* ATALHOS INTERATIVOS DO GIGA VÍDEOS NO CHAT */}
                      {(msg.meta?.type === 'giga_video_missing_clone' ||
                        msg.meta?.type === 'giga_video_job_created' ||
                        msg.meta?.type === 'giga_video_open_studio') && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {msg.meta?.type === 'giga_video_missing_clone' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.meta?.missing_clone_name) setNewCloneName(msg.meta.missing_clone_name);
                                if (msg.meta?.pending_script) setVideoScriptText(msg.meta.pending_script);
                                setActiveTab('videos');
                                setVideoSubTab('clones');
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              📸 Enviar Foto / Vídeo de {msg.meta.missing_clone_name || 'Novo Avatar'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('videos');
                              setVideoSubTab(msg.meta?.type === 'giga_video_job_created' ? 'gallery' : 'produce');
                              fetchVideoStudioSummary();
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              background: 'rgba(168, 85, 247, 0.18)',
                              color: '#e9d5ff',
                              fontWeight: '700',
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            🎬 Abrir Giga Vídeos
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isThinking && (
                <div className="gm-msg-row ai thinking">
                  <div className="gm-msg-bubble">
                    <div className="gm-msg-sender">GigaMente</div>
                    <div className="gm-thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* BARRA DE GRAVAÇÃO DE ÁUDIO OU DIGITAÇÃO (COM BOTÃO RÁPIDO 🎬 AVATAR/VÍDEO) */}
            {isRecordingAudio ? (
              <div className="gm-recording-bar">
                <div className="gm-rec-indicator">
                  <div className="gm-rec-pulse"></div>
                  <span className="gm-rec-timer">{formatTimer(recordingSeconds)}</span>
                </div>

                <div className="gm-rec-transcript-preview">
                  {liveRecordingTranscript ? `"${liveRecordingTranscript}"` : 'Gravando áudio...'}
                </div>

                <div className="gm-rec-actions">
                  <button className="gm-rec-btn-cancel" onClick={cancelAudioRecording} title="Cancelar">
                    ✕
                  </button>
                  <button className="gm-rec-btn-send" onClick={finishAndSendAudioRecording} title="Enviar Áudio">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="gm-input-bar">
                {/* BOTÃO RÁPIDO PARA ESCOLHER AVATAR / ENVIAR FOTO OU VÍDEO DIRETO DA BARRA DO CHAT */}
                <button
                  type="button"
                  onClick={() => {
                    fetchVideoStudioSummary();
                    setShowQuickVideoSheet(true);
                  }}
                  title="Escolher Avatar, Enviar Foto/Vídeo ou Criar Vídeo"
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(236, 72, 153, 0.22))',
                    color: '#fff',
                    fontSize: '1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer'
                  }}
                >
                  🎬
                </button>

                <div className="gm-textarea-wrapper">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="gm-textarea-field"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDownTextarea}
                    placeholder="Mensagem ou roteiro de vídeo..."
                    disabled={isSending}
                  />
                </div>

                <button
                  className={`gm-action-btn ${inputText.trim() ? 'send' : 'mic'}`}
                  onClick={() => {
                    if (inputText.trim()) {
                      handleSendMessage();
                    } else {
                      startAudioRecording();
                    }
                  }}
                  disabled={isSending}
                  title={inputText.trim() ? 'Enviar mensagem de texto' : 'Gravar mensagem de áudio'}
                  type="button"
                >
                  {inputText.trim() ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            ABA DEDICADA: 🎬 GIGA VÍDEOS NO CELULAR (PRODUZIR, AVATARES, GALERIA)
           ===================================================================== */}
        {activeTab === 'videos' && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 14px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* BANNER DE STATUS DO MOTOR RTX + SUB-ABAS */}
            <div style={{
              background: '#111b21',
              borderRadius: '14px',
              padding: '12px',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>
                    🎬 Estúdio Giga Vídeos Mobile
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                    Voz Clonada (XTTS-v2) + Lip-Sync 3D (SadTalker)
                  </div>
                </div>
                <span style={{
                  padding: '5px 10px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  whiteSpace: 'nowrap',
                  background: videoStudioSummary.gpu_worker_online ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                  color: videoStudioSummary.gpu_worker_online ? '#34d399' : '#f87171',
                  border: `1px solid ${videoStudioSummary.gpu_worker_online ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.45)'}`
                }}>
                  {videoStudioSummary.gpu_worker_online ? '🟢 Motor RTX Online' : '🔴 Motor desligado'}
                </span>
              </div>

              {/* SUB-ABAS INTERNAS DO ESTÚDIO */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'produce', label: '🎥 Produzir' },
                  { id: 'clones', label: `👤 Avatares (${videoClones.length})` },
                  { id: 'gallery', label: `📂 Galeria (${videoJobs.length})` }
                ].map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setVideoSubTab(st.id)}
                    style={{
                      flex: 1,
                      padding: '8px 6px',
                      borderRadius: '10px',
                      border: videoSubTab === st.id ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                      background: videoSubTab === st.id
                        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(236, 72, 153, 0.25))'
                        : 'rgba(255,255,255,0.04)',
                      color: videoSubTab === st.id ? '#fff' : '#cbd5e1',
                      fontWeight: videoSubTab === st.id ? '800' : '600',
                      fontSize: '0.76rem',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {videoActionFeedback && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background: videoActionFeedback.startsWith('❌')
                  ? 'rgba(239, 68, 68, 0.16)'
                  : 'rgba(168, 85, 247, 0.18)',
                border: `1px solid ${videoActionFeedback.startsWith('❌') ? 'rgba(239,68,68,0.4)' : 'rgba(168,85,247,0.4)'}`,
                color: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {videoActionFeedback}
              </div>
            )}

            {/* SUB-ABA 1: PRODUZIR VÍDEO */}
            {videoSubTab === 'produce' && (
              <form
                onSubmit={handleCreateVideoJob}
                style={{
                  background: '#111b21',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* PASSO 1: ESCOLHER AVATAR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0' }}>
                      1. Escolha seu Avatar (ou crie um novo):
                    </label>
                    <button
                      type="button"
                      onClick={() => setVideoSubTab('clones')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c084fc',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      + Enviar Foto/Vídeo →
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {videoClones.map(clone => {
                      const isSel = selectedCloneName.toLowerCase() === clone.name.toLowerCase();
                      return (
                        <div
                          key={clone.id}
                          onClick={() => setSelectedCloneName(clone.name)}
                          style={{
                            minWidth: '135px',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            border: isSel ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                            background: isSel ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={resolveMediaUrl(clone.photo_url)}
                            alt={clone.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #a855f7' }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.8rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {clone.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: clone.has_voice_clone ? '#34d399' : '#94a3b8' }}>
                              {clone.has_voice_clone ? '🎙️ Voz Clonada' : '🗣️ Voz Neural'}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setVideoSubTab('clones')}
                      style={{
                        minWidth: '130px',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px dashed rgba(168, 85, 247, 0.5)',
                        background: 'rgba(168, 85, 247, 0.08)',
                        color: '#d8b4fe',
                        fontWeight: '700',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      + Novo Avatar (Foto/Vídeo)
                    </button>
                  </div>
                </div>

                {/* PASSO 2: FOTO OU VÍDEO DA CENA DO PEDIDO + FORMATO */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    2. Foto ou Vídeo desta Cena (Opcional — mantém seu enquadramento):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <label
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: jobSceneMediaBase64 ? '1px solid #10b981' : '1px dashed rgba(168, 85, 247, 0.5)',
                        background: jobSceneMediaBase64 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(168, 85, 247, 0.08)',
                        color: jobSceneMediaBase64 ? '#6ee7b7' : '#e9d5ff',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {jobSceneMediaBase64
                        ? `${jobSceneMediaType === 'video' ? '🎥 Vídeo da cena:' : '📸 Foto da cena:'} ${jobSceneMediaName}`
                        : '📸 / 🎥 Enviar Foto ou Vídeo para este pedido'}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleSelectJobSceneMedia}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {jobSceneMediaBase64 && (
                      <button
                        type="button"
                        onClick={() => {
                          setJobSceneMediaBase64('');
                          setJobSceneMediaType('');
                          setJobSceneMediaName('');
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#fca5a5',
                          fontSize: '0.73rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Usar padrão
                      </button>
                    )}
                  </div>

                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Formato do Vídeo:
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { val: '9:16', label: '📱 Vertical 9:16 (Reels)' },
                      { val: '16:9', label: '🖥️ Horizontal 16:9' },
                      { val: '1:1', label: '🟦 Quadrado 1:1' }
                    ].map(fmt => (
                      <button
                        key={fmt.val}
                        type="button"
                        onClick={() => setVideoAspectRatio(fmt.val)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: videoAspectRatio === fmt.val ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                          background: videoAspectRatio === fmt.val ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.03)',
                          color: videoAspectRatio === fmt.val ? '#fff' : '#94a3b8',
                          fontWeight: videoAspectRatio === fmt.val ? '700' : '500',
                          fontSize: '0.73rem',
                          cursor: 'pointer'
                        }}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PASSO 3: INSTRUÇÕES DE DIREÇÃO COM IA (OU TEXTO PRONTO) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e2e8f0' }}>
                      3. Instruções de Direção para a IA (O que fazer no vídeo):
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={toggleScriptDictation}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          border: isDictatingScript ? '1px solid #ef4444' : '1px solid rgba(6, 182, 212, 0.45)',
                          background: isDictatingScript ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.15)',
                          color: isDictatingScript ? '#fca5a5' : '#67e8f9',
                          fontSize: '0.73rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isDictatingScript ? '🛑 Parar Ditado' : '🎙️ Ditar Instruções'}
                      </button>
                      <button
                        type="button"
                        onClick={handleImproveScriptWithAi}
                        disabled={isImprovingScript}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '999px',
                          border: '1px solid rgba(168, 85, 247, 0.5)',
                          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.28), rgba(236, 72, 153, 0.25))',
                          color: '#f3e8ff',
                          fontSize: '0.73rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {isImprovingScript ? '⏳ Escrevendo...' : '✨ Pré-visualizar Roteiro'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <select
                      value={aiScriptTone}
                      onChange={e => setAiScriptTone(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        background: '#0b141a',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontSize: '0.76rem'
                      }}
                    >
                      <option value="natural, confiante e persuasivo">Estilo: Confiante & Comercial (Gesticulação Expansiva)</option>
                      <option value="descontraído, próximo e amigável">Estilo: Descontraído & Reels (Dinâmico e Próximo)</option>
                      <option value="executivo, direto e autoridade">Estilo: Autoridade & Executivo (Postura Firme)</option>
                    </select>
                  </div>

                  <textarea
                    rows={4}
                    value={videoScriptText}
                    onChange={e => setVideoScriptText(e.target.value)}
                    placeholder="Instrua a IA sobre o vídeo: tema, ação, postura, o que você quer vender ou apresentar (ou digite o roteiro exato se preferir)..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: '#0b141a',
                      color: '#fff',
                      fontSize: '0.88rem',
                      lineHeight: '1.45'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                    💡 Se você digitar apenas a instrução (ex: <em>"faça um vídeo chamando os clientes pro feirão"</em>), a IA gera automaticamente a fala real e os gestos humanos no vídeo.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingVideoJob}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    color: '#fff',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)'
                  }}
                >
                  {isCreatingVideoJob ? '⏳ Enviando para a Fila...' : `🚀 Produzir Vídeo com ${selectedCloneName || 'Avatar'}`}
                </button>
              </form>
            )}

            {/* SUB-ABA 2: CADASTRAR OU ATUALIZAR AVATAR (FOTO, VÍDEO 2-EM-1 E VOZ) */}
            {videoSubTab === 'clones' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <form
                  onSubmit={handleSaveClone}
                  style={{
                    background: '#111b21',
                    borderRadius: '14px',
                    padding: '14px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#fff' }}>
                    👤 Cadastrar / Atualizar Avatar pelo Celular
                  </div>

                  {/* OPÇÃO RÁPIDA 2-EM-1: ENVIAR VÍDEO FALANDO */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16), rgba(6, 182, 212, 0.12))',
                    border: '1px dashed rgba(168, 85, 247, 0.55)',
                    borderRadius: '12px',
                    padding: '12px'
                  }}>
                    <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#e9d5ff', marginBottom: '4px' }}>
                      ⚡ Modo Rápido 2-em-1: Enviar Vídeo Seu Falando
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '8px', lineHeight: '1.35' }}>
                      Escolha ou grave um vídeo de 15 a 30 segundos olhando para a câmera. O app extrai <strong>automaticamente a foto do seu rosto e a sua voz</strong>!
                    </div>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #9333ea, #06b6d4)',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}>
                      <span>{isExtractingFromVideo ? '⏳ Extraindo Rosto e Voz...' : '📹 Escolher ou Gravar Vídeo Falando'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleCloneVideoSelfieUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {/* NOME E GÊNERO DO AVATAR */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Nome do Avatar *
                      </label>
                      <input
                        type="text"
                        value={newCloneName}
                        onChange={e => setNewCloneName(e.target.value)}
                        placeholder="Ex: Eu Giga Tessaro"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.14)',
                          background: '#0b141a',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Voz Base
                      </label>
                      <select
                        value={newCloneGender}
                        onChange={e => setNewCloneGender(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '9px 6px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.14)',
                          background: '#0b141a',
                          color: '#fff',
                          fontSize: '0.82rem'
                        }}
                      >
                        <option value="M">Masculina</option>
                        <option value="F">Feminina</option>
                      </select>
                    </div>
                  </div>

                  {/* FOTO DO ROSTO (GALERIA OU CÂMERA) */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '10px'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '6px' }}>
                      📸 1. Foto Frontal do Rosto:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {newClonePhotoBase64 && (
                        <img
                          src={newClonePhotoBase64}
                          alt="Preview Rosto"
                          style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a855f7' }}
                        />
                      )}
                      <label style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(168, 85, 247, 0.18)',
                        border: '1px solid rgba(168, 85, 247, 0.45)',
                        color: '#e9d5ff',
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}>
                        {newClonePhotoBase64 ? '📸 Trocar Foto (Câmera / Galeria)' : '📸 Escolher Foto ou Tirar Selfie'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleClonePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* AMOSTRA DE VOZ (GRAVAR NO MICROFONE NA HORA OU ENVIAR ARQUIVO) */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '10px'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' }}>
                      🎙️ 2. Sua Voz Real para Clonagem (15 a 30 segundos):
                    </div>
                    <div style={{ fontSize: '0.71rem', color: '#94a3b8', marginBottom: '8px' }}>
                      Grave em ambiente silencioso falando com naturalidade ou envie um áudio/vídeo seu.
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {!isRecordingCloneVoice ? (
                        <button
                          type="button"
                          onClick={startCloneVoiceRecording}
                          style={{
                            flex: 1,
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            background: 'rgba(16, 185, 129, 0.18)',
                            color: '#6ee7b7',
                            fontWeight: '700',
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          🎙️ Gravar Voz Agora
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopCloneVoiceRecording}
                          style={{
                            flex: 1,
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: '1px solid #ef4444',
                            background: 'rgba(239, 68, 68, 0.25)',
                            color: '#fca5a5',
                            fontWeight: '800',
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⏹️ Parar Gravação ({cloneVoiceRecSeconds}s)
                        </button>
                      )}

                      <label style={{
                        flex: 1,
                        padding: '9px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#e2e8f0',
                        fontWeight: '700',
                        fontSize: '0.76rem',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}>
                        📂 Enviar Áudio/Vídeo
                        <input
                          type="file"
                          accept="audio/*,video/*"
                          onChange={handleCloneVoiceFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {isRecordingCloneVoice && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        fontSize: '0.74rem',
                        color: '#a7f3d0',
                        lineHeight: '1.4'
                      }}>
                        💡 <strong>Texto sugerido para ler em voz alta (20s):</strong><br />
                        <em>"Olá pessoal, aqui é o Giga Tessaro! Estou gravando minha voz natural em português para o estúdio Giga Vídeos criar conteúdos com inteligência artificial de forma rápida, clara e realista."</em>
                      </div>
                    )}

                    {newCloneVoiceName && (
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#34d399', fontWeight: '700' }}>
                        ✅ Amostra pronta: {newCloneVoiceName}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingClone}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingClone ? '⏳ Salvando Avatar...' : '💾 Salvar Avatar e Voz'}
                  </button>
                </form>

                {/* LISTA DE AVATARES SALVOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#cbd5e1' }}>
                    Seus Avatares Cadastrados ({videoClones.length}):
                  </div>
                  {videoClones.map(clone => (
                    <div
                      key={clone.id}
                      style={{
                        background: '#111b21',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <img
                          src={clone.photo_url}
                          alt={clone.name}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #a855f7' }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#fff' }}>{clone.name}</div>
                          <div style={{ fontSize: '0.72rem', color: clone.has_voice_clone ? '#34d399' : '#fbbf24' }}>
                            {clone.has_voice_clone ? '🎙️ Voz Real Clonada (XTTS-v2)' : '⚠️ Sem amostra de voz (usando neural)'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCloneName(clone.name);
                            setNewCloneGender(clone.gender || 'M');
                            setNewClonePhotoBase64(clone.photo_url || '');
                            setVideoActionFeedback(`✏️ Editando "${clone.name}": envie um novo vídeo ou grave uma nova voz acima e salve!`);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            padding: '6px 9px',
                            borderRadius: '8px',
                            border: '1px solid rgba(168,85,247,0.4)',
                            background: 'rgba(168,85,247,0.15)',
                            color: '#e9d5ff',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️ Voz/Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClone(clone.id, clone.name)}
                          style={{
                            padding: '6px 9px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.35)',
                            background: 'rgba(239,68,68,0.12)',
                            color: '#fca5a5',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-ABA 3: GALERIA DE VÍDEOS PRONTOS & FILA */}
            {videoSubTab === 'gallery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {videoJobs.length === 0 ? (
                  <div style={{
                    background: '#111b21',
                    borderRadius: '14px',
                    padding: '28px 16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: '0.84rem'
                  }}>
                    Nenhum vídeo na galeria ainda. Toque em <strong>🎥 Produzir</strong> acima para gerar seu primeiro vídeo!
                  </div>
                ) : (
                  videoJobs.map(job => (
                    <div
                      key={job.id}
                      style={{
                        background: '#111b21',
                        borderRadius: '14px',
                        padding: '12px',
                        border: job.status === 'COMPLETED'
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : job.status === 'FAILED'
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(168, 85, 247, 0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.84rem', color: '#fff' }}>
                          #{job.id} • {job.clone_name} ({job.aspect_ratio || '9:16'})
                        </div>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          background: job.status === 'COMPLETED'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : job.status === 'FAILED'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(168, 85, 247, 0.2)',
                          color: job.status === 'COMPLETED'
                            ? '#34d399'
                            : job.status === 'FAILED'
                              ? '#fca5a5'
                              : '#d8b4fe'
                        }}>
                          {job.status === 'COMPLETED' ? '✅ Pronto' : job.status === 'FAILED' ? '❌ Falhou' : `⏳ ${job.progress || 10}%`}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.35' }}>
                        "{job.script_text}"
                      </div>

                      {job.status !== 'COMPLETED' && (
                        <div>
                          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginBottom: '4px' }}>
                            {job.status_message || 'Aguardando processamento...'}
                          </div>
                          {job.status !== 'FAILED' && (
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.max(8, Number(job.progress) || 10)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #a855f7, #06b6d4)'
                              }} />
                            </div>
                          )}
                        </div>
                      )}

                      {job.status === 'COMPLETED' && job.video_url && (
                        <video
                          controls
                          playsInline
                          src={resolveMediaUrl(job.video_url)}
                          style={{
                            width: '100%',
                            maxHeight: '380px',
                            borderRadius: '10px',
                            background: '#000'
                          }}
                        />
                      )}

                      {/* BOTÕES DE AÇÃO NO CELULAR: COMPARTILHAR, BAIXAR MP4, REPROCESSAR E EXCLUIR */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {job.status === 'COMPLETED' && job.video_url && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleShareVideo(job)}
                              style={{
                                flex: 1,
                                minWidth: '115px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                fontWeight: '800',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              📲 Compartilhar
                            </button>
                            <a
                              href={resolveMediaUrl(`/api/v1/videos/jobs/${job.id}/download`)}
                              download={`GigaVideo-${job.id}.mp4`}
                              style={{
                                flex: 1,
                                minWidth: '115px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: 'rgba(168, 85, 247, 0.22)',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                color: '#f3e8ff',
                                fontWeight: '800',
                                fontSize: '0.75rem',
                                textDecoration: 'none',
                                textAlign: 'center'
                              }}
                            >
                              ⬇️ Salvar MP4
                            </a>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRetryVideoJob(job.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.14)',
                            background: 'rgba(255,255,255,0.05)',
                            color: '#cbd5e1',
                            fontWeight: '700',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Reprocessar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteVideoJob(job.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.14)',
                            color: '#fca5a5',
                            fontWeight: '700',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="gm-roadmap-pane">
            <form className="gm-task-form" onSubmit={handleCreateRoadmapTask}>
              <input
                type="text"
                className="gm-input-field"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="+ Adicionar nova tarefa ao checklist..."
              />
              <button type="submit" className="gm-btn-primary">Criar</button>
            </form>

            <div className="gm-filter-chips">
              <button className={`gm-chip ${roadmapFilter === 'ALL' ? 'active' : ''}`} onClick={() => setRoadmapFilter('ALL')}>
                Todas ({roadmapItems.length})
              </button>
              <button className={`gm-chip ${roadmapFilter === 'PENDING' ? 'active' : ''}`} onClick={() => setRoadmapFilter('PENDING')}>
                Pendentes
              </button>
              <button className={`gm-chip ${roadmapFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setRoadmapFilter('COMPLETED')}>
                Concluídas
              </button>
            </div>

            <div className="gm-roadmap-list">
              {loadingRoadmap ? (
                <div className="gm-empty-state">Carregando checklist...</div>
              ) : filteredRoadmap.length === 0 ? (
                <div className="gm-empty-state">Nenhuma tarefa encontrada.</div>
              ) : (
                filteredRoadmap.map(task => (
                  <div key={task.id} className={`gm-task-card ${task.status === 'COMPLETED' ? 'completed' : ''}`}>
                    <input
                      type="checkbox"
                      className="gm-task-checkbox"
                      checked={task.status === 'COMPLETED'}
                      onChange={() => handleToggleTaskStatus(task)}
                    />
                    <div className="gm-task-info">
                      <span className="gm-task-title">{task.title}</span>
                      <span className="gm-task-meta">{task.category || 'Geral'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="gm-agents-pane">
            <div className="gm-agents-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>
                  🤖 Agentes Inteligentes GigaHub
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#8696a0' }}>
                  Selecione um agente para conversar diretamente, ver parâmetros ou abrir o painel.
                </p>
              </div>

              {/* FILTRO DE CATEGORIAS */}
              <div className="gm-filter-chips" style={{ marginTop: '12px', display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  className={`gm-chip ${agentFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setAgentFilter('ALL')}
                >
                  Todos ({agentsList.length})
                </button>
                <button
                  className={`gm-chip ${agentFilter === 'SALES' ? 'active' : ''}`}
                  onClick={() => setAgentFilter('SALES')}
                >
                  💃 Vendas
                </button>
                <button
                  className={`gm-chip ${agentFilter === 'CORE' ? 'active' : ''}`}
                  onClick={() => setAgentFilter('CORE')}
                >
                  🧠 Estratégia
                </button>
                <button
                  className={`gm-chip ${agentFilter === 'OPS' ? 'active' : ''}`}
                  onClick={() => setAgentFilter('OPS')}
                >
                  ⚙️ Operações
                </button>
              </div>
            </div>

            <div className="gm-agents-grid">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className="gm-agent-card interactive"
                  onClick={() => setSelectedAgentForModal(agent)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="gm-agent-card-top">
                    <div className="gm-agent-icon-wrapper">
                      <span className="gm-agent-icon">{agent.icon}</span>
                    </div>
                    <div className="gm-agent-title-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 className="gm-agent-name">{agent.name}</h4>
                        <span className={`gm-agent-badge ${agent.badgeType}`}>{agent.badge}</span>
                      </div>
                      <span className="gm-agent-role">{agent.role}</span>
                    </div>
                  </div>

                  <p className="gm-agent-desc">{agent.shortDesc}</p>

                  <div className="gm-agent-tags">
                    <span className="gm-agent-tag">{agent.tag}</span>
                    {agent.metrics?.map((m, idx) => (
                      <span key={idx} className="gm-agent-metric-pill">
                        <strong>{m.label}:</strong> {m.val}
                      </span>
                    ))}
                  </div>

                  <div className="gm-agent-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="gm-agent-btn-primary"
                      onClick={() => handleStartChatWithAgent(agent)}
                      title={`Conversar com ${agent.name}`}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
                      </svg>
                      <span>Conversar</span>
                    </button>

                    {agent.hasCustomAction ? (
                      <button
                        className="gm-agent-btn-secondary"
                        onClick={() => {
                          if (agent.id === 'gigavideos') {
                            setActiveTab('videos');
                            fetchVideoStudioSummary();
                          } else {
                            setShowCremosaModal(true);
                          }
                        }}
                        title={agent.customActionLabel || 'Abrir Painel'}
                      >
                        <span>{agent.customActionLabel || '💃 Painel'}</span>
                      </button>
                    ) : (
                      <button
                        className="gm-agent-btn-secondary"
                        onClick={() => setSelectedAgentForModal(agent)}
                        title="Ver Detalhes do Agente"
                      >
                        <span>Detalhes →</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL BOTTOM-SHEET PARA CONFIGURAÇÕES VPS */}
      {showConfigModal && (
        <div className="gm-bottom-sheet-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="gm-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="gm-sheet-handle"></div>
            <h3 className="gm-sheet-title">⚙️ Configurações do GigaMente</h3>

            {/* SEÇÃO: VOZ DO GIGAMENTE (TTS) */}
            <div style={{
              background: 'rgba(0, 168, 132, 0.08)',
              border: '1px solid rgba(0, 168, 132, 0.25)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#00a884', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🎙️ Voz do GigaMente (Offline / Grátis)
                </span>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  style={{
                    background: '#00a884',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#111b21',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ▶️ Testar Voz
                </button>
              </div>

              {/* VELOCIDADE DA FALA */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  ⚡ Velocidade da Fala: <strong style={{ color: '#fff' }}>{ttsRate}x</strong>
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { label: '1.0x Normal', val: '1.0' },
                    { label: '1.15x Dinâmica', val: '1.15' },
                    { label: '1.25x Rápida', val: '1.25' },
                    { label: '1.5x Turbo', val: '1.5' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleUpdateTtsRate(item.val)}
                      style={{
                        flex: 1,
                        minWidth: '70px',
                        padding: '6px 4px',
                        borderRadius: '8px',
                        background: ttsRate === item.val ? '#00a884' : 'rgba(255, 255, 255, 0.06)',
                        color: ttsRate === item.val ? '#111b21' : '#e2e8f0',
                        fontWeight: ttsRate === item.val ? '700' : '500',
                        fontSize: '0.75rem',
                        border: ttsRate === item.val ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIMBRE / TOM */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  🎼 Timbre Vocal:
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: 'Mais Grave', val: '0.85' },
                    { label: 'Natural', val: '1.0' },
                    { label: 'Mais Agudo', val: '1.15' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleUpdateTtsPitch(item.val)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '8px',
                        background: ttsPitch === item.val ? 'rgba(0, 168, 132, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                        color: ttsPitch === item.val ? '#34d399' : '#cbd5e1',
                        fontWeight: ttsPitch === item.val ? '700' : '500',
                        fontSize: '0.75rem',
                        border: ttsPitch === item.val ? '1px solid #00a884' : '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ESCOLHA DE VOZ DO ANDROID / SISTEMA */}
              {availableVoices.length > 0 && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    🗣️ Voz Instalada no Celular:
                  </label>
                  <select
                    className="gm-input-field"
                    value={ttsVoice}
                    onChange={e => handleUpdateTtsVoice(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '8px 12px', width: '100%', background: '#111b21', color: '#fff' }}
                  >
                    <option value="">Padrão do Celular (Automático)</option>
                    {availableVoices.map((v, i) => (
                      <option key={v.name || i} value={v.name}>
                        {v.name.replace(/^pt-br-/, 'Voz Brasil: ').replace(/-local$/, '')} {v.gender ? `(${v.gender})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="gm-sheet-actions" style={{ marginTop: '16px' }}>
              <button className="gm-btn-primary" style={{ width: '100%' }} onClick={() => setShowConfigModal(false)}>
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL / SHEET DA CREMOSA 2.0 NO MOBILE */}
      {showCremosaModal && (
        <div className="gm-modal-overlay" onClick={() => setShowCremosaModal(false)}>
          <div
            className="gm-sheet-card"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0b141a',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '20px 20px 0 0',
              padding: '18px',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem' }}>💃</span>
                <div>
                  <div style={{ fontWeight: '800', color: '#fff', fontSize: '1rem' }}>CReMosa 2.0</div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Gerente Comercial Autônoma</div>
                </div>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '999px',
                background: cremosaMetrics.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                color: cremosaMetrics.status === 'ACTIVE' ? '#34d399' : '#fda4af',
                border: `1px solid ${cremosaMetrics.status === 'ACTIVE' ? '#10b981' : '#f43f5e'}`
              }}>
                {cremosaMetrics.status === 'ACTIVE' ? '🟢 Ativa' : '⏸️ Pausada'}
              </span>
            </div>

            {/* BOTÃO DE PAUSA / RETOMADA */}
            <button
              onClick={handleToggleCremosaPause}
              disabled={isCremosaLoading}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: cremosaMetrics.status === 'ACTIVE' ? '1px solid #f43f5e' : '1px solid #10b981',
                background: cremosaMetrics.status === 'ACTIVE' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: cremosaMetrics.status === 'ACTIVE' ? '#fda4af' : '#6ee7b7',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                marginBottom: '14px'
              }}
            >
              {cremosaMetrics.status === 'ACTIVE' ? '⏸️ Pausar Disparos (Emergência)' : '▶️ Retomar Disparos WhatsApp'}
            </button>

            {/* CADÊNCIA E RISCO */}
            <div style={{ background: '#111b21', padding: '12px', borderRadius: '12px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700', marginBottom: '8px' }}>
                🛡️ CADÊNCIA & RISCO
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '4px' }}>
                <span>Hoje</span>
                <strong>{cremosaMetrics.today_count || 0} / {cremosaMetrics.today_limit || 100} msgs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#e2e8f0', marginBottom: '8px' }}>
                <span>Nesta Hora</span>
                <strong>{cremosaMetrics.hour_count || 0} / {cremosaMetrics.hour_limit || 20} msgs</strong>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                ⏰ Horário Comercial: 08:30 às 18:30 • Intervalos: 45s a 120s
              </div>
            </div>

            {/* BOTÃO DE VARREDURA IMEDIATA */}
            <button
              onClick={handleRunSalesCycleNow}
              disabled={isCremosaLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: '#fff',
                fontWeight: '800',
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              ⚡ {isCremosaLoading ? 'Executando...' : 'Executar Varredura Comercial'}
            </button>

            {cremosaFeedback && (
              <div style={{ padding: '8px 12px', background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', borderRadius: '8px', fontSize: '0.75rem', marginBottom: '12px' }}>
                {cremosaFeedback}
              </div>
            )}

            <button
              onClick={() => setShowCremosaModal(false)}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL BOTTOM-SHEET PARA DETALHES DO AGENTE */}
      {selectedAgentForModal && (
        <div className="gm-bottom-sheet-overlay" onClick={() => setSelectedAgentForModal(null)}>
          <div
            className="gm-bottom-sheet"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="gm-sheet-handle"></div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: 'rgba(0, 168, 132, 0.15)',
                  border: '1px solid rgba(0, 168, 132, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  {selectedAgentForModal.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                    {selectedAgentForModal.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {selectedAgentForModal.role}
                  </div>
                </div>
              </div>

              <span className={`gm-agent-badge ${selectedAgentForModal.badgeType}`} style={{ position: 'static' }}>
                {selectedAgentForModal.badge}
              </span>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                {selectedAgentForModal.fullDesc}
              </p>
            </div>

            {/* DESTAQUES / CAPACIDADES */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: '700', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ Principais Capacidades
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedAgentForModal.highlights?.map((hl, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: '#cbd5e1',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <span style={{ color: '#00a884' }}>✔</span>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TELEMETRIA / MÉTRICAS */}
            {selectedAgentForModal.metrics?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: '700', color: '#00a884', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📊 Telemetria Operacional
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {selectedAgentForModal.metrics.map((m, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(17, 27, 33, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '10px 8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>{m.label}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AÇÕES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="gm-btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => handleStartChatWithAgent(selectedAgentForModal)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
                </svg>
                <span>Conversar com {selectedAgentForModal.name}</span>
              </button>

              {selectedAgentForModal.id === 'cremosa' && (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    background: 'rgba(236, 72, 153, 0.15)',
                    color: '#f472b6',
                    border: '1px solid rgba(236, 72, 153, 0.3)',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onClick={() => {
                    setSelectedAgentForModal(null);
                    setShowCremosaModal(true);
                  }}
                >
                  <span>💃 Abrir Painel Completo da CReMosa</span>
                </button>
              )}

              {selectedAgentForModal.id === 'gigavideos' && (
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.9rem',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#e9d5ff',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    borderRadius: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedAgentForModal(null);
                    setActiveTab('videos');
                    fetchVideoStudioSummary();
                  }}
                >
                  🎬 Abrir Estúdio Giga Vídeos Mobile
                </button>
              )}

              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '0.85rem',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedAgentForModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL RÁPIDO (BOTTOM SHEET) DO GIGA VÍDEOS DIRETO DA BARRA DO CHAT
         ===================================================================== */}
      {showQuickVideoSheet && (
        <div className="gm-bottom-sheet-overlay" onClick={() => setShowQuickVideoSheet(false)}>
          <div
            className="gm-bottom-sheet"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: '88vh', overflowY: 'auto' }}
          >
            <div className="gm-sheet-handle"></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                  🎬 Giga Vídeos — Acesso Rápido
                </h3>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                  Escolha o Avatar, envie foto/vídeo ou gere o roteiro com IA
                </div>
              </div>
              <span style={{
                padding: '4px 8px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: '800',
                background: videoStudioSummary.gpu_worker_online ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                color: videoStudioSummary.gpu_worker_online ? '#34d399' : '#f87171',
                border: `1px solid ${videoStudioSummary.gpu_worker_online ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.45)'}`
              }}>
                {videoStudioSummary.gpu_worker_online ? '🟢 Motor Online' : '🔴 Motor desligado'}
              </span>
            </div>

            {/* ESCOLHER AVATAR OU ENVIAR FOTO/VÍDEO */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                Escolha seu Avatar:
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {videoClones.map(clone => {
                  const isSel = selectedCloneName.toLowerCase() === clone.name.toLowerCase();
                  return (
                    <div
                      key={clone.id}
                      onClick={() => setSelectedCloneName(clone.name)}
                      style={{
                        minWidth: '130px',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        border: isSel ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                        background: isSel ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={resolveMediaUrl(clone.photo_url)}
                        alt={clone.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #a855f7' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: '700', fontSize: '0.78rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {clone.name}
                        </div>
                        <div style={{ fontSize: '0.66rem', color: clone.has_voice_clone ? '#34d399' : '#94a3b8' }}>
                          {clone.has_voice_clone ? '🎙️ Voz Clonada' : '🗣️ Voz Neural'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickVideoSheet(false);
                    setActiveTab('videos');
                    setVideoSubTab('clones');
                  }}
                  style={{
                    minWidth: '135px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: '1px dashed rgba(168, 85, 247, 0.55)',
                    background: 'rgba(168, 85, 247, 0.1)',
                    color: '#e9d5ff',
                    fontWeight: '700',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  + Enviar Foto / Vídeo / Voz
                </button>
              </div>
            </div>

            {/* FOTO OU VÍDEO DA CENA DO PEDIDO */}
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: jobSceneMediaBase64 ? '1px solid #10b981' : '1px dashed rgba(168, 85, 247, 0.5)',
                  background: jobSceneMediaBase64 ? 'rgba(16, 185, 129, 0.14)' : 'rgba(168, 85, 247, 0.08)',
                  color: jobSceneMediaBase64 ? '#6ee7b7' : '#e9d5ff',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                {jobSceneMediaBase64
                  ? `${jobSceneMediaType === 'video' ? '🎥 Vídeo:' : '📸 Foto:'} ${jobSceneMediaName}`
                  : '📸 / 🎥 Enviar Foto ou Vídeo para este pedido (Opcional)'}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleSelectJobSceneMedia}
                  style={{ display: 'none' }}
                />
              </label>
              {jobSceneMediaBase64 && (
                <button
                  type="button"
                  onClick={() => {
                    setJobSceneMediaBase64('');
                    setJobSceneMediaType('');
                    setJobSceneMediaName('');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#fca5a5',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* ROTEIRO COM DITADO E IA */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#cbd5e1' }}>
                  Roteiro (Script):
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={toggleScriptDictation}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '999px',
                      border: '1px solid rgba(6, 182, 212, 0.45)',
                      background: isDictatingScript ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.15)',
                      color: isDictatingScript ? '#fca5a5' : '#67e8f9',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isDictatingScript ? '🛑 Parar' : '🎙️ Ditar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleImproveScriptWithAi}
                    disabled={isImprovingScript}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '999px',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      background: 'rgba(168, 85, 247, 0.25)',
                      color: '#f3e8ff',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {isImprovingScript ? '⏳ IA...' : '✨ Melhorar com IA'}
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={videoScriptText}
                onChange={e => setVideoScriptText(e.target.value)}
                placeholder="Digite o que o seu Avatar vai falar (ou escreva o tema e toque em '✨ Melhorar com IA')..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: '#0b141a',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {videoActionFeedback && (
              <div style={{ fontSize: '0.76rem', color: '#e9d5ff', marginBottom: '10px', fontWeight: '600' }}>
                {videoActionFeedback}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCreateVideoJob}
                disabled={isCreatingVideoJob}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #9333ea, #ec4899)',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {isCreatingVideoJob ? '⏳ Enviando...' : `🚀 Produzir Vídeo com ${selectedCloneName || 'Avatar'}`}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickVideoSheet(false);
                    setActiveTab('videos');
                    setVideoSubTab('clones');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    background: 'rgba(168, 85, 247, 0.14)',
                    color: '#e9d5ff',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  📸 Enviar Foto / Vídeo / Voz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickVideoSheet(false);
                    setActiveTab('videos');
                    setVideoSubTab('gallery');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  📂 Ver Galeria ({videoJobs.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
