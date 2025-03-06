export class UI {
	constructor(game) {
		this.game = game;

		// Get DOM elements with error checking
		this.scoreElement =
			document.getElementById('score') || this.createDummyElement('score');
		this.levelElement =
			document.getElementById('level') || this.createDummyElement('level');
		this.cubesLeftElement =
			document.getElementById('cubes-left') ||
			this.createDummyElement('cubes-left');
		this.markedTileElement =
			document.getElementById('markedTile') ||
			this.createDummyElement('markedTile');
		this.gameOverScreen =
			document.getElementById('gameOverScreen') ||
			this.createDummyElement('gameOverScreen');
		this.finalScoreElement =
			document.getElementById('finalScore') ||
			this.createDummyElement('finalScore');
		this.restartButton =
			document.getElementById('restartButton') ||
			this.createDummyElement('restartButton');
		this.livesElement =
			document.getElementById('lives') || this.createDummyElement('lives');

		// Create hearts container for lives
		this.heartsContainer = document.createElement('div');
		this.heartsContainer.id = 'hearts-container';
		this.heartsContainer.style.cssText = `
			position: absolute;
			top: 10px;
			right: 10px;
			display: flex;
			gap: 5px;
			z-index: 110;
		`;
		document.body.appendChild(this.heartsContainer);

		// Add event listeners
		if (this.restartButton) {
			this.restartButton.addEventListener('click', () => {
				this.game.restart();
			});
		}

		console.log('UI initialized successfully');
	}

	// Create a dummy element when a DOM element is missing
	createDummyElement(id) {
		console.warn(`Element with id '${id}' not found, creating dummy element`);
		const el = document.createElement('div');
		el.id = id;
		el.style.display = 'none';
		document.body.appendChild(el);
		return el;
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

	updateMarkedTileStatus(status) {
		if (this.markedTileElement) {
			this.markedTileElement.textContent = status;
		}
	}

	updateLives(lives) {
		if (this.livesElement) {
			this.livesElement.textContent = `Lives: ${lives}`;
		}

		// Clear existing hearts
		this.heartsContainer.innerHTML = '';

		// Add heart icons
		for (let i = 0; i < this.game.maxLives; i++) {
			const heart = document.createElement('div');
			heart.style.cssText = `
				width: 20px;
				height: 20px;
				background-color: ${i < lives ? '#ff0000' : '#333333'};
				clip-path: path('M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402m5.726-20.583c-2.203 0-4.446 1.042-5.726 3.238-1.285-2.206-3.522-3.248-5.719-3.248-3.183 0-6.281 2.187-6.281 6.191 0 4.661 5.571 9.429 12 15.809 6.43-6.38 12-11.148 12-15.809 0-4.011-3.095-6.181-6.274-6.181');
			`;
			this.heartsContainer.appendChild(heart);
		}
	}

	showGameOver(score) {
		if (this.finalScoreElement && this.gameOverScreen) {
			this.finalScoreElement.textContent = `Your score: ${score}`;
			this.gameOverScreen.style.display = 'block';
		}
	}

	hideGameOver() {
		if (this.gameOverScreen) {
			this.gameOverScreen.style.display = 'none';
		}
	}
}
