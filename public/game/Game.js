// Import all Three.js modules through the central import file
import {
	THREE,
	EffectComposer,
	RenderPass,
	UnrealBloomPass,
	ShaderPass,
	CopyShader,
} from '../threeImports.js';

import { Player } from './Player.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { PaymentModal } from './PaymentModal.js';

// Import effects
import {
	createCaptureParticles,
	updateParticles,
	triggerParticles,
	createAdvantageAreaParticles,
	updateAdvantageAreaParticles,
	triggerAdvantageAreaParticles,
} from '../assets/effects/particles.js';
import { createDigitalSkybox } from '../assets/skybox/skybox.js';
import { createGridTexture } from '../assets/textures/grid.js';

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

		// Post-processing
		this.composer = null;
		this.bloomPass = null;

		// Effects
		this.captureParticles = null;
		this.advantageAreaParticles = null;
		this.envMap = null;

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

		// Loading
		this.loadingManager = new THREE.LoadingManager();
		this.setupLoadingManager();

		// Animation queue
		this.animations = [];

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
		// Create scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000011);

		// Set up fog for atmosphere
		this.scene.fog = new THREE.FogExp2(0x000011, 0.035);

		// Create camera with better angle
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			100
		);
		this.camera.position.set(0, 8, -6); // Higher and further back for better view
		this.camera.lookAt(0, 0, 8);

		// Create renderer with better settings
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			powerPreference: 'high-performance',
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.0;
		document.body.appendChild(this.renderer.domElement);

		// Set up post-processing
		this.setupPostProcessing();

		// Create skybox
		this.setupSkybox();

		// Add lights
		this.setupLights();

		// Create environment map for reflections
		this.setupEnvironmentMap();

		// Create particle systems
		this.setupParticleSystems();

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

		// Update composer size for post-processing
		if (this.composer) {
			this.composer.setSize(window.innerWidth, window.innerHeight);
		}
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
		const material = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0.5,
			emissive: 0x00ffff,
			emissiveIntensity: 0.8,
		});

		const markedTileMesh = new THREE.Mesh(geometry, material);
		markedTileMesh.position.set(x, 0.05, z);
		this.scene.add(markedTileMesh);

		this.markedTile = {
			position: new THREE.Vector2(x, z),
			mesh: markedTileMesh,
		};

		this.ui.updateMarkedTileStatus(
			'Tile marked at ' + Math.round(x) + ', ' + Math.round(z)
		);

		// Add pulsing animation for the marked tile
		this.addMarkedTileAnimation(markedTileMesh);
	}

	addMarkedTileAnimation(mesh) {
		// Pulse animation data
		const animationData = {
			baseScale: 1.0,
			pulseFactor: 0.05,
			elapsedTime: 0,
		};

		// Store the animation in mesh userData
		mesh.userData.animation = animationData;
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

		// Trigger particle effect at cube position
		triggerParticles(this.captureParticles, cube.mesh.position, 0x00ffff);

		// Remove cube
		this.level.removeCube(cube);

		// Create capture effect
		this.createCaptureEffect(cube.mesh.position);
	}

	captureForbiddenCube(cube) {
		// Penalty for capturing forbidden cube
		this.level.shrinkPlatform();

		// Trigger particle effect at cube position
		triggerParticles(this.captureParticles, cube.mesh.position, 0xff0000);

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

		// Trigger particle effect at cube position
		triggerParticles(this.captureParticles, cube.mesh.position, 0x00ff88);

		// Remove cube
		this.level.removeCube(cube);

		// Create capture effect (green color)
		this.createCaptureEffect(cube.mesh.position, 0x00ff88);
	}

	activateAdvantage() {
		if (!this.activatedAdvantage) return;

		// Create 3x3 area effect
		const center = this.activatedAdvantage.position;
		const areaSize = 1;

		// Trigger area particles
		triggerAdvantageAreaParticles(
			this.advantageAreaParticles,
			new THREE.Vector3(center.x, 0.1, center.y)
		);

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

				// Trigger particle effect at cube position
				triggerParticles(this.captureParticles, cube.mesh.position, 0x00ffff);

				this.level.removeCube(cube);
			} else if (cube.type === 'advantage') {
				this.score += 50;

				// Trigger particle effect at cube position
				triggerParticles(this.captureParticles, cube.mesh.position, 0x00ff88);

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

	createCaptureEffect(position, color = 0x00ffff) {
		// Create effect
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshStandardMaterial({
			color: color,
			transparent: true,
			opacity: 0.7,
			emissive: color,
			emissiveIntensity: 1.0,
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
		const material = new THREE.MeshStandardMaterial({
			color: 0x00ff88,
			transparent: true,
			opacity: 0.5,
			emissive: 0x00ff88,
			emissiveIntensity: 1.0,
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

		// Update player
		if (this.player) {
			this.player.update(delta);
		}

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

		// Update marked tile animation
		this.updateMarkedTileAnimation(delta);

		// Update particle effects
		updateParticles(this.captureParticles, delta);
		updateAdvantageAreaParticles(this.advantageAreaParticles, delta);

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
		requestAnimationFrame(() => this.animate());

		// Update game state
		this.update();

		// Render scene with post-processing
		if (this.composer) {
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

	setupLoadingManager() {
		// Show loading progress
		const loadingScreen = document.getElementById('loading-screen');
		const loadingBar = document.getElementById('loading-bar');
		const loadingText = document.getElementById('loading-text');

		this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
			const progress = (itemsLoaded / itemsTotal) * 100;
			loadingBar.style.width = progress + '%';
			loadingText.textContent = `Loading ${Math.floor(progress)}%`;
		};

		this.loadingManager.onLoad = () => {
			// Hide loading screen with fade out animation
			loadingScreen.style.opacity = 0;
			loadingScreen.style.transition = 'opacity 1s';

			// Remove loading screen after fade out
			setTimeout(() => {
				loadingScreen.style.display = 'none';

				// Show tutorial if it's first time
				if (this.showTutorial) {
					document.getElementById('tutorial').style.display = 'block';

					// Add event listener for tutorial button
					document
						.getElementById('tutorial-button')
						.addEventListener('click', () => {
							document.getElementById('tutorial').style.display = 'none';
							this.showTutorial = false;
						});
				}
			}, 1000);

			// Start game
			this.gameStarted = true;
		};
	}

	setupPostProcessing() {
		// Create composer
		this.composer = new EffectComposer(this.renderer);

		// Add render pass
		const renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderPass);

		// Add bloom pass for glow effects
		this.bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			0.5, // Bloom strength
			0.4, // Bloom radius
			0.85 // Bloom threshold
		);
		this.composer.addPass(this.bloomPass);

		// Add final shader pass
		const copyPass = new ShaderPass(CopyShader);
		copyPass.renderToScreen = true;
		this.composer.addPass(copyPass);
	}

	setupSkybox() {
		// Create skybox texture using our utility
		const skyboxTextures = createDigitalSkybox(
			this.renderer,
			0x000022,
			0x003366,
			0x0088aa
		);

		// Create skybox
		const skyboxSize = 80;
		const skyboxGeometry = new THREE.BoxGeometry(
			skyboxSize,
			skyboxSize,
			skyboxSize
		);

		// Create materials for each face
		const skyboxMaterials = skyboxTextures.map(
			(texture) =>
				new THREE.MeshBasicMaterial({
					map: texture,
					side: THREE.BackSide,
				})
		);

		const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
		this.scene.add(skybox);
	}

	setupEnvironmentMap() {
		// Create a cube texture for environment mapping
		// Use a simple environment cube for reflections
		const path = '';
		const format = '.jpg';
		const urls = [
			path + 'px' + format,
			path + 'nx' + format,
			path + 'py' + format,
			path + 'ny' + format,
			path + 'pz' + format,
			path + 'nz' + format,
		];

		// Use the skybox textures as a placeholder
		// In a full implementation, we'd load proper HDR environment maps
		this.envMap = new THREE.CubeTextureLoader().load(
			urls,
			(map) => {
				// Handle load here
			},
			() => {
				// Use generated textures as fallback
				// This is a simplified approach, in a real game we'd use proper envmaps
				this.envMap = null;
			}
		);
	}

	setupParticleSystems() {
		// Create particle systems for effects
		this.captureParticles = createCaptureParticles(0x00ffff, 100);
		this.scene.add(this.captureParticles);

		// Create advantage area particles
		this.advantageAreaParticles = createAdvantageAreaParticles(0x00ff88, 3);
		this.scene.add(this.advantageAreaParticles);
	}

	setupLights() {
		// Main ambient light
		const ambientLight = new THREE.AmbientLight(0x222244, 0.5);
		this.scene.add(ambientLight);

		// Main directional light (key light)
		const directionalLight = new THREE.DirectionalLight(0xeeeeff, 0.8);
		directionalLight.position.set(10, 20, 10);
		directionalLight.castShadow = true;

		// Better shadow settings
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.near = 1;
		directionalLight.shadow.camera.far = 50;
		directionalLight.shadow.camera.left = -15;
		directionalLight.shadow.camera.right = 15;
		directionalLight.shadow.camera.top = 15;
		directionalLight.shadow.camera.bottom = -15;
		directionalLight.shadow.bias = -0.0005;

		this.scene.add(directionalLight);

		// Add rim light from back
		const rimLight = new THREE.DirectionalLight(0x0088ff, 0.5);
		rimLight.position.set(-5, 5, -10);
		this.scene.add(rimLight);

		// Add floor spotlight for dramatic effect
		const spotlight = new THREE.SpotLight(0x00ffff, 0.3);
		spotlight.position.set(0, 10, 0);
		spotlight.angle = Math.PI / 4;
		spotlight.penumbra = 0.5;
		spotlight.decay = 2;
		spotlight.distance = 30;
		spotlight.castShadow = true;
		spotlight.shadow.mapSize.width = 1024;
		spotlight.shadow.mapSize.height = 1024;

		this.scene.add(spotlight);
	}

	updateMarkedTileAnimation(delta) {
		if (!this.markedTile || !this.markedTile.mesh) return;

		const mesh = this.markedTile.mesh;
		const anim = mesh.userData.animation;

		if (!anim) return;

		// Update elapsed time
		anim.elapsedTime += delta;

		// Calculate pulse effect
		const pulse = Math.sin(anim.elapsedTime * 5) * anim.pulseFactor;

		// Apply scale
		const scale = anim.baseScale + pulse;
		mesh.scale.set(scale, 1, scale);

		// Rotate slowly
		mesh.rotation.y += delta * 0.5;
	}
}
