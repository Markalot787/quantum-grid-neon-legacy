import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Player {
	constructor(game) {
		this.game = game;
		this.mesh = null;
		this.position = {
			x: 0,
			z: 0,
		};
		this.size = 0.3;
		this.moveSpeed = 0.2;
		this.lastMoveTime = 0;
		this.moveCooldown = 150; // ms
		this.isMoving = false;
		this.moveProgress = 0;
		this.startPosition = { x: 0, z: 0 };
		this.targetPosition = { x: 0, z: 0 };

		this.init();
	}

	init() {
		// Create player mesh
		this.createMesh();
	}

	createMesh() {
		// Create player geometry
		const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);

		// Create player material with neon effect
		const material = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 0.5,
			metalness: 0.8,
			roughness: 0.2,
		});

		// Create player mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.copy(this.position);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add wireframe overlay for neon grid effect
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: 0xffffff,
				linewidth: 2,
			})
		);
		this.mesh.add(wireframe);

		// Add glow effect
		this.addGlowEffect();

		// Add to scene
		this.game.scene.add(this.mesh);
	}

	addGlowEffect() {
		// Create a point light that follows the player
		this.glowLight = new THREE.PointLight(0x00ffff, 0.8, 3);
		this.glowLight.position.set(0, 0, 0);
		this.mesh.add(this.glowLight);

		// Create a pulse animation for the glow
		this.glowPulse = {
			intensity: 0.8,
			min: 0.5,
			max: 1.0,
			speed: 2.0,
			direction: 1,
		};
	}

	resetPosition() {
		// Place player at the start of the platform
		const stageWidth = this.game.settings.stageWidth;
		const stageLength = this.game.settings.stageLength;

		this.position.x = 0;
		this.position.z = 1; // Near the start

		this.updateMeshPosition();
	}

	updateMeshPosition() {
		if (this.mesh) {
			this.mesh.position.set(
				this.position.x,
				this.size * 0.7, // Half height + small gap
				this.position.z
			);
		}
	}

	move(direction) {
		// Prevent rapid movement
		const now = Date.now();
		if (now - this.lastMoveTime < this.moveCooldown) {
			return;
		}
		this.lastMoveTime = now;

		// Get current position
		const { x, z } = this.position;
		const stageWidth = this.game.settings.stageWidth;
		const stageLength = this.game.settings.stageLength;

		// Calculate new position based on direction
		let newX = x;
		let newZ = z;

		switch (direction) {
			case 'forward':
				newZ = z + 1;
				break;
			case 'backward':
				newZ = z - 1;
				break;
			case 'left':
				newX = x - 1;
				break;
			case 'right':
				newX = x + 1;
				break;
		}

		// Check boundaries
		const halfWidth = Math.floor(stageWidth / 2);
		if (newX < -halfWidth || newX > halfWidth) {
			return;
		}

		if (newZ < 0 || newZ >= stageLength) {
			return;
		}

		// Check if the platform exists at this position
		if (!this.game.level.isPlatformAt(newX, newZ)) {
			return;
		}

		// Move player
		this.position.x = newX;
		this.position.z = newZ;

		// Update mesh position
		this.updateMeshPosition();
	}

	getPosition() {
		return {
			x: this.position.x,
			z: this.position.z,
		};
	}

	update(delta) {
		// Handle movement animation
		if (this.isMoving) {
			this.moveProgress += this.moveSpeed * delta;

			if (this.moveProgress >= 1) {
				// Movement complete
				this.position.copy(this.targetPosition);
				this.isMoving = false;
				this.moveProgress = 0;
			} else {
				// Interpolate position
				this.position.lerpVectors(
					this.startPosition,
					this.targetPosition,
					this.moveProgress
				);
			}

			// Update mesh position
			this.updateMeshPosition();
		}

		// Update glow pulse effect
		this.updateGlowEffect(delta);
	}

	updateGlowEffect(delta) {
		// Pulse the glow light intensity
		this.glowPulse.intensity +=
			this.glowPulse.direction * this.glowPulse.speed * delta;

		// Reverse direction at min/max
		if (this.glowPulse.intensity >= this.glowPulse.max) {
			this.glowPulse.intensity = this.glowPulse.max;
			this.glowPulse.direction = -1;
		} else if (this.glowPulse.intensity <= this.glowPulse.min) {
			this.glowPulse.intensity = this.glowPulse.min;
			this.glowPulse.direction = 1;
		}

		// Apply the new intensity
		this.glowLight.intensity = this.glowPulse.intensity;
	}
}
