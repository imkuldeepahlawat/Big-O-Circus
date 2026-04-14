import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type CellState = 'empty' | 'computing' | 'computed' | 'cache-hit';

interface DPCell {
  value: number | null;
  state: CellState;
}

const FibonacciDPCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [n, setN] = useState<number>(8);
  const [dpTable, setDpTable] = useState<DPCell[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [sourceIndices, setSourceIndices] = useState<number[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [computations, setComputations] = useState(0);
  const [cacheHits, setCacheHits] = useState(0);
  const animationCancelled = useRef(false);

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        visualizerRef.current.camera.position.set(0, 1, 12);
        visualizerRef.current.camera.lookAt(0, 0, 0);
        initTable(n);
      }
    } catch (err) {
      console.error('Error in initial useEffect:', err);
    }
    return () => {
      animationCancelled.current = true;
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
  }, [dpTable, currentIndex, sourceIndices]);

  const getColorForState = (state: CellState, isActive: boolean, isSource: boolean): number => {
    if (isActive) return 0xffd700; // yellow - computing
    if (isSource) return 0xff4444; // red - cache hit source
    switch (state) {
      case 'empty':
        return 0x888888; // gray
      case 'computing':
        return 0xffd700; // yellow
      case 'computed':
        return 0x44bb44; // green
      case 'cache-hit':
        return 0xff4444; // red
      default:
        return 0x888888;
    }
  };

  const createTextCanvas = (text: string, width = 128, height = 64, fontSize = 28): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
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
    const sceneGroup = new THREE.Group();
    const cellSize = 1.2;
    const totalWidth = dpTable.length * cellSize;
    const offsetX = -totalWidth / 2 + cellSize / 2;

    // Draw DP table cells
    dpTable.forEach((cell, index) => {
      const isActive = index === currentIndex;
      const isSource = sourceIndices.includes(index);

      // Cell box
      const boxGeometry = new THREE.BoxGeometry(cellSize * 0.9, cellSize * 0.9, 0.3);
      const boxMaterial = new THREE.MeshStandardMaterial({
        color: getColorForState(cell.state, isActive, isSource),
      });
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.set(offsetX + index * cellSize, 0, 0);
      sceneGroup.add(boxMesh);

      // Value label
      const valueText = cell.value !== null ? cell.value.toString() : '?';
      const valueCanvas = createTextCanvas(valueText);
      const valueTexture = new THREE.CanvasTexture(valueCanvas);
      const valueMaterial = new THREE.MeshBasicMaterial({
        map: valueTexture,
        transparent: true,
      });
      const valuePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(cellSize * 0.8, cellSize * 0.4),
        valueMaterial
      );
      valuePlane.position.set(offsetX + index * cellSize, 0, 0.2);
      sceneGroup.add(valuePlane);

      // Index label below
      const indexCanvas = createTextCanvas(`[${index}]`, 128, 64, 22);
      const indexTexture = new THREE.CanvasTexture(indexCanvas);
      const indexMaterial = new THREE.MeshBasicMaterial({
        map: indexTexture,
        transparent: true,
      });
      const indexPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(cellSize * 0.7, cellSize * 0.3),
        indexMaterial
      );
      indexPlane.position.set(offsetX + index * cellSize, -0.9, 0);
      sceneGroup.add(indexPlane);
    });

    // Draw arrows from source cells to current cell
    if (currentIndex >= 2 && sourceIndices.length === 2) {
      sourceIndices.forEach((srcIdx) => {
        const srcX = offsetX + srcIdx * cellSize;
        const dstX = offsetX + currentIndex * cellSize;

        const points = [
          new THREE.Vector3(srcX, 0.7, 0),
          new THREE.Vector3((srcX + dstX) / 2, 1.5, 0),
          new THREE.Vector3(dstX, 0.7, 0),
        ];
        const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
        const curvePoints = curve.getPoints(20);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        sceneGroup.add(line);

        // Arrowhead
        const arrowGeometry = new THREE.ConeGeometry(0.1, 0.25, 6);
        const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(dstX, 0.75, 0);
        arrow.rotation.z = Math.PI;
        sceneGroup.add(arrow);
      });

      // Formula label
      const formulaText = `fib(${currentIndex}) = fib(${currentIndex - 1}) + fib(${currentIndex - 2})`;
      const formulaCanvas = createTextCanvas(formulaText, 512, 64, 24);
      const formulaTexture = new THREE.CanvasTexture(formulaCanvas);
      const formulaMaterial = new THREE.MeshBasicMaterial({
        map: formulaTexture,
        transparent: true,
      });
      const formulaPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(5, 0.6),
        formulaMaterial
      );
      formulaPlane.position.set(0, 2.2, 0);
      sceneGroup.add(formulaPlane);
    }

    // Title label
    const titleCanvas = createTextCanvas('Fibonacci DP Table', 512, 64, 30);
    const titleTexture = new THREE.CanvasTexture(titleCanvas);
    const titleMaterial = new THREE.MeshBasicMaterial({
      map: titleTexture,
      transparent: true,
    });
    const titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 0.6),
      titleMaterial
    );
    titlePlane.position.set(0, 3.2, 0);
    sceneGroup.add(titlePlane);

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const initTable = (size: number): void => {
    const table: DPCell[] = Array.from({ length: size + 1 }, () => ({
      value: null,
      state: 'empty' as CellState,
    }));
    setDpTable(table);
    setCurrentIndex(-1);
    setSourceIndices([]);
    setResult(null);
    setComputations(0);
    setCacheHits(0);
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const computeFibonacci = async (): Promise<void> => {
    if (isComputing) return;
    setIsComputing(true);
    animationCancelled.current = false;

    try {
      const table: DPCell[] = Array.from({ length: n + 1 }, () => ({
        value: null,
        state: 'empty' as CellState,
      }));
      let compCount = 0;
      let cacheCount = 0;

      // Base cases
      // fib(0) = 0
      setCurrentIndex(0);
      setSourceIndices([]);
      table[0] = { value: 0, state: 'computing' };
      setDpTable([...table]);
      compCount++;
      await sleep(600);
      if (animationCancelled.current) return;

      table[0] = { value: 0, state: 'computed' };
      setDpTable([...table]);
      await sleep(300);
      if (animationCancelled.current) return;

      if (n >= 1) {
        // fib(1) = 1
        setCurrentIndex(1);
        setSourceIndices([]);
        table[1] = { value: 1, state: 'computing' };
        setDpTable([...table]);
        compCount++;
        await sleep(600);
        if (animationCancelled.current) return;

        table[1] = { value: 1, state: 'computed' };
        setDpTable([...table]);
        await sleep(300);
        if (animationCancelled.current) return;
      }

      // Fill table left to right
      for (let i = 2; i <= n; i++) {
        if (animationCancelled.current) return;

        setCurrentIndex(i);
        setSourceIndices([i - 1, i - 2]);

        // Highlight cache hits on source cells
        table[i - 1] = { ...table[i - 1], state: 'cache-hit' };
        table[i - 2] = { ...table[i - 2], state: 'cache-hit' };
        cacheCount += 2;

        table[i] = { value: null, state: 'computing' };
        setDpTable([...table]);
        compCount++;
        await sleep(800);
        if (animationCancelled.current) return;

        // Compute value
        const fibValue = (table[i - 1].value ?? 0) + (table[i - 2].value ?? 0);
        table[i] = { value: fibValue, state: 'computed' };

        // Restore source cells to computed
        table[i - 1] = { ...table[i - 1], state: 'computed' };
        table[i - 2] = { ...table[i - 2], state: 'computed' };
        setDpTable([...table]);
        await sleep(400);
        if (animationCancelled.current) return;
      }

      setCurrentIndex(-1);
      setSourceIndices([]);
      setResult(table[n].value);
      setComputations(compCount);
      setCacheHits(cacheCount);
      setDpTable([...table]);
    } catch (err) {
      console.error('Error in computeFibonacci:', err);
    } finally {
      setIsComputing(false);
    }
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsComputing(false);
    initTable(n);
  };

  const recursiveCalls = (val: number): number => {
    if (val <= 1) return 1;
    return recursiveCalls(val - 1) + recursiveCalls(val - 2) + 1;
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>Fibonacci - Dynamic Programming</h2>

        <div className='mb-3'>
          <label className='block text-sm font-medium mb-1'>
            N (1-20):
          </label>
          <input
            type='number'
            min={1}
            max={20}
            value={n}
            onChange={(e) => {
              const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
              setN(val);
              if (!isComputing) initTable(val);
            }}
            className='border rounded px-2 py-1 w-20 mr-2'
            disabled={isComputing}
          />
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={computeFibonacci}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isComputing}
          >
            {isComputing ? 'Computing...' : 'Compute'}
          </button>
          <button
            onClick={handleReset}
            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        {result !== null && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>
            <div><strong>fib({n}) = {result}</strong></div>
            <div>DP Computations: {computations}</div>
            <div>Cache Hits: {cacheHits}</div>
          </div>
        )}

        <div className='mb-3 p-2 bg-yellow-50 rounded text-sm'>
          <div className='font-semibold mb-1'>Comparison for N={n}:</div>
          <div>DP Lookups: <strong>{n + 1}</strong> (linear)</div>
          <div>Recursive Calls: <strong>{recursiveCalls(n).toLocaleString()}</strong></div>
        </div>

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>DP: <strong>O(n)</strong> time, <strong>O(n)</strong> space</div>
          <div>Recursive: <strong>O(2^n)</strong> time, <strong>O(n)</strong> space</div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#888888' }}></span> Not computed
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffd700' }}></span> Computing
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#44bb44' }}></span> Computed
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff4444' }}></span> Cache hit
          </div>
        </div>
      </div>
    </div>
  );
};

export default FibonacciDPCircus;
