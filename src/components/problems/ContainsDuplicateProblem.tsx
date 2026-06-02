import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

// Canvas pixels scale with plane dimensions → correct aspect ratio, no stretching
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
  { raw: '1,2,3,1', label: '[1,2,3,1] → true' },
  { raw: '1,2,3,4', label: '[1,2,3,4] → false' },
  { raw: '7,7', label: '[7,7] → true' },
  { raw: '-1,0,1,-1', label: '[-1,0,1,-1] → true' },
  { raw: '10,20,30,40,50', label: '[10,20,30,40,50] → false' },
  { raw: '1,1,1,3,3,4,3,2,4,2', label: '[1,1,1,3,3,4,...] → true' },
];

const ContainsDuplicateProblem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [nums, setNums] = useState([1, 2, 3, 1]);
  const [numsInput, setNumsInput] = useState('1,2,3,1');
  const [step, setStep] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  const draw = (
    currentNums: number[],
    curIdx: number,
    seenArr: number[],
    dupIdx: number,
    found: boolean | null
  ) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const g = new THREE.Group();

    // ── Array row ──
    const arrLbl = textPlane('Array', 1.6, 0.4, '#6b7280', 0.5);
    arrLbl.position.set(-0.8, 1.8, 0);
    g.add(arrLbl);

    currentNums.forEach((val, i) => {
      let color = 0x4287f5;
      if (found !== null && i === dupIdx) color = 0xef4444;
      else if (found === false) color = 0x10b981;
      else if (i === curIdx) color = 0xfbbf24;

      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(i * 1.6, 0.7, 0);
      g.add(cube);

      // value on cube face
      const vl = textPlane(String(val), 1.0, 0.55, 'white', 0.7);
      vl.position.set(i * 1.6, 0.7, 0.62);
      g.add(vl);

      // index below cube
      const il = textPlane(`[${i}]`, 0.8, 0.32, '#9ca3af', 0.6);
      il.position.set(i * 1.6, -0.03, 0.62);
      g.add(il);
    });

    // ── Seen Set row ──
    if (seenArr.length > 0 || curIdx >= 0) {
      const setLbl = textPlane('Seen Set', 2.0, 0.4, '#10b981', 0.5);
      setLbl.position.set(-0.6, -1.4, 0);
      g.add(setLbl);
    }

    seenArr.forEach((val, i) => {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.0, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x10b981 })
      );
      cube.position.set(i * 1.4, -2.4, 0);
      g.add(cube);

      const vl = textPlane(String(val), 0.85, 0.5, 'white', 0.7);
      vl.position.set(i * 1.4, -2.4, 0.52);
      g.add(vl);
    });

    g.position.x = -((currentNums.length - 1) * 1.6) / 2;
    viewerRef.current.scene.add(g);
    viewerRef.current.enableRender();
  };

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 9;
      draw(nums, -1, [], -1, null);
    }
    return () => viewerRef.current?.disposeCircus();
  }, []);

  const solve = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);

    const seen = new Set<number>();
    const seenArr: number[] = [];

    for (let i = 0; i < nums.length; i++) {
      setStep(`Step ${i + 1}: checking nums[${i}] = ${nums[i]}`);
      draw(nums, i, [...seenArr], -1, null);
      await sleep(900);

      if (seen.has(nums[i])) {
        setResult(true);
        setStep(`🔴 Duplicate! ${nums[i]} is already in the set → return true`);
        draw(nums, i, [...seenArr], i, true);
        setIsSolving(false);
        return;
      }

      setStep(`${nums[i]} not in set → inserting into set`);
      seen.add(nums[i]);
      seenArr.push(nums[i]);
      draw(nums, i, [...seenArr], -1, null);
      await sleep(800);
    }

    setResult(false);
    setStep('✅ Traversal complete — no duplicates found → return false');
    draw(nums, -1, [...seenArr], -1, false);
    setIsSolving(false);
  };

  const reset = (n = nums) => {
    setResult(null);
    setStep('');
    draw(n, -1, [], -1, null);
  };

  const applyInput = () => {
    const parsed = numsInput
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (parsed.length >= 1) {
      setNums(parsed);
      reset(parsed);
    }
  };

  const loadExample = (raw: string) => {
    const parsed = raw.split(',').map(Number);
    setNums(parsed);
    setNumsInput(raw);
    reset(parsed);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      <div className='absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center gap-2 mb-2'>
          <span className='bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded'>
            Easy
          </span>
          <span className='bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'>
            Array
          </span>
          <span className='bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded'>
            Hash Table
          </span>
        </div>

        <h2 className='text-xl font-bold mb-2'>217. Contains Duplicate</h2>
        <p className='text-sm text-gray-600 mb-3'>
          Given an integer array{' '}
          <code className='bg-gray-100 px-1 rounded'>nums</code>, return{' '}
          <code className='bg-gray-100 px-1 rounded'>true</code> if any value
          appears at least twice.
        </p>

        <div className='space-y-2 mb-3'>
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
          <div
            className={`mb-2 p-2 rounded text-sm font-semibold ${
              result
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            Output: <strong>{String(result)}</strong>
          </div>
        )}

        <div className='text-xs text-gray-500 space-y-1 mb-3'>
          <div>
            <strong>Approach:</strong> Hash Set — insert &amp; lookup each
            element
          </div>
          <div>
            <strong>Time:</strong> O(n) &nbsp; <strong>Space:</strong> O(n)
          </div>
          <div className='flex gap-3 mt-1 flex-wrap'>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-3 rounded-sm bg-yellow-400 inline-block' />{' '}
              current
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-3 rounded-sm bg-red-400 inline-block' />{' '}
              duplicate
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-3 rounded-sm bg-emerald-500 inline-block' />{' '}
              unique
            </span>
          </div>
        </div>

        <div className='border-t pt-2'>
          <p className='text-xs font-semibold text-gray-500 mb-2'>
            Test Cases:
          </p>
          <div className='space-y-1'>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => loadExample(ex.raw)}
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

export default ContainsDuplicateProblem;
