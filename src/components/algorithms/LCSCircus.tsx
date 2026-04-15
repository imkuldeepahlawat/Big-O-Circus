import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type CellState = 'empty' | 'computing' | 'computed' | 'traceback';

interface DPCell {
  value: number;
  state: CellState;
}

const STR_A = 'ABCBDAB';
const STR_B = 'BDCAB';

const LCSCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [dpTable, setDpTable] = useState<DPCell[][]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [currentCell, setCurrentCell] = useState<[number, number]>([-1, -1]);
  const [lcsResult, setLcsResult] = useState<string>('');
  const [tracebackPath, setTracebackPath] = useState<[number, number][]>([]);
  const animationCancelled = useRef(false);

  const m = STR_A.length;
  const n = STR_B.length;

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 0, 14);
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
  }, [dpTable, currentCell, tracebackPath]);

  const createTextCanvas = (
    text: string,
    width = 128,
    height = 64,
    fontSize = 28,
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
    isTraceback: boolean
  ): number => {
    if (isActive) return 0xffd700;
    if (isTraceback) return 0xff6644;
    switch (state) {
      case 'empty':
        return 0x555555;
      case 'computing':
        return 0xffd700;
      case 'computed':
        return 0x3388cc;
      case 'traceback':
        return 0xff6644;
      default:
        return 0x555555;
    }
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const cellSize = 1.0;
    const rows = m + 1;
    const cols = n + 1;
    const offsetX = (-cols * cellSize) / 2 + cellSize / 2;
    const offsetY = (rows * cellSize) / 2 - cellSize / 2;

    const tbSet = new Set(tracebackPath.map(([r, c]) => `${r},${c}`));

    // Column headers (STR_B)
    for (let j = 0; j < n; j++) {
      const tc = createTextCanvas(STR_B[j], 64, 64, 28, '#ffcc00');
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat);
      plane.position.set(
        offsetX + (j + 1) * cellSize,
        offsetY + cellSize,
        0
      );
      group.add(plane);
    }

    // Row headers (STR_A)
    for (let i = 0; i < m; i++) {
      const tc = createTextCanvas(STR_A[i], 64, 64, 28, '#ffcc00');
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat);
      plane.position.set(
        offsetX - cellSize,
        offsetY - (i + 1) * cellSize,
        0
      );
      group.add(plane);
    }

    // DP table cells
    for (let i = 0; i <= m; i++) {
      for (let j = 0; j <= n; j++) {
        if (!dpTable[i]) continue;
        const cell = dpTable[i][j];
        const isActive = currentCell[0] === i && currentCell[1] === j;
        const isTb = tbSet.has(`${i},${j}`);

        const boxGeo = new THREE.BoxGeometry(
          cellSize * 0.85,
          cellSize * 0.85,
          0.2
        );
        const boxMat = new THREE.MeshStandardMaterial({
          color: getColor(cell.state, isActive, isTb),
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(
          offsetX + j * cellSize,
          offsetY - i * cellSize,
          0
        );
        group.add(box);

        const valText =
          cell.state === 'empty' ? '' : cell.value.toString();
        if (valText) {
          const tc = createTextCanvas(valText, 64, 64, 30);
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
            offsetX + j * cellSize,
            offsetY - i * cellSize,
            0.15
          );
          group.add(plane);
        }
      }
    }

    // Title
    const titleCanvas = createTextCanvas(
      'Longest Common Subsequence',
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
    titlePlane.position.set(0, offsetY + 2.2, 0);
    group.add(titlePlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const initTable = (): void => {
    const table: DPCell[][] = Array.from({ length: m + 1 }, () =>
      Array.from({ length: n + 1 }, () => ({ value: 0, state: 'empty' as CellState }))
    );
    setDpTable(table);
    setCurrentCell([-1, -1]);
    setTracebackPath([]);
    setLcsResult('');
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const computeLCS = async (): Promise<void> => {
    if (isComputing) return;
    setIsComputing(true);
    animationCancelled.current = false;

    const table: DPCell[][] = Array.from({ length: m + 1 }, () =>
      Array.from({ length: n + 1 }, () => ({ value: 0, state: 'computed' as CellState }))
    );

    // Fill base row/col
    setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
    await sleep(300);

    // Fill DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (animationCancelled.current) return;
        setCurrentCell([i, j]);
        table[i][j] = { value: 0, state: 'computing' };
        setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
        await sleep(120);
        if (animationCancelled.current) return;

        if (STR_A[i - 1] === STR_B[j - 1]) {
          table[i][j] = {
            value: table[i - 1][j - 1].value + 1,
            state: 'computed',
          };
        } else {
          table[i][j] = {
            value: Math.max(table[i - 1][j].value, table[i][j - 1].value),
            state: 'computed',
          };
        }
        setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
        await sleep(80);
      }
    }

    // Traceback
    const path: [number, number][] = [];
    let lcs = '';
    let ti = m;
    let tj = n;
    while (ti > 0 && tj > 0) {
      if (animationCancelled.current) return;
      path.push([ti, tj]);
      if (STR_A[ti - 1] === STR_B[tj - 1]) {
        lcs = STR_A[ti - 1] + lcs;
        table[ti][tj].state = 'traceback';
        ti--;
        tj--;
      } else if (table[ti - 1][tj].value > table[ti][tj - 1].value) {
        ti--;
      } else {
        tj--;
      }
      setTracebackPath([...path]);
      setDpTable(table.map((r) => r.map((c) => ({ ...c }))));
      await sleep(200);
    }

    setCurrentCell([-1, -1]);
    setLcsResult(lcs);
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
        <h2 className='text-xl font-bold mb-3'>
          Longest Common Subsequence
        </h2>

        <div className='mb-2 text-sm'>
          <div>
            String A: <strong>{STR_A}</strong>
          </div>
          <div>
            String B: <strong>{STR_B}</strong>
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={computeLCS}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isComputing}
          >
            {isComputing ? 'Computing...' : 'Compute LCS'}
          </button>
          <button
            onClick={handleReset}
            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        {lcsResult && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>
            <div>
              <strong>LCS: {lcsResult}</strong>
            </div>
            <div>Length: {lcsResult.length}</div>
          </div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Time: <strong>O(m * n)</strong>
          </div>
          <div>
            Space: <strong>O(m * n)</strong>
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
              style={{ backgroundColor: '#3388cc' }}
            ></span>{' '}
            Computed
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ff6644' }}
            ></span>{' '}
            Traceback
          </div>
        </div>
      </div>
    </div>
  );
};

export default LCSCircus;
