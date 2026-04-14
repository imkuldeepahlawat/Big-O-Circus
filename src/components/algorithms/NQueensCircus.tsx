import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BoardState {
  queens: number[]; // queens[row] = col
  conflicts: [number, number][];
  safe: [number, number][];
  currentRow: number;
  currentCol: number;
}

const NQueensCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const solvingRef = useRef(false);
  const [boardSize, setBoardSize] = useState(4);
  const [isSolving, setIsSolving] = useState(false);
  const [queensPlaced, setQueensPlaced] = useState(0);
  const [backtracks, setBacktracks] = useState(0);
  const [message, setMessage] = useState('Ready to solve');
  const [stepMode, setStepMode] = useState(false);
  const stepResolveRef = useRef<(() => void) | null>(null);
  const [boardState, setBoardState] = useState<BoardState>({
    queens: [],
    conflicts: [],
    safe: [],
    currentRow: -1,
    currentCol: -1,
  });

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        visualizerRef.current.camera.position.set(0, 8, 8);
        visualizerRef.current.camera.lookAt(0, 0, 0);
        renderBoard({
          queens: [],
          conflicts: [],
          safe: [],
          currentRow: -1,
          currentCol: -1,
        });
      }
    } catch (err) {
      console.error('Error in initial useEffect:', err);
    }
    return () => {
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderBoard(boardState);
  }, [boardState]);

  const renderBoard = (state: BoardState): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    const n = boardSize;
    const tileSize = 1;
    const offsetX = -(n - 1) * tileSize * 0.5;
    const offsetZ = -(n - 1) * tileSize * 0.5;

    const conflictSet = new Set(
      state.conflicts.map(([r, c]) => `${r},${c}`)
    );
    const safeSet = new Set(state.safe.map(([r, c]) => `${r},${c}`));

    // Draw board tiles
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const key = `${row},${col}`;
        let color: number;

        if (conflictSet.has(key)) {
          color = 0xcc3333; // red for conflicts
        } else if (safeSet.has(key)) {
          color = 0x33cc55; // green for safe
        } else {
          color = (row + col) % 2 === 0 ? 0xeeeeee : 0x333333; // checkerboard
        }

        const tileGeometry = new THREE.BoxGeometry(
          tileSize * 0.95,
          0.15,
          tileSize * 0.95
        );
        const tileMaterial = new THREE.MeshStandardMaterial({ color });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.position.set(
          offsetX + col * tileSize,
          0,
          offsetZ + row * tileSize
        );
        sceneGroup.add(tile);
      }
    }

    // Draw queens
    for (let row = 0; row < state.queens.length; row++) {
      const col = state.queens[row];
      if (col === -1) continue;

      const queenGroup = new THREE.Group();

      // Base cylinder
      const baseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 16);
      const queenMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.6,
        roughness: 0.3,
      });
      const base = new THREE.Mesh(baseGeometry, queenMaterial);
      base.position.y = 0.2;
      queenGroup.add(base);

      // Body cone
      const bodyGeometry = new THREE.ConeGeometry(0.25, 0.7, 16);
      const body = new THREE.Mesh(bodyGeometry, queenMaterial);
      body.position.y = 0.65;
      queenGroup.add(body);

      // Crown sphere
      const crownGeometry = new THREE.SphereGeometry(0.1, 12, 12);
      const crown = new THREE.Mesh(crownGeometry, queenMaterial);
      crown.position.y = 1.05;
      queenGroup.add(crown);

      queenGroup.position.set(
        offsetX + col * tileSize,
        0.075,
        offsetZ + row * tileSize
      );
      sceneGroup.add(queenGroup);
    }

    // Highlight current evaluation position
    if (state.currentRow >= 0 && state.currentCol >= 0) {
      const highlightGeometry = new THREE.RingGeometry(0.3, 0.45, 16);
      const highlightMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
      highlight.rotation.x = -Math.PI / 2;
      highlight.position.set(
        offsetX + state.currentCol * tileSize,
        0.16,
        offsetZ + state.currentRow * tileSize
      );
      sceneGroup.add(highlight);
    }

    // Row/column labels
    for (let i = 0; i < n; i++) {
      // Column labels
      const colCanvas = document.createElement('canvas');
      colCanvas.width = 64;
      colCanvas.height = 64;
      const colCtx = colCanvas.getContext('2d');
      if (colCtx) {
        colCtx.fillStyle = 'white';
        colCtx.font = 'bold 40px Arial';
        colCtx.textAlign = 'center';
        colCtx.textBaseline = 'middle';
        colCtx.fillText(String(i), 32, 32);
      }
      const colTexture = new THREE.CanvasTexture(colCanvas);
      const colLabelGeo = new THREE.PlaneGeometry(0.4, 0.4);
      const colLabelMat = new THREE.MeshBasicMaterial({
        map: colTexture,
        transparent: true,
      });
      const colLabel = new THREE.Mesh(colLabelGeo, colLabelMat);
      colLabel.rotation.x = -Math.PI / 2;
      colLabel.position.set(
        offsetX + i * tileSize,
        0.01,
        offsetZ - tileSize * 0.8
      );
      sceneGroup.add(colLabel);
    }

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const waitForStep = (): Promise<void> => {
    return new Promise((resolve) => {
      stepResolveRef.current = resolve;
    });
  };

  const nextStep = () => {
    if (stepResolveRef.current) {
      stepResolveRef.current();
      stepResolveRef.current = null;
    }
  };

  const isSafe = (
    queens: number[],
    row: number,
    col: number
  ): boolean => {
    for (let prevRow = 0; prevRow < row; prevRow++) {
      const prevCol = queens[prevRow];
      if (prevCol === col) return false;
      if (Math.abs(prevRow - row) === Math.abs(prevCol - col)) return false;
    }
    return true;
  };

  const getConflicts = (
    queens: number[],
    row: number,
    col: number
  ): [number, number][] => {
    const conflicts: [number, number][] = [];
    const n = boardSize;
    // Highlight attacked squares from this position
    for (let r = 0; r < n; r++) {
      if (r === row) continue;
      // Same column
      conflicts.push([r, col]);
      // Diagonals
      const d = Math.abs(r - row);
      if (col - d >= 0) conflicts.push([r, col - d]);
      if (col + d < n) conflicts.push([r, col + d]);
    }
    return conflicts;
  };

  const getSafeSquares = (
    queens: number[],
    row: number
  ): [number, number][] => {
    const safe: [number, number][] = [];
    for (let col = 0; col < boardSize; col++) {
      if (isSafe(queens, row, col)) {
        safe.push([row, col]);
      }
    }
    return safe;
  };

  const solve = async (): Promise<void> => {
    if (isSolving) return;
    setIsSolving(true);
    solvingRef.current = true;
    setBacktracks(0);
    setQueensPlaced(0);
    setMessage('Starting N-Queens solver...');

    let backtrackCount = 0;
    const queens: number[] = [];

    const solveRow = async (row: number): Promise<boolean> => {
      if (!solvingRef.current) return false;
      if (row === boardSize) return true;

      const safeSquares = getSafeSquares(queens, row);
      setBoardState({
        queens: [...queens],
        conflicts: [],
        safe: safeSquares,
        currentRow: row,
        currentCol: -1,
      });
      setMessage(`Evaluating row ${row} - ${safeSquares.length} safe positions`);

      if (stepMode) {
        await waitForStep();
      } else {
        await delay(400);
      }

      for (let col = 0; col < boardSize; col++) {
        if (!solvingRef.current) return false;

        setMessage(`Trying queen at row ${row}, column ${col}`);
        setBoardState({
          queens: [...queens],
          conflicts: [],
          safe: safeSquares,
          currentRow: row,
          currentCol: col,
        });

        if (stepMode) {
          await waitForStep();
        } else {
          await delay(300);
        }

        if (isSafe(queens, row, col)) {
          queens.push(col);
          setQueensPlaced(queens.length);
          setMessage(`Placed queen at row ${row}, column ${col}`);

          setBoardState({
            queens: [...queens],
            conflicts: [],
            safe: [],
            currentRow: row,
            currentCol: col,
          });

          if (stepMode) {
            await waitForStep();
          } else {
            await delay(400);
          }

          const solved = await solveRow(row + 1);
          if (solved) return true;

          // Backtrack
          queens.pop();
          backtrackCount++;
          setBacktracks(backtrackCount);
          setQueensPlaced(queens.length);
          setMessage(`Backtracking from row ${row}, column ${col}`);

          const conflicts = getConflicts(queens, row, col);
          setBoardState({
            queens: [...queens],
            conflicts,
            safe: [],
            currentRow: row,
            currentCol: col,
          });

          if (stepMode) {
            await waitForStep();
          } else {
            await delay(400);
          }
        } else {
          // Show conflicts for this invalid position
          const conflicts = getConflicts(queens, row, col);
          setMessage(`Conflict at row ${row}, column ${col}`);
          setBoardState({
            queens: [...queens],
            conflicts,
            safe: [],
            currentRow: row,
            currentCol: col,
          });

          if (stepMode) {
            await waitForStep();
          } else {
            await delay(250);
          }
        }
      }

      return false;
    };

    const found = await solveRow(0);

    if (found && solvingRef.current) {
      setMessage(`Solution found! ${boardSize} queens placed with ${backtrackCount} backtracks.`);
      setBoardState({
        queens: [...queens],
        conflicts: [],
        safe: [],
        currentRow: -1,
        currentCol: -1,
      });
    } else if (solvingRef.current) {
      setMessage('No solution exists for this board size.');
    }

    setIsSolving(false);
    solvingRef.current = false;
  };

  const reset = () => {
    solvingRef.current = false;
    setIsSolving(false);
    setQueensPlaced(0);
    setBacktracks(0);
    setMessage('Ready to solve');
    stepResolveRef.current = null;
    setBoardState({
      queens: [],
      conflicts: [],
      safe: [],
      currentRow: -1,
      currentCol: -1,
    });
  };

  const handleBoardSizeChange = (size: number) => {
    reset();
    setBoardSize(size);
  };

  // Re-render board when boardSize changes (after reset clears state)
  useEffect(() => {
    renderBoard({
      queens: [],
      conflicts: [],
      safe: [],
      currentRow: -1,
      currentCol: -1,
    });
  }, [boardSize]);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h2 className='text-2xl font-bold mb-3'>N-Queens Problem</h2>

        <div className='mb-3'>
          <label className='block text-sm font-semibold mb-1'>
            Board Size: {boardSize}x{boardSize}
          </label>
          <div className='flex gap-1'>
            {[4, 5, 6, 7, 8].map((size) => (
              <button
                key={size}
                onClick={() => handleBoardSizeChange(size)}
                className={`px-3 py-1 rounded text-sm ${
                  boardSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                disabled={isSolving}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-3 flex items-center gap-2'>
          <label className='text-sm font-semibold'>Step-by-step:</label>
          <input
            type='checkbox'
            checked={stepMode}
            onChange={(e) => setStepMode(e.target.checked)}
            disabled={isSolving}
          />
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={solve}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isSolving}
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
          {stepMode && isSolving && (
            <button
              onClick={nextStep}
              className='bg-blue-500 text-white px-4 py-2 rounded text-sm'
            >
              Next Step
            </button>
          )}
          <button
            onClick={reset}
            className='bg-red-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div>
            <strong>Queens placed:</strong> {queensPlaced}
          </div>
          <div>
            <strong>Backtracks:</strong> {backtracks}
          </div>
          <div>
            <strong>Status:</strong> {message}
          </div>
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div>
            <strong>Time Complexity:</strong> O(N!)
          </div>
          <div>
            <strong>Space Complexity:</strong> O(N)
          </div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ffd700' }}
            ></span>{' '}
            Queen
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#cc3333' }}
            ></span>{' '}
            Conflict
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#33cc55' }}
            ></span>{' '}
            Safe
          </div>
        </div>
      </div>
    </div>
  );
};

export default NQueensCircus;
