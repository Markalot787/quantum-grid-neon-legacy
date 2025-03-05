export class UI {
	constructor(game) {
		console.log('DEBUG - UI initialization started');
		this.game = game;

		// Get UI elements with null checks
		this.scoreElement = document.getElementById('score');
		this.levelElement = document.getElementById('level');
		this.cubesLeftElement = document.getElementById('cubes-left');
		this.livesElement = document.getElementById('lives');
		this.startScreen = document.getElementById('start-screen');
		this.gameOverScreen = document.getElementById('game-over-screen');
		this.finalScoreElement = document.getElementById('final-score');
		this.startButton = document.getElementById('start-button');
		this.restartButton = document.getElementById('restart-button');
		this.paymentModal = document.getElementById('payment-modal');
		this.paymentButton = document.getElementById('pay-button');

		// Log which elements were found
		console.log('DEBUG - UI elements found:', {
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
			paymentButton: !!this.paymentButton,
		});

		// Initialize event listeners
		this.initEventListeners();

		// Set initial lives display
		this.updateLives(3);

		console.log('DEBUG - UI initialization complete');
	}

	initEventListeners() {
		console.log('DEBUG - Setting up UI event listeners');

		// Add event listeners with null checks
		if (this.startButton) {
			this.startButton.addEventListener('click', () => {
				console.log('DEBUG - Start button clicked');
				this.hideStartScreen();
				this.game.startLevel(this.game.currentLevel);
			});
		} else {
			console.warn(
				'WARNING - Start button not found, game may not start properly'
			);
		}

		if (this.restartButton) {
			this.restartButton.addEventListener('click', () => {
				console.log('DEBUG - Restart button clicked');
				this.game.restart();
			});
		} else {
			console.warn(
				'WARNING - Restart button not found, game cannot be restarted'
			);
		}

		console.log('DEBUG - UI event listeners initialized');
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
			// Clear current hearts
			this.livesElement.innerHTML = '';

			// Add heart icons based on lives count
			for (let i = 0; i < 3; i++) {
				const heart = document.createElement('span');
				if (i < lives) {
					heart.innerHTML = '❤️';
					heart.className = 'heart-icon';
				} else {
					heart.innerHTML = '❤️';
					heart.className = 'heart-icon empty';
				}
				this.livesElement.appendChild(heart);
			}
		}
	}

	showGameOverScreen(finalScore) {
		console.log('DEBUG - Showing game over screen with score:', finalScore);
		if (this.gameOverScreen) {
			if (this.finalScoreElement) {
				this.finalScoreElement.textContent = `Your score: ${finalScore}`;
			}
			this.gameOverScreen.style.display = 'flex';
		} else {
			console.warn('WARNING - Game over screen element not found');
		}
	}

	hideGameOverScreen() {
		console.log('DEBUG - Hiding game over screen');
		if (this.gameOverScreen) {
			this.gameOverScreen.style.display = 'none';
		}
	}

	showStartScreen() {
		console.log('DEBUG - Showing start screen');
		if (this.startScreen) {
			this.startScreen.style.display = 'flex';
		} else {
			console.warn('WARNING - Start screen element not found');
		}
	}

	hideStartScreen() {
		console.log('DEBUG - Hiding start screen');
		if (this.startScreen) {
			this.startScreen.style.display = 'none';
		}
	}

	showPaymentModal() {
		console.log('DEBUG - Showing payment modal');
		if (this.paymentModal) {
			this.paymentModal.style.display = 'flex';
		} else {
			console.warn('WARNING - Payment modal element not found');

			// Fallback: If modal not found, just continue the game
			this.game.playCount = 0;
			this.game.startLevel(this.game.currentLevel);
		}
	}

	hidePaymentModal() {
		console.log('DEBUG - Hiding payment modal');
		if (this.paymentModal) {
			this.paymentModal.style.display = 'none';
		}
	}

	update() {
		// This method is called every frame by Game.js
		// Add any UI updates that need to happen every frame here
		// Currently, we don't need frame-by-frame updates for the UI
		// but the method must exist to prevent errors
	}

	updateMarkedTileStatus(status) {
		// This method would update some UI element to show the marked tile status
		// Currently, there's no specific element for this in the HTML, so we'll just log it
		console.log('DEBUG - Marked tile status:', status);
	}
}
