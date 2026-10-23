// 오늘 카드의 3D 장면: 로고(링 + 체크)와 오늘 레슨 수만큼 도는 컬러 구슬
import * as THREE from '/vendor/three.module.min.js';

const MINT = 0x34e0a1;
let renderer, scene, camera, logo, orbitGroup, rafId = 0, host = null, signature = '';
let visible = true, inView = true, resizeObs, viewObs;
const orbs = [];
const clock = new THREE.Clock();

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function glossy(color, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15, emissive, emissiveIntensity });
}

function buildLogo() {
  const g = new THREE.Group();
  const white = glossy(0xffffff, 0x9fd9ff, 0.12);
  const gapStart = 16, gapEnd = 80;
  const arc = THREE.MathUtils.degToRad(360 - (gapEnd - gapStart));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 40, 160, arc), white);
  ring.rotation.z = THREE.MathUtils.degToRad(gapEnd);
  g.add(ring);
  const capGeo = new THREE.SphereGeometry(0.2, 32, 24);
  [gapEnd, gapEnd + 360 - (gapEnd - gapStart)].forEach((deg) => {
    const a = THREE.MathUtils.degToRad(deg);
    const cap = new THREE.Mesh(capGeo, white);
    cap.position.set(Math.cos(a), Math.sin(a), 0);
    g.add(cap);
  });
  const pts = [new THREE.Vector3(-0.55, 0.06, 0.05), new THREE.Vector3(-0.08, -0.42, 0.05), new THREE.Vector3(1.05, 1.0, 0.05)];
  const accent = glossy(0xffffff, 0x00bef0, 0.25);
  for (let i = 0; i < pts.length - 1; i++) {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(pts[i], pts[i + 1]), 8, 0.18, 24, false), accent);
    g.add(tube);
  }
  const jointGeo = new THREE.SphereGeometry(0.18, 32, 24);
  pts.forEach((p) => {
    const s = new THREE.Mesh(jointGeo, accent);
    s.position.copy(p);
    g.add(s);
  });
  return g;
}

function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'hero3d-canvas';
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0b1e3f, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x00bef0, 18, 12);
  rim.position.set(-3, -2, 2);
  scene.add(rim);
  logo = buildLogo();
  logo.scale.setScalar(0.92);
  scene.add(logo);
  orbitGroup = new THREE.Group();
  orbitGroup.rotation.x = 1.12;
  orbitGroup.rotation.y = -0.25;
  scene.add(orbitGroup);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; loop(); });
  viewObs = new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); loop(); });
  resizeObs = new ResizeObserver(resize);
}

function setLessons(lessons) {
  const sig = JSON.stringify(lessons);
  if (sig === signature) return;
  signature = sig;
  orbs.splice(0).forEach((o) => { orbitGroup.remove(o.mesh); o.mesh.geometry.dispose(); o.mesh.material.dispose(); });
  const list = lessons.slice(0, 10);
  list.forEach((l, i) => {
    const done = !!l.done;
    const color = new THREE.Color(done ? MINT : l.color || '#FFC542');
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(done ? 0.15 : 0.13, 28, 20), glossy(color, color, done ? 0.55 : 0.18));
    orbitGroup.add(mesh);
    orbs.push({ mesh, phase: (i / Math.max(1, list.length)) * Math.PI * 2, radius: 1.62 + (i % 2) * 0.12 });
  });
}

function resize() {
  if (!host || !renderer) return;
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function place(t) {
  logo.rotation.y = Math.sin(t * 0.6) * 0.45;
  logo.rotation.x = Math.sin(t * 0.4) * 0.12;
  logo.position.y = Math.sin(t * 1.1) * 0.06;
  orbs.forEach((o) => {
    const a = o.phase + t * 0.55;
    o.mesh.position.set(Math.cos(a) * o.radius, Math.sin(a) * o.radius, 0);
  });
}
function frame() {
  rafId = 0;
  place(clock.getElapsedTime());
  renderer.render(scene, camera);
  loop();
}
function loop() {
  if (rafId || !host || !visible || !inView) return;
  rafId = requestAnimationFrame(frame);
}

function attach(el, lessons) {
  if (!el || !webglOk()) return false;
  if (!renderer) init();
  if (host !== el) {
    if (host) { resizeObs.unobserve(host); viewObs.unobserve(host); }
    host = el;
    host.appendChild(renderer.domElement);
    resizeObs.observe(host);
    viewObs.observe(host);
  }
  setLessons(lessons || []);
  resize();
  if (reducedMotion()) { place(0.8); renderer.render(scene, camera); return true; }
  loop();
  return true;
}

window.Hero3D = { attach };
window.dispatchEvent(new Event('hero3d-ready'));
