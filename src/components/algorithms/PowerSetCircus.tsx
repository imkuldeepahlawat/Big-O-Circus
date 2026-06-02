import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface PowerSetStep {
  mask: number;
  subset: string[];
  message: string;
}

const normalizeItems = (input: string): string[] => {
  const items = input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  return items.length > 0 ? items : ['A', 'B', 'C'];
};

const buildPowerSetSteps = (items: string[]): PowerSetStep[] => {
  const total = 1 << items.length;
  const steps: PowerSetStep[] = [];

  for (let mask = 0; mask < total; mask++) {
    const subset = items.filter((_, index) => (mask & (1 << index)) !== 0);
    steps.push({
      mask,
      subset,
      message:
        subset.length === 0
          ? 'Mask 000 means every item is out, so the subset is empty.'
          : `Mask ${mask.toString(2).padStart(items.length, '0')} keeps ${subset.join(', ')} inside the subset.`,
    });
  }

  return steps;
};

const PowerSetCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [itemsInput, setItemsInput] = useState('A,B,C,D');
  const [steps, setSteps] = useState<PowerSetStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'A power set is the collection of every possible in-or-out choice for the items.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 14);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [itemsInput, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const items = normalizeItems(itemsInput);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const activeMask = currentStep?.mask ?? 0;

    const group = new THREE.Group();
    const itemSpacing = 1.6;
    const itemOffsetX = -((items.length - 1) * itemSpacing) / 2;

    items.forEach((item, index) => {
      const isIncluded = (activeMask & (1 << index)) !== 0;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 1.05, 1.05),
        new THREE.MeshStandardMaterial({
          color: isIncluded ? 0x16a34a : 0x475569,
        })
      );
      cube.position.set(itemOffsetX + index * itemSpacing, 2, 0);
      group.add(cube);

      group.add(
        createTextPlane(item, {
          x: itemOffsetX + index * itemSpacing,
          y: 2,
          z: 0.56,
          planeWidth: 0.42,
          planeHeight: 0.28,
          fontSize: 30,
        })
      );
      group.add(
        createTextPlane(isIncluded ? 'in' : 'out', {
          x: itemOffsetX + index * itemSpacing,
          y: 0.95,
          z: 0.05,
          planeWidth: 0.55,
          planeHeight: 0.22,
          fontSize: 20,
          color: isIncluded ? '#86efac' : '#cbd5e1',
        })
      );
    });

    const maskText = currentStep
      ? currentStep.mask.toString(2).padStart(items.length, '0')
      : '0'.repeat(items.length);
    group.add(
      createTextPlane(`mask ${maskText}`, {
        x: 0,
        y: 4.3,
        z: 0.1,
        planeWidth: 2.6,
        planeHeight: 0.4,
        fontSize: 32,
      })
    );
    group.add(
      createTextPlane(
        `subset ${currentStep ? (currentStep.subset.length > 0 ? `{ ${currentStep.subset.join(', ')} }` : '{}') : '{}'}`,
        {
          x: 0,
          y: 3.45,
          z: 0.1,
          planeWidth: 4.5,
          planeHeight: 0.42,
          fontSize: 28,
          color: '#fef08a',
        }
      )
    );

    const cardsPerRow = 4;
    const cardSpacingX = 2.15;
    const cardSpacingY = 1.05;
    const cardOffsetX = -((Math.min(cardsPerRow, steps.length || 1) - 1) * cardSpacingX) / 2;

    steps.forEach((step, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const subsetLabel =
        step.subset.length > 0 ? `{ ${step.subset.join(', ')} }` : '{}';
      const color =
        index === currentStepIndex
          ? 0xf59e0b
          : index < currentStepIndex
            ? 0x2563eb
            : 0x1e293b;

      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.65, 0.18),
        new THREE.MeshStandardMaterial({ color })
      );
      card.position.set(
        cardOffsetX + col * cardSpacingX,
        -0.3 - row * cardSpacingY,
        0
      );
      group.add(card);

      group.add(
        createTextPlane(subsetLabel, {
          x: cardOffsetX + col * cardSpacingX,
          y: -0.3 - row * cardSpacingY,
          z: 0.12,
          planeWidth: 1.6,
          planeHeight: 0.24,
          fontSize: 20,
        })
      );
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): PowerSetStep[] => {
    const items = normalizeItems(itemsInput);
    const nextSteps = buildPowerSetSteps(items);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. Every mask is just a yes-or-no vote for each item.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: PowerSetStep[]) => {
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
        await sleep(800);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSample = () => {
    setItemsInput('tea,book,pen');
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Sample loaded. A subset is just one possible pick-or-skip story.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Reset. The power set is every possible combination of yes and no.');
  };

  const items = normalizeItems(itemsInput);

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>Power Set</h2>
        <p className='mb-3 text-sm text-slate-700'>
          Each item gets only two choices: in or out. The power set is the list
          of every story those choices can tell.
        </p>

        <input
          type='text'
          value={itemsInput}
          onChange={(event) => setItemsInput(event.target.value)}
          className='mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm'
          placeholder='Comma separated items'
        />

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleSample}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Sample
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
          <div>Items: {items.join(', ')}</div>
          <div>Total subsets: {1 << items.length}</div>
          <div>
            Progress: {Math.max(currentStepIndex + 1, 0)} / {steps.length || 1}
          </div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n * 2^n) to list every subset.
        </div>
      </div>
    </div>
  );
};

export default PowerSetCircus;
