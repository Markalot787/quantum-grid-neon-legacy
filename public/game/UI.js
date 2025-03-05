export class UI {
	constructor(game) {
		this.game = game;
		console.log('DEBUG - Initializing UI');

		// Get UI elements
		this.scoreElement = document.getElementById('score');
		this.levelElement = document.getElementById('level');
		this.cubesLeftElement = document.getElementById('cubes-left');
		this.livesElement = document.getElementById('lives');

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

		// Log which elements were found and which weren't
		console.log('DEBUG - UI Elements found:', {
			score: !!this.scoreElement,
			level: !!this.levelElement,
			cubesLeft: !!this.cubesLeftElement,
			lives: !!this.livesElement,
			startScreen: !!this.startScreen,
			gameOverScreen: !!this.gameOverScreen,
			finalScore: !!this.finalScoreElement,
			startButton: !!this.startButton,
			restartButton: !!this.restartButton,
			paymentModal: !!this.paymentModal,
			paymentButtonContainer: !!this.paymentButtonContainer,
		});

		// Initialize event listeners
		this.initEventListeners();
	}

	initEventListeners() {
		// Start button
		if (this.startButton) {
			this.startButton.addEventListener('click', () => {
				this.hideStartScreen();
				this.game.startGame();
			});
			console.log('DEBUG - Start button event listener added');
		} else {
			console.warn('WARNING - Start button not found');
		}

		// Restart button
		if (this.restartButton) {
			this.restartButton.addEventListener('click', () => {
				this.hideGameOverScreen();
				this.game.restartGame();
			});
			console.log('DEBUG - Restart button event listener added');
		} else {
			console.warn('WARNING - Restart button not found');
		}
	}

	updateScore(score) {
		if (this.scoreElement) {
			this.scoreElement.textContent = `Score: ${score}`;
		}
	}

	updateLevel(level) {
		if (this.levelElement) {
			this.levelElement.textContent = `Level: ${level}`;
		}
	}

	updateCubesLeft(count) {
		if (this.cubesLeftElement) {
			this.cubesLeftElement.textContent = `Cubes: ${count}`;
		}
	}

	updateLives(lives) {
		if (this.livesElement) {
			// Clear previous hearts
			this.livesElement.innerHTML = '';

			// Add heart icons for each life
			for (let i = 0; i < lives; i++) {
				const heartIcon = document.createElement('span');
				heartIcon.className = 'heart-icon';
				heartIcon.innerHTML = '❤️';
				this.livesElement.appendChild(heartIcon);
			}

			// Add empty hearts for lost lives
			for (let i = lives; i < 3; i++) {
				const emptyHeartIcon = document.createElement('span');
				emptyHeartIcon.className = 'heart-icon empty';
				emptyHeartIcon.innerHTML = '🖤';
				this.livesElement.appendChild(emptyHeartIcon);
			}
		}
	}

	showGameOverScreen(finalScore) {
		if (this.finalScoreElement && this.gameOverScreen) {
			this.finalScoreElement.textContent = finalScore;
			this.gameOverScreen.style.display = 'flex';
			console.log('DEBUG - Game over screen shown with score:', finalScore);
		}
	}

	hideGameOverScreen() {
		if (this.gameOverScreen) {
			this.gameOverScreen.style.display = 'none';
			console.log('DEBUG - Game over screen hidden');
		}
	}

	showStartScreen() {
		if (this.startScreen) {
			this.startScreen.style.display = 'flex';
			console.log('DEBUG - Start screen shown');
		}
	}

	hideStartScreen() {
		if (this.startScreen) {
			this.startScreen.style.display = 'none';
			console.log('DEBUG - Start screen hidden');
		}
	}

	showPaymentModal() {
		if (this.paymentModal && this.paymentButtonContainer) {
			this.paymentModal.style.display = 'flex';
			console.log('DEBUG - Payment modal shown');

			// Clear previous buttons
			this.paymentButtonContainer.innerHTML = '';

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

			// Add cancel button
			const cancelButton = document.createElement('button');
			cancelButton.id = 'cancel-payment-button';
			cancelButton.textContent = 'Cancel';
			cancelButton.style.backgroundColor = 'transparent';
			cancelButton.style.color = '#ccc';
			cancelButton.style.border = '2px solid #ccc';
			this.paymentButtonContainer.appendChild(cancelButton);

			// Add event listener to cancel button
			cancelButton.addEventListener('click', () => {
				this.hidePaymentModal();
				this.hideGameOverScreen();
				this.game.restartGame();
			});
		}
	}

	hidePaymentModal() {
		if (this.paymentModal && this.paymentButtonContainer) {
			this.paymentModal.style.display = 'none';
			console.log('DEBUG - Payment modal hidden');

			// Clear payment button container
			while (this.paymentButtonContainer.firstChild) {
				this.paymentButtonContainer.removeChild(
					this.paymentButtonContainer.firstChild
				);
			}
		}
	}
}
