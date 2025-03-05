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
		console.log('DEBUG - Creating platform');

		// Get dimensions from game settings
		const width = this.game.settings.stageWidth;
		const length = this.game.settings.stageLength;

		console.log('DEBUG - Platform dimensions:', { width, length });

		// Create platform geometry
		const geometry = new THREE.BoxGeometry(width, 0.5, length);

		// Create platform material with improved visibility
		const material = new THREE.MeshStandardMaterial({
			color: 0x444444,
			emissive: 0x111111,
			emissiveIntensity: 0.5,
			metalness: 0.7,
			roughness: 0.3,
			map: this.createGridTexture(width, length),
		});

		console.log('DEBUG - Platform material settings:', {
			color: material.color.getHexString(),
			emissive: material.emissive.getHexString(),
			emissiveIntensity: material.emissiveIntensity,
		});

		// Create platform mesh
		this.platform = new THREE.Mesh(geometry, material);
		this.platform.position.set(0, -0.25, length / 2 - 0.5);
		this.platform.receiveShadow = true;

		// Add platform to scene
		this.game.scene.add(this.platform);

		console.log(
			'DEBUG - Platform created at position:',
			this.platform.position
		);

		// Create platform tiles for collision detection
		this.createPlatformTiles(width, length);

		// Add grid lines for better visibility
		this.addGridLines(width, length);
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
		// Check if platform exists at given position
		return this.platformTiles.some(
			(tile) => tile.x === x && tile.z === z && tile.exists
		);
	}

	removePlatformRows(startZ, count) {
		console.log('DEBUG - Removing platform rows:', { startZ, count });

		// Find tiles in the specified rows
		for (let i = 0; i < this.platformTiles.length; i++) {
			const tile = this.platformTiles[i];
			if (tile.z >= startZ && tile.z < startZ + count) {
				tile.exists = false;

				// Create visual effect for removed tile
				this.createTileRemovalEffect(tile.x, tile.z);
			}
		}

		// Check if player is on a removed tile
		const playerPos = this.game.player.getPosition();
		if (!this.isPlatformAt(playerPos.x, playerPos.z)) {
			// Player falls off
			this.game.endGame();
		}
	}

	createTileRemovalEffect(x, z) {
		// Create particles for tile removal effect
		const particleCount = 10;
		const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		const particleMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			emissive: 0xff0000,
			emissiveIntensity: 1.0,
		});

		for (let i = 0; i < particleCount; i++) {
			const particle = new THREE.Mesh(particleGeometry, particleMaterial);

			// Set initial position at tile center
			particle.position.set(x, 0.1, z);

			// Set random velocity
			const velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.1,
				Math.random() * 0.1,
				(Math.random() - 0.5) * 0.1
			);

			// Add to scene
			this.game.scene.add(particle);

			// Animate particle
			const duration = 0.5 + Math.random() * 0.5; // 0.5 to 1 second
			const startTime = this.game.clock.getElapsedTime();

			const updateParticle = () => {
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
				requestAnimationFrame(updateParticle);
			};

			// Start animation
			updateParticle();
		}
	}

	createInitialCubes() {
		console.log('DEBUG - Creating initial cubes');

		// Create initial cubes
		const count = this.game.settings.initialCubeCount;

		for (let i = 0; i < count; i++) {
			this.spawnCube();
		}
	}

	spawnCube() {
		// Get stage width
		const stageWidth = this.game.settings.stageWidth;
		const stageLength = this.game.settings.stageLength;

		// Calculate random position
		const halfWidth = Math.floor(stageWidth / 2);
		const x = Math.floor(Math.random() * (stageWidth + 1)) - halfWidth;
		const z = stageLength - 1; // Start at the far end of the platform

		// Determine cube type
		let type = 'normal';
		const rand = Math.random();

		if (rand < 0.1) {
			type = 'forbidden'; // 10% chance for forbidden cube
		} else if (rand < 0.2) {
			type = 'advantage'; // 10% chance for advantage cube
		}

		// Create cube
		const cube = new Cube(this.game, type, x, z);
		this.cubes.push(cube);

		console.log('DEBUG - Spawned cube:', { type, position: { x, z } });

		return cube;
	}

	update(delta) {
		// Update cube spawn timer
		this.cubeSpawnTimer += delta;

		// Spawn new cube if timer exceeds interval
		if (this.cubeSpawnTimer >= this.cubeSpawnInterval) {
			this.spawnCube();
			this.cubeSpawnTimer = 0;
		}

		// Update cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];

			// Update cube
			cube.update(delta);

			// Remove destroyed cubes
			if (cube.destroyed) {
				this.cubes.splice(i, 1);
			}
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
}
