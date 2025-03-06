import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Cube } from './Cube.js';
import { createGridTexture } from '../assets/textures/grid_texture.js';

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
		this.gridTexture = null;
		this.destructionEffects = [];

		// Level state
		this.levelComplete = false;
		this.gameOver = false;
	}

	createPlatform() {
		const width = this.game.settings.stageWidth;
		const length = this.game.settings.stageLength;

		// Store dimensions
		this.platformWidth = width;
		this.platformLength = length;

		// Create grid texture (IQ style)
		const gridCanvas = createGridTexture('#333333', '#555555', 512);
		this.gridTexture = new THREE.CanvasTexture(gridCanvas);
		this.gridTexture.wrapS = THREE.RepeatWrapping;
		this.gridTexture.wrapT = THREE.RepeatWrapping;
		this.gridTexture.repeat.set(width, length);

		// Create individual platform tiles for better appearance
		const tileGroup = new THREE.Group();

		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			for (let z = 0; z < length; z++) {
				// Create tile geometry and material
				const tileGeometry = new THREE.BoxGeometry(0.95, 0.2, 0.95);
				const tileMaterial = new THREE.MeshStandardMaterial({
					map: this.gridTexture,
					roughness: 0.7,
					metalness: 0.2,
					color: (x + z) % 2 === 0 ? 0x444444 : 0x555555, // Checkerboard pattern
				});

				// Create tile mesh
				const tileMesh = new THREE.Mesh(tileGeometry, tileMaterial);
				tileMesh.position.set(x, -0.1, z);
				tileMesh.receiveShadow = true;
				tileMesh.userData = { x, z, exists: true };

				// Add to group
				tileGroup.add(tileMesh);

				// Track platform tiles
				this.platform.push({ x, z, exists: true, mesh: tileMesh });
			}
		}

		// Create edge material for a more defined look
		const edgeMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.8,
			metalness: 0.3,
		});

		// Add bottom platform for cohesiveness
		const platformBase = new THREE.Mesh(
			new THREE.BoxGeometry(width + 0.1, 0.1, length + 0.1),
			edgeMaterial
		);
		platformBase.position.set(0, -0.2, length / 2 - 0.5);
		platformBase.receiveShadow = true;

		// Add to scene
		this.platformMesh = tileGroup;
		this.game.scene.add(tileGroup);
		this.game.scene.add(platformBase);

		// Add subtle ambient light to better see the platform
		const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
		this.game.scene.add(ambientLight);

		// Add a background plane with glowing grid lines
		const gridTextureSize = 2048;
		const gridTextureCanvas = document.createElement('canvas');
		gridTextureCanvas.width = gridTextureSize;
		gridTextureCanvas.height = gridTextureSize;
		const ctx = gridTextureCanvas.getContext('2d');

		// Fill background
		ctx.fillStyle = 'rgba(0, 0, 20, 1)';
		ctx.fillRect(0, 0, gridTextureSize, gridTextureSize);

		// Draw grid lines
		const gridCount = 32;
		const gridSize = gridTextureSize / gridCount;
		ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
		ctx.lineWidth = 2;

		// Vertical lines
		for (let i = 0; i <= gridCount; i++) {
			const x = i * gridSize;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, gridTextureSize);
			ctx.stroke();
		}

		// Horizontal lines
		for (let i = 0; i <= gridCount; i++) {
			const y = i * gridSize;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(gridTextureSize, y);
			ctx.stroke();
		}

		// Create a larger second grid with different color for parallax effect
		const gridCount2 = 16;
		const gridSize2 = gridTextureSize / gridCount2;
		ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
		ctx.lineWidth = 3;

		// Vertical lines
		for (let i = 0; i <= gridCount2; i++) {
			const x = i * gridSize2;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, gridTextureSize);
			ctx.stroke();
		}

		// Horizontal lines
		for (let i = 0; i <= gridCount2; i++) {
			const y = i * gridSize2;
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(gridTextureSize, y);
			ctx.stroke();
		}

		// Create texture from canvas
		const gridTexture = new THREE.CanvasTexture(gridTextureCanvas);
		gridTexture.wrapS = THREE.RepeatWrapping;
		gridTexture.wrapT = THREE.RepeatWrapping;
		gridTexture.repeat.set(4, 4);

		// Create background plane
		const bgPlaneGeometry = new THREE.PlaneGeometry(200, 200);
		const bgPlaneMaterial = new THREE.MeshBasicMaterial({
			map: gridTexture,
			side: THREE.DoubleSide,
			transparent: true,
			depthWrite: false,
		});

		const bgPlane = new THREE.Mesh(bgPlaneGeometry, bgPlaneMaterial);
		bgPlane.position.set(0, -50, 0);
		bgPlane.rotation.x = Math.PI / 2;
		this.game.scene.add(bgPlane);
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
					this.createDestructionEffect(cube.mesh.position);
				}

				// Remove cube
				this.removeCube(cube);
			}
		}

		// Update destruction effects
		for (let i = this.destructionEffects.length - 1; i >= 0; i--) {
			const effect = this.destructionEffects[i];
			const completed = effect.update(delta);

			if (completed) {
				this.destructionEffects.splice(i, 1);
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
		// Remove from scene
		if (cube.mesh) {
			this.game.scene.remove(cube.mesh);
		}

		// Remove from array
		const index = this.cubes.indexOf(cube);
		if (index !== -1) {
			this.cubes.splice(index, 1);
		}
	}

	createDestructionEffect(position) {
		// Create a flash effect at the position
		const geometry = new THREE.SphereGeometry(0.5, 8, 8);
		const material = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 1,
		});

		const flash = new THREE.Mesh(geometry, material);
		flash.position.copy(position);
		this.game.scene.add(flash);

		// Animation
		let time = 0;
		const duration = 0.5;

		const updateFlash = (delta) => {
			time += delta;
			const progress = time / duration;

			if (progress < 1) {
				const scale = 1 + progress;
				flash.scale.set(scale, scale, scale);
				flash.material.opacity = 1 - progress;
				return false;
			} else {
				this.game.scene.remove(flash);
				return true;
			}
		};

		// Add to destruction effects
		this.destructionEffects.push({
			update: updateFlash,
		});
	}

	clearLevel() {
		// Remove all cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];
			if (cube.mesh) {
				this.game.scene.remove(cube.mesh);
			}
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

		// Update platform data and visuals
		for (let i = this.platform.length - 1; i >= 0; i--) {
			const tile = this.platform[i];
			if (tile.z === row) {
				tile.exists = false;

				// Visual effect for tile destruction
				if (tile.mesh) {
					const tileMesh = tile.mesh;

					// Add falling animation
					const startY = tileMesh.position.y;
					const animation = {
						mesh: tileMesh,
						time: 0,
						duration: 1.0,
						update: (delta) => {
							animation.time += delta;
							const progress = Math.min(
								animation.time / animation.duration,
								1.0
							);

							// Fall and fade
							tileMesh.position.y = startY - 10 * Math.pow(progress, 2);
							tileMesh.rotation.x += delta * 5;
							tileMesh.rotation.z += delta * 3;

							if (tileMesh.material.opacity) {
								tileMesh.material.transparent = true;
								tileMesh.material.opacity = 1 - progress;
							}

							// Remove when animation complete
							if (progress >= 1.0) {
								this.platformMesh.remove(tileMesh);
								return true; // Animation complete
							}
							return false;
						},
					};

					this.destructionEffects.push(animation);
				}
			}
		}

		// Check if player is affected
		const playerPos = this.game.player.getPosition();
		if (Math.round(playerPos.z) === row) {
			this.gameOver = true;
		}
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
			if (!cube.mesh) return false;

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
