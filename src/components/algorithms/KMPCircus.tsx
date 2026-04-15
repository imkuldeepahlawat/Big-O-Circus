import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type CharState = 'default' | 'match' | 'mismatch' | 'found';

const KMPCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [text, setText] = useState('ABABDABACDABABCABAB');
  const [pattern, setPattern] = useState('ABABCABAB');
  const [failureTable, setFailureTable] = useState<number[]>([]);
  const [textStates, setTextStates] = useState<CharState[]>([]);
  const [patternOffset, setPatternOffset] = useState(0);
  const [patternIdx, setPatternIdx] = useState(-1);
  const [matches, setMatches] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const animationCancelled = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 0, 14);
      visualizerRef.current.camera.lookAt(0, 0, 0);
      resetState();
    }
    return () => {
      animationCancelled.current = true;
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) updateVisualization();
  }, [textStates, patternOffset, patternIdx, failureTable, matches]);

  const createTextCanvas = (
    txt: string,
    width = 64,
    height = 64,
    fontSize = 28,
    color = 'white'
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, width / 2, height / 2);
    }
    return canvas;
  };

  const getCharColor = (state: CharState): number => {
    switch (state) {
      case 'match':
        return 0x22c55e;
      case 'mismatch':
        return 0xef4444;
      case 'found':
        return 0xffd700;
      default:
        return 0x3b82f6;
    }
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const cellSize = 0.6;
    const offsetX = (-text.length * cellSize) / 2 + cellSize / 2;

    const matchSet = new Set<number>();
    matches.forEach((m) => {
      for (let k = 0; k < pattern.length; k++) matchSet.add(m + k);
    });

    // Text row
    for (let i = 0; i < text.length; i++) {
      const state = textStates[i] || 'default';
      const isFoundChar = matchSet.has(i);
      const color = isFoundChar ? 0xffd700 : getCharColor(state);

      const boxGeo = new THREE.BoxGeometry(cellSize * 0.9, cellSize * 0.9, 0.15);
      const boxMat = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(offsetX + i * cellSize, 1.5, 0);
      group.add(box);

      const tc = createTextCanvas(text[i], 48, 48, 24);
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat);
      plane.position.set(offsetX + i * cellSize, 1.5, 0.12);
      group.add(plane);
    }

    // Pattern row (sliding)
    for (let j = 0; j < pattern.length; j++) {
      const textIdx = patternOffset + j;
      if (textIdx >= text.length) break;

      let color = 0x888888;
      if (j < patternIdx) color = 0x22c55e;
      else if (j === patternIdx) color = 0xffd700;

      const boxGeo = new THREE.BoxGeometry(cellSize * 0.9, cellSize * 0.9, 0.15);
      const boxMat = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(offsetX + textIdx * cellSize, 0.5, 0);
      group.add(box);

      const tc = createTextCanvas(pattern[j], 48, 48, 24);
      const tex = new THREE.CanvasTexture(tc);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat);
      plane.position.set(offsetX + textIdx * cellSize, 0.5, 0.12);
      group.add(plane);
    }

    // Failure table display
    if (failureTable.length > 0) {
      const ftOffsetX = (-pattern.length * cellSize) / 2 + cellSize / 2;
      for (let j = 0; j < pattern.length; j++) {
        // Pattern char
        const pc = createTextCanvas(pattern[j], 48, 48, 20, '#aaaaaa');
        const ptex = new THREE.CanvasTexture(pc);
        const pmat = new THREE.MeshBasicMaterial({ map: ptex, transparent: true });
        const pplane = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), pmat);
        pplane.position.set(ftOffsetX + j * cellSize, -1.5, 0);
        group.add(pplane);

        // Failure value
        const boxGeo = new THREE.BoxGeometry(cellSize * 0.85, cellSize * 0.85, 0.1);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x6366f1 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(ftOffsetX + j * cellSize, -2.3, 0);
        group.add(box);

        const fc = createTextCanvas(failureTable[j].toString(), 48, 48, 22);
        const ftex = new THREE.CanvasTexture(fc);
        const fmat = new THREE.MeshBasicMaterial({ map: ftex, transparent: true });
        const fplane = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), fmat);
        fplane.position.set(ftOffsetX + j * cellSize, -2.3, 0.1);
        group.add(fplane);
      }

      // Failure table label
      const lblCanvas = createTextCanvas('Failure Table', 256, 48, 22);
      const lblTex = new THREE.CanvasTexture(lblCanvas);
      const lblMat = new THREE.MeshBasicMaterial({ map: lblTex, transparent: true });
      const lblPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.4), lblMat);
      lblPlane.position.set(0, -0.8, 0);
      group.add(lblPlane);
    }

    // Title
    const titleCanvas = createTextCanvas('KMP String Matching', 512, 64, 30);
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTex, transparent: true });
    const titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.5), titleMat);
    titlePlane.position.set(0, 3.5, 0);
    group.add(titlePlane);

    // Labels
    const textLbl = createTextCanvas('Text:', 128, 48, 22, '#aaaaaa');
    const textTex = new THREE.CanvasTexture(textLbl);
    const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true });
    const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), textMat);
    textPlane.position.set(offsetX - cellSize * 1.2, 1.5, 0);
    group.add(textPlane);

    const patLbl = createTextCanvas('Pattern:', 128, 48, 20, '#aaaaaa');
    const patTex = new THREE.CanvasTexture(patLbl);
    const patMat = new THREE.MeshBasicMaterial({ map: patTex, transparent: true });
    const patPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), patMat);
    patPlane.position.set(offsetX - cellSize * 1.2, 0.5, 0);
    group.add(patPlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const resetState = (): void => {
    setTextStates(Array(text.length).fill('default'));
    setPatternOffset(0);
    setPatternIdx(-1);
    setFailureTable([]);
    setMatches([]);
    setMessage('');
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const buildFailureTable = (pat: string): number[] => {
    const table = new Array(pat.length).fill(0);
    let len = 0;
    let i = 1;
    while (i < pat.length) {
      if (pat[i] === pat[len]) {
        len++;
        table[i] = len;
        i++;
      } else if (len > 0) {
        len = table[len - 1];
      } else {
        table[i] = 0;
        i++;
      }
    }
    return table;
  };

  const runKMP = async (): Promise<void> => {
    if (isRunning) return;
    setIsRunning(true);
    animationCancelled.current = false;

    resetState();
    await sleep(200);

    // Build failure table
    const ft = buildFailureTable(pattern);
    setFailureTable(ft);
    setMessage('Built failure table');
    await sleep(800);

    const states: CharState[] = Array(text.length).fill('default');
    const foundMatches: number[] = [];
    let i = 0;
    let j = 0;

    while (i < text.length) {
      if (animationCancelled.current) return;

      setPatternOffset(i - j);
      setPatternIdx(j);
      states.fill('default');

      // Highlight matched prefix
      for (let k = 0; k < j; k++) {
        states[i - j + k] = 'match';
      }

      if (text[i] === pattern[j]) {
        states[i] = 'match';
        setTextStates([...states]);
        setMessage(`Match at text[${i}]='${text[i]}', pattern[${j}]='${pattern[j]}'`);
        await sleep(250);
        i++;
        j++;

        if (j === pattern.length) {
          const matchStart = i - j;
          foundMatches.push(matchStart);
          setMatches([...foundMatches]);
          setMessage(`Pattern found at index ${matchStart}!`);
          await sleep(600);
          j = ft[j - 1];
        }
      } else {
        states[i] = 'mismatch';
        setTextStates([...states]);
        setMessage(
          j > 0
            ? `Mismatch: shift pattern using failure table (j=${ft[j - 1]})`
            : `Mismatch: advance text pointer`
        );
        await sleep(350);

        if (j > 0) {
          j = ft[j - 1];
        } else {
          i++;
        }
      }
    }

    setPatternIdx(-1);
    setMessage(
      foundMatches.length > 0
        ? `Done! Found ${foundMatches.length} match(es) at index: ${foundMatches.join(', ')}`
        : 'Done! No matches found.'
    );
    setIsRunning(false);
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsRunning(false);
    resetState();
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>KMP String Matching</h2>

        <div className='mb-2 text-sm'>
          <label className='block mb-1'>
            Text:
            <input
              type='text'
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              className='border rounded px-2 py-1 w-full mt-0.5'
              disabled={isRunning}
            />
          </label>
          <label className='block mb-1'>
            Pattern:
            <input
              type='text'
              value={pattern}
              onChange={(e) => setPattern(e.target.value.toUpperCase())}
              className='border rounded px-2 py-1 w-full mt-0.5'
              disabled={isRunning}
            />
          </label>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={runKMP}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run KMP'}
          </button>
          <button
            onClick={handleReset}
            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>{message}</div>
        )}

        {failureTable.length > 0 && (
          <div className='mb-3 p-2 bg-yellow-50 rounded text-xs'>
            <div className='font-semibold mb-1'>Failure Table:</div>
            <div className='font-mono'>
              [{failureTable.join(', ')}]
            </div>
          </div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Time: <strong>O(n + m)</strong>
          </div>
          <div>
            Space: <strong>O(m)</strong>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#3b82f6' }}></span> Default
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#22c55e' }}></span> Match
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ef4444' }}></span> Mismatch
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ffd700' }}></span> Found
          </div>
        </div>
      </div>
    </div>
  );
};

export default KMPCircus;
