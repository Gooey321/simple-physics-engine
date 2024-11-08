document.addEventListener("DOMContentLoaded", function() {
    // Get the width and height of the window
    var win = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        width = win.innerWidth || e.clientWidth || g.clientWidth,
        height = win.innerHeight || e.clientHeight || g.clientHeight;
        
    // Initialise an array to hold the physical objects
    let physicalObjects = [];

    // Initialise an object to hold the keys
    let keys = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false
    };

    document.addEventListener("keydown", function(event) {
        if (keys.hasOwnProperty(event.code)) {
            keys[event.code] = true;
            event.preventDefault();
        }
    });

    document.addEventListener("keyup", function(event) {
        if (keys.hasOwnProperty(event.code)) {
            keys[event.code] = false;
            event.preventDefault();
        }
    });

    // Set gravity variable
    let gravity = 0.2;

    // Set friction variable
    let friction = 0.1;

    // Initialise the canvas element and set its width and height
    let canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.width = width;
        canvas.height = height;
    
    // Append the canvas element to the HTML body
    document.body.appendChild(canvas);
    
    // Get the canvas's context object
    let context = canvas.getContext("2d");

    // PhysicalObject class
    let PhysicalObject = function(x, y, w, h, mass, isStatic, isPlayer) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.mass = mass;
        this.isStatic = isStatic;
        this.isPlayer = isPlayer;
        this.canJump = false;
        this.isOnGround = false;

        this.vx = 0; // Velocity in X
        this.vy = 0; // Velocity in Y

        // Apply force to the object
        this.applyForce = function(fx, fy) {
            if (!this.isStatic) {
                // Friction force. Friction opposes motion so reverse x velocity
                let frictionForceX = -this.vx * friction * this.mass;
                let allFx = fx + frictionForceX;
                let allFy = fy;

                // Acceleration = Force / Mass (based on newton second law)
                let ax = allFx / this.mass;
                let ay = allFy / this.mass;
                this.vx += ax;
                this.vy += ay;
            }
        };

        // Update object's position based on velocity
        this.update = function() {
            if (!this.isStatic) {
                const airResistance = 0.99;

                this.handleInput();

                // Apply gravity as a force (Weight = mass * gravity)
                this.applyForce(0, this.mass * gravity);

                // Update position based on velocity
                this.x += this.vx * airResistance;
                this.y += this.vy * airResistance;

                const velocityThreshold = 0.01;
                if (Math.abs(this.vx) < velocityThreshold) this.vx = 0;
                if (Math.abs(this.vy) < velocityThreshold) this.vy = 0;
            }
        };

        // Collision detection
        this.isCollidingWith = function(other) {
            return this.x < other.x + other.width &&
                   this.x + this.width > other.x &&
                   this.y < other.y + other.height &&
                   this.y + this.height > other.y;
        };

        this.handleInput = function() {
            if (this.isPlayer) {
                // Move speed
                const speed = 1.9;
                const jumpHeight = -10;

                let FforceX = 0;

                if(keys.ArrowLeft) {
                    FforceX = -speed;
                } else if (keys.ArrowRight) {
                    FforceX = speed;
                }

                // Apply friction
                this.applyForce(FforceX, 0);

                if (keys.ArrowUp && this.canJump) {
                    this.vy = jumpHeight;
                    this.canJump = false;
                    this.isOnGround = false;
                }
            }
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
            context.fillStyle = obj.isStatic ? "black" : (obj.isPlayer ? "green" : "blue");
            context.fillRect(obj.x, obj.y, obj.width, obj.height);
        }

        physicalObjects.forEach(obj => {
            if (obj.isPlayer) {
                obj.isOnGround = false;
                obj.canJump = false;
            }
        })

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

    // Collision response considering mass
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
            let player, platform;
    
            if (objA.isPlayer) {
                player = objA;
                platform = objB;
            } else if (objB.isPlayer) {
                player = objB;
                platform = objA;
            }
    
            if (player && platform) {
                let playerBottom = player.y + player.height;
                let platformTop = platform.y;
                let platformBottom = platform.y + platform.height;
    
                const groundTolerance = 0.1;
    
                let playerPrevY = player.y - player.vy;
                let playerPrevBottom = playerPrevY + player.height;
    
                // Check if collision is from the top
                if (playerPrevBottom <= platformTop + groundTolerance && player.vy >= 0) {
                    // Landing on the platform
                    player.canJump = true;
                    player.isOnGround = true;
                    player.vy = 0;
                    player.y = platformTop - player.height;
    
                    if (!platform.isStatic) {
                        player.vx += platform.vx;
                    }
                } else if (playerPrevY >= platformBottom - groundTolerance && player.vy <= 0) {
                    // Hitting platform from below
                    player.vy = 0;
                    player.y = platform.y + platform.height;
                    player.isOnGround = false;
                } else {
                    if (player.x + player.width > platform.x && player.vx > 0) {
                        player.x = platform.x - playerWidth;
                    } else if (player.x < platform.x + platform.width && player.vx < 0) {
                        player.x = platform.x + platform.width;
                    }
                    
                }
            } else {
                // Handle non-player collisions on Y axis
                if (objA.isStatic) {
                    objB.y += overlapY * (objA.y < objB.y ? 1 : -1);
                } else if (objB.isStatic) {
                    objA.y += overlapY * (objA.y < objB.y ? -1 : 1);
                } else {
                    objA.y += overlapY / 2 * (objA.y < objB.y ? -1 : 1);
                    objB.y += overlapY / 2 * (objA.y < objB.y ? 1 : -1);
                }
    
                const bounciness = 0.1;
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
    
                if (player) {
                    player.isOnGround = false;
                    player.canJump = false;
                }
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

    // Player
    physicalObjects.push(new PhysicalObject(100, 0, 30, 30, 2, false, true));


    physicalObjects.push(new PhysicalObject(125, 0, 20, 20, 1, false, false));
    physicalObjects.push(new PhysicalObject(150, 0, 20, 20, 1, false, false));
    physicalObjects.push(new PhysicalObject(175, 0, 20, 20, 1, false, false));
    physicalObjects.push(new PhysicalObject(210, 500, 20, 20, 1, false, false));
    physicalObjects.push(new PhysicalObject(210, 200, 50, 50, 2, false, false));
    physicalObjects.push(new PhysicalObject(210, 70, 100, 100, 100, false, false));
    physicalObjects.push(new PhysicalObject(750, height - 4500, 200, 200, 200, false, false));


    // Make a floor
    physicalObjects.push(new PhysicalObject(0, height - 20, width, 20, 1000, true, false));
    physicalObjects.push(new PhysicalObject(0, height - 500, 200, 20, 1000, true, false));
    physicalObjects.push(new PhysicalObject(500, height - 500, 200, 20, 1000, true, false));
    physicalObjects.push(new PhysicalObject(1000, height - 500, 200, 20, 1000, true, false));
    physicalObjects.push(new PhysicalObject(750, height - 1000, 200, 20, 1000, true, false));
});