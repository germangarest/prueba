export class AudioManager {
  constructor(config) {
    this.config = config;
    this.context = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    
    this.sounds = new Map();
    this.analyser = null;
    this.analyserData = null;
    
    this.isInitialized = false;
    this.lastAudioData = {
      average: 0,
      peak: 0,
      lowFreq: 0,
      midFreq: 0,
      highFreq: 0
    };
  }
  
  init() {
    // Crear AudioContext solo cuando se llama a init (responde a interacción del usuario)
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContext();
      
      // Configurar nodos de ganancia
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.config.masterVolume;
      this.masterGain.connect(this.context.destination);
      
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = this.config.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.context.createGain();
      this.sfxGain.gain.value = this.config.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      // Configurar analizador
      this.setupAnalyser();
      
      // Precargar sonidos
      this.preloadSounds();
      
      this.isInitialized = true;
    } catch (e) {
      console.error('Web Audio API no soportada:', e);
    }
  }
  
  setupAnalyser() {
    // Crear analizador para visualización de audio
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    
    // Conectar analizador al nodo maestro para analizar todo el audio
    this.masterGain.connect(this.analyser);
    
    // Preparar buffer para datos de frecuencia
    const bufferLength = this.analyser.frequencyBinCount;
    this.analyserData = new Uint8Array(bufferLength);
  }
  
  preloadSounds() {
    // Lista de sonidos a precargar
    const soundsToLoad = [
      { name: 'jump', url: 'assets/audio/jump.mp3' },
      { name: 'land', url: 'assets/audio/land.mp3' },
      { name: 'collect', url: 'assets/audio/collect.mp3' },
      { name: 'hit', url: 'assets/audio/hit.mp3' },
      { name: 'gameOver', url: 'assets/audio/gameOver.mp3' },
    ];
    
    // Cargar cada sonido
    soundsToLoad.forEach(sound => {
      this.loadSound(sound.name, sound.url);
    });
  }
  
  loadSound(name, url) {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        this.sounds.set(name, audioBuffer);
      })
      .catch(error => {
        console.error(`Error cargando sonido ${name}:`, error);
        // Crear un buffer vacío como fallback
        const fallbackBuffer = this.context.createBuffer(2, this.context.sampleRate * 0.5, this.context.sampleRate);
        this.sounds.set(name, fallbackBuffer);
      });
  }
  
  play(name, options = {}) {
    if (!this.isInitialized) return null;
    
    // Obtener buffer
    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Sonido no encontrado: ${name}`);
      return null;
    }
    
    // Crear fuente
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    
    // Configurar parámetros
    source.loop = options.loop || false;
    source.playbackRate.value = options.rate || 1;
    
    // Crear ganancia para este sonido específico
    const gainNode = this.context.createGain();
    gainNode.gain.value = options.volume || 1;
    
    // Conectar nodos
    source.connect(gainNode);
    gainNode.connect(options.music ? this.musicGain : this.sfxGain);
    
    // Reproducir
    source.start(0, options.offset || 0);
    
    // Almacenar información para control
    const soundInstance = {
      source,
      gainNode,
      startTime: this.context.currentTime,
      isMusic: !!options.music
    };
    
    return soundInstance;
  }
  
  stopSound(soundInstance) {
    if (!soundInstance || !soundInstance.source) return;
    
    try {
      soundInstance.source.stop();
    } catch (e) {
      // Ignorar errores si ya se ha detenido
    }
  }
  
  pauseAll() {
    if (!this.isInitialized) return;
    
    if (this.context.state === 'running') {
      this.context.suspend();
    }
  }
  
  resumeAll() {
    if (!this.isInitialized) return;
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }
  
  stopAll() {
    if (!this.isInitialized) return;
    
    // Simplemente silenciar todo (más simple que rastrear todas las fuentes)
    this.masterGain.gain.value = 0;
    
    // Restaurar después de un breve tiempo
    setTimeout(() => {
      this.masterGain.gain.value = this.config.masterVolume;
    }, 100);
  }
  
  setVolume(type, value) {
    if (!this.isInitialized) return;
    
    switch (type) {
      case 'master':
        this.masterGain.gain.value = value;
        this.config.masterVolume = value;
        break;
      case 'music':
        this.musicGain.gain.value = value;
        this.config.musicVolume = value;
        break;
      case 'sfx':
        this.sfxGain.gain.value = value;
        this.config.sfxVolume = value;
        break;
    }
  }
  
  update(deltaTime) {
    if (!this.isInitialized || !this.analyser) return this.lastAudioData;
    
    // Obtener datos de frecuencia
    this.analyser.getByteFrequencyData(this.analyserData);
    
    // Analizar datos
    const data = this.analyseFrequencyData();
    
    // Actualizar último valor con suavizado
    this.lastAudioData = {
      average: this.lastAudioData.average * 0.6 + data.average * 0.4,
      peak: data.peak, // No suavizar picos para mejor respuesta
      lowFreq: this.lastAudioData.lowFreq * 0.6 + data.lowFreq * 0.4,
      midFreq: this.lastAudioData.midFreq * 0.6 + data.midFreq * 0.4,
      highFreq: this.lastAudioData.highFreq * 0.6 + data.highFreq * 0.4
    };
    
    return this.lastAudioData;
  }
  
  analyseFrequencyData() {
    if (!this.analyserData) return {
      average: 0,
      peak: 0,
      lowFreq: 0,
      midFreq: 0,
      highFreq: 0
    };
    
    const bufferLength = this.analyserData.length;
    
    // Calcular valor promedio
    let sum = 0;
    let max = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = this.analyserData[i] / 255; // Normalizar a 0-1
      sum += value;
      max = Math.max(max, value);
    }
    
    const average = sum / bufferLength;
    
    // Separar por rangos de frecuencia
    const lowEnd = Math.floor(bufferLength * 0.15); // Primeros 15% = bajos
    const midEnd = Math.floor(bufferLength * 0.6);  // Hasta 60% = medios
    
    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;
    
    // Calcular sumas para cada rango
    for (let i = 0; i < lowEnd; i++) {
      lowSum += this.analyserData[i] / 255;
    }
    
    for (let i = lowEnd; i < midEnd; i++) {
      midSum += this.analyserData[i] / 255;
    }
    
    for (let i = midEnd; i < bufferLength; i++) {
      highSum += this.analyserData[i] / 255;
    }
    
    // Normalizar por cantidad de frecuencias en cada rango
    const lowFreq = lowSum / lowEnd;
    const midFreq = midSum / (midEnd - lowEnd);
    const highFreq = highSum / (bufferLength - midEnd);
    
    // Detectar picos (umbral dinámico)
    const peak = max > (this.lastAudioData?.average || 0) * 1.5 ? max : 0;
    
    return {
      average,
      peak,
      lowFreq,
      midFreq,
      highFreq
    };
  }
}