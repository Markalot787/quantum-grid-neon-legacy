import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Cube } from './Cube.js';

export class Level {
	constructor(game) {
		this.game = game;
		this.platform = [];
		this.cubes = [];
		this.waveIndex = 0;
		this.waveTime = 0;
		this.wavesRemaining = 0;

		// Platform properties
		this.platformMesh = null;
		this.platformWidth = 0;
		this.platformLength = 0;

		// Level state
		this.levelComplete = false;
		this.gameOver = false;
	}

	createPlatform() {
		try {
			console.log('Creating platform...');

			// Create a texture loader
			const textureLoader = new THREE.TextureLoader();

			// Load grid texture with error handling
			const gridTexture = textureLoader.load(
				'assets/textures/grid_texture.png',
				// Success callback
				() => console.log('Grid texture loaded successfully'),
				// Progress callback
				undefined,
				// Error callback
				(err) => console.warn('Failed to load grid texture:', err)
			);

			// Set texture properties
			if (gridTexture) {
				gridTexture.wrapS = THREE.RepeatWrapping;
				gridTexture.wrapT = THREE.RepeatWrapping;
				gridTexture.repeat.set(
					this.game.settings.stageWidth,
					this.game.settings.stageLength
				);
			}

			// Create platform geometry
			const geometry = new THREE.BoxGeometry(
				this.game.settings.stageWidth,
				0.5,
				this.game.settings.stageLength
			);

			// Create cyberpunk-style material with neon grid
			const material = new THREE.MeshStandardMaterial({
				color: 0x0a0a2a, // Dark blue base
				map: gridTexture,
				roughness: 0.3,
				metalness: 0.7,
				emissive: 0x00aaff, // Cyan glow
				emissiveIntensity: 0.2,
				emissiveMap: gridTexture,
			});

			// Create platform mesh
			this.platform = new THREE.Mesh(geometry, material);
			this.platform.position.set(
				this.game.settings.stageWidth / 2 - 0.5,
				-0.25,
				this.game.settings.stageLength / 2 - 0.5
			);
			this.platform.receiveShadow = true;
			this.game.scene.add(this.platform);

			// Add glowing edges to the platform
			this.addPlatformEdges();

			console.log('Platform created successfully');
		} catch (error) {
			console.error('Error creating platform:', error);
		}
	}

	// New method to add glowing edges to the platform
	addPlatformEdges() {
		try {
			const width = this.game.settings.stageWidth;
			const length = this.game.settings.stageLength;

			// Create edge geometry
			const edgeGeometry = new THREE.BoxGeometry(0.1, 0.1, length);
			const edgeMaterial = new THREE.MeshStandardMaterial({
				color: 0x00ffff, // Cyan color
				emissive: 0x00ffff,
				emissiveIntensity: 1,
				roughness: 0.3,
				metalness: 0.8,
			});

			// Left edge
			const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
			leftEdge.position.set(0, 0, length / 2 - 0.5);
			this.game.scene.add(leftEdge);

			// Right edge
			const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
			rightEdge.position.set(width - 1, 0, length / 2 - 0.5);
			this.game.scene.add(rightEdge);

			// Front edge (rotated)
			const frontEdgeGeometry = new THREE.BoxGeometry(0.1, 0.1, width);
			const frontEdge = new THREE.Mesh(frontEdgeGeometry, edgeMaterial);
			frontEdge.position.set(width / 2 - 0.5, 0, 0);
			frontEdge.rotation.y = Math.PI / 2;
			this.game.scene.add(frontEdge);

			// Back edge (rotated)
			const backEdge = new THREE.Mesh(frontEdgeGeometry, edgeMaterial);
			backEdge.position.set(width / 2 - 0.5, 0, length - 1);
			backEdge.rotation.y = Math.PI / 2;
			this.game.scene.add(backEdge);

			// Store edges for later reference
			this.platformEdges = [leftEdge, rightEdge, frontEdge, backEdge];

			console.log('Platform edges added');
		} catch (error) {
			console.error('Error adding platform edges:', error);
		}
	}

	generateLevel(levelNumber) {
		// Clear previous level
		this.clearLevel();

		// Calculate wave count based on level
		this.wavesRemaining = 2 + Math.min(levelNumber, 8);

		// Generate first wave
		this.generateWave();
	}

