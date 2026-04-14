import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface TopoStep {
  queue: number[];
  sorted: number[];
  inDegree: number[];
  status: ('unprocessed' | 'in-queue' | 'sorted')[];
  removedNode: number | null;
  message: string;
}

const NODE_COUNT = 7;

// DAG edges: node labels represent tasks with dependencies
const PRESET_EDGES = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 6 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

function getNodePosition(index: number): [number, number] {
  // Layered layout for a DAG: spread nodes top-to-bottom
  const layers: number[][] = [[0], [1, 2], [3, 4, 5], [6]];
  for (let layer = 0; layer < layers.length; layer++) {
    const idx = layers[layer].indexOf(index);
    if (idx !== -1) {
      const count = layers[layer].length;
      const spacing = 3.0;
      const xOffset = -(count - 1) * spacing * 0.5 + idx * spacing;
      const yOffset = 4 - layer * 2.8;
      return [xOffset, yOffset];
    }
  }
  return [0, 0];
}

function computeTopoSteps(): TopoStep[] {
  const adj: number[][] = Array.from({ length: NODE_COUNT }, () => []);
  const inDegree = Array(NODE_COUNT).fill(0);

  for (const { from, to } of PRESET_EDGES) {
    adj[from].push(to);
    inDegree[to]++;
  }

  const steps: TopoStep[] = [];
  const status: TopoStep['status'] = Array(NODE_COUNT).fill('unprocessed');
  const sorted: number[] = [];

  steps.push({
    queue: [],
    sorted: [],
    inDegree: [...inDegree],
    status: [...status],
    removedNode: null,
    message: 'Initialize: compute in-degrees for all nodes.',
  });

  // Find all nodes with in-degree 0
  const queue: number[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    if (inDegree[i] === 0) {
      queue.push(i);
      status[i] = 'in-queue';
    }
  }

  steps.push({
    queue: [...queue],
    sorted: [],
    inDegree: [...inDegree],
    status: [...status],
    removedNode: null,
    message: `Enqueue nodes with in-degree 0: [${queue.join(', ')}]`,
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    status[node] = 'sorted';

    steps.push({
      queue: [...queue],
      sorted: [...sorted],
      inDegree: [...inDegree],
      status: [...status],
      removedNode: node,
      message: `Dequeue node ${node} and add to sorted order.`,
    });

    for (const neighbor of adj[node]) {
      inDegree[neighbor]--;

      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
        status[neighbor] = 'in-queue';

        steps.push({
          queue: [...queue],
          sorted: [...sorted],
          inDegree: [...inDegree],
          status: [...status],
          removedNode: null,
          message: `Decrement in-degree of node ${neighbor} to ${inDegree[neighbor]}. Enqueue it.`,
        });
      } else {
        steps.push({
          queue: [...queue],
          sorted: [...sorted],
          inDegree: [...inDegree],
          status: [...status],
          removedNode: null,
          message: `Decrement in-degree of node ${neighbor} to ${inDegree[neighbor]}.`,
        });
      }
    }
  }

  steps.push({
    queue: [],
    sorted: [...sorted],
    inDegree: [...inDegree],
    status: [...status],
    removedNode: null,
    message:
      sorted.length === NODE_COUNT
        ? `Algorithm complete! Topological order: [${sorted.join(', ')}]`
        : 'Algorithm complete! Graph has a cycle - not all nodes were sorted.',
  });

  return steps;
}

const TopologicalSortCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<TopoStep | null>(null);

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

  const renderGraph = (step: TopoStep | null): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) =>
      getNodePosition(i)
    );

    // Draw edges
    for (const { from, to } of PRESET_EDGES) {
      const [x1, y1] = positions[from];
      const [x2, y2] = positions[to];

      const dir = new THREE.Vector2(x2 - x1, y2 - y1);
      dir.normalize();

      const sx = x1 + dir.x * 0.55;
      const sy = y1 + dir.y * 0.55;
      const ex = x2 - dir.x * 0.55;
      const ey = y2 - dir.y * 0.55;

      let edgeColor = 0x666666;
      if (step && step.status[from] === 'sorted' && step.status[to] === 'sorted') {
        edgeColor = 0x22c55e;
      } else if (step && step.removedNode === from) {
        edgeColor = 0xeab308;
      }

      const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(sx, sy, 0),
        new THREE.Vector3(ex, ey, 0),
      ]);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: edgeColor });
      group.add(new THREE.Line(edgeGeometry, edgeMaterial));

      // Arrowhead
      const arrowLen = 0.25;
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
      group.add(new THREE.Line(arrowGeometry, new THREE.LineBasicMaterial({ color: edgeColor })));
    }

    // Draw nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const [x, y] = positions[i];

      let color = 0x888888; // gray - unprocessed
      if (step) {
        const s = step.status[i];
        if (s === 'sorted') color = 0x22c55e; // green
        else if (s === 'in-queue') color = 0xeab308; // yellow
      }

      const nodeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const nodeMaterial = new THREE.MeshStandardMaterial({ color });
      const nodeSphere = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeSphere.position.set(x, y, 0);
      group.add(nodeSphere);

      addTextLabel(i.toString(), x, y, 0.6, group, '#ffffff', 64);

      // In-degree label below node
      if (step) {
        addTextLabel(
          `in:${step.inDegree[i]}`,
          x,
          y - 0.9,
          0.1,
          group,
          '#00ffff',
          36
        );
      }
    }

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);

    const steps = computeTopoSteps();
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
        <h3 className='text-lg font-bold mb-2'>Topological Sort</h3>
        <p className='text-xs text-gray-500 mb-2'>Kahn's Algorithm (BFS-based)</p>

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
          <p className='font-semibold'>Complexity: O(V + E)</p>
          <p>Uses Kahn's algorithm with in-degree tracking.</p>
        </div>

        {/* Color Legend */}
        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' />
            Unprocessed
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400' />
            In Queue
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' />
            Sorted
          </div>
        </div>
      </div>

      {/* Step Message */}
      {currentStep && (
        <div className='absolute bottom-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-md'>
          <h4 className='text-sm font-bold mb-1'>Current Step</h4>
          <p className='text-sm'>{currentStep.message}</p>
        </div>
      )}

      {/* Sorted Order and In-Degree Table */}
      {currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow'>
          <h4 className='text-sm font-bold mb-2'>Sorted Order</h4>
          <div className='flex gap-1 mb-3 min-h-[28px]'>
            {currentStep.sorted.length > 0 ? (
              currentStep.sorted.map((node, idx) => (
                <span
                  key={idx}
                  className='bg-green-200 px-2 py-0.5 rounded text-xs font-mono'
                >
                  {node}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>Empty</span>
            )}
          </div>

          <h4 className='text-sm font-bold mb-2'>Queue</h4>
          <div className='flex gap-1 mb-3 min-h-[28px]'>
            {currentStep.queue.length > 0 ? (
              currentStep.queue.map((node, idx) => (
                <span
                  key={idx}
                  className='bg-yellow-200 px-2 py-0.5 rounded text-xs font-mono'
                >
                  {node}
                </span>
              ))
            ) : (
              <span className='text-xs text-gray-400'>Empty</span>
            )}
          </div>

          <h4 className='text-sm font-bold mb-2'>In-Degree Table</h4>
          <table className='text-xs border-collapse'>
            <thead>
              <tr>
                <th className='border px-2 py-1'>Node</th>
                <th className='border px-2 py-1'>In-Degree</th>
                <th className='border px-2 py-1'>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentStep.inDegree.map((deg, i) => (
                <tr
                  key={i}
                  className={
                    currentStep.status[i] === 'sorted'
                      ? 'bg-green-100'
                      : currentStep.status[i] === 'in-queue'
                        ? 'bg-yellow-100'
                        : ''
                  }
                >
                  <td className='border px-2 py-1 text-center'>{i}</td>
                  <td className='border px-2 py-1 text-center'>{deg}</td>
                  <td className='border px-2 py-1 text-center capitalize'>
                    {currentStep.status[i].replace('-', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* About Panel */}
      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Topological Sort</h3>
          <p className='text-sm'>
            Topological sorting produces a linear ordering of vertices in a
            Directed Acyclic Graph (DAG) such that for every directed edge u to v,
            vertex u comes before v in the ordering. This implementation uses
            Kahn's algorithm, which repeatedly removes nodes with zero in-degree
            and adds them to the result.
          </p>
        </div>
      )}
    </div>
  );
};

export default TopologicalSortCircus;
