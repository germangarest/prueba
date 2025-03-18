import { NippleManager } from './NippleManager.js';

export class Controls {
  constructor(useMobileControls = true) {
    // Estado de teclas
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };
    
    // Estado de touch/joystick
    this.touch = {
      joystick: { x: 0, y: 0 },
      jump: false
    };
    
    // Vector de dirección actual
    this.direction = new THREE.Vector3();
    
    // Estado del control actual
    this.input = {
      x: 0,  // horizontal movement
      z: 0,  // forward/backward movement
      jump: false
    };
    
    // Configurar teclado
    this.setupKeyboardControls();
    
    // Configurar controles móviles si se requiere
    this.useMobileControls = useMobileControls;
    this.isMobile = this.detectMobile();
    
    if (this.useMobileControls && this.isMobile) {
      this.nippleManager = new NippleManager();
      this.setupTouchControls();
    }
  }
  
  setupKeyboardControls() {
    // Eventos de teclado
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.keys.forward = true;
        break;
      case 's':
      case 'arrowdown':
        this.keys.backward = true;
        break;
      case 'a':
      case 'arrowleft':
        this.keys.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = true;
        break;
      case ' ':
        this.keys.jump = true;
        break;
    }
    
    this.updateInput();
  }
  
  handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.keys.forward = false;
        break;
      case 's':
      case 'arrowdown':
        this.keys.backward = false;
        break;
      case 'a':
      case 'arrowleft':
        this.keys.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = false;
        break;
      case ' ':
        this.keys.jump = false;
        break;
    }
    
    this.updateInput();
  }
  
  setupTouchControls() {
    if (!this.nippleManager) return;
    
    // Inicializar joystick
    this.nippleManager.init();
    
    // Configurar eventos de joystick
    this.nippleManager.onMove((data) => {
      // Normalizar valores del joystick
      const maxDistance = 50; // Radio máximo del joystick
      const angle = data.angle.radian;
      const distance = Math.min(data.distance, maxDistance) / maxDistance;
      
      // Calcular componentes X y Y
      this.touch.joystick.x = Math.cos(angle) * distance;
      this.touch.joystick.y = Math.sin(angle) * distance;
      
      this.updateInput();
    });
    
    this.nippleManager.onEnd(() => {
      // Resetear joystick
      this.touch.joystick.x = 0;
      this.touch.joystick.y = 0;
      
      this.updateInput();
    });
    
    // Añadir botón de salto
    this.addJumpButton();
  }
  
  addJumpButton() {
    // Crear botón de salto para móviles
    const jumpButton = document.createElement('div');
    jumpButton.id = 'jump-button';
    jumpButton.innerHTML = 'JUMP';
    jumpButton.style.position = 'absolute';
    jumpButton.style.bottom = '30px';
    jumpButton.style.right = '30px';
    jumpButton.style.width = '80px';
    jumpButton.style.height = '80px';
    jumpButton.style.borderRadius = '50%';
    jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    jumpButton.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    jumpButton.style.color = 'white';
    jumpButton.style.display = 'flex';
    jumpButton.style.justifyContent = 'center';
    jumpButton.style.alignItems = 'center';
    jumpButton.style.fontSize = '16px';
    jumpButton.style.fontWeight = 'bold';
    jumpButton.style.userSelect = 'none';
    jumpButton.style.WebkitTapHighlightColor = 'transparent';
    jumpButton.style.touchAction = 'manipulation';
    
    // Añadir al DOM
    document.body.appendChild(jumpButton);
    
    // Eventos táctiles
    jumpButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touch.jump = true;
      jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      this.updateInput();
    });
    
    jumpButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touch.jump = false;
      jumpButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      this.updateInput();
    });
  }
  
  updateInput() {
    // Priorizar controles táctiles en dispositivos móviles
    if (this.isMobile && this.useMobileControls) {
      this.input.x = this.touch.joystick.x;
      this.input.z = -this.touch.joystick.y; // Invertir Y para que arriba sea hacia adelante
      this.input.jump = this.touch.jump;
    } else {
      // Calcular dirección basada en teclas
      this.input.x = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
      this.input.z = (this.keys.backward ? 1 : 0) - (this.keys.forward ? 1 : 0);
      this.input.jump = this.keys.jump;
    }
    
    // Normalizar el vector si hay movimiento diagonal
    if (this.input.x !== 0 && this.input.z !== 0) {
      const length = Math.sqrt(this.input.x * this.input.x + this.input.z * this.input.z);
      this.input.x /= length;
      this.input.z /= length;
    }
  }
  
  getInput() {
    return this.input;
  }
  
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}