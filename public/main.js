import { Game } from './game/Game.js';

// Give a small delay to ensure imports are loaded
window.addEventListener('DOMContentLoaded', () => {
	// Initialize game
	const game = new Game();
	game.init();
	game.animate();

	// Export game instance for debugging
	window.game = game;
});
