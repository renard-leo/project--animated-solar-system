import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { BODIES } from './data.js';
import { createTexturePool } from './texture-pool.js';
import { formatDate, formatRate } from './format.js';
import { renderInfo } from './info.js';

const TAU = Math.PI * 2;
const DAY_MS = 86400000;
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const SUN_RADIUS = 8;
const ORBIT_OFFSET = 14;
const ORBIT_SCALE = 28;
const ORBIT_OPACITY = 0.22;
const ORBIT_OPACITY_ACTIVE = 0.75;
const MOON_ORBIT_OPACITY = 0.14;
const MOON_MIN_RADIUS = 0.06;
// Les lunes rapides (Phobos, Io…) feraient des tours complets entre deux images en accéléré
const MAX_MOON_ORBIT = Math.PI / 2;
const BELT_PERIOD_DAYS = 4.6 * 365.25;
const SPEED_MIN = 1 / 86400;
const SPEED_MAX = 365.25;
const SPEED_DEFAULT = 2;
const SPEED_STEPS = 1000;
// Plafonne la rotation affichée pour éviter l'effet stroboscopique en accéléré
const MAX_SPIN = Math.PI;
const FOCUS_DURATION = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.4 : 1.6;
// Part de la zone visible occupée par le rayon de l'astre suivi
const FOCUS_FILL = 0.3;
const FOCUS_FILL_RINGED = 0.19;
// Une planète à lunes est cadrée plus large pour que son système reste visible
const FOCUS_FILL_SYSTEM = 0.45;
const FOCUS_FILL_SYSTEM_MIN = 0.15;
const FREE_MIN_DISTANCE = 14;
const MAX_DISTANCE = 700;
const PICK_TOLERANCE_PX = 16;
const CLICK_TOLERANCE_PX = 6;
const HOME_OFFSET = new THREE.Vector3(0, 95, 190);
const HOME_FIT_RADIUS = 75;
const ORIGIN = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// Échelles compressées : les vraies proportions rendraient les planètes invisibles
const displayRadius = (diameterKm) => Math.pow(diameterKm / 12756, 0.55);
const displayOrbit = (distanceMkm) => ORBIT_OFFSET + Math.sqrt(distanceMkm / 149.6) * ORBIT_SCALE;
// Orbites des lunes resserrées pour tenir dans le cadre de la planète, au-delà de ses anneaux
const displayMoonOrbit = (moon, parentRadius) => {
    const base = moon.parent.ring ? moon.parent.ring.outer + 0.25 : 1.6;
    return parentRadius * (base + 0.3 * Math.sqrt(moon.distanceKm / (moon.parent.diameterKm / 2)));
};
const moonAngle = (data, simDays) => THREE.MathUtils.degToRad(data.phaseDeg + (360 * simDays) / data.orbitDays);
const daysSinceJ2000 = (ms) => (ms - J2000_MS) / DAY_MS;
const speedToStep = (speed) => Math.round((Math.log(speed / SPEED_MIN) / Math.log(SPEED_MAX / SPEED_MIN)) * SPEED_STEPS);
const stepToSpeed = (step) => SPEED_MIN * Math.pow(SPEED_MAX / SPEED_MIN, step / SPEED_STEPS);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const dom = {
    canvas: document.getElementById('scene'),
    labels: document.getElementById('labels'),
    list: document.getElementById('planet-list'),
    panel: document.getElementById('info-panel'),
    panelBody: document.getElementById('info-body'),
    panelName: document.getElementById('info-name'),
    panelType: document.getElementById('info-type'),
    panelDot: document.getElementById('info-dot'),
    prev: document.getElementById('btn-prev'),
    next: document.getElementById('btn-next'),
    close: document.getElementById('btn-close'),
    date: document.getElementById('sim-date'),
    play: document.getElementById('btn-play'),
    speed: document.getElementById('speed'),
    speedValue: document.getElementById('speed-value'),
    orbits: document.getElementById('btn-orbits'),
    names: document.getElementById('btn-labels'),
    today: document.getElementById('btn-today'),
    reset: document.getElementById('btn-reset'),
    loader: document.getElementById('loader'),
    loaderText: document.getElementById('loader-text')
};

