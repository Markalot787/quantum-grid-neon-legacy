/**
 * Generates a grid texture canvas that can be used as a texture for the platform
 * This simulates the look of the original I.Q. Intelligent Qube game
 */
export function createGridTexture(
	color1 = '#333333',
	color2 = '#444444',
	gridSize = 512
) {
	// Create a canvas element
	const canvas = document.createElement('canvas');
	canvas.width = gridSize;
	canvas.height = gridSize;

	// Get the 2D context
	const ctx = canvas.getContext('2d');

	// Fill background with color1
	ctx.fillStyle = color1;
	ctx.fillRect(0, 0, gridSize, gridSize);

	// Draw grid lines
	ctx.fillStyle = color2;

	// The original I.Q. game had grid squares, so we need to make a grid pattern
	const tileSize = gridSize / 8; // 8x8 grid

	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			// Create checkerboard pattern
			if ((x + y) % 2 === 0) {
				ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
			}
		}
	}

	// Add a subtle grid line
	ctx.strokeStyle = '#555555';
	ctx.lineWidth = 2;

	for (let i = 0; i <= 8; i++) {
		const pos = i * tileSize;

		// Vertical lines
		ctx.beginPath();
		ctx.moveTo(pos, 0);
		ctx.lineTo(pos, gridSize);
		ctx.stroke();

		// Horizontal lines
		ctx.beginPath();
		ctx.moveTo(0, pos);
		ctx.lineTo(gridSize, pos);
		ctx.stroke();
	}

	console.log('Grid texture created');
	return canvas;
}
