import { Game } from './game/Game.js';

// Error handling for loading issues
window.addEventListener('error', function (event) {
	console.error('Loading error:', event.message);
	document.body.innerHTML += `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: white; z-index: 9999; padding: 20px; font-family: monospace;">
            <h2>Error Loading Game</h2>
            <p>${event.message}</p>
            <p>File: ${event.filename}</p>
            <p>Line: ${event.lineno}, Column: ${event.colno}</p>
            <button onclick="location.reload()">Reload Page</button>
        </div>
    `;
});

// Initialize game
try {
	const game = new Game();
	game.init();
	game.animate();

	// Export game instance for debugging
	window.game = game;
} catch (err) {
	console.error('Game initialization error:', err);
	document.body.innerHTML += `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: white; z-index: 9999; padding: 20px; font-family: monospace;">
            <h2>Game Initialization Error</h2>
            <p>${err.message}</p>
            <pre>${err.stack}</pre>
            <button onclick="location.reload()">Reload Page</button>
        </div>
    `;
}
