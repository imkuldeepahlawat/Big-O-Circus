import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const DequeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [deque, setDeque] = useState<number[]>([]);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [deque, highlightIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    for (let i = 0; i < deque.length; i++) {
      const geometry = new THREE.BoxGeometry(1, 0.5, 1);
      let color = 0x4287f5;
      if (i === 0) color = 0x42f584; // front - green
      if (i === deque.length - 1) color = 0xf5a442; // rear - orange
      if (highlightIndex === i) color = 0xf54242; // highlighted - red

      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = i * 1.2;
      group.add(cube);

      // Arrow indicators for front and rear
      if (i === 0 || i === deque.length - 1) {
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width = 128;
        arrowCanvas.height = 64;
        const arrowCtx = arrowCanvas.getContext('2d');
        if (arrowCtx) {
          arrowCtx.fillStyle = i === 0 ? '#42f584' : '#f5a442';
          arrowCtx.font = 'bold 32px Arial';
          arrowCtx.textAlign = 'center';
          arrowCtx.textBaseline = 'middle';
          arrowCtx.fillText(i === 0 ? 'FRONT' : 'REAR', 64, 32);
        }
        const arrowTexture = new THREE.CanvasTexture(arrowCanvas);
        const arrowGeo = new THREE.PlaneGeometry(0.9, 0.3);
        const arrowMat = new THREE.MeshBasicMaterial({
          map: arrowTexture,
          transparent: true,
        });
        const arrowLabel = new THREE.Mesh(arrowGeo, arrowMat);
        arrowLabel.position.x = i * 1.2;
        arrowLabel.position.y = -0.5;
        arrowLabel.position.z = 0.51;
        group.add(arrowLabel);
      }

      // Value label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'white';
        context.font = 'bold 64px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(deque[i].toString(), 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.z = 0.51;
      label.position.x = i * 1.2;
      group.add(label);
    }

    group.position.x = -((deque.length - 1) * 0.6);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const pushFront = () => {
    const value = Math.floor(Math.random() * 100);
    setHighlightIndex(0);
    setDeque([value, ...deque]);
    setTimeout(() => setHighlightIndex(null), 500);
  };

  const pushBack = () => {
    const value = Math.floor(Math.random() * 100);
    setHighlightIndex(deque.length);
    setDeque([...deque, value]);
    setTimeout(() => setHighlightIndex(null), 500);
  };

  const popFront = () => {
    if (deque.length > 0) {
      setDeque(deque.slice(1));
    }
  };

  const popBack = () => {
    if (deque.length > 0) {
      setDeque(deque.slice(0, -1));
    }
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Deque (Double-ended Queue)</h3>
        <p>Size: {deque.length}</p>
        <p>Front: {deque.length > 0 ? deque[0] : 'N/A'}</p>
        <p>Rear: {deque.length > 0 ? deque[deque.length - 1] : 'N/A'}</p>
        <div className='mt-2 grid grid-cols-2 gap-2'>
          <button
            onClick={pushFront}
            className='bg-green-500 text-white px-3 py-2 rounded text-sm'
          >
            Push Front
          </button>
          <button
            onClick={pushBack}
            className='bg-blue-500 text-white px-3 py-2 rounded text-sm'
          >
            Push Back
          </button>
          <button
            onClick={popFront}
            className='bg-red-500 text-white px-3 py-2 rounded text-sm'
          >
            Pop Front
          </button>
          <button
            onClick={popBack}
            className='bg-orange-500 text-white px-3 py-2 rounded text-sm'
          >
            Pop Back
          </button>
        </div>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>About Deque</h3>
        <p>
          A deque (double-ended queue) allows insertion and removal of elements
          from both the front and the rear. It generalizes both stacks and
          queues.
        </p>
        <ul className='mt-2 text-sm list-disc list-inside'>
          <li>Push Front/Back: O(1)</li>
          <li>Pop Front/Back: O(1)</li>
          <li>Peek Front/Back: O(1)</li>
        </ul>
      </div>
    </div>
  );
};

export default DequeDataStructure;