	generateWave() {
		if (this.wavesRemaining <= 0) {
			this.levelComplete = true;
			return;
		}

		this.wavesRemaining--;
		this.waveIndex++;

		// Wave properties based on level
		const cubeCount = this.game.settings.initialCubeCount;
		const width = this.game.settings.stageWidth;
		const level = this.game.currentLevel;

		// Calculate cube distribution
		let normalCount = Math.floor(cubeCount * 0.7); // 70% normal
		let forbiddenCount = Math.floor(cubeCount * 0.2); // 20% forbidden
		let advantageCount = Math.floor(cubeCount * 0.1); // 10% advantage

		// Ensure at least one of each type (for higher levels)
		if (level >= 2 && forbiddenCount === 0) forbiddenCount = 1;
		if (level >= 3 && advantageCount === 0) advantageCount = 1;

		// Create cubes
		const startZ = this.platformLength + 2; // Start beyond platform
		const halfWidth = Math.floor(width / 2);

		// Precalculate positions without duplicates
		const positions = [];
		for (let x = -halfWidth; x <= halfWidth; x++) {
			for (let z = startZ; z < startZ + 3; z++) {
				positions.push({ x, z });
			}
		}

		// Shuffle positions
		for (let i = positions.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[positions[i], positions[j]] = [positions[j], positions[i]];
		}

		// Place normal cubes
		for (let i = 0; i < normalCount && i < positions.length; i++) {
			const { x, z } = positions[i];
			this.createCube('normal', x, z);
		}

		// Place forbidden cubes
		for (
			let i = normalCount;
			i < normalCount + forbiddenCount && i < positions.length;
			i++
		) {
			const { x, z } = positions[i];
			this.createCube('forbidden', x, z);
		}

		// Place advantage cubes
		for (
			let i = normalCount + forbiddenCount;
			i < normalCount + forbiddenCount + advantageCount && i < positions.length;
			i++
		) {
			const { x, z } = positions[i];
			this.createCube('advantage', x, z);
		}
	}

	createCube(type, x, z) {
		const cube = new Cube(this.game, type, x, z);
		this.cubes.push(cube);
	}

	update(delta) {
		// Update cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];

			// Update cube
			cube.update(delta);

			// Check if cube fell off
			if (cube.mesh.position.z < -2) {
				// Handle cube falling off
				if (cube.type === 'normal') {
					// Player missed a normal cube
					// Potential penalty here
				}

				// Remove cube
				this.removeCube(cube);
			}
		}

		// Update wave timer
		this.waveTime += delta;

		// Generate new wave if needed
		if (this.cubes.length === 0 && this.wavesRemaining > 0) {
			this.generateWave();
		}
	}

	removeCube(cube) {
		// Remove cube from game arrays
		this.cubes = this.cubes.filter((c) => c !== cube);

		// Add destruction effect
		this.createDestructionEffect(cube.mesh.position.clone());

		// Remove from scene
		this.game.scene.remove(cube.mesh);
	}

	createDestructionEffect(position) {
		// Create a white flash effect
		const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
		const flashMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 1,
		});

		const flash = new THREE.Mesh(flashGeometry, flashMaterial);
		flash.position.copy(position);
		this.game.scene.add(flash);

		// Animate the flash effect - grow and fade out
		const startScale = 0.5;
		const endScale = 2;
		const duration = 0.5; // seconds

		let elapsedTime = 0;
		const updateFlash = (delta) => {
			elapsedTime += delta;
			const progress = Math.min(elapsedTime / duration, 1);

			// Scale up
			const scale = startScale + (endScale - startScale) * progress;
			flash.scale.set(scale, scale, scale);

			// Fade out
			flash.material.opacity = 1 - progress;

			if (progress >= 1) {
				// Animation complete, remove the effect
				this.game.scene.remove(flash);
				return true; // signal completion
			}
			return false;
		};

		// Add to animation loop
		this.game.addAnimation(updateFlash);
	}

	clearLevel() {
		// Remove all cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];
			this.game.scene.remove(cube.mesh);
		}

		// Clear arrays
		this.cubes = [];

		// Reset state
		this.waveIndex = 0;
		this.waveTime = 0;
		this.levelComplete = false;
		this.gameOver = false;
	}

	shrinkPlatform() {
		// Shrink platform by removing a row
		const row = Math.max(0, this.platformLength - 1);

		// Remove cubes on that row
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];
			if (Math.round(cube.mesh.position.z) === row) {
				this.removeCube(cube);
			}
		}

		// Update platform data
		for (let i = this.platform.length - 1; i >= 0; i--) {
			const tile = this.platform[i];
			if (tile.z === row) {
				tile.exists = false;
			}
		}

		// Check if player is affected
		const playerPos = this.game.player.getPosition();
		if (Math.round(playerPos.z) === row) {
			this.gameOver = true;
		}

		// Update platform mesh (visual)
		// For simplicity in the MVP, we just change the platform color
		this.platformMesh.material.color.set(0x333333);
	}

	isPlatformAt(x, z) {
		// Check if platform exists at this position
		for (const tile of this.platform) {
			if (tile.x === x && tile.z === z && tile.exists) {
				return true;
			}
		}
		return false;
	}

	getCubesAtPosition(x, z) {
		// Find all cubes at a specific position
		return this.cubes.filter((cube) => {
			// Use approximate position to handle moving cubes
			const cubeX = Math.round(cube.mesh.position.x);
			const cubeZ = Math.round(cube.mesh.position.z);

			return cubeX === Math.round(x) && cubeZ === Math.round(z);
		});
	}

	getRemainingCubes() {
		return this.cubes.filter((cube) => cube.type === 'normal').length;
	}

	isLevelComplete() {
		// Level is complete when all normal cubes are cleared
		// and there are no more waves
		return (
			this.levelComplete ||
			(this.getRemainingCubes() === 0 && this.wavesRemaining === 0)
		);
	}

	isGameOver() {
		return this.gameOver;
	}
}