const state = {
    simDays: daysSinceJ2000(Date.now()),
    speed: SPEED_DEFAULT,
    paused: false,
    showOrbits: true,
    showLabels: true,
    focus: null,
    transition: null,
    dateText: ''
};

const bodies = [];
const planets = [];
const bodyById = new Map();
const pickables = [];
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 6000);
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const texturePool = createTexturePool();
const shift = { x: 0, y: 0, goalX: 0, goalY: 0 };
const tmp = { pointer: new THREE.Vector2(), goal: new THREE.Vector3(), direction: new THREE.Vector3(), side: new THREE.Vector3(), delta: new THREE.Vector3(), lastTarget: new THREE.Vector3(), projected: new THREE.Vector3() };
let renderer, controls, belt;

function createGlowTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const glow = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    glow.addColorStop(0, 'rgba(255, 236, 190, 1)');
    glow.addColorStop(0.18, 'rgba(255, 196, 110, .75)');
    glow.addColorStop(0.4, 'rgba(255, 140, 50, .18)');
    glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// La couleur unie de l'astre sert de substitut le temps que son worker produise la texture
function loadTexture(type, spec, material, onLoad) {
    texturePool.generate(type, spec).then(({ width, height, pixels }) => {
        const texture = new THREE.DataTexture(new Uint8Array(pixels.buffer), width, height);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.needsUpdate = true;
        material.map = texture;
        material.needsUpdate = true;
        onLoad?.();
    });
}

function homeOffset(out) {
    const tanHalfWidth = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    return out.copy(HOME_OFFSET).setLength(Math.max(HOME_OFFSET.length(), HOME_FIT_RADIUS / tanHalfWidth));
}

function createStars(count = 6000) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * TAU;
        const r = 1800 + Math.random() * 1200;
        const s = Math.sqrt(1 - u * u);
        positions.set([r * s * Math.cos(theta), r * u, r * s * Math.sin(theta)], i * 3);
        color.setHSL(Math.random() < 0.7 ? 0.6 : 0.08, 0.5, 0.55 + Math.random() * 0.45);
        colors.set([color.r, color.g, color.b], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
}

function createBelt(count = 2500) {
    const inner = displayOrbit(2.2 * 149.6);
    const outer = displayOrbit(3.2 * 149.6);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = inner + (outer - inner) * (Math.random() + Math.random()) / 2;
        const angle = Math.random() * TAU;
        positions.set([Math.cos(angle) * r, (Math.random() - 0.5) * 1.6, Math.sin(angle) * r], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x9a8f80, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false }));
}

function createOrbitLine(radius, color, opacity) {
    const points = [];
    for (let i = 0; i < 256; i++) {
        const angle = (i / 256) * TAU;
        points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius));
    }
    const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    );
    line.userData.baseOpacity = opacity;
    return line;
}

function createRing(ring, radius) {
    const inner = radius * ring.inner;
    const outer = radius * ring.outer;
    const geometry = new THREE.RingGeometry(inner, outer, 160, 1);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i);
        uv.setXY(i, (vertex.length() - inner) / (outer - inner), 0.5);
    }
    const material = new THREE.MeshBasicMaterial({ color: 0xd8d8d8, side: THREE.DoubleSide, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    loadTexture('ring', ring, material, () => { mesh.visible = true; });
    return mesh;
}

function createMoon(data, parent) {
    const radius = Math.max(displayRadius(data.diameterKm), MOON_MIN_RADIUS);
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material);
    group.add(mesh);
    loadTexture('body', data.texture, material, () => material.color.set(0xffffff));

    // Plan équatorial de la planète, sauf la Lune qui orbite près du plan de l'écliptique
    const system = data.plane === 'ecliptic' ? parent.group : parent.tilt;
    const orbitRadius = displayMoonOrbit(data, parent.radius);
    const body = { data, parent, radius, group, mesh, orbitRadius, angle: moonAngle(data, state.simDays), pickables: [mesh], world: new THREE.Vector3(), screen: { x: 0, y: 0, visible: false }, labelSize: { width: 0, height: 0 } };
    body.orbit = createOrbitLine(orbitRadius, data.color, MOON_ORBIT_OPACITY);
    system.add(group, body.orbit);
    mesh.userData.body = body;
    return body;
}

