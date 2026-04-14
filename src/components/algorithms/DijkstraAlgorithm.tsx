import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface GraphEdge {
  to: number;
  weight: number;
}

interface DijkstraStep {
  currentNode: number;
  distances: number[];
  visited: boolean[];
  previous: (number | null)[];
  priorityQueue: { node: number; dist: number }[];
  message: string;
}

// Preset weighted graph with 7 nodes in circular layout
const PRESET_EDGES: { from: number; to: number; weight: number }[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 1 },
  { from: 2, to: 1, weight: 2 },
  { from: 2, to: 4, weight: 5 },
  { from: 3, to: 5, weight: 3 },
  { from: 4, to: 5, weight: 1 },
  { from: 4, to: 6, weight: 2 },
  { from: 5, to: 6, weight: 6 },
  { from: 1, to: 4, weight: 4 },
  { from: 0, to: 3, weight: 7 },
];

const NODE_COUNT = 7;

function buildAdjList(nodeCount: number): GraphEdge[][] {
  const adj: GraphEdge[][] = Array.from({ length: nodeCount }, () => []);
  for (const { from, to, weight } of PRESET_EDGES) {
    adj[from].push({ to, weight });
    adj[to].push({ to: from, weight }); // undirected
  }
  return adj;
}

function getNodePosition(index: number, total: number): [number, number] {
  const radius = 4;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

function computeDijkstraSteps(
  source: number,
  nodeCount: number
): DijkstraStep[] {
  const adj = buildAdjList(nodeCount);
  const dist = Array(nodeCount).fill(Infinity);
  const visited = Array(nodeCount).fill(false);
  const previous: (number | null)[] = Array(nodeCount).fill(null);
  dist[source] = 0;

  const pq: { node: number; dist: number }[] = [{ node: source, dist: 0 }];
  const steps: DijkstraStep[] = [];

  steps.push({
    currentNode: -1,
    distances: [...dist],
    visited: [...visited],
    previous: [...previous],
    priorityQueue: [...pq],
    message: `Initialize: set dist[${source}] = 0, all others = Infinity`,
  });

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { node: u } = pq.shift()!;

    if (visited[u]) continue;

    steps.push({
      currentNode: u,
      distances: [...dist],
      visited: [...visited],
      previous: [...previous],
      priorityQueue: [...pq],
      message: `Extract min: node ${u} with distance ${dist[u]}`,
    });

    visited[u] = true;

    for (const { to: v, weight: w } of adj[u]) {
      if (!visited[v] && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        previous[v] = u;
        pq.push({ node: v, dist: dist[v] });

        steps.push({
          currentNode: u,
          distances: [...dist],
          visited: [...visited],
          previous: [...previous],
          priorityQueue: [...pq],
          message: `Relax edge ${u} -> ${v}: dist[${v}] = ${dist[v]}`,
        });
      }
    }

    steps.push({
      currentNode: u,
      distances: [...dist],
      visited: [...visited],
      previous: [...previous],
      priorityQueue: [...pq],
      message: `Node ${u} fully processed`,
    });
  }

  steps.push({
    currentNode: -1,
    distances: [...dist],
    visited: [...visited],
    previous: [...previous],
    priorityQueue: [],
    message: 'Algorithm complete! Shortest paths found.',
  });

  return steps;
}

function reconstructPaths(
  previous: (number | null)[],
  nodeCount: number
): Set<string> {
  const edgeSet = new Set<string>();
  for (let i = 0; i < nodeCount; i++) {
    if (previous[i] !== null) {
      const a = Math.min(i, previous[i]!);
      const b = Math.max(i, previous[i]!);
      edgeSet.add(`${a}-${b}`);
    }
  }
  return edgeSet;
}

