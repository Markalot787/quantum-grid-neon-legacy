/**
 * Create a gradient skybox texture
 */
export function createGradientSkybox(
	renderer,
	topColor = 0x000000,
	bottomColor = 0x000066,
	sideColor = 0x000033
) {
	// Create canvas for each face
	const size = 1024;
	const textures = [];

	// Create texture for each face of the cube (top, bottom, front, back, left, right)
	// Top face (top to center gradient)
	textures.push(createGradientTexture(topColor, sideColor, 'vertical', size));

	// Bottom face (bottom to center gradient)
	textures.push(
		createGradientTexture(bottomColor, sideColor, 'vertical-reverse', size)
	);

	// Front, back, left, right faces (all have same gradient pattern)
	for (let i = 0; i < 4; i++) {
		textures.push(
			createGradientTexture(topColor, bottomColor, 'vertical', size)
		);
	}

	return textures;
}

/**
 * Create a digital skybox texture with animated grid lines and patterns
 */
export function createDigitalSkybox(
	renderer,
	baseColor = 0x000033,
	lineColor = 0x003366,
	highlightColor = 0x0088aa
) {
	// Create canvas for each face
	const size = 1024;
	const textures = [];

	// Create texture for each face of the cube
	for (let i = 0; i < 6; i++) {
		textures.push(
			createDigitalTexture(baseColor, lineColor, highlightColor, size)
		);
	}

	return textures;
}

// Helper function to create a gradient texture
function createGradientTexture(
	colorStart,
	colorEnd,
	direction = 'vertical',
	size = 1024
) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');

	const startColorHex = '#' + colorStart.toString(16).padStart(6, '0');
	const endColorHex = '#' + colorEnd.toString(16).padStart(6, '0');

	let gradient;

	if (direction === 'vertical') {
		gradient = context.createLinearGradient(0, 0, 0, size);
	} else if (direction === 'vertical-reverse') {
		gradient = context.createLinearGradient(0, size, 0, 0);
	} else if (direction === 'horizontal') {
		gradient = context.createLinearGradient(0, 0, size, 0);
	} else if (direction === 'radial') {
		gradient = context.createRadialGradient(
			size / 2,
			size / 2,
			0,
			size / 2,
			size / 2,
			size / 2
		);
	}

	gradient.addColorStop(0, startColorHex);
	gradient.addColorStop(1, endColorHex);

	context.fillStyle = gradient;
	context.fillRect(0, 0, size, size);

	// Add some subtle stars to the texture
	if (colorStart === 0x000000 || colorEnd === 0x000000) {
		addStars(context, size);
	}

	const texture = new THREE.CanvasTexture(canvas);
	return texture;
}

// Helper function to create a digital pattern texture for the skybox
function createDigitalTexture(
	baseColor,
	lineColor,
	highlightColor,
	size = 1024
) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');

	// Fill with base color
	context.fillStyle = '#' + baseColor.toString(16).padStart(6, '0');
	context.fillRect(0, 0, size, size);

	// Draw grid lines
	const gridSize = 32;
	const lineColorHex = '#' + lineColor.toString(16).padStart(6, '0');
	context.strokeStyle = lineColorHex;
	context.lineWidth = 1;

	// Draw vertical and horizontal grid lines
	for (let i = 0; i <= size; i += gridSize) {
		// Vertical line
		context.beginPath();
		context.moveTo(i, 0);
		context.lineTo(i, size);
		context.stroke();

		// Horizontal line
		context.beginPath();
		context.moveTo(0, i);
		context.lineTo(size, i);
		context.stroke();
	}

	// Add some digital highlights
	const highlightColorHex = '#' + highlightColor.toString(16).padStart(6, '0');
	context.fillStyle = highlightColorHex;

	for (let i = 0; i < 100; i++) {
		const x = Math.floor(Math.random() * size);
		const y = Math.floor(Math.random() * size);
		const width = Math.floor(Math.random() * 3 + 1) * gridSize;
		const height = Math.floor(Math.random() * 3 + 1) * gridSize;

		// Only highlight grid intersections
		const gridX = Math.floor(x / gridSize) * gridSize;
		const gridY = Math.floor(y / gridSize) * gridSize;

		// Randomly draw different digital patterns
		const pattern = Math.floor(Math.random() * 5);
		switch (pattern) {
			case 0: // Single dot
				context.fillRect(
					gridX + gridSize / 2 - 2,
					gridY + gridSize / 2 - 2,
					4,
					4
				);
				break;
			case 1: // Small square
				context.fillRect(gridX + 2, gridY + 2, gridSize - 4, gridSize - 4);
				break;
			case 2: // Cross
				context.fillRect(gridX, gridY + gridSize / 2 - 1, gridSize, 2);
				context.fillRect(gridX + gridSize / 2 - 1, gridY, 2, gridSize);
				break;
			case 3: // Circle
				context.beginPath();
				context.arc(
					gridX + gridSize / 2,
					gridY + gridSize / 2,
					gridSize / 3,
					0,
					Math.PI * 2
				);
				context.fill();
				break;
			case 4: // Line
				const vertical = Math.random() > 0.5;
				if (vertical) {
					context.fillRect(gridX + gridSize / 2 - 1, gridY, 2, gridSize * 3);
				} else {
					context.fillRect(gridX, gridY + gridSize / 2 - 1, gridSize * 3, 2);
				}
				break;
		}
	}

	// Add some stars
	addStars(context, size);

	const texture = new THREE.CanvasTexture(canvas);
	return texture;
}

// Helper function to add stars to the texture
function addStars(context, size) {
	context.fillStyle = '#ffffff';

	// Different star sizes
	const starSizes = [1, 1, 1, 1, 2, 2, 3];

	// Add stars (more near the top, fewer at the bottom for a space feel)
	for (let i = 0; i < 300; i++) {
		const x = Math.random() * size;
		const y = Math.random() * size;
		const sizeFactor = Math.pow(Math.random(), 3); // More small stars than large ones
		const starSize = starSizes[Math.floor(sizeFactor * starSizes.length)];

		// Larger stars get a subtle glow
		if (starSize > 1) {
			context.globalAlpha = 0.3;
			context.beginPath();
			context.arc(x, y, starSize + 2, 0, Math.PI * 2);
			context.fill();
			context.globalAlpha = 1.0;
		}

		context.beginPath();
		context.arc(x, y, starSize, 0, Math.PI * 2);
		context.fill();
	}
}
