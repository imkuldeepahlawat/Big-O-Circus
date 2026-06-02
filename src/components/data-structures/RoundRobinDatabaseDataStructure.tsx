import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface SlotSample {
  sequence: number;
  value: number;
  label: string;
}

const SLOT_COUNT = 8;

const createEmptySlots = (): Array<SlotSample | null> =>
  Array.from({ length: SLOT_COUNT }, () => null);

const createRandomValue = (): number => Math.floor(Math.random() * 70) + 20;

const RoundRobinDatabaseDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [slots, setSlots] = useState<Array<SlotSample | null>>(createEmptySlots());
  const [writeIndex, setWriteIndex] = useState(0);
  const [sequence, setSequence] = useState(0);
  const [newestIndex, setNewestIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isBursting, setIsBursting] = useState(false);
  const [message, setMessage] = useState(
    'A round-robin database is a circular notebook. When the ring fills up, the oldest slot gets overwritten by the newest reading.'
  );

  const slotsRef = useRef<Array<SlotSample | null>>(createEmptySlots());
  const writeIndexRef = useRef(0);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2.5, 14);
      viewerRef.current.camera.lookAt(0, 0.5, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [slots, writeIndex, newestIndex, highlightedIndex]);

  const syncState = (
    nextSlots: Array<SlotSample | null>,
    nextWriteIndex: number,
    nextSequence: number,
    nextNewestIndex: number | null
  ) => {
    slotsRef.current = nextSlots;
    writeIndexRef.current = nextWriteIndex;
    sequenceRef.current = nextSequence;

    setSlots(nextSlots);
    setWriteIndex(nextWriteIndex);
    setSequence(nextSequence);
    setNewestIndex(nextNewestIndex);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const radius = 4.4;

    slots.forEach((slot, index) => {
      const angle = -Math.PI / 2 + (index / SLOT_COUNT) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const color =
        index === highlightedIndex
          ? 0xf59e0b
          : index === newestIndex
            ? 0x16a34a
            : slot
              ? 0x2563eb
              : 0x334155;

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 1.15, 1.15),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(x, y, 0);
      group.add(cube);

      group.add(
        createTextPlane(slot ? slot.value.toString() : '-', {
          x,
          y,
          z: 0.58,
          planeWidth: 0.58,
          planeHeight: 0.3,
          fontSize: 28,
        })
      );
      group.add(
        createTextPlane(`slot ${index}`, {
          x,
          y: y - 0.9,
          z: 0.05,
          planeWidth: 0.82,
          planeHeight: 0.2,
          fontSize: 16,
          color: '#cbd5e1',
        })
      );
      if (slot) {
        group.add(
          createTextPlane(slot.label, {
            x,
            y: y + 0.95,
            z: 0.05,
            planeWidth: 0.56,
            planeHeight: 0.18,
            fontSize: 16,
            color: '#fef08a',
          })
        );
      }
    });

    group.add(
      createTextPlane(`next write -> slot ${writeIndex}`, {
        x: 0,
        y: 0.5,
        z: 0.1,
        planeWidth: 2.6,
        planeHeight: 0.32,
        fontSize: 24,
      })
    );
    group.add(
      createTextPlane('fixed-size ring buffer', {
        x: 0,
        y: -0.4,
        z: 0.1,
        planeWidth: 2.8,
        planeHeight: 0.26,
        fontSize: 20,
        color: '#cbd5e1',
      })
    );

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const writeSample = (manualValue?: number) => {
    const slotIndex = writeIndexRef.current;
    const nextSequence = sequenceRef.current + 1;
    const nextValue = manualValue ?? createRandomValue();
    const overwritten = slotsRef.current[slotIndex];
    const nextSlots = [...slotsRef.current];

    nextSlots[slotIndex] = {
      sequence: nextSequence,
      value: nextValue,
      label: `t${nextSequence}`,
    };

    syncState(nextSlots, (slotIndex + 1) % SLOT_COUNT, nextSequence, slotIndex);
    setHighlightedIndex(slotIndex);
    setInputValue('');
    setMessage(
      overwritten
        ? `Slot ${slotIndex} already held ${overwritten.label}, so the new sample overwrote it. That is the round-robin idea.`
        : `Stored sample ${nextValue} in slot ${slotIndex}. The write pointer moves one step around the ring.`
    );
  };

  const handleWrite = () => {
    if (isBursting) return;
    const manualValue =
      inputValue.trim().length > 0 ? Number.parseInt(inputValue, 10) : undefined;
    writeSample(Number.isNaN(manualValue ?? NaN) ? undefined : manualValue);
  };

  const handleBurst = async () => {
    if (isBursting) return;
    setIsBursting(true);
    try {
      for (let count = 0; count < 5; count++) {
        writeSample();
        await sleep(650);
      }
    } finally {
      setIsBursting(false);
    }
  };

  const handleReset = () => {
    syncState(createEmptySlots(), 0, 0, null);
    setHighlightedIndex(null);
    setInputValue('');
    setMessage(
      'Reset. A round-robin store keeps only a fixed number of recent samples, so old data falls off the ring.'
    );
  };

  const orderedSamples = slots
    .filter((slot): slot is SlotSample => slot !== null)
    .sort((first, second) => first.sequence - second.sequence);

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Round-Robin Database
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Picture a circular notebook with only a few pages. Once every page is
          filled, the next reading writes over the oldest page.
        </p>

        <div className='mb-3 flex gap-2'>
          <input
            type='number'
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            className='flex-1 rounded border border-slate-300 px-3 py-2 text-sm'
            placeholder='Sample value'
          />
          <button
            onClick={handleWrite}
            disabled={isBursting}
            className='rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white'
          >
            Write
          </button>
        </div>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={handleBurst}
            disabled={isBursting}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            {isBursting ? 'Bursting...' : 'Burst x5'}
          </button>
          <button
            onClick={handleReset}
            disabled={isBursting}
            className='rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white'
          >
            Reset
          </button>
        </div>

        <div className='mb-3 rounded bg-slate-100 p-3 text-sm text-slate-800'>
          {message}
        </div>

        <div className='space-y-1 text-sm text-slate-700'>
          <div>Capacity: {SLOT_COUNT} slots</div>
          <div>Writes so far: {sequence}</div>
          <div>
            Retained samples:{' '}
            {orderedSamples.length > 0
              ? orderedSamples.map((slot) => `${slot.label}:${slot.value}`).join(', ')
              : 'none yet'}
          </div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(1) writes, because the next slot is always known in advance.
        </div>
      </div>
    </div>
  );
};

export default RoundRobinDatabaseDataStructure;
