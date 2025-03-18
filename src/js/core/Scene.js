export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    
    // Configurar niebla para dar sensación de profundidad
    this.scene.fog = new THREE.FogExp2(0x000000, 0.035);
    
    // Configurar iluminación
    this.setupLights();
    
    // Configurar ambiente (fondo, skybox, etc.)
    this.setupEnvironment();
  }
  
  setupLights() {
    // Luz ambiental para iluminación general
    const ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(ambientLight);
    
    // Luz direccional principal (simula sol)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    
    // Configurar sombras de alta calidad
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
    
    // Luz de punto (neon, para el ambiente)
    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 50);
    pointLight1.position.set(-10, 15, 0);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 50);
    pointLight2.position.set(10, 15, 0);
    this.scene.add(pointLight2);
  }
  
  setupEnvironment() {
    // Grid helper para referencia visual (solo desarrollo)
    // const gridHelper = new THREE.GridHelper(100, 100);
    // this.scene.add(gridHelper);
    
    // Fondo de estrellas
    this.createStarBackground();
  }
  
  createStarBackground() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }
  
  addObject(object) {
    this.scene.add(object);
  }
  
  removeObject(object) {
    this.scene.remove(object);
  }
  
  getScene() {
    return this.scene;
  }
  
  // Método para crear efectos visuales basados en audio
  createAudioReactiveEffect(audioData) {
    // Implementar efectos visuales basados en audio
    // Esto puede incluir cambios de color, escalado, etc.
  }
}