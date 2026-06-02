import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type Approach = 'bucket' | 'heap';

const textPlane = (
  text: string,
  planeW: number,
  planeH: number,
  color = 'white',
  fontScale = 0.55
): THREE.Mesh => {
  const PPU = 192;
  const pw = Math.max(Math.round(planeW * PPU), 64);
  const ph = Math.max(Math.round(planeH * PPU), 32);
  let fs = Math.round(ph * fontScale);

  const cv = document.createElement('canvas');
  cv.width = pw;
  cv.height = ph;
  const cx = cv.getContext('2d')!;
  cx.clearRect(0, 0, pw, ph);
  cx.font = `bold ${fs}px Arial`;
  while (cx.measureText(text).width > pw - 8 && fs > 8) {
    fs -= 1;
    cx.font = `bold ${fs}px Arial`;
  }
  cx.fillStyle = color;
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(text, pw / 2, ph / 2);

  return new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cv),
      transparent: true,
    })
  );
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EXAMPLES = [
  { raw: '1,1,1,2,2,3', k: 2, label: '[1,1,1,2,2,3] k=2 → [1,2]' },
  { raw: '1', k: 1, label: '[1] k=1 → [1]' },
  { raw: '1,2,2,3,3,3', k: 1, label: '[1,2,2,3,3,3] k=1 → [3]' },
  { raw: '4,1,1,2,2,2,3', k: 2, label: '[4,1,1,2,2,2,3] k=2 → [2,1]' },
  { raw: '1,1,2,2,3', k: 3, label: '[1,1,2,2,3] k=3 → [1,2,3]' },
  { raw: '5,5,4,4,3,3,2,1', k: 3, label: '[5,5,4,4,3,3,2,1] k=3 → [5,4,3]' },
];

