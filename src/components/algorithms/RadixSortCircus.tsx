import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const DIGIT_LABELS = ['ones', 'tens', 'hundreds'];

const RadixSortCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([]);
  const [buckets, setBuckets] = useState<number[][]>(
    Array.from({ length: 10 }, () => [])
  );
  const [currentDigitPass, setCurrentDigitPass] = useState<number>(-1);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [sorted, setSorted] = useState<boolean>(false);
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
    return () => {
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    try {
      if (visualizerRef.current) {
        updateVisualization();
      }
    } catch (err) {
      console.error('Error in updateVisualization useEffect:', err);
    }
  }, [array, buckets, activeIndex, sorted, currentDigitPass]);

  const createTextLabel = (
    text: string,
    width: number,
    height: number,
    fontSize: number
  ): THREE.Mesh => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = `bold ${fontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, width / 2, height / 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(
      width / 64,
      height / 64
    );
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;

    clearScene();
    const sceneGroup = new THREE.Group();
    const maxVal = Math.max(...array, 1);
    const scaleFactor = 8 / maxVal;

    // Main array bars
    array.forEach((value, index) => {
      const barHeight = value * scaleFactor;
      const barGeometry = new THREE.BoxGeometry(1, barHeight, 1);

      let color = 0x4287f5; // blue default
      if (sorted) {
        color = 0x00ff00; // green sorted
      } else if (index === activeIndex) {
        color = 0xff0000; // red active
      }

      const barMaterial = new THREE.MeshStandardMaterial({ color });
      const barMesh = new THREE.Mesh(barGeometry, barMaterial);
      barMesh.position.set(
        index * 1.5 - (array.length - 1) * 0.75,
        barHeight / 2,
        0
      );
      sceneGroup.add(barMesh);

      // Value label
      const label = createTextLabel(value.toString(), 64, 32, 24);
      label.position.set(
        index * 1.5 - (array.length - 1) * 0.75,
        barHeight + 0.5,
        0
      );
      sceneGroup.add(label);
    });

    // Bucket containers (0-9) below the main array
    for (let b = 0; b < 10; b++) {
      const bucketX = b * 1.8 - 9 * 0.9;
      const bucketY = -3;

      // Bucket border box
      const borderGeometry = new THREE.BoxGeometry(1.6, 0.1, 0.5);
      const borderMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
      });
      const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
      borderMesh.position.set(bucketX, bucketY - 0.5, -3);
      sceneGroup.add(borderMesh);

      // Bucket label
      const bucketLabel = createTextLabel(b.toString(), 32, 32, 24);
      bucketLabel.position.set(bucketX, bucketY - 1, -3);
      sceneGroup.add(bucketLabel);

      // Elements inside bucket
      const bucketItems = buckets[b];
      bucketItems.forEach((val, idx) => {
        const itemHeight = val * scaleFactor * 0.3;
        const itemGeometry = new THREE.BoxGeometry(0.6, itemHeight, 0.5);
        const itemMaterial = new THREE.MeshStandardMaterial({
          color: 0xffa500,
        });
        const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
        itemMesh.position.set(
          bucketX,
          bucketY + idx * (itemHeight + 0.2) + itemHeight / 2,
          -3
        );
        sceneGroup.add(itemMesh);

        // Item value label
        const itemLabel = createTextLabel(val.toString(), 48, 24, 16);
        itemLabel.position.set(
          bucketX,
          bucketY + idx * (itemHeight + 0.2) + itemHeight + 0.2,
          -3
        );
        sceneGroup.add(itemLabel);
      });
    }

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const clearScene = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
  };

  const generateRandomArray = (length: number = 10): void => {
    try {
      const newArray = Array.from(
        { length },
        () => Math.floor(Math.random() * 999) + 1
      );
      setArray(newArray);
      setBuckets(Array.from({ length: 10 }, () => []));
      setCurrentDigitPass(-1);
      setActiveIndex(-1);
      setSorted(false);
    } catch (err) {
      console.error('Error in generateRandomArray:', err);
    }
  };

  const getDigit = (num: number, place: number): number => {
    return Math.floor(Math.abs(num) / Math.pow(10, place)) % 10;
  };

  const digitCount = (num: number): number => {
    if (num === 0) return 1;
    return Math.floor(Math.log10(Math.abs(num))) + 1;
  };

  const mostDigits = (nums: number[]): number => {
    let maxDigits = 0;
    for (const num of nums) {
      maxDigits = Math.max(maxDigits, digitCount(num));
    }
    return maxDigits;
  };

  const radixSort = async (): Promise<void> => {
    if (isSorting) return;
    setIsSorting(true);
    setSorted(false);

    try {
      const arr = [...array];
      const maxDigitCount = mostDigits(arr);

      for (let k = 0; k < maxDigitCount; k++) {
        setCurrentDigitPass(k);

        // Create digit buckets
        const digitBuckets: number[][] = Array.from(
          { length: 10 },
          () => []
        );

        // Distribute elements into buckets
        for (let i = 0; i < arr.length; i++) {
          setActiveIndex(i);
          const digit = getDigit(arr[i], k);
          digitBuckets[digit].push(arr[i]);
          setBuckets(digitBuckets.map((b) => [...b]));
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        setActiveIndex(-1);
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Collect elements back from buckets
        let idx = 0;
        for (let b = 0; b < 10; b++) {
          for (let j = 0; j < digitBuckets[b].length; j++) {
            arr[idx] = digitBuckets[b][j];
            idx++;
          }
        }

        setArray([...arr]);
        setBuckets(Array.from({ length: 10 }, () => []));
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setSorted(true);
      setCurrentDigitPass(-1);
      setActiveIndex(-1);
    } catch (err) {
      console.error('Error in radixSort:', err);
    } finally {
      setIsSorting(false);
    }
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h2 className='text-2xl font-bold mb-4'>Radix Sort</h2>

        <div className='mb-4'>
          <button
            onClick={() => generateRandomArray()}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2'
            disabled={isSorting}
          >
            Generate Random Array
          </button>
          <button
            onClick={radixSort}
            className='bg-green-500 text-white px-4 py-2 rounded'
            disabled={isSorting || array.length === 0}
          >
            {isSorting ? 'Sorting...' : 'Sort'}
          </button>
        </div>

        {currentDigitPass >= 0 && (
          <div className='mb-2'>
            <strong>Current Pass:</strong>{' '}
            {DIGIT_LABELS[currentDigitPass] || `10^${currentDigitPass}`} place
          </div>
        )}

        <div className='mb-2'>
          <strong>Current Array:</strong> [{array.join(', ')}]
        </div>

        <div className='mt-4 text-sm text-gray-600'>
          <strong>Time Complexity:</strong> O(d * (n + k)) where d = digits, k =
          base (10)
          <br />
          <strong>Space Complexity:</strong> O(n + k)
        </div>
      </div>
    </div>
  );
};

export default RadixSortCircus;
