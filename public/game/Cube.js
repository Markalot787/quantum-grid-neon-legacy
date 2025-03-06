// Let THREE be globally loaded
// import * as THREE from 'three';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.destroyed = false;
		this.animationPhase = Math.random() * Math.PI * 2; // Random starting phase for animations
		this.speed = this.game.settings.cubeSpeed * 10; // Increase speed multiplier from 5 to 10 for faster movement

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		// Create a more visually interesting cube with beveled edges
		const geometry = new THREE.BoxGeometry(
			this.size,
			this.size,
			this.size,
			4,
			4,
			4
		);

		// Modify geometry to add some variation
		const positionAttribute = geometry.getAttribute('position');
		const vertex = new THREE.Vector3();

		for (let i = 0; i < positionAttribute.count; i++) {
			vertex.fromBufferAttribute(positionAttribute, i);

			// Add slight distortion to vertices for forbidden cubes
			if (this.type === 'forbidden') {
				const distortion = (Math.random() - 0.5) * 0.05;
				vertex.x += distortion;
				vertex.y += distortion;
				vertex.z += distortion;
			}

			positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
		}

		geometry.computeVertexNormals();

		// Create advanced materials based on cube type
		let material;

		switch (this.type) {
			case 'normal':
				// White/silver cube with reflective surface
				material = new THREE.MeshStandardMaterial({
					color: 0xdddddd,
					roughness: 0.2,
					metalness: 0.8,
					envMapIntensity: 1.0,
				});
				break;
			case 'forbidden':
				// Black cube with red glow
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					roughness: 0.1,
					metalness: 0.9,
					emissive: 0xff0000,
					emissiveIntensity: 0.3,
				});
				break;
			case 'advantage':
				// Green cube with stronger glow
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff44,
					roughness: 0.3,
					metalness: 0.7,
					emissive: 0x00ff00,
					emissiveIntensity: 0.6,
				});
				break;
		}

		// Create mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add edge highlighting for advantage cubes
		if (this.type === 'advantage') {
			const edgeGeometry = new THREE.EdgesGeometry(geometry);
			const edgeMaterial = new THREE.LineBasicMaterial({
				color: 0x00ff88,
				linewidth: 1,
			});
			const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
			this.mesh.add(edges);
		}

		// Add to scene
		this.game.scene.add(this.mesh);

		// Debug log
		console.log(
			`Created ${this.type} cube at position (${x}, ${z}) with speed ${this.speed}`
		);
	}

	update(delta) {
		if (this.destroyed || !this.mesh) return;

		// Move cube towards player (down the platform)
		const moveDistance = this.speed * delta;
		this.mesh.position.z -= moveDistance;

		// Debug log to track cube movement
		if (Math.random() < 0.002) {
			console.log(
				`Cube at (${this.mesh.position.x.toFixed(
					2
				)}, ${this.mesh.position.z.toFixed(
					2
				)}) moving with distance ${moveDistance} (delta: ${delta})`
			);
			console.log(
				`  Original speed: ${this.game.settings.cubeSpeed}, Applied speed: ${this.speed}`
			);
		}

		// For advantage cubes, add a pulsing glow effect
		if (this.type === 'advantage' && this.mesh.material.emissiveIntensity) {
			const pulseIntensity =
				Math.sin(this.game.clock.elapsedTime * 3 + this.animationPhase) * 0.3 +
				0.6;
			this.mesh.material.emissiveIntensity = pulseIntensity;

			// Also pulse the edge highlight if it exists
			if (this.mesh.children.length > 0) {
				const edges = this.mesh.children[0];
				edges.material.color.setRGB(
					0,
					1 * pulseIntensity,
					0.5 * pulseIntensity
				);
			}
		}

		// For forbidden cubes, add a subtle warping effect
		if (this.type === 'forbidden') {
			const warpIntensity =
				Math.sin(this.game.clock.elapsedTime * 2 + this.animationPhase) * 0.02;
			this.mesh.scale.set(
				1 + warpIntensity,
				1 - warpIntensity,
				1 + warpIntensity
			);
		}

		// Check for collision with player
		this.checkPlayerCollision();
	}

	checkPlayerCollision() {
		if (this.destroyed || !this.mesh) return;

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
		if (this.destroyed || !this.mesh) return;

		this.destroyed = true;

		// Create more advanced destruction effect
		const particleCount = 30;
		const particles = [];

		// Create particle group
		const particleGroup = new THREE.Group();
		this.game.scene.add(particleGroup);

		// Determine particle color based on cube type
		let particleColor;
		switch (this.type) {
			case 'normal':
				particleColor = 0xffffff;
				break;
			case 'forbidden':
				particleColor = 0xff0000;
				break;
			case 'advantage':
				particleColor = 0x00ff00;
				break;
		}

		// Create multiple cube fragments
		for (let i = 0; i < particleCount; i++) {
			// Create smaller cube fragments with varying sizes
			const size = Math.random() * 0.2 + 0.05;
			const geometry = new THREE.BoxGeometry(size, size, size);
			const material = new THREE.MeshStandardMaterial({
				color: particleColor,
				emissive: particleColor,
				emissiveIntensity: 0.5,
				transparent: true,
				opacity: 1,
			});

			const particle = new THREE.Mesh(geometry, material);

			// Position particles within cube bounds
			particle.position.set(
				this.mesh.position.x + (Math.random() - 0.5) * 0.5,
				this.mesh.position.y + (Math.random() - 0.5) * 0.5,
				this.mesh.position.z + (Math.random() - 0.5) * 0.5
			);

			// Add random velocity
			particle.userData.velocity = new THREE.Vector3(
				(Math.random() - 0.5) * 2,
				Math.random() * 2 + 1,
				(Math.random() - 0.5) * 2
			);

			// Add random rotation
			particle.userData.rotation = new THREE.Vector3(
				Math.random() - 0.5,
				Math.random() - 0.5,
				Math.random() - 0.5
			)
				.normalize()
				.multiplyScalar(Math.random() * 0.1 + 0.05);

			particleGroup.add(particle);
			particles.push(particle);
		}

		// Animate particles
		const startTime = Date.now();
		const duration = 1000; // 1000ms

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = elapsed / duration;

			if (progress < 1) {
				// Update each particle
				for (const particle of particles) {
					// Apply velocity (with gravity)
					particle.position.x += particle.userData.velocity.x * 0.03;
					particle.position.y += particle.userData.velocity.y * 0.03;
					particle.position.z += particle.userData.velocity.z * 0.03;

					// Apply gravity
					particle.userData.velocity.y -= 0.05;

					// Apply rotation
					particle.rotation.x += particle.userData.rotation.x;
					particle.rotation.y += particle.userData.rotation.y;
					particle.rotation.z += particle.userData.rotation.z;

					// Fade out
					if (particle.material.opacity) {
						particle.material.opacity = 1 - progress;
					}
				}

				requestAnimationFrame(animate);
			} else {
				// Clean up
				this.game.scene.remove(particleGroup);
			}
		};

		animate();

		// Remove the cube
		this.game.scene.remove(this.mesh);
		this.mesh = null;

		// Debug log
		console.log(`Destroyed a ${this.type} cube`);
	}
}
