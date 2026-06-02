import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface MatrixChainStep {
  table: Array<Array<number | null>>;
  currentCell: [number, number] | null;
  splitIndex: number | null;
  candidateCost: number | null;
  bestCost: number | null;
  message: string;
}

const DIMS = [30, 35, 15, 5, 10, 20];
const MATRIX_NAMES = ['A', 'B', 'C', 'D', 'E'];

const cloneTable = (table: Array<Array<number | null>>): Array<Array<number | null>> =>
  table.map((row) => [...row]);

const buildParenthesization = (
  splitTable: number[][],
  start: number,
  end: number
): string => {
  if (start === end) return MATRIX_NAMES[start];
  const split = splitTable[start][end];
  return `(${buildParenthesization(splitTable, start, split)} x ${buildParenthesization(
    splitTable,
    split + 1,
    end
  )})`;
};

const buildMatrixChainSteps = (): MatrixChainStep[] => {
  const matrixCount = DIMS.length - 1;
  const table: Array<Array<number | null>> = Array.from(
    { length: matrixCount },
    (_, row) =>
      Array.from({ length: matrixCount }, (_, col) => (row === col ? 0 : null))
  );
  const splitTable = Array.from({ length: matrixCount }, () =>
    Array.from({ length: matrixCount }, () => 0)
  );

  const steps: MatrixChainStep[] = [
    {
      table: cloneTable(table),
      currentCell: null,
      splitIndex: null,
      candidateCost: null,
      bestCost: null,
      message:
        'Start with one matrix at a time. Multiplying a single matrix costs nothing, so the diagonal is all zeros.',
    },
  ];

  for (let chainLength = 2; chainLength <= matrixCount; chainLength++) {
    for (let start = 0; start <= matrixCount - chainLength; start++) {
      const end = start + chainLength - 1;
      let bestCost = Number.POSITIVE_INFINITY;
      let bestSplit = start;

      for (let split = start; split < end; split++) {
        const candidateCost =
          (table[start][split] ?? 0) +
          (table[split + 1][end] ?? 0) +
          DIMS[start] * DIMS[split + 1] * DIMS[end + 1];

        if (candidateCost < bestCost) {
          bestCost = candidateCost;
          bestSplit = split;
        }

        steps.push({
          table: cloneTable(table),
          currentCell: [start, end],
          splitIndex: split,
          candidateCost,
          bestCost,
          message: `Try splitting ${MATRIX_NAMES[start]}..${MATRIX_NAMES[end]} between ${MATRIX_NAMES[split]} and ${MATRIX_NAMES[split + 1]}.`,
        });
      }

      table[start][end] = bestCost;
      splitTable[start][end] = bestSplit;

      steps.push({
        table: cloneTable(table),
        currentCell: [start, end],
        splitIndex: bestSplit,
        candidateCost: bestCost,
        bestCost,
        message: `Keep the cheapest split for ${MATRIX_NAMES[start]}..${MATRIX_NAMES[end]}. Its cost is ${bestCost}.`,
      });
    }
  }

  steps.push({
    table: cloneTable(table),
    currentCell: [0, matrixCount - 1],
    splitIndex: splitTable[0][matrixCount - 1],
    candidateCost: table[0][matrixCount - 1],
    bestCost: table[0][matrixCount - 1],
    message: `Finished. The best parenthesization is ${buildParenthesization(
      splitTable,
      0,
      matrixCount - 1
    )}.`,
  });

  return steps;
};

const MatrixChainMultiplicationCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [steps, setSteps] = useState<MatrixChainStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Matrix chain multiplication is about choosing the cheapest order to multiply matrices, even though the final math answer stays the same.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 0, 16);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const table =
      currentStep?.table ??
      Array.from({ length: MATRIX_NAMES.length }, (_, row) =>
        Array.from({ length: MATRIX_NAMES.length }, (_, col) =>
          row === col ? 0 : null
        )
      );

    const group = new THREE.Group();
    const cellSize = 1.08;
    const offsetX = -((MATRIX_NAMES.length - 1) * cellSize) / 2;
    const offsetY = ((MATRIX_NAMES.length - 1) * cellSize) / 2;

    MATRIX_NAMES.forEach((name, index) => {
      group.add(
        createTextPlane(name, {
          x: offsetX + index * cellSize,
          y: offsetY + cellSize,
          z: 0.05,
          planeWidth: 0.32,
          planeHeight: 0.2,
          fontSize: 20,
          color: '#cbd5e1',
        })
      );
      group.add(
        createTextPlane(name, {
          x: offsetX - cellSize,
          y: offsetY - index * cellSize,
          z: 0.05,
          planeWidth: 0.32,
          planeHeight: 0.2,
          fontSize: 20,
          color: '#cbd5e1',
        })
      );
    });

    for (let row = 0; row < MATRIX_NAMES.length; row++) {
      for (let col = 0; col < MATRIX_NAMES.length; col++) {
        const isCurrent =
          currentStep?.currentCell?.[0] === row && currentStep?.currentCell?.[1] === col;
        const value = table[row][col];

        const color = isCurrent
          ? 0xf59e0b
          : value === null
            ? 0x334155
            : row === col
              ? 0x16a34a
              : 0x2563eb;

        const box = new THREE.Mesh(
          new THREE.BoxGeometry(cellSize * 0.85, cellSize * 0.85, 0.2),
          new THREE.MeshStandardMaterial({ color })
        );
        box.position.set(offsetX + col * cellSize, offsetY - row * cellSize, 0);
        group.add(box);

        if (value !== null) {
          group.add(
            createTextPlane(value.toString(), {
              x: offsetX + col * cellSize,
              y: offsetY - row * cellSize,
              z: 0.14,
              planeWidth: 0.6,
              planeHeight: 0.28,
              fontSize: 18,
            })
          );
        }
      }
    }

    group.add(
      createTextPlane(`dimensions ${DIMS.join(' x ')}`, {
        x: 0,
        y: 4.25,
        z: 0.05,
        planeWidth: 3.8,
        planeHeight: 0.28,
        fontSize: 20,
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): MatrixChainStep[] => {
    const nextSteps = buildMatrixChainSteps();
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will fill the DP table by chain length and remember the cheapest split for every subchain.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: MatrixChainStep[]) => {
    if (!sourceSteps[nextIndex]) return;
    setCurrentStepIndex(nextIndex);
    setMessage(sourceSteps[nextIndex].message);
  };

  const handleStep = () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    showStep(Math.min(currentStepIndex + 1, sourceSteps.length - 1), sourceSteps);
  };

  const handleRun = async () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();

    setIsRunning(true);
    try {
      for (let index = currentStepIndex + 1; index < sourceSteps.length; index++) {
        showStep(index, sourceSteps);
        await sleep(700);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. The trick is that the same matrices can be parenthesized in different ways, and some orders are much cheaper than others.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Matrix Chain Multiplication
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Multiplying matrices in a different order can change the amount of
          work dramatically, even though the final product is mathematically the
          same.
        </p>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleStep}
            disabled={isRunning}
            className='rounded bg-amber-500 px-3 py-2 text-sm font-medium text-white'
          >
            Step
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className='rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white'
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className='rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white'
          >
            Reset
          </button>
        </div>

        <div className='mb-3 rounded bg-slate-100 p-3 text-sm text-slate-800'>
          {message}
        </div>

        <div className='space-y-1 text-sm text-slate-700'>
          <div>Matrices: A(30x35), B(35x15), C(15x5), D(5x10), E(10x20)</div>
          <div>Prepared steps: {steps.length}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n^3) time and O(n^2) space for the DP table.
        </div>
      </div>
    </div>
  );
};

export default MatrixChainMultiplicationCircus;
