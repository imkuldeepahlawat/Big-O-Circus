import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane } from '@/lib/visualizationHelpers';

const FILES = 'ABCDEFGH';
const BOARD_MASK = (1n << 64n) - 1n;
const FILE_A_MASK = 0x0101010101010101n;
const FILE_H_MASK = 0x8080808080808080n;
const CHECKERBOARD_MASK = 0xaa55aa55aa55aa55n;
const CENTER_CROSS_MASK = 0x0000001818000000n;

const squareToIndex = (square: string): number | null => {
  const normalized = square.trim().toUpperCase();
  if (normalized.length < 2) return null;

  const file = FILES.indexOf(normalized[0]);
  const rank = Number.parseInt(normalized.slice(1), 10) - 1;

  if (file < 0 || Number.isNaN(rank) || rank < 0 || rank > 7) return null;
  return rank * 8 + file;
};

const hasBit = (board: bigint, index: number): boolean =>
  (board & (1n << BigInt(index))) !== 0n;

const bitboardToRows = (board: bigint): string[] =>
  board
    .toString(2)
    .padStart(64, '0')
    .match(/.{1,8}/g) ?? [];

const BitboardDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [board, setBoard] = useState<bigint>(0n);
  const [squareInput, setSquareInput] = useState('E4');
  const [message, setMessage] = useState(
    'A bitboard is an 8x8 grid packed into one 64-bit number, where each square is just on or off.'
  );
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 1.5, 13);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [board, highlightIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const spacing = 0.95;

    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const index = rank * 8 + file;
        const active = hasBit(board, index);
        const selected = highlightIndex === index;
        const isDarkSquare = (file + rank) % 2 === 1;
        const color = selected
          ? 0xf59e0b
          : active
            ? 0x16a34a
            : isDarkSquare
              ? 0x475569
              : 0x94a3b8;

        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(0.82, 0.18, 0.82),
          new THREE.MeshStandardMaterial({ color })
        );
        tile.position.set((file - 3.5) * spacing, (rank - 3.5) * spacing, 0);
        group.add(tile);

        if (active || selected) {
          group.add(
            createTextPlane(active ? '1' : '0', {
              x: (file - 3.5) * spacing,
              y: (rank - 3.5) * spacing + 0.25,
              z: 0.12,
              planeWidth: 0.22,
              planeHeight: 0.18,
              fontSize: 18,
            })
          );
        }
      }
    }

    for (let file = 0; file < 8; file++) {
      group.add(
        createTextPlane(FILES[file], {
          x: (file - 3.5) * spacing,
          y: -4.3,
          z: 0.05,
          planeWidth: 0.2,
          planeHeight: 0.16,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
    }

    for (let rank = 0; rank < 8; rank++) {
      group.add(
        createTextPlane((rank + 1).toString(), {
          x: -4.35,
          y: (rank - 3.5) * spacing,
          z: 0.05,
          planeWidth: 0.2,
          planeHeight: 0.16,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
    }

    group.add(
      createTextPlane(`hex ${board.toString(16).toUpperCase() || '0'}`, {
        x: 0,
        y: 4.6,
        z: 0.05,
        planeWidth: 3.4,
        planeHeight: 0.26,
        fontSize: 20,
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const updateSelectedSquare = (): number | null => {
    const index = squareToIndex(squareInput);
    setHighlightIndex(index);
    if (index === null) {
      setMessage('Use chessboard-style coordinates like A1 or E4.');
    }
    return index;
  };

  const setSquare = () => {
    const index = updateSelectedSquare();
    if (index === null) return;
    setBoard((currentBoard) => currentBoard | (1n << BigInt(index)));
    setMessage(`Square ${squareInput.toUpperCase()} is now on inside the 64-bit board.`);
  };

  const clearSquare = () => {
    const index = updateSelectedSquare();
    if (index === null) return;
    setBoard((currentBoard) => currentBoard & ~(1n << BigInt(index)));
    setMessage(`Square ${squareInput.toUpperCase()} is now off inside the 64-bit board.`);
  };

  const toggleSquare = () => {
    const index = updateSelectedSquare();
    if (index === null) return;
    setBoard((currentBoard) => currentBoard ^ (1n << BigInt(index)));
    setMessage(`Square ${squareInput.toUpperCase()} flipped from 0 to 1 or from 1 to 0.`);
  };

  const applyOperation = (nextBoard: bigint, explanation: string) => {
    setBoard(nextBoard & BOARD_MASK);
    setMessage(explanation);
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>Bitboard</h2>
        <p className='mb-3 text-sm text-slate-700'>
          Think of a chessboard where every square is just a switch. One 64-bit
          number remembers the whole board at once.
        </p>

        <div className='mb-3 flex gap-2'>
          <input
            type='text'
            value={squareInput}
            onChange={(event) => setSquareInput(event.target.value)}
            className='flex-1 rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Square like E4'
          />
          <button
            onClick={toggleSquare}
            className='rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white'
          >
            Toggle
          </button>
        </div>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={setSquare}
            className='rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white'
          >
            Set
          </button>
          <button
            onClick={clearSquare}
            className='rounded bg-rose-600 px-3 py-2 text-sm font-medium text-white'
          >
            Clear
          </button>
          <button
            onClick={() =>
              applyOperation(
                ((board & ~FILE_H_MASK) << 1n) & BOARD_MASK,
                'Shift east moves every on-bit one file to the right, unless it would fall off the H-file.'
              )
            }
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Shift East
          </button>
          <button
            onClick={() =>
              applyOperation(
                (board & ~FILE_A_MASK) >> 1n,
                'Shift west moves every on-bit one file to the left, unless it would fall off the A-file.'
              )
            }
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Shift West
          </button>
          <button
            onClick={() =>
              applyOperation(
                (board << 8n) & BOARD_MASK,
                'Shift north moves every on-bit up one rank by shifting 8 positions.'
              )
            }
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Shift North
          </button>
          <button
            onClick={() =>
              applyOperation(
                board >> 8n,
                'Shift south moves every on-bit down one rank by shifting 8 positions.'
              )
            }
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Shift South
          </button>
          <button
            onClick={() =>
              applyOperation(
                board & CHECKERBOARD_MASK,
                'AND with a checkerboard mask keeps only the squares that overlap the mask.'
              )
            }
            className='rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white'
          >
            AND Mask
          </button>
          <button
            onClick={() =>
              applyOperation(
                board | CENTER_CROSS_MASK,
                'OR with the center mask turns on the middle block without disturbing the bits that were already on.'
              )
            }
            className='rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white'
          >
            OR Mask
          </button>
          <button
            onClick={() => {
              setBoard(0n);
              setHighlightIndex(null);
              setMessage('Clear the whole bitboard back to 0. All squares are off now.');
            }}
            className='rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white'
          >
            Clear Board
          </button>
        </div>

        <div className='mb-3 rounded bg-slate-100 p-3 text-sm text-slate-800'>
          {message}
        </div>

        <div className='space-y-1 text-sm text-slate-700'>
          <div className='font-mono text-xs'>
            {bitboardToRows(board).join(' ')}
          </div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: each bitwise operation is O(1) on this fixed-size 64-bit board.
        </div>
      </div>
    </div>
  );
};

export default BitboardDataStructure;