function createBody(data) {
    const isSun = !data.orbitDays;
    const radius = isSun ? SUN_RADIUS : displayRadius(data.diameterKm);
    const group = new THREE.Group();
    const tilt = new THREE.Group();
    tilt.rotation.z = THREE.MathUtils.degToRad(data.tiltDeg);
    group.add(tilt);

    const material = isSun ? new THREE.MeshBasicMaterial({ color: data.color }) : new THREE.MeshStandardMaterial({ color: data.color, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32), material);
    tilt.add(mesh);
    loadTexture('body', data.texture, material, () => material.color.set(0xffffff));

    const body = { data, radius, group, tilt, mesh, pickables: [mesh], orbitRadius: isSun ? 0 : displayOrbit(data.distanceMkm), world: new THREE.Vector3(), screen: { x: 0, y: 0, visible: false }, labelSize: { width: 0, height: 0 } };

    if (data.texture.kind === 'earth') {
        const cloudMaterial = new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, metalness: 0 });
        body.clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 64, 32), cloudMaterial);
        body.clouds.visible = false;
        loadTexture('clouds', data.texture.seed + 100, cloudMaterial, () => { body.clouds.visible = true; });
        tilt.add(body.clouds);
        body.pickables.push(body.clouds);
    }
    if (data.ring) {
        const ring = createRing(data.ring, radius);
        tilt.add(ring);
        body.pickables.push(ring);
    }
    if (isSun) {
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: createGlowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
        glow.scale.setScalar(radius * 6);
        group.add(glow);
    } else {
        body.orbit = createOrbitLine(body.orbitRadius, data.color, ORBIT_OPACITY);
    }
    for (const object of body.pickables) object.userData.body = body;
    body.moons = (data.moons || []).map((moon) => createMoon(moon, body));
    return body;
}

// Les noms des lunes n'apparaissent que lorsque leur système est observé
const inFocusedSystem = (body) => !body.parent || [body, body.parent].includes(state.focus) || state.focus?.parent === body.parent;

function syncMoons() {
    for (const body of bodies) if (body.parent) body.angle = moonAngle(body.data, state.simDays);
}

function createDot(color, small = false) {
    const dot = document.createElement('span');
    dot.className = small ? 'planet-dot is-small' : 'planet-dot';
    dot.style.setProperty('--planet-color', color);
    return dot;
}

function buildInterface() {
    planets.forEach((body, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'planet-btn';
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-keyshortcuts', String(index));
        const name = document.createElement('span');
        name.textContent = body.data.name;
        const key = document.createElement('kbd');
        key.className = 'planet-key';
        key.textContent = index;
        button.append(createDot(body.data.color), name, key);
        button.addEventListener('click', () => focusBody(body));
        item.append(button);
        dom.list.append(item);
        body.navButton = button;
    });

    for (const body of bodies) {
        const label = document.createElement('button');
        label.type = 'button';
        label.className = body.parent ? 'label is-moon' : 'label';
        label.tabIndex = -1;
        label.append(createDot(body.data.color, true), body.data.name);
        label.addEventListener('click', () => focusBody(body));
        dom.labels.append(label);
        body.label = label;
    }
}

function setActive(active) {
    for (const body of bodies) {
        const isActive = body === active;
        body.navButton?.setAttribute('aria-pressed', String(isActive || active?.parent === body));
        body.label.classList.toggle('is-active', isActive);
        if (body.orbit) body.orbit.material.opacity = isActive ? ORBIT_OPACITY_ACTIVE : body.orbit.userData.baseOpacity;
    }
}

function openPanel(body) {
    dom.panelName.textContent = body.data.name;
    dom.panelType.textContent = body.data.type;
    dom.panelDot.style.setProperty('--planet-color', body.data.color);
    dom.panelBody.innerHTML = renderInfo(body.data);
    for (const element of dom.panelBody.querySelectorAll('[data-color]')) element.style.setProperty('--planet-color', element.dataset.color);
    dom.panelBody.scrollTop = 0;
    dom.panel.classList.add('is-open');
    dom.panel.inert = false;
    updateShiftGoal();
}

