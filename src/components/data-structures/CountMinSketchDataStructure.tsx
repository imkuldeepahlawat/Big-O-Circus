import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const DEPTH = 4;
const WIDTH = 10;

function hashFn(str: string, seed: number, width: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i) * (seed + 1)) & 0x7fffffff;
  }
  return hash % width;
}

function getHashes(str: string, width: number): number[] {
  const seeds = [7, 31, 61, 127];
  return seeds.map((seed) => hashFn(str, seed, width));
}

const CountMinSketchDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [table, setTable] = useState<number[][]>(
    Array.from({ length: DEPTH }, () => new Array(WIDTH).fill(0))
  );
  const [inputValue, setInputValue] = useState('');
  const [queryValue, setQueryValue] = useState('');
  const [message, setMessage] = useState('Count-Min Sketch ready');
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [insertedItems, setInsertedItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 8, 14);
      viewerRef.current.camera.lookAt(5, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [table, highlightedCells]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
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
    const spacing = 1.3;
    const maxVal = Math.max(1, ...table.flat());

    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('Count-Min Sketch', '#666666', 20));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), titleMat);
    titleLabel.position.set((WIDTH * spacing) / 2, 0, DEPTH * spacing + 1);
    titleLabel.rotation.x = -Math.PI / 4;
    group.add(titleLabel);

    for (let d = 0; d < DEPTH; d++) {
      // Row label
      const rowTexture = new THREE.CanvasTexture(makeTextCanvas(`H${d + 1}`, '#aaaaaa', 22));
      const rowMat = new THREE.MeshBasicMaterial({ map: rowTexture, transparent: true });
      const rowLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), rowMat);
      rowLabel.position.set(-1, 0.2, d * spacing);
      rowLabel.rotation.x = -Math.PI / 4;
      group.add(rowLabel);

      for (let w = 0; w < WIDTH; w++) {
        const val = table[d][w];
        const key = `${d},${w}`;
        const isHighlighted = highlightedCells.has(key);
        const height = Math.max(0.1, (val / maxVal) * 3);

        const color = isHighlighted ? 0x44dd44 : val > 0 ? 0x4287f5 : 0x333333;
        const geometry = new THREE.BoxGeometry(0.9, height, 0.9);
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(w * spacing, height / 2, d * spacing);
        group.add(cube);

        if (val > 0) {
          const valTexture = new THREE.CanvasTexture(makeTextCanvas(`${val}`, 'white', 28));
          const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
          const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), valMat);
          valLabel.position.set(w * spacing, height + 0.2, d * spacing);
          valLabel.rotation.x = -Math.PI / 4;
          group.add(valLabel);
        }
      }
    }

    // Column indices
    for (let w = 0; w < WIDTH; w++) {
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`${w}`, '#888888', 18));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), idxMat);
      idxLabel.position.set(w * spacing, 0, -1);
      idxLabel.rotation.x = -Math.PI / 4;
      group.add(idxLabel);
    }

    group.position.x = -((WIDTH - 1) * spacing) / 2;
    group.position.z = -((DEPTH - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const val = inputValue.trim();
    if (!val) { setMessage('Enter a value to insert'); return; }

    const hashes = getHashes(val, WIDTH);
    const newTable = table.map((row) => [...row]);
    const highlights = new Set<string>();

    hashes.forEach((col, row) => {
      newTable[row][col]++;
      highlights.add(`${row},${col}`);
    });

    setTable(newTable);
    setHighlightedCells(highlights);
    setInsertedItems((prev) => ({ ...prev, [val]: (prev[val] || 0) + 1 }));
    setMessage(`Inserted "${val}" at columns [${hashes.join(', ')}]`);
    setInputValue('');
    setTimeout(() => setHighlightedCells(new Set()), 1500);
  };

  const handleQuery = () => {
    const val = queryValue.trim();
    if (!val) { setMessage('Enter a value to query'); return; }

    const hashes = getHashes(val, WIDTH);
    const highlights = new Set<string>();
    const counts: number[] = [];

    hashes.forEach((col, row) => {
      highlights.add(`${row},${col}`);
      counts.push(table[row][col]);
    });

    const estimate = Math.min(...counts);
    const trueCount = insertedItems[val] || 0;
    const overestimate = estimate > trueCount;

    setHighlightedCells(highlights);
    setMessage(
      `Query "${val}": estimated count = ${estimate}, true count = ${trueCount}` +
      (overestimate ? ' (OVERESTIMATE!)' : '')
    );
    setQueryValue('');
    setTimeout(() => setHighlightedCells(new Set()), 2000);
  };

  const handleClear = () => {
    setTable(Array.from({ length: DEPTH }, () => new Array(WIDTH).fill(0)));
    setInsertedItems({});
    setHighlightedCells(new Set());
    setMessage('Count-Min Sketch cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Count-Min Sketch</h2>
        <div className='mb-2 text-sm'>
          <strong>Size:</strong> {DEPTH} x {WIDTH} | <strong>Items:</strong> {Object.keys(insertedItems).length}
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Insert</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input type='text' placeholder='Value' value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  className='border rounded px-2 py-1 w-32 text-sm' />
                <Button onClick={handleInsert} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>Insert</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='query'>
            <AccordionTrigger>Query</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input type='text' placeholder='Value' value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  className='border rounded px-2 py-1 w-32 text-sm' />
                <Button onClick={handleQuery} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>Query</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'>Clear</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Insert O(d) | Query O(d) | d = depth (hash functions)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#333333' }}></span>Empty
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>Occupied
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44dd44' }}></span>Queried
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Count-Min Sketch</h3>
        <p className='text-sm'>
          A Count-Min Sketch is a probabilistic data structure for frequency estimation.
          It uses multiple hash functions mapping to a 2D array of counters. On insert,
          all mapped counters are incremented. On query, the minimum of mapped counters
          is returned as the estimate. It may overestimate but never underestimates counts.
        </p>
      </div>
    </div>
  );
};

export default CountMinSketchDataStructure;
