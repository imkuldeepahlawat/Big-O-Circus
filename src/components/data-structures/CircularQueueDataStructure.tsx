import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const CAPACITY = 8;

const CircularQueueDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [slots, setSlots] = useState<(number | null)[]>(
    new Array(CAPACITY).fill(null)
  );
  const [front, setFront] = useState<number>(-1);
  const [rear, setRear] = useState<number>(-1);

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
  }, [slots, front, rear]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const radius = 2.5;

    for (let i = 0; i < CAPACITY; i++) {
      const angle = (i / CAPACITY) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      let color = 0x555555; // empty
      if (slots[i] !== null) color = 0x4287f5; // occupied
      if (i === front && front !== -1) color = 0x42f584; // front - green
      if (i === rear && rear !== -1) color = 0xf5a442; // rear - orange
      if (i === front && i === rear && front !== -1) color = 0xf542f5; // both - purple

      const geometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      cube.position.z = z;
      group.add(cube);

      // Value and index label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'white';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const text = slots[i] !== null ? slots[i]!.toString() : '-';
        context.fillText(text, 64, 50);
        context.font = '28px Arial';
        context.fillStyle = '#aaaaaa';
        context.fillText(`[${i}]`, 64, 95);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeometry = new THREE.PlaneGeometry(0.7, 0.7);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.x = x;
      label.position.y = 0.5;
      label.position.z = z;
      label.rotation.x = -Math.PI / 4;
      group.add(label);

      // Front/Rear indicators
      if (
        (i === front && front !== -1) ||
        (i === rear && rear !== -1)
      ) {
        const indCanvas = document.createElement('canvas');
        indCanvas.width = 128;
        indCanvas.height = 64;
        const indCtx = indCanvas.getContext('2d');
        if (indCtx) {
          let labelText = '';
          if (i === front && i === rear) labelText = 'F/R';
          else if (i === front) labelText = 'FRONT';
          else labelText = 'REAR';
          indCtx.fillStyle = i === front && i !== rear ? '#42f584' : i === rear && i !== front ? '#f5a442' : '#f542f5';
          indCtx.font = 'bold 32px Arial';
          indCtx.textAlign = 'center';
          indCtx.textBaseline = 'middle';
          indCtx.fillText(labelText, 64, 32);
        }
        const indTexture = new THREE.CanvasTexture(indCanvas);
        const indGeo = new THREE.PlaneGeometry(0.7, 0.25);
        const indMat = new THREE.MeshBasicMaterial({
          map: indTexture,
          transparent: true,
        });
        const indLabel = new THREE.Mesh(indGeo, indMat);
        indLabel.position.x = x;
        indLabel.position.y = -0.5;
        indLabel.position.z = z;
        indLabel.rotation.x = -Math.PI / 4;
        group.add(indLabel);
      }
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const isFull = () => {
    return (rear + 1) % CAPACITY === front;
  };

  const isEmpty = () => {
    return front === -1;
  };

  const enqueue = () => {
    if (isFull()) return;
    const value = Math.floor(Math.random() * 100);
    const newSlots = [...slots];

    if (isEmpty()) {
      setFront(0);
      setRear(0);
      newSlots[0] = value;
    } else {
      const newRear = (rear + 1) % CAPACITY;
      newSlots[newRear] = value;
      setRear(newRear);
    }
    setSlots(newSlots);
  };

  const dequeueItem = () => {
    if (isEmpty()) return;
    const newSlots = [...slots];
    newSlots[front] = null;

    if (front === rear) {
      setFront(-1);
      setRear(-1);
    } else {
      setFront((front + 1) % CAPACITY);
    }
    setSlots(newSlots);
  };

  const size = () => {
    if (isEmpty()) return 0;
    if (rear >= front) return rear - front + 1;
    return CAPACITY - front + rear + 1;
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Circular Queue</h3>
        <p>Capacity: {CAPACITY}</p>
        <p>Size: {size()}</p>
        <p>Front index: {front === -1 ? 'N/A' : front}</p>
        <p>Rear index: {rear === -1 ? 'N/A' : rear}</p>
        <p>Full: {isFull() ? 'Yes' : 'No'}</p>
        <div className='mt-2'>
          <button
            onClick={enqueue}
            disabled={isFull()}
            className={`${isFull() ? 'bg-gray-400' : 'bg-blue-500'} text-white px-4 py-2 rounded mr-2`}
          >
            Enqueue
          </button>
          <button
            onClick={dequeueItem}
            disabled={isEmpty()}
            className={`${isEmpty() ? 'bg-gray-400' : 'bg-red-500'} text-white px-4 py-2 rounded`}
          >
            Dequeue
          </button>
        </div>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>About Circular Queue</h3>
        <p>
          A circular queue uses a fixed-size array where the rear wraps around
          to the front, efficiently reusing space vacated by dequeued elements.
        </p>
        <ul className='mt-2 text-sm list-disc list-inside'>
          <li>Enqueue: O(1)</li>
          <li>Dequeue: O(1)</li>
          <li>Space: O(n) fixed</li>
        </ul>
        <div className='mt-2 text-xs'>
          <span className='inline-block w-3 h-3 bg-green-500 mr-1'></span> Front
          <span className='inline-block w-3 h-3 bg-orange-500 ml-2 mr-1'></span> Rear
          <span className='inline-block w-3 h-3 bg-purple-500 ml-2 mr-1'></span> Both
        </div>
      </div>
    </div>
  );
};

export default CircularQueueDataStructure;
