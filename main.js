import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import * as dat from "lil-gui";
import galaxyVertexShader from "./shaders/galaxyVertexShader";
import galaxyFragmentShader from "./shaders/galaxyFragmentShader";

// Debug
const gui = new dat.GUI();

// textureLoader
const textureLoader = new THREE.TextureLoader();
const galaxyTexture = textureLoader.load("/textures/particles/8.png");

// Galaxy parameters
const parameters = {};
parameters.count = 100000;
parameters.size = 0.01;
parameters.radius = 5;
parameters.branches = 3;
parameters.spin = 1;
parameters.randomness = 0.2;
parameters.randomnessPower = 3;
parameters.insideColor = "#ff6030";
parameters.outsideColor = "#1b3984";

const screenSizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  screenSizes.width / screenSizes.height,
  0.1,
  1000
);
camera.position.set(1, 3, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(screenSizes.width, screenSizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const canvas = renderer.domElement;
document.body.appendChild(canvas);

// galaxy
let galaxyGeometry = null;
let galaxyMaterial = null;
let galaxy = null;

const generateGalaxy = () => {
  if (galaxy !== null) {
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    scene.remove(galaxy);
  }

  galaxyGeometry = new THREE.BufferGeometry();
  const galaxyPoints = new Float32Array(parameters.count * 3);
  const galaxyColors = new Float32Array(parameters.count * 3);
  const PointsScale = new Float32Array(parameters.count);
  const randomness = new Float32Array(parameters.count * 3);
  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;

    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    galaxyPoints[i3] = Math.cos(branchAngle) * radius;
    galaxyPoints[i3 + 1] = 0;
    galaxyPoints[i3 + 2] = Math.sin(branchAngle) * radius;

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    // Color
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);

    galaxyColors[i3] = mixedColor.r;
    galaxyColors[i3 + 1] = mixedColor.g;
    galaxyColors[i3 + 2] = mixedColor.b;

    // Scale
    PointsScale[i] = Math.random();
  }

  galaxyGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(galaxyPoints, 3)
  );
  galaxyGeometry.setAttribute(
    "color",
    new THREE.BufferAttribute(galaxyColors, 3)
  );
  galaxyGeometry.setAttribute(
    "aScale",
    new THREE.BufferAttribute(PointsScale, 1)
  );
  galaxyGeometry.setAttribute(
    "aRandomness",
    new THREE.BufferAttribute(randomness, 3)
  );

  galaxyMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 50 * renderer.getPixelRatio() },
    },
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
  });
  galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
  scene.add(galaxy);
};

generateGalaxy();

// Debug Controls
gui
  .add(parameters, "count")
  .min(100)
  .max(1000000)
  .step(100)
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, "radius")
  .min(0.1)
  .max(20)
  .step(0.1)
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, "branches")
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, "randomness")
  .min(0)
  .max(2)
  .step(0.001)
  .onFinishChange(generateGalaxy);
gui
  .add(parameters, "randomnessPower")
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(generateGalaxy);
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

// Handle Resize
window.addEventListener("resize", () => {
  // Update sizes
  screenSizes.width = window.innerWidth;
  screenSizes.height = window.innerHeight;

  // Update camera
  camera.aspect = screenSizes.width / screenSizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(screenSizes.width, screenSizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Animate
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // update uniforms
  galaxyMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
