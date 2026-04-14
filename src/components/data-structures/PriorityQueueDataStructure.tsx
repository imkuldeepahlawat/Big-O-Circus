import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface PriorityItem {
  value: number;
  priority: number;
}

const PriorityQueueDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [pq, setPq] = useState<PriorityItem[]>([]);

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
  }, [pq]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const sorted = [...pq].sort((a, b) => a.priority - b.priority);

    for (let i = 0; i < sorted.length; i++) {
      const height = 0.3 + sorted[i].priority * 0.15;
      const geometry = new THREE.BoxGeometry(1, height, 1);
      const hue = sorted[i].priority / 10;
      const color = new THREE.Color().setHSL(0.6 - hue * 0.4, 0.8, 0.5);
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.x = i * 1.2;
      cube.position.y = height / 2;
      group.add(cube);

      // Value label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'white';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`${sorted[i].value}`, 64, 50);
        context.font = '32px Arial';
        context.fillStyle = '#ffdd57';
        context.fillText(`p:${sorted[i].priority}`, 64, 90);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeometry = new THREE.PlaneGeometry(0.8, 0.8);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.z = 0.51;
      label.position.x = i * 1.2;
      label.position.y = height / 2;
      group.add(label);
    }

    group.position.x = -((sorted.length - 1) * 0.6);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const enqueue = () => {
    const value = Math.floor(Math.random() * 100);
    const priority = Math.floor(Math.random() * 10) + 1;
    const newItem: PriorityItem = { value, priority };
    const newPq = [...pq, newItem].sort((a, b) => a.priority - b.priority);
    setPq(newPq);
  };

  const dequeue = () => {
    if (pq.length > 0) {
      const sorted = [...pq].sort((a, b) => a.priority - b.priority);
      sorted.shift();
      setPq(sorted);
    }
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Priority Queue</h3>
        <p>Size: {pq.length}</p>
        <p>
          Highest priority:{' '}
          {pq.length > 0
            ? `${[...pq].sort((a, b) => a.priority - b.priority)[0].value} (p:${[...pq].sort((a, b) => a.priority - b.priority)[0].priority})`
            : 'N/A'}
        </p>
        <div className='mt-2'>
          <button
            onClick={enqueue}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
          >
            Enqueue
          </button>
          <button
            onClick={dequeue}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Dequeue (Highest Priority)
          </button>
        </div>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>About Priority Queue</h3>
        <p>
          A priority queue is an abstract data type where each element has a
          priority. Elements with higher priority are dequeued before elements
          with lower priority, regardless of insertion order.
        </p>
        <ul className='mt-2 text-sm list-disc list-inside'>
          <li>Enqueue: O(log n)</li>
          <li>Dequeue: O(log n)</li>
          <li>Peek: O(1)</li>
        </ul>
      </div>
    </div>
  );
};

export default PriorityQueueDataStructure;
