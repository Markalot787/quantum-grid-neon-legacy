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
		this.lives = 3;

		this.init();
	}

	init() {
		// Create player mesh
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
		const material = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			emissive: 0x666600,
			emissiveIntensity: 0.5,
			metalness: 0.3,
			roughness: 0.7,
		});
		this.mesh = new THREE.Mesh(geometry, material);

		// Add wireframe for better visibility
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: 0xffffff,
				linewidth: 1,
			})
		);
		this.mesh.add(wireframe);

		// Position player
		this.resetPosition();

		// Enable shadows
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add to scene
		this.game.scene.add(this.mesh);
	}

	resetPosition() {
		// Place player at the start of the platform
		this.position.x = 0;
		this.position.z = 1;
		this.updateMeshPosition();
	}

	updateMeshPosition() {
		if (this.mesh) {
			this.mesh.position.set(this.position.x, this.size / 2, this.position.z);
		}
	}

	move(direction) {
		// Prevent rapid movement
		const now = Date.now();
		if (now - this.lastMoveTime < this.moveCooldown) {
			return;
		}
		this.lastMoveTime = now;

		// Calculate new position based on direction
		let newX = this.position.x;
		let newZ = this.position.z;

		switch (direction) {
			case 'up':
				newZ = this.position.z + 1;
				break;
			case 'down':
				newZ = this.position.z - 1;
				break;
			case 'left':
				newX = this.position.x - 1;
				break;
			case 'right':
				newX = this.position.x + 1;
				break;
		}

		// Check boundaries
		const halfWidth = Math.floor(this.game.settings.stageWidth / 2);
		if (newX < -halfWidth || newX > halfWidth) {
			return;
		}

		if (newZ < 0 || newZ >= this.game.settings.stageLength) {
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

	loseLife() {
		this.lives--;
		if (this.lives <= 0) {
			this.game.endGame();
		}
	}
}
