import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface FibNode {
  value: number;
  children: FibNode[];
  degree: number;
}

const FibonacciHeapDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [trees, setTrees] = useState<FibNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [minIndex, setMinIndex] = useState(-1);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 8;
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [trees, minIndex]);

  const findMinIndex = (ts: FibNode[]): number => {
    if (ts.length === 0) return -1;
    let mi = 0;
    for (let i = 1; i < ts.length; i++) {
      if (ts[i].value < ts[mi].value) mi = i;
    }
    return mi;
  };

  const countAll = (node: FibNode): number => {
    let c = 1;
    for (const ch of node.children) c += countAll(ch);
    return c;
  };

  const totalNodes = trees.reduce((s, t) => s + countAll(t), 0);

  const insert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    const newNode: FibNode = { value: val, children: [], degree: 0 };
    const newTrees = [...trees, newNode];
    setTrees(newTrees);
    setMinIndex(findMinIndex(newTrees));
    setMessage(`Inserted ${val} - O(1)`);
    setInputValue('');
  };

  const extractMin = () => {
    if (trees.length === 0) { setMessage('Heap is empty'); return; }
    const mi = minIndex >= 0 ? minIndex : findMinIndex(trees);
    const minNode = trees[mi];
    const remaining = [...trees.slice(0, mi), ...trees.slice(mi + 1), ...minNode.children];

    // Consolidate by degree
    const degreeTable: Map<number, FibNode> = new Map();
    const consolidated: FibNode[] = [];
    for (const tree of remaining) {
      let current = { ...tree, children: [...tree.children] };
      while (degreeTable.has(current.degree)) {
        let other = degreeTable.get(current.degree)!;
        degreeTable.delete(current.degree);
        if (other.value < current.value) [current, other] = [other, current];
        current.children = [...current.children, other];
        current.degree++;
      }
      degreeTable.set(current.degree, current);
    }
    degreeTable.forEach((v) => consolidated.push(v));

    setTrees(consolidated);
    setMinIndex(findMinIndex(consolidated));
    setMessage(`Extracted min ${minNode.value} - O(log n) amortized`);
  };

  const generateRandom = () => {
    const vals = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
    const ts: FibNode[] = vals.map((v) => ({ value: v, children: [], degree: 0 }));
    setTrees(ts);
    setMinIndex(findMinIndex(ts));
    setMessage('Generated random Fibonacci Heap');
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();
    let xOffset = -((trees.length - 1) * 2.5) / 2;

    trees.forEach((tree, treeIdx) => {
      drawTree(group, tree, xOffset, 2, 1.5, treeIdx === minIndex);
      xOffset += 2.5;
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawTree = (group: THREE.Group, node: FibNode, x: number, y: number, spread: number, isMin: boolean) => {
    const geo = new THREE.SphereGeometry(0.2, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: isMin && node === node ? 0x10b981 : 0x4287f5 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.set(x, y, 0);
    group.add(sphere);

    // Label
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
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x999999 })));
      drawTree(group, child, cx, cy, childSpread * 0.7, false);
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Fibonacci Heap</h2>
        <div className="mb-2 text-sm">
          <strong>Trees:</strong> {trees.length} | <strong>Nodes:</strong> {totalNodes} |{' '}
          <strong>Min:</strong> {minIndex >= 0 ? trees[minIndex]?.value : 'N/A'}
        </div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <input type="number" placeholder="Value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="flex flex-wrap gap-1">
            <button onClick={insert} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Insert</button>
            <button onClick={extractMin} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Extract Min</button>
            <button onClick={generateRandom} className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Random</button>
            <button onClick={() => { setTrees([]); setMinIndex(-1); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Insert O(1), Extract-Min O(log n) amortized, Find-Min O(1)
        </div>
      </div>
    </div>
  );
};

export default FibonacciHeapDataStructure;
