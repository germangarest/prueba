export class Renderer {
  constructor(config) {
    this.config = config;
    
    // Crear renderer WebGL
    this.renderer = new THREE.WebGLRenderer({
      antialias: config.antialias,
      powerPreference: "high-performance"
    });
    
    // Configurar renderer
    this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(config.clearColor);
    
    // Habilitar sombras si están configuradas
    if (config.shadowEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Configurar estilo del elemento canvas
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    
    // Post-procesamiento (si se necesita)
    this.setupPostProcessing();
  }
  
  setupPostProcessing() {
    // Si queremos añadir efectos post-proceso como bloom, blur, etc.
    // Por ahora lo dejamos vacío para mantener el rendimiento
  }
  
  render(scene, camera) {
    this.renderer.render(scene, camera);
  }
  
  resize(width, height) {
    this.renderer.setSize(width, height);
  }
  
  getDomElement() {
    return this.renderer.domElement;
  }
  
  // Método para efectos de renderizado especiales como resplandor de neón
  applyNeonGlow(intensity) {
    // Implementar cuando sea necesario
  }
}