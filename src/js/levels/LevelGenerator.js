import { Platform } from '../entities/Platform.js';
import { Obstacle } from '../entities/Obstacle.js';
import { Patterns } from './Patterns.js';

export class LevelGenerator {
  constructor(config, scene) {
    this.config = config;
    this.scene = scene;
    
    // Colecciones de entidades
    this.platforms = [];
    this.obstacles = [];
    
    // Patrones de nivel
    this.patterns = new Patterns();
    
    // Estado de generación
    this.lastPlatformPos = new THREE.Vector3(0, 0, 0);
    this.levelProgress = 0;
    this.difficulty = 0;
    
    // Colores
    this.colorScheme = {
      primary: 0x00ffff,
      secondary: 0xff00ff,
      accent: 0xffff00
    };
    
    // Estado del juego
    this.playerPosition = new THREE.Vector3();
    this.removeDistance = 50; // Distancia tras la que se eliminan objetos
  }
  
  generateInitialLevel() {
    // Limpiar nivel existente
    this.clearLevel();
    
    // Generar plataforma inicial
    const initialPlatform = new Platform(
      new THREE.Vector3(0, 0, 0),
      { width: 10, height: 0.5, depth: 10 },
      this.colorScheme.primary,
      this.scene
    );
    
    this.platforms.push(initialPlatform);
    this.lastPlatformPos = new THREE.Vector3(0, 0, 0);
    
    // Generar primeras plataformas
    for (let i = 0; i < this.config.platformCount; i++) {
      this.generateNextPlatform();
    }
  }
  
  generateNextPlatform() {
    // Calcular nueva posición
    const lastPos = this.lastPlatformPos.clone();
    
    // Desplazamiento aleatorio
    const xOffset = (Math.random() - 0.5) * 8;
    const yOffset = (Math.random() * 2 - 0.5) * 2; // Ligera variación vertical
    const zOffset = (Math.random() * (this.config.maxDistance - this.config.minDistance)) + this.config.minDistance;
    
    // Nueva posición
    const newPos = new THREE.Vector3(
      lastPos.x + xOffset,
      lastPos.y + yOffset,
      lastPos.z - zOffset
    );
    
    // Tamaño aleatorio
    const width = lerp(
      this.config.minPlatformSize.width,
      this.config.maxPlatformSize.width,
      Math.random()
    );
    
    const height = lerp(
      this.config.minPlatformSize.height,
      this.config.maxPlatformSize.height,
      Math.random()
    );
    
    const depth = lerp(
      this.config.minPlatformSize.depth,
      this.config.maxPlatformSize.depth,
      Math.random()
    );
    
    // Color
    const useAccent = Math.random() > 0.8;
    const color = useAccent ? this.colorScheme.accent : this.colorScheme.primary;
    
    // Crear plataforma
    const platform = new Platform(
      newPos,
      { width, height, depth },
      color,
      this.scene,
      useAccent // Las plataformas de acento son reactivas al audio
    );
    
    // Añadir a la colección
    this.platforms.push(platform);
    
    // Actualizar última posición
    this.lastPlatformPos = newPos;
    
    // Posiblemente añadir un obstáculo
    if (Math.random() < this.config.obstacleFrequency * (1 + this.difficulty * 0.2)) {
      this.addObstacleNearPlatform(platform);
    }
    
    return platform;
  }
  
  generateFromPattern(patternName) {
    const pattern = this.patterns.getPattern(patternName);
    if (!pattern) return;
    
    const basePos = this.lastPlatformPos.clone();
    
    // Crear cada plataforma definida en el patrón
    pattern.platforms.forEach(platformDef => {
      const pos = new THREE.Vector3(
        basePos.x + platformDef.offset.x,
        basePos.y + platformDef.offset.y,
        basePos.z + platformDef.offset.z
      );
      
      const platform = new Platform(
        pos,
        platformDef.size,
        platformDef.color || this.colorScheme.primary,
        this.scene,
        platformDef.audioReactive
      );
      
      this.platforms.push(platform);
      
      // Actualizar última posición con la última plataforma del patrón
      if (platformDef.offset.z < 0) {
        this.lastPlatformPos = pos;
      }
    });
    
    // Crear obstáculos definidos en el patrón
    pattern.obstacles.forEach(obstacleDef => {
      const pos = new THREE.Vector3(
        basePos.x + obstacleDef.offset.x,
        basePos.y + obstacleDef.offset.y,
        basePos.z + obstacleDef.offset.z
      );
      
      const obstacle = new Obstacle(
        pos,
        obstacleDef.type,
        this.scene,
        obstacleDef.audioReactive
      );
      
      this.obstacles.push(obstacle);
    });
  }
  
