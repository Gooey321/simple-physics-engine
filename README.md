# Physics Engine

A custom *slightly buggy* physics engine built from scratch for simulating basic physical interactions between objects. Like making a platformer game

## Features
### *Warning collisions from underneath 

- Basic collision detection and response
- Gravity and friction simulation
- Player control with keyboard input
- Simple rendering of objects on a canvas
- Adding rectangles of various sizes to the canvas 

## Getting Started

### Prerequisites

- A modern web browser

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/physics-engine.git
    ```
2. Navigate to the project directory:
    ```sh
    cd physics-engine
    ```

### Usage

1. Open `index.html` in your web browser to start the simulation.

### Controls

- `ArrowLeft`: Move player left
- `ArrowRight`: Move player right
- `ArrowUp`: Jump

## Code Overview

### Main Files

- `index.html`: The main HTML file that includes the script.
- `physics.js`: Contains the physics engine logic and rendering code.

### How To Use
- Down the bottom of the physics.js file there is a list of physical objects named simarly to this: physicalObjects.push(new PhysicalObject(x, y, w, h, mass, isStatic, isPlayer)); copy and paste or delete lines to add or remove objects. You can customize the values to get different sizes

### Key Functions

- `frameRenderLoop()`: The main render loop that updates and draws each frame.
- `frameRender()`: Clears the canvas and renders all physical objects.
- `handleCollision(objA, objB)`: Handles collision response between two objects.
- `PhysicalObject`: Class representing a physical object in the simulation.

## License

This project is licensed under the MIT License.