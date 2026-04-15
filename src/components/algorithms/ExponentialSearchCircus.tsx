import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const ExponentialSearchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [phase, setPhase] = useState<'idle' | 'exponential' | 'binary'>('idle');
  const [expIndex, setExpIndex] = useState<number>(-1);
  const [binaryLow, setBinaryLow] = useState<number>(-1);
  const [binaryHigh, setBinaryHigh] = useState<number>(-1);
  const [binaryMid, setBinaryMid] = useState<number>(-1);
  const [foundIndex, setFoundIndex] = useState<number>(-1);
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
  }, [array, phase, expIndex, binaryLow, binaryHigh, binaryMid, foundIndex]);

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    const barWidth = 0.8;
    const spacing = 1.2;

    array.forEach((value, index) => {
      let color = 0x4287f5;

      if (foundIndex === index) {
        color = 0xffff00;
      } else if (phase === 'exponential' && index === expIndex) {
        color = 0xff8800; // orange for exponential probe
      } else if (phase === 'binary') {
        if (index === binaryMid) {
          color = 0xff00ff; // magenta for binary mid
        } else if (index === binaryLow) {
          color = 0x00ff00;
        } else if (index === binaryHigh) {
          color = 0xff0000;
        } else if (index > binaryLow && index < binaryHigh && binaryLow >= 0) {
          color = 0x88aaff;
        }
      }

      const barGeometry = new THREE.BoxGeometry(barWidth, value * 0.18, barWidth);
      const barMaterial = new THREE.MeshStandardMaterial({ color });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * spacing - ((array.length - 1) * spacing) / 2,
        (value * 0.18) / 2,
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
        context.font = 'bold 20px Arial';
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
        value * 0.18 + 0.5,
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
    resetState();
    setMessage('Sorted array generated. Enter a value to search.');
  };

  const resetState = (): void => {
    setPhase('idle');
    setExpIndex(-1);
    setBinaryLow(-1);
    setBinaryHigh(-1);
    setBinaryMid(-1);
    setFoundIndex(-1);
    setSearchResult(null);
  };

  const exponentialSearch = async (): Promise<void> => {
    if (isSearching || targetValue === null) return;
    setIsSearching(true);
    resetState();

    const n = array.length;

    // Check first element
    if (array[0] === targetValue) {
      setFoundIndex(0);
      setSearchResult(`Found ${targetValue} at index 0`);
      setMessage('Found at first element!');
      setIsSearching(false);
      return;
    }

    // Exponential jump phase
    setPhase('exponential');
    let bound = 1;
    while (bound < n && array[bound] <= targetValue) {
      setExpIndex(bound);
      setMessage(`Exponential jump: index ${bound}, arr[${bound}]=${array[bound]}`);
      await new Promise((r) => setTimeout(r, 700));
      bound *= 2;
    }

    // Binary search phase
    setPhase('binary');
    let lo = Math.floor(bound / 2);
    let hi = Math.min(bound, n - 1);
    setMessage(`Binary search in range [${lo}, ${hi}]`);
    await new Promise((r) => setTimeout(r, 500));

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      setBinaryLow(lo);
      setBinaryHigh(hi);
      setBinaryMid(mid);
      setMessage(`Binary: lo=${lo}, hi=${hi}, mid=${mid}, arr[${mid}]=${array[mid]}`);
      await new Promise((r) => setTimeout(r, 800));

      if (array[mid] === targetValue) {
        setFoundIndex(mid);
        setPhase('idle');
        setBinaryLow(-1);
        setBinaryHigh(-1);
        setBinaryMid(-1);
        setSearchResult(`Found ${targetValue} at index ${mid}`);
        setMessage(`Found! ${targetValue} at index ${mid}`);
        setIsSearching(false);
        return;
      } else if (array[mid] < targetValue) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    setPhase('idle');
    setBinaryLow(-1);
    setBinaryHigh(-1);
    setBinaryMid(-1);
    setSearchResult(`${targetValue} not found`);
    setMessage('Value not found.');
    setIsSearching(false);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-sm'>
        <h2 className='text-2xl font-bold mb-3'>Exponential Search</h2>

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
            onClick={exponentialSearch}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isSearching || array.length === 0 || targetValue === null}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div><strong>Phase:</strong> {phase === 'idle' ? 'Idle' : phase === 'exponential' ? 'Exponential Jumps' : 'Binary Search'}</div>
          <div><strong>Status:</strong> {message}</div>
          {searchResult && (
            <div><strong>Result:</strong> {searchResult}</div>
          )}
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div><strong>Time Complexity:</strong> O(log n)</div>
          <div><strong>Space Complexity:</strong> O(1)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff8800' }}></span> Exponential probe
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff00ff' }}></span> Binary mid
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffff00' }}></span> Found
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExponentialSearchCircus;
