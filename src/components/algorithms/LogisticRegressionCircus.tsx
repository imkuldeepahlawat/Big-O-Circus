import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { sleep } from '@/lib/visualizationHelpers';

type Label = 0 | 1;

interface LogisticPoint {
  x: number;
  y: number;
  label: Label;
}

interface LogisticStep {
  w1: number;
  w2: number;
  bias: number;
  loss: number;
  probability: number;
  iteration: number;
  message: string;
}

const DATASET: LogisticPoint[] = [
  { x: -3.4, y: -1.9, label: 0 },
  { x: -2.6, y: -2.8, label: 0 },
  { x: -1.7, y: -1.1, label: 0 },
  { x: -0.8, y: -2.2, label: 0 },
  { x: 1.2, y: 1.1, label: 1 },
  { x: 2.1, y: 2.4, label: 1 },
  { x: 3.0, y: 1.7, label: 1 },
  { x: 2.4, y: 0.8, label: 1 },
];

const QUERY = { x: 0.4, y: 0.1 };

const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));

const buildLogisticSteps = (
  points: LogisticPoint[],
  iterations = 10,
  learningRate = 0.22
): LogisticStep[] => {
  let w1 = 0;
  let w2 = 0;
  let bias = 0;

  const lossFor = (nextW1: number, nextW2: number, nextBias: number): number =>
    points.reduce((sum, point) => {
      const probability = sigmoid(nextW1 * point.x + nextW2 * point.y + nextBias);
      return (
        sum -
        (point.label * Math.log(probability + 1e-9) +
          (1 - point.label) * Math.log(1 - probability + 1e-9))
      );
    }, 0) / points.length;

  const probabilityForQuery = (nextW1: number, nextW2: number, nextBias: number): number =>
    sigmoid(nextW1 * QUERY.x + nextW2 * QUERY.y + nextBias);

  const steps: LogisticStep[] = [
    {
      w1,
      w2,
      bias,
      loss: lossFor(w1, w2, bias),
      probability: probabilityForQuery(w1, w2, bias),
      iteration: 0,
      message:
        'Start with a flat guess. Logistic regression will learn a boundary that separates the two classes.',
    },
  ];

  for (let iteration = 1; iteration <= iterations; iteration++) {
    let gradW1 = 0;
    let gradW2 = 0;
    let gradBias = 0;

    points.forEach((point) => {
      const prediction = sigmoid(w1 * point.x + w2 * point.y + bias);
      const error = prediction - point.label;
      gradW1 += (error * point.x) / points.length;
      gradW2 += (error * point.y) / points.length;
      gradBias += error / points.length;
    });

    w1 -= learningRate * gradW1;
    w2 -= learningRate * gradW2;
    bias -= learningRate * gradBias;

    steps.push({
      w1,
      w2,
      bias,
      loss: lossFor(w1, w2, bias),
      probability: probabilityForQuery(w1, w2, bias),
      iteration,
      message:
        'The weights shift the decision boundary so the blue class becomes more probable on one side and the red class on the other.',
    });
  }

  return steps;
};

const LogisticRegressionCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [steps, setSteps] = useState<LogisticStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Logistic regression learns a probability boundary instead of a plain straight-line prediction.'
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
  }, [steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const w1 = currentStep?.w1 ?? 0;
    const w2 = currentStep?.w2 ?? 0;
    const bias = currentStep?.bias ?? 0;

    const group = new THREE.Group();

    DATASET.forEach((point) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({
          color: point.label === 1 ? 0x2563eb : 0xef4444,
        })
      );
      sphere.position.set(point.x, 0.18, point.y);
      group.add(sphere);
    });

    const queryColor =
      (currentStep?.probability ?? 0.5) >= 0.5 ? 0x2563eb : 0xef4444;
    const query = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 18, 18),
      new THREE.MeshStandardMaterial({ color: queryColor })
    );
    query.position.set(QUERY.x, 0.22, QUERY.y);
    group.add(query);

    if (Math.abs(w2) > 0.0001) {
      const x1 = -5;
      const x2 = 5;
      const y1 = -(w1 * x1 + bias) / w2;
      const y2 = -(w1 * x2 + bias) / w2;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1, 0.1, y1),
          new THREE.Vector3(x2, 0.1, y2),
        ]),
        new THREE.LineBasicMaterial({ color: 0xf59e0b })
      );
      group.add(line);
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

  const prepareSteps = (): LogisticStep[] => {
    const nextSteps = buildLogisticSteps(DATASET);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will adjust the weights so the decision boundary places high probability on the correct side for most points.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: LogisticStep[]) => {
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
        await sleep(700);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Logistic regression moves a decision boundary until the right class gets the higher probability.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Logistic Regression
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          This model does not predict any number it wants. It predicts a
          probability, then a decision boundary falls where the probability hits
          fifty-fifty.
        </p>

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
          <div>Query probability: {currentStepIndex >= 0 ? (steps[currentStepIndex].probability * 100).toFixed(1) : '50.0'}%</div>
          <div>Loss: {currentStepIndex >= 0 ? steps[currentStepIndex].loss.toFixed(3) : '-'}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(iterations * number of points) for this simple full-batch training view.
        </div>
      </div>
    </div>
  );
};

export default LogisticRegressionCircus;
