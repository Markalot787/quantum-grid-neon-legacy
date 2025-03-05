# Quantum Grid: Neon Legacy

A 3D puzzle game inspired by the classic PlayStation game I.Q.: Intelligent Qube. Control a character on a quantum platform and capture cubes before they fall off the edge.

> **Developer's Note**: This game is a "one shot" - a complete gaming experience built to showcase the core gameplay loop. Escape into a neon-infused world where strategy meets quick reflexes!

## Game Rules

- **Normal Cubes (Gray)**: Capture these before they fall off
- **Forbidden Cubes (Black)**: Do NOT capture these - they shrink your platform
- **Advantage Cubes (Green)**: Capture and use these to clear 3x3 areas

## Features

- Multiple levels with increasing difficulty
- Dynamic gameplay with three cube types
- Special effects for cube captures
- Score tracking and game progression
- Neon aesthetic with modern visuals
- Infinitely generated levels

## Controls

- **WASD or Arrow Keys**: Move player
- **Space**: Mark/capture cube
- **R**: Activate advantage cube (3x3 area clear)
- **ESC**: Pause game

## Installation

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/quantum-grid-neon-legacy.git
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the server:

   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Technologies Used

- Three.js for 3D rendering
- Express for serving the application
- Node.js as the runtime environment

## Game Strategy

1. Focus on capturing normal cubes while avoiding forbidden ones
2. Use advantage cubes strategically to clear areas with many normal cubes
3. Plan your movements carefully as the platform can shrink

## Project Structure

```
quantum-grid-neon-legacy/
├── package.json
├── server.js
└── public/
    ├── index.html
    ├── main.js
    └── game/
        ├── Game.js
        ├── Player.js
        ├── Level.js
        ├── Cube.js
        ├── UI.js
        └── PaymentModal.js
```
