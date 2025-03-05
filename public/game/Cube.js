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

		// For smooth movement
		this.lastPosition = { x, z };
		this.targetPosition = { x, z: z - 1 }; // Moving toward player (lower z)
		this.moveProgress = 0;

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
		// Create cube geometry
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

		// Create material based on cube type
		let material;

		switch (this.type) {
			case 'normal':
				// Standard gray cube
				material = new THREE.MeshStandardMaterial({
					color: 0xaaaaaa,
					emissive: 0x222222,
					emissiveIntensity: 0.3,
					metalness: 0.7,
					roughness: 0.3,
				});
				break;

			case 'advantage':
				// Green cube with glow
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					emissive: 0x00ff00,
					emissiveIntensity: 0.5,
					metalness: 0.7,
					roughness: 0.3,
				});
				break;

			case 'forbidden':
				// Black cube with subtle red glow
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					emissive: 0xff0000,
					emissiveIntensity: 0.3,
					metalness: 0.9,
					roughness: 0.2,
				});
				break;

			default:
				// Fallback for other types
				material = new THREE.MeshStandardMaterial({
					color: 0xaaaaaa,
					emissive: 0x222222,
					emissiveIntensity: 0.3,
					metalness: 0.7,
					roughness: 0.3,
				});
		}

		// Create mesh
		this.mesh = new THREE.Mesh(geometry, material);

		// Add wireframe overlay for neon grid effect
		const wireframeColor = this.getWireframeColor();
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: wireframeColor,
				linewidth: 1.5,
			})
		);
		this.mesh.add(wireframe);

		// Set initial position
		this.updateMeshPosition();

		// Enable shadows
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add to scene
		this.game.scene.add(this.mesh);

		console.log('DEBUG - Cube mesh created:', {
			position: this.mesh.position,
			type: this.type,
			material: material.color.getHexString(),
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

	updateMeshPosition() {
		if (this.mesh) {
			// Interpolate between last and target position based on moveProgress
			const x =
				this.lastPosition.x +
				(this.targetPosition.x - this.lastPosition.x) * this.moveProgress;
			const z =
				this.lastPosition.z +
				(this.targetPosition.z - this.lastPosition.z) * this.moveProgress;

			// Update actual position
			this.position.x = x;
			this.position.z = z;

			// Update mesh position
			this.mesh.position.set(
				x,
				this.size * 0.5, // Half height to sit on platform
				z
			);
		}
	}

	update(delta) {
		if (this.destroyed) return;

		// Update movement progress
		this.moveProgress += this.speed * delta;

		// If we've reached the target position
		if (this.moveProgress >= 1) {
			// Update positions
			this.lastPosition = { ...this.targetPosition };
			this.targetPosition = {
				x: this.targetPosition.x,
				z: this.targetPosition.z - 1,
			};
			this.moveProgress = 0;

			// Check if we've reached the end of the platform
			if (this.lastPosition.z < 0) {
				this.destroy();
				return;
			}

			// Check for collision with player
			this.checkPlayerCollision();
		}

		// Update mesh position
		this.updateMeshPosition();

		// Update rotation - rolling effect
		if (this.mesh) {
			// Calculate rotation based on movement
			// Roll forward (around X axis) as the cube moves in Z direction
			this.mesh.rotation.x = (this.moveProgress * Math.PI) / 2;

			// Add slight additional rotation for visual interest
			const rotationAmount = this.rotationSpeed * delta;
			this.mesh.rotation.y += rotationAmount * 0.2;
		}
	}

	checkPlayerCollision() {
		const playerPos = this.game.player.getPosition();

		// Check if cube and player are at the same position
		if (
			Math.round(this.position.x) === playerPos.x &&
			Math.round(this.position.z) === playerPos.z
		) {
			console.log('DEBUG - Cube collision with player detected');

			// Handle collision based on cube type
			switch (this.type) {
				case 'normal':
					// End game on normal cube collision
					this.game.endGame();
					break;

				case 'advantage':
					// Trigger advantage effect and destroy cube
					this.triggerAdvantage();
					this.destroy();
					break;

				case 'forbidden':
					// Trigger forbidden effect and destroy cube
					this.triggerForbidden();
					this.destroy();
					break;
			}
		}
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

		console.log('DEBUG - Destroying cube at position:', this.position);

		// Remove from scene
		if (this.mesh) {
			this.game.scene.remove(this.mesh);
			this.mesh.geometry.dispose();
			this.mesh.material.dispose();
		}

		// Mark as destroyed
		this.destroyed = true;

		// Create explosion effect
		this.createExplosionEffect();
	}

	createExplosionEffect() {
		// Create particles for explosion effect
		const particleCount = 20;
		const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
		const particleMaterial = new THREE.MeshBasicMaterial({
			color: this.getParticleColor(),
			emissive: this.getParticleColor(),
			emissiveIntensity: 1.0,
		});

		for (let i = 0; i < particleCount; i++) {
			const particle = new THREE.Mesh(particleGeometry, particleMaterial);

			// Set initial position at cube center
			particle.position.set(this.position.x, this.size * 0.5, this.position.z);

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

	getParticleColor() {
		switch (this.type) {
			case 'normal':
				return 0xaaaaaa;
			case 'advantage':
				return 0x00ff00;
			case 'forbidden':
				return 0xff0000;
			default:
				return 0xffffff;
		}
	}
}
