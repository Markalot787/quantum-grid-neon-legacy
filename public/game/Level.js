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
		const width = this.game.settings.stageWidth;
		const length = this.game.settings.stageLength;

		// Create grid texture with much brighter colors
		const gridTexture = this.createGridTexture();

		// Use a MUCH lighter material for better visibility
		const material = new THREE.MeshStandardMaterial({
			color: 0x888888, // Much lighter gray for better visibility
			emissive: 0x333333, // Stronger glow
			emissiveIntensity: 1.0, // Maximum emissive
			metalness: 0.5,
			roughness: 0.3,
			map: gridTexture,
		});

		// Create platform mesh
		this.platformMesh = new THREE.Mesh(
			new THREE.BoxGeometry(width, 1, length),
			material
		);
		this.platformMesh.position.set(0, -0.5, length / 2);
		this.platformMesh.receiveShadow = true;
		this.game.scene.add(this.platformMesh);

		// Add highly visible grid lines
		this.addGridLines(width, length);

		// Store dimensions
		this.platformWidth = width;
		this.platformLength = length;

		// Create platform grid
		this.platform = [];
		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			for (let z = 0; z < length; z++) {
				this.platform.push({ x, z, exists: true });
			}
		}
	}

	createGridTexture() {
		const canvas = document.createElement('canvas');
		canvas.width = 512;
		canvas.height = 512;
		const context = canvas.getContext('2d');

		// Fill background with much lighter color
		context.fillStyle = '#777777';
		context.fillRect(0, 0, 512, 512);

		// Draw grid lines - much brighter and more visible
		context.strokeStyle = '#00ffff'; // Bright cyan for maximum contrast
		context.lineWidth = 3; // Thicker lines

		// Draw vertical lines
		const cellSize = 32;
		for (let i = 0; i <= 512; i += cellSize) {
			context.beginPath();
			context.moveTo(i, 0);
			context.lineTo(i, 512);
			context.globalAlpha = i % (cellSize * 2) === 0 ? 1.0 : 0.8; // Maximum opacity
			context.stroke();
		}

		// Draw horizontal lines
		for (let i = 0; i <= 512; i += cellSize) {
			context.beginPath();
			context.moveTo(0, i);
			context.lineTo(512, i);
			context.globalAlpha = i % (cellSize * 2) === 0 ? 1.0 : 0.8; // Maximum opacity
			context.stroke();
		}

		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(width / 4, length / 4);

		return texture;
	}

	addGridLines(width, length) {
		const material = new THREE.LineBasicMaterial({
			color: 0x00ffff, // Bright cyan for high contrast
			transparent: false, // No transparency for better visibility
			linewidth: 2,
		});

		// Horizontal lines
		for (let z = 0; z <= length; z++) {
			const points = [
				new THREE.Vector3(-width / 2, 0.01, z),
				new THREE.Vector3(width / 2, 0.01, z),
			];
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const line = new THREE.Line(geometry, material);
			this.platformMesh.add(line);
		}

		// Vertical lines
		for (let x = -width / 2; x <= width / 2; x += 1) {
			const points = [
				new THREE.Vector3(x, 0.01, 0),
				new THREE.Vector3(x, 0.01, length),
			];
			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const line = new THREE.Line(geometry, material);
			this.platformMesh.add(line);
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
		// Add explosion effect
		this.createExplosionEffect(
			cube.mesh.position.x,
			cube.mesh.position.y,
			cube.mesh.position.z,
			cube.type
		);

		// Check if this is an advantage cube (green) to trigger chain reaction
		if (cube.type === 'advantage') {
			this.triggerChainReaction(cube);
		}

		// If this is a forbidden cube (black), shrink the platform
		if (cube.type === 'forbidden') {
			this.shrinkPlatform(3); // Remove 3 rows
		}

		// Remove cube from scene
		this.game.scene.remove(cube.mesh);

		// Remove from cubes array
		const index = this.cubes.indexOf(cube);
		if (index > -1) {
			this.cubes.splice(index, 1);
		}
	}

	triggerChainReaction(sourceCube) {
		// Get position of the source cube
		const pos = sourceCube.mesh.position;
		const x = Math.round(pos.x);
		const z = Math.round(pos.z);

		// Find cubes in adjacent positions (including diagonals)
		const affectedCubes = [];

		for (let i = 0; i < this.cubes.length; i++) {
			const cube = this.cubes[i];
			const cubeX = Math.round(cube.mesh.position.x);
			const cubeZ = Math.round(cube.mesh.position.z);

			// Check if the cube is adjacent (including diagonals)
			if (
				Math.abs(cubeX - x) <= 1 &&
				Math.abs(cubeZ - z) <= 1 &&
				cube !== sourceCube
			) {
				affectedCubes.push(cube);
			}
		}

		// Create a larger explosion for the chain reaction
		this.createChainExplosionEffect(x, pos.y, z);

		// Remove affected cubes with a slight delay for visual effect
		if (affectedCubes.length > 0) {
			setTimeout(() => {
				// Copy array to avoid modification issues during iteration
				const cubesToRemove = [...affectedCubes];

				cubesToRemove.forEach((cube) => {
					// Check if cube still exists (might have been removed by another chain)
					if (this.cubes.includes(cube)) {
						this.removeCube(cube);
					}
				});
			}, 150);
		}
	}

	createChainExplosionEffect(x, y, z) {
		// Create a green shockwave effect
		const segments = 32;
		const geometry = new THREE.RingGeometry(0, 2, segments);
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.7,
			side: THREE.DoubleSide,
		});

		const ring = new THREE.Mesh(geometry, material);
		ring.position.set(x, y, z);
		ring.rotation.x = Math.PI / 2; // Rotate to be horizontal
		this.game.scene.add(ring);

		// Create a bright flash light
		const light = new THREE.PointLight(0x00ff00, 3, 8);
		light.position.set(x, y, z);
		this.game.scene.add(light);

		// Animate the shockwave
		let scale = 0;
		const maxScale = 3;
		const animate = () => {
			scale += 0.2;

			// Scale the ring
			ring.scale.set(scale, scale, scale);

			// Fade the ring and light as they expand
			const opacity = 1 - scale / maxScale;
			material.opacity = opacity * 0.7;
			light.intensity = 3 * opacity;

			if (scale < maxScale) {
				requestAnimationFrame(animate);
			} else {
				// Remove ring and light from scene
				this.game.scene.remove(ring);
				this.game.scene.remove(light);
			}
		};

		// Start animation
		animate();
	}

	createExplosionEffect(x, y, z, cubeType) {
		// Create particles for explosion
		const particleCount = 15;
		const particles = new THREE.Group();

		// Different explosion effects based on cube type
		let color = 0xffffff; // Default white for normal cubes
		let scale = 1.0;
		let duration = 1.0;

		if (cubeType === 'advantage') {
			color = 0x00ff00; // Green for advantage cubes
			scale = 1.5;
			duration = 1.5;
		} else if (cubeType === 'forbidden') {
			color = 0xff0000; // Red for forbidden cubes
			scale = 1.2;
			duration = 1.2;
		}

		// Create particle material
		const particleMaterial = new THREE.MeshBasicMaterial({
			color: color,
			transparent: true,
			opacity: 1,
		});

		// Create particles
		for (let i = 0; i < particleCount; i++) {
			const size = (Math.random() * 0.2 + 0.1) * scale;
			const particleGeometry = new THREE.SphereGeometry(size, 6, 6);
			const particle = new THREE.Mesh(
				particleGeometry,
				particleMaterial.clone()
			);

			// Position at center of explosion
			particle.position.set(x, y, z);

			// Random velocity
			particle.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 0.3 * scale,
				Math.random() * 0.5 * scale,
				(Math.random() - 0.5) * 0.3 * scale
			);

			// Add to group
			particles.add(particle);
		}

		// Add to scene
		this.game.scene.add(particles);

		// Create a light flash
		const light = new THREE.PointLight(color, 2, 5);
		light.position.set(x, y, z);
		this.game.scene.add(light);

		// Animation timer
		let timer = 0;
		const animate = () => {
			timer += 0.02;

			// Update particles
			particles.children.forEach((particle) => {
				// Move particle
				particle.position.add(particle.userData.velocity);

				// Apply gravity
				particle.userData.velocity.y -= 0.01;

				// Fade out
				particle.material.opacity = 1 - timer / duration;

				// Shrink slightly
				const scale = 1 - timer / duration;
				particle.scale.set(scale, scale, scale);
			});

			// Fade light
			light.intensity = 2 * (1 - timer / (duration * 0.5));

			if (timer < duration) {
				requestAnimationFrame(animate);
			} else {
				// Remove particles and light from scene
				this.game.scene.remove(particles);
				this.game.scene.remove(light);
			}
		};

		// Start animation
		animate();
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

	extendPlatform() {
		// Add another row to the platform when level is completed
		const width = this.platformWidth;
		const newLength = this.platformLength + 1;

		// Update platform mesh
		this.game.scene.remove(this.platformMesh);

		const geometry = new THREE.BoxGeometry(width, 0.5, newLength);
		const material = new THREE.MeshLambertMaterial({
			color: 0x444444,
			emissive: 0x111111,
			emissiveIntensity: 0.2,
		});

		this.platformMesh = new THREE.Mesh(geometry, material);
		this.platformMesh.position.set(0, -0.25, newLength / 2 - 0.5);
		this.platformMesh.receiveShadow = true;

		this.game.scene.add(this.platformMesh);

		// Add new row to platform data
		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			this.platform.push({ x, z: newLength - 1, exists: true });
		}

		// Update platform length
		this.platformLength = newLength;
	}

	shrinkPlatform(rowsToRemove = 3) {
		// Shrink platform by removing specified number of rows
		for (let r = 0; r < rowsToRemove; r++) {
			// Get the farthest row that still exists
			let maxRow = -1;
			for (let i = 0; i < this.platform.length; i++) {
				const tile = this.platform[i];
				if (tile.exists && tile.z > maxRow) {
					maxRow = tile.z;
				}
			}

			if (maxRow < 0) break; // No more rows to remove

			// Remove cubes on that row
			for (let i = this.cubes.length - 1; i >= 0; i--) {
				const cube = this.cubes[i];
				if (Math.round(cube.mesh.position.z) === maxRow) {
					this.removeCube(cube);
				}
			}

			// Mark tiles as non-existent
			for (let i = this.platform.length - 1; i >= 0; i--) {
				const tile = this.platform[i];
				if (tile.z === maxRow) {
					tile.exists = false;
				}
			}

			// Check if player is affected
			const playerPos = this.game.player.getPosition();
			if (Math.round(playerPos.z) === maxRow) {
				this.gameOver = true;
			}
		}

		// Update platform mesh visual (add a red glow effect to show danger)
		const redIntensity = Math.min(0.2 + rowsToRemove * 0.1, 0.5);
		this.platformMesh.material.emissive.set(0xff0000);
		this.platformMesh.material.emissiveIntensity = redIntensity;

		// Reset emissive color after a short delay
		setTimeout(() => {
			this.platformMesh.material.emissive.set(0x111111);
			this.platformMesh.material.emissiveIntensity = 0.2;
		}, 500);
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
		return this.levelComplete;
	}

	isGameOver() {
		return this.gameOver;
	}
}
