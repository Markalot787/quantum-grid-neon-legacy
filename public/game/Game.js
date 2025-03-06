import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { PaymentModal } from './PaymentModal.js';

export class Game {
	constructor() {
		this.scene = null;
		this.camera = null;
		this.renderer = null;
		this.player = null;
		this.level = null;
		this.ui = null;
		this.clock = new THREE.Clock();
		this.score = 0;
		this.currentLevel = 1;
		this.gameStarted = false;
		this.gameOver = false;
		this.paymentModal = null;
		this.playCount = 0;
		this.lives = 3;
		this.maxLives = 3;
		this.cameraAngle = 0;
		this.shouldShowTutorial = true;

		// Animation queue
		this.animations = [];

		// Game state
		this.paused = false;
		this.markedTile = null;
		this.activatedAdvantage = null;

		// Settings
		this.settings = {
			stageWidth: 5,
			stageLength: 16,
			cubeSpeed: 2.0,
			initialCubeCount: 12,
		};

		// Camera movement parameters
		this.cameraMovement = {
			angle: 0,
			radius: 12,
			height: 12,
			speed: 0.2,
			targetLookAt: new THREE.Vector3(0, 0, 8),
		};
	}

	init() {
		try {
			console.log('Initializing game...');

			// Create scene
			this.scene = new THREE.Scene();
			this.scene.background = new THREE.Color(0x000033); // Dark blue background

			// Create camera
			this.camera = new THREE.PerspectiveCamera(
				75,
				window.innerWidth / window.innerHeight,
				0.1,
				1000
			);

			// Set initial camera position for angled view
			this.camera.position.set(8, 12, -8);
			this.camera.lookAt(0, 0, 8);
			console.log('Camera initialized at position:', this.camera.position);

			// Create renderer
			this.renderer = new THREE.WebGLRenderer({ antialias: true });
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.renderer.shadowMap.enabled = true;
			document.body.appendChild(this.renderer.domElement);
			console.log('Renderer created');

			// Add lights
			const ambientLight = new THREE.AmbientLight(0x404040, 1);
			this.scene.add(ambientLight);

			const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
			directionalLight.position.set(5, 10, 5);
			directionalLight.castShadow = true;
			this.scene.add(directionalLight);
			console.log('Lights added to scene');

			// Set up post-processing effects
			this.setupPostProcessing();

			// Initialize components
			console.log('Initializing components...');
			this.player = new Player(this);
			console.log('Player initialized');

			this.level = new Level(this);
			console.log('Level initialized');

			this.ui = new UI(this);
			console.log('UI initialized');

			// Create platform
			this.level.createPlatform();
			console.log('Platform created');

			// Start first level
			this.startLevel(this.currentLevel);
			console.log('Level started');

			// Add event listeners
			window.addEventListener('resize', () => this.onWindowResize());
			document.addEventListener('keydown', (e) => this.handleKeyDown(e));
			console.log('Event listeners added');

			// Initialize payment modal
			this.paymentModal = new PaymentModal(this);
			console.log('Payment modal initialized');

			// Start game
			this.gameStarted = true;
			console.log('Game initialized successfully');

			// Initialize lives display
			this.ui.updateLives(this.lives);

			// Show tutorial popup if needed
			if (this.shouldShowTutorial) {
				this.showTutorial();
			}
		} catch (error) {
			console.error('Error during game initialization:', error);
			// Show error message on screen
			this.showErrorMessage(error);
			throw error;
		}
	}

	showErrorMessage(error) {
		const errorDiv = document.createElement('div');
		errorDiv.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0,0,0,0.8);
			color: white;
			padding: 20px;
			font-family: monospace;
			z-index: 9999;
			overflow: auto;
		`;

		errorDiv.innerHTML = `
			<h2>Game Error</h2>
			<p>${error.message}</p>
			<pre>${error.stack}</pre>
			<button onclick="location.reload()">Reload Game</button>
		`;

		document.body.appendChild(errorDiv);
	}

	showTutorial() {
		const tutorial = document.createElement('div');
		tutorial.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: rgba(0, 0, 0, 0.9);
			color: #fff;
			padding: 20px;
			border-radius: 10px;
			z-index: 1000;
			text-align: center;
			max-width: 500px;
		`;

