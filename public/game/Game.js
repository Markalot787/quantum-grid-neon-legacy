import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { PaymentModal } from './PaymentModal.js';

export class Game {
	constructor(container) {
		this.container = container;
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

		// Camera animation properties
		this.cameraAnimation = {
			active: false,
			time: 0,
			amplitude: 3,
			frequency: 0.5,
		};

		// Game settings
		this.settings = {
			stageWidth: 7,
			stageLength: 15,
			cubeSpeed: 1.0,
			initialCubeCount: 5,
		};

		this.init();
	}

	init() {
		// Create scene
		this.scene = new THREE.Scene();
		console.log('DEBUG - Scene created');

		// Create camera with better angle for platform visibility
		this.camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000
		);

		// Position camera for better view of the game
		this.camera.position.set(0, 10, -10);
		this.camera.lookAt(0, 0, 5);

		console.log('DEBUG - Camera setup:', {
			position: this.camera.position,
			rotation: this.camera.rotation,
			fov: this.camera.fov,
			lookingAt: new THREE.Vector3(0, 0, 5),
		});

		// Create renderer
		this.setupRenderer();
		this.setupSkybox();
		this.setupPostProcessing();
		this.setupLights();

		console.log('DEBUG - Setup complete');

		// Initialize player and level
		this.player = new Player(this);
		this.level = new Level(this);
		this.ui = new UI(this);
		this.paymentModal = new PaymentModal(this);

		console.log('DEBUG - All objects initialized');

		// Setup event listeners
		window.addEventListener('resize', this.onWindowResize.bind(this));
		document.addEventListener('keydown', this.handleKeyDown.bind(this));

		// Initialize Stripe
		if (typeof Stripe !== 'undefined') {
			this.stripe = Stripe('pk_test_your_stripe_key');
		}

		// Show start screen
		this.ui.showStartScreen();

