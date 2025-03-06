import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

/**
 * Create a futuristic player model
 */
export function createPlayerModel(color = 0x00ffff, highlightColor = 0x88ffff) {
	const playerGroup = new THREE.Group();

	// Body
	const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
	const bodyMaterial = new THREE.MeshStandardMaterial({
		color: color,
		emissive: color,
		emissiveIntensity: 0.3,
		metalness: 0.8,
		roughness: 0.2,
	});
	const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
	body.position.y = 0.5;
	playerGroup.add(body);

	// Head
	const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
	const headMaterial = new THREE.MeshStandardMaterial({
		color: highlightColor,
		emissive: highlightColor,
		emissiveIntensity: 0.3,
		metalness: 0.9,
		roughness: 0.1,
	});
	const head = new THREE.Mesh(headGeometry, headMaterial);
	head.position.y = 1.0;
	playerGroup.add(head);

	// Visor
	const visorGeometry = new THREE.SphereGeometry(
		0.15,
		16,
		8,
		0,
		Math.PI * 2,
		0,
		Math.PI / 2
	);
	const visorMaterial = new THREE.MeshStandardMaterial({
		color: 0x0088ff,
		emissive: 0x0088ff,
		emissiveIntensity: 0.5,
		metalness: 0.0,
		roughness: 0.0,
		transparent: true,
		opacity: 0.8,
	});
	const visor = new THREE.Mesh(visorGeometry, visorMaterial);
	visor.rotation.x = -Math.PI / 2;
	visor.position.y = 1.0;
	visor.position.z = 0.1;
	playerGroup.add(visor);

	// Arms
	const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6);

	// Left Arm
	const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
	leftArm.position.set(-0.3, 0.6, 0);
	leftArm.rotation.z = Math.PI / 3;
	playerGroup.add(leftArm);

	// Right Arm
	const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
	rightArm.position.set(0.3, 0.6, 0);
	rightArm.rotation.z = -Math.PI / 3;
	playerGroup.add(rightArm);

	// Legs
	const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6);

	// Left Leg
	const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
	leftLeg.position.set(-0.15, 0.1, 0);
	playerGroup.add(leftLeg);

	// Right Leg
	const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
	rightLeg.position.set(0.15, 0.1, 0);
	playerGroup.add(rightLeg);

	// Energy Core
	const coreGeometry = new THREE.SphereGeometry(0.12, 8, 8);
	const coreMaterial = new THREE.MeshStandardMaterial({
		color: 0x00ffff,
		emissive: 0x00ffff,
		emissiveIntensity: 1.0,
		metalness: 0.0,
		roughness: 0.0,
	});
	const core = new THREE.Mesh(coreGeometry, coreMaterial);
	core.position.y = 0.5;
	core.position.z = 0.05;
	playerGroup.add(core);

	// Shoulder pads
	const shoulderGeometry = new THREE.SphereGeometry(
		0.15,
		8,
		8,
		0,
		Math.PI * 2,
		0,
		Math.PI / 2
	);

	// Left Shoulder
	const leftShoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
	leftShoulder.rotation.z = -Math.PI / 2;
	leftShoulder.rotation.y = -Math.PI / 2;
	leftShoulder.position.set(-0.3, 0.8, 0);
	playerGroup.add(leftShoulder);

	// Right Shoulder
	const rightShoulder = new THREE.Mesh(shoulderGeometry, bodyMaterial);
	rightShoulder.rotation.z = Math.PI / 2;
	rightShoulder.rotation.y = Math.PI / 2;
	rightShoulder.position.set(0.3, 0.8, 0);
	playerGroup.add(rightShoulder);

	// Add glow
	const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
	const glowMaterial = new THREE.MeshBasicMaterial({
		color: 0x00ffff,
		transparent: true,
		opacity: 0.2,
		side: THREE.BackSide,
	});
	const glow = new THREE.Mesh(glowGeometry, glowMaterial);
	glow.position.y = 0.5;
	glow.scale.set(2, 2, 2);
	playerGroup.add(glow);

	// Animation Mixer
	const mixer = new THREE.AnimationMixer(playerGroup);

	// Define animations

	// Idle animation
	const idleKeyframes = [
		{ time: 0, position: { y: 0 } },
		{ time: 1, position: { y: 0.05 } },
		{ time: 2, position: { y: 0 } },
	];

	const idleTrack = new THREE.KeyframeTrack(
		'.position[y]',
		idleKeyframes.map((kf) => kf.time),
		idleKeyframes.map((kf) => kf.position.y)
	);

	const idleClip = new THREE.AnimationClip('idle', 2, [idleTrack]);

	// Movement animation for arms and legs
	const movementKeyframes = {
		leftArm: [
			{ time: 0, rotation: { z: Math.PI / 3 } },
			{ time: 0.5, rotation: { z: Math.PI / 4 } },
			{ time: 1, rotation: { z: Math.PI / 3 } },
		],
		rightArm: [
			{ time: 0, rotation: { z: -Math.PI / 3 } },
			{ time: 0.5, rotation: { z: -Math.PI / 4 } },
			{ time: 1, rotation: { z: -Math.PI / 3 } },
		],
		leftLeg: [
			{ time: 0, rotation: { x: 0 } },
			{ time: 0.5, rotation: { x: 0.2 } },
			{ time: 1, rotation: { x: 0 } },
		],
		rightLeg: [
			{ time: 0, rotation: { x: 0 } },
			{ time: 0.5, rotation: { x: -0.2 } },
			{ time: 1, rotation: { x: 0 } },
		],
	};

	const leftArmTrack = new THREE.KeyframeTrack(
		'leftArm.rotation[z]',
		movementKeyframes.leftArm.map((kf) => kf.time),
		movementKeyframes.leftArm.map((kf) => kf.rotation.z)
	);

	const rightArmTrack = new THREE.KeyframeTrack(
		'rightArm.rotation[z]',
		movementKeyframes.rightArm.map((kf) => kf.time),
		movementKeyframes.rightArm.map((kf) => kf.rotation.z)
	);

	const leftLegTrack = new THREE.KeyframeTrack(
		'leftLeg.rotation[x]',
		movementKeyframes.leftLeg.map((kf) => kf.time),
		movementKeyframes.leftLeg.map((kf) => kf.rotation.x)
	);

	const rightLegTrack = new THREE.KeyframeTrack(
		'rightLeg.rotation[x]',
		movementKeyframes.rightLeg.map((kf) => kf.time),
		movementKeyframes.rightLeg.map((kf) => kf.rotation.x)
	);

	const movementClip = new THREE.AnimationClip('movement', 1, [
		leftArmTrack,
		rightArmTrack,
		leftLegTrack,
		rightLegTrack,
	]);

	// Store references to limbs for animation
	playerGroup.userData.leftArm = leftArm;
	playerGroup.userData.rightArm = rightArm;
	playerGroup.userData.leftLeg = leftLeg;
	playerGroup.userData.rightLeg = rightLeg;

	// Add animation clips
	playerGroup.userData.animations = {
		idle: idleClip,
		movement: movementClip,
	};

	playerGroup.userData.mixer = mixer;

	return playerGroup;
}

/**
 * Update player animations
 */
export function updatePlayerAnimations(player, delta, isMoving = false) {
	if (!player || !player.userData.mixer) return;

	player.userData.mixer.update(delta);
}