const DijkstraAlgorithm: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [sourceNode, setSourceNode] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<DijkstraStep | null>(null);
  const [showShortestPaths, setShowShortestPaths] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.z = 12;
      renderGraph(null, false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderGraph(currentStep, showShortestPaths);
  }, [currentStep, showShortestPaths]);

  const renderGraph = (
    step: DijkstraStep | null,
    showPaths: boolean
  ): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) =>
      getNodePosition(i, NODE_COUNT)
    );

    const shortestPathEdges = step && showPaths
      ? reconstructPaths(step.previous, NODE_COUNT)
      : new Set<string>();

    // Draw edges
    for (const { from, to, weight } of PRESET_EDGES) {
      const [x1, y1] = positions[from];
      const [x2, y2] = positions[to];
      const a = Math.min(from, to);
      const b = Math.max(from, to);
      const isShortestPath = shortestPathEdges.has(`${a}-${b}`);

      const edgeColor = isShortestPath ? 0x3b82f6 : 0x666666;
      const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1, y1, 0),
        new THREE.Vector3(x2, y2, 0),
      ]);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        linewidth: isShortestPath ? 3 : 1,
      });
      const edge = new THREE.Line(edgeGeometry, edgeMaterial);
      group.add(edge);

      // Edge weight label
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      addTextLabel(weight.toString(), mx, my, 0.3, group, '#ffcc00', 40);
    }

    // Draw nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const [x, y] = positions[i];

      let color = 0x888888; // gray - unvisited
      if (step) {
        if (step.currentNode === i) {
          color = 0xef4444; // red - current
        } else if (step.visited[i]) {
          color = 0x22c55e; // green - visited
        } else if (step.priorityQueue.some((pq) => pq.node === i)) {
          color = 0xeab308; // yellow - in queue
        }
        if (showPaths && step.visited[i]) {
          color = 0x22c55e;
        }
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
        addTextLabel(
          `d=${distText}`,
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

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);
    setShowShortestPaths(false);

    const steps = computeDijkstraSteps(sourceNode, NODE_COUNT);
    let idx = 0;

    intervalRef.current = setInterval(() => {
      if (idx < steps.length) {
        setCurrentStep(steps[idx]);
        idx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setShowShortestPaths(true);
        setIsRunning(false);
      }
    }, 800);
  };

  const handleReset = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentStep(null);
    setShowShortestPaths(false);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>Dijkstra's Algorithm</h3>

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
          <p className='font-semibold'>Complexity: O((V + E) log V)</p>
        </div>

        {/* Color Legend */}
        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' />
            Unvisited
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400' />
            In Queue
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-red-500' />
            Current
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' />
            Visited
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-blue-500' />
            Shortest Path Edge
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
                    currentStep.currentNode === i
                      ? 'bg-red-100'
                      : currentStep.visited[i]
                        ? 'bg-green-100'
                        : ''
                  }
                >
                  <td className='border px-2 py-1 text-center'>{i}</td>
                  <td className='border px-2 py-1 text-center'>
                    {d === Infinity ? 'INF' : d}
                  </td>
                  <td className='border px-2 py-1 text-center'>
                    {currentStep.previous[i] !== null
                      ? currentStep.previous[i]
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Priority Queue */}
          <h4 className='text-sm font-bold mt-3 mb-1'>Priority Queue</h4>
          <div className='text-xs'>
            {currentStep.priorityQueue.length > 0 ? (
              <div className='flex flex-wrap gap-1'>
                {currentStep.priorityQueue
                  .sort((a, b) => a.dist - b.dist)
                  .map((item, i) => (
                    <span
                      key={i}
                      className='bg-yellow-200 px-2 py-0.5 rounded'
                    >
                      ({item.node}, {item.dist})
                    </span>
                  ))}
              </div>
            ) : (
              <span className='text-gray-400'>Empty</span>
            )}
          </div>
        </div>
      )}

      {/* About Panel */}
      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Dijkstra's Algorithm</h3>
          <p className='text-sm'>
            Dijkstra's algorithm finds the shortest paths from a source node to
            all other nodes in a weighted graph with non-negative edge weights.
            It uses a priority queue to greedily select the unvisited node with
            the smallest known distance, then relaxes all its outgoing edges.
          </p>
        </div>
      )}
    </div>
  );
};

export default DijkstraAlgorithm;
