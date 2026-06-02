import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface Item {
  id: string;
  weight: number;
  value: number;
  ratio: number;
}

interface KnapsackStep {
  fractions: Record<string, number>;
  currentItem: string | null;
  remainingCapacity: number;
  totalValue: number;
  message: string;
}

const ITEM_IDS = ['A', 'B', 'C', 'D', 'E'];

const createRandomItems = (): Item[] =>
  ITEM_IDS.map((id) => {
    const weight = Math.floor(Math.random() * 5) + 1;
    const value = Math.floor(Math.random() * 13) + 4;
    return {
      id,
      weight,
      value,
      ratio: Number((value / weight).toFixed(2)),
    };
  });

const sortItems = (items: Item[]): Item[] =>
  [...items].sort((first, second) => second.ratio - first.ratio);

const buildKnapsackSteps = (
  items: Item[],
  capacity: number
): KnapsackStep[] => {
  const sortedItems = sortItems(items);
  const steps: KnapsackStep[] = [
    {
      fractions: {},
      currentItem: null,
      remainingCapacity: capacity,
      totalValue: 0,
      message:
        'Start by sorting items by value per unit of weight. The densest value should go first.',
    },
  ];

  const fractions: Record<string, number> = {};
  let remainingCapacity = capacity;
  let totalValue = 0;

  for (const item of sortedItems) {
    if (remainingCapacity <= 0) break;

    const fraction = Math.min(1, remainingCapacity / item.weight);
    fractions[item.id] = fraction;
    remainingCapacity = Number((remainingCapacity - item.weight * fraction).toFixed(2));
    totalValue = Number((totalValue + item.value * fraction).toFixed(2));

    steps.push({
      fractions: { ...fractions },
      currentItem: item.id,
      remainingCapacity,
      totalValue,
      message:
        fraction === 1
          ? `Take all of item ${item.id}. It gives strong value for each unit of weight.`
          : `Take only ${fraction.toFixed(2)} of item ${item.id} to fill the backpack exactly.`,
    });

    if (fraction < 1) break;
  }

  steps.push({
    fractions: { ...fractions },
    currentItem: null,
    remainingCapacity,
    totalValue,
    message: `Finished. The backpack is full enough, and the total value is ${totalValue}.`,
  });

  return steps;
};

const FractionalKnapsackCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [items, setItems] = useState<Item[]>(createRandomItems());
  const [capacity, setCapacity] = useState(11);
  const [steps, setSteps] = useState<KnapsackStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'If you are allowed to break items, take the most value-dense item first and only nibble the last one if you must.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 14);
      viewerRef.current.camera.lookAt(0, 2, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [items, capacity, steps, currentStepIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const sortedItems = sortItems(items);
    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const fractions = currentStep?.fractions ?? {};
    const remainingCapacity = currentStep?.remainingCapacity ?? capacity;
    const usedCapacity = Number((capacity - remainingCapacity).toFixed(2));

    const group = new THREE.Group();
    const spacing = 2.2;
    const offsetX = -((sortedItems.length - 1) * spacing) / 2;

    sortedItems.forEach((item, index) => {
      const height = 1 + item.value * 0.22;
      const takenFraction = fractions[item.id] ?? 0;
      const x = offsetX + index * spacing;
      const baseColor =
        currentStep?.currentItem === item.id ? 0xf59e0b : 0x334155;

      const outerBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, height, 1.1),
        new THREE.MeshStandardMaterial({ color: baseColor })
      );
      outerBox.position.set(x, height / 2, 0);
      group.add(outerBox);

      if (takenFraction > 0) {
        const fillHeight = Math.max(0.22, height * takenFraction);
        const fillBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.88, fillHeight, 0.88),
          new THREE.MeshStandardMaterial({
            color: takenFraction === 1 ? 0x16a34a : 0x0ea5e9,
          })
        );
        fillBox.position.set(x, fillHeight / 2, 0.02);
        group.add(fillBox);
      }

      group.add(
        createTextPlane(item.id, {
          x,
          y: height + 0.55,
          z: 0.05,
          planeWidth: 0.42,
          planeHeight: 0.28,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(`w ${item.weight} v ${item.value}`, {
          x,
          y: -0.35,
          z: 0.05,
          planeWidth: 1.55,
          planeHeight: 0.24,
          fontSize: 18,
          color: '#cbd5e1',
        })
      );
      group.add(
        createTextPlane(`r ${item.ratio.toFixed(2)}`, {
          x,
          y: -0.85,
          z: 0.05,
          planeWidth: 0.95,
          planeHeight: 0.22,
          fontSize: 18,
          color: '#fef08a',
        })
      );
    });

    const backpackHeight = 4.8;
    const backpackX = 6.1;
    const fillHeight = Math.max(0.1, (usedCapacity / capacity) * backpackHeight);

    const backpackFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, backpackHeight, 1.2),
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.35,
      })
    );
    backpackFrame.position.set(backpackX, backpackHeight / 2, 0);
    group.add(backpackFrame);

    const backpackFill = new THREE.Mesh(
      new THREE.BoxGeometry(1.08, fillHeight, 0.92),
      new THREE.MeshStandardMaterial({ color: 0x16a34a })
    );
    backpackFill.position.set(backpackX, fillHeight / 2, 0.05);
    group.add(backpackFill);

    group.add(
      createTextPlane(`capacity ${capacity}`, {
        x: backpackX,
        y: backpackHeight + 0.55,
        z: 0.05,
        planeWidth: 1.9,
        planeHeight: 0.28,
        fontSize: 22,
      })
    );
    group.add(
      createTextPlane(`used ${usedCapacity.toFixed(2)}`, {
        x: backpackX,
        y: -0.35,
        z: 0.05,
        planeWidth: 1.6,
        planeHeight: 0.24,
        fontSize: 20,
        color: '#86efac',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const prepareSteps = (): KnapsackStep[] => {
    const nextSteps = buildKnapsackSteps(items, capacity);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will walk from the best value-per-weight ratio downward until the backpack runs out of space.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: KnapsackStep[]) => {
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
    setItems(createRandomItems());
    setCapacity(Math.floor(Math.random() * 6) + 9);
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Fresh backpack problem loaded. The greedy rule is to chase the best ratio first.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Fractional knapsack works because splitting the last item lets the greedy ratio choice stay optimal.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Fractional Knapsack
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Imagine packing a backpack with food you can break into pieces. You
          always want the most value for each unit of weight first.
        </p>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleRandom}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Random Items
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
          <div>Capacity: {capacity}</div>
          <div>Sorted order: {sortItems(items).map((item) => item.id).join(' -> ')}</div>
          <div>
            Items:{' '}
            {items.map((item) => `${item.id}(w${item.weight}, v${item.value})`).join(', ')}
          </div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(n log n) because the greedy choice starts with sorting by ratio.
        </div>
      </div>
    </div>
  );
};

export default FractionalKnapsackCircus;
