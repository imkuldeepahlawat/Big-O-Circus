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

const GROUP_COLORS = [
  0x4287f5, 0x10b981, 0xf59e0b, 0xa855f7, 0xef4444, 0x06b6d4, 0xf97316,
  0x84cc16,
];

const GROUP_HEX = [
  '#4287f5',
  '#10b981',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#84cc16',
];

const EXAMPLES = [
  {
    raw: 'eat,tea,tan,ate,nat,bat',
    label: '["eat","tea","tan","ate","nat","bat"]',
  },
  { raw: 'abc,bca,cab,xyz,zyx', label: '["abc","bca","cab","xyz","zyx"]' },
  { raw: 'dog,god,log,gel,leg', label: '["dog","god","log","gel","leg"]' },
  { raw: 'a,b,c', label: '["a","b","c"] → 3 solo groups' },
  { raw: 'ab,ba,cd,dc,ef', label: '["ab","ba","cd","dc","ef"]' },
];

const GroupAnagramsProblem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [strs, setStrs] = useState(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']);
  const [strsInput, setStrsInput] = useState('eat,tea,tan,ate,nat,bat');
  const [step, setStep] = useState('');
  const [result, setResult] = useState<string[][] | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  const draw = (
    words: string[],
    keyMap: Map<string, string>,
    colorMap: Map<string, number>,
    curIdx: number
  ) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const g = new THREE.Group();

    const WORD_STEP = 2.1;
    const wordW = 1.8;
    const wordH = 0.9;

    // ── Input row title ──
    const rowTitle = textPlane('Input Strings', 2.4, 0.38, '#6b7280', 0.5);
    rowTitle.position.set(((words.length - 1) * WORD_STEP) / 2, 3.2, 0);
    g.add(rowTitle);

    words.forEach((word, i) => {
      const groupIdx = colorMap.get(word) ?? -1;
      const isCurrent = i === curIdx;
      const color = isCurrent
        ? 0xfbbf24
        : groupIdx >= 0
          ? GROUP_COLORS[groupIdx % GROUP_COLORS.length]
          : 0x94a3b8;

      // Word cube
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(wordW, wordH, 0.8),
        new THREE.MeshStandardMaterial({ color })
      );
      cube.position.set(i * WORD_STEP, 2.3, 0);
      g.add(cube);

      const wl = textPlane(word, wordW - 0.1, wordH - 0.1, 'white', 0.62);
      wl.position.set(i * WORD_STEP, 2.3, 0.42);
      g.add(wl);

      // Sorted key shown below word
      const key = keyMap.get(word);
      if (key !== undefined) {
        const kl = textPlane(
          `"${key}"`,
          wordW,
          0.34,
          isCurrent ? '#fbbf24' : '#6b7280',
          0.56
        );
        kl.position.set(i * WORD_STEP, 1.6, 0);
        g.add(kl);

        const arrow = textPlane('↑ key', wordW * 0.7, 0.28, '#9ca3af', 0.6);
        arrow.position.set(i * WORD_STEP, 1.27, 0);
        g.add(arrow);
      }
    });

    // ── Groups section ──
    const groups = new Map<number, string[]>();
    colorMap.forEach((groupIdx, word) => {
      if (!groups.has(groupIdx)) groups.set(groupIdx, []);
      groups.get(groupIdx)!.push(word);
    });

    if (groups.size > 0) {
      const groupTitle = textPlane('Groups', 1.6, 0.38, '#6b7280', 0.5);
      groupTitle.position.set(
        ((groups.size - 1) * WORD_STEP * 1.1) / 2,
        0.4,
        0
      );
      g.add(groupTitle);

      let col = 0;
      groups.forEach((groupWords, groupIdx) => {
        const gColor = GROUP_COLORS[groupIdx % GROUP_COLORS.length];

        groupWords.forEach((word, row) => {
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(wordW, wordH * 0.9, 0.7),
            new THREE.MeshStandardMaterial({ color: gColor })
          );
          cube.position.set(col * WORD_STEP * 1.1, -0.45 - row * 1.1, 0);
          g.add(cube);

          const wl = textPlane(
            word,
            wordW - 0.1,
            wordH * 0.9 - 0.1,
            'white',
            0.6
          );
          wl.position.set(col * WORD_STEP * 1.1, -0.45 - row * 1.1, 0.38);
          g.add(wl);
        });

        col++;
      });
    }

    g.position.x = -((words.length - 1) * WORD_STEP) / 2;
    viewerRef.current.scene.add(g);
    viewerRef.current.enableRender();
  };

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 14;
      draw(strs, new Map(), new Map(), -1);
    }
    return () => viewerRef.current?.disposeCircus();
  }, []);

  const solve = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);

    const mp = new Map<string, string[]>();
    const keyMap = new Map<string, string>();
    const colorMap = new Map<string, number>();
    const keyToGroup = new Map<string, number>();
    let nextGroup = 0;

    for (let i = 0; i < strs.length; i++) {
      const word = strs[i];
      setStep(`Processing "${word}" → sorting characters...`);
      draw(strs, new Map(keyMap), new Map(colorMap), i);
      await sleep(800);

      const sorted = word.split('').sort().join('');
      keyMap.set(word, sorted);

      setStep(`"${word}" sorted = "${sorted}" → use as map key`);
      draw(strs, new Map(keyMap), new Map(colorMap), i);
      await sleep(900);

      if (!mp.has(sorted)) {
        mp.set(sorted, []);
        keyToGroup.set(sorted, nextGroup++);
      }
      mp.get(sorted)!.push(word);

      const groupIdx = keyToGroup.get(sorted)!;
      colorMap.set(word, groupIdx);

      setStep(`"${word}" → group ${groupIdx}  (key = "${sorted}")`);
      draw(strs, new Map(keyMap), new Map(colorMap), i);
      await sleep(800);
    }

    const ans = Array.from(mp.values());
    setResult(ans);
    setStep(`✅ Done! ${ans.length} group${ans.length !== 1 ? 's' : ''} found`);
    draw(strs, new Map(keyMap), new Map(colorMap), -1);
    setIsSolving(false);
  };

  const reset = (words = strs) => {
    setResult(null);
    setStep('');
    draw(words, new Map(), new Map(), -1);
  };

  const applyInput = () => {
    const parsed = strsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parsed.length >= 1) {
      setStrs(parsed);
      reset(parsed);
    }
  };

  const loadExample = (raw: string) => {
    const parsed = raw.split(',').map((s) => s.trim());
    setStrs(parsed);
    setStrsInput(raw);
    reset(parsed);
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

        <h2 className='text-xl font-bold mb-2'>49. Group Anagrams</h2>
        <p className='text-sm text-gray-600 mb-3'>
          Group strings that are anagrams together. Key insight: sort each word
          alphabetically to get a canonical key, then group by that key.
        </p>

        <div className='space-y-2 mb-3'>
          <label className='text-xs font-semibold text-gray-500'>
            Strings (comma-separated)
          </label>
          <div className='flex gap-1'>
            <input
              type='text'
              value={strsInput}
              onChange={(e) => setStrsInput(e.target.value)}
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
          <div className='mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800'>
            <strong>Output:</strong>
            <div className='mt-1 space-y-0.5'>
              {result.map((group, i) => (
                <div
                  key={i}
                  className='text-xs font-medium'
                  style={{ color: GROUP_HEX[i % GROUP_HEX.length] }}
                >
                  ● [{group.map((w) => `"${w}"`).join(', ')}]
                </div>
              ))}
            </div>
          </div>
        )}

        <div className='text-xs text-gray-500 space-y-1 mb-3'>
          <div>
            <strong>Key:</strong> sort(word) → canonical anagram key
          </div>
          <div>
            <strong>Time:</strong> O(n·k log k) &nbsp; <strong>Space:</strong>{' '}
            O(nk)
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

export default GroupAnagramsProblem;
