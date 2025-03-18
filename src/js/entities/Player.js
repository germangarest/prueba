export class Player {
  constructor(config, scene) {
    this.config = config;
    this.scene = scene;
    
    // Propiedades físicas
    this.position = new THREE.Vector3(0, 5, 0);
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.onGround = false;
    this.jumping = false;
    this.sliding = false;
    
    // Propiedades de juego
    this.lives = 3;
    this.invulnerable = false;
    this.invulnerabilityTime = 0;
    
    // Crear representación visual
    this.createVisuals();
    
    // Historial de posiciones para efecto de estela
    this.positionHistory = [];
    
    // Efectos de partículas
    this.particles = null;
    this.setupParticles();
  }
  
  createVisuals() {
    // Crear geometría (esfera para partícula de luz)
    const geometry = new THREE.SphereGeometry(this.config.size.radius, 32, 32);
    
    // Material brillante con emisión para efecto de neón
    const material = new THREE.MeshStandardMaterial({
      color: this.config.color,
      emissive: this.config.color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9
    });
    
    // Crear malla
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    
    // Añadir luz puntual que sigue al jugador para reforzar efecto neón
    this.light = new THREE.PointLight(this.config.color, 1, 10);
    this.light.position.copy(this.position);
    this.mesh.add(this.light);
    
    // Posicionar y añadir a la escena
    this.mesh.position.copy(this.position);
    this.scene.addObject(this.mesh);
    
    // Crear efecto de estela
    this.createTrail();
  }
  
  createTrail() {
    // Geometría para la estela
    const trailGeometry = new THREE.BufferGeometry();
    
    // Para empezar, crear un array de posiciones simuladas
    const positions = new Float32Array(this.config.trailLength * 3);
    for (let i = 0; i < this.config.trailLength; i++) {
      positions[i * 3] = this.position.x;
      positions[i * 3 + 1] = this.position.y;
      positions[i * 3 + 2] = this.position.z;
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Material para la estela (línea)
    const trailMaterial = new THREE.LineBasicMaterial({
      color: this.config.color,
      transparent: true,
      opacity: this.config.trailOpacity,
      blending: THREE.AdditiveBlending
    });
    
    this.trail = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.addObject(this.trail);
  }
  
  setupParticles() {
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
      particleSizes[i] = Math.random() * 0.1 + 0.05;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(this.config.color) },
        pointTexture: { value: new THREE.TextureLoader().load('assets/textures/spark.png') }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = vec3(1.0, 1.0, 1.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(color * vColor, 1.0);
          gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.mesh.add(this.particles);
  }
  
  update(deltaTime, input, audioData) {
    // Actualizar física
    this.applyPhysics(deltaTime, input);
    
    // Actualizar representación visual
    this.updateVisuals(deltaTime, audioData);
    
    // Actualizar efectos (estela, partículas)
    this.updateEffects(deltaTime, audioData);
    
    // Actualizar invulnerabilidad si está activa
    if (this.invulnerable) {
      this.invulnerabilityTime -= deltaTime;
      if (this.invulnerabilityTime <= 0) {
        this.invulnerable = false;
        this.mesh.material.opacity = 0.9; // Restaurar opacidad normal
      }
    }
  }
  
  applyPhysics(deltaTime, input) {
    // Gravedad
    if (!this.onGround) {
      this.velocity.y -= 9.8 * deltaTime;
    }
    
    // Movimiento horizontal basado en input
    this.velocity.x = input.x * this.config.speed;
    this.velocity.z = input.z * this.config.speed;
    
    // Salto
    if (input.jump && this.onGround && !this.jumping) {
      this.velocity.y = 15;
      this.jumping = true;
      this.onGround = false;
      // Reproducir sonido de salto
    }
    
    // Actualizar posición
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Actualizar malla
    this.mesh.position.copy(this.position);
    
    // Actualizar historial de posiciones para estela
    this.positionHistory.unshift(this.position.clone());
    if (this.positionHistory.length > this.config.trailLength) {
      this.positionHistory.pop();
    }
    
    // Resetear onGround - será establecido por el sistema de colisiones
    this.onGround = false;
  }
  
  updateVisuals(deltaTime, audioData) {
    // Pulso basado en la música
    if (audioData && audioData.peak) {
      const scale = 1 + audioData.peak * 0.3;
      this.mesh.scale.set(scale, scale, scale);
    } else {
      // Volver lentamente al tamaño normal
      this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    
    // Rotación mientras se mueve
    if (this.velocity.length() > 0.1) {
      this.mesh.rotation.y += deltaTime * 2;
      this.mesh.rotation.x += deltaTime * this.velocity.z * 0.1;
      this.mesh.rotation.z += deltaTime * this.velocity.x * 0.1;
    }
    
    // Efecto de parpadeo durante invulnerabilidad
    if (this.invulnerable) {
      this.mesh.material.opacity = 0.3 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.7;
    }
  }
  
  updateEffects(deltaTime, audioData) {
    // Actualizar posiciones de la estela
    const positions = this.trail.geometry.attributes.position.array;
    
    for (let i = 0; i < this.positionHistory.length; i++) {
      const pos = this.positionHistory[i];
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
    }
    
    this.trail.geometry.attributes.position.needsUpdate = true;
    
    // Efecto de opacidad de la estela que disminuye con la distancia
    const colors = [];
    for (let i = 0; i < this.positionHistory.length; i++) {
      const alpha = 1 - (i / this.positionHistory.length);
      colors.push(this.config.color * alpha);
    }
    
    // Actualizar partículas si hay audio
    if (audioData && this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        // Mover partículas aleatoriamente alrededor del jugador
        const angle = Math.random() * Math.PI * 2;
        const radius = audioData.average * 2 * Math.random();
        
        positions[i] = Math.cos(angle) * radius;
        positions[i + 1] = Math.sin(angle) * radius;
        positions[i + 2] = (Math.random() - 0.5) * radius;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getMesh() {
    return this.mesh;
  }
  
  hit() {
    if (!this.invulnerable) {
      this.lives--;
      this.invulnerable = true;
      this.invulnerabilityTime = 2; // 2 segundos de invulnerabilidad
      
      // Reproducir sonido de daño
      
      // Efecto visual de impacto
      this.mesh.material.emissiveIntensity = 3;
      setTimeout(() => {
        this.mesh.material.emissiveIntensity = 1.5;
      }, 200);
      
      return this.lives <= 0; // Retorna true si el jugador ha perdido todas las vidas
    }
    return false;
  }
  
  reset() {
    this.position.set(0, 5, 0);
    this.velocity.set(0, 0, 0);
    this.acceleration.set(0, 0, 0);
    this.lives = 3;
    this.onGround = false;
    this.jumping = false;
    this.invulnerable = false;
    
    // Reiniciar historial de posiciones
    this.positionHistory = [];
    for (let i = 0; i < this.config.trailLength; i++) {
      this.positionHistory.push(this.position.clone());
    }
    
    // Actualizar malla
    this.mesh.position.copy(this.position);
    this.mesh.scale.set(1, 1, 1);
    this.mesh.rotation.set(0, 0, 0);
  }
}