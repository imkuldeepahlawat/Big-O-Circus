import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface EuclideanStep {
  a: number;
  b: number;
  quotient: number;
  remainder: number;
  message: string;
}

const computeEuclideanSteps = (a: number, b: number): EuclideanStep[] => {
  const steps: EuclideanStep[] = [];
  let currentA = Math.max(0, a);
  let currentB = Math.max(0, b);

  if (currentA === 0 && currentB === 0) return steps;
  if (currentB === 0) {
    steps.push({
      a: currentA,
      b: currentB,
      quotient: 0,
      remainder: 0,
      message: `The second number is already 0, so the gcd is ${currentA}.`,
    });
    return steps;
  }

  while (currentB !== 0) {
    const quotient = Math.floor(currentA / currentB);
    const remainder = currentA % currentB;
    steps.push({
      a: currentA,
      b: currentB,
      quotient,
      remainder,
      message: `${currentA} = ${currentB} x ${quotient} + ${remainder}. Keep the divisor and the remainder.`,
    });
    currentA = currentB;
    currentB = remainder;
  }

  steps.push({
    a: currentA,
    b: 0,
    quotient: 0,
    remainder: 0,
    message: `Nothing is left over now, so the gcd is ${currentA}.`,
  });

  return steps;
};

const getPositiveInteger = (value: string): number | null => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

const EuclideanAlgorithmCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [firstInput, setFirstInput] = useState('84');
  const [secondInput, setSecondInput] = useState('30');
  const [steps, setSteps] = useState<EuclideanStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Think of gcd as the biggest block size that can tile both numbers with no leftovers.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 11);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [firstInput, secondInput, steps, currentStepIndex]);

  const updateVisualization = (): void => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const firstValue = currentStep?.a ?? getPositiveInteger(firstInput) ?? 0;
    const secondValue = currentStep?.b ?? getPositiveInteger(secondInput) ?? 0;
    const remainderValue = currentStep?.remainder ?? 0;
    const maxValue = Math.max(firstValue, secondValue, remainderValue, 1);

    const group = new THREE.Group();

    const addColumn = (
      x: number,
      value: number,
      color: number,
      label: string,
      subtitle: string
    ) => {
      const height = 0.6 + (value / maxValue) * 4.2;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, height, 1.2),
        new THREE.MeshStandardMaterial({ color })
      );
      box.position.set(x, height / 2, 0);
      group.add(box);

      group.add(
        createTextPlane(`${label}: ${value}`, {
          x,
          y: height + 0.65,
          z: 0.05,
          planeWidth: 1.7,
          planeHeight: 0.42,
          fontSize: 30,
        })
      );
      group.add(
        createTextPlane(subtitle, {
          x,
          y: -0.5,
          z: 0.05,
          planeWidth: 1.9,
          planeHeight: 0.32,
          fontSize: 20,
          color: '#cbd5e1',
        })
      );
    };

    addColumn(-3, firstValue, 0x2563eb, 'A', 'current dividend');
    addColumn(0, secondValue, 0x16a34a, 'B', 'current divisor');

    if (currentStep && currentStep.b !== 0) {
      addColumn(3, remainderValue, 0xf59e0b, 'R', 'what is left over');
      group.add(
        createTextPlane(
          `${currentStep.a} = ${currentStep.b} x ${currentStep.quotient} + ${currentStep.remainder}`,
          {
            x: 0,
            y: 5.7,
            z: 0.1,
            planeWidth: 6.6,
            planeHeight: 0.5,
            fontSize: 30,
            color: '#f8fafc',
          }
        )
      );
    } else {
      group.add(
        createTextPlane(`gcd(${firstValue}, ${secondValue})`, {
          x: 0,
          y: 5.7,
          z: 0.1,
          planeWidth: 4.5,
          planeHeight: 0.5,
          fontSize: 34,
        })
      );
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): EuclideanStep[] => {
    const firstValue = getPositiveInteger(firstInput);
    const secondValue = getPositiveInteger(secondInput);

    if (firstValue === null || secondValue === null) {
      setMessage('Use non-negative whole numbers so the remainder story stays clean.');
      setSteps([]);
      setCurrentStepIndex(-1);
      return [];
    }

    if (firstValue === 0 && secondValue === 0) {
      setMessage('At least one number needs to be non-zero, or there is no useful gcd story to tell.');
      setSteps([]);
      setCurrentStepIndex(-1);
      return [];
    }

    const nextSteps = computeEuclideanSteps(firstValue, secondValue);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage('Ready. We will keep replacing the bigger problem with a smaller remainder problem.');
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: EuclideanStep[]) => {
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
        await sleep(1100);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandomPair = () => {
    const firstValue = Math.floor(Math.random() * 72) + 24;
    const secondValue = Math.floor(Math.random() * 36) + 6;
    setFirstInput(firstValue.toString());
    setSecondInput(secondValue.toString());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh pair loaded. Watch how the remainder keeps squeezing the problem down.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. The trick is simple: the greatest common part survives every remainder step.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Euclidean Algorithm
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Think of it like trimming the bigger pile with leftovers. Whatever
          common block fits both numbers keeps surviving every trim.
        </p>

        <div className='mb-3 grid grid-cols-2 gap-2'>
          <input
            type='number'
            value={firstInput}
            onChange={(event) => setFirstInput(event.target.value)}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='First number'
          />
          <input
            type='number'
            value={secondInput}
            onChange={(event) => setSecondInput(event.target.value)}
            className='rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Second number'
          />
        </div>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandomPair}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Pair
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

        <div className='max-h-40 space-y-2 overflow-auto text-sm text-slate-700'>
          {steps.length === 0 ? (
            <p>No steps prepared yet.</p>
          ) : (
            steps.map((step, index) => (
              <div
                key={`${step.a}-${step.b}-${index}`}
                className={`rounded px-2 py-1 ${
                  index === currentStepIndex
                    ? 'bg-amber-100 text-slate-900'
                    : 'bg-white'
                }`}
              >
                {step.message}
              </div>
            ))
          )}
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: usually O(log(min(a, b))) remainder steps.
        </div>
      </div>
    </div>
  );
};

export default EuclideanAlgorithmCircus;
