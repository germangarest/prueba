export class Patterns {
  constructor() {
    // Definir patrones de nivel
    this.initPatterns();
  }
  
  initPatterns() {
    this.patterns = {
      // Patrón de zigzag
      'zigzag': {
        platforms: [
          {
            offset: { x: 3, y: 0, z: -4 },
            size: { width: 4, height: 0.5, depth: 3 },
            audioReactive: false
          },
          {
            offset: { x: -3, y: 1, z: -8 },
            size: { width: 4, height: 0.5, depth: 3 },
            audioReactive: false
          },
          {
            offset: { x: 3, y: 2, z: -12 },
            size: { width: 4, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: -3, y: 3, z: -16 },
            size: { width: 4, height: 0.5, depth: 3 },
            audioReactive: false
          }
        ],
        obstacles: [
          {
            offset: { x: 3, y: 1.5, z: -4 },
            type: 'spike'
          },
          {
            offset: { x: -3, y: 2.5, z: -8 },
            type: 'spike'
          }
        ]
      },
      
      // Patrón de escalera
      'staircase': {
        platforms: [
          {
            offset: { x: 0, y: 1, z: -4 },
            size: { width: 5, height: 0.5, depth: 3 },
            audioReactive: false
          },
          {
            offset: { x: 0, y: 2, z: -8 },
            size: { width: 5, height: 0.5, depth: 3 },
            audioReactive: false
          },
          {
            offset: { x: 0, y: 3, z: -12 },
            size: { width: 5, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: 0, y: 4, z: -16 },
            size: { width: 5, height: 0.5, depth: 3 },
            audioReactive: false
          }
        ],
        obstacles: [
          {
            offset: { x: 0, y: 6, z: -10 },
            type: 'rotator'
          }
        ]
      },
      
      // Patrón de plataformas paralelas
      'parallel': {
        platforms: [
          {
            offset: { x: -4, y: 0, z: -5 },
            size: { width: 3, height: 0.5, depth: 10 },
            audioReactive: false
          },
          {
            offset: { x: 4, y: 0, z: -5 },
            size: { width: 3, height: 0.5, depth: 10 },
            audioReactive: false
          },
          {
            offset: { x: 0, y: 0, z: -12 },
            size: { width: 10, height: 0.5, depth: 3 },
            audioReactive: true
          }
        ],
        obstacles: [
          {
            offset: { x: 0, y: 1.5, z: -5 },
            type: 'laser'
          }
        ]
      },
      
      // Patrón de plataformas flotantes
      'floatingIslands': {
        platforms: [
          {
            offset: { x: -3, y: 0, z: -4 },
            size: { width: 3, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: 3, y: 0, z: -4 },
            size: { width: 3, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: 0, y: 0, z: -8 },
            size: { width: 3, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: -3, y: 0, z: -12 },
            size: { width: 3, height: 0.5, depth: 3 },
            audioReactive: true
          },
          {
            offset: { x: 3, y: 0, z: -12 },
            size: { width: 3, height: 0.5, depth: 3 },
            audioReactive: true
          }
        ],
        obstacles: [
          {
            offset: { x: 0, y: 1.5, z: -4 },
            type: 'rotator'
          },
          {
            offset: { x: 0, y: 1.5, z: -12 },
            type: 'rotator'
          }
        ]
      },
      
      // Patrón de túnel
      'tunnel': {
        platforms: [
          // Base del túnel
          {
            offset: { x: 0, y: 0, z: -10 },
            size: { width: 5, height: 0.5, depth: 20 },
            audioReactive: false
          },
          // Paredes laterales
          {
            offset: { x: -3, y: 2, z: -10 },
            size: { width: 1, height: 4, depth: 20 },
            audioReactive: true
          },
          {
            offset: { x: 3, y: 2, z: -10 },
            size: { width: 1, height: 4, depth: 20 },
            audioReactive: true
          }
        ],
        obstacles: [
          {
            offset: { x: 0, y: 1.5, z: -5 },
            type: 'spike'
          },
          {
            offset: { x: 0, y: 1.5, z: -15 },
            type: 'spike'
          }
        ]
      }
    };
  }
  
  getPattern(name) {
    return this.patterns[name] || null;
  }
  
  getPatternNames() {
    return Object.keys(this.patterns);
  }
  
  getRandomPattern() {
    const names = this.getPatternNames();
    const randomIndex = Math.floor(Math.random() * names.length);
    return this.getPattern(names[randomIndex]);
  }
  
  // Método para crear un patrón personalizado
  createCustomPattern(platforms, obstacles) {
    return {
      platforms: platforms || [],
      obstacles: obstacles || []
    };
  }
}