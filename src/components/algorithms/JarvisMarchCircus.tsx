import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface Point {
  x: number;
  y: number;
}

interface JarvisStep {
  hullIndices: number[];
  currentIndex: number;
  candidateIndex: number;
  testIndex: number | null;
  message: string;
}

const randomPoints = (count = 10): Point[] =>
  Array.from({ length: count }, () => ({
    x: Number(((Math.random() - 0.5) * 9).toFixed(2)),
    y: Number(((Math.random() - 0.5) * 9).toFixed(2)),
  }));

const cross = (origin: Point, a: Point, b: Point): number =>
  (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);

const distanceSquared = (a: Point, b: Point): number =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

const leftmostPointIndex = (points: Point[]): number =>
  points.reduce((bestIndex, point, index) => {
    const bestPoint = points[bestIndex];
    if (point.x < bestPoint.x) return index;
    if (point.x === bestPoint.x && point.y < bestPoint.y) return index;
    return bestIndex;
  }, 0);

const buildJarvisSteps = (points: Point[]): JarvisStep[] => {
  if (points.length < 3) return [];

  const steps: JarvisStep[] = [];
  const startIndex = leftmostPointIndex(points);
  const hullIndices: number[] = [];
  let currentIndex = startIndex;

  steps.push({
    hullIndices: [],
    currentIndex,
    candidateIndex: currentIndex,
    testIndex: null,
    message:
      'Start from the leftmost point. Gift wrapping begins there because the hull must touch the outside edge somewhere.',
  });

  do {
    hullIndices.push(currentIndex);
    let candidateIndex = currentIndex === 0 ? 1 : 0;
    if (candidateIndex === currentIndex) {
      candidateIndex = 1;
    }

    steps.push({
      hullIndices: [...hullIndices],
      currentIndex,
      candidateIndex,
      testIndex: null,
      message: `Assume point ${candidateIndex} is next, then see if any other point sits further around the outside.`,
    });

    for (let testIndex = 0; testIndex < points.length; testIndex++) {
      if (testIndex === currentIndex || testIndex === candidateIndex) continue;

      const turn = cross(points[currentIndex], points[candidateIndex], points[testIndex]);
      steps.push({
        hullIndices: [...hullIndices],
        currentIndex,
        candidateIndex,
        testIndex,
        message:
          turn > 0
            ? `Point ${testIndex} makes a more counterclockwise turn, so it is a better edge candidate.`
            : `Point ${testIndex} stays inside the current wrap, so the candidate still wins.`,
      });

      if (
        turn > 0 ||
        (turn === 0 &&
          distanceSquared(points[currentIndex], points[testIndex]) >
            distanceSquared(points[currentIndex], points[candidateIndex]))
      ) {
        candidateIndex = testIndex;
        steps.push({
          hullIndices: [...hullIndices],
          currentIndex,
          candidateIndex,
          testIndex,
          message: `Update the candidate. The wrapper should stretch to point ${candidateIndex} next.`,
        });
      }
    }

    currentIndex = candidateIndex;
  } while (currentIndex !== startIndex && hullIndices.length <= points.length + 1);

  steps.push({
    hullIndices: [...hullIndices],
    currentIndex: hullIndices[hullIndices.length - 1],
    candidateIndex: startIndex,
    testIndex: null,
    message: 'We wrapped all the way around and returned to the start, so the convex hull is complete.',
  });

  return steps;
};

const JarvisMarchCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [points, setPoints] = useState<Point[]>(randomPoints());
  const [steps, setSteps] = useState<JarvisStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Jarvis March is like wrapping a rubber band around nails. The next hull point is the outermost turn from the current one.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 10.5, 7.5);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [points, steps, currentStepIndex]);

  const drawEdge = (
    group: THREE.Group,
    start: Point,
    end: Point,
    color: number
  ) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, 0.14, start.y),
        new THREE.Vector3(end.x, 0.14, end.y),
      ]),
      new THREE.LineBasicMaterial({ color })
    );
    group.add(line);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const group = new THREE.Group();

    points.forEach((point, index) => {
      const inHull = currentStep?.hullIndices.includes(index) ?? false;
      const isCurrent = currentStep?.currentIndex === index;
      const isCandidate = currentStep?.candidateIndex === index;
      const isTest = currentStep?.testIndex === index;

      const color = isTest
        ? 0xef4444
        : isCandidate
          ? 0xf59e0b
          : isCurrent
            ? 0x8b5cf6
            : inHull
              ? 0x16a34a
              : 0x2563eb;

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color })
      );
      sphere.position.set(point.x, 0.18, point.y);
      group.add(sphere);

      group.add(
        createTextPlane(index.toString(), {
          x: point.x,
          y: 0.62,
          z: point.y,
          planeWidth: 0.34,
          planeHeight: 0.2,
          fontSize: 18,
        })
      );
    });

    if (currentStep) {
      for (let index = 0; index < currentStep.hullIndices.length - 1; index++) {
        const a = points[currentStep.hullIndices[index]];
        const b = points[currentStep.hullIndices[index + 1]];
        drawEdge(group, a, b, 0x16a34a);
      }

      if (currentStep.candidateIndex !== currentStep.currentIndex) {
        drawEdge(
          group,
          points[currentStep.currentIndex],
          points[currentStep.candidateIndex],
          0xf59e0b
        );
      }

      if (
        currentStep.testIndex !== null &&
        currentStep.testIndex !== currentStep.currentIndex
      ) {
        drawEdge(
          group,
          points[currentStep.currentIndex],
          points[currentStep.testIndex],
          0xef4444
        );
      }
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.35,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    group.add(ground);

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): JarvisStep[] => {
    if (points.length < 3) {
      setMessage('Need at least three points to wrap a hull.');
      return [];
    }

    const nextSteps = buildJarvisSteps(points);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will keep picking the most outside-looking next point until we return home.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: JarvisStep[]) => {
    if (!sourceSteps[nextIndex]) return;
    setCurrentStepIndex(nextIndex);
    setMessage(sourceSteps[nextIndex].message);
  };

  const handleStep = () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;
    showStep(Math.min(currentStepIndex + 1, sourceSteps.length - 1), sourceSteps);
  };

  const handleRun = async () => {
    if (isRunning) return;
    const sourceSteps = steps.length > 0 ? steps : prepareSteps();
    if (sourceSteps.length === 0) return;

    setIsRunning(true);
    try {
      for (let index = currentStepIndex + 1; index < sourceSteps.length; index++) {
        showStep(index, sourceSteps);
        await sleep(850);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandom = () => {
    setPoints(randomPoints());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh points loaded. Gift wrapping works best when we can clearly see the outside boundary.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Jarvis March walks around the outside by always choosing the next extreme turn.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>Jarvis March</h2>
        <p className='mb-3 text-sm text-slate-700'>
          Imagine stretching a rubber band around a scattered set of nails. The
          hull is the path the band touches on the outside.
        </p>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Points
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
          <div>Points: {points.length}</div>
          <div>Prepared steps: {steps.length}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(nh), where h is the number of hull points.
        </div>
      </div>
    </div>
  );
};

export default JarvisMarchCircus;
