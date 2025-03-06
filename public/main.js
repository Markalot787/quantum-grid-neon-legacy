import { Game } from './game/Game.js';

// Wait for page to fully load
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM loaded, initializing game...');

	// Wait a moment for Three.js to be available globally
	setTimeout(() => {
		// Make sure Three.js is available
		if (!window.THREE) {
			console.error('THREE not available! Waiting for script to load...');

			// Try one more time
			setTimeout(() => {
				if (!window.THREE) {
					console.error(
						'THREE still not available! Please check the console for errors.'
					);
					alert(
						'Could not initialize game due to missing THREE.js. Please check the console for errors.'
					);
					return;
				}
				initGame();
			}, 1000);
			return;
		}

		initGame();
	}, 500);
});

function initGame() {
	console.log('THREE is available, creating game instance');

	try {
		// Map Three.js global objects to window variables for modules that expect imports
		window.EffectComposer = THREE.EffectComposer;
		window.RenderPass = THREE.RenderPass;
		window.UnrealBloomPass = THREE.UnrealBloomPass;

		// Initialize game
		const game = new Game();
		game.init();
		game.animate();

		// Export game instance for debugging
		window.game = game;

		console.log('Game successfully initialized');
	} catch (error) {
		console.error('Error initializing game:', error);
		alert('An error occurred while initializing the game: ' + error.message);
	}
}
