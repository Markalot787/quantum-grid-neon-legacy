import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
		let material;

		// Set material based on cube type
		switch (this.type) {
			case 'normal':
				material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
				break;
			case 'forbidden':
				material = new THREE.MeshLambertMaterial({ color: 0x000000 });
				break;
			case 'advantage':
				material = new THREE.MeshLambertMaterial({
					color: 0x00ff00,
					emissive: 0x003300,
				});
				break;
		}

		// Create mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.mesh.castShadow = true;

		// Add to scene
		this.game.scene.add(this.mesh);
	}

	update(delta) {
		// Move cube towards player
		const speed = this.game.settings.cubeSpeed * delta;
		this.mesh.position.z -= speed;

		// Check for collision with player
		this.checkPlayerCollision();
	}

	checkPlayerCollision() {
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
}
