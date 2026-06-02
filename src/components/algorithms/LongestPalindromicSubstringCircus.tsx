import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface PalindromeStep {
  left: number;
  right: number;
  centerLabel: string;
  match: boolean;
  bestStart: number;
  bestEnd: number;
  focusStart: number;
  focusEnd: number;
  message: string;
}

const normalizeInput = (value: string): string => {
  const trimmed = value.slice(0, 14).toUpperCase();
  return trimmed.length > 0 ? trimmed : 'BANANA';
};

const buildPalindromeSteps = (text: string): PalindromeStep[] => {
  const steps: PalindromeStep[] = [];
  if (text.length === 0) return steps;

  let bestStart = 0;
  let bestEnd = 0;

  for (let center = 0; center < text.length * 2 - 1; center++) {
    let left = Math.floor(center / 2);
    let right = left + (center % 2);
    const centerLabel = center % 2 === 0 ? `index ${left}` : `between ${left} and ${right}`;

    while (left >= 0 && right < text.length) {
      const match = text[left] === text[right];
      const focusStart = left;
      const focusEnd = right;

      if (match) {
        if (right - left > bestEnd - bestStart) {
          bestStart = left;
          bestEnd = right;
        }
        steps.push({
          left,
          right,
          centerLabel,
          match: true,
          bestStart,
          bestEnd,
          focusStart,
          focusEnd,
          message: `"${text.slice(left, right + 1)}" mirrors around ${centerLabel}, so we expand outward.`,
        });
        left--;
        right++;
      } else {
        steps.push({
          left,
          right,
          centerLabel,
          match: false,
          bestStart,
          bestEnd,
          focusStart,
          focusEnd,
          message: `${text[left]} and ${text[right]} break the mirror, so this center stops growing.`,
        });
        break;
      }
    }
  }

  steps.push({
    left: bestStart,
    right: bestEnd,
    centerLabel: 'best answer',
    match: true,
    bestStart,
    bestEnd,
    focusStart: bestStart,
    focusEnd: bestEnd,
    message: `Finished. The longest palindromic substring is "${text.slice(bestStart, bestEnd + 1)}".`,
  });

  return steps;
};

const LongestPalindromicSubstringCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [textInput, setTextInput] = useState('BANANA');
  const [steps, setSteps] = useState<PalindromeStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'A palindrome is a mirror word or phrase. We test each possible center and expand while the letters still reflect each other.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2.8, 14);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [textInput, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const text = normalizeInput(textInput);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const bestStart = currentStep?.bestStart ?? 0;
    const bestEnd = currentStep?.bestEnd ?? 0;
    const focusStart = currentStep?.focusStart ?? 0;
    const focusEnd = currentStep?.focusEnd ?? 0;

    const group = new THREE.Group();
    const spacing = 0.95;
    const offsetX = -((text.length - 1) * spacing) / 2;

    for (let index = 0; index < text.length; index++) {
      const inBest = index >= bestStart && index <= bestEnd;
      const inFocus = currentStep && index >= focusStart && index <= focusEnd;
      const isEdge = currentStep && (index === currentStep.left || index === currentStep.right);
      const color = isEdge
        ? currentStep.match
          ? 0xf59e0b
          : 0xef4444
        : inBest
          ? 0x16a34a
          : inFocus
            ? 0x2563eb
            : 0x334155;

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.78, 0.78),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(offsetX + index * spacing, 1.5, 0);
      group.add(cube);

      group.add(
        createTextPlane(text[index], {
          x: offsetX + index * spacing,
          y: 1.5,
          z: 0.42,
          planeWidth: 0.34,
          planeHeight: 0.24,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(index.toString(), {
          x: offsetX + index * spacing,
          y: 0.45,
          z: 0.05,
          planeWidth: 0.24,
          planeHeight: 0.16,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
    }

    group.add(
      createTextPlane(
        `best "${text.slice(bestStart, bestEnd + 1)}"`,
        {
          x: 0,
          y: 3.7,
          z: 0.05,
          planeWidth: 2.8,
          planeHeight: 0.3,
          fontSize: 24,
          color: '#86efac',
        }
      )
    );
    if (currentStep) {
      group.add(
        createTextPlane(`center ${currentStep.centerLabel}`, {
          x: 0,
          y: -0.4,
          z: 0.05,
          planeWidth: 2.6,
          planeHeight: 0.26,
          fontSize: 22,
          color: '#fef08a',
        })
      );
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): PalindromeStep[] => {
    const text = normalizeInput(textInput);
    const nextSteps = buildPalindromeSteps(text);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will test each center and expand only while the left and right characters stay mirrored.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: PalindromeStep[]) => {
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
        await sleep(750);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSample = () => {
    setTextInput('LEVELUPRACECAR');
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Sample loaded. Now we can watch a longer mirror hide inside the text.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. A palindrome grows from the middle as long as the outer letters keep agreeing.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Longest Palindromic Substring
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          A palindrome reads the same forward and backward. We grow one around
          every possible center and remember the biggest mirror we find.
        </p>

        <input
          type='text'
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          className='mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm'
          placeholder='Enter text'
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
          <div>Text: {normalizeInput(textInput)}</div>
          <div>Centers to check: {normalizeInput(textInput).length * 2 - 1}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n^2) time with center expansion and O(1) extra space.
        </div>
      </div>
    </div>
  );
};

export default LongestPalindromicSubstringCircus;
