import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.rotation = {
			speed: (Math.random() - 0.5) * 0.02, // Random rotation direction
			axis: new THREE.Vector3(
				Math.random() > 0.5 ? 1 : 0,
				0,
				Math.random() > 0.5 ? 1 : 0
			).normalize(),
		};

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
		let material;

		// Enhanced materials with emissive properties for neon effect
		switch (this.type) {
			case 'red':
				material = new THREE.MeshStandardMaterial({
					color: 0xff0000,
					emissive: 0xff0000,
					emissiveIntensity: 0.5,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'green':
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					emissive: 0x00ff00,
					emissiveIntensity: 0.5,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'blue':
				material = new THREE.MeshStandardMaterial({
					color: 0x0000ff,
					emissive: 0x0000ff,
					emissiveIntensity: 0.5,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'yellow':
				material = new THREE.MeshStandardMaterial({
					color: 0xffff00,
					emissive: 0xffff00,
					emissiveIntensity: 0.5,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'black':
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					emissive: 0x330033,
					emissiveIntensity: 0.3,
					metalness: 0.9,
					roughness: 0.1,
				});
				break;
			default:
				material = new THREE.MeshStandardMaterial({
					color: 0xffffff,
					emissive: 0xffffff,
					emissiveIntensity: 0.3,
					metalness: 0.8,
					roughness: 0.2,
				});
		}

		// Add wireframe overlay for neon grid effect
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: this.getWireframeColor(),
				linewidth: 2,
			})
		);

		// Create the main mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add wireframe as child of the mesh
		this.mesh.add(wireframe);

		// Add to scene
		this.game.scene.add(this.mesh);
	}

	getWireframeColor() {
		switch (this.type) {
			case 'red':
				return 0xff5555;
			case 'green':
				return 0x55ff55;
			case 'blue':
				return 0x5555ff;
			case 'yellow':
				return 0xffff55;
			case 'black':
				return 0xff00ff; // Purple wireframe for black cubes
			default:
				return 0xffffff;
		}
	}

	update(delta) {
		// Move cube towards player
		const speed = this.game.settings.cubeSpeed * delta;
		this.mesh.position.z -= speed;

		// Roll the cube as it moves
		this.rollCube(speed);

		// Apply additional rotation for visual flair
		this.mesh.rotateOnAxis(this.rotation.axis, this.rotation.speed);

		// Check for collision with player
		this.checkPlayerCollision();
	}

	rollCube(distance) {
		// Calculate rotation based on distance moved
		// A full rotation is 2π radians, which should occur when the cube moves a distance equal to its circumference
		// For a unit cube, one face is 1 unit, so a 90-degree rotation per unit of distance
		const rotationAmount = (Math.PI / 2) * distance;

		// Determine rotation axis (x-axis for movement along z)
		this.mesh.rotateX(rotationAmount);
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
