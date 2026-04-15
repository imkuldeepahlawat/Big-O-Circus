import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type Phase = 'initial' | 'distributing' | 'distributed' | 'sorting' | 'collecting' | 'done';

const INITIAL_ARRAY = [0.78, 0.17, 0.39, 0.26, 0.72, 0.94, 0.21, 0.12, 0.23, 0.68, 0.55, 0.43];
const BUCKET_COUNT = 10;

const BucketSortCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([...INITIAL_ARRAY]);
  const [buckets, setBuckets] = useState<number[][]>(
    Array.from({ length: BUCKET_COUNT }, () => [])
  );
  const [phase, setPhase] = useState<Phase>('initial');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeBucket, setActiveBucket] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [sortedArray, setSortedArray] = useState<number[]>([]);
  const animationCancelled = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 0, 16);
      visualizerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }
    return () => {
      animationCancelled.current = true;
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) updateVisualization();
  }, [array, buckets, phase, activeIndex, activeBucket, sortedArray]);

  const createTextCanvas = (
    text: string,
    width = 128,
    height = 64,
    fontSize = 22,
    color = 'white'
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
    return canvas;
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const cellW = 0.7;
    const cellH = 0.5;

    if (phase === 'initial' || phase === 'distributing') {
      // Source array at top
      const arrOffsetX = (-array.length * cellW) / 2 + cellW / 2;
      for (let i = 0; i < array.length; i++) {
        const isActive = i === activeIndex;
        const color = isActive ? 0xffd700 : 0x3b82f6;
        const boxGeo = new THREE.BoxGeometry(cellW * 0.9, cellH * 0.9, 0.15);
        const boxMat = new THREE.MeshStandardMaterial({ color });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(arrOffsetX + i * cellW, 4.5, 0);
        group.add(box);

        const tc = createTextCanvas(array[i].toFixed(2), 96, 48, 18);
        const tex = new THREE.CanvasTexture(tc);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), mat);
        plane.position.set(arrOffsetX + i * cellW, 4.5, 0.12);
        group.add(plane);
      }
    }

    // Buckets
    if (phase !== 'initial') {
      const bucketWidth = 1.2;
      const bucketsOffsetX = (-BUCKET_COUNT * bucketWidth) / 2 + bucketWidth / 2;

      for (let b = 0; b < BUCKET_COUNT; b++) {
        const isActive = b === activeBucket;
        const bucketColor = isActive ? 0xffd700 : 0x555555;

        // Bucket container (bottom)
        const containerGeo = new THREE.BoxGeometry(bucketWidth * 0.95, 0.15, 0.15);
        const containerMat = new THREE.MeshStandardMaterial({ color: bucketColor });
        const container = new THREE.Mesh(containerGeo, containerMat);
        container.position.set(bucketsOffsetX + b * bucketWidth, 0, 0);
        group.add(container);

        // Left wall
        const wallGeo = new THREE.BoxGeometry(0.08, 3.0, 0.15);
        const leftWall = new THREE.Mesh(wallGeo, containerMat.clone());
        leftWall.position.set(
          bucketsOffsetX + b * bucketWidth - bucketWidth * 0.45,
          1.5,
          0
        );
        group.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(wallGeo, containerMat.clone());
        rightWall.position.set(
          bucketsOffsetX + b * bucketWidth + bucketWidth * 0.45,
          1.5,
          0
        );
        group.add(rightWall);

        // Bucket label
        const bLabel = createTextCanvas(
          `[${b}]`,
          64,
          48,
          18,
          '#aaaaaa'
        );
        const bTex = new THREE.CanvasTexture(bLabel);
        const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true });
        const bPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), bMat);
        bPlane.position.set(bucketsOffsetX + b * bucketWidth, -0.4, 0);
        group.add(bPlane);

        // Items in bucket
        const bucket = buckets[b] || [];
        bucket.forEach((val, idx) => {
          const itemGeo = new THREE.BoxGeometry(
            bucketWidth * 0.75,
            cellH * 0.8,
            0.15
          );
          const itemColor =
            phase === 'sorting' && b === activeBucket ? 0x22c55e : 0x6366f1;
          const itemMat = new THREE.MeshStandardMaterial({ color: itemColor });
          const item = new THREE.Mesh(itemGeo, itemMat);
          item.position.set(
            bucketsOffsetX + b * bucketWidth,
            0.3 + idx * cellH,
            0
          );
          group.add(item);

          const tc = createTextCanvas(val.toFixed(2), 96, 48, 16);
          const tex = new THREE.CanvasTexture(tc);
          const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
          });
          const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.3),
            mat
          );
          plane.position.set(
            bucketsOffsetX + b * bucketWidth,
            0.3 + idx * cellH,
            0.12
          );
          group.add(plane);
        });
      }
    }

    // Sorted array at bottom
    if (phase === 'done' && sortedArray.length > 0) {
      const sortOffsetX = (-sortedArray.length * cellW) / 2 + cellW / 2;
      for (let i = 0; i < sortedArray.length; i++) {
        const boxGeo = new THREE.BoxGeometry(cellW * 0.9, cellH * 0.9, 0.15);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(sortOffsetX + i * cellW, -2.5, 0);
        group.add(box);

        const tc = createTextCanvas(sortedArray[i].toFixed(2), 96, 48, 16);
        const tex = new THREE.CanvasTexture(tc);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), mat);
        plane.position.set(sortOffsetX + i * cellW, -2.5, 0.12);
        group.add(plane);
      }

      const sortedLbl = createTextCanvas('Sorted:', 128, 48, 20, '#22ff44');
      const sortedTex = new THREE.CanvasTexture(sortedLbl);
      const sortedMat = new THREE.MeshBasicMaterial({ map: sortedTex, transparent: true });
      const sortedPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), sortedMat);
      sortedPlane.position.set((-sortedArray.length * cellW) / 2 - 0.8, -2.5, 0);
      group.add(sortedPlane);
    }

    // Title
    const titleCanvas = createTextCanvas('Bucket Sort', 512, 64, 30);
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true });
    const titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5), titleMat);
    titlePlane.position.set(0, 6.0, 0);
    group.add(titlePlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runBucketSort = async (): Promise<void> => {
    if (isRunning) return;
    setIsRunning(true);
    animationCancelled.current = false;

    const bkts: number[][] = Array.from({ length: BUCKET_COUNT }, () => []);
    setBuckets(bkts.map((b) => [...b]));
    setPhase('distributing');
    setMessage('Distributing elements into buckets...');
    await sleep(400);

    // Distribute
    for (let i = 0; i < array.length; i++) {
      if (animationCancelled.current) return;
      const bucketIdx = Math.min(
        Math.floor(array[i] * BUCKET_COUNT),
        BUCKET_COUNT - 1
      );
      setActiveIndex(i);
      setActiveBucket(bucketIdx);
      setMessage(`Placing ${array[i].toFixed(2)} into bucket [${bucketIdx}]`);
      await sleep(350);

      bkts[bucketIdx].push(array[i]);
      setBuckets(bkts.map((b) => [...b]));
      await sleep(200);
    }

    setActiveIndex(-1);
    setPhase('distributed');
    setMessage('All elements distributed. Sorting each bucket...');
    await sleep(500);

    // Sort each bucket
    setPhase('sorting');
    for (let b = 0; b < BUCKET_COUNT; b++) {
      if (animationCancelled.current) return;
      if (bkts[b].length > 1) {
        setActiveBucket(b);
        setMessage(`Sorting bucket [${b}]...`);
        bkts[b].sort((a, c) => a - c);
        setBuckets(bkts.map((bk) => [...bk]));
        await sleep(400);
      }
    }

    setActiveBucket(-1);
    setPhase('collecting');
    setMessage('Collecting sorted elements...');
    await sleep(400);

    // Collect
    const sorted: number[] = [];
    for (let b = 0; b < BUCKET_COUNT; b++) {
      for (const val of bkts[b]) {
        sorted.push(val);
      }
    }

    setSortedArray(sorted);
    setPhase('done');
    setMessage(`Done! Array sorted: ${sorted.length} elements`);
    setIsRunning(false);
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsRunning(false);
    setArray([...INITIAL_ARRAY]);
    setBuckets(Array.from({ length: BUCKET_COUNT }, () => []));
    setPhase('initial');
    setActiveIndex(-1);
    setActiveBucket(-1);
    setSortedArray([]);
    setMessage('');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>Bucket Sort</h2>

        <div className='mb-2 text-sm'>
          <div>
            Elements: <strong>{array.length}</strong> floats in [0, 1)
          </div>
          <div>
            Buckets: <strong>{BUCKET_COUNT}</strong>
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={runBucketSort}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Sort'}
          </button>
          <button
            onClick={handleReset}
            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>{message}</div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Average: <strong>O(n + k)</strong>
          </div>
          <div>
            Worst: <strong>O(n^2)</strong>
          </div>
          <div>
            Space: <strong>O(n + k)</strong>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#3b82f6' }}></span> Input
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffd700' }}></span> Active
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#6366f1' }}></span> In Bucket
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#22c55e' }}></span> Sorted
          </div>
        </div>
      </div>
    </div>
  );
};

export default BucketSortCircus;
