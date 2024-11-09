document.addEventListener("DOMContentLoaded", function() {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    var win = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        width = win.innerWidth || e.clientWidth || g.clientWidth,
        height = win.innerHeight || e.clientHeight || g.clientHeight;
        
    // Initialise an array to hold the physical objects
    let physicalObjects = [];

    // Set gravity variable
    let gravity = 0.3;

    // Set friction variable
    let friction = 0.1;

    let rainbowColors = [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3'  // Violet
    ];
    let colorIndex = 0;

    // Initialise the canvas element and set its width and height
    let canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = width;
        canvas.height = height;
        canvas.style.border = "1px solid black"; // Added border for visibility
    
    // Append the canvas element to the HTML body
    document.body.appendChild(canvas);
    
    // Get the canvas's context object
    let context = canvas.getContext("2d");

    // Add after canvas initialization but before the game loop:
    canvas.addEventListener('click', function(event) {
        // Get click coordinates relative to canvas
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Create new cube at click location
        const newCube = new PhysicalObject(
            clickX - 10, // Offset by half width to center at click
            clickY - 10, // Offset by half height to center at click
            30, // Width
            30, // Height
            2,  // Mass
            false, // Not static
            rainbowColors[colorIndex] // Color
        );
        
        // Add to physics objects
        physicalObjects.push(newCube);
        colorIndex = (colorIndex + 1) % rainbowColors.length;
    });

    // PhysicalObject class
    let PhysicalObject = function(x, y, w, h, mass, isStatic, color) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.width = w;
        this.height = h;
        this.mass = mass;
        this.isStatic = isStatic;
        this.isOnGround = false;
        this.color = color;

        this.ax = 0;
        this.ay = 0; 
        this.vx = 0; 
        this.vy = 0; 

        // Apply force to the object
        this.applyForce = function(fx, fy) {
            if (!this.isStatic) {
                this.ax += fx / this.mass;
                this.ay += fy / this.mass;
            }
        };

        // Update object's position based on velocity
        this.update = function() {
            if (!this.isStatic) {

                let tempX = this.x;
                let tempY = this.y;

                // Calculate current velocities
                this.vx = this.x - this.prevX;
                this.vy = this.y - this.prevY;

                // Apply gravity as a force
                this.ay += gravity;

                if (this.isOnGround) {
                    let frictionForce = -this.vx * friction;
                    this.applyForce(frictionForce, 0);
                }
            
                let nextX = 2 * this.x - this.prevX + this.ax;
                let nextY = 2 * this.y - this.prevY + this.ay;

                this.prevX = this.x;
                this.prevY = this.y;

                this.x = nextX;
                this.y = nextY;

                this.ax = 0;
                this.ay = 0;
            }
        };

        // Collision detection
        this.isCollidingWith = function(other) {
            return this.x < other.x + other.width &&
                   this.x + this.width > other.x &&
                   this.y < other.y + other.height &&
                   this.y + this.height > other.y;
        };
    };

    // Render each frame
    function frameRender() {
        // Clear the canvas
        context.clearRect(0, 0, width, height);

        // Update and draw each object
        for (let i = 0; i < physicalObjects.length; i++) {
            let obj = physicalObjects[i];
            obj.update();

            // Draw the object    
            context.fillStyle = obj.isStatic ? "black" : obj.color;
            context.fillRect(obj.x, obj.y, obj.width, obj.height);
        }

        // Reset isOnGround for all non-static objects
        physicalObjects.forEach(obj => {
            if (!obj.isStatic) {
                obj.isOnGround = false;
            }
        });

        // Handle collisions
        for (let i = 0; i < physicalObjects.length; i++) {
            for (let j = i + 1; j < physicalObjects.length; j++) {
                let objA = physicalObjects[i];
                let objB = physicalObjects[j];

                if (objA.isCollidingWith(objB)) {
                    handleCollision(objA, objB);
                }
            }
        }
    }

    // Collision response considering mass and direction
    function handleCollision(objA, objB) {
        if (objA.isStatic && objB.isStatic) {
            // Both objects are static; no response needed
            return;
        }
    
        // Calculate the overlap on both axes
        let overlapX = Math.min(objA.x + objA.width, objB.x + objB.width) - Math.max(objA.x, objB.x);
        let overlapY = Math.min(objA.y + objA.height, objB.y + objB.height) - Math.max(objA.y, objB.y);
    
        if (overlapX <= 0 || overlapY <= 0) {
            return;
        }
    
        // Determine the minimal axis for collision resolution
        if (overlapX < overlapY) {
            let displacement;

            if (objA.isStatic && !objB.isStatic) {
                displacement = overlapX;
                objB.x += displacement * (objA.x < objB.x ? -1 : 1);
            } else if (!objA.isStatic && objB.isStatic) {
                displacement = overlapX;
                objA.x += displacement * (objA.x < objB.x ? 1 : -1);
            } else {
                displacement = overlapX / 2;
                objA.x -= displacement * (objA.x < objB.x ? 1 : -1);
                objB.x += displacement * (objA.x < objB.x ? 1 : -1);
            }
    
            let totalMass = objA.mass + objB.mass;
            let massDifference = objA.mass - objB.mass;
    
            let v1 = objA.vx;
            let v2 = objB.vx;
            objA.vx = (v1 * massDifference + 2 * objB.mass * v2) / totalMass;
            objB.vx = (v2 * -massDifference + 2 * objA.mass * v1) / totalMass;
        } else {
            // Collision on Y axis
            let objects = [objA, objB];
            let dynamicObjects = objects.filter(obj => !obj.isStatic);

            // Determine collision direction based on previous velocities
            dynamicObjects.forEach(obj => {
                if (obj.vy >= 0) {
                    obj.isOnGround = true;
                    obj.vy = 0;
                }
            });

            // Handle collisions on Y axis
            if (objA.isStatic) {
                objB.y += overlapY * (objA.y < objB.y ? 1 : -1);
            } else if (objB.isStatic) {
                objA.y += overlapY * (objA.y < objB.y ? -1 : 1);
            } else {
                objA.y += (overlapY / 2) * (objA.y < objB.y ? -1 : 1);
                objB.y += (overlapY / 2) * (objA.y < objB.y ? 1 : -1);
            }

            const bounciness = 0;
            if (!objA.isStatic && !objB.isStatic) {
                let tempVy = objA.vy;
                objA.vy = bounciness * (objA.vy * (objA.mass - objB.mass) + 2 * objB.mass * objB.vy) / (objA.mass + objB.mass);
                objB.vy = bounciness * (objB.vy * (objB.mass - objA.mass) + 2 * objA.mass * tempVy) / (objA.mass + objB.mass);
            } else if (objA.isStatic && !objB.isStatic) {
                objB.vy = -bounciness * objB.vy;
                objB.y = objA.y - objB.height;
            } else if (!objA.isStatic && objB.isStatic) {
                objA.vy = -bounciness * objA.vy;
                objA.y = objB.y - objA.height;
            }
        }
    }

    // Main render loop
    function frameRenderLoop() {
        // Trigger frame loop
        requestAnimationFrame(frameRenderLoop);

        // Render frame
        frameRender();
    }

    // Begin the loop
    frameRenderLoop();

    // Initiate new objects into physicalObjects (cubes)
    // x, y, w, h, mass, isStatic, isPlayer

    // Removed player initialization
    // physicalObjects.push(new PhysicalObject(50, 0, 30, 30, 2, false, true));

    // Initialize dynamic objects within the viewport

    // Stack of squares to the left
    physicalObjects.push(new PhysicalObject(125, height - 100, 20, 20, 1, false, rainbowColors[0]));
    physicalObjects.push(new PhysicalObject(150, height - 100, 20, 20, 1, false, rainbowColors[1]));
    physicalObjects.push(new PhysicalObject(175, height - 100, 20, 20, 1, false, rainbowColors[2]));
    physicalObjects.push(new PhysicalObject(125, height - 200, 20, 20, 1, false, rainbowColors[3]));
    physicalObjects.push(new PhysicalObject(150, height - 200, 20, 20, 1, false, rainbowColors[4]));
    physicalObjects.push(new PhysicalObject(175, height - 200, 20, 20, 1, false, rainbowColors[5]));
    physicalObjects.push(new PhysicalObject(125, height - 300, 20, 20, 1, false, rainbowColors[6]));
    physicalObjects.push(new PhysicalObject(150, height - 300, 20, 20, 1, false, rainbowColors[0]));
    physicalObjects.push(new PhysicalObject(175, height - 300, 20, 20, 1, false, rainbowColors[1]));

    // Stack of rectangles on the right (with colors)
    physicalObjects.push(new PhysicalObject(700, height - 150, 20, 20, 1, false, rainbowColors[2]));
    physicalObjects.push(new PhysicalObject(1200, height - 150, 100, 50, 5, false, rainbowColors[3]));
    physicalObjects.push(new PhysicalObject(1205, height - 200, 90, 50, 5, false, rainbowColors[4]));
    physicalObjects.push(new PhysicalObject(1210, height - 250, 80, 50, 4.5, false, rainbowColors[5]));
    physicalObjects.push(new PhysicalObject(1215, height - 300, 70, 50, 4, false, rainbowColors[6]));
    physicalObjects.push(new PhysicalObject(1220, height - 350, 60, 50, 3.5, false, rainbowColors[0]));
    physicalObjects.push(new PhysicalObject(1225, height - 400, 50, 50, 3.5, false, rainbowColors[1]));
    physicalObjects.push(new PhysicalObject(1230, height - 450, 40, 50, 3.5, false, rainbowColors[2]));
    physicalObjects.push(new PhysicalObject(1235, height - 500, 30, 50, 3.5, false, rainbowColors[3]));
    physicalObjects.push(new PhysicalObject(1240, height - 550, 20, 50, 3.5, false, rainbowColors[4]));
    physicalObjects.push(new PhysicalObject(1245, height - 600, 10, 50, 3.5, false, rainbowColors[5]));

    // Platforms (static objects remain black)
    physicalObjects.push(new PhysicalObject(0, height - 20, width, 20, 1000, true));
    physicalObjects.push(new PhysicalObject(0, height - 500, 200, 20, 1000, true));
    physicalObjects.push(new PhysicalObject(500, height - 500, 200, 20, 1000, true));
    physicalObjects.push(new PhysicalObject(1000, height - 500, 200, 20, 1000, true));
});