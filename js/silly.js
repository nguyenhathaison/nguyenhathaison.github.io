const { Engine, Render, Runner, Bodies, Body, Events, Mouse, MouseConstraint, World, Common } = Matter;

const FUN_WORDS = [
  "hello :)", "why are you here", "go touch grass",
  "i use arch btw", "O(n log n)", "it works on my machine",
  "undefined is not a function", "git push --force",
  "todo: fix later", "404: sleep not found",
  "// i have no idea why this works", "pls don't read my code",
  "console.log('here')", "npm install", "tabs > spaces",
];

const SOUNDS = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq = 440, type = 'sine', duration = 0.08, vol = 0.08) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(); osc.stop(ctx.currentTime + duration);
  }
  return {
    pop:   () => beep(600, 'sine', 0.07, 0.06),
    spawn: () => beep(880, 'triangle', 0.1, 0.05),
  };
})();

/* ENGINE - no gravity */
const engine = Engine.create();
const world  = engine.world;
engine.gravity.y = 0;
engine.gravity.x = 0;

const render = Render.create({
  element: document.getElementById('physics-container'),
  engine,
  options: { width: window.innerWidth, height: window.innerHeight, wireframes: false, background: 'transparent' },
});
render.canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;opacity:0;';
Render.run(render);
Runner.run(Runner.create(), engine);

/* WALLS - all 4 sides so elements bounce around */
function makeWalls() {
  const W = window.innerWidth, H = window.innerHeight;
  const opts = { isStatic: true, render: { fillStyle: 'transparent' }, restitution: 1, friction: 0 };
  return [
    Bodies.rectangle(W / 2, -25,     W,  50, opts), // top
    Bodies.rectangle(W / 2, H + 25,  W,  50, opts), // bottom
    Bodies.rectangle(-25,   H / 2,  50,   H, opts), // left
    Bodies.rectangle(W + 25, H / 2, 50,   H, opts), // right
  ];
}
let walls = makeWalls();
World.add(world, walls);

/* DOM → PHYSICS */
const elements = [];

function addDOMElement(el, x, y) {
  el.style.visibility = 'hidden';
  el.style.position = 'absolute';
  document.getElementById('physics-container').appendChild(el);
  const rect = el.getBoundingClientRect();
  const w = rect.width || 80, h = rect.height || 30;
  el.style.visibility = '';
  const body = Bodies.rectangle(x, y, w, h, {
    restitution: 0.9,
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    render: { fillStyle: 'transparent' },
  });
  World.add(world, body);
  elements.push({ body, el, w, h });
  /* random initial velocity so everything drifts */
  const speed = Common.random(1, 2.5);
  const angle = Common.random(0, Math.PI * 2);
  Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
}

Events.on(engine, 'afterUpdate', () => {
  for (const { body, el, w, h } of elements) {
    const { x, y } = body.position;
    el.style.left      = (x - w / 2) + 'px';
    el.style.top       = (y - h / 2) + 'px';
    el.style.transform = `rotate(${body.angle}rad)`;
  }
});

/* COLLISION SOUNDS */
Events.on(engine, 'collisionStart', (e) => {
  for (const pair of e.pairs) {
    const speed = Math.hypot(
      pair.bodyA.velocity.x - pair.bodyB.velocity.x,
      pair.bodyA.velocity.y - pair.bodyB.velocity.y
    );
    if (speed > 1.5) SOUNDS.pop();
  }
});

/* MOUSE */
const mouse = Mouse.create(document.getElementById('physics-container'));
const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
World.add(world, mc);

/* After releasing a dragged element, give it a little fling */
Events.on(mc, 'enddrag', (e) => {
  const b = e.body;
  if (!b) return;
  const vel = b.velocity;
  Body.setVelocity(b, { x: vel.x * 1.5, y: vel.y * 1.5 });
});

/* SPAWN */
function ripple(x, y) {
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.cssText = `left:${x}px;top:${y}px;width:40px;height:40px;`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

function spawnWord(x, y) {
  const p = document.createElement('p');
  p.className = 'physics-element';
  p.textContent = FUN_WORDS[Math.floor(Math.random() * FUN_WORDS.length)];
  p.style.cssText = 'font-size:0.8rem;font-family:monospace;white-space:nowrap;opacity:0.7;';
  addDOMElement(p, x, y);
  ripple(x, y);
  SOUNDS.spawn();
}

/* INIT */
window.addEventListener('DOMContentLoaded', () => {
  const domEls = document.querySelectorAll('.physics-element');
  let i = 0;
  for (const el of domEls) {
    const x = Common.random(100, window.innerWidth  - 100);
    const y = Common.random(80,  window.innerHeight - 80);
    addDOMElement(el, x, y);
    i++;
  }
});

/* CLICK TO SPAWN */
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
  if (mc.body) return;
  spawnWord(e.clientX, e.clientY);
  hint.classList.add('hidden');
});

/* CUSTOM CURSOR */
const cursorEl = document.createElement('div');
cursorEl.id = 'cursor';
document.body.appendChild(cursorEl);

const TRAIL_LEN = 10;
const trail = Array.from({ length: TRAIL_LEN }, () => {
  const d = document.createElement('div');
  d.className = 'trail-dot';
  document.body.appendChild(d);
  return d;
});
const trailPos = Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0 }));
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorEl.style.left = mouseX + 'px';
  cursorEl.style.top  = mouseY + 'px';
});
document.addEventListener('mousedown', () => cursorEl.classList.add('grabbing'));
document.addEventListener('mouseup',   () => cursorEl.classList.remove('grabbing'));

(function animateTrail() {
  trailPos.unshift({ x: mouseX, y: mouseY });
  trailPos.length = TRAIL_LEN;
  trail.forEach((dot, i) => {
    const pos = trailPos[i] || { x: mouseX, y: mouseY };
    dot.style.left    = pos.x + 'px';
    dot.style.top     = pos.y + 'px';
    dot.style.opacity = (1 - i / TRAIL_LEN) * 0.35;
  });
  requestAnimationFrame(animateTrail);
})();

/* HINT */
const hint = document.createElement('div');
hint.id = 'hint';
hint.textContent = 'click anywhere to spawn chaos';
document.body.appendChild(hint);
setTimeout(() => hint.classList.add('hidden'), 5000);

/* RESIZE - rebuild walls */
window.addEventListener('resize', () => {
  render.canvas.width  = window.innerWidth;
  render.canvas.height = window.innerHeight;
  World.remove(world, walls);
  walls = makeWalls();
  World.add(world, walls);
});