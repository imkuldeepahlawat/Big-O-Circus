import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const QuickSortCircus: React.FC = () => {
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

  const quickSort = async (): Promise<void> => {
    if (isSorting) return;
    setIsSorting(true);
    try {
      console.log('Starting quick sort');
      await quickSortHelper(0, array.length - 1);
      setCurrentIndices([]);
      console.log('Sorted array:', array);
    } catch (err) {
      console.error('Error in quickSort:', err);
    } finally {
      setIsSorting(false);
    }
  };

  const quickSortHelper = async (low: number, high: number): Promise<void> => {
    if (low < high) {
      const pivotIndex = await partition(low, high);
      await quickSortHelper(low, pivotIndex - 1);
      await quickSortHelper(pivotIndex + 1, high);
    }
  };

  const partition = async (low: number, high: number): Promise<number> => {
    const pivot = array[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      setCurrentIndices([j, high]);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization

      if (array[j] < pivot) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
        setArray([...array]);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization
      }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    setArray([...array]);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization

    return i + 1;
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Quick Sort</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateRandomArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSorting}
          >
            Generate Random Array
          </button>
          <button
            onClick={quickSort}
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

export default QuickSortCircus;
