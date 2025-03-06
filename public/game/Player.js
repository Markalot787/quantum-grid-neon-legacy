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

		this.init();
	}

	init() {
		// Create player mesh with cyberpunk look
		const geometry = new THREE.CapsuleGeometry(this.size / 2, this.size, 2, 8);

		// Create a glowing cyberpunk material for the player
		const material = new THREE.MeshStandardMaterial({
			color: 0xffff00, // Yellow base
			emissive: 0xffff00, // Yellow glow
			emissiveIntensity: 0.7, // Strong glow
			metalness: 0.7, // Metallic look
			roughness: 0.2, // Smooth surface
			transparent: true, // Enable transparency
			opacity: 0.9, // Slightly transparent
		});

		// Create the main player mesh
		this.mesh = new THREE.Mesh(geometry, material);

		// Add a wireframe for neon outline effect
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: 0xffff00,
				transparent: true,
				opacity: 0.8,
			})
		);
		this.wireframe = wireframe;
		this.mesh.add(wireframe);

		// Add a point light to player for dynamic lighting
		const playerLight = new THREE.PointLight(0xffff00, 0.7, 3);
		playerLight.position.set(0, 0, 0);
		this.playerLight = playerLight;
		this.mesh.add(playerLight);

		// Position player
		this.resetPosition();

		// Add to scene
		this.game.scene.add(this.mesh);

		// Add pulsing effect
		this.addPulsingEffect();
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

	// Add a pulsing glow effect to the player
	addPulsingEffect() {
		this.pulseData = {
			time: 0,
			speed: 1.2,
		};

		// Create animation function
		this.pulseAnimation = (delta) => {
			this.pulseData.time += delta * this.pulseData.speed;

			// Pulse emissive intensity
			if (this.mesh && this.mesh.material) {
				this.mesh.material.emissiveIntensity =
					0.5 + (Math.sin(this.pulseData.time * 3) * 0.5 + 0.5) * 0.5;
			}

			// Pulse wireframe opacity
			if (this.wireframe && this.wireframe.material) {
				this.wireframe.material.opacity =
					0.6 + (Math.sin(this.pulseData.time * 2) * 0.5 + 0.5) * 0.4;
			}

			// Pulse light intensity
			if (this.playerLight) {
				this.playerLight.intensity =
					0.5 + (Math.sin(this.pulseData.time * 4) * 0.5 + 0.5) * 0.5;
			}

			return true; // Keep animation running
		};

		// Add animation to game
		this.game.addAnimation(this.pulseAnimation);
	}
}
