import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

type CountingMethod = 'scan' | 'kernighan';

interface BitCountingStep {
  displayValue: number;
  activeBit: number | null;
  count: number;
  width: number;
  message: string;
}

const getBitWidth = (value: number): number =>
  Math.min(16, Math.max(4, value.toString(2).length));

const buildScanSteps = (value: number): BitCountingStep[] => {
  const width = getBitWidth(value);
  let count = 0;
  const steps: BitCountingStep[] = [
    {
      displayValue: value,
      activeBit: null,
      count,
      width,
      message: 'Start at one end of the binary string and inspect each switch one by one.',
    },
  ];

  for (let bit = width - 1; bit >= 0; bit--) {
    const bitValue = (value >> bit) & 1;
    if (bitValue === 1) count++;
    steps.push({
      displayValue: value,
      activeBit: bit,
      count,
      width,
      message:
        bitValue === 1
          ? `Bit ${bit} is on, so the count grows to ${count}.`
          : `Bit ${bit} is off, so the count stays ${count}.`,
    });
  }

  steps.push({
    displayValue: value,
    activeBit: null,
    count,
    width,
    message: `Finished. The number has ${count} one-bits.`,
  });

  return steps;
};

const buildKernighanSteps = (value: number): BitCountingStep[] => {
  const width = getBitWidth(value);
  let workingValue = value;
  let count = 0;
  const steps: BitCountingStep[] = [
    {
      displayValue: workingValue,
      activeBit: null,
      count,
      width,
      message:
        'Brian Kernighan\'s trick keeps removing the lowest 1-bit, so each step pays only for a real 1.',
    },
  ];

  if (workingValue === 0) {
    steps.push({
      displayValue: 0,
      activeBit: null,
      count: 0,
      width,
      message: 'Zero has no lit switches, so the answer is 0.',
    });
    return steps;
  }

  while (workingValue > 0) {
    const lowestOne = Math.floor(Math.log2(workingValue & -workingValue));
    workingValue &= workingValue - 1;
    count++;
    steps.push({
      displayValue: workingValue,
      activeBit: lowestOne,
      count,
      width,
      message: `Remove the lowest 1-bit at position ${lowestOne}. Count is now ${count}.`,
    });
  }

  steps.push({
    displayValue: 0,
    activeBit: null,
    count,
    width,
    message: `Finished. We removed ${count} one-bits, so the answer is ${count}.`,
  });

  return steps;
};

const BitCountingCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [inputValue, setInputValue] = useState('173');
  const [method, setMethod] = useState<CountingMethod>('scan');
  const [steps, setSteps] = useState<BitCountingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Bit counting is just asking how many light switches are on in a binary row.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2.5, 12);
      viewerRef.current.camera.lookAt(0, 1, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [inputValue, method, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const parsedValue = Number.parseInt(inputValue, 10);
    const safeValue = Number.isNaN(parsedValue) ? 0 : Math.max(0, Math.min(parsedValue, 65535));
    const displayValue = currentStep?.displayValue ?? safeValue;
    const width = currentStep?.width ?? getBitWidth(displayValue);
    const bitPositions = Array.from({ length: width }, (_, index) => width - 1 - index);

    const group = new THREE.Group();
    const spacing = 1.15;
    const offsetX = -((width - 1) * spacing) / 2;

    bitPositions.forEach((bitPosition, index) => {
      const bitValue = (displayValue >> bitPosition) & 1;
      const color =
        currentStep?.activeBit === bitPosition
          ? 0xf59e0b
          : bitValue === 1
            ? 0x2563eb
            : 0x334155;

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(offsetX + index * spacing, 1.2, 0);
      group.add(cube);

      group.add(
        createTextPlane(bitValue.toString(), {
          x: offsetX + index * spacing,
          y: 1.2,
          z: 0.48,
          planeWidth: 0.45,
          planeHeight: 0.3,
          fontSize: 34,
        })
      );
      group.add(
        createTextPlane(bitPosition.toString(), {
          x: offsetX + index * spacing,
          y: 0.2,
          z: 0.05,
          planeWidth: 0.36,
          planeHeight: 0.22,
          fontSize: 22,
          color: '#cbd5e1',
        })
      );
    });

    group.add(
      createTextPlane(`decimal ${displayValue}`, {
        x: 0,
        y: 3.1,
        z: 0.1,
        planeWidth: 2.3,
        planeHeight: 0.38,
        fontSize: 30,
      })
    );
    group.add(
      createTextPlane(`count ${currentStep?.count ?? 0}`, {
        x: 0,
        y: -1.1,
        z: 0.1,
        planeWidth: 1.9,
        planeHeight: 0.34,
        fontSize: 30,
        color: '#86efac',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): BitCountingStep[] => {
    const parsedValue = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setMessage('Use a non-negative whole number so the binary switches make sense.');
      setSteps([]);
      setCurrentStepIndex(-1);
      return [];
    }

    const safeValue = Math.min(parsedValue, 65535);
    const nextSteps =
      method === 'scan'
        ? buildScanSteps(safeValue)
        : buildKernighanSteps(safeValue);

    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      method === 'scan'
        ? 'Ready. We will inspect each bit one by one.'
        : 'Ready. We will repeatedly turn off the lowest lit bit.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: BitCountingStep[]) => {
    if (!sourceSteps[nextIndex]) return;
    setCurrentStepIndex(nextIndex);
    setMessage(sourceSteps[nextIndex].message);
  };

  const handleStep = () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;

    const nextIndex = Math.min(currentStepIndex + 1, sourceSteps.length - 1);
    showStep(nextIndex, sourceSteps);
  };

  const handleRun = async () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;

    setIsRunning(true);
    try {
      for (let index = currentStepIndex + 1; index < sourceSteps.length; index++) {
        showStep(index, sourceSteps);
        await sleep(900);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandom = () => {
    setInputValue((Math.floor(Math.random() * 255) + 1).toString());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh binary row loaded. Count how many switches are on.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Reset. A bit count is just the number of 1s in the binary picture.');
  };

  const activeStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>Bit Counting</h2>
        <p className='mb-3 text-sm text-slate-700'>
          Imagine a row of light switches. Bit counting is only asking how many
          are turned on.
        </p>

        <div className='mb-3 flex gap-2'>
          <input
            type='number'
            min='0'
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className='flex-1 rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Enter a number'
          />
          <select
            value={method}
            onChange={(event) => {
              setMethod(event.target.value as CountingMethod);
              setSteps([]);
              setCurrentStepIndex(-1);
            }}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
          >
            <option value='scan'>Scan</option>
            <option value='kernighan'>Kernighan</option>
          </select>
        </div>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Number
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
            Binary:{' '}
            <span className='font-mono'>
              {(Number.parseInt(inputValue, 10) || 0).toString(2)}
            </span>
          </div>
          <div>Method: {method === 'scan' ? 'bit-by-bit scan' : "Kernighan's trick"}</div>
          <div>Current count: {activeStep?.count ?? 0}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: scan is O(bit-width), Kernighan is O(number of 1-bits).
        </div>
      </div>
    </div>
  );
};

export default BitCountingCircus;
