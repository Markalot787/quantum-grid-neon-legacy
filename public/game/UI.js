export class UI {
	constructor(game) {
		this.game = game;

		// Get UI elements
		this.scoreElement = document.getElementById('score');
		this.levelElement = document.getElementById('level');
		this.cubesLeftElement = document.getElementById('cubes-left');

		// Get screen elements
		this.startScreen = document.getElementById('start-screen');
		this.gameOverScreen = document.getElementById('game-over');
		this.finalScoreElement = document.getElementById('final-score');

		// Get buttons
		this.startButton = document.getElementById('start-button');
		this.restartButton = document.getElementById('restart-button');

		// Payment modal
		this.paymentModal = document.getElementById('payment-modal');
		this.paymentButtonContainer = document.getElementById(
			'payment-button-container'
		);

		// Initialize event listeners
		this.initEventListeners();
	}

	initEventListeners() {
		// Start button
		this.startButton.addEventListener('click', () => {
			this.hideStartScreen();
			this.game.startGame();
		});

		// Restart button
		this.restartButton.addEventListener('click', () => {
			this.hideGameOverScreen();
			this.game.restartGame();
		});
	}

	updateScore(score) {
		this.scoreElement.textContent = `Score: ${score}`;
	}

	updateLevel(level) {
		this.levelElement.textContent = `Level: ${level}`;
	}

	updateCubesLeft(count) {
		this.cubesLeftElement.textContent = `Cubes: ${count}`;
	}

	showGameOverScreen(finalScore) {
		this.finalScoreElement.textContent = finalScore;
		this.gameOverScreen.style.display = 'flex';
	}

	hideGameOverScreen() {
		this.gameOverScreen.style.display = 'none';
	}

	showStartScreen() {
		this.startScreen.style.display = 'flex';
	}

	hideStartScreen() {
		this.startScreen.style.display = 'none';
	}

	showPaymentModal() {
		this.paymentModal.style.display = 'flex';

		// Initialize Stripe payment button
		if (this.game.stripe) {
			const checkoutButton = document.createElement('button');
			checkoutButton.id = 'checkout-button';
			checkoutButton.textContent = 'Unlock Full Game - $2.99';
			this.paymentButtonContainer.appendChild(checkoutButton);

			checkoutButton.addEventListener('click', () => {
				this.game.handlePayment();
			});
		}
	}

	hidePaymentModal() {
		this.paymentModal.style.display = 'none';

		// Clear payment button container
		while (this.paymentButtonContainer.firstChild) {
			this.paymentButtonContainer.removeChild(
				this.paymentButtonContainer.firstChild
			);
		}
	}
}
