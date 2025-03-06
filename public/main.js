import { Game } from './game/Game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
	// Log that we're starting
	console.log('DEBUG - DOMContentLoaded event fired');

	try {
		// Get container element
		const container = document.getElementById('game-container');

		if (!container) {
			console.error('Game container not found, creating one');
			// Create container if it doesn't exist
			const newContainer = document.createElement('div');
			newContainer.id = 'game-container';
			document.body.appendChild(newContainer);

			// Initialize game with the new container
			const game = new Game(newContainer);

			// Export game instance for debugging
			window.game = game;
		} else {
			console.log('Game container found, initializing game');
			// Initialize game with existing container
			const game = new Game(container);

			// Export game instance for debugging
			window.game = game;
		}
	} catch (error) {
		console.error('ERROR initializing game:', error);
		// Show error on page for visibility
		const loadingScreen = document.getElementById('loading-screen');
		if (loadingScreen) {
			loadingScreen.innerHTML = `<h2>Error Loading Game</h2><p>${error.message}</p>`;
		}
	}
});