function closePanel() {
    dom.panel.classList.remove('is-open');
    dom.panel.inert = true;
    updateShiftGoal();
}

function startTransition() {
    state.transition = { elapsed: 0, fromTarget: controls.target.clone(), fromOffset: camera.position.clone().sub(controls.target) };
    controls.enabled = false;
}

function focusBody(body) {
    state.focus = body;
    startTransition();
    setActive(body);
    openPanel(body);
}

function goHome() {
    state.focus = null;
    startTransition();
    setActive(null);
    closePanel();
}

// Les flèches parcourent les planètes, ou les lunes de la même planète quand une lune est suivie
function stepFocus(direction) {
    const list = state.focus?.parent ? state.focus.parent.moons : planets;
    const index = Math.max(list.indexOf(state.focus), 0);
    focusBody(list[(index + direction + list.length) % list.length]);
}

function applyLimits() {
    const body = state.focus;
    controls.minDistance = body ? body.radius * (body.data.ring ? 2.6 : 1.6) : FREE_MIN_DISTANCE;
    controls.maxDistance = MAX_DISTANCE;
    controls.enablePan = !body;
}

function focusFill(body) {
    const base = body.data.ring ? FOCUS_FILL_RINGED : FOCUS_FILL;
    if (!body.moons?.length) return base;
    const outer = Math.max(...body.moons.map((moon) => moon.orbitRadius)) / body.radius;
    return Math.min(base, Math.max(FOCUS_FILL_SYSTEM_MIN, FOCUS_FILL_SYSTEM / outer));
}

// Place la caméra côté Soleil, légèrement décalée, pour voir l'astre aux trois quarts éclairé
function focusOffset(out) {
    const body = state.focus;
    if (!body) return homeOffset(out);
    const { innerWidth: width, innerHeight: height } = window;
    const visible = Math.min(width - shift.goalX * 2, height - shift.goalY * 2);
    const fill = focusFill(body);
    const distance = (body.radius * height) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * fill * visible);
    if (!body.orbitRadius) return out.set(0.5, 0.4, 1).normalize().multiplyScalar(distance);
    const toSun = out.copy(body.world).negate().normalize();
    tmp.side.crossVectors(toSun, UP).normalize();
    return toSun.multiplyScalar(0.75).addScaledVector(tmp.side, 0.6).addScaledVector(UP, 0.35).normalize().multiplyScalar(distance);
}

function updateCamera(dt) {
    const target = state.focus ? state.focus.world : ORIGIN;
    const transition = state.transition;
    if (transition) {
        transition.elapsed += dt;
        const progress = Math.min(transition.elapsed / FOCUS_DURATION, 1);
        const eased = easeInOutCubic(progress);
        const goal = focusOffset(tmp.goal);
        const length = Math.exp(THREE.MathUtils.lerp(Math.log(transition.fromOffset.length()), Math.log(goal.length()), eased));
        const direction = tmp.direction.copy(transition.fromOffset).normalize().lerp(goal.normalize(), eased);
        if (direction.lengthSq() < 1e-6) direction.copy(UP);
        controls.target.lerpVectors(transition.fromTarget, target, eased);
        camera.position.copy(controls.target).addScaledVector(direction.normalize(), length);
        camera.lookAt(controls.target);
        if (progress === 1) {
            state.transition = null;
            applyLimits();
            controls.enabled = true;
        }
    } else {
        if (state.focus) {
            camera.position.add(tmp.delta.subVectors(target, tmp.lastTarget));
            controls.target.copy(target);
        }
        controls.update();
    }
    tmp.lastTarget.copy(target);
}

// Décale le centre de projection pour que l'astre suivi ne soit pas masqué par le panneau
function updateShiftGoal() {
    const panel = dom.panel;
    const open = panel.classList.contains('is-open');
    const isSheet = panel.offsetLeft < window.innerWidth / 2;
    shift.goalX = open && !isSheet ? (window.innerWidth - panel.offsetLeft) / 2 : 0;
    shift.goalY = open && isSheet ? (window.innerHeight - panel.offsetTop) / 2 : 0;
}

