import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Algorithm3DPreviewer {
  public stats: Stats;
  public clock: THREE.Clock;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public controls: OrbitControls;
  public cube: THREE.Mesh;
  public renderEnable: Boolean = true;

  constructor(public viewerElement: HTMLCanvasElement) {
    this.stats = new Stats();
    this.clock = new THREE.Clock();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ canvas: viewerElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.enableRender();
    });

    if (viewerElement) {
      viewerElement.parentElement?.appendChild(this.stats.dom);
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.visible = false;
    this.scene.add(this.cube);

    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    this.init();
    this.animate();
  }

  init(): void {
    window.addEventListener('resize', this.onWindowResize);
  }

  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  enableRender(): void {
    this.renderEnable = true;
  }

  animate(): void {
    requestAnimationFrame(this.animate);

    this.stats.update();

    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    if (this.renderEnable) {
      this.renderEnable = false;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  disposeCircus(): void {
    this.scene.remove(this.cube);
    this.cube.geometry.dispose();
    (this.cube.material as THREE.Material).dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize);
  }
}
