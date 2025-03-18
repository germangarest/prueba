export class Collisions {
  constructor() {
    this.collisionGroups = new Map();
  }
  
  // Registrar una entidad en un grupo de colisión
  registerEntity(entity, groupName) {
    if (!this.collisionGroups.has(groupName)) {
      this.collisionGroups.set(groupName, []);
    }
    
    this.collisionGroups.get(groupName).push(entity);
  }
  
  // Eliminar una entidad de todos los grupos
  unregisterEntity(entity) {
    for (const [groupName, entities] of this.collisionGroups.entries()) {
      const index = entities.indexOf(entity);
      if (index !== -1) {
        entities.splice(index, 1);
      }
    }
  }
  
  // Comprobar colisiones entre dos grupos
  checkCollisions(group1, group2, callback) {
    const entities1 = this.collisionGroups.get(group1) || [];
    const entities2 = this.collisionGroups.get(group2) || [];
    
    for (const entity1 of entities1) {
      for (const entity2 of entities2) {
        // Evitar comparar una entidad consigo misma
        if (entity1 === entity2) continue;
        
        // Comprobar si están activas
        if (!entity1.active || !entity2.active) continue;
        
        // Determinar el tipo de colisión según las geometrías
        const collision = this.detectCollision(entity1, entity2);
        
        if (collision) {
          // Llamar al callback con las entidades que colisionan
          if (callback) {
            callback(entity1, entity2, collision);
          }
        }
      }
    }
  }
  
  // Detectar colisión entre dos entidades
  detectCollision(entity1, entity2) {
    // Obtener geometrías y posiciones
    const type1 = this.getColliderType(entity1);
    const type2 = this.getColliderType(entity2);
    
    // Elegir el método de detección según los tipos
    if (type1 === 'sphere' && type2 === 'sphere') {
      return this.sphereSphereCollision(entity1, entity2);
    } else if ((type1 === 'sphere' && type2 === 'box') ||
               (type1 === 'box' && type2 === 'sphere')) {
      const sphere = type1 === 'sphere' ? entity1 : entity2;
      const box = type1 === 'sphere' ? entity2 : entity1;
      return this.sphereBoxCollision(sphere, box);
    } else if (type1 === 'box' && type2 === 'box') {
      return this.boxBoxCollision(entity1, entity2);
    }
    
    return false;
  }
  
  // Determinar el tipo de colisionador para una entidad
  getColliderType(entity) {
    // Por defecto, asumir que se trata de una caja
    if (!entity.colliderType) {
      return 'box';
    }
    return entity.colliderType;
  }
  
  // Colisión esfera-esfera
  sphereSphereCollision(entity1, entity2) {
    const pos1 = entity1.getPosition();
    const pos2 = entity2.getPosition();
    const radius1 = entity1.getSize().radius || 0.5;
    const radius2 = entity2.getSize().radius || 0.5;
    
    const distance = pos1.distanceTo(pos2);
    const sumRadii = radius1 + radius2;
    
    if (distance < sumRadii) {
      // Calcular vector de colisión
      const normal = new THREE.Vector3()
        .subVectors(pos2, pos1)
        .normalize();
        
      // Profundidad de penetración
      const penetration = sumRadii - distance;
      
      return {
        normal,
        penetration,
        point: new THREE.Vector3()
          .copy(pos1)
          .add(normal.clone().multiplyScalar(radius1))
      };
    }
    
    return false;
  }
  
  // Colisión esfera-caja
  sphereBoxCollision(sphere, box) {
    const spherePos = sphere.getPosition();
    const boxPos = box.getPosition();
    const boxSize = box.getSize();
    const sphereRadius = sphere.getSize().radius || 0.5;
    
    // Calcular mitades del tamaño
    const halfWidth = boxSize.width / 2;
    const halfHeight = boxSize.height / 2;
    const halfDepth = boxSize.depth / 2;
    
    // Calcular límites de la caja
    const boxMin = new THREE.Vector3(
      boxPos.x - halfWidth,
      boxPos.y - halfHeight,
      boxPos.z - halfDepth
    );
    
    const boxMax = new THREE.Vector3(
      boxPos.x + halfWidth,
      boxPos.y + halfHeight,
      boxPos.z + halfDepth
    );
    
    // Encontrar el punto más cercano de la caja a la esfera
    const closestPoint = new THREE.Vector3();
    
    // Para cada componente, elegir el valor más cercano dentro de los límites
    closestPoint.x = Math.max(boxMin.x, Math.min(spherePos.x, boxMax.x));
    closestPoint.y = Math.max(boxMin.y, Math.min(spherePos.y, boxMax.y));
    closestPoint.z = Math.max(boxMin.z, Math.min(spherePos.z, boxMax.z));
    
    // Calcular distancia entre el punto más cercano y el centro de la esfera
    const distance = spherePos.distanceTo(closestPoint);
    
    if (distance < sphereRadius) {
      // Calcular vector de colisión
      const normal = new THREE.Vector3()
        .subVectors(spherePos, closestPoint)
        .normalize();
        
      // Profundidad de penetración
      const penetration = sphereRadius - distance;
      
      return {
        normal,
        penetration,
        point: closestPoint
      };
    }
    
    return false;
  }
  
  // Colisión caja-caja (AABB)
  boxBoxCollision(entity1, entity2) {
    const pos1 = entity1.getPosition();
    const size1 = entity1.getSize();
    const pos2 = entity2.getPosition();
    const size2 = entity2.getSize();
    
    // Calcular mitades
    const halfWidth1 = size1.width / 2;
    const halfHeight1 = size1.height / 2;
    const halfDepth1 = size1.depth / 2;
    
    const halfWidth2 = size2.width / 2;
    const halfHeight2 = size2.height / 2;
    const halfDepth2 = size2.depth / 2;
    
    // Calcular mínimos y máximos para ambas cajas
    const min1 = new THREE.Vector3(
      pos1.x - halfWidth1,
      pos1.y - halfHeight1,
      pos1.z - halfDepth1
    );
    
    const max1 = new THREE.Vector3(
      pos1.x + halfWidth1,
      pos1.y + halfHeight1,
      pos1.z + halfDepth1
    );
    
    const min2 = new THREE.Vector3(
      pos2.x - halfWidth2,
      pos2.y - halfHeight2,
      pos2.z - halfDepth2
    );
    
    const max2 = new THREE.Vector3(
      pos2.x + halfWidth2,
      pos2.y + halfHeight2,
      pos2.z + halfDepth2
    );
    
    // Comprobar colisión AABB
    const collideX = max1.x >= min2.x && min1.x <= max2.x;
    const collideY = max1.y >= min2.y && min1.y <= max2.y;
    const collideZ = max1.z >= min2.z && min1.z <= max2.z;
    
    if (collideX && collideY && collideZ) {
      // Calcular profundidades de penetración en cada eje
      const overlapX = Math.min(max1.x - min2.x, max2.x - min1.x);
      const overlapY = Math.min(max1.y - min2.y, max2.y - min1.y);
      const overlapZ = Math.min(max1.z - min2.z, max2.z - min1.z);
      
      // Encontrar el eje con menor penetración
      let normal = new THREE.Vector3();
      let penetration = 0;
      
      if (overlapX <= overlapY && overlapX <= overlapZ) {
        // Colisión en eje X
        penetration = overlapX;
        normal.x = pos1.x < pos2.x ? -1 : 1;
      } else if (overlapY <= overlapX && overlapY <= overlapZ) {
        // Colisión en eje Y
        penetration = overlapY;
        normal.y = pos1.y < pos2.y ? -1 : 1;
      } else {
        // Colisión en eje Z
        penetration = overlapZ;
        normal.z = pos1.z < pos2.z ? -1 : 1;
      }
      
      // Calcular punto de colisión aproximado (centroide de la intersección)
      const intersectionMin = new THREE.Vector3(
        Math.max(min1.x, min2.x),
        Math.max(min1.y, min2.y),
        Math.max(min1.z, min2.z)
      );
      
      const intersectionMax = new THREE.Vector3(
        Math.min(max1.x, max2.x),
        Math.min(max1.y, max2.y),
        Math.min(max1.z, max2.z)
      );
      
      const point = new THREE.Vector3()
        .addVectors(intersectionMin, intersectionMax)
        .multiplyScalar(0.5);
      
      return {
        normal,
        penetration,
        point
      };
    }
    
    return false;
  }
}