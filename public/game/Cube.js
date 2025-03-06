import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.destroyed = false;

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
		let material;

		// Set material based on cube type
		switch (this.type) {
			case 'normal':
				material = new THREE.MeshStandardMaterial({
					color: 0xaaaaaa,
					roughness: 0.3,
					metalness: 0.7,
				});
				break;
			case 'forbidden':
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					roughness: 0.2,
					metalness: 0.8,
					emissive: 0x330000,
				});
				break;
			case 'advantage':
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff00,
					roughness: 0.2,
					metalness: 0.8,
					emissive: 0x003300,
					emissiveIntensity: 0.5,
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
		if (this.destroyed) return;

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

	destroy() {
		if (this.destroyed) return;

		this.destroyed = true;

		// Create destruction effect
		const particles = new THREE.Points(
			new THREE.BufferGeometry(),
			new THREE.PointsMaterial({
				color: 0xffffff,
				size: 0.1,
				transparent: true,
				opacity: 1,
			})
		);

		const particleCount = 20;
		const positions = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			positions[i * 3] = this.mesh.position.x + (Math.random() - 0.5) * 0.5;
			positions[i * 3 + 1] = this.mesh.position.y + (Math.random() - 0.5) * 0.5;
			positions[i * 3 + 2] = this.mesh.position.z + (Math.random() - 0.5) * 0.5;
		}

		particles.geometry.setAttribute(
			'position',
			new THREE.BufferAttribute(positions, 3)
		);
		this.game.scene.add(particles);

		// Animate particles
		const startTime = Date.now();
		const duration = 500; // 500ms
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = elapsed / duration;

			if (progress < 1) {
				const positions = particles.geometry.attributes.position.array;
				for (let i = 0; i < particleCount; i++) {
					positions[i * 3 + 1] += 0.02; // Move up
					positions[i * 3] += (Math.random() - 0.5) * 0.02; // Random X movement
					positions[i * 3 + 2] += (Math.random() - 0.5) * 0.02; // Random Z movement
				}
				particles.geometry.attributes.position.needsUpdate = true;
				particles.material.opacity = 1 - progress;

				requestAnimationFrame(animate);
			} else {
				this.game.scene.remove(particles);
			}
		};
		animate();

		// Remove the cube
		this.game.scene.remove(this.mesh);
	}
}