		tutorial.innerHTML = `
			<h2>Welcome to Quantum Grid: Neon Legacy</h2>
			<p>Controls:</p>
			<ul style="list-style: none; padding: 0;">
				<li>WASD or Arrow Keys - Move</li>
				<li>SPACE - Mark/Capture Cube</li>
				<li>R - Activate Advantage (3x3 area clear)</li>
				<li>ESC - Pause Game</li>
			</ul>
			<p>Rules:</p>
			<ul style="list-style: none; padding: 0;">
				<li>Capture white cubes before they fall</li>
				<li>Avoid black cubes (they remove platform tiles)</li>
				<li>Green cubes give you advantage power</li>
				<li>You have ${this.maxLives} lives - use them wisely!</li>
			</ul>
			<button style="
				padding: 10px 20px;
				background: #00ff00;
				border: none;
				color: #000;
				border-radius: 5px;
				cursor: pointer;
				margin-top: 10px;
			">Start Game</button>
		`;

		document.body.appendChild(tutorial);

		const button = tutorial.querySelector('button');
		button.addEventListener('click', () => {
			document.body.removeChild(tutorial);
			this.gameStarted = true;
		});
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	handleKeyDown(event) {
		if (this.gameOver) return;

		const key = event.key.toLowerCase();

		if (key === 'escape') {
			this.paused = !this.paused;
			return;
		}

		if (this.paused) return;

		// Player movement
		if (key === 'w' || key === 'arrowup') {
			this.player.move('forward');
		} else if (key === 's' || key === 'arrowdown') {
			this.player.move('backward');
		} else if (key === 'a' || key === 'arrowleft') {
			this.player.move('left');
		} else if (key === 'd' || key === 'arrowright') {
			this.player.move('right');
		}

		// Mark/Capture cube
		if (key === ' ') {
			if (this.markedTile) {
				this.captureCube();
			} else {
				this.markTile();
			}
		}

		// Activate advantage cube
		if (key === 'r') {
			this.activateAdvantage();
		}
	}

	markTile() {
		// Can only mark one tile at a time
		if (this.markedTile) return;

		// Get player position
		const position = this.player.getPosition();
		const x = position.x;
		const z = position.z;

		// Create marked tile
		const geometry = new THREE.BoxGeometry(1, 0.1, 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0x0099ff,
			transparent: true,
			opacity: 0.5,
		});

		const markedTileMesh = new THREE.Mesh(geometry, material);
		markedTileMesh.position.set(x, 0.05, z);
		this.scene.add(markedTileMesh);

		this.markedTile = {
			position: new THREE.Vector2(x, z),
			mesh: markedTileMesh,
		};

