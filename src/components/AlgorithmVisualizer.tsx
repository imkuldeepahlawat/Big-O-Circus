import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { Algorithm3DPreviewer } from '../libs/algorithm3DPreviewer';

import * as THREE from 'three';
import { Algorithm3DPreviewer } from '../libs/algorithm3DPreviewer';

export const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ canvas: mountRef.current });
    const controls = new OrbitControls(camera, renderer.domElement);
    if (controls instanceof THREE.Object3D) scene.add(controls);

    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create a cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    scene.add(cube.clone());

    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect =
          mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(
          mountRef.current.clientWidth,
          mountRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      renderer.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={mountRef}></canvas>;
};

const AlgorithmVisualizer: React.FC = () => {
  const algoCircusDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const algoCircusViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  // const algorithmVisualizer3dViewerRef = useRef<Algorithm3DPreviewer | null>(null);

  useEffect(() => {
    // Effect implementation
    if (algoCircusDomElementRef.current) {
      // console.log(algoCircusDomElementRef, 'Visual');
      algoCircusViewerRef.current = new Algorithm3DPreviewer(
        algoCircusDomElementRef.current
      );
    }
  }, []);

  return (
    <div className='w-full h-full'>
      <canvas ref={algoCircusDomElementRef}></canvas>
      {/* <ThreeScene /> */}
    </div>
  );
};

export default AlgorithmVisualizer;
