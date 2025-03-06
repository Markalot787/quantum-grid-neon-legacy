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
	}

	init() {
		// Create scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		// Create camera
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.camera.position.set(0, 8, -6);
		this.camera.lookAt(0, 0, 8);

		// Create renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		document.body.appendChild(this.renderer.domElement);

		// Add lights
		const ambientLight = new THREE.AmbientLight(0x404040, 1);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = true;
		this.scene.add(directionalLight);

		// Initialize components
		this.player = new Player(this);
		this.level = new Level(this);
		this.ui = new UI(this);

		// Create platform
		this.level.createPlatform();

		// Start first level
		this.startLevel(this.currentLevel);

		// Add event listeners
		window.addEventListener('resize', () => this.onWindowResize());
		document.addEventListener('keydown', (e) => this.handleKeyDown(e));

		// Initialize payment modal
		this.paymentModal = new PaymentModal(this);

		// Start game
		this.gameStarted = true;
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
		this.level.shrinkPlatform();

		// Remove cube
		this.level.removeCube(cube);

		// Create capture effect (red color)
		this.createCaptureEffect(cube.mesh.position, 0xff0000);
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

		// Create 3x3 area effect
		const center = this.activatedAdvantage.position;
		const areaSize = 1;

		// Get all cubes in the 3x3 area
		const capturedCubes = [];

		for (let x = center.x - areaSize; x <= center.x + areaSize; x++) {
			for (let z = center.y - areaSize; z <= center.y + areaSize; z++) {
				const cubes = this.level.getCubesAtPosition(x, z);
				capturedCubes.push(...cubes);
			}
		}

		// Process each cube in the advantage area
		capturedCubes.forEach((cube) => {
			if (cube.type === 'normal') {
				this.score += 100;
				this.level.removeCube(cube);
			} else if (cube.type === 'advantage') {
				this.score += 50;
				this.level.removeCube(cube);
			}
			// Don't capture forbidden cubes with advantage
		});

		// Create advantage effect
		this.createAdvantageEffect(
			new THREE.Vector3(center.x, 0.1, center.y),
			areaSize
		);

		// Update score
		this.ui.updateScore(this.score);

		// Reset advantage
		this.activatedAdvantage = null;
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
		// Create effect
		const geometry = new THREE.BoxGeometry(size * 2 + 1, 0.5, size * 2 + 1);
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.5,
		});

		const effect = new THREE.Mesh(geometry, material);
		effect.position.copy(position);
		this.scene.add(effect);

		// Animation for the effect
		const startScale = 1;
		const endScale = 1.5;
		const duration = 1.0;
		let elapsed = 0;

		const animate = () => {
			elapsed += 0.016;
			const progress = elapsed / duration;

			if (progress < 1) {
				const scale = startScale + (endScale - startScale) * progress;
				effect.scale.set(scale, scale, scale);
				effect.material.opacity = 0.5 * (1 - progress);

				requestAnimationFrame(animate);
			} else {
				this.scene.remove(effect);
			}
		};

		animate();
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
		this.ui.showGameOver(this.score);
	}

	restart() {
		this.score = 0;
		this.currentLevel = 1;
		this.gameOver = false;

		// Clear existing level
		this.level.clearLevel();

		// Start new level
		this.startLevel(this.currentLevel);

		// Hide game over screen
		this.ui.hideGameOver();
	}

	update() {
		if (this.paused || this.gameOver) return;

		const delta = this.clock.getDelta();

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

	animate() {
		requestAnimationFrame(() => this.animate());

		// Update game state
		this.update();

		// Render scene
		this.renderer.render(this.scene, this.camera);
	}
}
