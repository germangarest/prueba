export class Platform {
  constructor(position, size, color, scene, audioReactive = false) {
    this.position = position;
    this.size = size;
    this.color = color || 0x0088ff;
    this.scene = scene;
    this.audioReactive = audioReactive;
    this.originalY = position.y;
    
    // Crear representación visual
    this.createVisuals();
    
    // Física
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.active = true;
  }
  
  createVisuals() {
    // Geometría
    const geometry = new THREE.BoxGeometry(
      this.size.width,
      this.size.height,
      this.size.depth
    );
    
    // Material con efecto de neón
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      roughness: 0.3,
      metalness: 0.7
    });
    
    // Crear malla
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Añadir borde de neón
    this.addNeonEdges();
    
    // Añadir a la escena
    this.scene.addObject(this.mesh);
  }
  
  addNeonEdges() {
    // Crear geometría de borde
    const edgesGeometry = new THREE.EdgesGeometry(this.mesh.geometry);
    
    // Material de línea para los bordes
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8,
      linewidth: 1
    });
    
    // Crear líneas
    this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    this.mesh.add(this.edges);
  }
  
  update(deltaTime, audioData) {
    // Si la plataforma es reactiva al audio, hacer que "pulse" con la música
    if (this.audioReactive && audioData) {
      // Escalar basado en frecuencias bajas
      const bassPower = audioData.lowFreq || audioData.average || 0;
      const scale = 1 + bassPower * 0.2;
      
      this.mesh.scale.y = scale;
      
      // Ajustar emisividad basada en el audio
      if (this.mesh.material.emissiveIntensity) {
        this.mesh.material.emissiveIntensity = 0.5 + bassPower;
        this.edges.material.opacity = 0.5 + bassPower * 0.5;
      }
      
      // Mover ligeramente hacia arriba y abajo con el ritmo
      if (audioData.peak) {
        this.position.y = this.originalY + audioData.peak * 0.5;
      } else {
        // Volver lentamente a la posición original
        this.position.y += (this.originalY - this.position.y) * 0.1;
      }
      
      this.mesh.position.copy(this.position);
    }
    
    // Si la plataforma se mueve, actualizar posición
    if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
      this.mesh.position.copy(this.position);
    }
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getSize() {
    return {
      width: this.size.width * this.mesh.scale.x,
      height: this.size.height * this.mesh.scale.y,
      depth: this.size.depth * this.mesh.scale.z
    };
  }
  
  getMesh() {
    return this.mesh;
  }
  
  setVelocity(velocity) {
    this.velocity.copy(velocity);
  }
  
  setColor(color) {
    this.color = color;
    if (this.mesh && this.mesh.material) {
      this.mesh.material.color.set(color);
      this.mesh.material.emissive.set(color);
      
      if (this.edges && this.edges.material) {
        this.edges.material.color.set(color);
      }
    }
  }
  
  setActive(active) {
    this.active = active;
    this.mesh.visible = active;
  }
  
  // Método para animación al aterrizar el jugador
  triggerLandingAnimation() {
    const originalScale = this.mesh.scale.clone();
    
    // Animar la escala
    this.mesh.scale.y *= 0.8;
    
    // Animar el color
    const originalEmissiveIntensity = this.mesh.material.emissiveIntensity;
    this.mesh.material.emissiveIntensity = 1.5;
    
    // Restaurar valores originales
    setTimeout(() => {
      this.mesh.scale.copy(originalScale);
      this.mesh.material.emissiveIntensity = originalEmissiveIntensity;
    }, 200);
  }
  
  destroy() {
    // Eliminar de la escena
    if (this.mesh) {
      this.scene.removeObject(this.mesh);
    }
  }
}