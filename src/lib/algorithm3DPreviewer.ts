import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Algorithm3DPreviewer class
 * This class creates a 3D preview environment using Three.js
 */
export class Algorithm3DPreviewer {
  public stats: Stats;
  public clock: THREE.Clock;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public controls: OrbitControls;
  public cube: THREE.Mesh;
  public renderEnable: Boolean = true;

  /**
   * Constructor for Algorithm3DPreviewer
   * @param viewerElement - The HTML canvas element to render the 3D scene
   */
  constructor(public viewerElement: HTMLCanvasElement) {
    // Initialize stats for performance monitoring
    this.stats = new Stats();

    // Create a clock for timing
    this.clock = new THREE.Clock();

    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Set up the renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: viewerElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Create the scene
    this.scene = new THREE.Scene();

    // Set up orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.enableRender();
    });
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.right = '0px';
    // this.stats.dom.style.bottom = '0px';
    // Append stats to the DOM
    if (viewerElement) {
      viewerElement.parentElement?.appendChild(this.stats.dom);
    }

    // Create a cube and add it to the scene
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.cube.visible = false;
    this.scene.add(this.cube);

    // Bind methods to this instance
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    // Initialize and start animation
    this.init();
    this.animate();
  }

  /**
   * Initialize the previewer
   */
  init(): void {
    window.addEventListener('resize', this.onWindowResize);
  }

  /**
   * Handle window resize events
   */
  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.enableRender();
  }

  /**
   * Enable rendering
   */
  enableRender(): void {
    this.renderEnable = true;
  }

  /**
   * Animation loop
   */
  animate(): void {
    requestAnimationFrame(this.animate);

    this.stats.update();

    // Rotate the test cube
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;

    if (this.renderEnable) {
      this.renderEnable = false;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Clean up resources
   */
  disposeCircus(): void {
    this.scene.remove(this.cube);
    this.cube.geometry.dispose();
    (this.cube.material as THREE.Material).dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize);
  }
}
