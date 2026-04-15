import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface HuffmanNode {
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
  code?: string;
}

interface HuffmanStep {
  queue: HuffmanNode[];
  mergedNode: HuffmanNode | null;
  tree: HuffmanNode | null;
  codes: Map<string, string>;
  message: string;
}

const FREQ_TABLE: { char: string; freq: number }[] = [
  { char: 'A', freq: 15 },
  { char: 'B', freq: 7 },
  { char: 'C', freq: 6 },
  { char: 'D', freq: 6 },
  { char: 'E', freq: 5 },
  { char: 'F', freq: 4 },
];

function buildHuffmanCodes(node: HuffmanNode, prefix: string, codes: Map<string, string>) {
  if (node.char !== null) {
    codes.set(node.char, prefix || '0');
    return;
  }
  if (node.left) buildHuffmanCodes(node.left, prefix + '0', codes);
  if (node.right) buildHuffmanCodes(node.right, prefix + '1', codes);
}

function computeHuffmanSteps(): HuffmanStep[] {
  const steps: HuffmanStep[] = [];
  const queue: HuffmanNode[] = FREQ_TABLE
    .map((f) => ({ char: f.char, freq: f.freq, left: null, right: null }))
    .sort((a, b) => a.freq - b.freq);

  steps.push({
    queue: [...queue],
    mergedNode: null,
    tree: null,
    codes: new Map(),
    message: `Initial priority queue: ${queue.map((n) => `${n.char}(${n.freq})`).join(', ')}`,
  });

  while (queue.length > 1) {
    const left = queue.shift()!;
    const right = queue.shift()!;
    const merged: HuffmanNode = {
      char: null,
      freq: left.freq + right.freq,
      left,
      right,
    };

    steps.push({
      queue: [...queue],
      mergedNode: merged,
      tree: null,
      codes: new Map(),
      message: `Merge ${left.char || '*'}(${left.freq}) + ${right.char || '*'}(${right.freq}) = *(${merged.freq})`,
    });

    // Insert merged node in sorted position
    let inserted = false;
    for (let i = 0; i < queue.length; i++) {
      if (merged.freq <= queue[i].freq) {
        queue.splice(i, 0, merged);
        inserted = true;
        break;
      }
    }
    if (!inserted) queue.push(merged);

    steps.push({
      queue: [...queue],
      mergedNode: null,
      tree: null,
      codes: new Map(),
      message: `Queue after insert: ${queue.map((n) => `${n.char || '*'}(${n.freq})`).join(', ')}`,
    });
  }

  const root = queue[0];
  const codes = new Map<string, string>();
  buildHuffmanCodes(root, '', codes);

  steps.push({
    queue: [],
    mergedNode: null,
    tree: root,
    codes,
    message: `Huffman tree built! Codes: ${Array.from(codes.entries()).map(([c, code]) => `${c}=${code}`).join(', ')}`,
  });

  return steps;
}

const HuffmanCodingCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<HuffmanStep | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2, 14);
      viewerRef.current.camera.lookAt(0, 0, 0);
      renderScene(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderScene(currentStep);
  }, [currentStep]);

  const addTextLabel = (
    text: string, x: number, y: number, z: number,
    group: THREE.Group, fillColor: string = '#ffffff', fontSize: number = 48
  ): void => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = fillColor;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeom = new THREE.PlaneGeometry(1.2, 0.6);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(labelGeom, labelMat);
    label.position.set(x, y, z);
    group.add(label);
  };

  const renderTreeNode = (
    node: HuffmanNode, x: number, y: number, spread: number, group: THREE.Group
  ): void => {
    const isLeaf = node.char !== null;
    const color = isLeaf ? 0x22c55e : 0x4287f5;

    const geom = new THREE.SphereGeometry(0.4, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color });
    const sphere = new THREE.Mesh(geom, mat);
    sphere.position.set(x, y, 0);
    group.add(sphere);

    const label = isLeaf ? `${node.char}(${node.freq})` : `${node.freq}`;
    addTextLabel(label, x, y, 0.5, group, '#ffffff', 32);

    if (node.left) {
      const lx = x - spread;
      const ly = y - 1.8;
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, 0),
        new THREE.Vector3(lx, ly, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      group.add(new THREE.Line(lineGeom, lineMat));

      // "0" label on left edge
      addTextLabel('0', (x + lx) / 2 - 0.3, (y + ly) / 2, 0.1, group, '#ffcc00', 28);

      renderTreeNode(node.left, lx, ly, spread * 0.55, group);
    }

    if (node.right) {
      const rx = x + spread;
      const ry = y - 1.8;
      const lineGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, 0),
        new THREE.Vector3(rx, ry, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
      group.add(new THREE.Line(lineGeom, lineMat));

      // "1" label on right edge
      addTextLabel('1', (x + rx) / 2 + 0.3, (y + ry) / 2, 0.1, group, '#ffcc00', 28);

      renderTreeNode(node.right, rx, ry, spread * 0.55, group);
    }
  };

  const renderScene = (step: HuffmanStep | null): void => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    if (step?.tree) {
      // Render the complete Huffman tree
      renderTreeNode(step.tree, 0, 4, 4.0, group);
    } else if (step) {
      // Render the priority queue as boxes
      const spacing = 2.0;
      const startX = -((step.queue.length - 1) * spacing) / 2;

      addTextLabel('Priority Queue', 0, 3, 0, group, '#aaaaaa', 28);

      for (let i = 0; i < step.queue.length; i++) {
        const node = step.queue[i];
        const x = startX + i * spacing;
        const heightScale = 0.3 + (node.freq / 20) * 2.0;

        const color = node.char !== null ? 0x22c55e : 0x4287f5;
        const geom = new THREE.BoxGeometry(1.2, heightScale, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color });
        const box = new THREE.Mesh(geom, mat);
        box.position.set(x, heightScale / 2 - 1, 0);
        group.add(box);

        const label = node.char !== null ? `${node.char}` : '*';
        addTextLabel(label, x, heightScale + 0.1 - 1, 0.31, group, '#ffffff', 32);
        addTextLabel(`${node.freq}`, x, heightScale - 0.5 - 1, 0.31, group, '#cccccc', 24);
      }

      // Show the merged node being created
      if (step.mergedNode) {
        const mx = 0;
        const my = -3;
        const mGeom = new THREE.BoxGeometry(1.5, 1.0, 0.6);
        const mMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
        const mBox = new THREE.Mesh(mGeom, mMat);
        mBox.position.set(mx, my, 0);
        group.add(mBox);

        addTextLabel(`*(${step.mergedNode.freq})`, mx, my, 0.31, group, '#ffffff', 28);
        addTextLabel('Merging...', mx, my - 1, 0, group, '#eab308', 22);
      }
    } else {
      // Initial state: show frequency table
      const spacing = 2.0;
      const startX = -((FREQ_TABLE.length - 1) * spacing) / 2;

      addTextLabel('Frequency Table', 0, 3, 0, group, '#aaaaaa', 28);

      for (let i = 0; i < FREQ_TABLE.length; i++) {
        const entry = FREQ_TABLE[i];
        const x = startX + i * spacing;
        const heightScale = 0.3 + (entry.freq / 20) * 2.0;

        const geom = new THREE.BoxGeometry(1.2, heightScale, 0.6);
        const mat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
        const box = new THREE.Mesh(geom, mat);
        box.position.set(x, heightScale / 2 - 1, 0);
        group.add(box);

        addTextLabel(entry.char, x, heightScale + 0.1 - 1, 0.31, group, '#ffffff', 36);
        addTextLabel(`${entry.freq}`, x, heightScale - 0.5 - 1, 0.31, group, '#cccccc', 24);
      }
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);

    const steps = computeHuffmanSteps();
    let idx = 0;

    intervalRef.current = setInterval(() => {
      if (idx < steps.length) {
        setCurrentStep(steps[idx]);
        idx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
      }
    }, 1200);
  };

  const handleReset = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentStep(null);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>Huffman Coding</h3>

        <div className='flex gap-2 mb-3'>
          <button onClick={handleRun} disabled={isRunning} className='bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50'>Run</button>
          <button onClick={handleReset} className='bg-red-500 text-white px-4 py-2 rounded'>Reset</button>
        </div>

        <div className='text-xs text-gray-600 mb-2'>
          <p className='font-semibold'>Complexity: O(n log n)</p>
          <p>Greedy prefix-free encoding.</p>
        </div>

        <div className='text-xs'>
          <h4 className='font-semibold mb-1'>Frequency Table:</h4>
          <table className='border-collapse w-full'>
            <thead>
              <tr>
                <th className='border px-2 py-1'>Char</th>
                <th className='border px-2 py-1'>Freq</th>
                {currentStep?.codes.size ? <th className='border px-2 py-1'>Code</th> : null}
              </tr>
            </thead>
            <tbody>
              {FREQ_TABLE.map((f) => (
                <tr key={f.char}>
                  <td className='border px-2 py-1 text-center'>{f.char}</td>
                  <td className='border px-2 py-1 text-center'>{f.freq}</td>
                  {currentStep?.codes.size ? (
                    <td className='border px-2 py-1 text-center font-mono'>
                      {currentStep.codes.get(f.char) || '-'}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' /> Leaf node
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-blue-500' /> Internal node
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400' /> Merging
          </div>
        </div>
      </div>

      {currentStep && (
        <div className='absolute bottom-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-md'>
          <p className='text-sm'>{currentStep.message}</p>
        </div>
      )}

      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Huffman Coding</h3>
          <p className='text-sm'>
            Huffman Coding is a greedy algorithm for lossless data compression. It
            builds an optimal prefix-free binary code by repeatedly merging the two
            lowest-frequency symbols into a combined node. Characters with higher
            frequencies get shorter codes, minimizing the total encoded length.
          </p>
        </div>
      )}
    </div>
  );
};

export default HuffmanCodingCircus;
