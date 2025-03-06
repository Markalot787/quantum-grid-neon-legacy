import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type = 'normal', x = 0, z = 0) {
		this.game = game;
		this.type = type;
		this.position = { x, z };
		this.mesh = null;
		this.size = 0.8;
		this.speed = this.game.settings.cubeSpeed;
		this.rotationSpeed = 2.0; // Base rotation speed
		this.destroyed = false;

		console.log('DEBUG - Cube created:', {
			type,
			position: this.position,
			speed: this.speed,
		});

		this.init();
	}

	init() {
		this.createMesh();
	}

	createMesh() {
		console.log('DEBUG - Cube createMesh called for type:', this.type);

		// Create a simple cube geometry
		const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

		// Create different materials based on cube type
		let material;

		switch (this.type) {
			case 'normal':
				// Normal cubes are white/grey in the original game
				material = new THREE.MeshStandardMaterial({
					color: 0xeeeeee,
					metalness: 0.3,
					roughness: 0.4,
				});
				break;

			case 'forbidden':
				// Forbidden cubes are black in the original game
				material = new THREE.MeshStandardMaterial({
					color: 0x111111,
					metalness: 0.5,
					roughness: 0.3,
				});
				break;

			case 'advantage':
				// Advantage cubes are green in the original game
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					emissive: 0x00aa00,
					emissiveIntensity: 0.3,
					metalness: 0.4,
					roughness: 0.3,
				});
				break;

			default:
				material = new THREE.MeshStandardMaterial({
					color: 0xeeeeee,
				});
		}

		// Create the mesh
		this.mesh = new THREE.Mesh(geometry, material);

		// Add wireframe for better visibility
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: this.getWireframeColor(),
				linewidth: 1,
			})
		);
		this.mesh.add(wireframe);

		// Set position
		this.mesh.position.set(this.position.x, 0.5, this.position.z);

		// Enable shadows
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add to scene
		this.game.scene.add(this.mesh);

		console.log('DEBUG - Cube created:', {
			type: this.type,
			position: this.position,
			meshPosition: this.mesh.position,
		});
	}

	getWireframeColor() {
		switch (this.type) {
			case 'normal':
				return 0xffffff;
			case 'advantage':
				return 0x00ff88;
			case 'forbidden':
				return 0xff3333;
			default:
				return 0xffffff;
		}
	}

	update(delta) {
		// Validate delta time
		if (typeof delta !== 'number' || delta <= 0) {
			console.error('Invalid delta:', delta);
			return;
		}

		// Calculate movement
		const baseSpeed = this.game.settings.cubeSpeed || 2.5;
		const movement = baseSpeed * delta;

		// Move cube in negative Z direction (toward player)
		this.mesh.position.z -= movement;

		// Apply rotation as a visual effect only
		// Rotate around x-axis proportional to movement
		this.mesh.rotation.x += (movement * Math.PI) / 2;

		// Update position for collision detection
		this.position.x = this.mesh.position.x;
		this.position.z = this.mesh.position.z;

		// Check for falloff - remove cube if it goes past the edge
		if (this.position.z < -1) {
			if (this.type === 'normal') {
				console.log('DEBUG - Normal cube fell off edge');
				this.game.level.removeCube(this); // Penalty in Game.js/Level.js
			} else if (this.type === 'forbidden') {
				console.log('DEBUG - Forbidden cube fell off edge (good)');
				this.game.level.removeCube(this);
			} else {
				this.game.level.removeCube(this);
			}
		}

		// Check for collision with player
		this.checkPlayerCollision();
	}

	checkPlayerCollision() {
		// Skip if cube is already destroyed
		if (this.destroyed) return;

		// Get player position
		const playerPos = this.game.player.getPosition();

		// Check if cube is close to player (using distance-based check)
		const dx = Math.abs(this.mesh.position.x - playerPos.x);
		const dz = Math.abs(this.mesh.position.z - playerPos.z);

		// If cube and player are at the same position (with some tolerance)
		if (dx < 0.8 && dz < 0.8) {
			console.log('DEBUG - Cube collided with player');

			// Handle collision based on cube type
			switch (this.type) {
				case 'normal':
					// Normal cube - handle according to game rules
					console.log('DEBUG - Normal cube hit player');
					this.game.player.loseLife();
					this.destroy();
					break;
				case 'forbidden':
					// Forbidden cube - player loses a life
					console.log('DEBUG - Forbidden cube hit player');
					this.game.player.loseLife();
					// Also activate forbidden effect (remove platform rows)
					this.activateForbidden();
					this.destroy();
					break;
				case 'advantage':
					// Advantage cube - trigger advantage
					console.log('DEBUG - Advantage cube hit player');
					this.triggerAdvantage();
					this.destroy();
					break;
				default:
					// Default case
					this.game.player.loseLife();
					this.destroy();
					break;
			}
		}
	}

	activateForbidden() {
		// Implement forbidden cube effect - remove 3 rows of the platform
		console.log('DEBUG - Activating forbidden cube effect');
		// Call the game method to remove platform rows
		this.game.level.removePlatformRows(this.position.z, 3);
	}

	triggerAdvantage() {
		// Implement advantage effect (e.g., score bonus, clear row)
		console.log('DEBUG - Advantage cube triggered');
		this.game.activateAdvantage(this.position);
	}

	triggerForbidden() {
		// Implement forbidden effect (e.g., remove platform tiles)
		console.log('DEBUG - Forbidden cube triggered');
		this.game.activateForbidden(this.position);
	}

	destroy() {
		if (this.destroyed) return;

		// Mark as destroyed
		this.destroyed = true;

		// Create destruction effect
		this.createDestructionEffect();

		// Remove from scene
		if (this.mesh) {
			this.game.scene.remove(this.mesh);

			// Dispose of geometries and materials
			if (this.mesh.geometry) this.mesh.geometry.dispose();
			if (this.mesh.material) {
				if (Array.isArray(this.mesh.material)) {
					this.mesh.material.forEach((material) => material.dispose());
				} else {
					this.mesh.material.dispose();
				}
			}

			this.mesh = null;
		}

		console.log('DEBUG - Cube destroyed:', this.type);
	}

	createDestructionEffect() {
		// Create particles for destruction effect
		const particleCount = 15;
		const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);

		// Use color based on cube type
		let color;
		switch (this.type) {
			case 'advantage':
				color = 0x00ff00;
				break;
			case 'forbidden':
				color = 0xff0000;
				break;
			default:
				color = 0xffffff;
		}

		const particleMaterial = new THREE.MeshBasicMaterial({
			color: color,
			emissive: color,
			emissiveIntensity: 1.0,
		});

		// Create and animate particles
		for (let i = 0; i < particleCount; i++) {
			const particle = new THREE.Mesh(particleGeometry, particleMaterial);

			// Set initial position at cube center
			particle.position.copy(this.mesh.position);

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
}
