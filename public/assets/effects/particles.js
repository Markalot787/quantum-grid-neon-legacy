import { THREE } from '../../threeImports.js';

/**
 * Create a particle system for cube capture effect
 */
export function createCaptureParticles(color = 0x00ffff, particleCount = 50) {
	// Create particle geometry
	const particles = new THREE.BufferGeometry();
	const positions = new Float32Array(particleCount * 3);
	const velocities = []; // Store velocities separately for animation

	// Set initial particle positions (all at center)
	for (let i = 0; i < particleCount; i++) {
		const i3 = i * 3;
		positions[i3] = 0;
		positions[i3 + 1] = 0;
		positions[i3 + 2] = 0;

		// Random velocity direction for each particle
		velocities.push({
			x: (Math.random() - 0.5) * 5,
			y: Math.random() * 3 + 2,
			z: (Math.random() - 0.5) * 5,
		});
	}

	particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	// Create particle material
	const particleMaterial = new THREE.PointsMaterial({
		color: color,
		size: 0.1,
		transparent: true,
		opacity: 0.8,
		blending: THREE.AdditiveBlending,
		sizeAttenuation: true,
	});

	// Create particle system
	const particleSystem = new THREE.Points(particles, particleMaterial);

	// Store velocities in userData for animation
	particleSystem.userData.velocities = velocities;
	particleSystem.userData.initialPositions = positions.slice(); // Clone initial positions
	particleSystem.userData.elapsed = 0;
	particleSystem.userData.active = false;

	return particleSystem;
}

/**
 * Update particle system animation
 */
export function updateParticles(particleSystem, delta) {
	if (!particleSystem || !particleSystem.userData.active) return;

	const positions = particleSystem.geometry.attributes.position.array;
	const velocities = particleSystem.userData.velocities;
	const gravity = -9.8; // Apply gravity to particles

	particleSystem.userData.elapsed += delta;

	// Update each particle position based on velocity
	for (let i = 0; i < velocities.length; i++) {
		const i3 = i * 3;

		// Update position based on velocity
		positions[i3] += velocities[i].x * delta;
		positions[i3 + 1] += velocities[i].y * delta;
		positions[i3 + 2] += velocities[i].z * delta;

		// Apply gravity to y velocity
		velocities[i].y += gravity * delta;
	}

	// Update geometry
	particleSystem.geometry.attributes.position.needsUpdate = true;

	// Update opacity based on elapsed time
	particleSystem.material.opacity = Math.max(
		0,
		1 - particleSystem.userData.elapsed * 2
	);

	// Deactivate after 0.5 seconds
	if (particleSystem.userData.elapsed > 0.5) {
		particleSystem.userData.active = false;
		particleSystem.visible = false;
	}
}

/**
 * Reset and activate particle system at position
 */
export function triggerParticles(particleSystem, position, color = null) {
	if (!particleSystem) return;

	const positions = particleSystem.geometry.attributes.position.array;

	// Reset particles to new position
	for (let i = 0; i < positions.length / 3; i++) {
		const i3 = i * 3;
		positions[i3] = position.x;
		positions[i3 + 1] = position.y;
		positions[i3 + 2] = position.z;
	}

	// Reset elapsed time
	particleSystem.userData.elapsed = 0;

	// Activate the particle system
	particleSystem.userData.active = true;
	particleSystem.visible = true;

	// Update color if provided
	if (color) {
		particleSystem.material.color.set(color);
	}

	// Update geometry
	particleSystem.geometry.attributes.position.needsUpdate = true;
}

/**
 * Create trail particles that follow the player
 */
export function createTrailParticles(color = 0x00ffff, particleCount = 50) {
	// Create particle geometry
	const particles = new THREE.BufferGeometry();
	const positions = new Float32Array(particleCount * 3);
	const ages = new Float32Array(particleCount);

	// Set initial particle positions (all at center)
	for (let i = 0; i < particleCount; i++) {
		const i3 = i * 3;
		positions[i3] = 0;
		positions[i3 + 1] = 0;
		positions[i3 + 2] = 0;
		ages[i] = 1.0; // Start with full age (dead)
	}

	particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	// Create particle material
	const particleMaterial = new THREE.PointsMaterial({
		color: color,
		size: 0.05,
		transparent: true,
		opacity: 0.6,
		blending: THREE.AdditiveBlending,
		sizeAttenuation: true,
	});

	// Create particle system
	const particleSystem = new THREE.Points(particles, particleMaterial);

	// Store additional data in userData
	particleSystem.userData.ages = ages;
	particleSystem.userData.nextParticle = 0;
	particleSystem.userData.maxAge = 2.0; // 2 seconds lifetime

	return particleSystem;
}

