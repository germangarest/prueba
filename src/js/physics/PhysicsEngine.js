export class PhysicsEngine {
  constructor(config) {
    this.config = config;
    this.gravity = config.gravity;
    this.frictionCoefficient = config.frictionCoefficient;
  }
  
  update(deltaTime) {
    // Este método se llama en cada frame
    // Aquí iría la lógica global de física si fuera necesaria
  }
  
  applyGravity(entity, deltaTime) {
    if (!entity.onGround) {
      entity.velocity.y -= this.gravity * deltaTime;
    }
  }
  
  applyFriction(entity, deltaTime) {
    if (entity.onGround) {
      const friction = this.frictionCoefficient;
      entity.velocity.x *= (1 - friction);
      entity.velocity.z *= (1 - friction);
    }
  }
  
  checkCollisions(player, platforms, obstacles) {
    this.checkPlatformCollisions(player, platforms);
    return this.checkObstacleCollisions(player, obstacles);
  }
  
  checkPlatformCollisions(player, platforms) {
    const playerPos = player.getPosition();
    const playerRadius = player.config.size.radius;
    
    let onAnyGround = false;
    let closestPlatformY = -Infinity;
    let landedThisFrame = false;
    
    for (const platform of platforms) {
      if (!platform.active) continue;
      
      const platformPos = platform.getPosition();
      const platformSize = platform.getSize();
      
      // Cálculo de AABB para la plataforma
      const minX = platformPos.x - platformSize.width / 2;
      const maxX = platformPos.x + platformSize.width / 2;
      const minY = platformPos.y - platformSize.height / 2;
      const maxY = platformPos.y + platformSize.height / 2;
      const minZ = platformPos.z - platformSize.depth / 2;
      const maxZ = platformPos.z + platformSize.depth / 2;
      
      // Comprobar si el jugador está dentro del rango horizontal de la plataforma
      const withinX = playerPos.x + playerRadius > minX && playerPos.x - playerRadius < maxX;
      const withinZ = playerPos.z + playerRadius > minZ && playerPos.z - playerRadius < maxZ;
      
      if (withinX && withinZ) {
        // Comprobar colisión vertical (aterrizaje en plataforma)
        const playerBottom = playerPos.y - playerRadius;
        const playerBottomVelocity = player.velocity.y;
        
        // Si el jugador está cayendo y está justo encima de la plataforma
        if (playerBottomVelocity < 0 && 
            playerBottom <= maxY && 
            playerBottom >= minY - 0.3) { // Small tolerance for better detection
          
          // Corregir posición para estar exactamente sobre la plataforma
          player.position.y = maxY + playerRadius;
          player.velocity.y = 0;
          player.onGround = true;
          player.jumping = false;
          onAnyGround = true;
          
          // Registrar la plataforma más alta en la que ha aterrizado
          if (maxY > closestPlatformY) {
            closestPlatformY = maxY;
            landedThisFrame = true;
          }
          
          // Efecto visual de aterrizaje
          platform.triggerLandingAnimation();
        }
        
        // Colisión con techo
        const playerTop = playerPos.y + playerRadius;
        if (player.velocity.y > 0 && playerTop >= minY && playerTop <= maxY + 0.3) {
          player.position.y = minY - playerRadius;
          player.velocity.y = 0;
        }
        
        // Colisiones laterales (paredes)
        const playerRight = playerPos.x + playerRadius;
        const playerLeft = playerPos.x - playerRadius;
        
        if (playerPos.y >= minY && playerPos.y <= maxY) {
          // Colisión con pared derecha de la plataforma
          if (playerLeft <= maxX && playerLeft >= maxX - 0.3 && player.velocity.x < 0) {
            player.position.x = maxX + playerRadius;
            player.velocity.x = 0;
          }
          // Colisión con pared izquierda de la plataforma
          else if (playerRight >= minX && playerRight <= minX + 0.3 && player.velocity.x > 0) {
            player.position.x = minX - playerRadius;
            player.velocity.x = 0;
          }
        }
      }
    }
    
    player.onGround = onAnyGround;
    
    // Si acaba de aterrizar, reproducir efectos
    if (landedThisFrame && !player.wasOnGround) {
      // Reproducir sonido de aterrizaje
      // Crear efecto visual
    }
    
    player.wasOnGround = onAnyGround;
  }
  
  checkObstacleCollisions(player, obstacles) {
    if (player.invulnerable) return false;
    
    const playerPos = player.getPosition();
    const playerRadius = player.config.size.radius;
    
    for (const obstacle of obstacles) {
      if (!obstacle.active) continue;
      
      const obstaclePos = obstacle.getPosition();
      const obstacleSize = obstacle.getSize();
      
      // Método de colisión depende del tipo de obstáculo
      let collision = false;
      
      switch (obstacle.type) {
        case 'spike':
          // Colisión esfera-cono
          const distance = playerPos.distanceTo(obstaclePos);
          const collisionDistance = playerRadius + obstacleSize.width / 2;
          
          if (distance < collisionDistance) {
            collision = true;
          }
          break;
          
        case 'laser':
          // Para láser, usar colisión de rayo
          const laserDirection = new THREE.Vector3(1, 0, 0); // Asume láser horizontal
          laserDirection.applyQuaternion(obstacle.mesh.quaternion);
          
          const playerToLaser = new THREE.Vector3().subVectors(playerPos, obstaclePos);
          const projection = playerToLaser.dot(laserDirection);
          
          // Comprobar si el jugador está dentro del rango del láser
          if (Math.abs(projection) <= obstacleSize.height / 2) {
            const perpendicularDistance = playerToLaser.clone()
              .sub(laserDirection.clone().multiplyScalar(projection))
              .length();
              
            if (perpendicularDistance < playerRadius + 0.2) {
              collision = true;
            }
          }
          break;
          
        case 'rotator':
          // Para rotator, usar AABB rotado
          // Simplificado para este ejemplo, usamos distancia como aproximación
          const rotatorDistance = playerPos.distanceTo(obstaclePos);
          if (rotatorDistance < obstacleSize.width / 2 + playerRadius) {
            collision = true;
          }
          break;
          
        default:
          // Colisión AABB-Esfera por defecto
          const minX = obstaclePos.x - obstacleSize.width / 2;
          const maxX = obstaclePos.x + obstacleSize.width / 2;
          const minY = obstaclePos.y - obstacleSize.height / 2;
          const maxY = obstaclePos.y + obstacleSize.height / 2;
          const minZ = obstaclePos.z - obstacleSize.depth / 2;
          const maxZ = obstaclePos.z + obstacleSize.depth / 2;
          
          // Encontrar el punto más cercano del AABB a la esfera
          const closestX = Math.max(minX, Math.min(playerPos.x, maxX));
          const closestY = Math.max(minY, Math.min(playerPos.y, maxY));
          const closestZ = Math.max(minZ, Math.min(playerPos.z, maxZ));
          
          const closestPoint = new THREE.Vector3(closestX, closestY, closestZ);
          const distance = playerPos.distanceTo(closestPoint);
          
          if (distance < playerRadius) {
            collision = true;
          }
      }
      
      if (collision) {
        // El jugador ha sido golpeado por un obstáculo
        const isDead = player.hit(obstacle.getDamage());
        
        // Efecto visual
        obstacle.mesh.material.emissiveIntensity = 2;
        setTimeout(() => {
          if (obstacle.mesh && obstacle.mesh.material) {
            obstacle.mesh.material.emissiveIntensity = 1.2;
          }
        }, 200);
        
        return isDead; // Retornar si el jugador ha muerto
      }
    }
    
    return false; // No ha habido colisión mortal
  }
  
  // Método para aplicar impulso
  applyImpulse(entity, direction, force) {
    if (!entity.velocity) return;
    
    const impulse = direction.clone().normalize().multiplyScalar(force);
    entity.velocity.add(impulse);
  }
}