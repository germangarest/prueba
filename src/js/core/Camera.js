export class Camera {
  constructor(config) {
    this.config = config;
    
    // Crear cámara de perspectiva
    this.camera = new THREE.PerspectiveCamera(
      config.fov,
      window.innerWidth / window.innerHeight,
      config.near,
      config.far
    );
    
    // Posicionar cámara
    this.camera.position.set(
      config.position.x,
      config.position.y,
      config.position.z
    );
    
    // Punto hacia donde mira
    this.camera.lookAt(
      config.lookAt.x,
      config.lookAt.y,
      config.lookAt.z
    );
    
    // Configuraciones para seguimiento
    this.followOffset = new THREE.Vector3(0, 5, 10);
    this.lookAtOffset = new THREE.Vector3(0, 0, -5);
    this.dampingFactor = 0.1; // Factor de suavizado
    
    // Objetivos para interpolación suave
    this.targetPosition = new THREE.Vector3();
    this.targetLookAt = new THREE.Vector3();
  }
  
  getCamera() {
    return this.camera;
  }
  
  updateAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
  
  follow(targetPosition, instantly = false) {
    // Calcular posición objetivo
    this.targetPosition.copy(targetPosition).add(this.followOffset);
    this.targetLookAt.copy(targetPosition).add(this.lookAtOffset);
    
    if (instantly) {
      // Actualizar inmediatamente
      this.camera.position.copy(this.targetPosition);
      this.camera.lookAt(this.targetLookAt);
    } else {
      // Actualizar con suavizado
      this.camera.position.lerp(this.targetPosition, this.dampingFactor);
      
      // Crear un vector temporal para la dirección de visión actual
      const currentLookAt = new THREE.Vector3();
      this.camera.getWorldDirection(currentLookAt);
      currentLookAt.normalize();
      
      // Calcular dirección deseada
      const desiredDirection = new THREE.Vector3()
        .copy(this.targetLookAt)
        .sub(this.camera.position)
        .normalize();
        
      // Interpolar entre direcciones
      const resultDirection = new THREE.Vector3()
        .copy(currentLookAt)
        .lerp(desiredDirection, this.dampingFactor)
        .normalize();
        
      // Aplicar la dirección resultante
      const lookAtPoint = new THREE.Vector3()
        .copy(this.camera.position)
        .add(resultDirection);
        
      this.camera.lookAt(lookAtPoint);
    }
  }
  
  shake(intensity = 0.2, duration = 0.5) {
    // Implementar efecto de sacudida de cámara
    const originalPosition = this.camera.position.clone();
    let elapsedTime = 0;
    
    const updateShake = () => {
      elapsedTime += 0.016; // Aproximadamente 60 FPS
      
      if (elapsedTime < duration) {
        const shakeIntensity = intensity * (1 - (elapsedTime / duration));
        this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeIntensity;
        this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeIntensity;
        
        requestAnimationFrame(updateShake);
      } else {
        this.camera.position.copy(originalPosition);
      }
    };
    
    updateShake();
  }
}