function updateShift(dt) {
    const k = Math.min(1, dt * 5);
    shift.x += (shift.goalX - shift.x) * k;
    shift.y += (shift.goalY - shift.y) * k;
    const { innerWidth: width, innerHeight: height } = window;
    camera.setViewOffset(width, height, shift.x, shift.y, width, height);
}

function updateBodies(stepDays, dt) {
    for (const body of bodies) {
        const { data } = body;
        if (body.parent) {
            const step = (TAU * stepDays) / data.orbitDays;
            const limit = MAX_MOON_ORBIT * dt;
            body.angle += THREE.MathUtils.clamp(step, -limit, limit);
            body.group.position.set(Math.cos(body.angle) * body.orbitRadius, 0, -Math.sin(body.angle) * body.orbitRadius);
            body.mesh.rotation.y = body.angle;
            continue;
        }
        if (body.orbitRadius) {
            const angle = THREE.MathUtils.degToRad(data.longitudeJ2000 + (360 * state.simDays) / data.orbitDays);
            body.group.position.set(Math.cos(angle) * body.orbitRadius, 0, -Math.sin(angle) * body.orbitRadius);
        }
        const spin = Math.min((TAU * stepDays * 24) / Math.abs(data.rotationHours), MAX_SPIN * dt);
        body.mesh.rotation.y += spin;
        if (body.clouds) body.clouds.rotation.y += spin * 1.15;
    }
    belt.rotation.y = (TAU * state.simDays) / BELT_PERIOD_DAYS;
    scene.updateMatrixWorld();
    for (const body of bodies) body.group.getWorldPosition(body.world);
}

function measureLabels() {
    for (const body of bodies) body.labelSize = { width: body.label.offsetWidth, height: body.label.offsetHeight };
}

const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// Les noms qui se chevauchent sont masqués, en priorité l'astre suivi puis les plus proches de la caméra
function updateLabels() {
    const { innerWidth: width, innerHeight: height } = window;
    const projected = tmp.projected;
    for (const body of bodies) {
        projected.copy(body.world).project(camera);
        body.screen.visible = projected.z < 1 && inFocusedSystem(body);
        body.screen.x = ((projected.x + 1) / 2) * width;
        body.screen.y = ((1 - projected.y) / 2) * height;
        body.screen.depth = camera.position.distanceTo(body.world);

        projected.copy(body.world);
        projected.y += body.radius * 1.15;
        projected.project(camera);
        body.screen.labelX = ((projected.x + 1) / 2) * width;
        body.screen.labelY = ((1 - projected.y) / 2) * height;
    }

    const placed = [];
    const ordered = [...bodies].sort((a, b) => (b === state.focus) - (a === state.focus) || a.screen.depth - b.screen.depth);
    for (const body of ordered) {
        const { labelX: x, labelY: y } = body.screen;
        const { width: labelWidth, height: labelHeight } = body.labelSize;
        const rect = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y - labelHeight, bottom: y };
        const visible = state.showLabels && body.screen.visible && !placed.some((other) => overlaps(rect, other));
        if (visible) placed.push(rect);
        body.label.classList.toggle('is-hidden', !visible);
        if (visible) body.label.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
    }
}

function updateDate() {
    const text = formatDate(new Date(J2000_MS + state.simDays * DAY_MS), state.speed < 1);
    if (text === state.dateText) return;
    state.dateText = text;
    dom.date.textContent = text;
}

