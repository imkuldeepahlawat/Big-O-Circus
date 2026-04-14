import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const INITIAL_ARRAY = [3, 2, 5, 1, 7, 4, 6, 8];

function buildBIT(arr: number[]): number[] {
  const n = arr.length;
  const bit = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    let idx = i + 1;
    while (idx <= n) {
      bit[idx] += arr[i];
      idx += idx & -idx;
    }
  }
  return bit;
}

function prefixSumSteps(idx: number): number[] {
  const steps: number[] = [];
  let i = idx;
  while (i > 0) {
    steps.push(i);
    i -= i & -i;
  }
  return steps;
}

function updateSteps(idx: number, n: number): number[] {
  const steps: number[] = [];
  let i = idx;
  while (i <= n) {
    steps.push(i);
    i += i & -i;
  }
  return steps;
}

type CellState = 'default' | 'query' | 'update' | 'current';

const COLOR_MAP: Record<CellState, number> = {
  default: 0x4287f5,
  query: 0x44bb44,
  update: 0xddcc00,
  current: 0xff4444,
};

const FenwickTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [originalArray, setOriginalArray] = useState<number[]>([...INITIAL_ARRAY]);
  const [bitArray, setBitArray] = useState<number[]>(buildBIT(INITIAL_ARRAY));
  const [highlightedBIT, setHighlightedBIT] = useState<Map<number, CellState>>(new Map());
  const [message, setMessage] = useState('Fenwick Tree (Binary Indexed Tree) ready');
  const [queryIndex, setQueryIndex] = useState('');
  const [updateIndex, setUpdateIndex] = useState('');
  const [updateDelta, setUpdateDelta] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(4, 2, 8);
      viewerRef.current.camera.lookAt(4, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [originalArray, bitArray, highlightedBIT]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 40): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    return canvas;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const n = originalArray.length;
    const spacing = 1.2;

    // Bottom row: original array
    for (let i = 0; i < n; i++) {
      const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const material = new THREE.MeshStandardMaterial({ color: 0x4287f5 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(i * spacing, -2, 0);
      group.add(cube);

      // Value label
      const texture = new THREE.CanvasTexture(makeTextCanvas(originalArray[i].toString(), 'white'));
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), labelMat);
      label.position.set(i * spacing, -2, 0.46);
      group.add(label);

      // Index label below
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`[${i}]`, '#aaaaaa', 32));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), idxMat);
      idxLabel.position.set(i * spacing, -2.8, 0);
      group.add(idxLabel);
    }

    // "Original" label
    const origTexture = new THREE.CanvasTexture(makeTextCanvas('Original Array', '#666666', 24));
    const origMat = new THREE.MeshBasicMaterial({ map: origTexture, transparent: true });
    const origLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.4), origMat);
    origLabel.position.set((n - 1) * spacing / 2, -3.5, 0);
    group.add(origLabel);

    // Top row: BIT array (1-indexed, positions 1..n)
    for (let i = 1; i <= n; i++) {
      const state: CellState = highlightedBIT.get(i) || 'default';
      const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const material = new THREE.MeshStandardMaterial({ color: COLOR_MAP[state] });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set((i - 1) * spacing, 1, 0);
      group.add(cube);

      // BIT value label
      const texture = new THREE.CanvasTexture(makeTextCanvas(bitArray[i].toString(), 'white'));
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), labelMat);
      label.position.set((i - 1) * spacing, 1, 0.46);
      group.add(label);

      // BIT index label above
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`B[${i}]`, '#aaaaaa', 28));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), idxMat);
      idxLabel.position.set((i - 1) * spacing, 1.8, 0);
      group.add(idxLabel);

      // Coverage range lines: BIT[i] covers indices from (i - (i & -i) + 1) to i
      const lowbit = i & -i;
      const rangeStart = i - lowbit; // 0-indexed start
      const rangeEnd = i - 1;       // 0-indexed end

      const lineColor = state !== 'default' ? COLOR_MAP[state] : 0x888888;
      const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 });

      // Draw line from BIT cell down to range in original array
      const startX = rangeStart * spacing;
      const endX = rangeEnd * spacing;
      const bitX = (i - 1) * spacing;

      const points = [
        new THREE.Vector3(bitX, 0.5, 0),
        new THREE.Vector3(bitX, -0.5, 0),
        new THREE.Vector3(startX, -0.5, 0),
        new THREE.Vector3(startX, -1.5, 0),
      ];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeom, lineMaterial);
      group.add(line);

      if (rangeStart !== rangeEnd) {
        const points2 = [
          new THREE.Vector3(bitX, -0.5, 0),
          new THREE.Vector3(endX, -0.5, 0),
          new THREE.Vector3(endX, -1.5, 0),
        ];
        const lineGeom2 = new THREE.BufferGeometry().setFromPoints(points2);
        const line2 = new THREE.Line(lineGeom2, lineMaterial);
        group.add(line2);
      }
    }

    // "BIT Array" label
    const bitTexture = new THREE.CanvasTexture(makeTextCanvas('BIT Array', '#666666', 24));
    const bitMat = new THREE.MeshBasicMaterial({ map: bitTexture, transparent: true });
    const bitLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), bitMat);
    bitLabel.position.set((n - 1) * spacing / 2, 2.5, 0);
    group.add(bitLabel);

    // Center the group
    group.position.x = -((n - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handlePrefixSumQuery = async () => {
    const idx = parseInt(queryIndex);
    if (isNaN(idx) || idx < 1 || idx > originalArray.length) {
      setMessage(`Enter a valid index (1 to ${originalArray.length})`);
      return;
    }

    const steps = prefixSumSteps(idx);
    let sum = 0;

    setMessage(`Computing prefix sum(${idx}): traversing BIT cells...`);

    for (let s = 0; s < steps.length; s++) {
      const cellIdx = steps[s];
      const newHighlights = new Map<number, CellState>();
      // Previously visited cells are green (query)
      for (let p = 0; p < s; p++) {
        newHighlights.set(steps[p], 'query');
      }
      // Current cell is red
      newHighlights.set(cellIdx, 'current');
      setHighlightedBIT(newHighlights);

      sum += bitArray[cellIdx];
      setMessage(`prefix sum: visiting B[${cellIdx}] = ${bitArray[cellIdx]}, running sum = ${sum}  (i -= i & (-i))`);
      await new Promise((r) => setTimeout(r, 800));
    }

    // Final state: all visited cells green
    const finalHighlights = new Map<number, CellState>();
    steps.forEach((s) => finalHighlights.set(s, 'query'));
    setHighlightedBIT(finalHighlights);
    setMessage(`Prefix sum(${idx}) = ${sum} -- visited ${steps.length} cells -- O(log n)`);

    setTimeout(() => setHighlightedBIT(new Map()), 2000);
  };

  const handlePointUpdate = async () => {
    const idx = parseInt(updateIndex);
    const delta = parseInt(updateDelta);
    if (isNaN(idx) || idx < 1 || idx > originalArray.length) {
      setMessage(`Enter a valid index (1 to ${originalArray.length})`);
      return;
    }
    if (isNaN(delta)) {
      setMessage('Enter a valid delta value');
      return;
    }

    const n = originalArray.length;
    const steps = updateSteps(idx, n);

    setMessage(`Updating index ${idx} by +${delta}: traversing BIT cells...`);

    const newBit = [...bitArray];

    for (let s = 0; s < steps.length; s++) {
      const cellIdx = steps[s];
      const newHighlights = new Map<number, CellState>();
      for (let p = 0; p < s; p++) {
        newHighlights.set(steps[p], 'update');
      }
      newHighlights.set(cellIdx, 'current');
      setHighlightedBIT(newHighlights);

      newBit[cellIdx] += delta;
      setMessage(`update: visiting B[${cellIdx}], adding ${delta}  (i += i & (-i))`);
      await new Promise((r) => setTimeout(r, 800));
    }

    // Update original array too
    const newOrig = [...originalArray];
    newOrig[idx - 1] += delta;
    setOriginalArray(newOrig);

    setBitArray(newBit);

    const finalHighlights = new Map<number, CellState>();
    steps.forEach((s) => finalHighlights.set(s, 'update'));
    setHighlightedBIT(finalHighlights);
    setMessage(`Updated index ${idx} by +${delta} -- visited ${steps.length} cells -- O(log n)`);

    setUpdateIndex('');
    setUpdateDelta('');
    setTimeout(() => setHighlightedBIT(new Map()), 2000);
  };

  const handleReset = () => {
    setOriginalArray([...INITIAL_ARRAY]);
    setBitArray(buildBIT(INITIAL_ARRAY));
    setHighlightedBIT(new Map());
    setMessage('Reset to initial array');
    setQueryIndex('');
    setUpdateIndex('');
    setUpdateDelta('');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>Fenwick Tree (BIT)</h2>

        <div className='mb-3 text-sm'>
          <strong>Original:</strong> [{originalArray.join(', ')}]
          <br />
          <strong>BIT:</strong> [{bitArray.slice(1).join(', ')}]
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <div className='space-y-2'>
          <div className='text-sm font-semibold'>Prefix Sum Query</div>
          <div className='flex gap-1'>
            <input
              type='number'
              placeholder='Index (1-n)'
              value={queryIndex}
              onChange={(e) => setQueryIndex(e.target.value)}
              className='border rounded px-2 py-1 w-28 text-sm'
            />
            <button
              onClick={handlePrefixSumQuery}
              className='bg-green-500 text-white px-3 py-1 rounded text-sm'
            >
              Query
            </button>
          </div>

          <div className='text-sm font-semibold mt-2'>Point Update</div>
          <div className='flex gap-1'>
            <input
              type='number'
              placeholder='Index (1-n)'
              value={updateIndex}
              onChange={(e) => setUpdateIndex(e.target.value)}
              className='border rounded px-2 py-1 w-24 text-sm'
            />
            <input
              type='number'
              placeholder='Delta'
              value={updateDelta}
              onChange={(e) => setUpdateDelta(e.target.value)}
              className='border rounded px-2 py-1 w-20 text-sm'
            />
            <button
              onClick={handlePointUpdate}
              className='bg-yellow-500 text-white px-3 py-1 rounded text-sm'
            >
              Update
            </button>
          </div>

          <button
            onClick={handleReset}
            className='bg-purple-500 text-white px-3 py-1 rounded text-sm w-full mt-2'
          >
            Reset
          </button>
        </div>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Query O(log n) | Update O(log n) | Build O(n log n)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44bb44' }}></span>Query
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ddcc00' }}></span>Update
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ff4444' }}></span>Current
        </div>
      </div>
    </div>
  );
};

export default FenwickTreeDataStructure;
