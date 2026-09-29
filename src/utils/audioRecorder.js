// Utilitário de Gravação de Áudio PCM WAV de Alta Fidelidade para WhatsApp
// Resolve o bug nativo do Chromium/Android WebView que gera WebM sem cabeçalho de duração,
// o que fazia áudios de 5 segundos chegarem com 15+ segundos no WhatsApp.

export class AudioRecorder {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.inputNode = null;
    this.processorNode = null;
    this.leftChannelChunks = [];
    this.recordingLength = 0;
    this.sampleRate = 44100;
    this.isRecording = false;
    this.fallbackRecorder = null;
    this.fallbackChunks = [];
  }

  async start() {
    this.isRecording = false;
    this.leftChannelChunks = [];
    this.recordingLength = 0;
    this.fallbackChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      }
    });

    this.mediaStream = stream;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        this.audioContext = new AudioContextClass({ sampleRate: 44100 });
        this.sampleRate = this.audioContext.sampleRate || 44100;

        this.inputNode = this.audioContext.createMediaStreamSource(stream);
        // Usar bufferSize de 4096 amostras para captura estável em dispositivos móveis
        this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processorNode.onaudioprocess = (e) => {
          if (!this.isRecording) return;
          const inputBuffer = e.inputBuffer.getChannelData(0);
          const chunk = new Float32Array(inputBuffer.length);
          chunk.set(inputBuffer);
          this.leftChannelChunks.push(chunk);
          this.recordingLength += inputBuffer.length;
        };

        this.inputNode.connect(this.processorNode);
        this.processorNode.connect(this.audioContext.destination);
        this.isRecording = true;
        return;
      } catch (e) {
        console.warn('AudioContext falhou, usando MediaRecorder fallback:', e);
      }
    }

    // Fallback com MediaRecorder caso AudioContext não esteja disponível
    let options = {};
    if (MediaRecorder.isTypeSupported('audio/wav')) options = { mimeType: 'audio/wav' };
    else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) options = { mimeType: 'audio/ogg;codecs=opus' };
    else if (MediaRecorder.isTypeSupported('audio/ogg')) options = { mimeType: 'audio/ogg' };
    else if (MediaRecorder.isTypeSupported('audio/mp4')) options = { mimeType: 'audio/mp4' };
    else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) options = { mimeType: 'audio/webm;codecs=opus' };

    this.fallbackRecorder = new MediaRecorder(stream, options);
    this.fallbackRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.fallbackChunks.push(e.data);
      }
    };
    this.fallbackRecorder.start();
    this.isRecording = true;
  }

  stop() {
    return new Promise((resolve) => {
      this.isRecording = false;

      if (this.fallbackRecorder && this.fallbackRecorder.state !== 'inactive') {
        this.fallbackRecorder.onstop = () => {
          this.cleanStream();
          const mimeType = this.fallbackRecorder.mimeType || 'audio/wav';
          const blob = new Blob(this.fallbackChunks, { type: mimeType });
          resolve(blob);
        };
        this.fallbackRecorder.stop();
        return;
      }

      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode.onaudioprocess = null;
      }
      if (this.inputNode) {
        this.inputNode.disconnect();
      }
      this.cleanStream();

      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }

      if (this.recordingLength === 0) {
        resolve(null);
        return;
      }

      // Unir pedaços de áudio Float32Array em um único buffer contínuo
      const mergedBuffer = new Float32Array(this.recordingLength);
      let offset = 0;
      for (let i = 0; i < this.leftChannelChunks.length; i++) {
        mergedBuffer.set(this.leftChannelChunks[i], offset);
        offset += this.leftChannelChunks[i].length;
      }

      // Codificar amostras de áudio para formato PCM WAV 16-bit com cabeçalho de duração exato
      const wavBlob = encodeWAV(mergedBuffer, this.sampleRate);
      resolve(wavBlob);
    });
  }

  cancel() {
    this.isRecording = false;
    if (this.fallbackRecorder && this.fallbackRecorder.state !== 'inactive') {
      this.fallbackRecorder.ondataavailable = null;
      this.fallbackRecorder.stop();
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
    }
    if (this.inputNode) {
      this.inputNode.disconnect();
    }
    this.cleanStream();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.leftChannelChunks = [];
    this.recordingLength = 0;
    this.fallbackChunks = [];
  }

  cleanStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count (mono = 1) */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * mono * 2 bytes per sample) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  // Escrever amostras PCM 16-bit com clipping seguro
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
