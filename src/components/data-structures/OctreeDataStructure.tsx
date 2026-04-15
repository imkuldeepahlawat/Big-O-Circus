import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface Point3D { x: number; y: number; z: number; }
interface OctNode { center: Point3D; half: number; points: Point3D[]; children: (OctNode | null)[]; }

const MAX_POINTS = 2;

const OctreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [points, setPoints] = useState<Point3D[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 5, 5);
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [points]);

  const buildOctree = (pts: Point3D[], center: Point3D, half: number): OctNode => {
    const node: OctNode = { center, half, points: [], children: Array(8).fill(null) };
    if (pts.length <= MAX_POINTS) { node.points = pts; return node; }
    for (const p of pts) {
      const idx = (p.x >= center.x ? 1 : 0) + (p.y >= center.y ? 2 : 0) + (p.z >= center.z ? 4 : 0);
      if (!node.children[idx]) {
        const h = half / 2;
        const nc = {
          x: center.x + (idx & 1 ? h : -h),
          y: center.y + (idx & 2 ? h : -h),
          z: center.z + (idx & 4 ? h : -h),
        };
        node.children[idx] = buildOctree([], nc, h);
      }
      node.children[idx]!.points.push(p);
    }
    for (let i = 0; i < 8; i++) {
      if (node.children[i] && node.children[i]!.points.length > MAX_POINTS) {
        node.children[i] = buildOctree(node.children[i]!.points, node.children[i]!.center, node.children[i]!.half);
      }
    }
    return node;
  };

  const getDepth = (node: OctNode): number => {
    let d = 0;
    for (const c of node.children) { if (c) d = Math.max(d, getDepth(c)); }
    return d + 1;
  };

  const generateRandom = () => {
    const pts: Point3D[] = Array.from({ length: 15 }, () => ({
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
      z: (Math.random() - 0.5) * 4,
    }));
    setPoints(pts);
    setMessage(`Generated ${pts.length} points`);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    // Draw points
    points.forEach((p) => {
      const geo = new THREE.SphereGeometry(0.08, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
      const sphere = new THREE.Mesh(geo, mat);
      sphere.position.set(p.x, p.y, p.z);
      group.add(sphere);
    });

    // Draw octree
    if (points.length > 0) {
      const tree = buildOctree(points, { x: 0, y: 0, z: 0 }, 2.5);
      drawOctNode(group, tree, 0);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawOctNode = (group: THREE.Group, node: OctNode, depth: number) => {
    const colors = [0x4287f5, 0x10b981, 0xf59e0b, 0xef4444, 0x8b5cf6];
    const color = colors[depth % colors.length];
    const geo = new THREE.BoxGeometry(node.half * 2, node.half * 2, node.half * 2);
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.3 });
    const box = new THREE.Mesh(geo, mat);
    box.position.set(node.center.x, node.center.y, node.center.z);
    group.add(box);

    for (const c of node.children) { if (c) drawOctNode(group, c, depth + 1); }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-xs">
        <h2 className="text-xl font-bold mb-3">Octree</h2>
        <div className="mb-2 text-sm">
          <strong>Points:</strong> {points.length} |{' '}
          <strong>Depth:</strong> {points.length > 0 ? getDepth(buildOctree(points, { x: 0, y: 0, z: 0 }, 2.5)) : 0}
        </div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="flex gap-1">
          <button onClick={generateRandom} className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Random</button>
          <button onClick={() => { setPoints([]); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Insert/Query O(log n). 3D space partitioning into 8 octants recursively.
        </div>
      </div>
    </div>
  );
};

export default OctreeDataStructure;
