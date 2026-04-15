import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const InterpolationSearchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [probeIndex, setProbeIndex] = useState<number>(-1);
  const [low, setLow] = useState<number>(-1);
  const [high, setHigh] = useState<number>(-1);
  const [foundIndex, setFoundIndex] = useState<number>(-1);
  const [targetValue, setTargetValue] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [message, setMessage] = useState('Generate an array and search');

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        generateUniformArray();
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
  }, [array, probeIndex, low, high, foundIndex]);

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
      } else if (index === probeIndex) {
        color = 0xff00ff; // magenta for probe
      } else if (index === low) {
        color = 0x00ff00;
      } else if (index === high) {
        color = 0xff0000;
      } else if (index > low && index < high && low >= 0 && high >= 0) {
        color = 0x88aaff; // light blue for active range
      }

      const barGeometry = new THREE.BoxGeometry(barWidth, value * 0.15, barWidth);
      const barMaterial = new THREE.MeshStandardMaterial({ color });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * spacing - ((array.length - 1) * spacing) / 2,
        (value * 0.15) / 2,
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
        value * 0.15 + 0.5,
        0
      );
      sceneGroup.add(label);
    });

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const generateUniformArray = (length: number = 14): void => {
    // Generate uniformly distributed sorted array
    const start = Math.floor(Math.random() * 5) + 1;
    const step = Math.floor(Math.random() * 4) + 2;
    const newArray: number[] = [];
    for (let i = 0; i < length; i++) {
      newArray.push(start + i * step + Math.floor(Math.random() * 2));
    }
    newArray.sort((a, b) => a - b);
    setArray(newArray);
    setProbeIndex(-1);
    setLow(-1);
    setHigh(-1);
    setFoundIndex(-1);
    setSearchResult(null);
    setMessage('Uniform sorted array generated. Enter a value to search.');
  };

  const interpolationSearch = async (): Promise<void> => {
    if (isSearching || targetValue === null) return;
    setIsSearching(true);
    setSearchResult(null);
    setFoundIndex(-1);

    let lo = 0;
    let hi = array.length - 1;

    while (lo <= hi && targetValue >= array[lo] && targetValue <= array[hi]) {
      setLow(lo);
      setHigh(hi);

      // Interpolation formula
      const pos = lo + Math.floor(
        ((targetValue - array[lo]) * (hi - lo)) / (array[hi] - array[lo])
      );

      setProbeIndex(pos);
      setMessage(
        `Probe position: ${pos} (formula: lo + ((target-arr[lo])*(hi-lo))/(arr[hi]-arr[lo]))`
      );
      await new Promise((r) => setTimeout(r, 1000));

      if (array[pos] === targetValue) {
        setFoundIndex(pos);
        setProbeIndex(-1);
        setLow(-1);
        setHigh(-1);
        setSearchResult(`Found ${targetValue} at index ${pos}`);
        setMessage(`Found! ${targetValue} at index ${pos}`);
        setIsSearching(false);
        return;
      }

      if (array[pos] < targetValue) {
        setMessage(`arr[${pos}]=${array[pos]} < ${targetValue}, moving lo to ${pos + 1}`);
        lo = pos + 1;
      } else {
        setMessage(`arr[${pos}]=${array[pos]} > ${targetValue}, moving hi to ${pos - 1}`);
        hi = pos - 1;
      }
      await new Promise((r) => setTimeout(r, 700));
    }

    setProbeIndex(-1);
    setLow(-1);
    setHigh(-1);
    setSearchResult(`${targetValue} not found`);
    setMessage('Value not found in array.');
    setIsSearching(false);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-sm'>
        <h2 className='text-2xl font-bold mb-3'>Interpolation Search</h2>

        <div className='mb-3'>
          <button
            onClick={() => generateUniformArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2 text-sm'
            disabled={isSearching}
          >
            Generate Uniform Array
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
            onClick={interpolationSearch}
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
          <div><strong>Time Complexity:</strong> O(log log n) avg, O(n) worst</div>
          <div><strong>Space Complexity:</strong> O(1)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#00ff00' }}></span> Low bound
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff0000' }}></span> High bound
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff00ff' }}></span> Probe position
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffff00' }}></span> Found
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpolationSearchCircus;
