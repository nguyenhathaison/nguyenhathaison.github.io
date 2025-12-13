// Matter.js aliases
const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        MouseConstraint = Matter.MouseConstraint,
        Mouse = Matter.Mouse,
        Events = Matter.Events;

// 1. Create a physics engine
const engine = Engine.create();
const world = engine.world;

// Disable gravity for a "floating forever" effect
world.gravity.y = 0; 

// Reduce air resistance for a smoother, bouncier float
world.gravity.scale = 0; 

// 2. Create an invisible renderer (we will handle rendering with CSS)
// We still need the renderer for the Runner to work, but we hide its canvas.
const render = Render.create({
    element: document.getElementById('physics-container'),
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Set to true to see the physics boundaries
        showCollisions: false,
        background: 'transparent' // Hide the default Matter.js canvas background
    }
});
render.canvas.style.display = 'none';

// 3. Create the boundaries (walls) of the screen
const boundaryOptions = {
    isStatic: true, // Walls don't move
    restitution: 1, // Full bounce
    render: { fillStyle: 'transparent' }
};
const width = window.innerWidth;
const height = window.innerHeight;

const boundaries = [
    // Top, Bottom, Left, Right
    Bodies.rectangle(width / 2, -25, width, 50, boundaryOptions),
    Bodies.rectangle(width / 2, height - 10, width, 50, boundaryOptions),
    Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions),
    Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions)
];

Composite.add(world, boundaries);

// 4. Create physics bodies for the HTML elements
const elements = [
    { id: 'random1', isCircle: false, options: { frictionAir: 0.001, restitution: 0.9, mass: 100 } },
    { id: 'random2', isCircle: true, options: { frictionAir: 0.001, restitution: 0.9, mass: 100 } },
    { id: 'random3', isCircle: true, options: { frictionAir: 0.001, restitution: 0.9, mass: 100 } },
    { id: 'random4', isCircle: true, options: { frictionAir: 0.001, restitution: 0.9, mass: 100 } },
    { id: 'random5', isCircle: false, options: { frictionAir: 0.001, restitution: 0.9, mass: 100 } }
];

elements.forEach(el => {
    const domElement = document.getElementById(el.id);
    const w = domElement.offsetWidth;
    const h = domElement.offsetHeight;
    const initialX = Math.random() * width * 0.8 + width * 0.1;
    const initialY = Math.random() * height * 0.8 + height * 0.1;

    let body;
    if (el.isCircle) {
        // Circle body for the sphere
        body = Bodies.circle(initialX, initialY, w / 2, el.options);
    } else {
        // Rectangle body for the box and text
        body = Bodies.rectangle(initialX, initialY, w, h, el.options);
    }

    // Store the DOM element reference on the body object
    body.domElement = domElement;
    
    // Apply an initial random velocity for "floating forever"
    Matter.Body.setVelocity(body, { 
        x: (Math.random() - 0.5) * 5, 
        y: (Math.random() - 0.5) * 5 
    });

    Composite.add(world, body);
});

// 5. Run the engine and the renderer
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// 6. Sync Matter.js bodies with HTML elements every frame
Events.on(engine, 'beforeUpdate', function() {
    // Loop through all bodies in the world
    Composite.allBodies(world).forEach(body => {
        // 1. Ensure the body has the domElement reference
        if (body.domElement) { 
            const el = body.domElement;
            
            // 2. Calculate offsets
            const centerXOffset = el.offsetWidth / 2;
            const centerYOffset = el.offsetHeight / 2;

            // 3. Apply position and rotation using CSS transform
            el.style.transform = `
                translate(
                    ${body.position.x - centerXOffset}px,
                    ${body.position.y - centerYOffset}px
                ) 
                rotate(${body.angle}rad)
            `;
        }
    });
});

// 7. Add Mouse Interaction (Drag/Constraint)
const mouse = Mouse.create(document.getElementById('physics-container')); 

const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2, 
        render: { visible: false } 
    }
});

Composite.add(world, mouseConstraint);