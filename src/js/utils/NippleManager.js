export class NippleManager {
  constructor() {
    this.joystick = null;
    this.moveHandler = null;
    this.endHandler = null;
    this.joystickContainer = null;
  }
  
  init() {
    // Verificar si nipplejs está cargado
    if (typeof nipplejs === 'undefined') {
      console.error('NippleJS no está cargado. Asegúrate de incluirlo en tu proyecto.');
      return;
    }
    
    // Crear contenedor para el joystick
    this.createJoystickContainer();
    
    // Crear joystick
    this.joystick = nipplejs.create({
      zone: this.joystickContainer,
      mode: 'static',
      position: { left: '80px', bottom: '80px' },
      color: 'white',
      size: 100,
      dynamicPage: true
    });
    
    // Configurar eventos base
    this.setupBaseEvents();
  }
  
  createJoystickContainer() {
    this.joystickContainer = document.createElement('div');
    this.joystickContainer.id = 'joystick-container';
    this.joystickContainer.style.position = 'absolute';
    this.joystickContainer.style.bottom = '0';
    this.joystickContainer.style.left = '0';
    this.joystickContainer.style.width = '160px';
    this.joystickContainer.style.height = '160px';
    this.joystickContainer.style.zIndex = '1000';
    
    document.body.appendChild(this.joystickContainer);
  }
  
  setupBaseEvents() {
    if (!this.joystick) return;
    
    this.joystick.on('move', (evt, data) => {
      if (this.moveHandler) {
        this.moveHandler(data);
      }
    });
    
    this.joystick.on('end', (evt) => {
      if (this.endHandler) {
        this.endHandler();
      }
    });
  }
  
  onMove(callback) {
    this.moveHandler = callback;
  }
  
  onEnd(callback) {
    this.endHandler = callback;
  }
  
  destroy() {
    if (this.joystick) {
      this.joystick.destroy();
      this.joystick = null;
    }
    
    if (this.joystickContainer && this.joystickContainer.parentNode) {
      this.joystickContainer.parentNode.removeChild(this.joystickContainer);
      this.joystickContainer = null;
    }
  }
}