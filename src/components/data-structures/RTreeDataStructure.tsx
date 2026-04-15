import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Rect { x: number; y: number; w: number; h: number; color?: number }
interface RNode { bounds: Rect; children: RNode[]; rects: Rect[]; isLeaf: boolean }

function createBounds(rects: Rect[]): Rect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

const COLORS = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x2980b9];
const MAX_LEAF = 3;

const RTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [root, setRoot] = useState<RNode | null>(null);
  const [queryRect, setQueryRect] = useState<Rect | null>(null);
  const [queryResults, setQueryResults] = useState<Rect[]>([]);
  const [inputs, setInputs] = useState({ x: '1', y: '1', w: '2', h: '2' });
  const [qInputs, setQInputs] = useState({ x: '0', y: '0', w: '5', h: '5' });
  const [message, setMessage] = useState('R-Tree ready');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 12, 10);
      viewerRef.current.camera.lookAt(5, 0, 5);
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [rects, root, queryRect, queryResults]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color; ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    return canvas;
  };

  const buildTree = (items: Rect[]): RNode | null => {
    if (items.length === 0) return null;
    if (items.length <= MAX_LEAF) {
      return { bounds: createBounds(items), children: [], rects: items, isLeaf: true };
    }
    const sorted = [...items].sort((a, b) => a.x - b.x);
    const mid = Math.ceil(sorted.length / 2);
    const left = buildTree(sorted.slice(0, mid))!;
    const right = buildTree(sorted.slice(mid))!;
    const allBounds = [left.bounds, right.bounds];
    return { bounds: createBounds(allBounds), children: [left, right], rects: [], isLeaf: false };
  };

  const searchTree = (node: RNode | null, query: Rect): Rect[] => {
    if (!node) return [];
    if (!rectsOverlap(node.bounds, query)) return [];
    if (node.isLeaf) return node.rects.filter((r) => rectsOverlap(r, query));
    return node.children.flatMap((c) => searchTree(c, query));
  };

  const drawBoundsRecursive = (group: THREE.Group, node: RNode, depth: number) => {
    const b = node.bounds;
    const wireColor = depth === 0 ? 0xffffff : depth === 1 ? 0xffff00 : 0xff8800;
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w, 0.05, b.h));
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: wireColor }));
    line.position.set(b.x + b.w / 2, depth * 0.1, b.y + b.h / 2);
    group.add(line);
    node.children.forEach((c) => drawBoundsRecursive(group, c, depth + 1));
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.5 })
    );
    ground.rotation.x = -Math.PI / 2; ground.position.set(5, -0.01, 5);
    group.add(ground);

    // Grid lines
    for (let i = 0; i <= 10; i++) {
      const pts = [new THREE.Vector3(i, 0, 0), new THREE.Vector3(i, 0, 10)];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      group.add(new THREE.Line(geom, new THREE.LineBasicMaterial({ color: 0x444444 })));
      const pts2 = [new THREE.Vector3(0, 0, i), new THREE.Vector3(10, 0, i)];
      const geom2 = new THREE.BufferGeometry().setFromPoints(pts2);
      group.add(new THREE.Line(geom2, new THREE.LineBasicMaterial({ color: 0x444444 })));
    }

    const resultSet = new Set(queryResults.map((r) => `${r.x},${r.y},${r.w},${r.h}`));

    // Draw rectangles as flat boxes
    rects.forEach((r, i) => {
      const key = `${r.x},${r.y},${r.w},${r.h}`;
      const isResult = resultSet.has(key);
      const color = isResult ? 0x44ff44 : (r.color || COLORS[i % COLORS.length]);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(r.w, 0.15, r.h),
        new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7 })
      );
      box.position.set(r.x + r.w / 2, 0.075, r.y + r.h / 2);
      group.add(box);
    });

    // Draw bounding boxes
    if (root) drawBoundsRecursive(group, root, 0);

    // Draw query rectangle
    if (queryRect) {
      const q = queryRect;
      const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(q.w, 0.3, q.h));
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x44ff44 }));
      line.position.set(q.x + q.w / 2, 0.15, q.y + q.h / 2);
      group.add(line);
    }

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('R-Tree', '#666666', 24));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), titleMat);
    titleLabel.position.set(5, 4, 0); titleLabel.rotation.x = -Math.PI / 6;
    group.add(titleLabel);

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const x = parseFloat(inputs.x), y = parseFloat(inputs.y);
    const w = parseFloat(inputs.w), h = parseFloat(inputs.h);
    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setMessage('Invalid rectangle values'); return;
    }
    const newRect: Rect = { x, y, w, h, color: COLORS[rects.length % COLORS.length] };
    const newRects = [...rects, newRect];
    setRects(newRects);
    setRoot(buildTree(newRects));
    setQueryResults([]);
    setQueryRect(null);
    setMessage(`Inserted rect at (${x},${y}) size ${w}x${h}`);
  };

  const handleQuery = () => {
    const x = parseFloat(qInputs.x), y = parseFloat(qInputs.y);
    const w = parseFloat(qInputs.w), h = parseFloat(qInputs.h);
    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) { setMessage('Invalid query values'); return; }
    const q: Rect = { x, y, w, h };
    const results = searchTree(root, q);
    setQueryRect(q);
    setQueryResults(results);
    setMessage(`Range query found ${results.length} rectangle(s)`);
  };

  const handleRandom = () => {
    const newRects: Rect[] = [];
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * 7, y = Math.random() * 7;
      const w = 1 + Math.random() * 2, h = 1 + Math.random() * 2;
      newRects.push({ x, y, w, h, color: COLORS[i % COLORS.length] });
    }
    setRects(newRects);
    setRoot(buildTree(newRects));
    setQueryRect(null); setQueryResults([]);
    setMessage('Generated 6 random rectangles');
  };

  const handleClear = () => {
    setRects([]); setRoot(null); setQueryRect(null); setQueryResults([]);
    setMessage('R-Tree cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>R-Tree</h2>
        <div className='mb-2 text-sm'>
          <strong>Rectangles:</strong> {rects.length} | <strong>Query hits:</strong> {queryResults.length}
        </div>
        {message && <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Insert Rectangle</AccordionTrigger>
            <AccordionContent>
              <div className='grid grid-cols-4 gap-1 mb-2'>
                {(['x', 'y', 'w', 'h'] as const).map((k) => (
                  <input key={k} type='number' placeholder={k.toUpperCase()} value={inputs[k]}
                    onChange={(e) => setInputs((p) => ({ ...p, [k]: e.target.value }))}
                    className='border rounded px-1 py-1 text-sm w-full' />
                ))}
              </div>
              <div className='flex gap-1'>
                <Button onClick={handleInsert} className='bg-green-500 text-white px-3 py-1 rounded text-sm flex-1'>Insert</Button>
                <Button onClick={handleRandom} className='bg-purple-500 text-white px-3 py-1 rounded text-sm flex-1'>Random</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='query'>
            <AccordionTrigger>Range Query</AccordionTrigger>
            <AccordionContent>
              <div className='grid grid-cols-4 gap-1 mb-2'>
                {(['x', 'y', 'w', 'h'] as const).map((k) => (
                  <input key={k} type='number' placeholder={k.toUpperCase()} value={qInputs[k]}
                    onChange={(e) => setQInputs((p) => ({ ...p, [k]: e.target.value }))}
                    className='border rounded px-1 py-1 text-sm w-full' />
                ))}
              </div>
              <Button onClick={handleQuery} className='bg-blue-500 text-white px-3 py-1 rounded text-sm w-full'>Query</Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'>Clear</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Search O(log n) avg | Insert O(log n) | Space O(n)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          Colored = rectangles | Wireframe = bounding boxes | Green = query hits
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About R-Tree</h3>
        <p className='text-sm'>
          An R-Tree is a spatial index structure that organizes 2D (or higher-dimensional)
          rectangles into a balanced tree using minimum bounding rectangles (MBRs).
          It efficiently supports range queries, nearest-neighbor searches, and spatial
          joins. Widely used in databases and GIS systems.
        </p>
      </div>
    </div>
  );
};

export default RTreeDataStructure;
