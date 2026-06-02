import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { createTextPlane, sleep } from '@/lib/visualizationHelpers';

interface Point {
  x: number;
  y: number;
}

interface SegmentPair {
  a: Point;
  b: Point;
  c: Point;
  d: Point;
}

interface IntersectionStep {
  active: Array<'A' | 'B' | 'C' | 'D'>;
  orientationValues: [number, number, number, number] | null;
  intersects: boolean | null;
  message: string;
}

const intersectingSample = (): SegmentPair => ({
  a: { x: -3.2, y: -2.4 },
  b: { x: 3.1, y: 2.8 },
  c: { x: -2.7, y: 2.5 },
  d: { x: 2.6, y: -2.1 },
});

const disjointSample = (): SegmentPair => ({
  a: { x: -3.4, y: 1.8 },
  b: { x: -0.6, y: 3.2 },
  c: { x: 1.2, y: -1.6 },
  d: { x: 3.6, y: -3.2 },
});

const orientation = (p: Point, q: Point, r: Point): number => {
  const value = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(value) < 1e-9) return 0;
  return value > 0 ? 1 : 2;
};

const onSegment = (p: Point, q: Point, r: Point): boolean =>
  q.x <= Math.max(p.x, r.x) &&
  q.x >= Math.min(p.x, r.x) &&
  q.y <= Math.max(p.y, r.y) &&
  q.y >= Math.min(p.y, r.y);

const segmentsIntersect = (pair: SegmentPair): boolean => {
  const { a, b, c, d } = pair;
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
};

const intersectionPoint = (pair: SegmentPair): Point | null => {
  const { a, b, c, d } = pair;
  const denominator =
    (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(denominator) < 1e-9) return null;

  const determinant1 = a.x * b.y - a.y * b.x;
  const determinant2 = c.x * d.y - c.y * d.x;

  return {
    x:
      (determinant1 * (c.x - d.x) - (a.x - b.x) * determinant2) /
      denominator,
    y:
      (determinant1 * (c.y - d.y) - (a.y - b.y) * determinant2) /
      denominator,
  };
};

const buildIntersectionSteps = (pair: SegmentPair): IntersectionStep[] => {
  const { a, b, c, d } = pair;
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  const intersects = segmentsIntersect(pair);

  return [
    {
      active: [],
      orientationValues: null,
      intersects: null,
      message:
        'Two line segments intersect if each segment separates the endpoints of the other segment on opposite sides.',
    },
    {
      active: ['A', 'B', 'C'],
      orientationValues: [o1, o2, o3, o4],
      intersects: null,
      message: `Check the turn made by A -> B -> C. Its orientation value is ${o1}.`,
    },
    {
      active: ['A', 'B', 'D'],
      orientationValues: [o1, o2, o3, o4],
      intersects: null,
      message: `Now check A -> B -> D. Its orientation value is ${o2}.`,
    },
    {
      active: ['C', 'D', 'A'],
      orientationValues: [o1, o2, o3, o4],
      intersects: null,
      message: `Switch sides and check C -> D -> A. Its orientation value is ${o3}.`,
    },
    {
      active: ['C', 'D', 'B'],
      orientationValues: [o1, o2, o3, o4],
      intersects: null,
      message: `Finally check C -> D -> B. Its orientation value is ${o4}.`,
    },
    {
      active: ['A', 'B', 'C', 'D'],
      orientationValues: [o1, o2, o3, o4],
      intersects,
      message: intersects
        ? 'The orientation tests disagree in the right way, so the segments cross.'
        : 'The orientation tests do not separate the endpoints correctly, so the segments do not cross.',
    },
  ];
};

const pointMap = (pair: SegmentPair): Record<'A' | 'B' | 'C' | 'D', Point> => ({
  A: pair.a,
  B: pair.b,
  C: pair.c,
  D: pair.d,
});

const LineIntersectionCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [pair, setPair] = useState<SegmentPair>(intersectingSample());
  const [steps, setSteps] = useState<IntersectionStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState(
    'Line intersection is a question about turns. Each segment asks whether the other segment’s endpoints land on opposite sides of it.'
  );

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 10, 7);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }

    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [pair, steps, currentStepIndex]);

  const drawEdge = (
    group: THREE.Group,
    start: Point,
    end: Point,
    color: number
  ) => {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, 0.12, start.y),
        new THREE.Vector3(end.x, 0.12, end.y),
      ]),
      new THREE.LineBasicMaterial({ color })
    );
    group.add(line);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
    const points = pointMap(pair);
    const intersection = segmentsIntersect(pair) ? intersectionPoint(pair) : null;

    const group = new THREE.Group();

    drawEdge(group, pair.a, pair.b, 0x2563eb);
    drawEdge(group, pair.c, pair.d, 0x16a34a);

    (Object.entries(points) as Array<['A' | 'B' | 'C' | 'D', Point]>).forEach(
      ([label, point]) => {
        const active = currentStep?.active.includes(label) ?? false;
        const color =
          label === 'A' || label === 'B'
            ? active
              ? 0xf59e0b
              : 0x2563eb
            : active
              ? 0xef4444
              : 0x16a34a;

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({ color })
        );
        sphere.position.set(point.x, 0.18, point.y);
        group.add(sphere);

        group.add(
          createTextPlane(label, {
            x: point.x,
            y: 0.62,
            z: point.y,
            planeWidth: 0.28,
            planeHeight: 0.18,
            fontSize: 18,
          })
        );
      }
    );

    if (currentStep?.intersects && intersection) {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15 })
      );
      marker.position.set(intersection.x, 0.2, intersection.y);
      group.add(marker);
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

  const prepareSteps = (): IntersectionStep[] => {
    const nextSteps = buildIntersectionSteps(pair);
    setSteps(nextSteps);
    setCurrentStepIndex(-1);
    setMessage(
      'Ready. We will compare turn directions to decide whether the segments separate each other’s endpoints.'
    );
    return nextSteps;
  };

  const showStep = (nextIndex: number, sourceSteps: IntersectionStep[]) => {
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
        await sleep(900);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const loadIntersecting = () => {
    setPair(intersectingSample());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Loaded an intersecting sample. The segments should cross if the turn tests separate correctly.');
  };

  const loadDisjoint = () => {
    setPair(disjointSample());
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage('Loaded a disjoint sample. The turn tests should show why the segments miss each other.');
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(-1);
    setMessage(
      'Reset. Intersection can be tested by asking which side of each segment the other segment’s endpoints fall on.'
    );
  };

  return (
    <div className='relative h-screen w-full overflow-hidden'>
      <canvas ref={canvasRef} className='h-full w-full' />

      <div className='absolute left-4 top-4 max-w-md rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur'>
        <h2 className='mb-2 text-2xl font-bold text-slate-900'>
          Line Intersection
        </h2>
        <p className='mb-3 text-sm text-slate-700'>
          Two segments intersect when each one sees the other segment’s
          endpoints land on opposite sides.
        </p>

        <div className='mb-3 flex flex-wrap gap-2'>
          <button
            onClick={loadIntersecting}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Intersecting Sample
          </button>
          <button
            onClick={loadDisjoint}
            disabled={isRunning}
            className='rounded bg-slate-700 px-3 py-2 text-sm font-medium text-white'
          >
            Disjoint Sample
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
          <div>Segments: AB and CD</div>
          <div>Prepared steps: {steps.length}</div>
        </div>

        <div className='mt-3 text-xs text-slate-500'>
          Complexity: O(1) for the orientation checks on a fixed pair of segments.
        </div>
      </div>
    </div>
  );
};

export default LineIntersectionCircus;
