import { THREE } from '../threeImports.js';
import {
	createPlayerModel,
	updatePlayerAnimations,
} from '../assets/models/player/player-mesh.js';
import {
	createTrailParticles,
	updateTrailParticles,
} from '../assets/effects/particles.js';

export class Player {
	constructor(game) {
		this.game = game;
		this.mesh = null;
		this.model = null;
		this.position = {
			x: 0,
			z: 0,
		};
		this.size = 0.3;
		this.moveSpeed = 0.2;
		this.lastMoveTime = 0;
		this.moveCooldown = 150; // ms
		this.isMoving = false;
		this.lastMovementTime = 0;

		// Particles
		this.trailParticles = null;
		this.trailUpdateTimer = 0;

		this.init();
	}

	init() {
		// Create player model
		this.model = createPlayerModel(0x00ffff, 0x88ffff);
		this.model.scale.set(0.5, 0.5, 0.5);

		// Create simple placeholder mesh for collision detection
		const geometry = new THREE.CylinderGeometry(
			this.size / 2,
			this.size / 2,
			this.size,
			8
		);
		const material = new THREE.MeshBasicMaterial({
			color: 0x00ffff,
			transparent: true,
			opacity: 0,
			visible: false,
		});
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.add(this.model); // Add detailed model as child

		// Create trail particles
		this.trailParticles = createTrailParticles(0x00ffff, 100);
		this.game.scene.add(this.trailParticles);

		// Position player
		this.resetPosition();

		// Add to scene
		this.game.scene.add(this.mesh);

		// Start idle animation
		const idleAction = this.model.userData.mixer.clipAction(
			this.model.userData.animations.idle
		);
		idleAction.play();
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

			// Add trail particles at the player's feet
			if (this.trailParticles) {
				this.trailUpdateTimer += this.game.clock.getDelta();

				// Only add trail particles every 0.1 seconds
				if (this.trailUpdateTimer > 0.1 && this.isMoving) {
					const trailPosition = new THREE.Vector3(
						this.position.x,
						0.1, // Just above the ground
						this.position.z
					);
					updateTrailParticles(
						this.trailParticles,
						this.trailUpdateTimer,
						trailPosition
					);
					this.trailUpdateTimer = 0;
				} else if (!this.isMoving) {
					// Still update trail particles for fading out
					updateTrailParticles(this.trailParticles, this.trailUpdateTimer);
				}
			}
		}
	}

	move(direction) {
		// Prevent rapid movement
		const now = Date.now();
		if (now - this.lastMoveTime < this.moveCooldown) {
			return;
		}
		this.lastMoveTime = now;
		this.lastMovementTime = now;
		this.isMoving = true;

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
				this.model.rotation.y = 0; // Face forward
				break;
			case 'backward':
				newZ = z - 1;
				this.model.rotation.y = Math.PI; // Face backward
				break;
			case 'left':
				newX = x - 1;
				this.model.rotation.y = -Math.PI / 2; // Face left
				break;
			case 'right':
				newX = x + 1;
				this.model.rotation.y = Math.PI / 2; // Face right
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

		// Play movement animation
		if (this.model.userData.mixer) {
			// Stop any existing actions
			this.model.userData.mixer.stopAllAction();

			// Play movement animation
			const movementAction = this.model.userData.mixer.clipAction(
				this.model.userData.animations.movement
			);
			movementAction.play();

			// After animation, return to idle
			setTimeout(() => {
				// If no movement has occurred in the last 0.5 seconds, return to idle
				if (now - this.lastMovementTime > 500) {
					this.isMoving = false;
					movementAction.stop();
					const idleAction = this.model.userData.mixer.clipAction(
						this.model.userData.animations.idle
					);
					idleAction.play();
				}
			}, 500);
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
		// Update model animations
		if (this.model && this.model.userData.mixer) {
			updatePlayerAnimations(this.model, delta, this.isMoving);
		}

		// Check if player should return to idle
		const now = Date.now();
		if (this.isMoving && now - this.lastMovementTime > 500) {
			this.isMoving = false;

			// Return to idle animation
			if (this.model.userData.mixer) {
				this.model.userData.mixer.stopAllAction();
				const idleAction = this.model.userData.mixer.clipAction(
					this.model.userData.animations.idle
				);
				idleAction.play();
			}
		}

		// Update trail particles
		if (this.trailParticles) {
			updateTrailParticles(this.trailParticles, delta);
		}
	}
}