function pick(event) {
    const rect = dom.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    tmp.pointer.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
    raycaster.setFromCamera(tmp.pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    if (hit) return hit.object.userData.body;
    let closest = null;
    let best = PICK_TOLERANCE_PX;
    for (const body of bodies) {
        const distance = Math.hypot(body.screen.x - x, body.screen.y - y);
        if (body.screen.visible && distance < best) {
            best = distance;
            closest = body;
        }
    }
    return closest;
}

function setSpeed(speed) {
    state.speed = speed;
    const text = formatRate(speed);
    dom.speedValue.textContent = text;
    dom.speed.setAttribute('aria-valuetext', text);
}

function togglePause() {
    state.paused = !state.paused;
    dom.play.classList.toggle('is-paused', state.paused);
    dom.play.setAttribute('aria-label', state.paused ? 'Reprendre la simulation' : 'Mettre la simulation en pause');
}

function toggleButton(button, key) {
    state[key] = !state[key];
    button.setAttribute('aria-pressed', String(state[key]));
}

function bindEvents() {
    const pointers = new Map();
    let multiTouch = false;
    dom.canvas.addEventListener('pointerdown', (event) => {
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.size > 1) multiTouch = true;
    });
    dom.canvas.addEventListener('pointerup', (event) => {
        const start = pointers.get(event.pointerId);
        pointers.delete(event.pointerId);
        if (start && !multiTouch && Math.hypot(event.clientX - start.x, event.clientY - start.y) < CLICK_TOLERANCE_PX) {
            const body = pick(event);
            if (body) focusBody(body);
        }
        if (!pointers.size) multiTouch = false;
    });
    dom.canvas.addEventListener('pointercancel', (event) => pointers.delete(event.pointerId));
    dom.canvas.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'mouse' && !event.buttons) dom.canvas.classList.toggle('is-hovering', Boolean(pick(event)));
    });

    dom.speed.addEventListener('input', () => setSpeed(stepToSpeed(Number(dom.speed.value))));
    dom.play.addEventListener('click', togglePause);
    dom.orbits.addEventListener('click', () => {
        toggleButton(dom.orbits, 'showOrbits');
        for (const body of bodies) if (body.orbit) body.orbit.visible = state.showOrbits;
    });
    dom.names.addEventListener('click', () => toggleButton(dom.names, 'showLabels'));
    dom.today.addEventListener('click', () => {
        state.simDays = daysSinceJ2000(Date.now());
        syncMoons();
    });
    dom.reset.addEventListener('click', goHome);
    dom.close.addEventListener('click', goHome);
    dom.prev.addEventListener('click', () => stepFocus(-1));
    dom.next.addEventListener('click', () => stepFocus(1));
    dom.panelBody.addEventListener('click', (event) => {
        const target = event.target.closest('[data-focus]');
        if (target) focusBody(bodyById.get(target.dataset.focus));
    });

    window.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const inField = event.target instanceof HTMLInputElement;
        if (event.key === 'Escape' && state.focus) goHome();
        else if (inField) return;
        else if (/^[0-8]$/.test(event.key)) focusBody(planets[Number(event.key)]);
        else if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
            event.preventDefault();
            togglePause();
        } else if (state.focus && event.key === 'ArrowRight') stepFocus(1);
        else if (state.focus && event.key === 'ArrowLeft') stepFocus(-1);
    });

    window.addEventListener('resize', resize);
    new ResizeObserver(updateShiftGoal).observe(dom.panel);
}

function resize() {
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateShiftGoal();
}

function frame() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const stepDays = state.paused ? 0 : state.speed * dt;
    state.simDays += stepDays;
    updateBodies(stepDays, dt);
    updateShift(dt);
    updateCamera(dt);
    updateLabels();
    updateDate();
    renderer.render(scene, camera);
}

function init() {
    renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    controls = new OrbitControls(camera, dom.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    applyLimits();
    resize();
    camera.position.copy(homeOffset(tmp.goal));

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    scene.add(new THREE.PointLight(0xfff4e0, 3.2, 0, 0));
    scene.add(createStars());
    belt = createBelt();
    scene.add(belt);

    for (const data of BODIES) {
        const body = createBody(data);
        planets.push(body);
        scene.add(body.group);
        if (body.orbit) scene.add(body.orbit);
        for (const member of [body, ...body.moons]) {
            bodies.push(member);
            bodyById.set(member.data.id, member);
            pickables.push(...member.pickables);
        }
    }

    buildInterface();
    measureLabels();
    document.fonts.ready.then(measureLabels);
    bindEvents();
    dom.speed.max = SPEED_STEPS;
    dom.speed.value = speedToStep(SPEED_DEFAULT);
    setSpeed(SPEED_DEFAULT);
    renderer.setAnimationLoop(frame);
    dom.loader.classList.add('is-done');
}

try {
    init();
} catch (error) {
    console.error(error);
    dom.loaderText.textContent = 'Impossible d’afficher la scène 3D : votre navigateur ne semble pas prendre en charge WebGL.';
}
