import React, { useState, useEffect, useRef } from 'react';

export const formatMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Detectar string base64 pura (sem cabeçalho data:)
  if (trimmed.length > 80 && !trimmed.includes('/') && !trimmed.includes('.')) {
    return `data:audio/wav;base64,${trimmed}`;
  }
  if (trimmed.length > 80 && /^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return `data:audio/wav;base64,${trimmed}`;
  }

  const baseUrl = localStorage.getItem('crm_server_url') || 'https://app.gigahub.site';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanUrl}`;
};

export const isAudioMessage = (msg, audioSrc) => {
  if (!msg) return Boolean(audioSrc);

  // 1. Tipos de mídia explícitos de áudio
  if (
    msg.mediaType === 'audio' || msg.mediaType === 'ptt' || msg.mediaType === 'voice' ||
    msg.type === 'audio' || msg.type === 'ptt' || msg.type === 'voice' ||
    msg.messageType === 'audio' || msg.messageType === 'ptt'
  ) return true;

  if (msg.message?.audioMessage || msg.message?.pttMessage) return true;
  if (msg.mimetype && typeof msg.mimetype === 'string' && msg.mimetype.toLowerCase().includes('audio')) return true;

  // 2. Propriedades explícitas de áudio
  if (msg.audioUrl || msg.audio_url || msg.audio_path || msg.audio) return true;
  if (msg.payload?.audioUrl || msg.payload?.audio) return true;

  // 3. Indicadores de texto/marcador de áudio
  const textStr = msg.text || msg.body || msg.content || msg.caption;
  if (typeof textStr === 'string' && textStr.trim()) {
    const trimmed = textStr.trim();
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('🎤') || 
      lower.startsWith('data:audio/') ||
      lower.includes('[áudio]') || 
      lower.includes('[audio]') || 
      lower.match(/\.(mp3|ogg|opus|wav|m4a|webm|aac)($|\?)/i)
    ) {
      return true;
    }
  }

  return false;
};

export const getAudioSource = (msg) => {
  if (!msg) return null;

  // Lista de possíveis propriedades EXPLÍCITAS de áudio
  const explicitAudioCandidates = [
    msg.audioUrl,
    msg.audio_url,
    msg.audio_path,
    msg.audio,
    msg.message?.audioMessage?.url,
    msg.message?.pttMessage?.url,
    msg.message?.audioMessage?.directPath,
    msg.message?.pttMessage?.directPath,
    msg.payload?.audioUrl,
    msg.payload?.audio
  ];

  for (const c of explicitAudioCandidates) {
    if (!c) continue;
    if (typeof c === 'string' && c.trim()) {
      const formatted = formatMediaUrl(c.trim());
      if (formatted) return formatted;
    }
    if (typeof c === 'object') {
      const nested = c.url || c.link || c.path || c.file || c.uri || c.mediaUrl || c.audioUrl || c.downloadUrl || c.directPath;
      if (typeof nested === 'string' && nested.trim()) {
        const formatted = formatMediaUrl(nested.trim());
        if (formatted) return formatted;
      }
    }
  }

  const isAudio = isAudioMessage(msg, null);

  // Se a mensagem for comprovadamente de áudio, inspecionar propriedades genéricas de mídia
  if (isAudio) {
    const genericCandidates = [
      msg.mediaUrl,
      msg.media_url,
      msg.media,
      msg.fileUrl,
      msg.file_url,
      msg.mediaPath,
      msg.filePath,
      msg.downloadUrl,
      msg.download_url,
      msg.payload?.mediaUrl,
      msg.payload?.fileUrl,
      msg.url,
      msg.path,
      msg.file
    ];

    for (const c of genericCandidates) {
      if (!c) continue;
      if (typeof c === 'string' && c.trim()) {
        const formatted = formatMediaUrl(c.trim());
        if (formatted) return formatted;
      }
      if (typeof c === 'object' && c !== msg.payload) {
        const nested = c.url || c.link || c.path || c.file || c.uri || c.mediaUrl || c.audioUrl || c.downloadUrl || c.directPath;
        if (typeof nested === 'string' && nested.trim()) {
          const formatted = formatMediaUrl(nested.trim());
          if (formatted) return formatted;
        }
      }
    }
  }

  // Verificar texto da mensagem
  const textStr = msg.text || msg.body || msg.content || msg.caption;
  if (typeof textStr === 'string' && textStr.trim()) {
    const trimmed = textStr.trim();
    if (trimmed.startsWith('data:audio/') || trimmed.startsWith('blob:')) {
      return formatMediaUrl(trimmed);
    }
    if (isAudio) {
      if (
        trimmed.startsWith('http://') || 
        trimmed.startsWith('https://') ||
        trimmed.match(/\.(mp3|ogg|opus|wav|m4a|webm|aac)($|\?)/i) || 
        trimmed.includes('uploads/')
      ) {
        return formatMediaUrl(trimmed);
      }
      if (trimmed.length > 80 && /^[A-Za-z0-9+/=]+$/.test(trimmed) && !trimmed.startsWith('http')) {
        return `data:audio/wav;base64,${trimmed}`;
      }
    }
  }

  return null;
};

export default function AudioMessagePlayer({ src, isSent = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1); // 1x, 1.5x, 2x
  const audioRef = useRef(null);

  const resolvedSrc = formatMediaUrl(src);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);

    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setHasError(false);
      audio.playbackRate = playbackRate;
    };
    const onLoadedData = () => {
      setHasError(false);
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onError = (e) => {
      console.warn('Aviso: Erro inicial ao carregar áudio (tentativa permitida no play):', e, resolvedSrc);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('loadeddata', onLoadedData);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('loadeddata', onLoadedData);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [resolvedSrc]);

  // Aplicar velocidade de reprodução sempre que o estado mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Se tiver erro prévio ou não iniciado, recarregar fonte
      if (hasError || audio.readyState < 2) {
        setHasError(false);
        audio.load();
      }

      audio.playbackRate = playbackRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setHasError(false);
          })
          .catch(err => {
            console.warn('Falha ao iniciar reprodução de áudio:', err);
            setHasError(true);
            setIsPlaying(false);
          });
      }
    }
  };

  const togglePlaybackRate = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
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

  if (!resolvedSrc) {
    return (
      <div style={{ fontSize: '0.78rem', color: isSent ? '#86efac' : '#f87171', fontStyle: 'italic', padding: '4px 0' }}>
        ⚠️ Mídia de áudio indisponível
      </div>
    );
  }

  return (
    <div className="wa-audio-player" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 0',
      minWidth: '220px',
      maxWidth: '290px',
      userSelect: 'none'
    }}>
      <audio ref={audioRef} src={resolvedSrc} preload="auto" />

      {/* Botão Play / Pause (Sempre clicável para tentar reproduzir) */}
      <button
        type="button"
        onClick={togglePlay}
        title={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: isPlaying ? '#059669' : '#00a884',
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

      {/* Barra de Progresso e Tempos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
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
          <span>{hasError ? 'Clique no play' : (duration > 0 ? formatTime(duration) : 'Áudio')}</span>
        </div>
      </div>

      {/* Botão Acelerar Áudio estilo WhatsApp (1x -> 1.5x -> 2x -> 1x) */}
      <button
        type="button"
        onClick={togglePlaybackRate}
        title="Acelerar áudio (1x, 1.5x, 2x)"
        style={{
          background: playbackRate > 1 ? '#00a884' : 'rgba(255, 255, 255, 0.12)',
          border: 'none',
          color: playbackRate > 1 ? '#ffffff' : (isSent ? '#e2e8f0' : '#94a3b8'),
          padding: '3px 7px',
          borderRadius: '12px',
          fontSize: '0.70rem',
          fontWeight: '800',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          lineHeight: '1.2'
        }}
      >
        {playbackRate}x
      </button>

      <span style={{ fontSize: '1.05rem', opacity: 0.85, flexShrink: 0 }}>🎤</span>
    </div>
  );
}

