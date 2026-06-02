import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

type MissingNumberMethod = 'sum' | 'xor';

interface MissingNumberData {
  numbers: number[];
  maxNumber: number;
  missingNumber: number;
}

interface MissingNumberStep {
  index: number;
  currentValue: number | null;
  expectedAccumulator: number;
  actualAccumulator: number;
  answer: number | null;
  message: string;
}

const shuffle = (values: number[]): number[] => {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const createSampleData = (): MissingNumberData => {
  const maxNumber = 8;
  const missingNumber = Math.floor(Math.random() * (maxNumber + 1));
  const numbers = shuffle(
    Array.from({ length: maxNumber + 1 }, (_, index) => index).filter(
      (value) => value !== missingNumber
    )
  );

  return { numbers, maxNumber, missingNumber };
};

const buildSumSteps = (data: MissingNumberData): MissingNumberStep[] => {
  const expectedAccumulator = (data.maxNumber * (data.maxNumber + 1)) / 2;
  const steps: MissingNumberStep[] = [
    {
      index: -1,
      currentValue: null,
      expectedAccumulator,
      actualAccumulator: 0,
      answer: null,
      message: `If every number from 0 to ${data.maxNumber} were present, the total would be ${expectedAccumulator}.`,
    },
  ];

  let actualAccumulator = 0;
  data.numbers.forEach((value, index) => {
    actualAccumulator += value;
    steps.push({
      index,
      currentValue: value,
      expectedAccumulator,
      actualAccumulator,
      answer: null,
      message: `Add ${value} to the running total we actually saw.`,
    });
  });

  steps.push({
    index: data.numbers.length,
    currentValue: null,
    expectedAccumulator,
    actualAccumulator,
    answer: expectedAccumulator - actualAccumulator,
    message: `The missing number is the difference: ${expectedAccumulator} - ${actualAccumulator}.`,
  });

  return steps;
};

const buildXorSteps = (data: MissingNumberData): MissingNumberStep[] => {
  const steps: MissingNumberStep[] = [
    {
      index: -1,
      currentValue: null,
      expectedAccumulator: 0,
      actualAccumulator: 0,
      answer: null,
      message: 'With XOR, matching numbers cancel each other out. Only the missing one survives at the end.',
    },
  ];

  let expectedAccumulator = 0;
  for (let value = 0; value <= data.maxNumber; value++) {
    expectedAccumulator ^= value;
    steps.push({
      index: value,
      currentValue: value,
      expectedAccumulator,
      actualAccumulator: 0,
      answer: null,
      message: `Fold ${value} into the full-range XOR accumulator.`,
    });
  }

  let actualAccumulator = 0;
  data.numbers.forEach((value, index) => {
    actualAccumulator ^= value;
    steps.push({
      index,
      currentValue: value,
      expectedAccumulator,
      actualAccumulator,
      answer: null,
      message: `Now cancel the numbers we really saw by XOR-ing in ${value}.`,
    });
  });

  steps.push({
    index: data.numbers.length,
    currentValue: null,
    expectedAccumulator,
    actualAccumulator,
    answer: expectedAccumulator ^ actualAccumulator,
    message: `Everything paired off except the missing number: ${expectedAccumulator} XOR ${actualAccumulator}.`,
  });

  return steps;
};

const MissingNumberCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [data, setData] = useState<MissingNumberData>(createSampleData());
  const [method, setMethod] = useState<MissingNumberMethod>('sum');
  const [steps, setSteps] = useState<MissingNumberStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'You know what numbers should exist, so the missing number is whatever the full story has that the seen story does not.'
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
  }, [data, method, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const group = new THREE.Group();
    const spacing = 1.1;
    const offsetX = -((data.numbers.length - 1) * spacing) / 2;

    data.numbers.forEach((value, index) => {
      const active = currentStep?.currentValue === value && currentStep.index === index;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.82, 0.82),
        new THREE.MeshStandardMaterial({
          color: active ? 0xf59e0b : 0x2563eb,
        })
      );
      cube.position.set(offsetX + index * spacing, 1.8, 0);
      group.add(cube);

      group.add(
        createTextPlane(value.toString(), {
          x: offsetX + index * spacing,
          y: 1.8,
          z: 0.42,
          planeWidth: 0.36,
          planeHeight: 0.24,
          fontSize: 26,
        })
      );
    });

    const expectedHeight =
      0.8 + ((currentStep?.expectedAccumulator ?? 0) / Math.max(1, data.maxNumber * (data.maxNumber + 1))) * 4;
    const actualHeight =
      0.8 + ((currentStep?.actualAccumulator ?? 0) / Math.max(1, data.maxNumber * (data.maxNumber + 1))) * 4;

    const expectedBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, expectedHeight, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x16a34a })
    );
    expectedBar.position.set(-3, expectedHeight / 2 - 1.3, 0);
    group.add(expectedBar);

    const actualBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, actualHeight, 1.25),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed })
    );
    actualBar.position.set(3, actualHeight / 2 - 1.3, 0);
    group.add(actualBar);

    group.add(
      createTextPlane(`expected ${currentStep?.expectedAccumulator ?? 0}`, {
        x: -3,
        y: 4.1,
        z: 0.05,
        planeWidth: 1.9,
        planeHeight: 0.26,
        fontSize: 20,
      })
    );
    group.add(
      createTextPlane(`seen ${currentStep?.actualAccumulator ?? 0}`, {
        x: 3,
        y: 4.1,
        z: 0.05,
        planeWidth: 1.6,
        planeHeight: 0.26,
        fontSize: 20,
      })
    );
    group.add(
      createTextPlane(
        currentStep?.answer !== null ? `missing ${currentStep.answer}` : `method ${method}`,
        {
          x: 0,
          y: -2.7,
          z: 0.05,
          planeWidth: 2.2,
          planeHeight: 0.28,
          fontSize: 22,
          color: '#fef08a',
        }
      )
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): MissingNumberStep[] => {
    const nextSteps = method === 'sum' ? buildSumSteps(data) : buildXorSteps(data);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      method === 'sum'
        ? 'Ready. We will compare the total we should have with the total we actually saw.'
        : 'Ready. We will let XOR cancel matching numbers until the missing one is left alone.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: MissingNumberStep[]) => {
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

  const handleRandom = () => {
    setData(createSampleData());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh sample loaded. One number is missing from the full range, and we will recover it from the bookkeeping.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. The missing number is the gap between what the full range should contribute and what the array really contributes.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Find the Missing Number
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          We know what the full list from 0 to n should look like, so the
          missing number is whatever the complete story has that the seen story
          does not.
        </p>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Sample
          </button>
          <select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value as MissingNumberMethod);
              setSteps([]);
              setCurrentStepIndex(-1);
            }}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
          >
            <option value='sum'>Sum</option>
            <option value='xor'>XOR</option>
          </select>
        </div>

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
          <div>Array: [{data.numbers.join(', ')}]</div>
          <div>Expected range: 0..{data.maxNumber}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n) time and O(1) extra space for both the sum and XOR approaches.
        </div>
      </div>
    </div>
  );
};

export default MissingNumberCircus;
