export class Obstacle {
  constructor(position, type, scene, audioReactive = true) {
    this.position = position;
    this.type = type || 'spike'; // spike, laser, rotator
    this.scene = scene;
    this.audioReactive = audioReactive;
    
    // Propiedades específicas según el tipo
    this.setupProperties();
    
    // Crear representación visual
    this.createVisuals();
    
    // Física
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.active = true;
    
    // Estado de animación
    this.animationTime = 0;
  }
  
  setupProperties() {
    switch (this.type) {
      case 'spike':
        this.size = { width: 1, height: 2, depth: 1 };
        this.color = 0xff0066;
        this.damage = 1;
        break;
        
      case 'laser':
        this.size = { width: 0.5, height: 8, depth: 0.5 };
        this.color = 0xff3300;
        this.damage = 2;
        this.isBeam = true;
        break;
        
      case 'rotator':
        this.size = { width: 5, height: 0.5, depth: 0.5 };
        this.color = 0xffaa00;
        this.damage = 1;
        this.rotationSpeed = Math.PI; // radianes por segundo
        break;
        
      default:
        this.size = { width: 1, height: 1, depth: 1 };
        this.color = 0xff0000;
        this.damage = 1;
    }
  }
  
  createVisuals() {
    let geometry;
    
    switch (this.type) {
      case 'spike':
        geometry = new THREE.ConeGeometry(
          this.size.width / 2,
          this.size.height,
          4
        );
        break;
        
      case 'laser':
        geometry = new THREE.CylinderGeometry(
          0.1,
          0.1,
          this.size.height,
          8
        );
        break;
        
      case 'rotator':
        geometry = new THREE.BoxGeometry(
          this.size.width,
          this.size.height,
          this.size.depth
        );
        break;
        
      default:
        geometry = new THREE.BoxGeometry(
          this.size.width,
          this.size.height,
          this.size.depth
        );
    }
    
    // Material con emisión para efecto de neón
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    });
    
    // Crear malla
    this.mesh = new THREE.Mesh(geometry, material);
    
    // Ajustes específicos según el tipo
    if (this.type === 'spike') {
      this.mesh.rotation.x = Math.PI; // Invertir para que la punta apunte hacia arriba
    } else if (this.type === 'laser') {
      this.mesh.rotation.x = Math.PI / 2; // Rotar para que esté horizontal
    }
    
    this.mesh.position.copy(this.position);
    this.mesh.castShadow = true;
    
    // Añadir efectos según el tipo
    this.addTypeSpecificEffects();
    
    // Añadir a la escena
    this.scene.addObject(this.mesh);
  }
  
  addTypeSpecificEffects() {
    // Añadir efectos específicos según el tipo de obstáculo
    switch (this.type) {
      case 'laser':
        // Añadir luz para el láser
        const light = new THREE.PointLight(this.color, 2, 10);
        this.mesh.add(light);
        
        // Añadir partículas para el haz
        this.addLaserParticles();
        break;
        
      case 'rotator':
        // Añadir efecto de borde brillante
        const edgesGeometry = new THREE.EdgesGeometry(this.mesh.geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ 
          color: this.color,
          transparent: true,
          opacity: 0.8
        });
        this.edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        this.mesh.add(this.edges);
        break;
        
      case 'spike':
        // Agregar un brillo en la punta
        const tipLight = new THREE.PointLight(this.color, 1, 3);
        tipLight.position.y = this.size.height / 2;
        this.mesh.add(tipLight);
        break;
    }
  }
  
  addLaserParticles() {
    // Geometría para partículas
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    // Distribuir partículas a lo largo del láser
    for (let i = 0; i < particleCount; i++) {
      const y = (Math.random() - 0.5) * this.size.height;
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Material para partículas
    const particleMaterial = new THREE.PointsMaterial({
      color: this.color,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.mesh.add(this.particles);
  }
  
  update(deltaTime, audioData) {
    this.animationTime += deltaTime;
    
    // Actualizar según el tipo
    switch (this.type) {
      case 'rotator':
        // Rotar continuamente
        this.mesh.rotation.z += this.rotationSpeed * deltaTime;
        break;
        
      case 'laser':
        // Pulsar con la música
        if (this.audioReactive && audioData) {
          const intensity = 1.2 + audioData.average * 2;
          this.mesh.material.emissiveIntensity = intensity;
          
          // Escalar el grosor del láser con el ritmo
          const scale = 0.8 + audioData.peak * 0.5;
          this.mesh.scale.x = scale;
          this.mesh.scale.z = scale;
          
          // Actualizar partículas
          if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
              // Mover aleatoriamente en X y Z pero mantener Y
              positions[i] = (Math.random() - 0.5) * 0.2 * audioData.average;
              positions[i + 2] = (Math.random() - 0.5) * 0.2 * audioData.average;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
          }
        }
        break;
        
      case 'spike':
        // Movimiento sinusoidal para los picos
        if (this.audioReactive && audioData) {
          // Hacer que reaccione más intensamente con audio bajo
          const movement = Math.sin(this.animationTime * 5) * 0.2;
          this.mesh.position.y = this.position.y + movement + (audioData.lowFreq * 0.5);
          
          // Aumentar brillo con el audio
          this.mesh.material.emissiveIntensity = 1.2 + audioData.peak;
        } else {
          // Movimiento básico si no hay audio
          this.mesh.position.y = this.position.y + Math.sin(this.animationTime * 5) * 0.2;
        }
        break;
    }
    
    // Si el obstáculo se mueve, actualizar posición
    if (!this.velocity.equals(new THREE.Vector3(0, 0, 0))) {
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
      this.mesh.position.copy(this.position);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  getSize() {
    // Ajustar según la rotación para colisiones más precisas
    if (this.type === 'rotator') {
      // Calcular el tamaño basado en la rotación actual
      const angle = this.mesh.rotation.z;
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      
      const width = this.size.width * cos + this.size.height * sin;
      const height = this.size.height * cos + this.size.width * sin;
      
      return { width, height, depth: this.size.depth };
    }
    
    return this.size;
  }
  
  getMesh() {
    return this.mesh;
  }
  
  getDamage() {
    return this.damage;
  }
  
  setVelocity(velocity) {
    this.velocity.copy(velocity);
  }
  
  setActive(active) {
    this.active = active;
    this.mesh.visible = active;
  }
  
  destroy() {
    // Eliminar de la escena
    if (this.mesh) {
      this.scene.removeObject(this.mesh);
    }
  }
}