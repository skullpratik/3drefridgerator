import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';






const scene = new THREE.Scene();

// Remove background image code
// Set light blue background color
// (sky blue: 0x87ceeb)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x87ceeb, 1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;


const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);


const loader = new GLTFLoader();
let fridgeBodyMeshes = [];
let fridgeTopMeshes = [];
let originalBodyColors = [];
let originalTopColors = [];
let mixer;
let bottomDoorAction, topDoorAction;

loader.load(
  '/scene.gltf',
  (gltf) => {
    scene.add(gltf.scene);

    gltf.scene.position.y = -2; 
    gltf.scene.scale.set(1.2, 1.2, 1.2); // instead of (2, 2, 2)
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        console.log('Mesh name:', child.name);
      }
      if (child.isMesh && child.name === 'pCube1_lambert1_0') {
        fridgeBodyMeshes.push(child);
        originalBodyColors.push(child.material.color.clone());
      }
      if (child.isMesh && child.name === 'pCube5_lambert1_0') {
        fridgeTopMeshes.push(child);
        originalTopColors.push(child.material.color.clone());
      }
    });

   
    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Animations found in the model:', gltf.animations.map(a => a.name));
      mixer = new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach((clip) => {
        if (clip.name === 'Bottom Door Animation') {
          bottomDoorAction = mixer.clipAction(clip);
        }
        if (clip.name === 'Top Door Animation') {
          topDoorAction = mixer.clipAction(clip);
        }
      });
    } else {
      console.log('No animations or mapping for opening the fridge found in the model.');
    }
    animate();
  },
  undefined,
  (error) => {
    console.error('An error happened', error);
  }
);


window.addEventListener('DOMContentLoaded', () => {
  const fridgeBodyNames = [
    'OldFridgefbx_Shell_0',
    'OldFridgefbx_Element_0',
    'Fridge_BottomDoor_Shell_0',
    'Fridge_TopDoor_Shell_0'
  ];

  // Dropdown color change
  document.getElementById('fridgeColorSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === "original") {
      // Restore original colors
      scene.traverse((child) => {
        if (child.isMesh && fridgeBodyNames.includes(child.name)) {
          // Find the index of the mesh in fridgeBodyMeshes
          const idx = fridgeBodyMeshes.findIndex(mesh => mesh.name === child.name);
          if (idx !== -1) {
            child.material.color.copy(originalBodyColors[idx]);
          }
        }
      });
    } else {
      const color = Number(value);
      scene.traverse((child) => {
        if (child.isMesh && fridgeBodyNames.includes(child.name)) {
          child.material.color.set(color);
        }
      });
    }
  });

  document.getElementById('openBottomDoorBtn').addEventListener('click', () => {
    if (bottomDoorAction) {
      bottomDoorAction.reset();
      bottomDoorAction.play();
    }
  });

  document.getElementById('openTopDoorBtn').addEventListener('click', () => {
    if (topDoorAction) {
      topDoorAction.reset();
      topDoorAction.play();
    }
  });

  document.getElementById('stopAnimBtn').addEventListener('click', () => {
    if (bottomDoorAction) {
      bottomDoorAction.stop();
      bottomDoorAction.reset();
      bottomDoorAction.paused = false;
    }
    if (topDoorAction) {
      topDoorAction.stop();
      topDoorAction.reset();
      topDoorAction.paused = false;
    }
  });
});


camera.position.set(0, 2, 15); // or even 20 if needed
camera.lookAt(0, 0, 0);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (mixer) mixer.update(0.016); 
  renderer.render(scene, camera);
}


window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
