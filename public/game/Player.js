import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Player {
	constructor(game) {
		this.game = game;
		this.mesh = null;
		this.position = {
			x: 0,
			z: 0,
		};
		this.size = 0.8;
		this.moveSpeed = 0.2;
		this.lastMoveTime = 0;
		this.moveCooldown = 150; // ms

		this.init();
	}

	init() {
		console.log('DEBUG - Player init called');
		this.createMesh();
		this.resetPosition();
	}

	createMesh() {
		console.log('DEBUG - Player createMesh called');

		// Create player geometry - slightly larger for better visibility
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

		// Create player material with bright color and glow
		const material = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ffff,
			emissiveIntensity: 0.8,
			metalness: 0.7,
			roughness: 0.3,
		});

		console.log('DEBUG - Player material settings:', {
			color: material.color.getHexString(),
			emissive: material.emissive.getHexString(),
			emissiveIntensity: material.emissiveIntensity,
			transparent: material.transparent,
			opacity: material.opacity,
		});

		// Create player mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		console.log('DEBUG - Player mesh created:', {
			position: this.mesh.position,
			scale: this.mesh.scale,
			visible: this.mesh.visible,
			id: this.mesh.id,
		});

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

		console.log('DEBUG - Player added to scene:', {
			sceneChildren: this.game.scene.children.length,
			playerInScene: this.game.scene.children.includes(this.mesh),
		});
	}

	addGlowEffect() {
		// Create a point light that follows the player
		this.glowLight = new THREE.PointLight(0x00ffff, 1.0, 5);
		this.glowLight.position.set(0, 0, 0);
		this.mesh.add(this.glowLight);

		// Create a pulse animation for the glow
		this.glowPulse = {
			intensity: 1.0,
			min: 0.7,
			max: 1.3,
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
			case 'up':
			case 'forward':
				newZ = z + 1;
				break;
			case 'down':
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
		// Update glow pulse effect
		this.updateGlowEffect(delta);
	}

	updateGlowEffect(delta) {
		if (this.glowLight) {
			// Update pulse direction
			this.glowPulse.intensity +=
				this.glowPulse.direction * this.glowPulse.speed * delta;

			// Check boundaries and change direction
			if (this.glowPulse.intensity >= this.glowPulse.max) {
				this.glowPulse.intensity = this.glowPulse.max;
				this.glowPulse.direction = -1;
			} else if (this.glowPulse.intensity <= this.glowPulse.min) {
				this.glowPulse.intensity = this.glowPulse.min;
				this.glowPulse.direction = 1;
			}

			// Apply new intensity
			this.glowLight.intensity = this.glowPulse.intensity;
		}
	}
}
