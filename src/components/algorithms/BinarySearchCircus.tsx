import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const BinarySearchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [currentIndices, setCurrentIndices] = useState<number[]>([]);
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        generateSortedArray();
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

    const barWidth = 0.8; // Adjusted width for bars
    const spacing = 1.2; // Adjusted spacing between bars

    array.forEach((value, index) => {
      let color = 0x4287f5; // Default color

      // Set colors for start, end, and found elements
      if (currentIndices.includes(index)) {
        if (index === currentIndices[0]) {
          color = 0x00ff00; // Start color (green)
        } else if (index === currentIndices[2]) {
          color = 0xff0000; // End color (red)
        } else if (
          searchResult &&
          searchResult.includes(`Found at index ${index}`)
        ) {
          color = 0xffff00; // Found color (yellow)
        }
      }

      const barGeometry = new THREE.BoxGeometry(barWidth, value, barWidth);
      const barMaterial = new THREE.MeshBasicMaterial({ color });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * spacing - ((array.length - 1) * spacing) / 2, // Center the array
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
        index * spacing - ((array.length - 1) * spacing) / 2, // Center the array
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

  const generateSortedArray = (length: number = 10): void => {
    try {
      console.log('Generating sorted array');
      const newArray = Array.from(
        { length },
        () => Math.floor(Math.random() * 50) + 1
      );
      newArray.sort((a, b) => a - b);
      console.log('Generated array:', newArray);
      setArray(newArray);
      setCurrentIndices([]);
      setSearchResult(null);
    } catch (err) {
      console.error('Error in generateSortedArray:', err);
    }
  };

  const binarySearch = async (): Promise<void> => {
    if (isSearching || targetValue === null) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      console.log('Starting binary search');
      let left = 0;
      let right = array.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        setCurrentIndices([left, mid, right]);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for visualization

        if (array[mid] === targetValue) {
          setSearchResult(`Found at index ${mid}`);
          setCurrentIndices([mid]);
          break;
        } else if (array[mid] < targetValue) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      if (left > right) {
        setSearchResult('Not found');
        setCurrentIndices([]);
      }
    } catch (err) {
      console.error('Error in binarySearch:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Binary Search</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateSortedArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSearching}
          >
            Generate Sorted Array
          </button>
          <input
            type='number'
            value={targetValue || ''}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            placeholder='Enter search value'
            className='border rounded px-2 py-1 mr-2'
          />
          <button
            onClick={binarySearch}
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

export default BinarySearchCircus;
