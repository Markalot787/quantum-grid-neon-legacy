import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Cube } from './Cube.js';

export class Level {
	constructor(game) {
		this.game = game;
		this.platform = null;
		this.cubes = [];
		this.cubeSpawnTimer = 0;
		this.cubeSpawnInterval = 2; // seconds
		this.platformTiles = []; // Track platform tiles for collision detection

		// Wave management
		this.waveIndex = 0;
		this.wavesRemaining = 0;
		this.isGeneratingWave = false;

		console.log('DEBUG - Level constructor called with settings:', {
			stageWidth: this.game.settings.stageWidth,
			stageLength: this.game.settings.stageLength,
		});

		this.init();
	}

	init() {
		console.log('DEBUG - Level init called');
		this.createPlatform();
		this.createInitialCubes();
	}

	createPlatform() {
		console.log('DEBUG - Level createPlatform called');

		const width = this.game.settings.stageWidth;
		const length = this.game.settings.stageLength;

		console.log('Creating platform with dimensions:', { width, length });

		// Create a group to hold all platform tiles
		this.platform = new THREE.Group();
		this.game.scene.add(this.platform);

		// Create individual platform tiles
		this.platformTiles = [];

		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			for (let z = 0; z < length; z++) {
				// Create a cube for each tile
				const geometry = new THREE.BoxGeometry(1, 0.2, 1);
				const material = new THREE.MeshStandardMaterial({
					color: 0x444444,
					metalness: 0.3,
					roughness: 0.7,
				});

				const tile = new THREE.Mesh(geometry, material);
				tile.position.set(x, -0.1, z); // Position slightly below y=0
				tile.receiveShadow = true;

				// Add to platform group
				this.platform.add(tile);

				// Store reference to tile
				this.platformTiles.push({
					x: x,
					z: z,
					mesh: tile,
					exists: true,
					marked: false,
				});
			}
		}

		// Add grid lines for better visibility
		this.addGridLines(width, length);

