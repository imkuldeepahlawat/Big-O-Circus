import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface ExponentiationStep {
  result: number;
  base: number;
  exponent: number;
  message: string;
  active: 'result' | 'base' | 'exponent' | 'done';
}

const buildExponentiationSteps = (
  base: number,
  exponent: number
): ExponentiationStep[] => {
  const steps: ExponentiationStep[] = [];
  let currentBase = base;
  let currentExponent = exponent;
  let result = 1;

  steps.push({
    result,
    base: currentBase,
    exponent: currentExponent,
    message: 'Start with result = 1. The base and exponent hold the remaining work.',
    active: 'result',
  });

  while (currentExponent > 0) {
    if (currentExponent % 2 === 1) {
      result *= currentBase;
      steps.push({
        result,
        base: currentBase,
        exponent: currentExponent,
        message: `The exponent is odd, so we keep one copy of the current base in the result.`,
        active: 'result',
      });
    } else {
      steps.push({
        result,
        base: currentBase,
        exponent: currentExponent,
        message: 'The exponent is even, so the result can wait this round.',
        active: 'exponent',
      });
    }

    currentBase *= currentBase;
    currentExponent = Math.floor(currentExponent / 2);
    steps.push({
      result,
      base: currentBase,
      exponent: currentExponent,
      message: 'Square the base and halve the exponent. That keeps the same total power with less work left.',
      active: 'base',
    });
  }

  steps.push({
    result,
    base: currentBase,
    exponent: 0,
    message: `Finished. The answer is ${result}.`,
    active: 'done',
  });

  return steps;
};

const safeInteger = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const scaleHeight = (value: number): number => {
  if (value <= 0) return 0.6;
  return Math.min(4.8, 0.8 + Math.log2(value + 1) * 0.8);
};

const ExponentiationBySquaringCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [baseInput, setBaseInput] = useState('3');
  const [exponentInput, setExponentInput] = useState('11');
  const [steps, setSteps] = useState<ExponentiationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Instead of multiplying by the base again and again, keep squaring bigger chunks and only keep the ones the exponent still needs.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 12);
      viewerRef.current.camera.lookAt(0, 1.8, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [baseInput, exponentInput, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const base = currentStep?.base ?? Math.max(1, safeInteger(baseInput, 1));
    const exponent = currentStep?.exponent ?? Math.max(0, safeInteger(exponentInput, 0));
    const result = currentStep?.result ?? 1;

    const group = new THREE.Group();

    const columns = [
      {
        x: -3,
        value: result,
        color:
          currentStep?.active === 'result' ? 0xf59e0b : 0x16a34a,
        label: 'result',
      },
      {
        x: 0,
        value: base,
        color: currentStep?.active === 'base' ? 0xf59e0b : 0x2563eb,
        label: 'base',
      },
      {
        x: 3,
        value: exponent,
        color:
          currentStep?.active === 'exponent' || currentStep?.active === 'done'
            ? 0xf59e0b
            : 0x7c3aed,
        label: 'exponent',
      },
    ];

    columns.forEach((column) => {
      const height = scaleHeight(column.value);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, height, 1.25),
        new THREE.MeshStandardMaterial({ color: column.color })
      );
      box.position.set(column.x, height / 2, 0);
      group.add(box);

      group.add(
        createTextPlane(`${column.label}`, {
          x: column.x,
          y: height + 0.55,
          z: 0.05,
          planeWidth: 1.25,
          planeHeight: 0.26,
          fontSize: 24,
        })
      );
      group.add(
        createTextPlane(column.value.toString(), {
          x: column.x,
          y: height + 1.05,
          z: 0.05,
          planeWidth: 1.4,
          planeHeight: 0.34,
          fontSize: 28,
        })
      );
    });

    group.add(
      createTextPlane(
        `${Math.max(1, safeInteger(baseInput, 1))} ^ ${Math.max(0, safeInteger(exponentInput, 0))}`,
        {
          x: 0,
          y: 5.7,
          z: 0.1,
          planeWidth: 2.8,
          planeHeight: 0.42,
          fontSize: 34,
        }
      )
    );
    group.add(
      createTextPlane(`binary exponent ${exponent.toString(2)}`, {
        x: 0,
        y: -0.9,
        z: 0.05,
        planeWidth: 3.3,
        planeHeight: 0.32,
        fontSize: 24,
        color: '#fef08a',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): ExponentiationStep[] => {
    const base = Math.max(1, Math.min(safeInteger(baseInput, 1), 12));
    const exponent = Math.max(0, Math.min(safeInteger(exponentInput, 0), 12));
    const nextSteps = buildExponentiationSteps(base, exponent);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will keep folding the exponent in half while preserving the same total power.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: ExponentiationStep[]) => {
    if (!sourceSteps[nextIndex]) return;
    setCurrentStepIndex(nextIndex);
    setMessage(sourceSteps[nextIndex].message);
  };

  const handleStep = () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    const nextIndex = Math.min(currentStepIndex + 1, sourceSteps.length - 1);
    showStep(nextIndex, sourceSteps);
  };

  const handleRun = async () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();

    setIsRunning(true);
    try {
      for (let index = currentStepIndex + 1; index < sourceSteps.length; index++) {
        showStep(index, sourceSteps);
        await sleep(1000);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandom = () => {
    setBaseInput((Math.floor(Math.random() * 7) + 2).toString());
    setExponentInput((Math.floor(Math.random() * 7) + 5).toString());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh example loaded. Watch how the exponent keeps shrinking by halves.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Fast powering works by reusing squares instead of recomputing small multiplications.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Exponentiation by Squaring
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Think of building a huge power from reusable chunks. Squaring creates
          bigger chunks fast, and odd exponents tell you which chunks to keep.
        </p>

        <div className='mb-3 grid grid-cols-2 gap-2'>
          <input
            type='number'
            min='1'
            value={baseInput}
            onChange={(event) => setBaseInput(event.target.value)}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Base'
          />
          <input
            type='number'
            min='0'
            value={exponentInput}
            onChange={(event) => setExponentInput(event.target.value)}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Exponent'
          />
        </div>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Example
          </button>
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
          <div>
            Expression: {Math.max(1, safeInteger(baseInput, 1))} ^
            {Math.max(0, safeInteger(exponentInput, 0))}
          </div>
          <div>Prepared steps: {steps.length}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(log exponent) multiplications.
        </div>
      </div>
    </div>
  );
};

export default ExponentiationBySquaringCircus;
