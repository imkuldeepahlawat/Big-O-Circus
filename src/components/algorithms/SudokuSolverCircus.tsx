import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type Grid = number[][];

const EMPTY = 0;
const SIZE = 4;
const BOX = 2;

const initialPuzzles: Grid[] = [
  [
    [1, 0, 0, 4],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [4, 0, 0, 2],
  ],
  [
    [0, 2, 0, 0],
    [0, 0, 3, 0],
    [0, 4, 0, 0],
    [0, 0, 2, 0],
  ],
  [
    [0, 0, 3, 0],
    [3, 0, 0, 2],
    [2, 0, 0, 1],
    [0, 1, 0, 0],
  ],
];

const SudokuSolverCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const solvingRef = useRef(false);
  const [grid, setGrid] = useState<Grid>(initialPuzzles[0].map((r) => [...r]));
  const [fixedCells, setFixedCells] = useState<boolean[][]>([]);
  const [currentCell, setCurrentCell] = useState<[number, number]>([-1, -1]);
  const [tryingValue, setTryingValue] = useState<number>(0);
  const [isBacktracking, setIsBacktracking] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [backtracks, setBacktracks] = useState(0);
  const [message, setMessage] = useState('Select a puzzle and solve');

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        visualizerRef.current.camera.position.set(0, 7, 5);
        visualizerRef.current.camera.lookAt(0, 0, 0);
        const fixed = initialPuzzles[0].map((r) => r.map((v) => v !== EMPTY));
        setFixedCells(fixed);
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
      renderGrid();
    }
  }, [grid, currentCell, tryingValue, isBacktracking]);

  const renderGrid = (): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    const cellSize = 1.2;
    const offsetX = -((SIZE - 1) * cellSize) / 2;
    const offsetZ = -((SIZE - 1) * cellSize) / 2;

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const value = grid[row][col];
        const isFixed = fixedCells[row]?.[col] ?? false;
        const isCurrent = currentCell[0] === row && currentCell[1] === col;

        // Base tile
        let tileColor = 0x334455;
        if (isCurrent && isBacktracking) {
          tileColor = 0xcc3333; // red for backtracking
        } else if (isCurrent) {
          tileColor = 0x33cc55; // green for trying
        } else if (isFixed) {
          tileColor = 0x556677;
        }

        const tileGeo = new THREE.BoxGeometry(cellSize * 0.9, 0.15, cellSize * 0.9);
        const tileMat = new THREE.MeshStandardMaterial({ color: tileColor });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(offsetX + col * cellSize, 0, offsetZ + row * cellSize);
        sceneGroup.add(tile);

        // 3D block for value
        if (value !== EMPTY) {
          const height = 0.5 + value * 0.2;
          let blockColor = isFixed ? 0x4488cc : 0x88ccff;
          if (isCurrent && isBacktracking) {
            blockColor = 0xff4444;
          } else if (isCurrent) {
            blockColor = 0x44ff88;
          }

          const blockGeo = new THREE.BoxGeometry(cellSize * 0.7, height, cellSize * 0.7);
          const blockMat = new THREE.MeshStandardMaterial({
            color: blockColor,
            transparent: true,
            opacity: isFixed ? 1.0 : 0.85,
          });
          const block = new THREE.Mesh(blockGeo, blockMat);
          block.position.set(
            offsetX + col * cellSize,
            0.075 + height / 2,
            offsetZ + row * cellSize
          );
          sceneGroup.add(block);

          // Number label on top
          const labelCanvas = document.createElement('canvas');
          labelCanvas.width = 64;
          labelCanvas.height = 64;
          const ctx = labelCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toString(), 32, 32);
          }
          const labelTexture = new THREE.CanvasTexture(labelCanvas);
          const labelGeo = new THREE.PlaneGeometry(0.5, 0.5);
          const labelMat = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
          });
          const label = new THREE.Mesh(labelGeo, labelMat);
          label.rotation.x = -Math.PI / 2;
          label.position.set(
            offsetX + col * cellSize,
            0.075 + height + 0.01,
            offsetZ + row * cellSize
          );
          sceneGroup.add(label);
        }
      }
    }

    // Grid lines for 2x2 boxes
    const lineColor = 0xffffff;
    const lineMat = new THREE.MeshBasicMaterial({ color: lineColor });
    for (let i = 0; i <= SIZE; i += BOX) {
      const lineGeo = new THREE.BoxGeometry(SIZE * cellSize + 0.2, 0.02, 0.05);
      const hLine = new THREE.Mesh(lineGeo, lineMat);
      hLine.position.set(0, 0.08, offsetZ + i * cellSize - cellSize / 2);
      sceneGroup.add(hLine);

      const vLineGeo = new THREE.BoxGeometry(0.05, 0.02, SIZE * cellSize + 0.2);
      const vLine = new THREE.Mesh(vLineGeo, lineMat);
      vLine.position.set(offsetX + i * cellSize - cellSize / 2, 0.08, 0);
      sceneGroup.add(vLine);
    }

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const isValid = (g: Grid, row: number, col: number, num: number): boolean => {
    for (let i = 0; i < SIZE; i++) {
      if (g[row][i] === num) return false;
      if (g[i][col] === num) return false;
    }
    const boxRow = Math.floor(row / BOX) * BOX;
    const boxCol = Math.floor(col / BOX) * BOX;
    for (let r = boxRow; r < boxRow + BOX; r++) {
      for (let c = boxCol; c < boxCol + BOX; c++) {
        if (g[r][c] === num) return false;
      }
    }
    return true;
  };

  const solve = async (): Promise<void> => {
    if (isSolving) return;
    setIsSolving(true);
    solvingRef.current = true;
    setBacktracks(0);
    setMessage('Solving...');

    let backtrackCount = 0;
    const g = grid.map((r) => [...r]);

    const solveCell = async (): Promise<boolean> => {
      if (!solvingRef.current) return false;

      // Find next empty cell
      let emptyRow = -1;
      let emptyCol = -1;
      for (let r = 0; r < SIZE && emptyRow === -1; r++) {
        for (let c = 0; c < SIZE && emptyRow === -1; c++) {
          if (g[r][c] === EMPTY) {
            emptyRow = r;
            emptyCol = c;
          }
        }
      }

      if (emptyRow === -1) return true; // solved

      for (let num = 1; num <= SIZE; num++) {
        if (!solvingRef.current) return false;

        setCurrentCell([emptyRow, emptyCol]);
        setTryingValue(num);
        setIsBacktracking(false);

        if (isValid(g, emptyRow, emptyCol, num)) {
          g[emptyRow][emptyCol] = num;
          setGrid(g.map((r) => [...r]));
          setMessage(`Placing ${num} at (${emptyRow},${emptyCol})`);
          await new Promise((r) => setTimeout(r, 400));

          if (await solveCell()) return true;

          // Backtrack
          g[emptyRow][emptyCol] = EMPTY;
          backtrackCount++;
          setBacktracks(backtrackCount);
          setGrid(g.map((r) => [...r]));
          setCurrentCell([emptyRow, emptyCol]);
          setIsBacktracking(true);
          setMessage(`Backtracking from (${emptyRow},${emptyCol}), removing ${num}`);
          await new Promise((r) => setTimeout(r, 350));
        } else {
          g[emptyRow][emptyCol] = num;
          setGrid(g.map((r) => [...r]));
          setIsBacktracking(true);
          setMessage(`${num} invalid at (${emptyRow},${emptyCol})`);
          await new Promise((r) => setTimeout(r, 250));
          g[emptyRow][emptyCol] = EMPTY;
          setGrid(g.map((r) => [...r]));
        }
      }

      return false;
    };

    const solved = await solveCell();
    setCurrentCell([-1, -1]);
    setIsBacktracking(false);

    if (solved && solvingRef.current) {
      setMessage(`Solved! ${backtrackCount} backtracks needed.`);
    } else if (solvingRef.current) {
      setMessage('No solution exists.');
    }

    setIsSolving(false);
    solvingRef.current = false;
  };

  const loadPuzzle = (idx: number): void => {
    if (isSolving) return;
    const puzzle = initialPuzzles[idx].map((r) => [...r]);
    setGrid(puzzle);
    setFixedCells(puzzle.map((r) => r.map((v) => v !== EMPTY)));
    setCurrentCell([-1, -1]);
    setIsBacktracking(false);
    setBacktracks(0);
    setMessage('Puzzle loaded. Press Solve.');
  };

  const reset = (): void => {
    solvingRef.current = false;
    setIsSolving(false);
    loadPuzzle(0);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h2 className='text-2xl font-bold mb-3'>Sudoku Solver (4x4)</h2>

        <div className='mb-3'>
          <label className='block text-sm font-semibold mb-1'>Puzzle:</label>
          <div className='flex gap-1'>
            {initialPuzzles.map((_, idx) => (
              <button
                key={idx}
                onClick={() => loadPuzzle(idx)}
                className='bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm'
                disabled={isSolving}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={solve}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isSolving}
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
          <button
            onClick={reset}
            className='bg-red-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div><strong>Backtracks:</strong> {backtracks}</div>
          <div><strong>Status:</strong> {message}</div>
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div><strong>Time Complexity:</strong> O(n^(n*n))</div>
          <div><strong>Space Complexity:</strong> O(n*n)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#4488cc' }}></span> Fixed cell
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#44ff88' }}></span> Trying
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff4444' }}></span> Backtracking
          </div>
        </div>
      </div>
    </div>
  );
};

export default SudokuSolverCircus;