  addObstacleNearPlatform(platform) {
    const platformPos = platform.getPosition();
    const platformSize = platform.getSize();
    
    // Tipos de obstáculo
    const obstacleTypes = ['spike', 'laser', 'rotator'];
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    
    // Posición basada en el tipo
    let pos;
    
    switch (type) {
      case 'spike':
        // Spike encima de la plataforma
        pos = new THREE.Vector3(
          platformPos.x + (Math.random() - 0.5) * (platformSize.width * 0.7),
          platformPos.y + platformSize.height / 2 + 1,
          platformPos.z + (Math.random() - 0.5) * (platformSize.depth * 0.7)
        );
        break;
        
      case 'laser':
        // Láser al lado de la plataforma
        const side = Math.random() > 0.5 ? 1 : -1;
        pos = new THREE.Vector3(
          platformPos.x + side * (platformSize.width / 2 + 1),
          platformPos.y + 2,
          platformPos.z + (Math.random() - 0.5) * (platformSize.depth * 0.7)
        );
        break;
        
      case 'rotator':
        // Rotator encima de la plataforma
        pos = new THREE.Vector3(
          platformPos.x,
          platformPos.y + platformSize.height / 2 + 1.5,
          platformPos.z
        );
        break;
        
      default:
        pos = new THREE.Vector3(
          platformPos.x,
          platformPos.y + platformSize.height / 2 + 1,
          platformPos.z
        );
    }
    
    // Crear y añadir obstáculo
    const obstacle = new Obstacle(
      pos,
      type,
      this.scene,
      true // reactivo al audio
    );
    
    this.obstacles.push(obstacle);
    return obstacle;
  }
  
  update(deltaTime, audioData, playerPosition) {
    // Guardar posición del jugador
    this.playerPosition.copy(playerPosition);
    
    // Actualizar nivel de dificultad basado en el progreso
    this.levelProgress += deltaTime;
    this.difficulty = Math.min(1, this.levelProgress / 60); // Max dificultad después de 1 minuto
    
    // Actualizar plataformas existentes
    for (let i = 0; i < this.platforms.length; i++) {
      this.platforms[i].update(deltaTime, audioData);
    }
    
    // Actualizar obstáculos existentes
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].update(deltaTime, audioData);
    }
    
    // Eliminar objetos lejanos
    this.cleanupDistantObjects();
    
    // Generar nuevas plataformas si es necesario
    this.ensureMinimumPlatforms();
    
    // Actualizar colores basados en audio si hay
    if (audioData && audioData.average > 0.4) {
      this.updateColors(audioData);
    }
  }
  
  cleanupDistantObjects() {
    const removeDistanceSq = this.removeDistance * this.removeDistance;
    
    // Eliminar plataformas demasiado lejanas
    this.platforms = this.platforms.filter(platform => {
      const distanceSq = this.playerPosition.distanceToSquared(platform.getPosition());
      
      if (distanceSq > removeDistanceSq) {
        platform.destroy();
        return false;
      }
      return true;
    });
    
    // Eliminar obstáculos demasiado lejanos
    this.obstacles = this.obstacles.filter(obstacle => {
      const distanceSq = this.playerPosition.distanceToSquared(obstacle.getPosition());
      
      if (distanceSq > removeDistanceSq) {
        obstacle.destroy();
        return false;
      }
      return true;
    });
  }
  
  ensureMinimumPlatforms() {
    // Asegurar que siempre hay suficientes plataformas generadas
    while (this.platforms.length < this.config.platformCount) {
      // Decidir si generar con patrón o aleatoriamente
      if (Math.random() < 0.3 && this.levelProgress > 10) {
        // Usar patrón (después de 10 segundos de juego)
        const patternNames = this.patterns.getPatternNames();
        const randomPattern = patternNames[Math.floor(Math.random() * patternNames.length)];
        this.generateFromPattern(randomPattern);
      } else {
        // Generar plataforma aleatoria
        this.generateNextPlatform();
      }
    }
  }
  
  updateColors(audioData) {
    // Cambiar colores del esquema basado en audio
    if (audioData.peak > 0.7) {
      // Cambio completo de esquema de color en picos fuertes
      this.colorScheme = {
        primary: getRandomNeonColor(),
        secondary: getRandomNeonColor(),
        accent: getRandomNeonColor()
      };
    } else if (audioData.average > 0.6) {
      // Pequeña variación en el acento para cambios medios
      this.colorScheme.accent = getRandomNeonColor();
    }
    
    // Aplicar colores a algunos objetos aleatorios
    if (Math.random() < 0.1) {
      const randomPlatform = this.platforms[Math.floor(Math.random() * this.platforms.length)];
      if (randomPlatform) {
        randomPlatform.setColor(this.colorScheme.accent);
      }
    }
  }
  
  getPlatforms() {
    return this.platforms;
  }
  
  getObstacles() {
    return this.obstacles;
  }
  
  reset() {
    this.clearLevel();
    this.levelProgress = 0;
    this.difficulty = 0;
    this.generateInitialLevel();
  }
  
  clearLevel() {
    // Eliminar todas las plataformas
    for (let i = 0; i < this.platforms.length; i++) {
      this.platforms[i].destroy();
    }
    this.platforms = [];
    
    // Eliminar todos los obstáculos
    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].destroy();
    }
    this.obstacles = [];
  }
}

// Funciones auxiliares
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getRandomNeonColor() {
  const neonColors = [
    0x00ffff, // Cyan
    0xff00ff, // Magenta
    0xffff00, // Amarillo
    0x00ff00, // Verde
    0xff0088, // Rosa
    0x00ffaa, // Turquesa
    0x8800ff  // Violeta
  ];
  
  return neonColors[Math.floor(Math.random() * neonColors.length)];
}