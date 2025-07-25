import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const CountingSortCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [countArray, setCountArray] = useState<number[]>([]);
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
  }, [array, countArray, currentIndices]);

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    clearScene();
    const sceneGroup = new THREE.Group();

    // Visualize main array
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

    // Visualize count array
    countArray.forEach((value, index) => {
      const barGeometry = new THREE.BoxGeometry(0.5, value, 0.5);
      const barMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * 0.75 - (countArray.length - 1) * 0.375,
        value / 2,
        -5
      );
      sceneGroup.add(barMesh);

      // Add count label
      const labelGeometry = new THREE.PlaneGeometry(0.5, 0.25);
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 16;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'white';
        context.font = 'bold 12px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(value.toString(), 16, 8);
      }
      const labelTexture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(
        index * 0.75 - (countArray.length - 1) * 0.375,
        value + 0.25,
        -5
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
      setCountArray([]);
      setCurrentIndices([]);
    } catch (err) {
      console.error('Error in generateRandomArray:', err);
    }
  };

  const countingSort = async (): Promise<void> => {
    if (isSorting) return;
    setIsSorting(true);
    try {
      console.log('Starting counting sort');
      const max = Math.max(...array);
      const count = new Array(max + 1).fill(0);
      const output = new Array(array.length);

      // Count occurrences
      for (let i = 0; i < array.length; i++) {
        count[array[i]]++;
        setCountArray([...count]);
        setCurrentIndices([i]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Calculate cumulative count
      for (let i = 1; i <= max; i++) {
        count[i] += count[i - 1];
        setCountArray([...count]);
        setCurrentIndices([i]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Build output array
      for (let i = array.length - 1; i >= 0; i--) {
        output[count[array[i]] - 1] = array[i];
        count[array[i]]--;
        setArray([...output]);
        setCountArray([...count]);
        setCurrentIndices([i, count[array[i]]]);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setArray([...output]);
      setCurrentIndices([]);
      console.log('Sorted array:', output);
    } catch (err) {
      console.error('Error in countingSort:', err);
    } finally {
      setIsSorting(false);
    }
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Counting Sort</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateRandomArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSorting}
          >
            Generate Random Array
          </button>
          <button
            onClick={countingSort}
            className='bg-green-500 text-white px-4 py-2 rounded'
            disabled={isSorting || array.length === 0}
          >
            {isSorting ? 'Sorting...' : 'Sort Array'}
          </button>
        </div>
        <div>
          <strong>Current Array:</strong> {array.join(', ')}
        </div>
        <div>
          <strong>Count Array:</strong> {countArray.join(', ')}
        </div>
      </div>
    </div>
  );
};

export default CountingSortCircus;
