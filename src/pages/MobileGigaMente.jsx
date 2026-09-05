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
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      clearInterval(cremosaPoll);
    };
  }, []);

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
        const transcript = speechTranscriptRef.current.trim() || liveRecordingTranscript.trim() || '[Mensagem de voz gravada]';
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

    const sessionId = await ensureSessionExists('Áudio: ' + transcriptContent.slice(0, 25));

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: transcriptContent,
      audio_url: audioBase64,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/backend/api/gigamente/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: transcriptContent,
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

  return (
    <div className="gm-mobile-container dedicated-room" style={{ position: 'relative', overflow: 'hidden' }}>
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
          <button
            className="gm-back-btn"
            onClick={() => onNavigate('portal')}
            title="Voltar ao Portal"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00a884' }}
          >
            <span>← Portal</span>
          </button>

          <button
            onClick={() => setShowHistoryDrawer(true)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
            title="Abrir Histórico de Chats"
          >
            ☰
          </button>

          <div className="gm-title-block">
            <div className="gm-brand-row">
              <span className="gm-mobile-title">GigaMente AI</span>
              <div className="gm-status-dot"></div>
            </div>
            <span className="gm-mobile-subtitle">
              {activeSessionId ? 'Conversa Ativa' : 'Novo Chat em Branco'}
            </span>
          </div>
        </div>

        <div className="gm-mobile-header-actions">
          <button
            className={`gm-call-pill-btn ${isInLiveCall ? 'active' : ''}`}
            onClick={toggleLiveCall}
            title={isInLiveCall ? 'Encerrar Chamada ao Vivo' : 'Iniciar Chamada de Voz ao Vivo (Falar & Ouvir)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{isInLiveCall ? 'Ao Vivo' : 'Ao Vivo'}</span>
          </button>

          <button className="gm-icon-btn" onClick={handleStartNewChat} title="Nova Conversa">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className="gm-icon-btn"
            onClick={() => setShowCremosaModal(true)}
            title="CReMosa 2.0"
            style={{
              background: cremosaMetrics.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              border: `1px solid ${cremosaMetrics.status === 'ACTIVE' ? '#10b981' : '#f43f5e'}`,
              borderRadius: '8px',
              padding: '2px 6px',
              fontSize: '0.85rem'
            }}
          >
            💃
          </button>
          <button className="gm-icon-btn" onClick={() => setShowConfigModal(true)} title="Ajustes de Voz">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

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
              <button className="gm-chip" onClick={() => handleQuickChipClick('Resumo de vendas do dia e status de leads')}>
                📊 Resumo do Dia
              </button>
              <button className="gm-chip" onClick={() => handleQuickChipClick('Quais são as tarefas prioritárias de hoje?')}>
                📝 Tarefas de Hoje
              </button>
              <button className="gm-chip" onClick={() => handleQuickChipClick('Verificar conexão com a VPS e status do bot')}>
                ⚡ Status VPS
              </button>
            </div>

            {/* FEED DE MENSAGENS */}
            <div className="gm-messages-feed">
              {messages.length === 0 ? (
                <div className="gm-empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧠</div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#fff' }}>Novo Chat com o GigaMente</h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto' }}>
                    Envie uma mensagem digitada ou grave um áudio abaixo para a IA entrar em ação.
                  </p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`gm-msg-row ${msg.sender === 'user' ? 'user' : 'ai'}`}>
                    <div className="gm-msg-bubble">
                      <div className="gm-msg-sender">
                        {msg.sender === 'user' ? 'Você' : 'GigaMente'}
                      </div>
                      
                      {msg.audio_url ? (
                        <div className="gm-audio-player-wrapper">
                          <div className="gm-audio-badge">🎙️ Mensagem de Voz</div>
                          <audio controls src={msg.audio_url} className="gm-audio-element" />
                          {msg.content && msg.content !== '[Mensagem de voz]' && (
                            <div className="gm-msg-content gm-audio-transcript">{formatMarkdownContent(msg.content)}</div>
                          )}
                        </div>
                      ) : (
                        <div className="gm-msg-content">{formatMarkdownContent(msg.content)}</div>
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

            {/* BARRA DE GRAVAÇÃO DE ÁUDIO OU DIGITAÇÃO */}
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
                <div className="gm-textarea-wrapper">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="gm-textarea-field"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyDownTextarea}
                    placeholder="Mensagem para o GigaMente..."
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
              <h3>🤖 Agentes Inteligentes GigaHub</h3>
              <p>Equipe autônoma disponível para suporte comercial, funil e automações.</p>
            </div>

            <div className="gm-agents-grid">
              <div className="gm-agent-card">
                <div className="gm-agent-badge active">Ativo</div>
                <div className="gm-agent-icon">🧠</div>
                <h4 className="gm-agent-name">GigaMente Core</h4>
                <p className="gm-agent-desc">Motor estratégico central e executor de tarefas e integrações.</p>
              </div>

              <div className="gm-agent-card">
                <div className="gm-agent-badge active">Ativo</div>
                <div className="gm-agent-icon">💃</div>
                <h4 className="gm-agent-name">CReMosa</h4>
                <p className="gm-agent-desc">Copiloto conversacional de vendas, áudios e estratégia de funil comercial.</p>
              </div>

              <div className="gm-agent-card">
                <div className="gm-agent-badge standby">Operacional</div>
                <div className="gm-agent-icon">🔍</div>
                <h4 className="gm-agent-name">Operador de Prospecção</h4>
                <p className="gm-agent-desc">Busca contatos, valida números no WhatsApp e cadastra Leads no CRM.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DEDICATED GIGAMENTE BOTTOM ROOM NAV (SALA, ROADMAP, AGENTES) */}
      <nav className="gm-room-bottom-nav">
        <button
          className={`gm-room-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L21 3z" />
          </svg>
          <span>Chat Sala</span>
        </button>

        <button
          className={`gm-room-nav-item ${activeTab === 'roadmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <span>CheckList</span>
        </button>

        <button
          className={`gm-room-nav-item ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8.01" y2="16" />
            <line x1="16" y1="16" x2="16.01" y2="16" />
          </svg>
          <span>Agentes</span>
        </button>
      </nav>

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
    </div>
  );
}
