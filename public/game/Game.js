import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { PaymentModal } from './PaymentModal.js';

export class Game {
	constructor(container) {
		this.container = container || document.body;
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
		this.paused = false;
		this.markedTile = null;
		this.activatedAdvantage = false;
		this.hasAdvantage = false;

		// Camera animation properties
		this.cameraAnimation = {
			active: false,
			time: 0,
			amplitude: 3,
			frequency: 0.5,
			basePosition: null,
			lookAtPosition: null,
		};

		// Game settings
		this.settings = {
			stageWidth: 7,
			stageLength: 7,
			cubeSpeed: 1.0,
			initialCubeCount: 5,
			usePostProcessing: true,
		};

		this.init();
	}

	init() {
		console.log('DEBUG - Game init started');

		this.setupRenderer();

		// Camera setup - position for clear view of the platform
		console.log('DEBUG - Setting up camera');

		// Set camera to fixed position similar to the original IQ game
		// Position camera behind and above the player for a clear view of the platform
		this.camera.position.set(0, 8, -10);
		this.camera.lookAt(0, 0, 3);

		// Store original camera position and target for resetting
		this.cameraAnimation.basePosition = new THREE.Vector3(0, 8, -10);
		this.cameraAnimation.lookAtPosition = new THREE.Vector3(0, 0, 3);

		console.log('Camera position set to:', this.camera.position);
		console.log('Camera lookAt target:', { x: 0, y: 0, z: 3 });

		// Setup scene components
		this.setupLights();
		this.setupSkybox();

		// Initialize game components
		console.log('DEBUG - Initializing game components');
		this.ui = new UI(this);
		this.level = new Level(this);
		this.player = new Player(this);

		console.log('DEBUG - Game components initialized:', {
			ui: !!this.ui,
			level: !!this.level,
			player: !!this.player,
		});

		// Setup post-processing effects
		if (this.settings.usePostProcessing) {
			this.setupPostProcessing();
		}

		// Add event listeners
		window.addEventListener('resize', this.onWindowResize.bind(this));
		document.addEventListener('keydown', this.handleKeyDown.bind(this));

		// Start animation loop
		this.animate();

		// Show start screen initially
		this.ui.showStartScreen();

		console.log('DEBUG - Game init completed');
	}

