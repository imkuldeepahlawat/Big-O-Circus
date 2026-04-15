import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const JumpSearchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [highlightIndices, setHighlightIndices] = useState<{
    jumpBlock: number[];
    linearScan: number[];
    found: number;
  }>({ jumpBlock: [], linearScan: [], found: -1 });
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [message, setMessage] = useState('Generate an array and search');

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        generateSortedArray();
      }
    } catch (err) {
      console.error('Error in initial useEffect:', err);
    }
    return () => {
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) {
      updateVisualization();
    }
  }, [array, highlightIndices]);

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    const barWidth = 0.8;
    const spacing = 1.2;

    array.forEach((value, index) => {
      let color = 0x4287f5; // default blue

      if (highlightIndices.found === index) {
        color = 0xffff00; // yellow for found
      } else if (highlightIndices.linearScan.includes(index)) {
        color = 0xff8800; // orange for linear scan
      } else if (highlightIndices.jumpBlock.includes(index)) {
        color = 0x00ff00; // green for jump block boundaries
      }

      const barGeometry = new THREE.BoxGeometry(barWidth, value * 0.2, barWidth);
      const barMaterial = new THREE.MeshStandardMaterial({ color });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * spacing - ((array.length - 1) * spacing) / 2,
        (value * 0.2) / 2,
        0
      );
      sceneGroup.add(barMesh);

      // Value label
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
        index * spacing - ((array.length - 1) * spacing) / 2,
        value * 0.2 + 0.5,
        0
      );
      sceneGroup.add(label);
    });

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const generateSortedArray = (length: number = 16): void => {
    const newArray = Array.from({ length }, () => Math.floor(Math.random() * 50) + 1);
    newArray.sort((a, b) => a - b);
    setArray(newArray);
    setHighlightIndices({ jumpBlock: [], linearScan: [], found: -1 });
    setSearchResult(null);
    setMessage('Array generated. Enter a value and search.');
  };

  const jumpSearch = async (): Promise<void> => {
    if (isSearching || targetValue === null) return;
    setIsSearching(true);
    setSearchResult(null);

    const n = array.length;
    const jumpSize = Math.floor(Math.sqrt(n));
    setMessage(`Jump size: ${jumpSize} (sqrt of ${n})`);

    let prev = 0;
    let curr = jumpSize;

    // Jump phase
    while (curr < n && array[curr] < targetValue) {
      setHighlightIndices({ jumpBlock: [prev, curr], linearScan: [], found: -1 });
      setMessage(`Jumping: comparing arr[${curr}]=${array[curr]} < ${targetValue}`);
      await new Promise((r) => setTimeout(r, 700));
      prev = curr;
      curr += jumpSize;
    }

    if (curr >= n) curr = n - 1;
    setHighlightIndices({ jumpBlock: [prev, curr], linearScan: [], found: -1 });
    setMessage(`Block found between index ${prev} and ${curr}. Starting linear scan.`);
    await new Promise((r) => setTimeout(r, 700));

    // Linear scan phase
    for (let i = prev; i <= Math.min(curr, n - 1); i++) {
      setHighlightIndices({ jumpBlock: [prev, curr], linearScan: [i], found: -1 });
      setMessage(`Linear scan: comparing arr[${i}]=${array[i]} with ${targetValue}`);
      await new Promise((r) => setTimeout(r, 500));

      if (array[i] === targetValue) {
        setHighlightIndices({ jumpBlock: [], linearScan: [], found: i });
        setSearchResult(`Found ${targetValue} at index ${i}`);
        setMessage(`Found! ${targetValue} is at index ${i}`);
        setIsSearching(false);
        return;
      }

      if (array[i] > targetValue) break;
    }

    setHighlightIndices({ jumpBlock: [], linearScan: [], found: -1 });
    setSearchResult(`${targetValue} not found in array`);
    setMessage('Value not found.');
    setIsSearching(false);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h2 className='text-2xl font-bold mb-3'>Jump Search</h2>

        <div className='mb-3'>
          <button
            onClick={() => generateSortedArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2 text-sm'
            disabled={isSearching}
          >
            Generate Array
          </button>
        </div>

        <div className='mb-3 flex gap-2'>
          <input
            type='number'
            value={targetValue || ''}
            onChange={(e) => setTargetValue(Number(e.target.value))}
            placeholder='Search value'
            className='border rounded px-2 py-1 w-24 text-sm'
          />
          <button
            onClick={jumpSearch}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isSearching || array.length === 0 || targetValue === null}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div><strong>Status:</strong> {message}</div>
          {searchResult && (
            <div><strong>Result:</strong> {searchResult}</div>
          )}
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div><strong>Time Complexity:</strong> O(sqrt(n))</div>
          <div><strong>Space Complexity:</strong> O(1)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#00ff00' }}></span> Jump block boundary
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff8800' }}></span> Linear scan
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffff00' }}></span> Found
          </div>
        </div>
      </div>
    </div>
  );
};

export default JumpSearchCircus;
