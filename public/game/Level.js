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

		// Create platform group
		const platformGroup = new THREE.Group();

		// Create individual platform tiles for better appearance
		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			for (let z = 0; z < length; z++) {
				// Create tile geometry
				const tileGeometry = new THREE.BoxGeometry(0.95, 0.2, 0.95);

				// Create materials with neon glow for edges
				const isEvenTile = (x + z) % 2 === 0;
				const mainColor = isEvenTile ? 0x222244 : 0x333355; // Dark blue/purple base

				const tileMaterial = new THREE.MeshStandardMaterial({
					color: mainColor,
					roughness: 0.4,
					metalness: 0.6,
					emissive: isEvenTile ? 0x000022 : 0x000033,
					emissiveIntensity: 0.2,
				});

				// Create tile mesh
				const tileMesh = new THREE.Mesh(tileGeometry, tileMaterial);
				tileMesh.position.set(x, -0.1, z);
				tileMesh.receiveShadow = true;
				tileMesh.castShadow = true;

				// Add neon edge glow for some tiles
				if (
					x === -Math.floor(width / 2) ||
					x === Math.floor(width / 2) ||
					z === 0 ||
					z === length - 1 ||
					Math.random() < 0.1
				) {
					// Create edge geometry
					const edgeGeometry = new THREE.EdgesGeometry(tileGeometry);

					// Create edge material with neon glow
					const edgeColor =
						z % 3 === 0 ? 0x00ffff : z % 3 === 1 ? 0xff00ff : 0x00ff88;
					const edgeMaterial = new THREE.LineBasicMaterial({
						color: edgeColor,
						linewidth: 1,
					});

					const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
					tileMesh.add(edges);
				}

				// Add to platform group
				platformGroup.add(tileMesh);

				// Track platform tiles
				this.platform.push({
					x,
					z,
					exists: true,
					mesh: tileMesh,
				});
			}
		}

		// Create base platform with neon trim
		const baseGeometry = new THREE.BoxGeometry(width + 0.2, 0.3, length + 0.2);
		const baseMaterial = new THREE.MeshStandardMaterial({
			color: 0x111122,
			roughness: 0.5,
			metalness: 0.7,
			emissive: 0x000011,
			emissiveIntensity: 0.2,
		});

		const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
		baseMesh.position.set(0, -0.3, length / 2 - 0.5);
		baseMesh.receiveShadow = true;

		// Add neon trim to base
		const trimGeometry = new THREE.BoxGeometry(width + 0.3, 0.05, length + 0.3);
		const trimMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			roughness: 0.2,
			metalness: 0.8,
			emissive: 0x00ffff,
			emissiveIntensity: 0.8,
			transparent: true,
			opacity: 0.8,
		});

		const trimMesh = new THREE.Mesh(trimGeometry, trimMaterial);
		trimMesh.position.set(0, -0.4, length / 2 - 0.5);

		// Add to scene
		this.platformMesh = platformGroup;
		this.game.scene.add(platformGroup);
		this.game.scene.add(baseMesh);
		this.game.scene.add(trimMesh);

		// Create neon grid background
		this.createNeonBackground();

		// Add atmospheric fog
		this.game.scene.fog = new THREE.FogExp2(0x000033, 0.03);

		// Add ambient light for base illumination
		const ambientLight = new THREE.AmbientLight(0x222244, 1.0);
		this.game.scene.add(ambientLight);

		// Add point lights for neon glow
		const colors = [0x00ffff, 0xff00ff, 0x00ff88];

		for (let i = 0; i < 3; i++) {
			const light = new THREE.PointLight(colors[i], 1, 20);
			const x = (Math.random() - 0.5) * width * 2;
			const z = Math.random() * length;
			light.position.set(x, 2 + Math.random() * 3, z);
			this.game.scene.add(light);
		}
	}

	createNeonBackground() {
		// Create a large plane for the background
		const bgGeometry = new THREE.PlaneGeometry(100, 100);

		// Create a canvas for the grid texture
		const canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
		const ctx = canvas.getContext('2d');

		// Fill background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, '#000033');
		gradient.addColorStop(1, '#000011');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grid lines
		const gridSize = 32;
		const cellSize = canvas.width / gridSize;

		// Draw cyan grid lines
		ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
		ctx.lineWidth = 1;

		for (let i = 0; i <= gridSize; i++) {
			// Vertical lines
			ctx.beginPath();
			ctx.moveTo(i * cellSize, 0);
			ctx.lineTo(i * cellSize, canvas.height);
			ctx.stroke();

			// Horizontal lines
			ctx.beginPath();
			ctx.moveTo(0, i * cellSize);
			ctx.lineTo(canvas.width, i * cellSize);
			ctx.stroke();
		}

		// Draw magenta grid lines (larger grid)
		ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
		ctx.lineWidth = 2;

		const largeGridSize = 8;
		const largeCellSize = canvas.width / largeGridSize;

		for (let i = 0; i <= largeGridSize; i++) {
			// Vertical lines
			ctx.beginPath();
			ctx.moveTo(i * largeCellSize, 0);
			ctx.lineTo(i * largeCellSize, canvas.height);
			ctx.stroke();

			// Horizontal lines
			ctx.beginPath();
			ctx.moveTo(0, i * largeCellSize);
			ctx.lineTo(canvas.width, i * largeCellSize);
			ctx.stroke();
		}

		// Add some random "stars" or light points
		for (let i = 0; i < 100; i++) {
			const x = Math.random() * canvas.width;
			const y = Math.random() * canvas.height;
			const radius = Math.random() * 2 + 1;

			const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
			gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
			gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		}

		// Create texture from canvas
		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(2, 2);

		// Create material with the texture
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.8,
		});

		// Create mesh and position it
		const bgMesh = new THREE.Mesh(bgGeometry, material);
		bgMesh.rotation.x = Math.PI / 2;
		bgMesh.position.y = -10;

		this.game.scene.add(bgMesh);

		// Add a second background plane with different grid for parallax effect
		const bgGeometry2 = new THREE.PlaneGeometry(200, 200);

		// Create a canvas for the second grid texture
		const canvas2 = document.createElement('canvas');
		canvas2.width = 1024;
		canvas2.height = 1024;
		const ctx2 = canvas2.getContext('2d');

		// Fill background (transparent)
		ctx2.fillStyle = 'rgba(0, 0, 0, 0)';
		ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

		// Draw larger grid lines
		const gridSize2 = 16;
		const cellSize2 = canvas2.width / gridSize2;

		// Draw green grid lines
		ctx2.strokeStyle = 'rgba(0, 255, 128, 0.15)';
		ctx2.lineWidth = 3;

		for (let i = 0; i <= gridSize2; i++) {
			// Vertical lines
			ctx2.beginPath();
			ctx2.moveTo(i * cellSize2, 0);
			ctx2.lineTo(i * cellSize2, canvas2.height);
			ctx2.stroke();

			// Horizontal lines
			ctx2.beginPath();
			ctx2.moveTo(0, i * cellSize2);
			ctx2.lineTo(canvas2.width, i * cellSize2);
			ctx2.stroke();
		}

		// Create texture from second canvas
		const texture2 = new THREE.CanvasTexture(canvas2);
		texture2.wrapS = THREE.RepeatWrapping;
		texture2.wrapT = THREE.RepeatWrapping;
		texture2.repeat.set(4, 4);

		// Create material with the second texture
		const material2 = new THREE.MeshBasicMaterial({
			map: texture2,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.5,
			depthWrite: false,
		});

		// Create mesh and position it
		const bgMesh2 = new THREE.Mesh(bgGeometry2, material2);
		bgMesh2.rotation.x = Math.PI / 2;
		bgMesh2.position.y = -20;

		this.game.scene.add(bgMesh2);

		// Animate the background grids
		const animate = () => {
			texture.offset.y += 0.0005;
			texture2.offset.y += 0.0002;

			requestAnimationFrame(animate);
		};

		animate();
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

		console.log(
			`Generated wave ${this.waveIndex} with ${normalCount} normal, ${forbiddenCount} forbidden, and ${advantageCount} advantage cubes`
		);
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
			if (cube.mesh && cube.mesh.position.z < -2) {
				// Handle cube falling off
				if (cube.type === 'normal') {
					// Player missed a normal cube
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
			if (cube.mesh && Math.round(cube.mesh.position.z) === row) {
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
