import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BinNode {
  value: number;
  degree: number;
  children: BinNode[];
}

const BinomialHeapDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [trees, setTrees] = useState<BinNode[]>([]);
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

  useEffect(() => { updateVisualization(); }, [trees]);

  const mergeTrees = (a: BinNode, b: BinNode): BinNode => {
    if (a.value > b.value) [a, b] = [b, a];
    return { value: a.value, degree: a.degree + 1, children: [...a.children, b] };
  };

  const mergeHeaps = (h1: BinNode[], h2: BinNode[]): BinNode[] => {
    const all = [...h1, ...h2].sort((a, b) => a.degree - b.degree);
    const result: BinNode[] = [];

    for (const tree of all) {
      if (result.length > 0 && result[result.length - 1].degree === tree.degree) {
        result[result.length - 1] = mergeTrees(result[result.length - 1], tree);
        // Check if we need to carry again
        while (
          result.length >= 2 &&
          result[result.length - 1].degree === result[result.length - 2].degree
        ) {
          const t1 = result.pop()!;
          const t2 = result.pop()!;
          result.push(mergeTrees(t1, t2));
        }
      } else {
        result.push(tree);
      }
    }
    return result;
  };

  const countAll = (node: BinNode): number => {
    let c = 1;
    for (const ch of node.children) c += countAll(ch);
    return c;
  };

  const totalNodes = trees.reduce((s, t) => s + countAll(t), 0);
  const minTree = trees.length > 0 ? trees.reduce((min, t) => (t.value < min.value ? t : min)) : null;

  const insert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) { setMessage('Enter a valid number'); return; }
    const newNode: BinNode = { value: val, degree: 0, children: [] };
    setTrees(mergeHeaps(trees, [newNode]));
    setMessage(`Inserted ${val} - O(log n)`);
    setInputValue('');
  };

  const extractMin = () => {
    if (trees.length === 0) { setMessage('Heap is empty'); return; }
    const mi = trees.reduce((minIdx, t, i, arr) => (t.value < arr[minIdx].value ? i : minIdx), 0);
    const minNode = trees[mi];
    const remaining = [...trees.slice(0, mi), ...trees.slice(mi + 1)];
    const childTrees = minNode.children.map((c, i) => ({ ...c, degree: i }));
    setTrees(mergeHeaps(remaining, childTrees));
    setMessage(`Extracted min ${minNode.value} - O(log n)`);
  };

  const generateRandom = () => {
    let h: BinNode[] = [];
    const vals = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
    for (const v of vals) h = mergeHeaps(h, [{ value: v, degree: 0, children: [] }]);
    setTrees(h);
    setMessage('Generated random Binomial Heap');
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();
    let xOffset = -((trees.length - 1) * 2.5) / 2;

    trees.forEach((tree) => {
      const treeWidth = Math.pow(2, tree.degree) * 0.8;
      drawNode(group, tree, xOffset, 2, treeWidth, tree === minTree);
      xOffset += treeWidth + 1;
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawNode = (group: THREE.Group, node: BinNode, x: number, y: number, spread: number, isMin: boolean) => {
    const geo = new THREE.SphereGeometry(0.2, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: isMin ? 0x10b981 : 0x4287f5 });
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
        <h2 className="text-xl font-bold mb-3">Binomial Heap</h2>
        <div className="mb-2 text-sm">
          <strong>Trees:</strong> {trees.length} ({trees.map((t) => `B${t.degree}`).join(', ') || 'none'}) |{' '}
          <strong>Nodes:</strong> {totalNodes} | <strong>Min:</strong> {minTree?.value ?? 'N/A'}
        </div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <input type="number" placeholder="Value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="flex flex-wrap gap-1">
            <button onClick={insert} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Insert</button>
            <button onClick={extractMin} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Extract Min</button>
            <button onClick={generateRandom} className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Random</button>
            <button onClick={() => { setTrees([]); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Insert O(log n), Extract-Min O(log n), Merge O(log n)
          <br /><strong>Structure:</strong> Collection of binomial trees Bk. n nodes = binary representation determines which Bk trees exist.
        </div>
      </div>
    </div>
  );
};

export default BinomialHeapDataStructure;
