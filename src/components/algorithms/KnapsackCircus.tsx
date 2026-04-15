import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type CellState = 'empty' | 'computing' | 'computed' | 'selected';

interface DPCell {
  value: number;
  state: CellState;
}

interface Item {
  name: string;
  weight: number;
  value: number;
}

const ITEMS: Item[] = [
  { name: 'A', weight: 2, value: 3 },
  { name: 'B', weight: 3, value: 4 },
  { name: 'C', weight: 4, value: 5 },
  { name: 'D', weight: 5, value: 8 },
  { name: 'E', weight: 1, value: 2 },
];

const CAPACITY = 8;

const KnapsackCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [dpTable, setDpTable] = useState<DPCell[][]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [currentCell, setCurrentCell] = useState<[number, number]>([-1, -1]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [maxValue, setMaxValue] = useState<number | null>(null);
  const animationCancelled = useRef(false);

  const itemCount = ITEMS.length;

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 0, 16);
      visualizerRef.current.camera.lookAt(0, 0, 0);
      initTable();
    }
    return () => {
      animationCancelled.current = true;
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) updateVisualization();
  }, [dpTable, currentCell, selectedItems]);

  const createTextCanvas = (
    text: string,
    width = 128,
    height = 64,
    fontSize = 26,
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

  const getColor = (
    state: CellState,
    isActive: boolean,
    isSelected: boolean
  ): number => {
    if (isActive) return 0xffd700;
    if (isSelected) return 0x22c55e;
    switch (state) {
      case 'empty':
        return 0x555555;
      case 'computing':
        return 0xffd700;
      case 'computed':
        return 0x3b82f6;
      case 'selected':
        return 0x22c55e;
      default:
        return 0x555555;
    }
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const cellSize = 0.9;
    const rows = itemCount + 1;
    const cols = CAPACITY + 1;
    const offsetX = (-cols * cellSize) / 2 + cellSize / 2;
    const offsetY = (rows * cellSize) / 2 - cellSize / 2;

    const selSet = new Set(
      selectedItems.map((idx) => idx)
    );

    // Column headers (capacity 0..W)
    for (let w = 0; w <= CAPACITY; w++) {
      const tc = createTextCanvas(`w=${w}`, 96, 48, 20, '#aaaaaa');
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), mat);
      plane.position.set(offsetX + w * cellSize, offsetY + cellSize, 0);
      group.add(plane);
    }

    // Row headers (items)
    for (let i = 0; i <= itemCount; i++) {
      const label =
        i === 0 ? '0' : `${ITEMS[i - 1].name}(${ITEMS[i - 1].weight},${ITEMS[i - 1].value})`;
      const tc = createTextCanvas(label, 192, 48, 18, selSet.has(i) ? '#22ff44' : '#aaaaaa');
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), mat);
      plane.position.set(offsetX - cellSize * 1.3, offsetY - i * cellSize, 0);
      group.add(plane);
    }

    // DP table cells
    for (let i = 0; i <= itemCount; i++) {
      for (let w = 0; w <= CAPACITY; w++) {
        if (!dpTable[i]) continue;
        const cell = dpTable[i][w];
        const isActive = currentCell[0] === i && currentCell[1] === w;
        const isSelectedRow = selSet.has(i);

        const boxGeo = new THREE.BoxGeometry(
          cellSize * 0.85,
          cellSize * 0.85,
          0.2
        );
        const boxMat = new THREE.MeshStandardMaterial({
          color: getColor(cell.state, isActive, isSelectedRow && cell.state === 'selected'),
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(offsetX + w * cellSize, offsetY - i * cellSize, 0);
        group.add(box);

        if (cell.state !== 'empty') {
          const tc = createTextCanvas(cell.value.toString(), 64, 64, 26);
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
            offsetX + w * cellSize,
            offsetY - i * cellSize,
            0.15
          );
          group.add(plane);
        }
      }
    }

    // Title
    const titleCanvas = createTextCanvas('0/1 Knapsack Problem', 512, 64, 30);
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    const titleMat = new THREE.MeshBasicMaterial({
      map: titleTex,
      transparent: true,
    });
    const titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 0.5),
      titleMat
    );
    titlePlane.position.set(0, offsetY + 2.2, 0);
    group.add(titlePlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const initTable = (): void => {
    const table: DPCell[][] = Array.from({ length: itemCount + 1 }, () =>
      Array.from({ length: CAPACITY + 1 }, () => ({
        value: 0,
        state: 'empty' as CellState,
      }))
    );
    setDpTable(table);
    setCurrentCell([-1, -1]);
    setSelectedItems([]);
    setMaxValue(null);
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const computeKnapsack = async (): Promise<void> => {
    if (isComputing) return;
    setIsComputing(true);
    animationCancelled.current = false;

    const table: DPCell[][] = Array.from({ length: itemCount + 1 }, () =>
      Array.from({ length: CAPACITY + 1 }, () => ({
        value: 0,
        state: 'computed' as CellState,
      }))
    );

    setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
    await sleep(300);

    // Fill DP table
    for (let i = 1; i <= itemCount; i++) {
      const item = ITEMS[i - 1];
      for (let w = 0; w <= CAPACITY; w++) {
        if (animationCancelled.current) return;
        setCurrentCell([i, w]);
        table[i][w] = { value: 0, state: 'computing' };
        setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
        await sleep(100);
        if (animationCancelled.current) return;

        if (item.weight <= w) {
          const include = table[i - 1][w - item.weight].value + item.value;
          const exclude = table[i - 1][w].value;
          table[i][w] = {
            value: Math.max(include, exclude),
            state: 'computed',
          };
        } else {
          table[i][w] = {
            value: table[i - 1][w].value,
            state: 'computed',
          };
        }
        setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
        await sleep(60);
      }
    }

    // Traceback to find selected items
    const selected: number[] = [];
    let remainW = CAPACITY;
    for (let i = itemCount; i > 0; i--) {
      if (animationCancelled.current) return;
      if (table[i][remainW].value !== table[i - 1][remainW].value) {
        selected.push(i);
        table[i][remainW].state = 'selected';
        remainW -= ITEMS[i - 1].weight;
      }
      setSelectedItems([...selected]);
      setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
      await sleep(300);
    }

    setCurrentCell([-1, -1]);
    setMaxValue(table[itemCount][CAPACITY].value);
    setIsComputing(false);
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsComputing(false);
    initTable();
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>0/1 Knapsack Problem</h2>

        <div className='mb-2 text-sm'>
          <div>
            Capacity: <strong>{CAPACITY}</strong>
          </div>
          <div className='mt-1'>
            {ITEMS.map((item, idx) => (
              <span
                key={idx}
                className={`inline-block mr-2 px-1 rounded ${
                  selectedItems.includes(idx + 1)
                    ? 'bg-green-200 font-bold'
                    : ''
                }`}
              >
                {item.name}(w={item.weight}, v={item.value})
              </span>
            ))}
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={computeKnapsack}
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

        {maxValue !== null && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>
            <div>
              <strong>Max Value: {maxValue}</strong>
            </div>
            <div>
              Selected:{' '}
              {selectedItems.map((i) => ITEMS[i - 1].name).join(', ')}
            </div>
          </div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Time: <strong>O(n * W)</strong>
          </div>
          <div>
            Space: <strong>O(n * W)</strong>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#555555' }}
            ></span>{' '}
            Empty
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ffd700' }}
            ></span>{' '}
            Computing
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#3b82f6' }}
            ></span>{' '}
            Computed
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#22c55e' }}
            ></span>{' '}
            Selected
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnapsackCircus;
