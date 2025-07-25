import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const StackDataStructure: React.FC = () => {
  const stackDsCircusDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const stackDsCircusViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [stack, setStack] = useState<number[]>([]);

  useEffect(() => {
    if (stackDsCircusDomElementRef.current) {
      stackDsCircusViewerRef.current = new Algorithm3DPreviewer(
        stackDsCircusDomElementRef.current
      );
      updateStackVisualization();
    }
  }, []);

  useEffect(() => {
    updateStackVisualization();
  }, [stack]);

  const updateStackVisualization = () => {
    if (stackDsCircusViewerRef.current) {
      // Clear existing scene
      while (stackDsCircusViewerRef.current.scene.children.length > 0) {
        stackDsCircusViewerRef.current.scene.remove(
          stackDsCircusViewerRef.current.scene.children[0]
        );
      }

      const stackGroup = new THREE.Group();

      for (let i = 0; i < stack.length; i++) {
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.y = i * 0.6;
        stackGroup.add(cube);

        // Add text label
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = 'white';
          context.font = 'bold 64px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(stack[i].toString(), 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.z = 0.51;
        label.position.y = i * 0.6;
        stackGroup.add(label);
      }

      stackGroup.position.y = -((stack.length - 1) * 0.3);
      stackDsCircusViewerRef.current.scene.add(stackGroup);
      stackDsCircusViewerRef.current.enableRender();
    }
  };

  const pushToStack = () => {
    const newValue = Math.floor(Math.random() * 100);
    setStack([...stack, newValue]);
  };

  const popFromStack = () => {
    if (stack.length > 0) {
      setStack(stack.slice(0, -1));
    }
  };

  return (
    <div className='relative w-full h-screen'>
      <canvas ref={stackDsCircusDomElementRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Stack Information</h3>
        <p>Size: {stack.length}</p>
        <p>Top element: {stack.length > 0 ? stack[stack.length - 1] : 'N/A'}</p>
        <p>Bottom element: {stack.length > 0 ? stack[0] : 'N/A'}</p>
        <div className='mt-2'>
          <button
            onClick={pushToStack}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
          >
            Push
          </button>
          <button
            onClick={popFromStack}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Pop
          </button>
        </div>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Stack Data Structure</h3>
        <p className='capitalize'>
          A stack is a linear data structure that follows the Last-In-First-Out
          (LIFO) principle.
          <a
            href='https://upload.wikimedia.org/wikipedia/commons/1/19/Tallrik_-_Ystad-2018.jpg'
            target='_blank'
            className='text-blue-600 underline'
          >
            Ref
          </a>
        </p>
      </div>
    </div>
  );
};

export default StackDataStructure;
