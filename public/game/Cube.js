import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.destroyed = false;

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
		let material;

		// Set material based on cube type
		switch (this.type) {
			case 'normal':
				// Cyberpunk blue cube with neon edges
				material = new THREE.MeshStandardMaterial({
					color: 0x0066cc,
					roughness: 0.2,
					metalness: 0.8,
					emissive: 0x0033aa,
					emissiveIntensity: 0.5,
					transparent: true,
					opacity: 0.9,
				});

				// Add neon wireframe
				this.addNeonWireframe(geometry, 0x00ffff, x, z);
				break;

			case 'forbidden':
				// Dark cube with red neon glow
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					roughness: 0.1,
					metalness: 0.9,
					emissive: 0xff0000,
					emissiveIntensity: 0.7,
					transparent: true,
					opacity: 0.9,
				});

				// Add neon wireframe
				this.addNeonWireframe(geometry, 0xff0000, x, z);
				break;

			case 'advantage':
				// Bright green cube with intense glow
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff66,
					roughness: 0.1,
					metalness: 0.8,
					emissive: 0x00ff33,
					emissiveIntensity: 0.8,
					transparent: true,
					opacity: 0.9,
				});

				// Add neon wireframe
				this.addNeonWireframe(geometry, 0x00ff33, x, z);
				break;
		}

		// Create mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.mesh.castShadow = true;

		// Add to scene
		this.game.scene.add(this.mesh);

		// Add pulsing animation
		this.addPulsingEffect();
	}

	// Add neon wireframe to cube
	addNeonWireframe(geometry, color, x, z) {
		try {
			const wireframe = new THREE.LineSegments(
				new THREE.EdgesGeometry(geometry),
				new THREE.LineBasicMaterial({
					color: color,
					transparent: true,
					opacity: 0.8,
					linewidth: 2, // Note: linewidth only works in WebGLRenderer with certain GPUs
				})
			);

			wireframe.position.set(x, this.size / 2, z);
			this.wireframe = wireframe;
			this.game.scene.add(wireframe);
		} catch (error) {
			console.warn('Failed to create neon wireframe:', error);
		}
	}

	// Add pulsing glow effect
	addPulsingEffect() {
		// Store initial values for animation
		this.pulseData = {
			initialEmissiveIntensity: this.mesh.material.emissiveIntensity,
			time: 0,
			speed: 1 + Math.random() * 0.5, // Randomize speed slightly
			min: this.mesh.material.emissiveIntensity * 0.7,
			max: this.mesh.material.emissiveIntensity * 1.3,
		};

		// Add to game animations
		this.pulseAnimation = (delta) => {
			this.pulseData.time += delta * this.pulseData.speed;

			// Calculate pulsing value using sine wave
			const pulse =
				this.pulseData.min +
				(Math.sin(this.pulseData.time * 3) * 0.5 + 0.5) *
					(this.pulseData.max - this.pulseData.min);

			// Apply to material
			if (this.mesh && this.mesh.material) {
				this.mesh.material.emissiveIntensity = pulse;
			}

			// Apply to wireframe if it exists
			if (this.wireframe && this.wireframe.material) {
				this.wireframe.material.opacity =
					0.5 + (Math.sin(this.pulseData.time * 2) * 0.5 + 0.5) * 0.5;
			}

			return !this.destroyed; // Keep animation until cube is destroyed
		};

		// Add animation to game
		this.game.addAnimation(this.pulseAnimation);
	}

	update(delta) {
		// Move cube towards player
		const speed = this.game.settings.cubeSpeed * delta;
		this.mesh.position.z -= speed;

		// Update wireframe position if it exists
		if (this.wireframe) {
			this.wireframe.position.copy(this.mesh.position);
		}

		// Check for collision with player
		this.checkPlayerCollision();
	}

	checkPlayerCollision() {
		if (this.destroyed) return;

		const playerPos = this.game.player.getPosition();
		const cubePos = this.mesh.position;

		// Check if cube overlaps with player
		if (
			Math.abs(playerPos.x - cubePos.x) < 0.8 &&
			Math.abs(playerPos.z - cubePos.z) < 0.8
		) {
			// Player got crushed by cube
			this.game.endGame();
		}
	}

	destroy() {
		if (this.destroyed) return;

		this.destroyed = true;

		// Create enhanced destruction effect with neon particles
		this.createEnhancedDestructionEffect();

		// Remove the cube and wireframe
		this.game.scene.remove(this.mesh);
		if (this.wireframe) {
			this.game.scene.remove(this.wireframe);
		}
	}

	createEnhancedDestructionEffect() {
		// Get cube color for particles
		const color = this.mesh.material.emissive.getHex();

		// Create particle system
		const particleCount = 30;
		const positions = new Float32Array(particleCount * 3);
		const colors = new Float32Array(particleCount * 3);
		const sizes = new Float32Array(particleCount);

		const colorObj = new THREE.Color(color);

		for (let i = 0; i < particleCount; i++) {
			positions[i * 3] = this.mesh.position.x + (Math.random() - 0.5) * 0.5;
			positions[i * 3 + 1] = this.mesh.position.y + (Math.random() - 0.5) * 0.5;
			positions[i * 3 + 2] = this.mesh.position.z + (Math.random() - 0.5) * 0.5;

			// Vary colors slightly
			colors[i * 3] = colorObj.r * (0.8 + Math.random() * 0.4);
			colors[i * 3 + 1] = colorObj.g * (0.8 + Math.random() * 0.4);
			colors[i * 3 + 2] = colorObj.b * (0.8 + Math.random() * 0.4);

			// Vary sizes
			sizes[i] = 0.1 + Math.random() * 0.2;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

		const material = new THREE.PointsMaterial({
			size: 0.15,
			vertexColors: true,
			transparent: true,
			opacity: 1,
			blending: THREE.AdditiveBlending,
		});

		const particles = new THREE.Points(geometry, material);
		this.game.scene.add(particles);

		// Animate particles
		const startTime = Date.now();
		const duration = 800; // 800ms

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = elapsed / duration;

			if (progress < 1) {
				const positions = particles.geometry.attributes.position.array;
				const sizes = particles.geometry.attributes.size.array;

				for (let i = 0; i < particleCount; i++) {
					// Move particles outward in all directions
					const dirX = positions[i * 3] - this.mesh.position.x;
					const dirY = positions[i * 3 + 1] - this.mesh.position.y;
					const dirZ = positions[i * 3 + 2] - this.mesh.position.z;

					positions[i * 3] += dirX * 0.03;
					positions[i * 3 + 1] += dirY * 0.03 + 0.02; // Add slight upward drift
					positions[i * 3 + 2] += dirZ * 0.03;

					// Shrink particles over time
					sizes[i] *= 0.99;
				}

				particles.geometry.attributes.position.needsUpdate = true;
				particles.geometry.attributes.size.needsUpdate = true;
				material.opacity = 1 - progress;

				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(particles);
			}
		};

		animate();
	}
}
