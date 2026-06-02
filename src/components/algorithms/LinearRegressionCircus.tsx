import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface RegressionPoint {
  x: number;
  y: number;
}

interface RegressionStep {
  slope: number;
  intercept: number;
  loss: number;
  iteration: number;
  message: string;
}

const SAMPLE_POINTS: RegressionPoint[] = [
  { x: -4, y: -2.9 },
  { x: -3, y: -2.1 },
  { x: -2, y: -0.9 },
  { x: -1, y: -0.3 },
  { x: 0, y: 0.9 },
  { x: 1, y: 1.6 },
  { x: 2, y: 2.5 },
  { x: 3, y: 3.4 },
  { x: 4, y: 4.1 },
];

const buildRegressionSteps = (
  points: RegressionPoint[],
  iterations = 10,
  learningRate = 0.04
): RegressionStep[] => {
  const steps: RegressionStep[] = [];
  let slope = 0;
  let intercept = 0;

  const lossFor = (m: number, b: number): number =>
    points.reduce((sum, point) => {
      const error = m * point.x + b - point.y;
      return sum + error * error;
    }, 0) / points.length;

  steps.push({
    slope,
    intercept,
    loss: lossFor(slope, intercept),
    iteration: 0,
    message: 'Start with a rough line. It is not fitted yet, so the average squared error is still large.',
  });

  for (let iteration = 1; iteration <= iterations; iteration++) {
    let slopeGradient = 0;
    let interceptGradient = 0;

    points.forEach((point) => {
      const prediction = slope * point.x + intercept;
      const error = prediction - point.y;
      slopeGradient += (2 / points.length) * error * point.x;
      interceptGradient += (2 / points.length) * error;
    });

    slope -= learningRate * slopeGradient;
    intercept -= learningRate * interceptGradient;

    steps.push({
      slope,
      intercept,
      loss: lossFor(slope, intercept),
      iteration,
      message: `Gradient descent nudges the slope and intercept downhill to reduce prediction error.`,
    });
  }

  return steps;
};

const LinearRegressionCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [steps, setSteps] = useState<RegressionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Linear regression draws the line that best follows the trend in the data.'
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

  const drawLine = (
    group: THREE.Group,
    slope: number,
    intercept: number,
    color: number
  ) => {
    const x1 = -5;
    const x2 = 5;
    const y1 = slope * x1 + intercept;
    const y2 = slope * x2 + intercept;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, 0.1, y1),
        new THREE.Vector3(x2, 0.1, y2),
      ]),
      new THREE.LineBasicMaterial({ color })
    );
    group.add(line);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const slope = currentStep?.slope ?? 0;
    const intercept = currentStep?.intercept ?? 0;

    const group = new THREE.Group();

    SAMPLE_POINTS.forEach((point) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x2563eb })
      );
      sphere.position.set(point.x, 0.18, point.y);
      group.add(sphere);
    });

    drawLine(group, slope, intercept, 0xf59e0b);

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

  const prepareSteps = (): RegressionStep[] => {
    const nextSteps = buildRegressionSteps(SAMPLE_POINTS);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will move the line downhill on the loss surface until it better follows the cloud of points.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: RegressionStep[]) => {
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
      'Reset. Linear regression keeps adjusting the line until the average squared prediction error shrinks.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Linear Regression
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          The line starts rough, then gradient descent keeps nudging it toward a
          better fit for the data.
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
          <div>Slope: {currentStepIndex >= 0 ? steps[currentStepIndex].slope.toFixed(3) : '0.000'}</div>
          <div>Intercept: {currentStepIndex >= 0 ? steps[currentStepIndex].intercept.toFixed(3) : '0.000'}</div>
          <div>Loss: {currentStepIndex >= 0 ? steps[currentStepIndex].loss.toFixed(3) : '-'}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(iterations * number of points) for this simple batch gradient descent view.
        </div>
      </div>
    </div>
  );
};

export default LinearRegressionCircus;
