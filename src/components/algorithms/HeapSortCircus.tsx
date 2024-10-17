import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const HeapSortCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [currentIndices, setCurrentIndices] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState(false);

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        generateRandomArray();
      }
    } catch (err) {
      console.error('Error in initial useEffect:', err);
    }
  }, []);

  useEffect(() => {
    try {
      if (visualizerRef.current) {
        updateVisualization();
      }
    } catch (err) {
      console.error('Error in updateVisualization useEffect:', err);
    }
  }, [array, currentIndices]);

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    clearScene();
    const sceneGroup = new THREE.Group();

    array.forEach((value, index) => {
      const barGeometry = new THREE.BoxGeometry(1, value, 1);
      const barMaterial = new THREE.MeshBasicMaterial({
        color: currentIndices.includes(index) ? 0xff0000 : 0x4287f5,
      });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * 1.5 - (array.length - 1) * 0.75,
        value / 2,
        0
      );
      sceneGroup.add(barMesh);

      // Add value label
      const labelGeometry = new THREE.PlaneGeometry(1, 0.5);
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(value.toString(), 32, 16);
      }
      const labelTexture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(
        index * 1.5 - (array.length - 1) * 0.75,
        value + 0.5,
        0
      );
      sceneGroup.add(label);
    });

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const clearScene = (): void => {
    if (!visualizerRef.current) return;
    while (visualizerRef.current.scene.children.length > 0) {
      visualizerRef.current.scene.remove(
        visualizerRef.current.scene.children[0]
      );
    }
  };

  const generateRandomArray = (length: number = 10): void => {
    try {
      console.log('Generating random array');
      const newArray = Array.from(
        { length },
        () => Math.floor(Math.random() * 10) + 1
      );
      console.log('Generated array:', newArray);
      setArray(newArray);
      setCurrentIndices([]);
    } catch (err) {
      console.error('Error in generateRandomArray:', err);
    }
  };

  const heapSort = async (): Promise<void> => {
    if (isSorting) return;
    setIsSorting(true);
    try {
      console.log('Starting heap sort');
      const n = array.length;

      // Build max heap
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(n, i);
      }

      // Extract elements from heap one by one
      for (let i = n - 1; i > 0; i--) {
        [array[0], array[i]] = [array[i], array[0]];
        setArray([...array]);
        setCurrentIndices([0, i]);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization

        await heapify(i, 0);
      }

      setCurrentIndices([]);
      console.log('Sorted array:', array);
    } catch (err) {
      console.error('Error in heapSort:', err);
    } finally {
      setIsSorting(false);
    }
  };

  const heapify = async (n: number, i: number): Promise<void> => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && array[left] > array[largest]) {
      largest = left;
    }

    if (right < n && array[right] > array[largest]) {
      largest = right;
    }

    if (largest !== i) {
      [array[i], array[largest]] = [array[largest], array[i]];
      setArray([...array]);
      setCurrentIndices([i, largest]);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization

      await heapify(n, largest);
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Heap Sort</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateRandomArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSorting}
          >
            Generate Random Array
          </button>
          <button
            onClick={heapSort}
            className='bg-green-500 text-white px-4 py-2 rounded'
            disabled={isSorting || array.length === 0}
          >
            {isSorting ? 'Sorting...' : 'Sort Array'}
          </button>
        </div>
        <div>
          <strong>Current Array:</strong> {array.join(', ')}
        </div>
      </div>
    </div>
  );
};

export default HeapSortCircus;