		this.ui.updateMarkedTileStatus(
			`Tile marked at ${Math.round(x)}, ${Math.round(z)}`
		);
	}

	captureCube() {
		if (!this.markedTile) return;

		// Check if there's a cube above the marked tile
		const cubesToCapture = this.level.getCubesAtPosition(
			this.markedTile.position.x,
			this.markedTile.position.y
		);

		if (cubesToCapture.length > 0) {
			// Process each cube at the marked position
			cubesToCapture.forEach((cube) => {
				if (cube.type === 'normal') {
					// Capture normal cube (good)
					this.captureNormalCube(cube);
				} else if (cube.type === 'forbidden') {
					// Capture forbidden cube (bad)
					this.captureForbiddenCube(cube);
				} else if (cube.type === 'advantage') {
					// Capture advantage cube (special)
					this.captureAdvantageCube(cube);
				}
			});
		}

		// Remove marked tile
		this.scene.remove(this.markedTile.mesh);
		this.markedTile = null;
		this.ui.updateMarkedTileStatus('No tile marked');
	}

	captureNormalCube(cube) {
		// Add score
		this.score += 100;
		this.ui.updateScore(this.score);

		// Remove cube
		this.level.removeCube(cube);

		// Create capture effect
		this.createCaptureEffect(cube.mesh.position);
	}

	captureForbiddenCube(cube) {
		// Penalty for capturing forbidden cube
		// Remove 3 lines of cubes from the platform
		for (let i = 0; i < 3; i++) {
			this.level.shrinkPlatform();
		}

		// Remove cube
		this.level.removeCube(cube);

		// Visual feedback
		this.ui.updateMessage('Forbidden cube captured! Platform shrinking!', 2000);
	}

	captureAdvantageCube(cube) {
		// Set as active advantage
		this.activatedAdvantage = {
			position: new THREE.Vector2(cube.mesh.position.x, cube.mesh.position.z),
		};

		// Add score
		this.score += 50;
		this.ui.updateScore(this.score);

		// Remove cube
		this.level.removeCube(cube);

		// Create capture effect (green color)
		this.createCaptureEffect(cube.mesh.position, 0x00ff00);
	}

	activateAdvantage() {
		if (!this.activatedAdvantage) return;

		const center = this.activatedAdvantage.position;
		const areaSize = 1; // 3x3 area

		// Find all cubes in the 3x3 area
		const capturedCubes = [];
		const startX = center.x - areaSize;
		const endX = center.x + areaSize;
		const startZ = center.y - areaSize;
		const endZ = center.y + areaSize;

		for (let i = 0; i < this.level.cubes.length; i++) {
			const cube = this.level.cubes[i];
			const cubeX = Math.round(cube.mesh.position.x);
			const cubeZ = Math.round(cube.mesh.position.z);

			if (
				cubeX >= startX &&
				cubeX <= endX &&
				cubeZ >= startZ &&
				cubeZ <= endZ
			) {
				capturedCubes.push(cube);
			}
		}

		// Process each cube in the advantage area
		let hasChain = false;
		capturedCubes.forEach((cube) => {
			if (cube.type === 'advantage') {
				// This will trigger a chain reaction
				hasChain = true;
				// Store the position before removing
				const position = new THREE.Vector2(
					cube.mesh.position.x,
					cube.mesh.position.z
				);

				// Remove the cube first
				this.level.removeCube(cube);

				// Add points
				this.score += 150;

				// Create advantage effect
				this.createAdvantageEffect(
					new THREE.Vector3(position.x, 0.5, position.y),
					areaSize
				);

				// Trigger chain reaction in the next frame
				setTimeout(() => {
					this.activatedAdvantage = { position };
					this.activateAdvantage();
				}, 200);
			} else if (cube.type === 'normal') {
				this.score += 100;
				this.level.removeCube(cube);
			} else if (cube.type === 'forbidden') {
				// Don't remove forbidden cubes with advantage
				// But no penalty either
			}
		});

		// Create advantage effect (white blast)
		this.createAdvantageEffect(
			new THREE.Vector3(center.x, 0.1, center.y),
			areaSize
		);

		// Update score
		this.ui.updateScore(this.score);

		// Only clear advantage if no chain reaction
		if (!hasChain) {
			this.activatedAdvantage = null;
		}
	}

	createCaptureEffect(position, color = 0x0099ff) {
		// Create effect
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({
			color: color,
			transparent: true,
			opacity: 0.7,
		});

		const effect = new THREE.Mesh(geometry, material);
		effect.position.copy(position);
		this.scene.add(effect);

		// Animation for the effect
		const startScale = 1;
		const endScale = 2;
		const duration = 0.5;
		let elapsed = 0;

		const animate = () => {
			elapsed += 0.016;
			const progress = elapsed / duration;

			if (progress < 1) {
				const scale = startScale + (endScale - startScale) * progress;
				effect.scale.set(scale, scale, scale);
				effect.material.opacity = 0.7 * (1 - progress);

				requestAnimationFrame(animate);
			} else {
				this.scene.remove(effect);
			}
		};

		animate();
	}

	createAdvantageEffect(position, size) {
		// Create white blast effect for advantage cube explosion
		const geometry = new THREE.BoxGeometry(size * 2 + 1, 0.5, size * 2 + 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.8,
		});

		const effect = new THREE.Mesh(geometry, material);
		effect.position.copy(position);
		this.scene.add(effect);

		// Animate the effect
		const startScale = 0.5;
		const endScale = 1.5;
		const duration = 0.5;

		let elapsedTime = 0;
		const updateEffect = (delta) => {
			elapsedTime += delta;
			const progress = Math.min(elapsedTime / duration, 1);

			// Scale up and fade out
			const scale = startScale + (endScale - startScale) * progress;
			effect.scale.set(scale, scale, scale);
			effect.material.opacity = 0.8 * (1 - progress);

			if (progress >= 1) {
				// Animation complete, remove the effect
				this.scene.remove(effect);
				return true; // signal completion
			}
			return false;
		};

		// Add to animation loop
		this.addAnimation(updateEffect);
	}

	startLevel(levelNumber) {
		// Reset state
		this.markedTile = null;
		this.activatedAdvantage = null;

		// Configure level based on level number
		this.settings.cubeSpeed = 1.5 + levelNumber * 0.25;
		this.settings.initialCubeCount = 10 + levelNumber * 2;

		// Generate level
		this.level.generateLevel(levelNumber);

		// Reset player position
		this.player.resetPosition();

		// Update UI
		this.ui.updateLevel(levelNumber);
		this.ui.updateCubesLeft(this.level.getRemainingCubes());

		// Add a row to platform after completing a level
		if (levelNumber > 1) {
			this.level.extendPlatform();
		}
	}

	nextLevel() {
		this.currentLevel++;

		// Check for payment after 7 plays
		this.playCount++;
		if (this.playCount >= 7) {
			this.paymentModal.show();
			return;
		}

		this.startLevel(this.currentLevel);
	}

	endGame() {
		this.gameOver = true;

		if (this.lives <= 0 && this.playCount >= 7) {
			this.paymentModal.show();
		} else {
			this.ui.showGameOver(this.score);
		}
	}

	loseLife() {
		this.lives--;
		this.ui.updateLives(this.lives);

		if (this.lives <= 0) {
			this.endGame();
		}
	}

	restart() {
		this.score = 0;
		this.currentLevel = 1;
		this.gameOver = false;
		this.lives = this.maxLives;

		// Clear existing level
		this.level.clearLevel();

		// Start new level
		this.startLevel(this.currentLevel);

		// Update UI
		this.ui.hideGameOver();
		this.ui.updateLives(this.lives);
	}

	addAnimation(animationCallback) {
		this.animations.push(animationCallback);
	}

	update() {
		if (this.paused || this.gameOver) return;

		const delta = this.clock.getDelta();

		// Update camera
		this.updateCamera(delta);

		// Update level
		this.level.update(delta);

		// Check for level completion
		if (this.level.isLevelComplete()) {
			this.nextLevel();
		}

		// Check for game over
		if (this.level.isGameOver()) {
			this.endGame();
		}

		// Update UI
		this.ui.updateCubesLeft(this.level.getRemainingCubes());
	}

	updateAnimations(delta) {
		// Run all animations, and remove completed ones
		for (let i = this.animations.length - 1; i >= 0; i--) {
			const isComplete = this.animations[i](delta);
			if (isComplete) {
				this.animations.splice(i, 1);
			}
		}
	}

	updateCamera(delta) {
		if (!this.paused && !this.gameOver) {
			// Update camera angle
			this.cameraMovement.angle += delta * this.cameraMovement.speed;

			// Calculate new camera position
			const newX =
				Math.sin(this.cameraMovement.angle) * this.cameraMovement.radius;
			const newZ =
				Math.cos(this.cameraMovement.angle) * this.cameraMovement.radius - 8;

			// Smoothly update camera position
			this.camera.position.x += (newX - this.camera.position.x) * 0.05;
			this.camera.position.z += (newZ - this.camera.position.z) * 0.05;

			// Keep camera looking at the center of action
			this.camera.lookAt(this.cameraMovement.targetLookAt);
		}
	}

	animate() {
		if (this.gameOver) return;

		requestAnimationFrame(() => this.animate());

		// Handle paused state
		if (this.paused) return;

		// Calculate delta time
		const delta = this.clock.getDelta();

		// Update level
		this.level.update(delta);

		// Update animations
		this.updateAnimations(delta);

		// Check if level is complete
		if (this.level.isLevelComplete()) {
			this.startLevel(this.currentLevel + 1);
		}

		// Check if game is over
		if (this.level.isGameOver()) {
			this.loseLife();
		}

		// Update camera position for fluid movement
		this.updateCamera(delta);

		// Render scene
		if (this.composer && typeof THREE.EffectComposer !== 'undefined') {
			this.composer.render();
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}

	completeLevel() {
		// Level completed!
		this.ui.updateMessage('Level ' + this.currentLevel + ' complete!', 2000);

		// Extend the platform as a reward
		this.level.extendPlatform();

		// Bonus points for completing the level
		const bonus = this.currentLevel * 500;
		this.score += bonus;
		this.ui.updateScore(this.score);

		// Show bonus message
		this.ui.updateMessage('Bonus: ' + bonus + ' points!', 2000);

		// Short delay before starting next level
		setTimeout(() => {
			this.currentLevel++;
			this.startLevel(this.currentLevel);
		}, 2000);
	}

	setupPostProcessing() {
		try {
			console.log('Setting up post-processing effects...');
			// Basic implementation that doesn't require additional libraries
			// We can expand this later if needed

			// Create a simple post-processing effect using CSS filters for the whole page
			this.renderer.domElement.style.filter = 'brightness(1.1) contrast(1.05)';

			console.log('Post-processing setup complete');
		} catch (error) {
			console.warn(
				'Post-processing setup failed, continuing without effects:',
				error
			);
			// Don't throw - this is non-critical, we can continue without post-processing
		}
	}
}
