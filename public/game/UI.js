export class UI {
	constructor(game) {
		this.game = game;
		this.scoreElement = document.getElementById('score');
		this.levelElement = document.getElementById('level');
		this.cubesLeftElement = document.getElementById('cubes-left');
		this.markedTileElement = document.getElementById('markedTile');
		this.gameOverScreen = document.getElementById('gameOverScreen');
		this.finalScoreElement = document.getElementById('finalScore');
		this.restartButton = document.getElementById('restartButton');
		this.livesElement = document.getElementById('lives');

		// Create hearts container for lives
		this.heartsContainer = document.createElement('div');
		this.heartsContainer.id = 'hearts-container';
		this.heartsContainer.style.cssText = `
			position: absolute;
			top: 10px;
			right: 10px;
			display: flex;
			gap: 5px;
		`;
		document.body.appendChild(this.heartsContainer);

		// Add event listeners
		this.restartButton.addEventListener('click', () => {
			this.game.restart();
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

	updateMarkedTileStatus(status) {
		this.markedTileElement.textContent = status;
	}

	updateLives(lives) {
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
		this.finalScoreElement.textContent = `Your score: ${score}`;
		this.gameOverScreen.style.display = 'block';
	}

	hideGameOver() {
		this.gameOverScreen.style.display = 'none';
	}
}
