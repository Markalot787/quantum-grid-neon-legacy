import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type = 'normal', x = 0, z = 0) {
		this.game = game;
		this.type = type;
		this.position = { x, z };
		this.mesh = null;
		this.size = 0.8;
		this.speed = this.game.settings.cubeSpeed;
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
		// Create a simple cube geometry
		const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

		// Create different materials based on cube type
		let material;

		switch (this.type) {
			case 'normal':
				// Normal cubes are white/grey
				material = new THREE.MeshStandardMaterial({
					color: 0xeeeeee,
					metalness: 0.3,
					roughness: 0.4,
				});
				break;

			case 'advantage':
				// Advantage cubes are green
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
				color: this.type === 'advantage' ? 0x00ff88 : 0xffffff,
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
	}

	update(delta) {
		if (this.destroyed) return;

		// Calculate movement
		const movement = this.speed * delta;

		// Move cube in negative Z direction (toward player)
		this.mesh.position.z -= movement;

		// Update position for collision detection
		this.position.x = this.mesh.position.x;
		this.position.z = this.mesh.position.z;

		// Check for collision with player
		this.checkPlayerCollision();
	}

	checkPlayerCollision() {
		if (this.destroyed) return;

		// Get player position
		const playerPos = this.game.player.getPosition();

		// Check if cube is close to player (using distance-based check)
		const dx = Math.abs(this.mesh.position.x - playerPos.x);
		const dz = Math.abs(this.mesh.position.z - playerPos.z);

		// If cube and player are at the same position (with some tolerance)
		if (dx < 0.8 && dz < 0.8) {
			console.log('DEBUG - Cube collided with player');
			this.game.player.loseLife();
			this.destroy();
		}
	}

	destroy() {
		if (this.destroyed) return;

		// Mark as destroyed
		this.destroyed = true;

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
}