		// Start animation loop
		this.animate();
	}

	setupRenderer() {
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0x000000);
		this.renderer.shadowMap.enabled = true;
		document.body.appendChild(this.renderer.domElement);
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
		// Add much brighter ambient light
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Pure white, full intensity
		this.scene.add(ambientLight);

		// Add stronger directional light from above
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
		directionalLight.position.set(0, 10, 5);
		directionalLight.castShadow = true;

		// Improve shadow quality
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.near = 0.5;
		directionalLight.shadow.camera.far = 50;
		directionalLight.shadow.camera.left = -10;
		directionalLight.shadow.camera.right = 10;
		directionalLight.shadow.camera.top = 10;
		directionalLight.shadow.camera.bottom = -10;

		this.scene.add(directionalLight);

		// Add brighter point lights for enhanced visibility
		const colors = [0x00ffff, 0xff00ff, 0xffff00];
		const positions = [
			[-5, 5, 0],
			[5, 5, 0],
			[0, 5, 5],
		];

		colors.forEach((color, i) => {
			const light = new THREE.PointLight(color, 1.0, 30);
			light.position.set(...positions[i]);
			this.scene.add(light);
		});

		// Add spotlight that follows platform
		const spotlight = new THREE.SpotLight(
			0xffffff,
			1.5,
			30,
			Math.PI / 4,
			0.5,
			2
		);
		spotlight.position.set(0, 15, 0);
		spotlight.target.position.set(0, 0, 0);
		this.scene.add(spotlight);
		this.scene.add(spotlight.target);
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
		if (this.gameOver || this.paused) return;

		switch (event.key.toLowerCase()) {
			case 'arrowleft':
			case 'a':
				this.player.move('left');
				break;
			case 'arrowright':
			case 'd':
				this.player.move('right');
				break;
			case 'arrowup':
			case 'w':
				this.player.move('up');
				break;
			case 'arrowdown':
			case 's':
				this.player.move('down');
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
		console.log(
			'DEBUG - Advantage activated at position:',
			this.activatedAdvantage.position
		);

		// Increase score
		this.score += 100;

		// Update UI
		this.ui.updateScore(this.score);

		// Mark that an advantage was activated
		this.activatedAdvantage = null;

		// Create chain reaction - destroy nearby cubes
		this.level.destroyCubesInRadius(this.activatedAdvantage.position, 2);
	}

	activateForbidden() {
		console.log(
			'DEBUG - Forbidden cube activated at position:',
			this.activatedAdvantage.position
		);

		// Remove 3 rows of platform starting from the cube's position
		this.level.removePlatformRows(this.activatedAdvantage.position.y, 3);
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
		// Reset game state
		this.score = 0;
		this.currentLevel = 1;
		this.gameOver = false;
		this.gameStarted = true;
		this.playCount++;
		this.lives = 3;

		// Update UI
		this.ui.updateScore(this.score);
		this.ui.updateLevel(this.currentLevel);
		this.ui.updateLives(this.lives);

		// Start the game loop
		this.animate();

		// Generate the first level
		this.level.generateLevel(this.currentLevel);
	}

	restartGame() {
		// Check if player has reached play limit
		if (this.playCount >= 3 && !this.paid) {
			this.ui.showPaymentModal();
			return;
		}

		// Reset game state
		this.startGame();
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
		if (this.paused || this.gameOver) return;

		// Update player
		if (this.player) {
			this.player.update(delta);
		}

		// Update level
		if (this.level) {
			this.level.update(delta);
		}

		// Update UI
		if (this.ui) {
			this.ui.update();
		}

		// Update camera position if animation is active
		if (this.cameraAnimation.active) {
			this.updateCameraPosition(delta);
		}

		// Check for level completion
		if (this.level.isLevelComplete()) {
			this.nextLevel();
		}

		// Check for game over
		if (this.level.isGameOver()) {
			this.endGame();
		}

		// Update post-processing effects
		if (this.composer) {
			this.composer.render();
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}

	updateCameraPosition(delta) {
		// Update time counter
		this.cameraAnimation.time += delta;

		// Calculate new camera position using sine wave for smooth movement
		const xPos =
			Math.sin(this.cameraAnimation.time * this.cameraAnimation.frequency) *
			this.cameraAnimation.amplitude;

		// Update camera position
		this.camera.position.x = xPos;

		// Adjust look-at position for more natural movement
		// Camera always looks slightly ahead of the player
		const lookAtZ = 5; // Fixed point ahead on the platform
		this.camera.lookAt(xPos * 0.2, 0, lookAtZ);

		// Log camera position for debugging
		console.log('DEBUG - Camera position:', {
			x: this.camera.position.x.toFixed(2),
			y: this.camera.position.y.toFixed(2),
			z: this.camera.position.z.toFixed(2),
		});
	}

	toggleCameraAnimation() {
		// Toggle camera animation state
		this.cameraAnimation.active = !this.cameraAnimation.active;

		console.log(
			'DEBUG - Camera animation toggled:',
			this.cameraAnimation.active
		);

		// Reset camera position when turning off animation
		if (!this.cameraAnimation.active) {
			// Reset time counter
			this.cameraAnimation.time = 0;

			// Reset camera position
			this.camera.position.set(0, 10, -10);
			this.camera.lookAt(0, 0, 5);

			console.log('DEBUG - Camera position reset');
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
		console.log('DEBUG - Animate frame');
		requestAnimationFrame(this.animate.bind(this));

		// Get delta time
		const delta = this.clock.getDelta();

		// Update game state
		if (!this.paused) {
			this.update(delta);
		}

		console.log('DEBUG - Rendering scene:', {
			cameraPosition: this.camera.position,
			platformVisible: this.level?.platformMesh?.visible,
			playerVisible: this.player?.mesh?.visible,
			sceneChildrenCount: this.scene.children.length,
		});

		// Render scene
		if (this.composer && this.composer.renderer) {
			this.composer.render();
		} else if (this.renderer) {
			this.renderer.render(this.scene, this.camera);
		} else {
			console.error('DEBUG - No renderer available!');
		}
	}
}
