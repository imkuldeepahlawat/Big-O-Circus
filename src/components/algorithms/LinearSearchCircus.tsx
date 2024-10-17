import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const LinearSearchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

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
  }, [array, currentIndex]);

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    clearScene();
    const sceneGroup = new THREE.Group();

    array.forEach((value, index) => {
      const barGeometry = new THREE.BoxGeometry(1, value, 1);
      const barMaterial = new THREE.MeshBasicMaterial({
        color: index === currentIndex ? 0xff0000 : 0x4287f5,
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
      setCurrentIndex(null);
      setSearchResult(null);
    } catch (err) {
      console.error('Error in generateRandomArray:', err);
    }
  };

  const linearSearch = async (): Promise<void> => {
    if (isSearching || targetValue === null) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      console.log('Starting linear search');
      for (let i = 0; i < array.length; i++) {
        setCurrentIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay for visualization

        if (array[i] === targetValue) {
          setSearchResult(`Found at index ${i}`);
          return;
        }
      }
      setSearchResult('Not found');
    } catch (err) {
      console.error('Error in linearSearch:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Linear Search</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateRandomArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSearching}
          >
            Generate Random Array
          </button>
          <input
            type='number'
            value={targetValue || ''}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            placeholder='Enter search value'
            className='border rounded px-2 py-1 mr-2'
          />
          <button
            onClick={linearSearch}
            className='bg-green-500 text-white px-4 py-2 rounded'
            disabled={isSearching || array.length === 0 || targetValue === null}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        <div>
          <strong>Current Array:</strong> {array.join(', ')}
        </div>
        {searchResult && (
          <div className='mt-2'>
            <strong>Search Result:</strong> {searchResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinearSearchCircus;
