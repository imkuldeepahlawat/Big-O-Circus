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

interface Point2D { x: number; y: number }
interface QNode {
  x: number; y: number; w: number; h: number;
  points: Point2D[]; children: QNode[] | null; depth: number;
}

const MAX_POINTS = 4;
const MAX_DEPTH = 6;
const WORLD_SIZE = 10;
const DEPTH_COLORS = [0x4287f5, 0x44dd44, 0xf39c12, 0xe74c3c, 0x9b59b6, 0x1abc9c, 0xe67e22];

function createQuadNode(x: number, y: number, w: number, h: number, depth: number): QNode {
  return { x, y, w, h, points: [], children: null, depth };
}

function subdivide(node: QNode): void {
  const hw = node.w / 2, hh = node.h / 2;
  node.children = [
    createQuadNode(node.x, node.y, hw, hh, node.depth + 1),
    createQuadNode(node.x + hw, node.y, hw, hh, node.depth + 1),
    createQuadNode(node.x, node.y + hh, hw, hh, node.depth + 1),
    createQuadNode(node.x + hw, node.y + hh, hw, hh, node.depth + 1),
  ];
  for (const p of node.points) insertPoint(node, p);
  node.points = [];
}

function insertPoint(node: QNode, point: Point2D): boolean {
  if (point.x < node.x || point.x >= node.x + node.w ||
      point.y < node.y || point.y >= node.y + node.h) return false;

  if (node.children) {
    for (const child of node.children) {
      if (insertPoint(child, point)) return true;
    }
    return false;
  }

  node.points.push(point);
  if (node.points.length > MAX_POINTS && node.depth < MAX_DEPTH) {
    subdivide(node);
  }
  return true;
}

function countNodes(node: QNode | null): number {
  if (!node) return 0;
  if (!node.children) return 1;
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}

function getMaxDepth(node: QNode | null): number {
  if (!node) return 0;
  if (!node.children) return node.depth;
  return Math.max(...node.children.map(getMaxDepth));
}

const QuadTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<QNode>(createQuadNode(0, 0, WORLD_SIZE, WORLD_SIZE, 0));
  const [allPoints, setAllPoints] = useState<Point2D[]>([]);
  const [message, setMessage] = useState('QuadTree ready - click Random or add points');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 12, 12);
      viewerRef.current.camera.lookAt(5, 0, 5);
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [root, allPoints]);

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

  const drawQuadNode = (group: THREE.Group, node: QNode) => {
    const color = DEPTH_COLORS[node.depth % DEPTH_COLORS.length];

    // Draw boundary lines
    const y = node.depth * 0.02;
    const pts = [
      new THREE.Vector3(node.x, y, node.y),
      new THREE.Vector3(node.x + node.w, y, node.y),
      new THREE.Vector3(node.x + node.w, y, node.y + node.h),
      new THREE.Vector3(node.x, y, node.y + node.h),
      new THREE.Vector3(node.x, y, node.y),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color, linewidth: 1 }));
    group.add(line);

    // Draw points in leaf
    if (!node.children) {
      node.points.forEach((p) => {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshStandardMaterial({ color })
        );
        sphere.position.set(p.x, 0.12, p.y);
        group.add(sphere);
      });
    }

    if (node.children) node.children.forEach((c) => drawQuadNode(group, c));
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.6 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(WORLD_SIZE / 2, -0.01, WORLD_SIZE / 2);
    group.add(ground);

    drawQuadNode(group, root);

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('QuadTree', '#666666', 24));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), titleMat);
    titleLabel.position.set(5, 5, 0);
    titleLabel.rotation.x = -Math.PI / 6;
    group.add(titleLabel);

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleAddPoint = () => {
    const x = Math.random() * WORLD_SIZE;
    const y = Math.random() * WORLD_SIZE;
    const newRoot = JSON.parse(JSON.stringify(root)) as QNode;
    const pt = { x, y };
    insertPoint(newRoot, pt);
    setRoot(newRoot);
    setAllPoints((prev) => [...prev, pt]);
    setMessage(`Added point (${x.toFixed(2)}, ${y.toFixed(2)})`);
  };

  const handleRandom = () => {
    const newRoot = createQuadNode(0, 0, WORLD_SIZE, WORLD_SIZE, 0);
    const pts: Point2D[] = [];
    for (let i = 0; i < 30; i++) {
      const p = { x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE };
      pts.push(p);
      insertPoint(newRoot, p);
    }
    setRoot(newRoot);
    setAllPoints(pts);
    setMessage('Generated 30 random points');
  };

  const handleCluster = () => {
    const newRoot = createQuadNode(0, 0, WORLD_SIZE, WORLD_SIZE, 0);
    const pts: Point2D[] = [];
    const centers = [{ x: 2, y: 2 }, { x: 7, y: 7 }, { x: 8, y: 2 }];
    centers.forEach((c) => {
      for (let i = 0; i < 10; i++) {
        const p = { x: c.x + (Math.random() - 0.5) * 2, y: c.y + (Math.random() - 0.5) * 2 };
        p.x = Math.max(0, Math.min(WORLD_SIZE - 0.01, p.x));
        p.y = Math.max(0, Math.min(WORLD_SIZE - 0.01, p.y));
        pts.push(p);
        insertPoint(newRoot, p);
      }
    });
    setRoot(newRoot);
    setAllPoints(pts);
    setMessage('Generated 3 clusters of 10 points each');
  };

  const handleClear = () => {
    setRoot(createQuadNode(0, 0, WORLD_SIZE, WORLD_SIZE, 0));
    setAllPoints([]);
    setMessage('QuadTree cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>QuadTree</h2>
        <div className='mb-2 text-sm'>
          <strong>Points:</strong> {allPoints.length} | <strong>Nodes:</strong> {countNodes(root)} | <strong>Max depth:</strong> {getMaxDepth(root)}
        </div>
        {message && <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Add Points</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-1'>
                <Button onClick={handleAddPoint} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>Add Random Point</Button>
                <Button onClick={handleRandom} className='bg-purple-500 text-white px-3 py-1 rounded text-sm'>Generate 30 Points</Button>
                <Button onClick={handleCluster} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>Generate Clusters</Button>
              </div>
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
          <strong>Complexity:</strong> Insert O(log n) avg | Query O(log n + k) | Space O(n)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          {DEPTH_COLORS.slice(0, 5).map((c, i) => (
            <span key={i}>
              <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: `#${c.toString(16).padStart(6, '0')}` }}></span>
              Depth {i}{' '}
            </span>
          ))}
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About QuadTree</h3>
        <p className='text-sm'>
          A QuadTree recursively partitions 2D space into four quadrants. When a
          quadrant contains more than a threshold of points, it subdivides. This
          enables efficient spatial queries, collision detection, and nearest-neighbor
          searches. Commonly used in computer graphics, GIS, and game engines.
        </p>
      </div>
    </div>
  );
};

export default QuadTreeDataStructure;