	setupRenderer() {
		console.log('DEBUG - Setting up renderer');

		// Create WebGL renderer with anti-aliasing
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance',
		});

		// Set pixel ratio for better quality on high-DPI displays
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// Set renderer size to match container
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// Enable shadows for better visual quality
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		// Set clear color (background)
		this.renderer.setClearColor(0x000033); // Dark blue background

		// Append renderer to container
		this.container.appendChild(this.renderer.domElement);

		console.log('DEBUG - Renderer setup complete with dimensions:', {
			width: this.renderer.domElement.width,
			height: this.renderer.domElement.height,
			pixelRatio: this.renderer.getPixelRatio(),
			shadows: this.renderer.shadowMap.enabled,
		});
	}

	setupSkybox() {
		// Create a procedural skybox with a gradient and stars
		const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

		// Create materials for each face with a gradient from dark blue to black
		const materialArray = [];

		// Create a canvas for the texture
		const createGradientTexture = () => {
			const canvas = document.createElement('canvas');
			canvas.width = 512;
			canvas.height = 512;
			const context = canvas.getContext('2d');

			// Create gradient
			const gradient = context.createLinearGradient(0, 0, 0, 512);
			gradient.addColorStop(0, '#000000');
			gradient.addColorStop(1, '#0a0a2a');

			// Fill with gradient
			context.fillStyle = gradient;
			context.fillRect(0, 0, 512, 512);

			// Add stars
			for (let i = 0; i < 100; i++) {
				const x = Math.random() * 512;
				const y = Math.random() * 512;
				const radius = Math.random() * 1.5;
				const opacity = Math.random() * 0.8 + 0.2;

				context.beginPath();
				context.arc(x, y, radius, 0, Math.PI * 2);
				context.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				context.fill();
			}

			return canvas;
		};

		// Create textures for each face
		for (let i = 0; i < 6; i++) {
			const texture = new THREE.CanvasTexture(createGradientTexture());
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;

			const material = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.BackSide,
			});

			materialArray.push(material);
		}

		// Create skybox mesh
		const skybox = new THREE.Mesh(skyboxGeometry, materialArray);
		this.scene.add(skybox);
	}

	setupPostProcessing() {
		// Import required modules
		import(
			'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/EffectComposer.js'
		).then((module) => {
			const { EffectComposer } = module;
			import(
				'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/RenderPass.js'
			).then((module) => {
				const { RenderPass } = module;
				import(
					'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/postprocessing/UnrealBloomPass.js'
				).then((module) => {
					const { UnrealBloomPass } = module;

					// Create composer
					this.composer = new EffectComposer(this.renderer);

					// Add render pass
					const renderPass = new RenderPass(this.scene, this.camera);
					this.composer.addPass(renderPass);

					// Add bloom pass
					const bloomParams = {
						exposure: 1,
						bloomStrength: 1.5,
						bloomThreshold: 0.2,
						bloomRadius: 0.5,
					};

					const bloomPass = new UnrealBloomPass(
						new THREE.Vector2(window.innerWidth, window.innerHeight),
						bloomParams.bloomStrength,
						bloomParams.bloomRadius,
						bloomParams.bloomThreshold
					);
					this.composer.addPass(bloomPass);
					this.bloomPass = bloomPass;
				});
			});
		});
	}

	setupLights() {
		console.log('DEBUG - Setting up lights');

		// Clear any existing lights
		this.scene.children.forEach((child) => {
			if (child.isLight) {
				this.scene.remove(child);
			}
		});

		// Add ambient light for overall scene brightness
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		// Add directional light for shadows and highlights
		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = true;

		// Configure shadow properties for better quality
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.near = 0.5;
		directionalLight.shadow.camera.far = 50;
		directionalLight.shadow.camera.left = -10;
		directionalLight.shadow.camera.right = 10;
		directionalLight.shadow.camera.top = 10;
		directionalLight.shadow.camera.bottom = -10;

		this.scene.add(directionalLight);

		// Add a secondary directional light from the opposite side
		const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.3);
		secondaryLight.position.set(-5, 5, -5);
		this.scene.add(secondaryLight);

		console.log('DEBUG - Lights setup complete');
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// Update composer size if available
		if (this.composer) {
			this.composer.setSize(window.innerWidth, window.innerHeight);
		}
	}

	handleKeyDown(event) {
		// Skip if game is not started or is paused
		if (!this.gameStarted || this.gameOver || this.paused) return;

		// Convert key to lowercase for consistency
		const key = event.key.toLowerCase();

		// Handle different keys
		switch (key) {
			case ' ':
				// Space bar - mark tile or capture
				this.markTile();
				break;
			case 'arrowleft':
			case 'a':
				// Reversed: Left key now moves right
				this.player.move('right');
				break;
			case 'arrowright':
			case 'd':
				// Reversed: Right key now moves left
				this.player.move('left');
				break;
			case 'arrowup':
			case 'w':
				this.player.move('up');
				break;
			case 'arrowdown':
			case 's':
				this.player.move('down');
				break;
			case 'r':
				// Activate advantage cube power
				this.activateAdvantage();
				break;
			case 'c':
				// Toggle camera animation
				this.toggleCameraAnimation();
				break;
			case 'p':
				// Toggle pause
				this.togglePause();
				break;
		}
	}

	markTile() {
		console.log('DEBUG - markTile called');

		if (!this.gameStarted || this.gameOver || this.paused) {
			console.log('DEBUG - Cannot mark tile: game not in active state');
			return;
		}

		const playerPos = this.player.getPosition();
		const x = Math.round(playerPos.x);
		const z = Math.round(playerPos.z);

		console.log(`DEBUG - Attempting to mark tile at (${x}, ${z})`);

		// Check if there's a platform tile at this position
		if (!this.level.isPlatformAt(x, z)) {
			console.log('DEBUG - No platform at this position');
			return;
		}

		// Find the tile in the platform tiles array
		const tile = this.level.platformTiles.find(
			(t) => t.x === x && t.z === z && t.exists
		);

		if (!tile) {
			console.log('DEBUG - Tile not found');
			return;
		}

		// Mark the tile
		tile.marked = true;

		// Create visual effect for marked tile
		const position = new THREE.Vector3(x, 0.1, z);
		this.createMarkedTileEffect(position);

		console.log(`DEBUG - Tile marked at (${x}, ${z})`);
	}

	createMarkedTileEffect(position) {
		// Create a glowing square to indicate marked tile
		const geometry = new THREE.PlaneGeometry(0.9, 0.9);
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0.7,
			side: THREE.DoubleSide,
		});

		const marker = new THREE.Mesh(geometry, material);
		marker.position.copy(position);
		marker.position.y += 0.15; // Slightly above platform
		marker.rotation.x = -Math.PI / 2; // Lay flat

		this.scene.add(marker);

		// Animate the marker
		const startTime = this.clock.getElapsedTime();
		const duration = 2.0; // Duration in seconds

		const animateMarkedTile = () => {
			const elapsed = this.clock.getElapsedTime() - startTime;
			const progress = elapsed / duration;

			if (progress >= 1) {
				this.scene.remove(marker);
				marker.geometry.dispose();
				marker.material.dispose();
				return;
			}

			// Pulse effect
			const scale = 1 + 0.2 * Math.sin(progress * Math.PI * 4);
			marker.scale.set(scale, scale, scale);

			// Fade out near the end
			if (progress > 0.7) {
				marker.material.opacity = 0.7 * (1 - (progress - 0.7) / 0.3);
			}

			requestAnimationFrame(animateMarkedTile);
		};

		animateMarkedTile();
	}

	captureCube() {
		console.log('DEBUG - captureCube called');

		if (!this.gameStarted || this.gameOver || this.paused) {
			console.log('DEBUG - Cannot capture cube: game not in active state');
			return;
		}

		const playerPos = this.player.getPosition();
		const x = Math.round(playerPos.x);
		const z = Math.round(playerPos.z);

		console.log(`DEBUG - Attempting to capture cube at (${x}, ${z})`);

		// Check if there's a marked tile at this position
		const tile = this.level.platformTiles.find(
			(t) => t.x === x && t.z === z && t.exists && t.marked
		);

		if (!tile) {
			console.log('DEBUG - No marked tile at this position');
			return;
		}

		// Find cubes at this position
		const cubesAtPosition = this.level.getCubesAtPosition(x, z);

		if (cubesAtPosition.length === 0) {
			console.log('DEBUG - No cubes at this position');
			return;
		}

		console.log(`DEBUG - Found ${cubesAtPosition.length} cubes to capture`);

		// Capture each cube
		cubesAtPosition.forEach((cube) => {
			switch (cube.type) {
				case 'normal':
					this.captureNormalCube(cube);
					break;
				case 'forbidden':
					this.captureForbiddenCube(cube);
					break;
				case 'advantage':
					this.captureAdvantageCube(cube);
					break;
			}
		});

		// Unmark the tile
		tile.marked = false;
	}

	captureNormalCube(cube) {
		console.log('DEBUG - Capturing normal cube');

		// Add score
		this.score += 100;
		this.ui.updateScore(this.score);

		// Remove cube
		cube.destroy();

		// Create capture effect
		this.createCaptureEffect(cube.mesh.position);

		// Update cubes left count
		this.ui.updateCubesLeft(this.level.getRemainingCubes());

		// Check if level is complete
		if (this.level.isLevelComplete()) {
			this.completeLevel();
		}
	}

	captureForbiddenCube(cube) {
		console.log('DEBUG - Capturing forbidden cube - penalty!');

		// Penalty for capturing forbidden cube - lose a row of platform
		this.level.removePlatformRows(0, 1);

		// Visual effect
		this.createCaptureEffect(cube.mesh.position, 0xff0000);

		// Remove cube
		cube.destroy();

		// Update cubes left count
		this.ui.updateCubesLeft(this.level.getRemainingCubes());
	}

	captureAdvantageCube(cube) {
		console.log('DEBUG - Capturing advantage cube - special ability!');

		// Add score
		this.score += 300;
		this.ui.updateScore(this.score);

		// Store advantage for later activation
		this.hasAdvantage = true;

		// Visual effect
		this.createCaptureEffect(cube.mesh.position, 0x00ff00);

		// Remove cube
		cube.destroy();

		// Update cubes left count
		this.ui.updateCubesLeft(this.level.getRemainingCubes());

		// Show message about advantage
		this.ui.updateMarkedTileStatus(
			'Advantage cube captured! Press R to activate'
		);
	}

	activateAdvantage() {
		if (!this.hasAdvantage) {
			console.log('DEBUG - No advantage available to activate');
			return;
		}

		console.log('DEBUG - Activating advantage');

		// Get player position
		const playerPos = this.player.getPosition();

		// Destroy all cubes in a radius around the player
		this.level.destroyCubesInRadius(playerPos, 3);

		// Create special effect
		const effectGeometry = new THREE.RingGeometry(0.5, 3, 32);
		const effectMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.7,
			side: THREE.DoubleSide,
		});

		const effect = new THREE.Mesh(effectGeometry, effectMaterial);
		effect.position.set(playerPos.x, 0.1, playerPos.z);
		effect.rotation.x = Math.PI / 2; // Lay flat
		this.scene.add(effect);

		// Animate and remove
		const startTime = this.clock.getElapsedTime();
		const duration = 1.0;

		const animateEffect = () => {
			const elapsed = this.clock.getElapsedTime() - startTime;
			const progress = elapsed / duration;

			if (progress >= 1) {
				this.scene.remove(effect);
				effect.geometry.dispose();
				effect.material.dispose();
				return;
			}

			effect.scale.set(1 + progress, 1 + progress, 1);
			effect.material.opacity = 0.7 * (1 - progress);

			requestAnimationFrame(animateEffect);
		};

		animateEffect();

		// Reset advantage
		this.hasAdvantage = false;

		// Update UI
		this.ui.updateCubesLeft(this.level.getRemainingCubes());
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

	startGame() {
		console.log('DEBUG - startGame called');

		if (this.gameStarted) {
			console.log('DEBUG - Game already started, ignoring startGame call');
			return;
		}

		console.log('DEBUG - Starting game');
		this.gameStarted = true;
		this.gameOver = false;
		this.score = 0;
		this.playCount++;

		// Hide start screen and show game UI
		console.log('DEBUG - Hiding start screen');
		this.ui.hideStartScreen();
		console.log('DEBUG - Showing game UI');
		this.ui.showGameUI();

		// Reset player position
		console.log('DEBUG - Resetting player position');
		this.player.resetPosition();

		// Start first level
		console.log('DEBUG - Starting level 1');
		this.startLevel(1);

		console.log('DEBUG - Game started successfully');
	}

	startLevel(levelNumber) {
		console.log(`DEBUG - Starting level ${levelNumber}`);

		this.settings.currentLevel = levelNumber;

		// Clear any existing level
		if (this.level) {
			this.level.clearCubes();
		}

		// Update UI
		this.ui.updateLevel(levelNumber);
		this.ui.updateScore(this.score);

		// Create initial cubes for this level
		this.level.createInitialCubes();

		console.log(`DEBUG - Level ${levelNumber} started`);
	}

	restart() {
		console.log('DEBUG - Restarting game');

		// Hide game over screen if it's visible
		if (this.ui) {
			this.ui.hideGameOverScreen();
		}

		// Clear scene except for essential elements
		if (this.level) {
			this.level.clearLevel();
		}

		// Reset game state
		this.gameStarted = true;
		this.gameOver = false;
		this.score = 0;
		this.currentLevel = 1;
		this.paused = false;
		this.markedTile = null;
		this.activatedAdvantage = false;
		this.hasAdvantage = false;

		// Update UI
		if (this.ui) {
			this.ui.updateScore(this.score);
			this.ui.updateLevel(this.currentLevel);
			this.ui.updateLives(3);
		}

		// Reset player position
		if (this.player) {
			this.player.resetPosition();
		}

		// Start the game from level 1
		this.startLevel(this.currentLevel);

		console.log('DEBUG - Game restarted successfully');
	}

	endGame() {
		this.lives--;
		this.ui.updateLives(this.lives);

		if (this.lives <= 0) {
			this.gameOver = true;
			this.gameStarted = false;

			// First show game over screen
			this.ui.showGameOverScreen(this.score);

			// Then show payment modal if play count is high enough
			if (this.playCount >= 3 && !this.paid) {
				setTimeout(() => {
					this.ui.showPaymentModal();
				}, 1500);
			}
		} else {
			// Player still has lives left, reset position and continue
			this.player.resetPosition();
		}
	}

	cancelPayment() {
		this.ui.hidePaymentModal();
	}

	handlePayment() {
		// Create a checkout session
		fetch('/create-checkout-session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				price: 'price_your_price_id',
			}),
		})
			.then((response) => response.json())
			.then((session) => {
				return this.stripe.redirectToCheckout({ sessionId: session.id });
			})
			.then((result) => {
				if (result.error) {
					console.error(result.error.message);
				}
			})
			.catch((error) => {
				console.error('Error:', error);
			});
	}

	update(delta) {
		// Skip updates if game not started or is over
		if (!this.gameStarted || this.gameOver) return;

		// Update level (platform, cubes, etc)
		if (this.level) {
			this.level.update(delta);
		}

		// Update player
		if (this.player) {
			this.player.update(delta);
		}

		// Update UI
		if (this.ui) {
			this.ui.update();
		}

		// Check for level completion
		if (this.level && this.level.isLevelComplete()) {
			console.log('DEBUG - Level complete!');
			this.nextLevel();
		}

		// Check for game over condition
		if (this.level && this.level.isGameOver()) {
			console.log('DEBUG - Game over!');
			this.endGame();
		}
	}

	updateCameraPosition(delta) {
		if (!this.cameraAnimation.active) {
			// If animation is not active, use default position
			if (this.cameraAnimation.basePosition) {
				this.camera.position.copy(this.cameraAnimation.basePosition);
				this.camera.lookAt(this.cameraAnimation.lookAtPosition);
			}
			return;
		}

		// Update time counter for animation
		this.cameraAnimation.time += delta;

		// Calculate new camera position using sine wave for smooth side-to-side movement
		const offset =
			Math.sin(this.cameraAnimation.time * this.cameraAnimation.frequency) *
			this.cameraAnimation.amplitude;

		// Apply offset to base position
		const newPosition = this.cameraAnimation.basePosition.clone();
		newPosition.x += offset;

		// Update camera position
		this.camera.position.copy(newPosition);

		// Also offset lookAt point slightly for more natural movement
		const lookAtPoint = this.cameraAnimation.lookAtPosition.clone();
		lookAtPoint.x += offset * 0.3; // Reduced offset for lookAt point

		// Update camera target
		this.camera.lookAt(lookAtPoint);
	}

	toggleCameraAnimation() {
		// Toggle camera animation state
		this.cameraAnimation.active = !this.cameraAnimation.active;

		console.log(
			'DEBUG - Camera animation toggled:',
			this.cameraAnimation.active
		);

		// Reset camera position when disabling animation
		if (!this.cameraAnimation.active && this.cameraAnimation.basePosition) {
			this.camera.position.copy(this.cameraAnimation.basePosition);
			this.camera.lookAt(this.cameraAnimation.lookAtPosition);
		}
	}

	togglePause() {
		this.paused = !this.paused;
		if (this.paused) {
			this.ui.showPauseScreen();
		} else {
			this.ui.hidePauseScreen();
		}
	}

	animate() {
		// Use requestAnimationFrame for smooth animation
		requestAnimationFrame(this.animate.bind(this));

		// Skip if game is paused
		if (this.paused) {
			console.log('DEBUG - Game is paused, skipping update');
			return;
		}

		// Get time since last frame for consistent animations regardless of frame rate
		const delta = this.clock.getDelta();

		// Validate delta - safeguard against extremely large values (tab inactive, etc)
		if (delta > 0.1) {
			console.warn('Large delta detected:', delta);
			return; // Skip this frame
		}

		// Always update camera for visual interest even if game hasn't started
		this.updateCameraPosition(delta);

		// Update game state only if game has started and isn't over
		if (this.gameStarted && !this.gameOver) {
			this.update(delta);
		}

		// Render scene
		if (this.composer) {
			// Render with post-processing effects
			this.composer.render();
		} else {
			// Standard rendering
			this.renderer.render(this.scene, this.camera);
		}
	}

	completeLevel() {
		console.log('DEBUG - Level completed!');

		// Show level complete message
		this.ui.updateMarkedTileStatus('Level Complete!');

		// Add level completion bonus
		const levelBonus = this.currentLevel * 500;
		this.score += levelBonus;
		this.ui.updateScore(this.score);

		// Create level complete effect
		this.createLevelCompleteEffect();

		// Pause briefly before starting next level
		setTimeout(() => {
			// Increment level
			this.currentLevel++;

			// Start next level
			this.startLevel(this.currentLevel);

			// Update UI
			this.ui.updateLevel(this.currentLevel);
			this.ui.updateMarkedTileStatus('Starting Level ' + this.currentLevel);
		}, 2000);
	}

	createLevelCompleteEffect() {
		// Create a flashy effect for level completion
		const effectGeometry = new THREE.PlaneGeometry(
			this.settings.stageWidth + 2,
			this.settings.stageLength + 2
		);
		const effectMaterial = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			transparent: true,
			opacity: 0.3,
			side: THREE.DoubleSide,
		});

		const effect = new THREE.Mesh(effectGeometry, effectMaterial);
		effect.position.set(0, 0.1, this.settings.stageLength / 2);
		effect.rotation.x = Math.PI / 2; // Lay flat
		this.scene.add(effect);

		// Animate and remove
		const startTime = this.clock.getElapsedTime();
		const duration = 2.0;

		const animateEffect = () => {
			const elapsed = this.clock.getElapsedTime() - startTime;
			const progress = elapsed / duration;

			if (progress >= 1) {
				this.scene.remove(effect);
				effect.geometry.dispose();
				effect.material.dispose();
				return;
			}

			// Pulse effect
			const pulse = 0.3 + 0.5 * Math.sin(progress * Math.PI * 10);
			effect.material.opacity = pulse;

			requestAnimationFrame(animateEffect);
		};

		animateEffect();
	}
}
