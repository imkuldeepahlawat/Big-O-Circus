import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const QueueDataStructure: React.FC = () => {
  const queueDsCircusDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const queueDsCircusViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [queue, setQueue] = useState<number[]>([]);

  useEffect(() => {
    if (queueDsCircusDomElementRef.current) {
      queueDsCircusViewerRef.current = new Algorithm3DPreviewer(
        queueDsCircusDomElementRef.current
      );
      updateQueueVisualization();
    }
  }, []);

  useEffect(() => {
    updateQueueVisualization();
  }, [queue]);

  const updateQueueVisualization = () => {
    if (queueDsCircusViewerRef.current) {
      // Clear existing scene
      while (queueDsCircusViewerRef.current.scene.children.length > 0) {
        queueDsCircusViewerRef.current.scene.remove(
          queueDsCircusViewerRef.current.scene.children[0]
        );
      }

      const queueGroup = new THREE.Group();

      for (let i = 0; i < queue.length; i++) {
        const geometry = new THREE.BoxGeometry(1, 0.5, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x4287f5 });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.x = i * 1.2;
        queueGroup.add(cube);

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
          context.fillText(queue[i].toString(), 64, 64);
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
        queueGroup.add(label);
      }

      queueGroup.position.x = -((queue.length - 1) * 0.6);
      queueDsCircusViewerRef.current.scene.add(queueGroup);
      queueDsCircusViewerRef.current.enableRender();
    }
  };

  const enqueue = () => {
    const newValue = Math.floor(Math.random() * 100);
    setQueue([...queue, newValue]);
  };

  const dequeue = () => {
    if (queue.length > 0) {
      setQueue(queue.slice(1));
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={queueDsCircusDomElementRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Queue Information</h3>
        <p>Size: {queue.length}</p>
        <p>Front element: {queue.length > 0 ? queue[0] : 'N/A'}</p>
        <p>
          Rear element: {queue.length > 0 ? queue[queue.length - 1] : 'N/A'}
        </p>
        <div className='mt-2'>
          <button
            onClick={enqueue}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
          >
            Push
          </button>
          <button
            onClick={dequeue}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Pop
          </button>
        </div>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Queue Data Structure</h3>
        <p className='capitalize'>
          A queue is a data structure that follows the First-In-First-Out (FIFO)
          principle{' '}
          <a
            href='https://www.retailsensing.com/people-counting/wp-content/uploads/queue-supermarket2.jpg'
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

export default QueueDataStructure;
