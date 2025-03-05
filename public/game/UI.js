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

	showGameOver(score) {
		this.finalScoreElement.textContent = `Your score: ${score}`;
		this.gameOverScreen.style.display = 'block';
	}

	hideGameOver() {
		this.gameOverScreen.style.display = 'none';
	}
}
