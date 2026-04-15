import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type NumState = 'unknown' | 'prime' | 'composite' | 'current-prime' | 'crossing-out';

interface NumCell {
  value: number;
  state: NumState;
}

const MAX_N = 50;
const COLS = 10;

const SieveCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [cells, setCells] = useState<NumCell[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPrime, setCurrentPrime] = useState(-1);
  const [primesFound, setPrimesFound] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const animationCancelled = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 0, 14);
      visualizerRef.current.camera.lookAt(0, 0, 0);
      initCells();
    }
    return () => {
      animationCancelled.current = true;
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) updateVisualization();
  }, [cells, currentPrime]);

  const createTextCanvas = (
    text: string,
    width = 64,
    height = 64,
    fontSize = 24,
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

  const getColor = (state: NumState): number => {
    switch (state) {
      case 'unknown':
        return 0x888888;
      case 'prime':
        return 0x22c55e;
      case 'composite':
        return 0x444444;
      case 'current-prime':
        return 0xffd700;
      case 'crossing-out':
        return 0xef4444;
      default:
        return 0x888888;
    }
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const cellSize = 0.9;
    const rows = Math.ceil((MAX_N - 1) / COLS);
    const offsetX = (-COLS * cellSize) / 2 + cellSize / 2;
    const offsetY = (rows * cellSize) / 2 - cellSize / 2;

    cells.forEach((cell) => {
      if (cell.value < 2) return;
      const idx = cell.value - 2;
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);

      const color = getColor(cell.state);
      const boxGeo = new THREE.BoxGeometry(
        cellSize * 0.88,
        cellSize * 0.88,
        0.2
      );
      const boxMat = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(
        offsetX + col * cellSize,
        offsetY - row * cellSize,
        0
      );
      group.add(box);

      const textColor =
        cell.state === 'composite' ? '#666666' : 'white';
      const tc = createTextCanvas(
        cell.value.toString(),
        64,
        64,
        22,
        textColor
      );
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
      });
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.5),
        mat
      );
      plane.position.set(
        offsetX + col * cellSize,
        offsetY - row * cellSize,
        0.15
      );
      group.add(plane);

      // Strike-through for composites
      if (cell.state === 'composite') {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(
            offsetX + col * cellSize - cellSize * 0.35,
            offsetY - row * cellSize,
            0.2
          ),
          new THREE.Vector3(
            offsetX + col * cellSize + cellSize * 0.35,
            offsetY - row * cellSize,
            0.2
          ),
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff4444 });
        group.add(new THREE.Line(lineGeo, lineMat));
      }
    });

    // Title
    const titleCanvas = createTextCanvas(
      'Sieve of Eratosthenes (N=50)',
      512,
      64,
      28
    );
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    const titleMat = new THREE.MeshBasicMaterial({
      map: titleTex,
      transparent: true,
    });
    const titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 0.5),
      titleMat
    );
    titlePlane.position.set(0, offsetY + 1.5, 0);
    group.add(titlePlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const initCells = (): void => {
    const data: NumCell[] = [];
    for (let i = 0; i <= MAX_N; i++) {
      data.push({ value: i, state: 'unknown' });
    }
    setCells(data);
    setCurrentPrime(-1);
    setPrimesFound([]);
    setMessage('');
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runSieve = async (): Promise<void> => {
    if (isRunning) return;
    setIsRunning(true);
    animationCancelled.current = false;

    const data: NumCell[] = [];
    for (let i = 0; i <= MAX_N; i++) {
      data.push({ value: i, state: i >= 2 ? 'unknown' : 'composite' });
    }
    setCells([...data]);
    await sleep(400);

    const primes: number[] = [];

    for (let p = 2; p * p <= MAX_N; p++) {
      if (animationCancelled.current) return;
      if (data[p].state === 'composite') continue;

      // Mark current prime
      data[p].state = 'current-prime';
      setCurrentPrime(p);
      setCells([...data]);
      setMessage(`Testing prime: ${p}`);
      await sleep(500);

      // Cross out multiples
      for (let mult = p * p; mult <= MAX_N; mult += p) {
        if (animationCancelled.current) return;
        if (data[mult].state !== 'composite') {
          data[mult].state = 'crossing-out';
          setCells([...data]);
          await sleep(150);
          data[mult].state = 'composite';
          setCells([...data]);
        }
      }

      data[p].state = 'prime';
      primes.push(p);
      setPrimesFound([...primes]);
      setCells([...data]);
      await sleep(200);
    }

    // Mark remaining unknowns as prime
    for (let i = 2; i <= MAX_N; i++) {
      if (data[i].state === 'unknown') {
        data[i].state = 'prime';
        primes.push(i);
      }
    }
    setPrimesFound([...primes]);
    setCells([...data]);
    setCurrentPrime(-1);
    setMessage(`Done! Found ${primes.length} primes up to ${MAX_N}`);
    setIsRunning(false);
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsRunning(false);
    initCells();
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>Sieve of Eratosthenes</h2>

        <div className='mb-2 text-sm'>
          <div>
            Range: <strong>2 to {MAX_N}</strong>
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={runSieve}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run Sieve'}
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

        {primesFound.length > 0 && (
          <div className='mb-3 p-2 bg-green-50 rounded text-xs'>
            <div className='font-semibold mb-1'>
              Primes ({primesFound.length}):
            </div>
            <div className='break-words'>{primesFound.join(', ')}</div>
          </div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Time: <strong>O(n log log n)</strong>
          </div>
          <div>
            Space: <strong>O(n)</strong>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#888888' }}
            ></span>{' '}
            Unknown
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ffd700' }}
            ></span>{' '}
            Current Prime
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ef4444' }}
            ></span>{' '}
            Crossing Out
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#22c55e' }}
            ></span>{' '}
            Prime
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#444444' }}
            ></span>{' '}
            Composite
          </div>
        </div>
      </div>
    </div>
  );
};

export default SieveCircus;
