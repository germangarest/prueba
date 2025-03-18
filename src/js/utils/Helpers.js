// Colección de funciones auxiliares para el juego

// Interpolación lineal
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Restringir un valor a un rango
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Generar un color aleatorio en formato hexadecimal
export function randomColor() {
  return Math.floor(Math.random() * 0xffffff);
}

// Generar un color neón aleatorio
export function randomNeonColor() {
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

// Convertir grados a radianes
export function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

// Convertir radianes a grados
export function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

// Calcular distancia entre dos puntos Vector3
export function distance(v1, v2) {
  return v1.distanceTo(v2);
}

// Obtener un punto aleatorio en un radio
export function randomPointInRadius(center, radius) {
  const angle = Math.random() * Math.PI * 2;
  const r = Math.random() * radius;
  
  return new THREE.Vector3(
    center.x + Math.cos(angle) * r,
    center.y,
    center.z + Math.sin(angle) * r
  );
}

// Formatear número para mostrar en UI (ejemplo: 1000 -> 1.0K)
export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

// Determinar si el dispositivo es móvil
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Crear elemento DOM con atributos
export function createElement(type, attributes = {}, parent = null) {
  const element = document.createElement(type);
  
  for (const key in attributes) {
    if (key === 'style') {
      Object.assign(element.style, attributes.style);
    } else if (key === 'textContent') {
      element.textContent = attributes.textContent;
    } else if (key === 'innerHTML') {
      element.innerHTML = attributes.innerHTML;
    } else {
      element.setAttribute(key, attributes[key]);
    }
  }
  
  if (parent) {
    parent.appendChild(element);
  }
  
  return element;
}

// Crear un sprite con textura
export function createSprite(texturePath, size = 1) {
  const texture = new THREE.TextureLoader().load(texturePath);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  
  return sprite;
}

// Crear texto 3D
export function create3DText(text, parameters = {}) {
  const defaults = {
    size: 1,
    height: 0.2,
    curveSegments: 12,
    bevelEnabled: false,
    color: 0xffffff
  };
  
  const config = { ...defaults, ...parameters };
  
  const loader = new THREE.FontLoader();
  
  return new Promise((resolve) => {
    // Usar fuente por defecto o cargar una personalizada
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      const textGeometry = new THREE.TextGeometry(text, {
        font: font,
        size: config.size,
        height: config.height,
        curveSegments: config.curveSegments,
        bevelEnabled: config.bevelEnabled
      });
      
      const textMaterial = new THREE.MeshBasicMaterial({ color: config.color });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      
      // Centrar texto
      textGeometry.computeBoundingBox();
      const boundingBox = textGeometry.boundingBox;
      const center = new THREE.Vector3();
      boundingBox.getCenter(center);
      textGeometry.translate(-center.x, -center.y, -center.z);
      
      resolve(textMesh);
    });
  });
}

// Crear partículas
export function createParticles(count, size, color, spread = 10) {
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: color,
    size: size,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });
  
  return new THREE.Points(particles, material);
}

// Aplicar fuerza de rebote entre dos objetos
export function applyBounce(object1, object2, elasticity = 0.7) {
  if (!object1.velocity || !object2.velocity) return;
  
  const pos1 = object1.getPosition();
  const pos2 = object2.getPosition();
  
  const direction = new THREE.Vector3().subVectors(pos1, pos2).normalize();
  
  // Calcular velocidad relativa en dirección del impacto
  const v1 = object1.velocity.dot(direction);
  const v2 = object2.velocity.dot(direction);
  
  // Calcular impulso
  const impulse = (v1 - v2) * elasticity;
  
  // Aplicar impulso
  object1.velocity.sub(direction.clone().multiplyScalar(impulse));
  object2.velocity.add(direction.clone().multiplyScalar(impulse));
}