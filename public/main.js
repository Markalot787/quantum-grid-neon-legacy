import { Game } from './game/Game.js';

// Initialize game
const game = new Game();
game.init();
game.animate();

// Export game instance for debugging
window.game = game;
