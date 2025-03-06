// First, import the threeImports to ensure Three.js and all extensions are loaded
import * as ThreeImports from './threeImports.js';

// Then import our game
import { Game } from './game/Game.js';

// Initialize game when DOM is fully loaded and Three.js is ready
window.addEventListener('DOMContentLoaded', async () => {
	try {
		console.log('DOM Loaded, initializing game...');

		// Update loading progress
		const loadingBar = document.getElementById('loading-bar');
		const loadingText = document.getElementById('loading-text');

		// Show loading progress
		loadingBar.style.width = '50%';
		loadingText.textContent = 'Loading game...';

		// Initialize game
		const game = new Game();
		await game.init();

		// Update loading progress
		loadingBar.style.width = '100%';
		loadingText.textContent = 'Game ready!';

		// Start animation loop
		game.animate();

		// Expose game instance for debugging
		window.game = game;

		// Hide loading screen after a delay
		setTimeout(() => {
			document.getElementById('loading-screen').style.opacity = '0';
			setTimeout(() => {
				document.getElementById('loading-screen').style.display = 'none';
			}, 1000);
		}, 500);
	} catch (error) {
		console.error('Error initializing game:', error);
		document.getElementById('loading-text').textContent =
			'Error loading game: ' + error.message;
		document.getElementById('loading-text').style.color = '#ff0000';
	}
});
