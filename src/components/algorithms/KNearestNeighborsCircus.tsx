import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

type Label = 'red' | 'blue';

interface LabeledPoint {
  x: number;
  y: number;
  label: Label;
}

interface KNNData {
  points: LabeledPoint[];
  query: { x: number; y: number };
}

interface KNNStep {
  selectedIndices: number[];
  predictedLabel: Label | null;
  message: string;
}

const LABEL_COLORS: Record<Label, number> = {
  red: 0xef4444,
  blue: 0x2563eb,
};

const createKnnSample = (): KNNData => ({
  points: [
    { x: -3.6, y: 2.2, label: 'red' },
    { x: -2.8, y: 1.4, label: 'red' },
    { x: -2.2, y: 2.8, label: 'red' },
    { x: -1.8, y: 0.8, label: 'red' },
    { x: 1.7, y: -2.2, label: 'blue' },
    { x: 2.4, y: -1.3, label: 'blue' },
    { x: 3.1, y: -2.8, label: 'blue' },
    { x: 2.7, y: -0.6, label: 'blue' },
  ],
  query: { x: 0.2, y: -0.2 },
});

const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

const buildKnnSteps = (data: KNNData, k: number): KNNStep[] => {
  const ordered = data.points
    .map((point, index) => ({
      index,
      distance: distance(point, data.query),
      label: point.label,
    }))
    .sort((first, second) => first.distance - second.distance);

  const steps: KNNStep[] = [
    {
      selectedIndices: [],
      predictedLabel: null,
      message:
        'KNN asks the nearby examples what they are. We start by measuring distance from the query point to every labeled point.',
    },
  ];

  for (let index = 0; index < k; index++) {
    const chosen = ordered.slice(0, index + 1);
    steps.push({
      selectedIndices: chosen.map((entry) => entry.index),
      predictedLabel: null,
      message: `Keep the ${index + 1} closest neighbors seen so far.`,
    });
  }

  const neighbors = ordered.slice(0, k);
  const redVotes = neighbors.filter((entry) => entry.label === 'red').length;
  const blueVotes = neighbors.length - redVotes;
  const predictedLabel = redVotes >= blueVotes ? 'red' : 'blue';

  steps.push({
    selectedIndices: neighbors.map((entry) => entry.index),
    predictedLabel,
    message: `The nearest neighbors vote ${redVotes} to ${blueVotes}, so the query is classified as ${predictedLabel}.`,
  });

  return steps;
};

const KNearestNeighborsCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [data, setData] = useState<KNNData>(createKnnSample());
  const [k, setK] = useState(3);
  const [steps, setSteps] = useState<KNNStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'K-nearest neighbors predicts a label by asking the closest labeled points to vote.'
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
  }, [data, steps, currentStepIndex, k]);

  const drawEdge = (
    group: THREE.Group,
    start: { x: number; y: number },
    end: { x: number; y: number },
    color: number
  ) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, 0.1, start.y),
        new THREE.Vector3(end.x, 0.1, end.y),
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

    data.points.forEach((point, index) => {
      const selected = currentStep?.selectedIndices.includes(index) ?? false;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(selected ? 0.24 : 0.18, 16, 16),
        new THREE.MeshStandardMaterial({
          color: selected ? 0xf59e0b : LABEL_COLORS[point.label],
        })
      );
      sphere.position.set(point.x, 0.18, point.y);
      group.add(sphere);

      group.add(
        createTextPlane(point.label === 'red' ? 'R' : 'B', {
          x: point.x,
          y: 0.58,
          z: point.y,
          planeWidth: 0.24,
          planeHeight: 0.18,
          fontSize: 16,
        })
      );
    });

    const queryColor = currentStep?.predictedLabel
      ? LABEL_COLORS[currentStep.predictedLabel]
      : 0xfacc15;
    const queryPoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 18, 18),
      new THREE.MeshStandardMaterial({ color: queryColor })
    );
    queryPoint.position.set(data.query.x, 0.24, data.query.y);
    group.add(queryPoint);

    group.add(
      createTextPlane('Q', {
        x: data.query.x,
        y: 0.7,
        z: data.query.y,
        planeWidth: 0.24,
        planeHeight: 0.18,
        fontSize: 18,
      })
    );

    currentStep?.selectedIndices.forEach((index) => {
      drawEdge(group, data.query, data.points[index], 0xf59e0b);
    });

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

  const prepareSteps = (): KNNStep[] => {
    const nextSteps = buildKnnSteps(data, k);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will sort the nearby points by distance and let the closest ones vote.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: KNNStep[]) => {
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
        await sleep(850);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setData(createKnnSample());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. KNN is a local vote: nearby labeled examples decide the new point’s label.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          K-Nearest Neighbors
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          A new point asks its nearby neighbors what they are, and the crowd
          vote becomes its label.
        </p>

        <div className='mb-3 flex gap-2'>
          <label className='flex items-center gap-2 text-sm text-slate-700'>
            k
            <select
              value={k}
              onChange={(event) => {
                setK(Number.parseInt(event.target.value, 10));
                setSteps([]);
                setCurrentStepIndex(-1);
              }}
              className='rounded border border-slate-300 px-2 py-1 text-sm'
            >
              <option value='1'>1</option>
              <option value='3'>3</option>
              <option value='5'>5</option>
            </select>
          </label>
          <button
            onClick={handleReset}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Reset Sample
          </button>
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
        </div>

        <div className='mb-3 rounded bg-slate-100 p-3 text-sm text-slate-800'>
          {message}
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n log n) here because we sort distances, though selection-based variants can do less.
        </div>
      </div>
    </div>
  );
};

export default KNearestNeighborsCircus;
