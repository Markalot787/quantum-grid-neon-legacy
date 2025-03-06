// Let THREE be globally loaded
// import * as THREE from 'three';

/**
 * Creates a simple humanoid figure with basic animations
 */
export class SimpleHumanoid {
	constructor(options = {}) {
		const {
			color = 0xffaa00,
			height = 0.6,
			width = 0.2,
			animationSpeed = 1.0,
		} = options;

		this.color = color;
		this.height = height;
		this.width = width;
		this.animationSpeed = animationSpeed;

		// Animation properties
		this.clock = new THREE.Clock();
		this.animationState = 'idle'; // 'idle', 'walking', 'running'
		this.walkingTime = 0;

		// Create the model
		this.model = this.createModel();

		// For animation purposes
		this.leftLeg = this.model.getObjectByName('leftLeg');
		this.rightLeg = this.model.getObjectByName('rightLeg');
		this.leftArm = this.model.getObjectByName('leftArm');
		this.rightArm = this.model.getObjectByName('rightArm');
		this.torso = this.model.getObjectByName('body');
		this.head = this.model.getObjectByName('head');

		// Animation properties
		this.direction = new THREE.Vector3(0, 0, 1); // Forward
		this.lastPosition = new THREE.Vector3();

		console.log('SimpleHumanoid created');
	}

