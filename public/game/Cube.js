import { THREE } from '../threeImports.js';

export class Cube {
	constructor(game, type, x, z) {
		this.game = game;
		this.type = type; // 'normal', 'forbidden', or 'advantage'
		this.size = 1;
		this.mesh = null;
		this.glowMesh = null;
		this.animations = [];

		// Create cube mesh
		this.createMesh(x, z);
	}

	createMesh(x, z) {
		// Create geometry with slight bevel
		const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);

		// Create materials based on cube type
		let material;
		let glowColor;

		switch (this.type) {
			case 'normal':
				material = new THREE.MeshStandardMaterial({
					color: 0x888888,
					metalness: 0.7,
					roughness: 0.2,
					envMap: this.game.envMap || null,
					emissive: 0x222222,
					emissiveIntensity: 0.2,
				});
				glowColor = null; // No glow for normal cubes
				break;
			case 'forbidden':
				material = new THREE.MeshStandardMaterial({
					color: 0x000000,
					metalness: 0.9,
					roughness: 0.1,
					envMap: this.game.envMap || null,
					emissive: 0xff0000,
					emissiveIntensity: 0.2,
				});
				glowColor = 0xff0000; // Red glow
				break;
			case 'advantage':
				material = new THREE.MeshStandardMaterial({
					color: 0x00ff88,
					metalness: 0.8,
					roughness: 0.2,
					envMap: this.game.envMap || null,
					emissive: 0x00ff88,
					emissiveIntensity: 0.5,
				});
				glowColor = 0x00ff88; // Green glow
				break;
		}

		// Create mesh
		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.position.set(x, this.size / 2, z);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;

		// Add glow effect for special cubes
		if (glowColor) {
			this.addGlowEffect(glowColor);
		}

		// Add to scene
		this.game.scene.add(this.mesh);

		// Add random rotation for visual interest
		if (this.type === 'advantage') {
			this.addRotationAnimation();
		}

		// Add floating animation for advantage cubes
		if (this.type === 'advantage') {
			this.addFloatingAnimation();
		}
	}

	addGlowEffect(color) {
		// Create slightly larger mesh with glow material
		const glowGeometry = new THREE.BoxGeometry(
			this.size * 1.1,
			this.size * 1.1,
			this.size * 1.1
		);
		const glowMaterial = new THREE.MeshBasicMaterial({
			color: color,
			transparent: true,
			opacity: 0.4,
			side: THREE.BackSide,
		});

		this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
		this.mesh.add(this.glowMesh);

		// Add pulse animation to glow
		if (this.type === 'advantage') {
			this.addPulseAnimation();
		}
	}

	addRotationAnimation() {
		// Only for advantage cubes - slow rotation
		const rotationSpeed = {
			x: Math.random() * 0.5 - 0.25,
			y: Math.random() * 0.5,
			z: Math.random() * 0.5 - 0.25,
		};

		this.animations.push({
			type: 'rotation',
			update: (delta) => {
				this.mesh.rotation.x += rotationSpeed.x * delta;
				this.mesh.rotation.y += rotationSpeed.y * delta;
				this.mesh.rotation.z += rotationSpeed.z * delta;
			},
		});
	}

	addFloatingAnimation() {
		// Floating animation for advantage cubes
		const startY = this.mesh.position.y;
		const floatHeight = 0.2;
		const floatCycle = Math.random() * Math.PI * 2; // Random start phase
		const floatSpeed = 1.0 + Math.random() * 0.5; // Slightly random speed

		this.animations.push({
			type: 'float',
			data: {
				startY,
				floatCycle,
				elapsedTime: 0,
			},
			update: (delta) => {
				const data = this.animations[this.animations.length - 1].data;
				data.elapsedTime += delta;

				// Sine wave floating motion
				const newY =
					startY +
					Math.sin(data.elapsedTime * floatSpeed + floatCycle) * floatHeight;
				this.mesh.position.y = newY;
			},
		});
	}

	addPulseAnimation() {
		// Pulsing animation for the glow effect
		const pulseCycle = Math.random() * Math.PI * 2; // Random start phase
		const pulseSpeed = 2.0 + Math.random() * 1.0; // Slightly random speed

		this.animations.push({
			type: 'pulse',
			data: {
				pulseCycle,
				elapsedTime: 0,
				baseOpacity: 0.4,
			},
			update: (delta) => {
				if (!this.glowMesh) return;

				const data = this.animations[this.animations.length - 1].data;
				data.elapsedTime += delta;

				// Sine wave opacity pulsing
				const newOpacity =
					data.baseOpacity +
					Math.sin(data.elapsedTime * pulseSpeed + pulseCycle) * 0.2;
				this.glowMesh.material.opacity = newOpacity;
			},
		});
	}

	update(delta) {
		// Move cube towards player
		const speed = this.game.settings.cubeSpeed * delta;
		this.mesh.position.z -= speed;

		// Check for collision with player
		this.checkPlayerCollision();

		// Update animations
		for (const animation of this.animations) {
			if (animation.update) {
				animation.update(delta);
			}
		}
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
