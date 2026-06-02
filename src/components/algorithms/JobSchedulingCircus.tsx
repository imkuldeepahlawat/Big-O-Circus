import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface Job {
  id: string;
  deadline: number;
  profit: number;
}

interface SchedulingStep {
  currentJob: string | null;
  slots: Array<string | null>;
  totalProfit: number;
  message: string;
}

const MAX_SLOTS = 5;
const JOB_IDS = ['A', 'B', 'C', 'D', 'E'];

const createRandomJobs = (): Job[] =>
  JOB_IDS.map((id) => ({
    id,
    deadline: Math.floor(Math.random() * MAX_SLOTS) + 1,
    profit: Math.floor(Math.random() * 70) + 20,
  }));

const sortJobs = (jobs: Job[]): Job[] =>
  [...jobs].sort((first, second) => second.profit - first.profit);

const buildSchedulingSteps = (jobs: Job[]): SchedulingStep[] => {
  const sortedJobs = sortJobs(jobs);
  const slots: Array<string | null> = Array.from({ length: MAX_SLOTS }, () => null);
  const steps: SchedulingStep[] = [
    {
      currentJob: null,
      slots: [...slots],
      totalProfit: 0,
      message: 'Start by sorting jobs by profit. We want to try the most valuable job first.',
    },
  ];

  let totalProfit = 0;

  for (const job of sortedJobs) {
    let chosenSlot = -1;
    for (let slot = Math.min(job.deadline, MAX_SLOTS) - 1; slot >= 0; slot--) {
      if (slots[slot] === null) {
        chosenSlot = slot;
        break;
      }
    }

    if (chosenSlot >= 0) {
      slots[chosenSlot] = job.id;
      totalProfit += job.profit;
      steps.push({
        currentJob: job.id,
        slots: [...slots],
        totalProfit,
        message: `Place job ${job.id} in the latest free slot before deadline ${job.deadline}. That keeps earlier slots available for other work.`,
      });
    } else {
      steps.push({
        currentJob: job.id,
        slots: [...slots],
        totalProfit,
        message: `Job ${job.id} cannot fit before its deadline, so we skip it and keep the better schedule.`,
      });
    }
  }

  steps.push({
    currentJob: null,
    slots: [...slots],
    totalProfit,
    message: `Finished. The schedule keeps the best profit it could fit: ${totalProfit}.`,
  });

  return steps;
};

const JobSchedulingCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [jobs, setJobs] = useState<Job[]>(createRandomJobs());
  const [steps, setSteps] = useState<SchedulingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Schedule the most profitable jobs first, but tuck each one as late as possible so earlier slots stay useful.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 13);
      viewerRef.current.camera.lookAt(0, 1.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [jobs, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const sortedJobs = sortJobs(jobs);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const activeSlots = currentStep?.slots ?? Array.from({ length: MAX_SLOTS }, () => null);

    const group = new THREE.Group();
    const jobSpacing = 2.1;
    const jobOffsetX = -((sortedJobs.length - 1) * jobSpacing) / 2;

    sortedJobs.forEach((job, index) => {
      const current = currentStep?.currentJob === job.id;
      const height = 1 + job.profit / 30;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, height, 1.1),
        new THREE.MeshStandardMaterial({
          color: current ? 0xf59e0b : 0x2563eb,
        })
      );
      cube.position.set(jobOffsetX + index * jobSpacing, height / 2 + 2.2, 0);
      group.add(cube);

      group.add(
        createTextPlane(job.id, {
          x: jobOffsetX + index * jobSpacing,
          y: height + 2.95,
          z: 0.05,
          planeWidth: 0.4,
          planeHeight: 0.28,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(`d${job.deadline} p${job.profit}`, {
          x: jobOffsetX + index * jobSpacing,
          y: 1.4,
          z: 0.05,
          planeWidth: 1.15,
          planeHeight: 0.2,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
    });

    const slotSpacing = 2;
    const slotOffsetX = -((MAX_SLOTS - 1) * slotSpacing) / 2;

    activeSlots.forEach((jobId, slotIndex) => {
      const filled = jobId !== null;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.3, 1.3),
        new THREE.MeshStandardMaterial({
          color: filled ? 0x16a34a : 0x334155,
        })
      );
      box.position.set(slotOffsetX + slotIndex * slotSpacing, -0.4, 0);
      group.add(box);

      group.add(
        createTextPlane(jobId ?? '-', {
          x: slotOffsetX + slotIndex * slotSpacing,
          y: -0.4,
          z: 0.62,
          planeWidth: 0.42,
          planeHeight: 0.28,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(`slot ${slotIndex + 1}`, {
          x: slotOffsetX + slotIndex * slotSpacing,
          y: -1.35,
          z: 0.05,
          planeWidth: 0.78,
          planeHeight: 0.18,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
    });

    group.add(
      createTextPlane(`total profit ${currentStep?.totalProfit ?? 0}`, {
        x: 0,
        y: -2.2,
        z: 0.05,
        planeWidth: 2.3,
        planeHeight: 0.28,
        fontSize: 22,
        color: '#86efac',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): SchedulingStep[] => {
    const nextSteps = buildSchedulingSteps(jobs);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will sweep the jobs from highest profit to lowest and place each one as late as it can still fit.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: SchedulingStep[]) => {
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
        await sleep(1000);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleRandom = () => {
    setJobs(createRandomJobs());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh jobs loaded. High-profit work goes first, but each job still has to beat its deadline.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. The greedy trick is to save early time slots by placing each chosen job as late as possible.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>Job Scheduling</h2>
        <p className='mb-3 text-sm text-slate-700'>
          Think of a few tiny calendar slots. We chase the most profitable jobs
          first, but place each one as late as possible before its deadline.
        </p>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Jobs
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
            Jobs:{' '}
            {sortJobs(jobs)
              .map((job) => `${job.id}(d${job.deadline}, p${job.profit})`)
              .join(', ')}
          </div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n log n + n * maxDeadline) with this straightforward greedy scan.
        </div>
      </div>
    </div>
  );
};

export default JobSchedulingCircus;
