import { THREE } from './threeImports.js';
import { Game } from './game/Game.js';

// Initialize game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
	const game = new Game();
	game.init();
	game.animate();

	// Export game instance for debugging
	window.game = game;
});
