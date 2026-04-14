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
  public renderEnable: Boolean = true;
  private animationFrameId: number = 0;

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
    this.renderer = new THREE.WebGLRenderer({
      canvas: viewerElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create the scene
    this.scene = new THREE.Scene();

    // Add default lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    // Set up orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.enableRender();
    });
    if (this.stats?.domElement) {
      this.stats.domElement.style.left = '';
      this.stats.domElement.style.right = '0';
      this.stats.domElement.style.zIndex = '50';
    }

    // Append stats to the DOM
    if (viewerElement) {
      viewerElement.parentElement?.appendChild(this.stats.dom);
    }

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
    this.animationFrameId = requestAnimationFrame(this.animate);

    this.stats.update();

    if (this.renderEnable) {
      this.renderEnable = false;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dispose all children from the scene (geometries, materials, textures)
   */
  disposeSceneChildren(): void {
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.disposeObject(child);
      this.scene.remove(child);
    }

    // Re-add lighting after clearing
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
  }

  /**
   * Recursively dispose a Three.js object and its children
   */
  private disposeObject(obj: THREE.Object3D): void {
    if (obj.children) {
      for (let i = obj.children.length - 1; i >= 0; i--) {
        this.disposeObject(obj.children[i]);
      }
    }

    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => {
            this.disposeMaterial(mat);
          });
        } else {
          this.disposeMaterial(obj.material);
        }
      }
    }

    if (obj instanceof THREE.Line) {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat) => this.disposeMaterial(mat));
        } else {
          this.disposeMaterial(obj.material);
        }
      }
    }
  }

  /**
   * Dispose a material and its textures
   */
  private disposeMaterial(material: THREE.Material): void {
    if ((material as THREE.MeshStandardMaterial).map) {
      (material as THREE.MeshStandardMaterial).map?.dispose();
    }
    material.dispose();
  }

  /**
   * Clean up all resources
   */
  disposeCircus(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.disposeSceneChildren();
    this.controls.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.stats.dom.parentElement) {
      this.stats.dom.parentElement.removeChild(this.stats.dom);
    }
  }
}
