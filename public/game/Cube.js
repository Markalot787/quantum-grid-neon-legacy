import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.position = { x, z }; // Track position separately for consistent movement
		this.rotation = {
			speed: (Math.random() - 0.5) * 0.01, // Reduced random rotation for more consistent movement
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

		// MUCH brighter materials for dramatically improved visibility
		switch (this.type) {
			case 'normal':
				material = new THREE.MeshStandardMaterial({
					color: 0xcccccc, // Much brighter gray for normal cubes
					emissive: 0x888888,
					emissiveIntensity: 0.6,
					metalness: 0.7,
					roughness: 0.3,
				});
				break;
			case 'advantage':
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00, // Bright green for advantage cubes
					emissive: 0x00ff00,
					emissiveIntensity: 1.0, // Full emissive intensity
					metalness: 0.7,
					roughness: 0.3,
				});
				break;
			case 'forbidden':
				material = new THREE.MeshStandardMaterial({
					color: 0x000000, // Black for forbidden cubes
					emissive: 0xff0000, // Strong red glow
					emissiveIntensity: 0.7, // Increased emissive
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			// Fallback for any other types with brighter materials
			case 'red':
				material = new THREE.MeshStandardMaterial({
					color: 0xff0000,
					emissive: 0xff0000,
					emissiveIntensity: 1.0,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'green':
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					emissive: 0x00ff00,
					emissiveIntensity: 1.0,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'blue':
				material = new THREE.MeshStandardMaterial({
					color: 0x0000ff,
					emissive: 0x0000ff,
					emissiveIntensity: 1.0,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'yellow':
				material = new THREE.MeshStandardMaterial({
					color: 0xffff00,
					emissive: 0xffff00,
					emissiveIntensity: 1.0,
					metalness: 0.8,
					roughness: 0.2,
				});
				break;
			case 'black':
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					emissive: 0xff00ff,
					emissiveIntensity: 0.8,
					metalness: 0.9,
					roughness: 0.1,
				});
				break;
			default:
				material = new THREE.MeshStandardMaterial({
					color: 0xffffff,
					emissive: 0xffffff,
					emissiveIntensity: 0.8,
					metalness: 0.8,
					roughness: 0.2,
				});
		}

		// Add thicker wireframe overlay for enhanced visibility
		const wireframe = new THREE.LineSegments(
			new THREE.EdgesGeometry(geometry),
			new THREE.LineBasicMaterial({
				color: this.getWireframeColor(),
				linewidth: 3, // Thicker lines
			})
		);

		// Create the main mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.position = { x, z }; // Store initial position
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add wireframe as child of the mesh
		this.mesh.add(wireframe);

		// Add glow light for extra visibility on special cubes
		if (this.type === 'advantage' || this.type === 'forbidden') {
			const glowColor = this.type === 'advantage' ? 0x00ff00 : 0xff0000;
			const glowLight = new THREE.PointLight(glowColor, 0.8, 3);
			glowLight.position.set(0, 0, 0);
			this.mesh.add(glowLight);
		}

		// Add to scene
		this.game.scene.add(this.mesh);
	}

	getWireframeColor() {
		switch (this.type) {
			case 'normal':
				return 0xffffff; // White outline for normal cubes
			case 'advantage':
				return 0x00ff00; // Pure green outline (brighter)
			case 'forbidden':
				return 0xff0000; // Pure red outline (brighter)
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
		// CRITICAL FIX: Ensure consistent movement speed
		const speed = this.game.settings.cubeSpeed * delta;

		// Move cube towards player at consistent speed
		this.position.z -= speed;

		// CRITICAL FIX: Update mesh position directly
		this.mesh.position.z = this.position.z;

		// CRITICAL FIX: Implement proper rolling animation
		// Calculate rotation based on distance moved
		// A full rotation is 2π radians, which should occur when the cube moves a distance equal to its circumference
		// For a unit cube, one face is 1 unit, so a 90-degree rotation per unit of distance
		const rotationAmount = (Math.PI / 2) * speed;

		// Apply rotation around X-axis for forward movement
		this.mesh.rotateX(rotationAmount);

		// Apply subtle additional rotation for visual flair - reduced for consistency
		this.mesh.rotateOnAxis(this.rotation.axis, this.rotation.speed * 0.3);

		// Check for collision with player
		this.checkPlayerCollision();

		// CRITICAL FIX: Check if cube has fallen off the platform
		if (this.position.z < -2) {
			// Remove cube if it falls off
			this.game.level.removeCube(this);
		}
	}

	checkPlayerCollision() {
		// CRITICAL FIX: Ensure player exists before checking collision
		if (!this.game.player || !this.game.player.mesh) return;

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
