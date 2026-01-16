const canvas = document.getElementById("glcanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 2);
camera.lookAt(0, 0, 0);

const orbitalCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
orbitalCamera.position.set(0.7, 0.7, -2);
orbitalCamera.lookAt(0, 0, 0);

const controls = new THREE.OrbitControls(orbitalCamera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2.5;
controls.maxDistance = 5;
// controls.rotateSpeed = 0.5;
controls.enableZoom = true;
controls.enablePan = false;
controls.target.set(0, 0, 0);
controls.update();

const shaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2() },
    u_color: { value: new THREE.Vector3(1, 0.5, 0) },
    u_speed: { value: 1.0 },
    u_arms: { value: 6 },
    u_bloom: { value: 0.1 },
    u_noise: { value: 0.2 },
    u_distortion: { value: 0.2 },
    u_depth: { value: 1.0 },
    u_xRotation: { value: 0.0 },
    u_viewMatrix: { value: new THREE.Matrix4() },
    u_planeMatrix: { value: new THREE.Matrix4() }
  },
  vertexShader: document.getElementById("vertShader").textContent,
  fragmentShader: document.getElementById("fragShader").textContent,
  transparent: true,
  side: THREE.DoubleSide
});

const geometry = new THREE.PlaneGeometry(3, 2);
const mesh = new THREE.Mesh(geometry, shaderMaterial);
scene.add(mesh);

const createWireframe = (geometry, color, thickness) => {
  const group = new THREE.Group();
  const edges = new THREE.EdgesGeometry(geometry);

  for (let i = 0; i < thickness; i++) {
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7
    });
    const wireframe = new THREE.LineSegments(edges, mat);
    wireframe.position.z = i * 0.0005;
    group.add(wireframe);
  }
  return group;
};

const wireframe = createWireframe(geometry, 0xffffff, 10);
scene.add(wireframe);

let mouseX = 0, mouseY = 0;
let tiltAmount = 0.4;
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width;
  mouseY = 1 - (e.clientY - rect.top) / rect.height;

  targetRotationX = (mouseY - 0.5) * tiltAmount;
  targetRotationY = (mouseX - 0.5) * tiltAmount;

  shaderMaterial.uniforms.u_mouse.value.set(mouseX * window.innerWidth, mouseY * window.innerHeight);
});

document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  document.body.style.setProperty('--mouse-x', `${x}%`);
  document.body.style.setProperty('--mouse-y', `${y}%`);
});

function hexToRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

let speed = 1.5;
let arms = 6;
let color = hexToRGB('#ff8800');
let bloom = 0.1;
let noiseAmount = 0.2;
let distortion = 0.0;

// Event Listeners for Controls
document.getElementById('speed').addEventListener('input', (e) => {
  speed = parseFloat(e.target.value);
});

document.getElementById('arms').addEventListener('input', (e) => {
  arms = parseFloat(e.target.value);
});

document.getElementById('color').addEventListener('input', (e) => {
  color = hexToRGB(e.target.value);
});

document.getElementById('bloom').addEventListener('input', (e) => {
  bloom = parseFloat(e.target.value);
});

document.getElementById('noise').addEventListener('input', (e) => {
  noiseAmount = parseFloat(e.target.value);
});

document.getElementById('distortion').addEventListener('input', (e) => {
  distortion = parseFloat(e.target.value);
});

document.getElementById('tilt').addEventListener('input', (e) => {
  tiltAmount = parseFloat(e.target.value);
});

function render(t) {
  const time = t * 0.001;
  controls.update();

  currentRotationX += (targetRotationX - currentRotationX) * 0.1;
  currentRotationY += (targetRotationY - currentRotationY) * 0.1;

  mesh.rotation.x = currentRotationX;
  mesh.rotation.y = currentRotationY;

  wireframe.rotation.copy(mesh.rotation);

  orbitalCamera.updateMatrixWorld();
  camera.updateMatrixWorld();

  mesh.material.uniforms.u_time.value = time;
  mesh.material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
  mesh.material.uniforms.u_speed.value = speed;
  mesh.material.uniforms.u_arms.value = arms;
  mesh.material.uniforms.u_color.value.set(color[0], color[1], color[2]);
  mesh.material.uniforms.u_bloom.value = bloom;
  mesh.material.uniforms.u_noise.value = noiseAmount;
  mesh.material.uniforms.u_distortion.value = distortion;
  mesh.material.uniforms.u_viewMatrix.value.copy(orbitalCamera.matrixWorld);
  mesh.material.uniforms.u_planeMatrix.value.copy(camera.matrixWorld);

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  orbitalCamera.aspect = width / height;
  orbitalCamera.updateProjectionMatrix();
  renderer.setSize(width, height);
  shaderMaterial.uniforms.u_resolution.value.set(width, height);
});

const toggleControls = document.getElementById('toggleControls');
const controlsPanel = document.getElementById('controls');

toggleControls.addEventListener('click', () => {
  controlsPanel.classList.toggle('visible');
});

renderer.setSize(window.innerWidth, window.innerHeight);
render(0);
