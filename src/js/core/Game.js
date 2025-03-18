import { Scene } from './Scene.js';
import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';
import { Controls } from '../utils/Controls.js';
import { Player } from '../entities/Player.js';
import { LevelGenerator } from '../levels/LevelGenerator.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MusicGenerator } from '../audio/MusicGenerator.js';

export class Game {
  constructor(config) {
    this.config = config;
    this.clock = new THREE.Clock();
    this.gameOver = false;
    this.score = 0;
    this.bestScore = localStorage.getItem('neonPulse_bestScore') || 0;
    this.paused = false;
    this.gameStarted = false;
    this.rafId = null;
    
    // Inicializar componentes principales
    this.renderer = new Renderer(this.config.renderer);
    this.camera = new Camera(this.config.camera);
    this.scene = new Scene();
    
    // Sistemas del juego
    this.physics = new PhysicsEngine(this.config.physics);
    this.audioManager = new AudioManager(this.config.audio);
    this.musicGenerator = new MusicGenerator(this.config.audio);
    this.levelGenerator = new LevelGenerator(this.config.level, this.scene);
    
    // Controles
    this.controls = new Controls(this.config.game.mobileControls);
    
    // UI Elements
    this.setupUI();
  }
  
  init() {
    // Agregar renderer al DOM
    document.getElementById('game-container').appendChild(this.renderer.getDomElement());
    
    // Mostrar pantalla de inicio
    this.showStartScreen();
    
    // Inicializar música
    this.audioManager.init();
    this.musicGenerator.init(this.audioManager);
    
    // Inicializar nivel
    this.levelGenerator.generateInitialLevel();
    
    // Crear jugador
    this.player = new Player(this.config.player, this.scene);
    
    // Configurar eventos
    this.setupEventListeners();
  }
  
  start() {
    this.hideStartScreen();
    this.gameStarted = true;
    this.musicGenerator.start();
    this.clock.start();
    this.update();
  }
  
  update() {
    if (this.paused) return;
    
    const delta = this.clock.getDelta();
    
    // Actualizar física
    this.physics.update(delta);
    
    // Actualizar audio y música
    this.audioManager.update(delta);
    const audioData = this.musicGenerator.update(delta);
    
    // Actualizar nivel basado en audio
    this.levelGenerator.update(delta, audioData, this.player.getPosition());
    
    // Actualizar jugador
    this.player.update(delta, this.controls.getInput(), audioData);
    
    // Comprobar colisiones
    this.physics.checkCollisions(this.player, this.levelGenerator.getPlatforms(), this.levelGenerator.getObstacles());
    
    // Actualizar cámara
    this.camera.follow(this.player.getPosition());
    
    // Comprobar condiciones de game over
    if (this.player.position.y < -10) {
      this.gameOver = true;
      this.showGameOverScreen();
    }
    
    // Actualizar UI
    this.updateUI();
    
    // Renderizar escena
    this.renderer.render(this.scene.getScene(), this.camera.getCamera());
    
    // Programar siguiente frame
    this.rafId = requestAnimationFrame(() => this.update());
  }
  
  pause() {
    this.paused = true;
    this.clock.stop();
    this.audioManager.pauseAll();
    cancelAnimationFrame(this.rafId);
    this.showPauseScreen();
  }
  
  resume() {
    this.paused = false;
    this.clock.start();
    this.audioManager.resumeAll();
    this.hidePauseScreen();
    this.update();
  }
  
  restart() {
    this.gameOver = false;
    this.score = 0;
    this.levelGenerator.reset();
    this.player.reset();
    this.audioManager.stopAll();
    this.musicGenerator.restart();
    this.hideGameOverScreen();
    this.start();
  }
  
  handleResize() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    this.camera.updateAspect(window.innerWidth / window.innerHeight);
  }
  
  setupUI() {
    // Crear elementos UI básicos
    this.scoreElement = document.getElementById('score');
    this.pauseBtn = document.getElementById('pause-btn');
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    
    // Si no existen en el DOM, crearlos
    if (!this.scoreElement) {
      this.scoreElement = document.createElement('div');
      this.scoreElement.id = 'score';
      document.body.appendChild(this.scoreElement);
    }
    
    // Similar para los demás elementos UI
  }
  
  updateUI() {
    this.scoreElement.textContent = `Score: ${Math.floor(this.score)}`;
    this.score += 0.1; // Incremento básico por tiempo
  }
  
  showStartScreen() {
    if (this.startScreen) this.startScreen.style.display = 'flex';
  }
  
  hideStartScreen() {
    if (this.startScreen) this.startScreen.style.display = 'none';
  }
  
  showGameOverScreen() {
    if (this.gameOverScreen) {
      const finalScore = Math.floor(this.score);
      if (finalScore > this.bestScore) {
        this.bestScore = finalScore;
        localStorage.setItem('neonPulse_bestScore', this.bestScore);
      }
      
      const scoreDisplay = this.gameOverScreen.querySelector('.final-score');
      if (scoreDisplay) scoreDisplay.textContent = `Score: ${finalScore} | Best: ${this.bestScore}`;
      
      this.gameOverScreen.style.display = 'flex';
    }
  }
  
  hideGameOverScreen() {
    if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
  }
  
  showPauseScreen() {
    if (this.pauseScreen) this.pauseScreen.style.display = 'flex';
  }
  
  hidePauseScreen() {
    if (this.pauseScreen) this.pauseScreen.style.display = 'none';
  }
  
  setupEventListeners() {
    // Botón de pausa
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => {
        if (this.paused) this.resume();
        else this.pause();
      });
    }
    
    // Eventos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (this.paused) this.resume();
        else this.pause();
      }
    });
    
    // Botones de UI adicionales
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
    
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.start());
    }
  }
}