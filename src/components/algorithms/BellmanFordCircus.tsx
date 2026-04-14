import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BellmanFordStep {
  iteration: number;
  edgeIndex: number;
  distances: number[];
  predecessors: (number | null)[];
  relaxedEdge: { from: number; to: number } | null;
  status: ('unvisited' | 'relaxing' | 'finalized' | 'negative-cycle')[];
  message: string;
  negativeCycleDetected: boolean;
}

const NODE_COUNT = 7;

const PRESET_EDGES = [
  { from: 0, to: 1, weight: 6 },
  { from: 0, to: 2, weight: 5 },
  { from: 0, to: 3, weight: 5 },
  { from: 1, to: 4, weight: -1 },
  { from: 2, to: 1, weight: -2 },
  { from: 2, to: 4, weight: 1 },
  { from: 3, to: 2, weight: -2 },
  { from: 3, to: 5, weight: -1 },
  { from: 4, to: 6, weight: 3 },
  { from: 5, to: 6, weight: 3 },
];

function getNodePosition(index: number, total: number): [number, number] {
  const radius = 4;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function computeBellmanFordSteps(source: number): BellmanFordStep[] {
  const dist = Array(NODE_COUNT).fill(Infinity);
  const pred: (number | null)[] = Array(NODE_COUNT).fill(null);
  const status: BellmanFordStep['status'] = Array(NODE_COUNT).fill('unvisited');
  dist[source] = 0;
  status[source] = 'finalized';

  const steps: BellmanFordStep[] = [];

  steps.push({
    iteration: 0,
    edgeIndex: -1,
    distances: [...dist],
    predecessors: [...pred],
    relaxedEdge: null,
    status: [...status],
    message: `Initialize: dist[${source}] = 0, all others = INF`,
    negativeCycleDetected: false,
  });

  // V-1 iterations
  for (let i = 1; i < NODE_COUNT; i++) {
    let anyRelaxed = false;
    for (let e = 0; e < PRESET_EDGES.length; e++) {
      const { from: u, to: v, weight: w } = PRESET_EDGES[e];

      // Show the edge being examined
      const prevStatus = [...status];
      if (prevStatus[u] !== 'finalized') prevStatus[u] = 'relaxing';
      if (prevStatus[v] !== 'finalized') prevStatus[v] = 'relaxing';

      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        pred[v] = u;
        anyRelaxed = true;

        const newStatus: BellmanFordStep['status'] = [...status];
        newStatus[v] = 'relaxing';

        steps.push({
          iteration: i,
          edgeIndex: e,
          distances: [...dist],
          predecessors: [...pred],
          relaxedEdge: { from: u, to: v },
          status: newStatus,
          message: `Iteration ${i}: Relax edge ${u} -> ${v} (w=${w}), dist[${v}] = ${dist[v]}`,
          negativeCycleDetected: false,
        });
      }
    }

    // Mark all nodes with finite distance as finalized after each full iteration
    for (let n = 0; n < NODE_COUNT; n++) {
      if (dist[n] !== Infinity) {
        status[n] = 'finalized';
      }
    }

    steps.push({
      iteration: i,
      edgeIndex: -1,
      distances: [...dist],
      predecessors: [...pred],
      relaxedEdge: null,
      status: [...status],
      message: anyRelaxed
        ? `Iteration ${i} complete. Some edges were relaxed.`
        : `Iteration ${i} complete. No edges relaxed - early termination possible.`,
      negativeCycleDetected: false,
    });

    if (!anyRelaxed) break;
  }

  // Check for negative cycles (V-th iteration)
  let negativeCycleFound = false;
  const negCycleStatus = [...status];

  for (const { from: u, to: v, weight: w } of PRESET_EDGES) {
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
      negativeCycleFound = true;
      negCycleStatus[u] = 'negative-cycle';
      negCycleStatus[v] = 'negative-cycle';
    }
  }

  if (negativeCycleFound) {
    steps.push({
      iteration: NODE_COUNT,
      edgeIndex: -1,
      distances: [...dist],
      predecessors: [...pred],
      relaxedEdge: null,
      status: negCycleStatus,
      message: 'Negative cycle detected! Distances are not reliable.',
      negativeCycleDetected: true,
    });
  } else {
    steps.push({
      iteration: NODE_COUNT,
      edgeIndex: -1,
      distances: [...dist],
      predecessors: [...pred],
      relaxedEdge: null,
      status: [...status],
      message: 'Algorithm complete! No negative cycles found. Shortest paths are final.',
      negativeCycleDetected: false,
    });
  }

  return steps;
}

const BellmanFordCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sourceNode, setSourceNode] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<BellmanFordStep | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.z = 12;
      renderGraph(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderGraph(currentStep);
  }, [currentStep]);

  const addTextLabel = (
    text: string,
    x: number,
    y: number,
    z: number,
    group: THREE.Group,
    fillColor: string = '#ffffff',
    fontSize: number = 64
  ): void => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = fillColor;
      context.font = `bold ${fontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 128, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(1.2, 0.6);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, y, z);
    group.add(label);
  };

  const renderGraph = (step: BellmanFordStep | null): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) =>
      getNodePosition(i, NODE_COUNT)
    );

    // Draw edges with arrows
    for (let e = 0; e < PRESET_EDGES.length; e++) {
      const { from, to, weight } = PRESET_EDGES[e];
      const [x1, y1] = positions[from];
      const [x2, y2] = positions[to];

      const isRelaxed =
        step?.relaxedEdge?.from === from && step?.relaxedEdge?.to === to;
      const edgeColor = isRelaxed ? 0xeab308 : 0x666666;

      // Draw the line
      const dir = new THREE.Vector2(x2 - x1, y2 - y1);
      const len = dir.length();
      dir.normalize();
      const startOffset = 0.55;
      const endOffset = 0.55;

      const sx = x1 + dir.x * startOffset;
      const sy = y1 + dir.y * startOffset;
      const ex = x2 - dir.x * endOffset;
      const ey = y2 - dir.y * endOffset;

      const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, sy, 0),
        new THREE.Vector3(ex, ey, 0),
      ]);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: edgeColor });
      const edge = new THREE.Line(edgeGeometry, edgeMaterial);
      group.add(edge);

      // Arrowhead
      const arrowLen = 0.3;
      const arrowAngle = Math.PI / 6;
      const angle = Math.atan2(ey - sy, ex - sx);
      const a1x = ex - arrowLen * Math.cos(angle - arrowAngle);
      const a1y = ey - arrowLen * Math.sin(angle - arrowAngle);
      const a2x = ex - arrowLen * Math.cos(angle + arrowAngle);
      const a2y = ey - arrowLen * Math.sin(angle + arrowAngle);

      const arrowGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a1x, a1y, 0),
        new THREE.Vector3(ex, ey, 0),
        new THREE.Vector3(a2x, a2y, 0),
      ]);
      const arrowMaterial = new THREE.LineBasicMaterial({ color: edgeColor });
      const arrow = new THREE.Line(arrowGeometry, arrowMaterial);
      group.add(arrow);

      // Weight label
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const perpX = -(y2 - y1) / len * 0.3;
      const perpY = (x2 - x1) / len * 0.3;
      addTextLabel(
        weight.toString(),
        mx + perpX,
        my + perpY,
        0.3,
        group,
        '#ffcc00',
        40
      );
    }

    // Draw nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const [x, y] = positions[i];

      let color = 0x888888; // gray - unvisited
      if (step) {
        const s = step.status[i];
        if (s === 'negative-cycle') color = 0xef4444; // red
        else if (s === 'finalized') color = 0x22c55e; // green
        else if (s === 'relaxing') color = 0xeab308; // yellow
      }

      const nodeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const nodeMaterial = new THREE.MeshStandardMaterial({ color });
      const nodeSphere = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeSphere.position.set(x, y, 0);
      group.add(nodeSphere);

      addTextLabel(i.toString(), x, y, 0.6, group, '#ffffff', 64);

      // Distance label below node
      if (step) {
        const distText =
          step.distances[i] === Infinity ? 'INF' : step.distances[i].toString();
        addTextLabel(`d=${distText}`, x, y - 0.9, 0.1, group, '#00ffff', 36);
      }
    }

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);

    const steps = computeBellmanFordSteps(sourceNode);
    let idx = 0;

    intervalRef.current = setInterval(() => {
      if (idx < steps.length) {
        setCurrentStep(steps[idx]);
        idx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
      }
    }, 800);
  };

  const handleReset = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentStep(null);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>Bellman-Ford Algorithm</h3>

        <div className='mb-2'>
          <label className='block text-sm font-semibold mb-1'>
            Source Node:
          </label>
          <select
            value={sourceNode}
            onChange={(e) => setSourceNode(Number(e.target.value))}
            disabled={isRunning}
            className='border rounded px-2 py-1 w-full'
          >
            {Array.from({ length: NODE_COUNT }, (_, i) => (
              <option key={i} value={i}>
                Node {i}
              </option>
            ))}
          </select>
        </div>

        <div className='flex gap-2 mb-3'>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className='bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50'
          >
            Run
          </button>
          <button
            onClick={handleReset}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Reset
          </button>
        </div>

        <div className='text-xs text-gray-600'>
          <p className='font-semibold'>Complexity: O(V * E)</p>
          <p>Handles negative edge weights.</p>
          <p>Detects negative weight cycles.</p>
        </div>

        {/* Color Legend */}
        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' />
            Unvisited
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400' />
            Relaxing
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' />
            Finalized
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-red-500' />
            Negative Cycle
          </div>
        </div>
      </div>

      {/* Step Message */}
      {currentStep && (
        <div className='absolute bottom-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-md'>
          <h4 className='text-sm font-bold mb-1'>Current Step</h4>
          <p className='text-sm'>{currentStep.message}</p>
          {currentStep.negativeCycleDetected && (
            <p className='text-sm text-red-600 font-bold mt-1'>
              Warning: Negative cycle detected!
            </p>
          )}
        </div>
      )}

      {/* Distance Table */}
      {currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow'>
          <h4 className='text-sm font-bold mb-2'>Distance Table</h4>
          <table className='text-xs border-collapse'>
            <thead>
              <tr>
                <th className='border px-2 py-1'>Node</th>
                <th className='border px-2 py-1'>Dist</th>
                <th className='border px-2 py-1'>Prev</th>
              </tr>
            </thead>
            <tbody>
              {currentStep.distances.map((d, i) => (
                <tr
                  key={i}
                  className={
                    currentStep.status[i] === 'negative-cycle'
                      ? 'bg-red-100'
                      : currentStep.status[i] === 'finalized'
                        ? 'bg-green-100'
                        : currentStep.status[i] === 'relaxing'
                          ? 'bg-yellow-100'
                          : ''
                  }
                >
                  <td className='border px-2 py-1 text-center'>{i}</td>
                  <td className='border px-2 py-1 text-center'>
                    {d === Infinity ? 'INF' : d}
                  </td>
                  <td className='border px-2 py-1 text-center'>
                    {currentStep.predecessors[i] !== null
                      ? currentStep.predecessors[i]
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className='mt-2 text-xs text-gray-500'>
            Iteration: {currentStep.iteration} / {NODE_COUNT - 1}
          </div>
        </div>
      )}

      {/* About Panel */}
      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Bellman-Ford</h3>
          <p className='text-sm'>
            The Bellman-Ford algorithm computes shortest paths from a single
            source vertex to all other vertices in a weighted directed graph. Unlike
            Dijkstra's algorithm, it can handle graphs with negative edge weights
            and detect negative weight cycles. It iteratively relaxes all edges
            V-1 times, where V is the number of vertices.
          </p>
        </div>
      )}
    </div>
  );
};

export default BellmanFordCircus;
