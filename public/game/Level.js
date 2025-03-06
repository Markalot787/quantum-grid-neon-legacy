import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';
import { Cube } from './Cube.js';

export class Level {
	constructor(game) {
		this.game = game;
		this.platform = null;
		this.cubes = [];
		this.platformTiles = [];

		console.log('DEBUG - Level constructor called with settings:', {
			stageWidth: this.game.settings.stageWidth,
			stageLength: this.game.settings.stageLength,
		});

		this.init();
	}

	init() {
		console.log('DEBUG - Level init called');
		this.createPlatform();
		this.createInitialCubes();
	}

	createPlatform() {
		console.log('DEBUG - Level createPlatform called');

		const width = this.game.settings.stageWidth;
		const length = this.game.settings.stageLength;

		// Create a group to hold all platform tiles
		this.platform = new THREE.Group();
		this.game.scene.add(this.platform);

		// Create individual platform tiles
		for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
			for (let z = 0; z < length; z++) {
				// Create a cube for each tile
				const geometry = new THREE.BoxGeometry(1, 0.2, 1);
				const material = new THREE.MeshStandardMaterial({
					color: 0x444444,
					metalness: 0.3,
					roughness: 0.7,
				});

				const tile = new THREE.Mesh(geometry, material);
				tile.position.set(x, -0.1, z);
				tile.receiveShadow = true;

				// Add to platform group
				this.platform.add(tile);
				this.platformTiles.push(tile);
			}
		}
	}

	createInitialCubes() {
		const startZ = this.game.settings.stageLength - 1;
		const width = this.game.settings.stageWidth;

		// Create initial set of cubes
		for (let i = 0; i < this.game.settings.initialCubeCount; i++) {
			const x = Math.floor(Math.random() * width) - Math.floor(width / 2);
			const type = Math.random() < 0.2 ? 'advantage' : 'normal';
			const cube = new Cube(this.game, type, x, startZ + i);
			this.cubes.push(cube);
		}
	}

	update(delta) {
		// Update all cubes
		for (let i = this.cubes.length - 1; i >= 0; i--) {
			const cube = this.cubes[i];
			cube.update(delta);

			// Remove cubes that fall off
			if (cube.position.z < -1) {
				if (cube.type === 'normal') {
					console.log('DEBUG - Normal cube fell off edge');
				} else if (cube.type === 'advantage') {
					console.log('DEBUG - Advantage cube fell off edge');
				}
				this.removeCube(cube);
			}
		}

		// Create new cubes if needed
		if (this.cubes.length < this.game.settings.initialCubeCount) {
			const width = this.game.settings.stageWidth;
			const x = Math.floor(Math.random() * width) - Math.floor(width / 2);
			const type = Math.random() < 0.2 ? 'advantage' : 'normal';
			const cube = new Cube(
				this.game,
				type,
				x,
				this.game.settings.stageLength + 1
			);
			this.cubes.push(cube);
		}
	}

	removeCube(cube) {
		const index = this.cubes.indexOf(cube);
		if (index !== -1) {
			this.cubes.splice(index, 1);
			this.game.scene.remove(cube.mesh);
			cube.destroy();
		}
	}

	getCubesAtPosition(x, z) {
		return this.cubes.filter((cube) => {
			const dx = Math.abs(cube.position.x - x);
			const dz = Math.abs(cube.position.z - z);
			return dx < 0.5 && dz < 0.5;
		});
	}

	getRemainingCubes() {
		return this.cubes.length;
	}

	clearLevel() {
		while (this.cubes.length > 0) {
			this.removeCube(this.cubes[0]);
		}
	}
}
