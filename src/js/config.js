export const config = {
  // Configuración general
  game: {
    name: 'NEON PULSE',
    version: '1.0.0',
    debugMode: false,
    mobileControls: true
  },
  
  // Configuración del renderizado
  renderer: {
    antialias: true,
    pixelRatio: window.devicePixelRatio || 1,
    clearColor: 0x000000,
    shadowEnabled: true
  },
  
  // Configuración de cámara
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 5, z: 10 },
    lookAt: { x: 0, y: 0, z: 0 }
  },
  
  // Física y juego
  physics: {
    gravity: 9.8,
    playerMass: 1,
    frictionCoefficient: 0.05,
    jumpForce: 15
  },
  
  // Configuración del jugador
  player: {
    speed: 15,
    color: 0x00ff88,
    size: { radius: 0.5 },
    trailLength: 10,
    trailOpacity: 0.7
  },
  
  // Configuración de niveles
  level: {
    platformCount: 25,
    minPlatformSize: { width: 2, height: 0.5, depth: 4 },
    maxPlatformSize: { width: 8, height: 1, depth: 4 },
    minDistance: 2,
    maxDistance: 6,
    obstacleFrequency: 0.3
  },
  
  // Configuración de audio
  audio: {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    bpm: 120,
    scales: ['minor', 'major', 'pentatonic']
  }
};