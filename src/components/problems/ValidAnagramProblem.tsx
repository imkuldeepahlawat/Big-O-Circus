import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

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
  { s: 'anagram', t: 'nagaram', label: '"anagram","nagaram" → true' },
  { s: 'rat', t: 'car', label: '"rat","car" → false' },
  { s: 'listen', t: 'silent', label: '"listen","silent" → true' },
  { s: 'abc', t: 'cba', label: '"abc","cba" → true' },
  { s: 'hello', t: 'world', label: '"hello","world" → false' },
  { s: 'ab', t: 'a', label: '"ab","a" → false (diff lengths)' },
];

type Phase = 'idle' | 's' | 't' | 'done';

const ValidAnagramProblem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [s, setS] = useState('anagram');
  const [t, setT] = useState('nagaram');
  const [step, setStep] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  const draw = (
    sStr: string,
    tStr: string,
    counts: number[],
    sIdx: number,
    tIdx: number,
    phase: Phase
  ) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const g = new THREE.Group();

    const maxLen = Math.max(sStr.length, tStr.length, 1);

    // ── String s row ──
    const sRowLbl = textPlane('s =', 0.8, 0.38, '#3b82f6', 0.55);
    sRowLbl.position.set(-((maxLen * 1.25) / 2) - 0.2, 2.5, 0);
    g.add(sRowLbl);

    sStr.split('').forEach((ch, i) => {
      const active = phase === 's' && i === sIdx;
      const color = active ? 0xfbbf24 : 0x3b82f6;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(i * 1.25, 2.5, 0);
      g.add(cube);

      const cl = textPlane(ch, 0.85, 0.85, 'white', 0.65);
      cl.position.set(i * 1.25, 2.5, 0.58);
      g.add(cl);
    });

    // ── String t row ──
    const tRowLbl = textPlane('t =', 0.8, 0.38, '#a855f7', 0.55);
    tRowLbl.position.set(-((maxLen * 1.25) / 2) - 0.2, 0.9, 0);
    g.add(tRowLbl);

    tStr.split('').forEach((ch, i) => {
      const active = phase === 't' && i === tIdx;
      const color = active ? 0xfbbf24 : 0xa855f7;
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.1, 1.1),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(i * 1.25, 0.9, 0);
      g.add(cube);

      const cl = textPlane(ch, 0.85, 0.85, 'white', 0.65);
      cl.position.set(i * 1.25, 0.9, 0.58);
      g.add(cl);
    });

    // ── Frequency bar chart ──
    const relevant = Array.from(
      new Set([...sStr.split(''), ...tStr.split('')])
    ).sort();

    const barTitle = textPlane('count[ ]', 2.0, 0.35, '#6b7280', 0.5);
    barTitle.position.set(((relevant.length - 1) * 1.2) / 2, -0.6, 0);
    g.add(barTitle);

    relevant.forEach((ch, i) => {
      const code = ch.charCodeAt(0) - 97;
      const cnt = counts[code] ?? 0;
      const absH = Math.abs(cnt) * 0.38 + 0.08;
      const barColor = cnt > 0 ? 0x10b981 : cnt < 0 ? 0xef4444 : 0xd1d5db;
      const barY = -1.4 - absH / 2;

      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, absH, 0.5),
        new THREE.MeshStandardMaterial({ color: barColor })
      );
      bar.position.set(i * 1.2, barY, 0);
      g.add(bar);

      // char label
      const cl = textPlane(ch, 0.7, 0.35, '#374151', 0.6);
      cl.position.set(i * 1.2, -1.18, 0);
      g.add(cl);

      // count on bar
      if (cnt !== 0) {
        const nl = textPlane(String(cnt), 0.7, 0.3, 'white', 0.65);
        nl.position.set(i * 1.2, barY, 0.3);
        g.add(nl);
      }
    });

    g.position.x = -((maxLen - 1) * 1.25) / 2;
    viewerRef.current.scene.add(g);
    viewerRef.current.enableRender();
  };

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 10;
      draw(s, t, new Array(128).fill(0), -1, -1, 'idle');
    }
    return () => viewerRef.current?.disposeCircus();
  }, []);

  const solve = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);

    const counts = new Array(128).fill(0);

    // Phase 1: increment for s
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i) - 97;
      counts[code]++;
      setStep(`s[${i}] = '${s[i]}' → count['${s[i]}']++ = ${counts[code]}`);
      draw(s, t, [...counts], i, -1, 's');
      await sleep(850);
    }

    await sleep(400);

    // Phase 2: decrement for t
    for (let i = 0; i < t.length; i++) {
      const code = t.charCodeAt(i) - 97;
      counts[code]--;
      setStep(`t[${i}] = '${t[i]}' → count['${t[i]}']-- = ${counts[code]}`);
      draw(s, t, [...counts], -1, i, 't');
      await sleep(850);
    }

    await sleep(400);

    // Phase 3: check all zero
    const allZero = counts.every((v) => v === 0);
    setResult(allZero);
    setStep(
      allZero
        ? '✅ All counts are 0 → valid anagram → true'
        : '❌ Non-zero counts remain → not an anagram → false'
    );
    draw(s, t, [...counts], -1, -1, 'done');
    setIsSolving(false);
  };

  const reset = (sv = s, tv = t) => {
    setResult(null);
    setStep('');
    draw(sv, tv, new Array(128).fill(0), -1, -1, 'idle');
  };

  const loadExample = (sv: string, tv: string) => {
    setS(sv);
    setT(tv);
    reset(sv, tv);
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

        <h2 className='text-xl font-bold mb-2'>242. Valid Anagram</h2>
        <p className='text-sm text-gray-600 mb-3'>
          Return <code className='bg-gray-100 px-1 rounded'>true</code> if{' '}
          <code className='bg-gray-100 px-1 rounded'>t</code> is an anagram of{' '}
          <code className='bg-gray-100 px-1 rounded'>s</code> using a character
          frequency count array.
        </p>

        <div className='space-y-2 mb-3'>
          <div>
            <label className='text-xs font-semibold text-gray-500'>
              String s
            </label>
            <input
              type='text'
              value={s}
              onChange={(e) => {
                setS(e.target.value);
                reset(e.target.value, t);
              }}
              className='border rounded px-2 py-1 text-sm w-full'
              disabled={isSolving}
            />
          </div>
          <div>
            <label className='text-xs font-semibold text-gray-500'>
              String t
            </label>
            <input
              type='text'
              value={t}
              onChange={(e) => {
                setT(e.target.value);
                reset(s, e.target.value);
              }}
              className='border rounded px-2 py-1 text-sm w-full'
              disabled={isSolving}
            />
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
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            Output: <strong>{String(result)}</strong>
          </div>
        )}

        <div className='text-xs text-gray-500 space-y-1 mb-3'>
          <div>
            <strong>Approach:</strong> count[s[i]]++ then count[t[i]]--
          </div>
          <div>
            <strong>Time:</strong> O(n) &nbsp; <strong>Space:</strong> O(1)
          </div>
          <div className='flex gap-3 mt-1 flex-wrap'>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-3 rounded-sm bg-emerald-500 inline-block' />{' '}
              +count (from s)
            </span>
            <span className='flex items-center gap-1'>
              <span className='w-3 h-3 rounded-sm bg-red-400 inline-block' />{' '}
              −count (from t)
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
                onClick={() => loadExample(ex.s, ex.t)}
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

export default ValidAnagramProblem;
