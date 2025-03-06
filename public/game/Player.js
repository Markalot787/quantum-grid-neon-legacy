// Let THREE be globally loaded
// import * as THREE from 'three';
import { SimpleHumanoid } from '../assets/models/SimpleHumanoid.js';

export class Player {
	constructor(game) {
		this.game = game;
		this.mesh = null;
		this.humanoid = null;
		this.position = {
			x: 0,
			z: 0,
		};
		this.size = 0.3;
		this.moveSpeed = 0.2;
		this.lastMoveTime = 0;
		this.moveCooldown = 150; // ms
		this.lastDirection = null;

		this.init();
	}

	init() {
		// Create humanoid character
		this.humanoid = new SimpleHumanoid({
			color: 0xffaa00, // Amber/yellow color
			height: 0.6,
			width: 0.2,
			animationSpeed: 1.0,
		});

		this.mesh = this.humanoid.getModel();

		// Position player
		this.resetPosition();

		// Add to scene
		this.game.scene.add(this.mesh);

		console.log('Player initialized');
	}

	resetPosition() {
		// Place player at the start of the platform
		const stageWidth = this.game.settings.stageWidth;
		const stageLength = this.game.settings.stageLength;

		this.position.x = 0;
		this.position.z = 1; // Near the start

		this.updateMeshPosition();

		console.log(
			`Player reset to position (${this.position.x}, ${this.position.z})`
		);
	}

	updateMeshPosition() {
		if (this.mesh) {
			const meshPosition = new THREE.Vector3(
				this.position.x,
				this.size * 0.7, // Half height + small gap
				this.position.z
			);

			this.humanoid.setPosition(
				this.position.x,
				this.size * 0.7, // Half height + small gap
				this.position.z
			);

			// Update humanoid animation
			this.humanoid.update(meshPosition);
		}
	}

	move(direction) {
		// Prevent rapid movement
		const now = Date.now();
		if (now - this.lastMoveTime < this.moveCooldown) {
			return;
		}
		this.lastMoveTime = now;
		this.lastDirection = direction;

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

		// Rotate player based on direction
		if (this.mesh) {
			switch (direction) {
				case 'forward':
					this.mesh.rotation.y = 0;
					break;
				case 'backward':
					this.mesh.rotation.y = Math.PI;
					break;
				case 'left':
					this.mesh.rotation.y = -Math.PI / 2;
					break;
				case 'right':
					this.mesh.rotation.y = Math.PI / 2;
					break;
			}
		}

		console.log(
			`Player moved to position (${this.position.x}, ${this.position.z})`
		);
	}

	update(delta) {
		// Update humanoid animation
		if (this.humanoid) {
			this.humanoid.update(
				new THREE.Vector3(this.position.x, this.size * 0.7, this.position.z)
			);
		}
	}

	getPosition() {
		return {
			x: this.position.x,
			z: this.position.z,
		};
	}
}
