import { Game } from './core/Game.js';
import { config } from './config.js';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar el juego con la configuración global
  const game = new Game(config);
  
  // Comenzar el bucle principal del juego
  game.init();
  game.start();
  
  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', () => {
    game.handleResize();
  });
  
  // Exponer la instancia del juego a la consola para depuración
  window.game = game;
});