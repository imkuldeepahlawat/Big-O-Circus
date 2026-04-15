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

interface PrimStep {
  inMST: boolean[];
  mstEdges: Edge[];
  candidateEdge: Edge | null;
  message: string;
}

function getNodePosition(index: number): [number, number] {
  const radius = 4;
  const angle = (2 * Math.PI * index) / NODE_COUNT - Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function getAdjacent(node: number): Edge[] {
  const result: Edge[] = [];
  for (const e of EDGES) {
    if (e.from === node) result.push(e);
    if (e.to === node) result.push({ from: e.to, to: e.from, weight: e.weight });
  }
  return result;
}

function computePrimSteps(): PrimStep[] {
  const inMST = new Array(NODE_COUNT).fill(false);
  const mstEdges: Edge[] = [];
  const steps: PrimStep[] = [];

  // Start from node 0
  inMST[0] = true;
  steps.push({
    inMST: [...inMST],
    mstEdges: [],
    candidateEdge: null,
    message: 'Start from node 0. Add it to MST.',
  });

  while (mstEdges.length < NODE_COUNT - 1) {
    // Find cheapest cross edge
    let bestEdge: Edge | null = null;
    let bestWeight = Infinity;

    for (let node = 0; node < NODE_COUNT; node++) {
      if (!inMST[node]) continue;
      for (const e of getAdjacent(node)) {
        if (!inMST[e.to] && e.weight < bestWeight) {
          bestWeight = e.weight;
          bestEdge = e;
        }
      }
    }

    if (!bestEdge) break;

    steps.push({
      inMST: [...inMST],
      mstEdges: [...mstEdges],
      candidateEdge: bestEdge,
      message: `Cheapest cross edge: ${bestEdge.from}-${bestEdge.to} (w=${bestEdge.weight})`,
    });

    inMST[bestEdge.to] = true;
    mstEdges.push(bestEdge);

    steps.push({
      inMST: [...inMST],
      mstEdges: [...mstEdges],
      candidateEdge: null,
      message: `Added node ${bestEdge.to} to MST via edge ${bestEdge.from}-${bestEdge.to} (w=${bestEdge.weight})`,
    });
  }

  const totalWeight = mstEdges.reduce((s, e) => s + e.weight, 0);
  steps.push({
    inMST: [...inMST],
    mstEdges: [...mstEdges],
    candidateEdge: null,
    message: `MST complete! ${mstEdges.length} edges, total weight = ${totalWeight}`,
  });

  return steps;
}

const PrimCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<PrimStep | null>(null);

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

  const renderGraph = (step: PrimStep | null): void => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) => getNodePosition(i));

    const mstSet = new Set<string>();
    if (step) {
      step.mstEdges.forEach((e) => {
        const a = Math.min(e.from, e.to);
        const b = Math.max(e.from, e.to);
        mstSet.add(`${a}-${b}`);
      });
    }

    const candidate = step?.candidateEdge;

    // Draw edges
    for (const edge of EDGES) {
      const [x1, y1] = positions[edge.from];
      const [x2, y2] = positions[edge.to];
      const a = Math.min(edge.from, edge.to);
      const b = Math.max(edge.from, edge.to);
      const key = `${a}-${b}`;

      let edgeColor = 0x444444;
      if (mstSet.has(key)) {
        edgeColor = 0x22c55e;
      }
      if (candidate) {
        const ca = Math.min(candidate.from, candidate.to);
        const cb = Math.max(candidate.from, candidate.to);
        if (a === ca && b === cb) {
          edgeColor = 0xeab308; // yellow - candidate
        }
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
      const inTree = step?.inMST[i] ?? false;
      const nodeColor = inTree ? 0x22c55e : 0x888888;

      const nodeGeom = new THREE.SphereGeometry(0.5, 32, 32);
      const nodeMat = new THREE.MeshStandardMaterial({ color: nodeColor });
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

    const steps = computePrimSteps();
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
        <h3 className='text-lg font-bold mb-2'>Prim's Algorithm</h3>

        <div className='flex gap-2 mb-3'>
          <button onClick={handleRun} disabled={isRunning} className='bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50'>Run</button>
          <button onClick={handleReset} className='bg-red-500 text-white px-4 py-2 rounded'>Reset</button>
        </div>

        <div className='text-xs text-gray-600'>
          <p className='font-semibold'>Complexity: O(E log V)</p>
          <p>Greedy MST growing from node 0.</p>
          <p>Always picks cheapest cross edge.</p>
        </div>

        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' /> In MST
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400' /> Candidate Edge
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' /> Not in MST
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
          <h4 className='text-sm font-bold mb-2'>MST Edges</h4>
          <table className='text-xs border-collapse'>
            <thead>
              <tr>
                <th className='border px-2 py-1'>Edge</th>
                <th className='border px-2 py-1'>Weight</th>
              </tr>
            </thead>
            <tbody>
              {currentStep.mstEdges.map((e, i) => (
                <tr key={i} className='bg-green-50'>
                  <td className='border px-2 py-1'>{e.from}-{e.to}</td>
                  <td className='border px-2 py-1 text-center'>{e.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='mt-1 text-xs text-gray-500'>
            Total: {currentStep.mstEdges.reduce((s, e) => s + e.weight, 0)}
          </div>
        </div>
      )}

      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Prim's Algorithm</h3>
          <p className='text-sm'>
            Prim's algorithm builds a Minimum Spanning Tree by starting from a single
            node and repeatedly adding the cheapest edge that connects a node in the
            tree to a node outside the tree. Unlike Kruskal's, it grows a single
            connected component from the start node.
          </p>
        </div>
      )}
    </div>
  );
};

export default PrimCircus;