		console.log(
			'DEBUG - Platform created with',
			this.platformTiles.length,
			'tiles'
		);
	}

	createGridTexture(width, length) {
		// Create canvas for grid texture
		const canvas = document.createElement('canvas');
		canvas.width = 512;
		canvas.height = 512;
		const ctx = canvas.getContext('2d');

		// Fill background with light color
		ctx.fillStyle = '#444444';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grid lines
		ctx.strokeStyle = '#888888';
		ctx.lineWidth = 2;

		// Calculate grid cell size
		const cellWidth = canvas.width / width;
		const cellHeight = canvas.height / length;

		// Draw vertical lines
		for (let i = 0; i <= width; i++) {
			const x = i * cellWidth;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}

		// Draw horizontal lines
		for (let i = 0; i <= length; i++) {
			const y = i * cellHeight;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}

		// Create texture from canvas
		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 1);

		return texture;
	}

	addGridLines(width, length) {
		// Create grid helper for better visibility
		const gridHelper = new THREE.GridHelper(
			Math.max(width, length),
			Math.max(width, length),
			0x888888,
			0x666666
		);
		gridHelper.position.set(0, 0.01, length / 2 - 0.5);
		this.game.scene.add(gridHelper);

		console.log('DEBUG - Grid helper added at position:', gridHelper.position);
	}

	createPlatformTiles(width, length) {
		// Clear existing tiles
		this.platformTiles = [];

		// Calculate half width for centering
		const halfWidth = Math.floor(width / 2);

		// Create platform tiles
		for (let x = -halfWidth; x <= halfWidth; x++) {
			for (let z = 0; z < length; z++) {
				this.platformTiles.push({ x, z, exists: true });
			}
		}

		console.log('DEBUG - Created platform tiles:', this.platformTiles.length);
	}

	isPlatformAt(x, z) {
		// Check if there's a platform tile at the given coordinates
		return this.platformTiles.some(
			(tile) => tile.x === x && tile.z === z && tile.exists
		);
	}

	removePlatformRows(startZ, rowCount) {
		// Implement forbidden cube effect to remove platform rows
		console.log('DEBUG - Removing platform rows:', { startZ, rowCount });

		// Find the platform tiles to remove
		const tilesToRemove = [];
		const width = this.game.settings.stageWidth;

		// Calculate the starting row (round to nearest integer)
		const startRow = Math.round(startZ);

		// Identify tiles to remove
		this.platformTiles.forEach((tile) => {
			// Check if tile is in the affected rows
			if (
				tile.position.z >= startRow &&
				tile.position.z < startRow + rowCount
			) {
				tilesToRemove.push(tile);
			}
		});

		// Create visual effect for removal
		tilesToRemove.forEach((tile) => {
			// Create exploding effect
			this.createTileRemovalEffect(tile.position);

			// Remove from scene
			this.platform.remove(tile);

			// Remove from platformTiles array
			const index = this.platformTiles.indexOf(tile);
			if (index !== -1) {
				this.platformTiles.splice(index, 1);
			}
		});

		// Update the UI to show platform status
		if (this.game.ui) {
			this.game.ui.updatePlatformStatus(this.platformTiles.length);
		}

		// Create visual warning
		this.createLifeLossEffect();
	}

	createTileRemovalEffect(position) {
		// Create particles for platform tile removal
		const particleCount = 10;
		const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		const particleMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			emissive: 0xff0000,
			emissiveIntensity: 1.0,
		});

		// Create and animate particles
		for (let i = 0; i < particleCount; i++) {
			const particle = new THREE.Mesh(particleGeometry, particleMaterial);

			// Set initial position at tile position
			particle.position.copy(position);

			// Add to scene
			this.game.scene.add(particle);

			// Set random velocity
			const velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.2,
				Math.random() * 0.2,
				(Math.random() - 0.5) * 0.2
			);

			// Animate particle
			const duration = 0.5 + Math.random() * 0.5;
			const startTime = this.game.clock.getElapsedTime();

			const animateParticle = () => {
				const elapsed = this.game.clock.getElapsedTime() - startTime;
				const progress = elapsed / duration;

				if (progress >= 1) {
					// Remove particle
					this.game.scene.remove(particle);
					particle.geometry.dispose();
					particle.material.dispose();
					return;
				}

				// Update position
				particle.position.x += velocity.x;
				particle.position.y += velocity.y;
				particle.position.z += velocity.z;

				// Apply gravity
				velocity.y -= 0.01;

				// Fade out
				particle.material.opacity = 1 - progress;

				// Continue animation
				requestAnimationFrame(animateParticle);
			};

			// Start animation
			animateParticle();
		}
	}

	createLifeLossEffect() {
		// Flash the screen red to indicate life loss
		const overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
		overlay.style.zIndex = '1000';
		overlay.style.pointerEvents = 'none'; // Don't block interaction

		document.body.appendChild(overlay);

		// Fade out and remove
		setTimeout(() => {
			overlay.style.transition = 'opacity 0.5s';
			overlay.style.opacity = '0';
			setTimeout(() => {
				document.body.removeChild(overlay);
			}, 500);
		}, 100);
	}

	createInitialCubes() {
		console.log('DEBUG - Level createInitialCubes called');

		// Clear any existing cubes
		this.clearCubes();

		// Set up wave system
		this.waveIndex = 0;
		this.wavesRemaining = this.game.settings.currentLevel + 2; // More waves for higher levels

		console.log(
			`DEBUG - Setting up ${this.wavesRemaining} waves for level ${this.game.settings.currentLevel}`
		);

		// Generate first wave
		this.generateWave();
	}

	generateWave() {
		console.log('DEBUG - Level generateWave called');

		if (this.wavesRemaining <= 0 || this.isGeneratingWave) {
			console.log(
				'DEBUG - Cannot generate wave: no waves remaining or already generating'
			);
			return;
		}

		this.isGeneratingWave = true;
		this.waveIndex++;
		this.wavesRemaining--;

		console.log(
			`DEBUG - Generating wave ${this.waveIndex}, ${this.wavesRemaining} remaining`
		);

		const width = this.game.settings.stageWidth;
		const count = Math.min(
			width,
			this.game.settings.initialCubeCount + Math.floor(this.waveIndex / 2)
		);

		// Calculate number of each cube type (70% normal, 20% forbidden, 10% advantage)
		const normalCount = Math.max(1, Math.floor(count * 0.7));
		const forbiddenCount = Math.max(1, Math.floor(count * 0.2));
		const advantageCount = Math.floor(count * 0.1);

		console.log('DEBUG - Cube counts for wave:', {
			normal: normalCount,
			forbidden: forbiddenCount,
			advantage: advantageCount,
			total: normalCount + forbiddenCount + advantageCount,
		});

		// Generate positions across platform width
		const halfWidth = Math.floor(width / 2);
		const positions = [];
		for (let x = -halfWidth; x <= halfWidth; x++) positions.push(x);

		// Shuffle positions for random placement
		for (let i = positions.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[positions[i], positions[j]] = [positions[j], positions[i]];
		}

		// Start cubes beyond the platform
		const startZ = this.game.settings.stageLength + 2;
		let createdCount = 0;

		// Create cubes in a row
		for (let i = 0; i < normalCount && createdCount < positions.length; i++) {
			const cube = new Cube(
				this.game,
				'normal',
				positions[createdCount],
				startZ
			);
			this.cubes.push(cube);
			createdCount++;
		}

		for (
			let i = 0;
			i < forbiddenCount && createdCount < positions.length;
			i++
		) {
			const cube = new Cube(
				this.game,
				'forbidden',
				positions[createdCount],
				startZ
			);
			this.cubes.push(cube);
			createdCount++;
		}

		for (
			let i = 0;
			i < advantageCount && createdCount < positions.length;
			i++
		) {
			const cube = new Cube(
				this.game,
				'advantage',
				positions[createdCount],
				startZ
			);
			this.cubes.push(cube);
			createdCount++;
		}

		console.log(
			`DEBUG - Wave ${this.waveIndex} created with ${this.cubes.length} cubes`
		);
		this.isGeneratingWave = false;
	}

	clearCubes() {
		// Remove all cubes
		while (this.cubes.length > 0) {
			this.removeCube(this.cubes[0]);
		}
	}

	update(delta) {
		// Update all cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			this.cubes[i].update(delta);
		}

		// Generate new wave if no cubes remain and we have waves left
		if (
			this.cubes.length === 0 &&
			this.wavesRemaining > 0 &&
			!this.isGeneratingWave
		) {
			console.log('DEBUG - No cubes remaining, generating new wave');
			this.generateWave();
		}
	}

	destroyCubesInRadius(position, radius) {
		console.log('DEBUG - Destroying cubes in radius:', { position, radius });

		// Find cubes within radius
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];

			// Calculate distance
			const dx = cube.position.x - position.x;
			const dz = cube.position.z - position.z;
			const distance = Math.sqrt(dx * dx + dz * dz);

			// Destroy cube if within radius
			if (distance <= radius) {
				cube.destroy();

				// Remove from array
				this.cubes.splice(i, 1);

				// Add score
				this.game.score += 50;
			}
		}

		// Update score display
		this.game.ui.updateScore(this.game.score);
	}

	getRemainingCubes() {
		return this.cubes.length;
	}

	getCubesAtPosition(x, z) {
		// Find cubes at the specified position with some tolerance
		const tolerance = 0.5; // Allow for slight positioning differences

		return this.cubes.filter((cube) => {
			const dx = Math.abs(cube.position.x - x);
			const dz = Math.abs(cube.position.z - z);
			return dx <= tolerance && dz <= tolerance;
		});
	}

	removeCube(cube) {
		// Find the cube in the array
		const index = this.cubes.findIndex((c) => c === cube);

		// If found, remove it
		if (index !== -1) {
			// Call destroy method if it exists
			if (typeof cube.destroy === 'function') {
				cube.destroy();
			} else {
				// Otherwise just remove from scene
				if (cube.mesh) {
					this.game.scene.remove(cube.mesh);
				}
			}

			// Remove from array
			this.cubes.splice(index, 1);

			console.log(
				'DEBUG - Cube removed from level. Remaining:',
				this.cubes.length
			);

			// Update UI
			if (this.game.ui) {
				this.game.ui.updateCubesLeft(this.getRemainingCubes());
			}
		}
	}

	isLevelComplete() {
		// Check if there are no remaining cubes
		return this.getRemainingCubes() === 0;
	}

	isGameOver() {
		console.log('DEBUG - Level.isGameOver called');
		// For now, always return false - game is never over unless explicitly ended
		return false;
	}
}