	createModel() {
		const group = new THREE.Group();
		const material = new THREE.MeshLambertMaterial({ color: this.color });

		// Head
		const headGeometry = new THREE.SphereGeometry(this.width * 0.4, 8, 8);
		const head = new THREE.Mesh(headGeometry, material);
		head.position.y = this.height * 0.8;
		head.name = 'head';
		group.add(head);

		// Body
		const bodyGeometry = new THREE.CapsuleGeometry(
			this.width * 0.3,
			this.height * 0.3,
			8,
			8
		);
		const body = new THREE.Mesh(bodyGeometry, material);
		body.position.y = this.height * 0.5;
		body.name = 'body';
		group.add(body);

		// Arms
		const armGeometry = new THREE.CapsuleGeometry(
			this.width * 0.1,
			this.height * 0.3,
			8,
			8
		);

		const leftArm = new THREE.Mesh(armGeometry, material);
		leftArm.position.set(this.width * 0.4, this.height * 0.5, 0);
		leftArm.rotation.z = -Math.PI / 8;
		leftArm.name = 'leftArm';
		group.add(leftArm);

		const rightArm = new THREE.Mesh(armGeometry, material);
		rightArm.position.set(-this.width * 0.4, this.height * 0.5, 0);
		rightArm.rotation.z = Math.PI / 8;
		rightArm.name = 'rightArm';
		group.add(rightArm);

		// Legs
		const legGeometry = new THREE.CapsuleGeometry(
			this.width * 0.1,
			this.height * 0.3,
			8,
			8
		);

		const leftLeg = new THREE.Mesh(legGeometry, material);
		leftLeg.position.set(this.width * 0.2, this.height * 0.2, 0);
		leftLeg.name = 'leftLeg';
		group.add(leftLeg);

		const rightLeg = new THREE.Mesh(legGeometry, material);
		rightLeg.position.set(-this.width * 0.2, this.height * 0.2, 0);
		rightLeg.name = 'rightLeg';
		group.add(rightLeg);

		// Center the model
		group.position.y = this.height * 0.2;

		// Add shadows
		group.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.castShadow = true;
				object.receiveShadow = true;
			}
		});

		return group;
	}

	// Update animation based on the character's motion
	update(position) {
		const delta = this.clock.getDelta();

		// Determine if the character is moving
		if (position && this.lastPosition) {
			const movement = new THREE.Vector3().subVectors(
				position,
				this.lastPosition
			);
			const movementDistance = movement.length();

			if (movementDistance > 0.01) {
				// Character is moving - calculate direction
				movement.normalize();
				this.direction.copy(movement);

				// Set walking or running animation based on speed
				this.animationState = movementDistance > 0.1 ? 'running' : 'walking';

				// Face the direction of movement
				if (movement.x !== 0 || movement.z !== 0) {
					this.model.rotation.y = Math.atan2(movement.x, movement.z);
				}
			} else {
				this.animationState = 'idle';
			}

			// Store the position for next frame comparison
			this.lastPosition.copy(position);
		}

		// Animate based on state
		if (this.animationState === 'idle') {
			this.animateIdle(delta);
		} else if (this.animationState === 'walking') {
			this.animateWalking(delta, 1.0);
		} else if (this.animationState === 'running') {
			this.animateRunning(delta, 2.0); // Running is faster walking with more pronounced movements
		}
	}

	animateIdle(delta) {
		// Reset limbs to neutral position with subtle breathing motion
		const breathingSpeed = 1.5;
		const breathingAmount = 0.02;

		const breathOffset =
			Math.sin(this.walkingTime * breathingSpeed) * breathingAmount;

		this.walkingTime += delta;

		// Arms slightly swaying
		if (this.leftArm && this.rightArm) {
			this.leftArm.rotation.z = -Math.PI / 8 + breathOffset;
			this.rightArm.rotation.z = Math.PI / 8 - breathOffset;
		}

		// Legs steady
		if (this.leftLeg && this.rightLeg) {
			this.leftLeg.rotation.x = 0;
			this.rightLeg.rotation.x = 0;
		}

		// Subtle head and body movements
		if (this.head) {
			this.head.position.y = this.height * 0.8 + breathOffset * 0.5;
		}

		if (this.torso) {
			this.torso.position.y = this.height * 0.5 + breathOffset * 0.5;
		}
	}

	animateWalking(delta, speedMultiplier = 1.0) {
		const speed = 5.0 * this.animationSpeed * speedMultiplier;
		const legMax = Math.PI / 4;
		const armMax = Math.PI / 4;

		this.walkingTime += delta;

		// Calculate limb positions based on sine wave
		const legAngle = Math.sin(this.walkingTime * speed) * legMax;
		const armAngle = Math.sin(this.walkingTime * speed + Math.PI) * armMax; // Arms and legs opposite phase

		// Animate legs
		if (this.leftLeg && this.rightLeg) {
			this.leftLeg.rotation.x = legAngle;
			this.rightLeg.rotation.x = -legAngle;
		}

		// Animate arms
		if (this.leftArm && this.rightArm) {
			this.leftArm.rotation.x = armAngle;
			this.leftArm.rotation.z = -Math.PI / 8;

			this.rightArm.rotation.x = -armAngle;
			this.rightArm.rotation.z = Math.PI / 8;
		}

		// Subtle body movement for walking
		if (this.torso) {
			this.torso.position.y =
				this.height * 0.5 +
				Math.abs(Math.sin(this.walkingTime * speed * 2)) * 0.02;
			this.torso.rotation.z = Math.sin(this.walkingTime * speed) * 0.05;
		}

		// Head follows body motion
		if (this.head) {
			this.head.rotation.z = -Math.sin(this.walkingTime * speed) * 0.03;
		}
	}

	animateRunning(delta, speedMultiplier = 2.0) {
		const speed = 7.0 * this.animationSpeed * speedMultiplier; // Faster speed for running
		const legMax = Math.PI / 3; // More pronounced leg movement
		const armMax = Math.PI / 2.5; // More pronounced arm movement

		this.walkingTime += delta;

		// Calculate limb positions based on sine wave
		const legAngle = Math.sin(this.walkingTime * speed) * legMax;
		const armAngle = Math.sin(this.walkingTime * speed + Math.PI) * armMax; // Arms and legs opposite phase

		// Animate legs with more exaggerated movement
		if (this.leftLeg && this.rightLeg) {
			this.leftLeg.rotation.x = legAngle;
			this.rightLeg.rotation.x = -legAngle;

			// Add slight outward rotation when legs are forward
			this.leftLeg.rotation.y =
				Math.max(0, Math.sin(this.walkingTime * speed)) * 0.1;
			this.rightLeg.rotation.y =
				-Math.max(0, Math.sin(this.walkingTime * speed + Math.PI)) * 0.1;
		}

		// Animate arms with more exaggerated movement
		if (this.leftArm && this.rightArm) {
			this.leftArm.rotation.x = armAngle;
			this.leftArm.rotation.z = -Math.PI / 6; // More outward stance for running

			this.rightArm.rotation.x = -armAngle;
			this.rightArm.rotation.z = Math.PI / 6; // More outward stance for running
		}

		// More pronounced body movement for running
		if (this.torso) {
			// Bouncing motion
			this.torso.position.y =
				this.height * 0.5 +
				Math.abs(Math.sin(this.walkingTime * speed * 2)) * 0.03;

			// Leaning forward slightly while running
			this.torso.rotation.x = 0.1;

			// Side-to-side swaying
			this.torso.rotation.z = Math.sin(this.walkingTime * speed) * 0.07;
		}

		// Head follows body motion but more pronounced
		if (this.head) {
			this.head.rotation.x = -0.1; // Looking slightly ahead while running
			this.head.rotation.z = -Math.sin(this.walkingTime * speed) * 0.05;
		}
	}

	// Set character position
	setPosition(x, y, z) {
		// If no previous position set, initialize it
		if (!this.lastPosition.x && !this.lastPosition.y && !this.lastPosition.z) {
			this.lastPosition.set(x, y, z);
		}

		this.model.position.set(x, y, z);
	}

	// Get the Three.js group containing the character
	getModel() {
		return this.model;
	}
}
