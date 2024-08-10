import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export class Algorithm3DPreviewer {
  container = document.getElementById(
    "algorithmVisualizer3dViewerCanvasElement"
  );
  stats = new Stats();
  clock = new THREE.Clock();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  scene = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  controls = new OrbitControls(this.camera, this.renderer.domElement);
  constructor() {
    this.init();
    this.animate();
    window.addEventListener("resize", this.onWindowResize, false);
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  init() {
    this.stats.showPanel(0);
    this.container.appendChild(this.stats.dom);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);
    this.scene.background = new THREE.Color(0xbfe3dd);
    this.camera.position.z = -5;
    this.scene.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      )
    );
    this.scene.updateMatrix();
    // this.renderer.setAnimationLoop(this.animate);
  }
  animate() {
    const delta = this.clock.getDelta();

    // mixer.update( delta );

    this.controls.update();

    this.stats.update();

    this.renderer.render(this.scene, this.camera);
    this.animate();
  }
}
