import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Game } from './Game.js';

// Check if the user has paid
const checkPaymentStatus = async () => {
	try {
		const response = await fetch('/check-payment');
		const data = await response.json();
		return data.paid;
	} catch (error) {
		console.error('Error checking payment status:', error);
		return false;
	}
};

// Initialize the game
const initGame = async () => {
	// Check payment status
	const paid = await checkPaymentStatus();

	// Create game instance
	const game = new Game();

	// Set paid status
	game.paid = paid;

	// Check for success parameter in URL (for Stripe redirect)
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.get('success') === 'true') {
		game.paid = true;
		// Remove query parameters
		window.history.replaceState({}, document.title, window.location.pathname);
	}

	// Start animation loop
	game.animate();
};

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
