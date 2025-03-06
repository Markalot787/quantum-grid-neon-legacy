import { THREE } from '../../threeImports.js';

/**
 * Programmatically generate a grid texture
 */
export function createGridTexture(
	renderer,
	width = 512,
	height = 512,
	gridSize = 10,
	primaryColor = 0x111122,
	secondaryColor = 0x0088aa,
	lineColor = 0x00ffff
) {
	// Create a canvas to draw the texture
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');

	// Fill background
	context.fillStyle = `#${primaryColor.toString(16).padStart(6, '0')}`;
	context.fillRect(0, 0, width, height);

	// Draw grid
	const cellWidth = width / gridSize;
	const cellHeight = height / gridSize;

	// Draw cells
	for (let x = 0; x < gridSize; x++) {
		for (let y = 0; y < gridSize; y++) {
			// Alternate cell colors in a checkerboard pattern
			if ((x + y) % 2 === 0) {
				context.fillStyle = `#${secondaryColor.toString(16).padStart(6, '0')}`;
				context.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
			}
		}
	}

	// Draw grid lines
	context.strokeStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
	context.lineWidth = 2;

	// Draw vertical lines
	for (let x = 0; x <= gridSize; x++) {
		context.beginPath();
		context.moveTo(x * cellWidth, 0);
		context.lineTo(x * cellWidth, height);
		context.stroke();
	}

	// Draw horizontal lines
	for (let y = 0; y <= gridSize; y++) {
		context.beginPath();
		context.moveTo(0, y * cellHeight);
		context.lineTo(width, y * cellHeight);
		context.stroke();
	}

	// Create a texture from the canvas
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	return texture;
}

export function createGlowTexture(renderer, radius = 256, color = 0x00ffff) {
	// Create a canvas to draw the texture
	const canvas = document.createElement('canvas');
	const size = radius * 2;
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');

	// Create gradient
	const gradient = context.createRadialGradient(
		radius,
		radius,
		0,
		radius,
		radius,
		radius
	);

	// Set gradient colors
	const hexColor = `#${color.toString(16).padStart(6, '0')}`;
	gradient.addColorStop(0, hexColor);
	gradient.addColorStop(0.5, hexColor + '80'); // 50% opacity
	gradient.addColorStop(1, hexColor + '00'); // 0% opacity

	// Draw gradient
	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);

	// Create a texture from the canvas
	const texture = new THREE.CanvasTexture(canvas);

	return texture;
}

export function createDigitalPatternTexture(
	renderer,
	width = 512,
	height = 512,
	baseColor = 0x0088aa,
	highlightColor = 0x00ffff
) {
	// Create a canvas to draw the texture
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');

	// Fill with base color
	context.fillStyle = `#${baseColor.toString(16).padStart(6, '0')}`;
	context.fillRect(0, 0, width, height);

	// Create digital pattern
	const cellSize = 16;
	const numCellsX = Math.ceil(width / cellSize);
	const numCellsY = Math.ceil(height / cellSize);

	// Function to determine if a cell should be highlighted
	const shouldHighlight = (x, y) => {
		return Math.random() < 0.15; // 15% chance of being highlighted
	};

	// Draw digital cells
	context.fillStyle = `#${highlightColor.toString(16).padStart(6, '0')}`;
	for (let x = 0; x < numCellsX; x++) {
		for (let y = 0; y < numCellsY; y++) {
			if (shouldHighlight(x, y)) {
				// Draw digital cell patterns (small squares, lines, etc.)
				const patternType = Math.floor(Math.random() * 5);
				const cellX = x * cellSize;
				const cellY = y * cellSize;

				switch (patternType) {
					case 0: // Square
						context.fillRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
						break;
					case 1: // Circle
						context.beginPath();
						context.arc(
							cellX + cellSize / 2,
							cellY + cellSize / 2,
							cellSize / 3,
							0,
							Math.PI * 2
						);
						context.fill();
						break;
					case 2: // Horizontal line
						context.fillRect(cellX, cellY + cellSize / 2 - 1, cellSize, 2);
						break;
					case 3: // Vertical line
						context.fillRect(cellX + cellSize / 2 - 1, cellY, 2, cellSize);
						break;
					case 4: // Dot
						context.fillRect(
							cellX + cellSize / 2 - 2,
							cellY + cellSize / 2 - 2,
							4,
							4
						);
						break;
				}
			}
		}
	}

	// Create a texture from the canvas
	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	return texture;
}
