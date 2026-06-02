import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface RabinKarpStep {
  start: number;
  window: string;
  windowHash: number;
  patternHash: number;
  isHashMatch: boolean;
  isExactMatch: boolean;
  message: string;
}

const HASH_BASE = 257;
const HASH_MOD = 101;

const sanitizeDisplayChar = (character: string): string =>
  character === ' ' ? '_' : character;

const normalizeText = (value: string, fallback: string, maxLength: number): string => {
  const trimmed = value.slice(0, maxLength);
  return trimmed.length > 0 ? trimmed.toUpperCase() : fallback;
};

const computeHash = (text: string): number => {
  let hash = 0;
  for (const character of text) {
    hash = (hash * HASH_BASE + character.charCodeAt(0)) % HASH_MOD;
  }
  return hash;
};

const buildRabinKarpSteps = (text: string, pattern: string): RabinKarpStep[] => {
  const steps: RabinKarpStep[] = [];
  const patternLength = pattern.length;
  const textLength = text.length;

  if (patternLength === 0 || patternLength > textLength) return steps;

  const patternHash = computeHash(pattern);
  let windowHash = computeHash(text.slice(0, patternLength));
  let highestBase = 1;

  for (let index = 0; index < patternLength - 1; index++) {
    highestBase = (highestBase * HASH_BASE) % HASH_MOD;
  }

  for (let start = 0; start <= textLength - patternLength; start++) {
    const window = text.slice(start, start + patternLength);
    const isHashMatch = windowHash === patternHash;
    const isExactMatch = isHashMatch && window === pattern;

    steps.push({
      start,
      window,
      windowHash,
      patternHash,
      isHashMatch,
      isExactMatch,
      message: isExactMatch
        ? `The fingerprint and the real letters both match at position ${start}.`
        : isHashMatch
          ? `The fingerprints match at position ${start}, so we double-check the real letters.`
          : `The fingerprints differ at position ${start}, so we skip a full comparison.`,
    });

    if (isExactMatch) break;
    if (start === textLength - patternLength) break;

    const outgoing = text.charCodeAt(start);
    const incoming = text.charCodeAt(start + patternLength);
    windowHash =
      (HASH_BASE * (windowHash - outgoing * highestBase) + incoming) % HASH_MOD;
    if (windowHash < 0) {
      windowHash += HASH_MOD;
    }
  }

  return steps;
};

const RabinKarpCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [textInput, setTextInput] = useState('BANANA BANDANA');
  const [patternInput, setPatternInput] = useState('BAND');
  const [steps, setSteps] = useState<RabinKarpStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Rabin-Karp gives each window a fingerprint first, so most windows can be rejected without reading every letter.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2.5, 15);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [textInput, patternInput, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const text = normalizeText(textInput, 'BANANA BANDANA', 18);
    const pattern = normalizeText(patternInput, 'BAND', 8);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const start = currentStep?.start ?? 0;
    const patternLength = pattern.length;
    const windowEnd = start + patternLength;

    const group = new THREE.Group();
    const spacing = 0.92;
    const offsetX = -((text.length - 1) * spacing) / 2;

    for (let index = 0; index < text.length; index++) {
      const inWindow = index >= start && index < windowEnd;
      const color =
        currentStep?.isExactMatch && inWindow
          ? 0x16a34a
          : currentStep?.isHashMatch && inWindow
            ? 0xf59e0b
            : inWindow
              ? 0x2563eb
              : 0x334155;

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.78, 0.78),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(offsetX + index * spacing, 1.1, 0);
      group.add(cube);

      group.add(
        createTextPlane(sanitizeDisplayChar(text[index]), {
          x: offsetX + index * spacing,
          y: 1.1,
          z: 0.42,
          planeWidth: 0.36,
          planeHeight: 0.24,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(index.toString(), {
          x: offsetX + index * spacing,
          y: 0.15,
          z: 0.05,
          planeWidth: 0.24,
          planeHeight: 0.18,
          fontSize: 18,
          color: '#cbd5e1',
        })
      );
    }

    for (let index = 0; index < pattern.length; index++) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.78, 0.78),
        new THREE.MeshStandardMaterial({
          color: currentStep?.isExactMatch
            ? 0x16a34a
            : currentStep?.isHashMatch
              ? 0xf59e0b
              : 0x7c3aed,
        })
      );
      cube.position.set(offsetX + (start + index) * spacing, 3.05, 0);
      group.add(cube);

      group.add(
        createTextPlane(sanitizeDisplayChar(pattern[index]), {
          x: offsetX + (start + index) * spacing,
          y: 3.05,
          z: 0.42,
          planeWidth: 0.36,
          planeHeight: 0.24,
          fontSize: 28,
        })
      );
    }

    group.add(
      createTextPlane(`pattern hash ${currentStep?.patternHash ?? computeHash(pattern)}`, {
        x: -3.4,
        y: 4.5,
        z: 0.05,
        planeWidth: 2.5,
        planeHeight: 0.32,
        fontSize: 22,
      })
    );
    group.add(
      createTextPlane(`window hash ${currentStep?.windowHash ?? computeHash(text.slice(0, pattern.length))}`, {
        x: 3.4,
        y: 4.5,
        z: 0.05,
        planeWidth: 2.5,
        planeHeight: 0.32,
        fontSize: 22,
      })
    );
    group.add(
      createTextPlane(`window "${currentStep?.window ?? text.slice(0, pattern.length)}"`, {
        x: 0,
        y: -0.8,
        z: 0.05,
        planeWidth: 3.5,
        planeHeight: 0.28,
        fontSize: 22,
        color: '#fef08a',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): RabinKarpStep[] => {
    const text = normalizeText(textInput, 'BANANA BANDANA', 18);
    const pattern = normalizeText(patternInput, 'BAND', 8);

    if (pattern.length > text.length) {
      setMessage('Keep the pattern shorter than the text so the window has somewhere to slide.');
      setSteps([]);
      setCurrentStepIndex(-1);
      return [];
    }

    const nextSteps = buildRabinKarpSteps(text, pattern);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. The window will slide, and fingerprints will let us skip most full comparisons.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: RabinKarpStep[]) => {
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
        await sleep(1000);
      }

      if (!sourceSteps.some((step) => step.isExactMatch)) {
        setMessage('We slid across the full text and never found an exact match.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSample = () => {
    setTextInput('ABRACADABRA');
    setPatternInput('CAD');
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Sample loaded. Watch how the fingerprints reject most windows quickly.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Rabin-Karp is a fast maybe-first, letters-second way to compare windows.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Rabin-Karp Algorithm
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Think of each substring window as getting a fingerprint. Most windows
          can be dismissed by the fingerprint alone.
        </p>

        <input
          type='text'
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          className='mb-2 w-full rounded border border-slate-300 px-3 py-2 text-sm'
          placeholder='Text'
        />
        <input
          type='text'
          value={patternInput}
          onChange={(event) => setPatternInput(event.target.value)}
          className='mb-3 w-full rounded border border-slate-300 px-3 py-2 text-sm'
          placeholder='Pattern'
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
          <div>Text length: {normalizeText(textInput, 'BANANA BANDANA', 18).length}</div>
          <div>Pattern length: {normalizeText(patternInput, 'BAND', 8).length}</div>
          <div>Hash base: {HASH_BASE}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: average O(n + m), with a worst case closer to O(n * m) if fingerprints collide badly.
        </div>
      </div>
    </div>
  );
};

export default RabinKarpCircus;