const TopKFrequentProblem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [nums, setNums] = useState([1, 1, 1, 2, 2, 3]);
  const [numsInput, setNumsInput] = useState('1,1,1,2,2,3');
  const [k, setK] = useState(2);
  const [approach, setApproach] = useState<Approach>('bucket');
  const [step, setStep] = useState('');
  const [result, setResult] = useState<number[] | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  // ── BUCKET SORT DRAW ──
  const drawBucket = (
    currentNums: number[],
    freqMap: Map<number, number>,
    buckets: number[][],
    collectIdx: number,
    collected: number[]
  ) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const g = new THREE.Group();
    const n = currentNums.length;
    const STEP_X = 1.45;

    // Input array
    const t1 = textPlane('Input Array', 2.2, 0.38, '#6b7280', 0.5);
    t1.position.set(((n - 1) * STEP_X) / 2, 4.2, 0);
    g.add(t1);

    currentNums.forEach((val, i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x4287f5 })
      );
      cube.position.set(i * STEP_X, 3.1, 0);
      g.add(cube);

      const vl = textPlane(String(val), 1.0, 0.55, 'white', 0.7);
      vl.position.set(i * STEP_X, 3.1, 0.63);
      g.add(vl);
    });

    // Freq map
    if (freqMap.size > 0) {
      const t2 = textPlane('Frequency Map', 2.4, 0.38, '#6b7280', 0.5);
      t2.position.set(((freqMap.size - 1) * 1.7) / 2, 1.6, 0);
      g.add(t2);

      let col = 0;
      freqMap.forEach((freq, val) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.95, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b })
        );
        cube.position.set(col * 1.7, 0.75, 0);
        g.add(cube);

        const fl = textPlane(`${val}:${freq}`, 1.2, 0.5, 'white', 0.62);
        fl.position.set(col * 1.7, 0.75, 0.42);
        g.add(fl);
        col++;
      });
    }

    // Buckets
    if (buckets.some((b) => b.length > 0)) {
      const t3 = textPlane(
        'Buckets  [freq → nums]',
        3.4,
        0.38,
        '#6b7280',
        0.46
      );
      t3.position.set((n * 0.95) / 2, -0.7, 0);
      g.add(t3);

      for (let freq = 0; freq <= n; freq++) {
        const bucket = buckets[freq] || [];
        const isCollecting = freq === collectIdx;

        const idxLbl = textPlane(
          `[${freq}]`,
          0.65,
          0.32,
          isCollecting ? '#10b981' : '#9ca3af',
          0.6
        );
        idxLbl.position.set(freq * 0.95, -1.35, 0);
        g.add(idxLbl);

        bucket.forEach((val, si) => {
          const color = isCollecting ? 0x10b981 : 0x94a3b8;
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.75, 0.75, 0.6),
            new THREE.MeshStandardMaterial({ color })
          );
          cube.position.set(freq * 0.95, -1.95 - si * 0.88, 0);
          g.add(cube);

          const vl = textPlane(String(val), 0.65, 0.38, 'white', 0.68);
          vl.position.set(freq * 0.95, -1.95 - si * 0.88, 0.35);
          g.add(vl);
        });
      }
    }

    // Result
    if (collected.length > 0) {
      const rTitle = textPlane(`Result (k=${k})`, 1.8, 0.38, '#10b981', 0.5);
      rTitle.position.set(((collected.length - 1) * STEP_X) / 2, -4.8, 0);
      g.add(rTitle);

      collected.forEach((val, i) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x10b981 })
        );
        cube.position.set(i * STEP_X, -5.8, 0);
        g.add(cube);

        const vl = textPlane(String(val), 1.0, 0.55, 'white', 0.7);
        vl.position.set(i * STEP_X, -5.8, 0.63);
        g.add(vl);
      });
    }

    viewerRef.current.scene.add(g);
    viewerRef.current.enableRender();
  };

  // ── MIN-HEAP DRAW ──
  const drawHeap = (
    currentNums: number[],
    freqMap: Map<number, number>,
    heap: [number, number][],
    collected: number[]
  ) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const g = new THREE.Group();
    const n = currentNums.length;
    const STEP_X = 1.45;

    // Input array
    const t1 = textPlane('Input Array', 2.2, 0.38, '#6b7280', 0.5);
    t1.position.set(((n - 1) * STEP_X) / 2, 4.2, 0);
    g.add(t1);

    currentNums.forEach((val, i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x4287f5 })
      );
      cube.position.set(i * STEP_X, 3.1, 0);
      g.add(cube);
      const vl = textPlane(String(val), 1.0, 0.55, 'white', 0.7);
      vl.position.set(i * STEP_X, 3.1, 0.63);
      g.add(vl);
    });

    // Freq map
    if (freqMap.size > 0) {
      const t2 = textPlane('Frequency Map', 2.4, 0.38, '#6b7280', 0.5);
      t2.position.set(((freqMap.size - 1) * 1.7) / 2, 1.6, 0);
      g.add(t2);
      let col = 0;
      freqMap.forEach((freq, val) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.95, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b })
        );
        cube.position.set(col * 1.7, 0.75, 0);
        g.add(cube);
        const fl = textPlane(`${val}:${freq}`, 1.2, 0.5, 'white', 0.62);
        fl.position.set(col * 1.7, 0.75, 0.42);
        g.add(fl);
        col++;
      });
    }

    // Heap row
    if (heap.length > 0) {
      const t3 = textPlane(
        `Min-Heap  (size ≤ ${k})`,
        2.8,
        0.38,
        '#a855f7',
        0.5
      );
      t3.position.set(((heap.length - 1) * 1.6) / 2, -0.7, 0);
      g.add(t3);

      const sorted = [...heap].sort((a, b) => a[0] - b[0]);
      sorted.forEach(([freq, val], i) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 1.3, 1.1),
          new THREE.MeshStandardMaterial({ color: 0xa855f7 })
        );
        cube.position.set(i * 1.6, -1.75, 0);
        g.add(cube);

        const vl = textPlane(String(val), 1.1, 0.55, 'white', 0.7);
        vl.position.set(i * 1.6, -1.6, 0.58);
        g.add(vl);

        const fl = textPlane(`f:${freq}`, 1.1, 0.32, '#e9d5ff', 0.65);
        fl.position.set(i * 1.6, -2.08, 0.58);
        g.add(fl);
      });
    }

    // Result
    if (collected.length > 0) {
      const rTitle = textPlane(`Result (k=${k})`, 1.8, 0.38, '#10b981', 0.5);
      rTitle.position.set(((collected.length - 1) * STEP_X) / 2, -3.6, 0);
      g.add(rTitle);

      collected.forEach((val, i) => {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 1.2, 1.2),
          new THREE.MeshStandardMaterial({ color: 0x10b981 })
        );
        cube.position.set(i * STEP_X, -4.6, 0);
        g.add(cube);
        const vl = textPlane(String(val), 1.0, 0.55, 'white', 0.7);
        vl.position.set(i * STEP_X, -4.6, 0.63);
        g.add(vl);
      });
    }

    viewerRef.current.scene.add(g);
    viewerRef.current.enableRender();
  };

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 14;
      drawBucket(nums, new Map(), [], -1, []);
    }
    return () => viewerRef.current?.disposeCircus();
  }, []);

  // ── BUCKET SORT SOLVE ──
  const solveBucket = async () => {
    const n = nums.length;
    const freqMap = new Map<number, number>();

    for (const ele of nums) {
      freqMap.set(ele, (freqMap.get(ele) ?? 0) + 1);
      setStep(
        `Building freq map... { ${Array.from(freqMap)
          .map(([v, f]) => `${v}:${f}`)
          .join(', ')} }`
      );
      drawBucket(nums, new Map(freqMap), [], -1, []);
      await sleep(300);
    }

    await sleep(500);

    const buckets: number[][] = Array.from({ length: n + 1 }, () => []);
    freqMap.forEach((freq, val) => buckets[freq].push(val));

    setStep('Placing each value into bucket[frequency]');
    drawBucket(
      nums,
      new Map(freqMap),
      buckets.map((b) => [...b]),
      -1,
      []
    );
    await sleep(1000);

    const collected: number[] = [];
    let kLeft = k;

    for (let i = n; i >= 0 && kLeft > 0; i--) {
      if (buckets[i].length === 0) continue;

      setStep(`Collecting from bucket[${i}]  (frequency = ${i})`);
      drawBucket(
        nums,
        new Map(freqMap),
        buckets.map((b) => [...b]),
        i,
        [...collected]
      );
      await sleep(1000);

      for (const val of buckets[i]) {
        if (kLeft <= 0) break;
        collected.push(val);
        kLeft--;
      }

      drawBucket(
        nums,
        new Map(freqMap),
        buckets.map((b) => [...b]),
        i,
        [...collected]
      );
      await sleep(600);
    }

    setResult(collected);
    setStep(`✅ Done! Top ${k} frequent: [${collected.join(', ')}]`);
    drawBucket(
      nums,
      new Map(freqMap),
      buckets.map((b) => [...b]),
      -1,
      [...collected]
    );
  };

  // ── MIN-HEAP SOLVE ──
  const solveHeap = async () => {
    const freqMap = new Map<number, number>();

    for (const ele of nums) {
      freqMap.set(ele, (freqMap.get(ele) ?? 0) + 1);
      setStep(
        `Building freq map... { ${Array.from(freqMap)
          .map(([v, f]) => `${v}:${f}`)
          .join(', ')} }`
      );
      drawHeap(nums, new Map(freqMap), [], []);
      await sleep(300);
    }

    await sleep(500);

    let heap: [number, number][] = [];
    const entries = Array.from(freqMap.entries()).map(
      ([v, f]) => [f, v] as [number, number]
    );

    for (const [freq, val] of entries) {
      heap.push([freq, val]);
      heap.sort((a, b) => a[0] - b[0]);

      setStep(`Pushed (val=${val}, freq=${freq}) into heap`);
      drawHeap(nums, new Map(freqMap), [...heap], []);
      await sleep(900);

      if (heap.length > k) {
        const popped = heap.shift()!;
        setStep(
          `Heap size > ${k} → pop min-freq (val=${popped[1]}, freq=${popped[0]})`
        );
        drawHeap(nums, new Map(freqMap), [...heap], []);
        await sleep(900);
      }
    }

    const collected = heap.map(([, val]) => val);
    setResult(collected);
    setStep(`✅ Done! Top ${k} frequent: [${collected.join(', ')}]`);
    drawHeap(nums, new Map(freqMap), [...heap], [...collected]);
  };

  const solve = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);
    if (approach === 'bucket') await solveBucket();
    else await solveHeap();
    setIsSolving(false);
  };

  const reset = (n = nums, kv = k, app = approach) => {
    setResult(null);
    setStep('');
    if (app === 'bucket') drawBucket(n, new Map(), [], -1, []);
    else drawHeap(n, new Map(), [], []);
  };

  const applyInput = () => {
    const parsed = numsInput
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (parsed.length >= 1) {
      setNums(parsed);
      reset(parsed, k, approach);
    }
  };

  const loadExample = (raw: string, kv: number) => {
    const parsed = raw.split(',').map(Number);
    setNums(parsed);
    setNumsInput(raw);
    setK(kv);
    reset(parsed, kv, approach);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      <div className='absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded'>
            Medium
          </span>
          <span className='bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'>
            Array
          </span>
          <span className='bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'>
            Hash Table
          </span>
        </div>

        <h2 className='text-xl font-bold mb-2'>347. Top K Frequent Elements</h2>
        <p className='text-sm text-gray-600 mb-3'>
          Return the <code className='bg-gray-100 px-1 rounded'>k</code> most
          frequent elements using bucket sort or a min-heap.
        </p>

        <div className='space-y-2 mb-3'>
          <div>
            <label className='text-xs font-semibold text-gray-500'>
              Array (comma-separated)
            </label>
            <div className='flex gap-1'>
              <input
                type='text'
                value={numsInput}
                onChange={(e) => setNumsInput(e.target.value)}
                className='border rounded px-2 py-1 text-sm flex-1'
                disabled={isSolving}
              />
              <button
                onClick={applyInput}
                className='bg-gray-200 px-2 py-1 rounded text-sm'
                disabled={isSolving}
              >
                Set
              </button>
            </div>
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-500'>k</label>
            <input
              type='number'
              value={k}
              min={1}
              onChange={(e) => {
                const kv = parseInt(e.target.value) || 1;
                setK(kv);
                reset(nums, kv, approach);
              }}
              className='border rounded px-2 py-1 text-sm w-full'
              disabled={isSolving}
            />
          </div>
        </div>

        <div className='mb-3'>
          <label className='text-xs font-semibold text-gray-500 block mb-1'>
            Approach
          </label>
          <div className='flex gap-2'>
            <button
              onClick={() => {
                setApproach('bucket');
                reset(nums, k, 'bucket');
              }}
              className={`flex-1 px-2 py-1 rounded text-sm border ${
                approach === 'bucket'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-300'
              }`}
              disabled={isSolving}
            >
              Bucket Sort
            </button>
            <button
              onClick={() => {
                setApproach('heap');
                reset(nums, k, 'heap');
              }}
              className={`flex-1 px-2 py-1 rounded text-sm border ${
                approach === 'heap'
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'border-gray-300'
              }`}
              disabled={isSolving}
            >
              Min-Heap
            </button>
          </div>
        </div>

        <div className='flex gap-2 mb-3'>
          <button
            onClick={solve}
            className='flex-1 bg-emerald-500 text-white px-3 py-2 rounded text-sm font-semibold'
            disabled={isSolving}
          >
            {isSolving ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={() => reset()}
            className='bg-gray-300 px-3 py-2 rounded text-sm'
            disabled={isSolving}
          >
            Reset
          </button>
        </div>

        {step && (
          <div className='mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs'>
            {step}
          </div>
        )}

        {result !== null && (
          <div className='mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm font-semibold text-emerald-800'>
            Output: [{result.join(', ')}]
          </div>
        )}

        <div className='text-xs text-gray-500 space-y-1 mb-3'>
          {approach === 'bucket' ? (
            <>
              <div>
                <strong>Approach:</strong> Bucket Sort (index = frequency)
              </div>
              <div>
                <strong>Time:</strong> O(n) &nbsp; <strong>Space:</strong> O(n)
              </div>
            </>
          ) : (
            <>
              <div>
                <strong>Approach:</strong> Min-Heap of size k
              </div>
              <div>
                <strong>Time:</strong> O(n log k) &nbsp; <strong>Space:</strong>{' '}
                O(n+k)
              </div>
            </>
          )}
        </div>

        <div className='border-t pt-2'>
          <p className='text-xs font-semibold text-gray-500 mb-2'>
            Test Cases:
          </p>
          <div className='space-y-1'>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex.raw, ex.k)}
                className='block w-full text-left text-xs p-1.5 rounded hover:bg-gray-100 border border-gray-100'
                disabled={isSolving}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopKFrequentProblem;
