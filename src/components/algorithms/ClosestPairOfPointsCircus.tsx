import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface Point {
  x: number;
  y: number;
}

interface ClosestPairStep {
  splitX: number | null;
  leftIndices: number[];
  rightIndices: number[];
  stripIndices: number[];
  bestPair: [number, number] | null;
  bestDistance: number;
  message: string;
}

const randomPoints = (count = 8): Point[] =>
  Array.from({ length: count }, () => ({
    x: Number(((Math.random() - 0.5) * 9).toFixed(2)),
    y: Number(((Math.random() - 0.5) * 9).toFixed(2)),
  }));

const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const bestPairInIndices = (
  points: Point[],
  indices: number[]
): { pair: [number, number] | null; dist: number } => {
  let best: [number, number] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const first = indices[i];
      const second = indices[j];
      const nextDistance = distance(points[first], points[second]);
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance;
        best = [first, second];
      }
    }
  }

  return { pair: best, dist: bestDistance };
};

const buildClosestPairSteps = (points: Point[]): ClosestPairStep[] => {
  if (points.length < 2) return [];

  const sortedIndices = points
    .map((_, index) => index)
    .sort((first, second) => points[first].x - points[second].x);

  const middle = Math.floor(sortedIndices.length / 2);
  const leftIndices = sortedIndices.slice(0, middle);
  const rightIndices = sortedIndices.slice(middle);
  const splitX =
    (points[sortedIndices[middle - 1]].x + points[sortedIndices[middle]].x) / 2;

  const leftBest = bestPairInIndices(points, leftIndices);
  const rightBest = bestPairInIndices(points, rightIndices);

  let bestPair = leftBest.dist <= rightBest.dist ? leftBest.pair : rightBest.pair;
  let bestDistance = Math.min(leftBest.dist, rightBest.dist);

  const stripIndices = sortedIndices.filter(
    (index) => Math.abs(points[index].x - splitX) < bestDistance
  );
  const stripBest = bestPairInIndices(points, stripIndices);

  const steps: ClosestPairStep[] = [
    {
      splitX,
      leftIndices,
      rightIndices,
      stripIndices: [],
      bestPair: null,
      bestDistance: Number.POSITIVE_INFINITY,
      message:
        'Sort the points by x-coordinate, then split them into a left half and a right half.',
    },
    {
      splitX,
      leftIndices,
      rightIndices,
      stripIndices: [],
      bestPair: leftBest.pair,
      bestDistance: leftBest.dist,
      message: `Find the best pair inside the left half first. Its distance is ${leftBest.dist.toFixed(2)}.`,
    },
    {
      splitX,
      leftIndices,
      rightIndices,
      stripIndices: [],
      bestPair: rightBest.pair,
      bestDistance: rightBest.dist,
      message: `Now find the best pair inside the right half. Its distance is ${rightBest.dist.toFixed(2)}.`,
    },
    {
      splitX,
      leftIndices,
      rightIndices,
      stripIndices: [],
      bestPair,
      bestDistance,
      message: `Keep the better of those two distances as the current delta: ${bestDistance.toFixed(2)}.`,
    },
  ];

  if (stripBest.pair && stripBest.dist < bestDistance) {
    bestPair = stripBest.pair;
    bestDistance = stripBest.dist;
  }

  steps.push({
    splitX,
    leftIndices,
    rightIndices,
    stripIndices,
    bestPair: stripBest.pair ?? bestPair,
    bestDistance: stripBest.pair ? stripBest.dist : bestDistance,
    message:
      stripIndices.length > 1
        ? `Only points close to the split line can beat delta. Check that narrow strip next.`
        : 'The strip is too small to help, so the best pair already came from one side.',
  });

  steps.push({
    splitX,
    leftIndices,
    rightIndices,
    stripIndices,
    bestPair,
    bestDistance,
    message: `Finished. The closest pair is ${bestPair ? `${bestPair[0]} and ${bestPair[1]}` : 'unknown'} with distance ${bestDistance.toFixed(2)}.`,
  });

  return steps;
};

const ClosestPairOfPointsCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [points, setPoints] = useState<Point[]>(randomPoints());
  const [steps, setSteps] = useState<ClosestPairStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'The closest pair problem wins by focusing on local neighborhoods instead of comparing every pair everywhere.'
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
        new THREE.Vector3(start.x, 0.13, start.y),
        new THREE.Vector3(end.x, 0.13, end.y),
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
      const inLeft = currentStep?.leftIndices.includes(index) ?? false;
      const inRight = currentStep?.rightIndices.includes(index) ?? false;
      const inStrip = currentStep?.stripIndices.includes(index) ?? false;
      const inBestPair =
        currentStep?.bestPair?.includes(index as never) ?? false;

      const color = inBestPair
        ? 0xf59e0b
        : inStrip
          ? 0x8b5cf6
          : inLeft
            ? 0x2563eb
            : inRight
              ? 0x16a34a
              : 0x64748b;

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
          planeWidth: 0.3,
          planeHeight: 0.18,
          fontSize: 18,
        })
      );
    });

    if (currentStep?.bestPair) {
      drawEdge(
        group,
        points[currentStep.bestPair[0]],
        points[currentStep.bestPair[1]],
        0xf59e0b
      );
    }

    if (currentStep?.splitX !== null && currentStep?.splitX !== undefined) {
      const splitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(currentStep.splitX, 0.1, -5.5),
          new THREE.Vector3(currentStep.splitX, 0.1, 5.5),
        ]),
        new THREE.LineBasicMaterial({ color: 0xe2e8f0 })
      );
      group.add(splitLine);
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

  const prepareSteps = (): ClosestPairStep[] => {
    if (points.length < 2) {
      setMessage('Need at least two points to compare distances.');
      return [];
    }

    const nextSteps = buildClosestPairSteps(points);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will split the plane, solve the two halves, then only inspect the narrow strip near the split.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: ClosestPairStep[]) => {
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
        await sleep(900);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandom = () => {
    setPoints(randomPoints());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh points loaded. The closest pair often hides in a very local neighborhood.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. The divide-and-conquer trick is that only a thin strip near the split can beat the best pair from each side.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Closest Pair of Points
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Instead of measuring every pair everywhere, split the set, solve each
          side, and only worry about a narrow strip near the boundary.
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
          Complexity: the full divide-and-conquer algorithm runs in O(n log n).
        </div>
      </div>
    </div>
  );
};

export default ClosestPairOfPointsCircus;
