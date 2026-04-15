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

const MATRIX_SIZE = 6;

interface SparseEntry {
  row: number;
  col: number;
  value: number;
}

const SparseMatrixDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [entries, setEntries] = useState<SparseEntry[]>([]);
  const [rowInput, setRowInput] = useState('');
  const [colInput, setColInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [message, setMessage] = useState('Sparse Matrix ready (6x6)');
  const [highlightedCell, setHighlightedCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(3, 8, 10);
      viewerRef.current.camera.lookAt(3, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [entries, highlightedCell]);

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

  const getValue = (row: number, col: number): number => {
    const entry = entries.find((e) => e.row === row && e.col === col);
    return entry ? entry.value : 0;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const cellSize = 1.1;
    const raisedHeight = 0.6;

    // Row/Col labels
    for (let i = 0; i < MATRIX_SIZE; i++) {
      // Row labels
      const rowTexture = new THREE.CanvasTexture(makeTextCanvas(`R${i}`, '#888888', 22));
      const rowMat = new THREE.MeshBasicMaterial({ map: rowTexture, transparent: true });
      const rowLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), rowMat);
      rowLabel.position.set(-0.8, 0, (MATRIX_SIZE - 1 - i) * cellSize);
      rowLabel.rotation.x = -Math.PI / 4;
      group.add(rowLabel);

      // Col labels
      const colTexture = new THREE.CanvasTexture(makeTextCanvas(`C${i}`, '#888888', 22));
      const colMat = new THREE.MeshBasicMaterial({ map: colTexture, transparent: true });
      const colLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), colMat);
      colLabel.position.set(i * cellSize, 0, MATRIX_SIZE * cellSize);
      colLabel.rotation.x = -Math.PI / 4;
      group.add(colLabel);
    }

    // Grid cells
    for (let r = 0; r < MATRIX_SIZE; r++) {
      for (let c = 0; c < MATRIX_SIZE; c++) {
        const val = getValue(r, c);
        const isNonZero = val !== 0;
        const isHL = highlightedCell && highlightedCell.row === r && highlightedCell.col === c;
        const height = isNonZero ? raisedHeight : 0.15;

        const geometry = new THREE.BoxGeometry(0.9, height, 0.9);
        const color = isHL ? 0x44ff44 : isNonZero ? 0x4287f5 : 0x444444;
        const material = new THREE.MeshStandardMaterial({
          color,
          transparent: !isNonZero && !isHL,
          opacity: isNonZero || isHL ? 1.0 : 0.4,
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(c * cellSize, height / 2, (MATRIX_SIZE - 1 - r) * cellSize);
        group.add(cube);

        // Value label on top
        if (isNonZero) {
          const valTexture = new THREE.CanvasTexture(makeTextCanvas(val.toString(), 'white', 28));
          const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
          const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), valMat);
          valLabel.position.set(c * cellSize, height + 0.15, (MATRIX_SIZE - 1 - r) * cellSize);
          valLabel.rotation.x = -Math.PI / 4;
          group.add(valLabel);
        }
      }
    }

    // Sparse representation on the right side
    const sparseX = MATRIX_SIZE * cellSize + 1.5;
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('Stored:', '#cccccc', 22));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), titleMat);
    titleLabel.position.set(sparseX, 2.5, MATRIX_SIZE * cellSize / 2);
    titleLabel.rotation.x = -Math.PI / 6;
    group.add(titleLabel);

    entries.slice(0, 10).forEach((entry, idx) => {
      const entryText = `(${entry.row},${entry.col})=${entry.value}`;
      const entryTexture = new THREE.CanvasTexture(makeTextCanvas(entryText, '#88ccff', 18));
      const entryMat = new THREE.MeshBasicMaterial({ map: entryTexture, transparent: true });
      const entryLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.25), entryMat);
      entryLabel.position.set(sparseX, 2.0 - idx * 0.4, MATRIX_SIZE * cellSize / 2);
      entryLabel.rotation.x = -Math.PI / 6;
      group.add(entryLabel);
    });

    group.position.x = -((MATRIX_SIZE - 1) * cellSize) / 2;
    group.position.z = -((MATRIX_SIZE - 1) * cellSize) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleSet = () => {
    const r = parseInt(rowInput);
    const c = parseInt(colInput);
    const v = parseInt(valInput);
    if (isNaN(r) || isNaN(c) || isNaN(v) || r < 0 || r >= MATRIX_SIZE || c < 0 || c >= MATRIX_SIZE) {
      setMessage(`Invalid input. Row/Col must be 0-${MATRIX_SIZE - 1}`);
      return;
    }

    const newEntries = entries.filter((e) => !(e.row === r && e.col === c));
    if (v !== 0) {
      newEntries.push({ row: r, col: c, value: v });
    }
    newEntries.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);

    setEntries(newEntries);
    setHighlightedCell({ row: r, col: c });
    setMessage(`Set (${r},${c}) = ${v} -- ${newEntries.length} non-zero entries stored`);
    setValInput('');
    setTimeout(() => setHighlightedCell(null), 1200);
  };

  const handleGet = () => {
    const r = parseInt(rowInput);
    const c = parseInt(colInput);
    if (isNaN(r) || isNaN(c) || r < 0 || r >= MATRIX_SIZE || c < 0 || c >= MATRIX_SIZE) {
      setMessage(`Invalid input. Row/Col must be 0-${MATRIX_SIZE - 1}`);
      return;
    }
    const val = getValue(r, c);
    setHighlightedCell({ row: r, col: c });
    setMessage(`Get (${r},${c}) = ${val}`);
    setTimeout(() => setHighlightedCell(null), 1500);
  };

  const handleRandom = () => {
    const newEntries: SparseEntry[] = [];
    const count = Math.floor(Math.random() * 6) + 4;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * MATRIX_SIZE);
      const c = Math.floor(Math.random() * MATRIX_SIZE);
      if (!newEntries.some((e) => e.row === r && e.col === c)) {
        newEntries.push({ row: r, col: c, value: Math.floor(Math.random() * 20) + 1 });
      }
    }
    newEntries.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
    setEntries(newEntries);
    setMessage(`Generated ${newEntries.length} non-zero entries in ${MATRIX_SIZE}x${MATRIX_SIZE} matrix`);
  };

  const handleClear = () => {
    setEntries([]);
    setHighlightedCell(null);
    setMessage('Matrix cleared');
  };

  const density = ((entries.length / (MATRIX_SIZE * MATRIX_SIZE)) * 100).toFixed(1);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Sparse Matrix</h2>

        <div className='mb-2 text-sm'>
          <strong>Size:</strong> {MATRIX_SIZE}x{MATRIX_SIZE} | <strong>Non-zero:</strong> {entries.length}/{MATRIX_SIZE * MATRIX_SIZE} ({density}%)
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='operations'>
            <AccordionTrigger>Operations</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='number'
                  placeholder='Row'
                  value={rowInput}
                  onChange={(e) => setRowInput(e.target.value)}
                  className='border rounded px-2 py-1 w-16 text-sm'
                />
                <input
                  type='number'
                  placeholder='Col'
                  value={colInput}
                  onChange={(e) => setColInput(e.target.value)}
                  className='border rounded px-2 py-1 w-16 text-sm'
                />
                <input
                  type='number'
                  placeholder='Val'
                  value={valInput}
                  onChange={(e) => setValInput(e.target.value)}
                  className='border rounded px-2 py-1 w-16 text-sm'
                />
              </div>
              <div className='flex gap-1'>
                <Button onClick={handleSet} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>
                  Set
                </Button>
                <Button onClick={handleGet} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>
                  Get
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button onClick={handleRandom} className='bg-purple-500 text-white px-3 py-1 rounded text-sm'>
                  Random Fill
                </Button>
                <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm'>
                  Clear
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Get O(k) | Set O(k) | k = non-zero entries | Space O(k) vs O(n*m)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#444444' }}></span>Zero
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>Non-zero
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44ff44' }}></span>Selected
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Sparse Matrix</h3>
        <p className='text-sm'>
          A Sparse Matrix is a matrix in which most elements are zero. Instead of
          storing all n*m elements, only non-zero entries are stored along with their
          row and column indices. Common representations include coordinate list (COO),
          compressed sparse row (CSR), and compressed sparse column (CSC). This saves
          significant memory when the matrix density is low, and enables faster
          operations by skipping zero elements.
        </p>
      </div>
    </div>
  );
};

export default SparseMatrixDataStructure;
