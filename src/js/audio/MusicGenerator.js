export class MusicGenerator {
  constructor(config) {
    this.config = config;
    this.audioManager = null;
    this.context = null;
    
    this.isPlaying = false;
    this.activeNodes = [];
    
    // Configuración musical
    this.bpm = config.bpm;
    this.scale = config.scales[0]; // Escala inicial
    this.key = 'C'; // Tonalidad inicial
    
    // Para seguimiento del ritmo
    this.nextNoteTime = 0;
    this.currentBeat = 0;
    this.beatsPerMeasure = 4;
    this.totalBeats = 0;
    
    // Secuenciadores
    this.bassSequence = [1, 0, 0, 0, 0, 0, 1, 0];
    this.padSequence = [1, 0, 0, 1, 0, 0, 1, 0];
    this.arpSequence = [0, 1, 0, 1, 0, 1, 0, 1];
    
    // Para análisis de audio
    this.analyser = null;
    this.analyserData = null;
    
    // Estado interno
    this.lastGeneratedTime = 0;
    this.nextSectionChange = 16; // Cambiar cada 16 beats
  }
  
  init(audioManager) {
    this.audioManager = audioManager;
    
    if (audioManager.isInitialized) {
      this.context = audioManager.context;
      
      // Crear analizador específico para la música
      this.setupAnalyser();
      
      // Preparar generador
      this.setupOscillatorBank();
    }
  }
  
  setupAnalyser() {
    if (!this.context) return;
    
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    
    // Conectar a la salida de música
    this.audioManager.musicGain.connect(this.analyser);
    
    // Preparar buffer
    const bufferLength = this.analyser.frequencyBinCount;
    this.analyserData = new Uint8Array(bufferLength);
  }
  
  setupOscillatorBank() {
    // Crear configuración de osciladores
    this.oscillatorPresets = {
      bass: {
        type: 'triangle',
        detune: 0,
        attack: 0.1,
        decay: 0.3,
        sustain: 0.4,
        release: 0.5,
        filter: {
          type: 'lowpass',
          frequency: 300,
          Q: 5
        }
      },
      pad: {
        type: 'sine',
        detune: 5,
        attack: 0.5,
        decay: 0.1,
        sustain: 0.8,
        release: 1.5,
        filter: {
          type: 'lowpass',
          frequency: 2000,
          Q: 1
        }
      },
      arp: {
        type: 'sawtooth',
        detune: 10,
        attack: 0.02,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3,
        filter: {
          type: 'highpass',
          frequency: 1000,
          Q: 2
        }
      }
    };
  }
  
  start() {
    if (!this.context || this.isPlaying) return;
    
    this.isPlaying = true;
    this.nextNoteTime = this.context.currentTime;
    this.currentBeat = 0;
    this.totalBeats = 0;
    
    // Generar escala inicial
    this.generateRandomScale();
    
    // Iniciar scheduler de notas
    this.scheduleNotes();
  }
  
  stop() {
    this.isPlaying = false;
    
    // Detener todos los nodos activos
    this.activeNodes.forEach(node => {
      if (node.oscillator) {
        try {
          node.oscillator.stop();
        } catch (e) {
          // Ignorar si ya se ha detenido
        }
      }
      if (node.gainNode) {
        node.gainNode.disconnect();
      }
    });
    
    this.activeNodes = [];
  }
  
  restart() {
    this.stop();
    this.start();
  }
  
  update(deltaTime) {
    if (!this.isPlaying || !this.analyser) return {
      average: 0,
      peak: 0,
      lowFreq: 0,
      midFreq: 0,
      highFreq: 0
    };
    
    // Programar más notas si es necesario
    if (this.context.currentTime - this.lastGeneratedTime > 0.1) {
      this.scheduleNotes();
      this.lastGeneratedTime = this.context.currentTime;
    }
    
    // Obtener datos de frecuencia para análisis
    this.analyser.getByteFrequencyData(this.analyserData);
    
    // Analizar datos
    return this.analyseFrequencyData();
  }
  
  scheduleNotes() {
    // Cuánto tiempo programar por adelantado (en segundos)
    const scheduleAheadTime = 0.2;
    
    // Duración de un beat en segundos
    const beatDuration = 60.0 / this.bpm;
    
    // Programar notas para los próximos [scheduleAheadTime] segundos
    while (this.nextNoteTime < this.context.currentTime + scheduleAheadTime && this.isPlaying) {
      // Programar notas para este beat
      this.scheduleNotesForBeat(this.currentBeat, this.nextNoteTime);
      
      // Incrementar contador de beats
      this.currentBeat = (this.currentBeat + 1) % (this.beatsPerMeasure * 2);
      this.totalBeats++;
      
      // Actualizar tiempo para la siguiente nota
      this.nextNoteTime += beatDuration;
      
      // Comprobar si es momento de cambiar sección
      if (this.totalBeats >= this.nextSectionChange) {
        this.changeSection();
        this.nextSectionChange = this.totalBeats + 16 + Math.floor(Math.random() * 8); // 16-24 beats
      }
    }
  }
  
  scheduleNotesForBeat(beat, time) {
    // Índice en las secuencias
    const sequenceIndex = beat % 8;
    
    // Bajo
    if (this.bassSequence[sequenceIndex]) {
      this.playNote('bass', this.getNote(0), time, 0.5); // Octava más baja
    }
    
    // Pad/acordes (cada 4 beats)
    if (this.padSequence[sequenceIndex]) {
      // Tocar un acorde simple (tríada)
      this.playNote('pad', this.getNote(1), time, 1.0); // Nota base
      this.playNote('pad', this.getNote(1, 2), time, 0.4); // Tercera
      this.playNote('pad', this.getNote(1, 4), time, 0.3); // Quinta
    }
    
    // Arpegio
    if (this.arpSequence[sequenceIndex]) {
      // Seleccionar nota del arpegio basada en el beat
      const offset = Math.floor(beat / 2) % 4; // 0, 1, 2, 3
      this.playNote('arp', this.getNote(2, offset), time, 0.2);
    }
  }
  
  playNote(type, frequency, startTime, volume = 0.5) {
    if (!this.context || !this.isPlaying) return;
    
    const preset = this.oscillatorPresets[type];
    if (!preset) return;
    
    // Crear oscilador
    const oscillator = this.context.createOscillator();
    oscillator.type = preset.type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = preset.detune;
    
    // Crear envelope para volumen
    const gainNode = this.context.createGain();
    gainNode.gain.value = 0;
    
    // Crear filtro
    const filter = this.context.createBiquadFilter();
    filter.type = preset.filter.type;
    filter.frequency.value = preset.filter.frequency;
    filter.Q.value = preset.filter.Q;
    
    // Conectar nodos
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioManager.musicGain);
    
    // Calcular tiempos para ADSR
    const attackTime = startTime + preset.attack;
    const decayTime = attackTime + preset.decay;
    const sustainTime = startTime + 0.5; // Duración estándar de medio segundo
    const releaseTime = sustainTime + preset.release;
    
    // Configurar envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, attackTime);
    gainNode.gain.linearRampToValueAtTime(volume * preset.sustain, decayTime);
    gainNode.gain.setValueAtTime(volume * preset.sustain, sustainTime);
    gainNode.gain.linearRampToValueAtTime(0, releaseTime);
    
    // Programar inicio y fin
    oscillator.start(startTime);
    oscillator.stop(releaseTime);
    
    // Almacenar para limpieza
    this.activeNodes.push({
      oscillator,
      gainNode,
      endTime: releaseTime
    });
    
    // Programar limpieza automática
    setTimeout(() => {
      this.cleanupNodes();
    }, (releaseTime - this.context.currentTime) * 1000 + 100);
    
    return oscillator;
  }
  
  cleanupNodes() {
    // Eliminar nodos que ya han terminado
    const now = this.context.currentTime;
    this.activeNodes = this.activeNodes.filter(node => {
      if (node.endTime <= now) {
        // Intentar desconectar para liberar recursos
        try {
          if (node.gainNode) node.gainNode.disconnect();
        } catch (e) {
          // Ignorar errores
        }
        return false;
      }
      return true;
    });
  }
  
  generateRandomScale() {
    // Elegir tonalidad aleatoria
    const possibleKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    this.key = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
    
    // Elegir escala aleatoria del config
    this.scale = this.config.scales[Math.floor(Math.random() * this.config.scales.length)];
    
    // Regenerar secuencias
    this.generateSequences();
  }
  
  generateSequences() {
    // Generar nuevas secuencias rítmicas
    // Bajo: Simple, enfocado en downbeats
    this.bassSequence = [1, 0, 0, 0, 1, 0, 0, 0];
    
    // Pad: Notas sostenidas, espaciadas
    this.padSequence = [1, 0, 0, 0, 0, 0, 1, 0];
    
    // Arpegio: Más rítmico y complejo
    this.arpSequence = [0, 1, 0, 1, 0, 1, 0, 1];
    
    // Añadir variación
    if (Math.random() > 0.5) {
      const randomIndex = Math.floor(Math.random() * 8);
      this.bassSequence[randomIndex] = this.bassSequence[randomIndex] === 0 ? 1 : 0;
    }
    
    if (Math.random() > 0.3) {
      const randomIndex = Math.floor(Math.random() * 8);
      this.padSequence[randomIndex] = this.padSequence[randomIndex] === 0 ? 1 : 0;
    }
    
    if (Math.random() > 0.2) {
      const randomIndex = Math.floor(Math.random() * 8);
      this.arpSequence[randomIndex] = this.arpSequence[randomIndex] === 0 ? 1 : 0;
    }
  }
  
  getNote(octaveOffset = 0, degreeOffset = 0) {
      // Frecuencias base para las notas (A4 = 440 Hz)
      const A4 = 440;
      
      // Definir notas base en relación a A (en semitonos)
      const noteOffsets = {
        'C': -9,
        'C#': -8,
        'D': -7,
        'D#': -6,
        'E': -5,
        'F': -4,
        'F#': -3,
        'G': -2,
        'G#': -1,
        'A': 0,
        'A#': 1,
        'B': 2
      };
      
      // Definir intervalos para diferentes escalas (en semitonos)
      const scaleIntervals = {
        'major': [0, 2, 4, 5, 7, 9, 11],
        'minor': [0, 2, 3, 5, 7, 8, 10],
        'pentatonic': [0, 2, 4, 7, 9]
      };
      
      // Obtener offset base para la tonalidad
      const keyOffset = noteOffsets[this.key] || 0;
      
      // Obtener intervalos para la escala seleccionada
      const intervals = scaleIntervals[this.scale] || scaleIntervals.major;
      
      // Calcular grado en la escala
      const degree = degreeOffset % intervals.length;
      
      // Calcular el offset total en semitonos
      const octave = 4 + octaveOffset + Math.floor(degreeOffset / intervals.length);
      const semitonesFromA4 = keyOffset + intervals[degree] + (octave - 4) * 12;
      
      // Calcular la frecuencia
      // f = f0 * 2^(n/12) donde n es el número de semitonos desde la nota de referencia
      const frequency = A4 * Math.pow(2, semitonesFromA4 / 12);
      
      return frequency;
    }
    
    changeSection() {
      // Cambiar aleatoriamente algunos parámetros para crear variedad
      
      // 30% de posibilidad de cambiar de escala
      if (Math.random() < 0.3) {
        this.generateRandomScale();
      } else {
        // Si no cambiamos la escala, al menos variamos las secuencias
        this.generateSequences();
      }
      
      // Variar tempo ligeramente (90% - 110% del tempo original)
      this.bpm = this.config.bpm * (0.9 + Math.random() * 0.2);
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
      
      // Detectar picos (cambios bruscos en el audio)
      const peak = max > 0.7 && max > average * 1.5 ? max : 0;
      
      return {
        average,
        peak,
        lowFreq,
        midFreq,
        highFreq
      };
    }
  }