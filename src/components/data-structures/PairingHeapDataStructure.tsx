import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface PairNode {
  value: number;
  children: PairNode[];
}

const PairingHeapDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<PairNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 8;
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [root]);

  const meld = (a: PairNode | null, b: PairNode | null): PairNode | null => {
    if (!a) return b;
    if (!b) return a;
    if (a.value <= b.value) {
      return { value: a.value, children: [...a.children, b] };
    }
    return { value: b.value, children: [...b.children, a] };
  };

  const countNodes = (node: PairNode | null): number => {
    if (!node) return 0;
    let c = 1;
    for (const ch of node.children) c += countNodes(ch);
    return c;
  };

  const insert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    const newNode: PairNode = { value: val, children: [] };
    setRoot(meld(root, newNode));
    setMessage(`Inserted ${val} - O(1)`);
    setInputValue('');
  };

  const extractMin = () => {
    if (!root) { setMessage('Heap is empty'); return; }
    const minVal = root.value;
    const children = root.children;

    // Two-pass pairing
    const pairs: PairNode[] = [];
    for (let i = 0; i < children.length; i += 2) {
      if (i + 1 < children.length) {
        pairs.push(meld(children[i], children[i + 1])!);
      } else {
        pairs.push(children[i]);
      }
    }

    let result: PairNode | null = null;
    for (let i = pairs.length - 1; i >= 0; i--) {
      result = meld(result, pairs[i]);
    }

    setRoot(result);
    setMessage(`Extracted min ${minVal} - O(log n) amortized`);
  };

  const generateRandom = () => {
    let r: PairNode | null = null;
    const vals = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
    for (const v of vals) r = meld(r, { value: v, children: [] });
    setRoot(r);
    setMessage('Generated random Pairing Heap');
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    if (!root) { viewerRef.current.enableRender(); return; }
    const group = new THREE.Group();
    drawNode(group, root, 0, 2, 6, true);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawNode = (group: THREE.Group, node: PairNode, x: number, y: number, spread: number, isRoot: boolean) => {
    const geo = new THREE.SphereGeometry(0.2, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: isRoot ? 0x10b981 : 0x4287f5 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(x, y, 0);
    group.add(sphere);

    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white'; ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.value.toString(), 32, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), labelMat);
    label.position.set(x, y + 0.35, 0);
    group.add(label);

    const childSpread = spread / Math.max(node.children.length, 1);
    node.children.forEach((child, i) => {
      const cx = x + (i - (node.children.length - 1) / 2) * childSpread;
      const cy = y - 1.2;
      const pts = [new THREE.Vector3(x, y, 0), new THREE.Vector3(cx, cy, 0)];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x999999 })));
      drawNode(group, child, cx, cy, childSpread * 0.6, false);
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Pairing Heap</h2>
        <div className="mb-2 text-sm">
          <strong>Nodes:</strong> {countNodes(root)} | <strong>Min:</strong> {root?.value ?? 'N/A'}
        </div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <input type="number" placeholder="Value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="flex flex-wrap gap-1">
            <button onClick={insert} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Insert</button>
            <button onClick={extractMin} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Extract Min</button>
            <button onClick={generateRandom} className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Random</button>
            <button onClick={() => { setRoot(null); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Insert O(1), Extract-Min O(log n) amortized, Meld O(1)
          <br /><strong>Pairing:</strong> On extract-min, children are paired left-to-right then merged right-to-left.
        </div>
      </div>
    </div>
  );
};

export default PairingHeapDataStructure;