/**
 * Update trail particles
 */
export function updateTrailParticles(particleSystem, delta, position) {
	if (!particleSystem) return;

	const positions = particleSystem.geometry.attributes.position.array;
	const ages = particleSystem.userData.ages;
	const maxAge = particleSystem.userData.maxAge;

	// Update ages for all particles
	for (let i = 0; i < ages.length; i++) {
		if (ages[i] < maxAge) {
			ages[i] += delta;
		}
	}

	// Add new particle at current position
	if (position) {
		const nextParticle = particleSystem.userData.nextParticle;
		const i3 = nextParticle * 3;

		positions[i3] = position.x;
		positions[i3 + 1] = position.y;
		positions[i3 + 2] = position.z;

		ages[nextParticle] = 0; // Reset age

		// Move to next particle slot
		particleSystem.userData.nextParticle = (nextParticle + 1) % ages.length;
	}

	// Update opacity based on age
	for (let i = 0; i < ages.length; i++) {
		const i3 = i * 3;
		const normalizedAge = Math.min(ages[i] / maxAge, 1.0);

		// Make particles fall down and fade out as they age
		if (ages[i] < maxAge) {
			positions[i3 + 1] -= delta * 0.1; // Slight downward drift
		}
	}

	// Update geometry
	particleSystem.geometry.attributes.position.needsUpdate = true;
}

/**
 * Create a particle system for advantage area effect
 */
export function createAdvantageAreaParticles(color = 0x00ff00, size = 3) {
	// Create particle geometry with a grid pattern
	const particleCount = size * size * 4; // Points around the perimeter
	const particles = new THREE.BufferGeometry();
	const positions = new Float32Array(particleCount * 3);

	// Calculate half size for positioning
	const halfSize = size / 2;

	// Set particles in a grid pattern around the perimeter
	let index = 0;

	// Top and bottom edges
	for (let x = -halfSize; x <= halfSize; x += 0.25) {
		// Top edge
		positions[index++] = x;
		positions[index++] = 0.1;
		positions[index++] = -halfSize;

		// Bottom edge
		positions[index++] = x;
		positions[index++] = 0.1;
		positions[index++] = halfSize;
	}

	// Left and right edges
	for (let z = -halfSize; z <= halfSize; z += 0.25) {
		// Left edge
		positions[index++] = -halfSize;
		positions[index++] = 0.1;
		positions[index++] = z;

		// Right edge
		positions[index++] = halfSize;
		positions[index++] = 0.1;
		positions[index++] = z;
	}

	particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	// Create particle material
	const particleMaterial = new THREE.PointsMaterial({
		color: color,
		size: 0.08,
		transparent: true,
		opacity: 0.7,
		blending: THREE.AdditiveBlending,
		sizeAttenuation: true,
	});

	// Create particle system
	const particleSystem = new THREE.Points(particles, particleMaterial);

	// Add animation data
	particleSystem.userData.elapsed = 0;
	particleSystem.userData.duration = 1.0;
	particleSystem.userData.active = false;

	return particleSystem;
}

/**
 * Update advantage area particles
 */
export function updateAdvantageAreaParticles(particleSystem, delta) {
	if (!particleSystem || !particleSystem.userData.active) return;

	particleSystem.userData.elapsed += delta;

	// Calculate animation progress
	const progress =
		particleSystem.userData.elapsed / particleSystem.userData.duration;

	// Animate the particles (pulsing effect)
	const pulseFactor = Math.sin(progress * Math.PI * 2) * 0.5 + 1.0;
	particleSystem.material.size = 0.08 * pulseFactor;

	// Fade out at the end
	if (progress > 0.7) {
		particleSystem.material.opacity = 0.7 * (1 - (progress - 0.7) / 0.3);
	}

	// Deactivate after duration is complete
	if (progress >= 1.0) {
		particleSystem.userData.active = false;
		particleSystem.visible = false;
	}
}

/**
 * Trigger advantage area particles at position
 */
export function triggerAdvantageAreaParticles(particleSystem, position) {
	if (!particleSystem) return;

	// Move particles to position
	particleSystem.position.copy(position);

	// Reset and activate
	particleSystem.userData.elapsed = 0;
	particleSystem.userData.active = true;
	particleSystem.visible = true;
}
