import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const NODE_COUNT = 7;

interface Edge {
  from: number;
  to: number;
  weight: number;
}

const EDGES: Edge[] = [
  { from: 0, to: 1, weight: 2 },
  { from: 0, to: 3, weight: 6 },
  { from: 1, to: 2, weight: 3 },
  { from: 1, to: 3, weight: 8 },
  { from: 1, to: 4, weight: 5 },
  { from: 2, to: 4, weight: 7 },
  { from: 3, to: 4, weight: 9 },
  { from: 3, to: 5, weight: 4 },
  { from: 4, to: 5, weight: 1 },
  { from: 4, to: 6, weight: 6 },
  { from: 5, to: 6, weight: 3 },
];

interface KruskalStep {
  sortedEdges: Edge[];
  currentEdgeIndex: number;
  mstEdges: Edge[];
  parent: number[];
  message: string;
  accepted: boolean | null;
}

function getNodePosition(index: number): [number, number] {
  const radius = 4;
  const angle = (2 * Math.PI * index) / NODE_COUNT - Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function find(parent: number[], x: number): number {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
}

function union(parent: number[], rank: number[], a: number, b: number): boolean {
  const ra = find(parent, a);
  const rb = find(parent, b);
  if (ra === rb) return false;
  if (rank[ra] < rank[rb]) parent[ra] = rb;
  else if (rank[ra] > rank[rb]) parent[rb] = ra;
  else { parent[rb] = ra; rank[ra]++; }
  return true;
}

function computeKruskalSteps(): KruskalStep[] {
  const sorted = [...EDGES].sort((a, b) => a.weight - b.weight);
  const parent = Array.from({ length: NODE_COUNT }, (_, i) => i);
  const rank = new Array(NODE_COUNT).fill(0);
  const steps: KruskalStep[] = [];
  const mstEdges: Edge[] = [];

  steps.push({
    sortedEdges: sorted,
    currentEdgeIndex: -1,
    mstEdges: [],
    parent: [...parent],
    message: `Sorted ${sorted.length} edges by weight. Starting Kruskal's algorithm.`,
    accepted: null,
  });

  for (let i = 0; i < sorted.length; i++) {
    const edge = sorted[i];
    const parentCopy = [...parent];
    const canUnion = find([...parent], edge.from) !== find([...parent], edge.to);

    if (canUnion) {
      union(parent, rank, edge.from, edge.to);
      mstEdges.push(edge);
      steps.push({
        sortedEdges: sorted,
        currentEdgeIndex: i,
        mstEdges: [...mstEdges],
        parent: [...parent],
        message: `Edge ${edge.from}-${edge.to} (w=${edge.weight}): ACCEPTED (different components)`,
        accepted: true,
      });
    } else {
      steps.push({
        sortedEdges: sorted,
        currentEdgeIndex: i,
        mstEdges: [...mstEdges],
        parent: parentCopy,
        message: `Edge ${edge.from}-${edge.to} (w=${edge.weight}): REJECTED (would form cycle)`,
        accepted: false,
      });
    }

    if (mstEdges.length === NODE_COUNT - 1) break;
  }

  const totalWeight = mstEdges.reduce((s, e) => s + e.weight, 0);
  steps.push({
    sortedEdges: sorted,
    currentEdgeIndex: -1,
    mstEdges: [...mstEdges],
    parent: [...parent],
    message: `MST complete! ${mstEdges.length} edges, total weight = ${totalWeight}`,
    accepted: null,
  });

  return steps;
}

const KruskalCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<KruskalStep | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 12;
      renderGraph(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderGraph(currentStep);
  }, [currentStep]);

  const addTextLabel = (
    text: string, x: number, y: number, z: number,
    group: THREE.Group, fillColor: string = '#ffffff', fontSize: number = 64
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

  const renderGraph = (step: KruskalStep | null): void => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) => getNodePosition(i));

    const mstSet = new Set<string>();
    if (step) {
      step.mstEdges.forEach((e) => {
        mstSet.add(`${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`);
      });
    }

    const currentEdge = step && step.currentEdgeIndex >= 0 ? step.sortedEdges[step.currentEdgeIndex] : null;

    // Draw all edges
    for (const edge of EDGES) {
      const [x1, y1] = positions[edge.from];
      const [x2, y2] = positions[edge.to];
      const key = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;

      let edgeColor = 0x444444;

      if (mstSet.has(key)) {
        edgeColor = 0x22c55e; // green - in MST
      }

      if (currentEdge && currentEdge.from === edge.from && currentEdge.to === edge.to) {
        edgeColor = step?.accepted === true ? 0x22c55e : step?.accepted === false ? 0xef4444 : 0xeab308;
      }

      const edgeGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
      ]);
      const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor });
      const line = new THREE.Line(edgeGeom, edgeMat);
      group.add(line);

      // Weight label
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const perpX = -(y2 - y1) / len * 0.35;
      const perpY = (x2 - x1) / len * 0.35;
      addTextLabel(edge.weight.toString(), mx + perpX, my + perpY, 0.1, group, '#ffcc00', 36);
    }

    // Draw nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const [x, y] = positions[i];
      const nodeGeom = new THREE.SphereGeometry(0.5, 32, 32);
      const nodeMat = new THREE.MeshStandardMaterial({ color: 0x4287f5 });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      node.position.set(x, y, 0);
      group.add(node);

      addTextLabel(i.toString(), x, y, 0.6, group, '#ffffff', 64);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);

    const steps = computeKruskalSteps();
    let idx = 0;

    intervalRef.current = setInterval(() => {
      if (idx < steps.length) {
        setCurrentStep(steps[idx]);
        idx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
      }
    }, 1000);
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
        <h3 className='text-lg font-bold mb-2'>Kruskal's Algorithm</h3>

        <div className='flex gap-2 mb-3'>
          <button onClick={handleRun} disabled={isRunning} className='bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50'>Run</button>
          <button onClick={handleReset} className='bg-red-500 text-white px-4 py-2 rounded'>Reset</button>
        </div>

        <div className='text-xs text-gray-600'>
          <p className='font-semibold'>Complexity: O(E log E)</p>
          <p>Greedy MST using sorted edges + union-find.</p>
        </div>

        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' /> MST Edge
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-red-500' /> Rejected (cycle)
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' /> Unprocessed
          </div>
        </div>
      </div>

      {currentStep && (
        <div className='absolute bottom-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-md'>
          <p className='text-sm'>{currentStep.message}</p>
        </div>
      )}

      {currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow'>
          <h4 className='text-sm font-bold mb-2'>Sorted Edges</h4>
          <table className='text-xs border-collapse'>
            <thead>
              <tr>
                <th className='border px-2 py-1'>Edge</th>
                <th className='border px-2 py-1'>Weight</th>
                <th className='border px-2 py-1'>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentStep.sortedEdges.map((e, i) => {
                const inMST = currentStep.mstEdges.some(
                  (m) => m.from === e.from && m.to === e.to
                );
                const isCurrent = i === currentStep.currentEdgeIndex;
                const rejected = isCurrent && currentStep.accepted === false;
                return (
                  <tr key={i} className={isCurrent ? (rejected ? 'bg-red-100' : 'bg-green-100') : inMST ? 'bg-green-50' : ''}>
                    <td className='border px-2 py-1'>{e.from}-{e.to}</td>
                    <td className='border px-2 py-1 text-center'>{e.weight}</td>
                    <td className='border px-2 py-1 text-center'>
                      {inMST ? 'MST' : isCurrent ? (rejected ? 'Cycle' : 'Adding') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Kruskal's Algorithm</h3>
          <p className='text-sm'>
            Kruskal's algorithm finds a Minimum Spanning Tree by sorting all edges
            by weight, then greedily adding the cheapest edge that does not form a
            cycle. It uses Union-Find (Disjoint Set) to efficiently detect cycles.
            The algorithm terminates when V-1 edges have been added.
          </p>
        </div>
      )}
    </div>
  );
};

export default KruskalCircus;
