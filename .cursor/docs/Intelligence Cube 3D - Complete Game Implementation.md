// Intelligence Cube 3D - Three.js Implementation
// Based on the classic I.Q.: Intelligent Qube game

// Intelligence Cube 3D - Implementation
// This code creates a Three.js version of the classic I.Q. Intelligent Qube game
// File structure:
// - index.html (main HTML file)
// - src/
// - main.js (entry point)
// - game/
// - Game.js (main game class)
// - Player.js (player entity)
// - Level.js (level generation)
// - Cube.js (cube entities)
// - UI.js (user interface)
// - PaymentModal.js (mock payment)

// To run with Node.js:
// 1. npm init -y
// 2. npm install express three
// 3. Create server.js file with:
/\*
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(\_\_dirname, 'public')));

// Create folder structure
// - public/
// - index.html
// - main.js
// - game/
// - Game.js
// - Player.js
// ... etc.

app.get('/', (req, res) => {
res.sendFile(path.join(\_\_dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

// index.html
const indexHtml = `

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intelligence Cube 3D</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        canvas {
            display: block;
        }
        #info {
            position: absolute;
            top: 10px;
            width: 100%;
            text-align: center;
            color: #fff;
            z-index: 100;
            pointer-events: none;
        }
        #score {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #fff;
            z-index: 100;
            pointer-events: none;
            font-size: 18px;
        }
        #level {
            position: absolute;
            top: 40px;
            left: 10px;
            color: #fff;
            z-index: 100;
            pointer-events: none;
            font-size: 18px;
        }
        #cubes-left {
            position: absolute;
            top: 70px;
            left: 10px;
            color: #fff;
            z-index: 100;
            pointer-events: none;
            font-size: 18px;
        }
        #controls {
            position: absolute;
            bottom: 10px;
            width: 100%;
            text-align: center;
            color: #fff;
            z-index: 100;
            pointer-events: none;
        }
        #payment-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
        }
        .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #fff;
            padding: 30px;
            border-radius: 5px;
            width: 400px;
            color: #333;
        }
        .modal-content h2 {
            margin-top: 0;
        }
        .modal-content button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
        }
        .modal-content .close {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 20px;
            cursor: pointer;
        }
        #gameOverScreen {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            color: white;
            text-align: center;
        }
        #gameOverScreen div {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        #gameOverScreen h1 {
            font-size: 42px;
            margin-bottom: 20px;
        }
        #gameOverScreen button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
            font-size: 18px;
        }
        #markedTile {
            position: absolute;
            bottom: 10px;
            right: 10px;
            color: #fff;
            z-index: 100;
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div id="info">Intelligence Cube 3D</div>
    <div id="score">Score: 0</div>
    <div id="level">Level: 1</div>
    <div id="cubes-left">Cubes: 0</div>
    <div id="markedTile">No tile marked</div>
    <div id="controls">
        <p>WASD to move | Space to mark/capture | R to activate advantage | ESC to pause</p>
    </div>
    <div id="payment-modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Upgrade to Continue Playing</h2>
            <p>You've reached the end of the free trial. Upgrade to the full version for just $2.99!</p>
            <p>Get access to all levels, characters, and special features!</p>
            <div>
                <button id="pay-button">Pay $2.99</button>
            </div>
        </div>
    </div>
    <div id="gameOverScreen">
        <div>
            <h1>Game Over</h1>
            <p id="finalScore">Your score: 0</p>
            <button id="restartButton">Play Again</button>
        </div>
    </div>

    <script type="module" src="main.js"></script>

</body>
</html>
`;

// main.js (Entry point)
const mainJs = `
import \* as THREE from 'three';
import { Game } from './game/Game.js';

// Initialize game
const game = new Game();
game.init();
game.animate();

// Export game instance for debugging
window.game = game;
`;

// Game.js (Main game class)
const gameJs = `
import \* as THREE from 'three';
import { Player } from './Player.js';
import { Level } from './Level.js';
import { UI } from './UI.js';
import { PaymentModal } from './PaymentModal.js';

export class Game {
constructor() {
this.scene = null;
this.camera = null;
this.renderer = null;
this.player = null;
this.level = null;
this.ui = null;
this.clock = new THREE.Clock();
this.score = 0;
this.currentLevel = 1;
this.gameStarted = false;
this.gameOver = false;
this.paymentModal = null;
this.playCount = 0;

        // Game state
        this.paused = false;
        this.markedTile = null;
        this.activatedAdvantage = null;

        // Settings
        this.settings = {
            stageWidth: 5,
            stageLength: 16,
            cubeSpeed: 2.0,
            initialCubeCount: 12
        };
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 8, -6);
        this.camera.lookAt(0, 0, 8);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Initialize components
        this.player = new Player(this);
        this.level = new Level(this);
        this.ui = new UI(this);

        // Create platform
        this.level.createPlatform();

        // Start first level
        this.startLevel(this.currentLevel);

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Initialize payment modal
        this.paymentModal = new PaymentModal(this);

        // Start game
        this.gameStarted = true;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleKeyDown(event) {
        if (this.gameOver) return;

        const key = event.key.toLowerCase();

        if (key === 'escape') {
            this.paused = !this.paused;
            return;
        }

        if (this.paused) return;

        // Player movement
        if (key === 'w' || key === 'arrowup') {
            this.player.move('forward');
        } else if (key === 's' || key === 'arrowdown') {
            this.player.move('backward');
        } else if (key === 'a' || key === 'arrowleft') {
            this.player.move('left');
        } else if (key === 'd' || key === 'arrowright') {
            this.player.move('right');
        }

        // Mark/Capture cube
        if (key === ' ') {
            if (this.markedTile) {
                this.captureCube();
            } else {
                this.markTile();
            }
        }

        // Activate advantage cube
        if (key === 'r') {
            this.activateAdvantage();
        }
    }

    markTile() {
        // Can only mark one tile at a time
        if (this.markedTile) return;

        // Get player position
        const position = this.player.getPosition();
        const x = position.x;
        const z = position.z;

        // Create marked tile
        const geometry = new THREE.BoxGeometry(1, 0.1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.5
        });

        const markedTileMesh = new THREE.Mesh(geometry, material);
        markedTileMesh.position.set(x, 0.05, z);
        this.scene.add(markedTileMesh);

        this.markedTile = {
            position: new THREE.Vector2(x, z),
            mesh: markedTileMesh
        };

        this.ui.updateMarkedTileStatus("Tile marked at " + Math.round(x) + ", " + Math.round(z));
    }

    captureCube() {
        if (!this.markedTile) return;

        // Check if there's a cube above the marked tile
        const cubesToCapture = this.level.getCubesAtPosition(
            this.markedTile.position.x,
            this.markedTile.position.y
        );

        if (cubesToCapture.length > 0) {
            // Process each cube at the marked position
            cubesToCapture.forEach(cube => {
                if (cube.type === 'normal') {
                    // Capture normal cube (good)
                    this.captureNormalCube(cube);
                } else if (cube.type === 'forbidden') {
                    // Capture forbidden cube (bad)
                    this.captureForbiddenCube(cube);
                } else if (cube.type === 'advantage') {
                    // Capture advantage cube (special)
                    this.captureAdvantageCube(cube);
                }
            });
        }

        // Remove marked tile
        this.scene.remove(this.markedTile.mesh);
        this.markedTile = null;
        this.ui.updateMarkedTileStatus("No tile marked");
    }

    captureNormalCube(cube) {
        // Add score
        this.score += 100;
        this.ui.updateScore(this.score);

        // Remove cube
        this.level.removeCube(cube);

        // Create capture effect
        this.createCaptureEffect(cube.mesh.position);
    }

    captureForbiddenCube(cube) {
        // Penalty for capturing forbidden cube
        this.level.shrinkPlatform();

        // Remove cube
        this.level.removeCube(cube);

        // Create capture effect (red color)
        this.createCaptureEffect(cube.mesh.position, 0xff0000);
    }

    captureAdvantageCube(cube) {
        // Set as active advantage
        this.activatedAdvantage = {
            position: new THREE.Vector2(
                cube.mesh.position.x,
                cube.mesh.position.z
            )
        };

        // Add score
        this.score += 50;
        this.ui.updateScore(this.score);

        // Remove cube
        this.level.removeCube(cube);

        // Create capture effect (green color)
        this.createCaptureEffect(cube.mesh.position, 0x00ff00);
    }

    activateAdvantage() {
        if (!this.activatedAdvantage) return;

        // Create 3x3 area effect
        const center = this.activatedAdvantage.position;
        const areaSize = 1;

        // Get all cubes in the 3x3 area
        const capturedCubes = [];

        for (let x = center.x - areaSize; x <= center.x + areaSize; x++) {
            for (let z = center.y - areaSize; z <= center.y + areaSize; z++) {
                const cubes = this.level.getCubesAtPosition(x, z);
                capturedCubes.push(...cubes);
            }
        }

        // Process each cube in the advantage area
        capturedCubes.forEach(cube => {
            if (cube.type === 'normal') {
                this.score += 100;
                this.level.removeCube(cube);
            } else if (cube.type === 'advantage') {
                this.score += 50;
                this.level.removeCube(cube);
            }
            // Don't capture forbidden cubes with advantage
        });

        // Create advantage effect
        this.createAdvantageEffect(
            new THREE.Vector3(center.x, 0.1, center.y),
            areaSize
        );

        // Update score
        this.ui.updateScore(this.score);

        // Reset advantage
        this.activatedAdvantage = null;
    }

    createCaptureEffect(position, color = 0x0099ff) {
        // Create effect
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7
        });

        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        this.scene.add(effect);

        // Animation for the effect
        const startScale = 1;
        const endScale = 2;
        const duration = 0.5;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = startScale + (endScale - startScale) * progress;
                effect.scale.set(scale, scale, scale);
                effect.material.opacity = 0.7 * (1 - progress);

                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
            }
        };

        animate();
    }

    createAdvantageEffect(position, size) {
        // Create effect
        const geometry = new THREE.BoxGeometry(size * 2 + 1, 0.5, size * 2 + 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });

        const effect = new THREE.Mesh(geometry, material);
        effect.position.copy(position);
        this.scene.add(effect);

        // Animation for the effect
        const startScale = 1;
        const endScale = 1.5;
        const duration = 1.0;
        let elapsed = 0;

        const animate = () => {
            elapsed += 0.016;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = startScale + (endScale - startScale) * progress;
                effect.scale.set(scale, scale, scale);
                effect.material.opacity = 0.5 * (1 - progress);

                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
            }
        };

        animate();
    }

    startLevel(levelNumber) {
        // Reset state
        this.markedTile = null;
        this.activatedAdvantage = null;

        // Configure level based on level number
        this.settings.cubeSpeed = 1.5 + (levelNumber * 0.25);
        this.settings.initialCubeCount = 10 + (levelNumber * 2);

        // Generate level
        this.level.generateLevel(levelNumber);

        // Reset player position
        this.player.resetPosition();

        // Update UI
        this.ui.updateLevel(levelNumber);
        this.ui.updateCubesLeft(this.level.getRemainingCubes());
    }

    nextLevel() {
        this.currentLevel++;

        // Check for payment after 7 plays
        this.playCount++;
        if (this.playCount >= 7) {
            this.paymentModal.show();
            return;
        }

        this.startLevel(this.currentLevel);
    }

    endGame() {
        this.gameOver = true;
        this.ui.showGameOver(this.score);
    }

    restart() {
        this.score = 0;
        this.currentLevel = 1;
        this.gameOver = false;

        // Clear existing level
        this.level.clearLevel();

        // Start new level
        this.startLevel(this.currentLevel);

        // Hide game over screen
        this.ui.hideGameOver();
    }

    update() {
        if (this.paused || this.gameOver) return;

        const delta = this.clock.getDelta();

        // Update level
        this.level.update(delta);

        // Check for level completion
        if (this.level.isLevelComplete()) {
            this.nextLevel();
        }

        // Check for game over
        if (this.level.isGameOver()) {
            this.endGame();
        }

        // Update UI
        this.ui.updateCubesLeft(this.level.getRemainingCubes());
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update game state
        this.update();

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

}
`;

// Cube.js
const cubeJs = `
import \* as THREE from 'three';

export class Cube {
constructor(game, type, x, z) {
this.game = game;
this.type = type; // 'normal', 'forbidden', or 'advantage'
this.size = 1;
this.mesh = null;

        // Create cube mesh
        this.createMesh(x, z);
    }

    createMesh(x, z) {
        const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
        let material;

        // Set material based on cube type
        switch(this.type) {
            case 'normal':
                material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
                break;
            case 'forbidden':
                material = new THREE.MeshLambertMaterial({ color: 0x000000 });
                break;
            case 'advantage':
                material = new THREE.MeshLambertMaterial({
                    color: 0x00ff00,
                    emissive: 0x003300
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
        const playerPos = this.game.player.getPosition();
        const cubePos = this.mesh.position;

        // Check if cube overlaps with player
        if (Math.abs(playerPos.x - cubePos.x) < 0.8 &&
            Math.abs(playerPos.z - cubePos.z) < 0.8) {
            // Player got crushed by cube
            this.game.endGame();
        }
    }

}
`;

// UI.js
const uiJs = `
export class UI {
constructor(game) {
this.game = game;
this.scoreElement = document.getElementById('score');
this.levelElement = document.getElementById('level');
this.cubesLeftElement = document.getElementById('cubes-left');
this.markedTileElement = document.getElementById('markedTile');
this.gameOverScreen = document.getElementById('gameOverScreen');
this.finalScoreElement = document.getElementById('finalScore');
this.restartButton = document.getElementById('restartButton');

        // Add event listeners
        this.restartButton.addEventListener('click', () => {
            this.game.restart();
        });
    }

    updateScore(score) {
        this.scoreElement.textContent = \`Score: \${score}\`;
    }

    updateLevel(level) {
        this.levelElement.textContent = \`Level: \${level}\`;
    }

    updateCubesLeft(count) {
        this.cubesLeftElement.textContent = \`Cubes: \${count}\`;
    }

    updateMarkedTileStatus(status) {
        this.markedTileElement.textContent = status;
    }

    showGameOver(score) {
        this.finalScoreElement.textContent = \`Your score: \${score}\`;
        this.gameOverScreen.style.display = 'block';
    }

    hideGameOver() {
        this.gameOverScreen.style.display = 'none';
    }

}
`;

// PaymentModal.js
const paymentModalJs = `
export class PaymentModal {
constructor(game) {
this.game = game;
this.modal = document.getElementById('payment-modal');
this.closeButton = document.querySelector('.close');
this.payButton = document.getElementById('pay-button');

        // Add event listeners
        this.closeButton.addEventListener('click', () => this.hide());
        this.payButton.addEventListener('click', () => this.processPayment());
    }

    show() {
        this.modal.style.display = 'block';
    }

    hide() {
        this.modal.style.display = 'none';
    }

    processPayment() {
        // Mock payment processing
        alert('Thank you for your purchase! Enjoy the full game!');

        // Hide modal
        this.hide();

        // Reset play count
        this.game.playCount = 0;

        // Continue to next level
        this.game.startLevel(this.game.currentLevel);
    }

}
`;

// Player.js
const playerJs = `
import \* as THREE from 'three';

export class Player {
constructor(game) {
this.game = game;
this.mesh = null;
this.position = {
x: 0,
z: 0
};
this.size = 0.3;
this.moveSpeed = 0.2;
this.lastMoveTime = 0;
this.moveCooldown = 150; // ms

        this.init();
    }

    init() {
        // Create player mesh
        const geometry = new THREE.CapsuleGeometry(this.size / 2, this.size, 2, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        // Position player
        this.resetPosition();

        // Add to scene
        this.game.scene.add(this.mesh);
    }

    resetPosition() {
        // Place player at the start of the platform
        const stageWidth = this.game.settings.stageWidth;
        const stageLength = this.game.settings.stageLength;

        this.position.x = 0;
        this.position.z = 1; // Near the start

        this.updateMeshPosition();
    }

    updateMeshPosition() {
        if (this.mesh) {
            this.mesh.position.set(
                this.position.x,
                this.size * 0.7, // Half height + small gap
                this.position.z
            );
        }
    }

    move(direction) {
        // Prevent rapid movement
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveCooldown) {
            return;
        }
        this.lastMoveTime = now;

        // Get current position
        const { x, z } = this.position;
        const stageWidth = this.game.settings.stageWidth;
        const stageLength = this.game.settings.stageLength;

        // Calculate new position based on direction
        let newX = x;
        let newZ = z;

        switch(direction) {
            case 'forward':
                newZ = z + 1;
                break;
            case 'backward':
                newZ = z - 1;
                break;
            case 'left':
                newX = x - 1;
                break;
            case 'right':
                newX = x + 1;
                break;
        }

        // Check boundaries
        const halfWidth = Math.floor(stageWidth / 2);
        if (newX < -halfWidth || newX > halfWidth) {
            return;
        }

        if (newZ < 0 || newZ >= stageLength) {
            return;
        }

        // Check if the platform exists at this position
        if (!this.game.level.isPlatformAt(newX, newZ)) {
            return;
        }

        // Move player
        this.position.x = newX;
        this.position.z = newZ;

        // Update mesh position
        this.updateMeshPosition();
    }

    getPosition() {
        return {
            x: this.position.x,
            z: this.position.z
        };
    }

}
`;

// Level.js
const levelJs = `
import \* as THREE from 'three';
import { Cube } from './Cube.js';

export class Level {
constructor(game) {
this.game = game;
this.platform = [];
this.cubes = [];
this.waveIndex = 0;
this.waveTime = 0;
this.wavesRemaining = 0;

        // Platform properties
        this.platformMesh = null;
        this.platformWidth = 0;
        this.platformLength = 0;

        // Level state
        this.levelComplete = false;
        this.gameOver = false;
    }

    createPlatform() {
        const width = this.game.settings.stageWidth;
        const length = this.game.settings.stageLength;

        // Store dimensions
        this.platformWidth = width;
        this.platformLength = length;

        // Create platform geometry
        const geometry = new THREE.BoxGeometry(width, 0.5, length);
        const material = new THREE.MeshLambertMaterial({ color: 0x444444 });

        // Create mesh
        this.platformMesh = new THREE.Mesh(geometry, material);
        this.platformMesh.position.set(0, -0.25, length / 2 - 0.5);
        this.platformMesh.receiveShadow = true;

        // Add to scene
        this.game.scene.add(this.platformMesh);

        // Create platform grid for gameplay
        this.platform = [];

        for (let x = -Math.floor(width / 2); x <= Math.floor(width / 2); x++) {
            for (let z = 0; z < length; z++) {
                this.platform.push({ x, z, exists: true });
            }
        }
    }

    generateLevel(levelNumber) {
        // Clear previous level
        this.clearLevel();

        // Calculate wave count based on level
        this.wavesRemaining = 2 + Math.min(levelNumber, 8);

        // Generate first wave
        this.generateWave();
    }

    generateWave() {
        if (this.wavesRemaining <= 0) {
            this.levelComplete = true;
            return;
        }

        this.wavesRemaining--;
        this.waveIndex++;

        // Wave properties based on level
        const cubeCount = this.game.settings.initialCubeCount;
        const width = this.game.settings.stageWidth;
        const level = this.game.currentLevel;

        // Calculate cube distribution
        let normalCount = Math.floor(cubeCount * 0.7);  // 70% normal
        let forbiddenCount = Math.floor(cubeCount * 0.2);  // 20% forbidden
        let advantageCount = Math.floor(cubeCount * 0.1);  // 10% advantage

        // Ensure at least one of each type (for higher levels)
        if (level >= 2 && forbiddenCount === 0) forbiddenCount = 1;
        if (level >= 3 && advantageCount === 0) advantageCount = 1;

        // Create cubes
        const startZ = this.platformLength + 2;  // Start beyond platform
        const halfWidth = Math.floor(width / 2);

        // Precalculate positions without duplicates
        const positions = [];
        for (let x = -halfWidth; x <= halfWidth; x++) {
            for (let z = startZ; z < startZ + 3; z++) {
                positions.push({ x, z });
            }
        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Place normal cubes
        for (let i = 0; i < normalCount && i < positions.length; i++) {
            const { x, z } = positions[i];
            this.createCube('normal', x, z);
        }

        // Place forbidden cubes
        for (let i = normalCount; i < normalCount + forbiddenCount && i < positions.length; i++) {
            const { x, z } = positions[i];
            this.createCube('forbidden', x, z);
        }

        // Place advantage cubes
        for (let i = normalCount + forbiddenCount; i < normalCount + forbiddenCount + advantageCount && i < positions.length; i++) {
            const { x, z } = positions[i];
            this.createCube('advantage', x, z);
        }
    }

    createCube(type, x, z) {
        const cube = new Cube(this.game, type, x, z);
        this.cubes.push(cube);
    }

    update(delta) {
        // Update cubes
        for (let i = this.cubes.length - 1; i >= 0; i--) {
            const cube = this.cubes[i];

            // Update cube
            cube.update(delta);

            // Check if cube fell off
            if (cube.mesh.position.z < -2) {
                // Handle cube falling off
                if (cube.type === 'normal') {
                    // Player missed a normal cube
                    // Potential penalty here
                }

                // Remove cube
                this.removeCube(cube);
            }
        }

        // Update wave timer
        this.waveTime += delta;

        // Generate new wave if needed
        if (this.cubes.length === 0 && this.wavesRemaining > 0) {
            this.generateWave();
        }
    }

    removeCube(cube) {
        // Remove from scene
        this.game.scene.remove(cube.mesh);

        // Remove from array
        const index = this.cubes.indexOf(cube);
        if (index !== -1) {
            this.cubes.splice(index, 1);
        }
    }

    clearLevel() {
        // Remove all cubes
        for (let i = this.cubes.length - 1; i >= 0; i--) {
            const cube = this.cubes[i];
            this.game.scene.remove(cube.mesh);
        }

        // Clear arrays
        this.cubes = [];

        // Reset state
        this.waveIndex = 0;
        this.waveTime = 0;
        this.levelComplete = false;
        this.gameOver = false;
    }

    shrinkPlatform() {
        // Shrink platform by removing a row
        const row = Math.max(0, this.platformLength - 1);

        // Remove cubes on that row
        for (let i = this.cubes.length - 1; i >= 0; i--) {
            const cube = this.cubes[i];
            if (Math.round(cube.mesh.position.z) === row) {
                this.removeCube(cube);
            }
        }

        // Update platform data
        for (let i = this.platform.length - 1; i >= 0; i--) {
            const tile = this.platform[i];
            if (tile.z === row) {
                tile.exists = false;
            }
        }

        // Check if player is affected
        const playerPos = this.game.player.getPosition();
        if (Math.round(playerPos.z) === row) {
            this.gameOver = true;
        }

        // Update platform mesh (visual)
        // For simplicity in the MVP, we just change the platform color
        this.platformMesh.material.color.set(0x333333);
    }

    isPlatformAt(x, z) {
        // Check if platform exists at this position
        for (const tile of this.platform) {
            if (tile.x === x && tile.z === z && tile.exists) {
                return true;
            }
        }
        return false;
    }

    getCubesAtPosition(x, z) {
        // Find all cubes at a specific position
        return this.cubes.filter(cube => {
            // Use approximate position to handle moving cubes
            const cubeX = Math.round(cube.mesh.position.x);
            const cubeZ = Math.round(cube.mesh.position.z);

            return cubeX === Math.round(x) && cubeZ === Math.round(z);
        });
    }

    getRemainingCubes() {
        return this.cubes.filter(cube => cube.type === 'normal').length;
    }

    isLevelComplete() {
        // Level is complete when all normal cubes are cleared
        // and there are no more waves
        return this.levelComplete ||
               (this.getRemainingCubes() === 0 && this.wavesRemaining === 0);
    }

    isGameOver() {
        return this.gameOver;
    }
