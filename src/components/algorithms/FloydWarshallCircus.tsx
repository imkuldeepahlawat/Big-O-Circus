import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface FloydWarshallStep {
  i: number;
  j: number;
  k: number;
  dist: number[][];
  message: string;
  updated: boolean;
}

const NODE_COUNT = 5;

const PRESET_EDGES = [
  { from: 0, to: 1, weight: 3 },
  { from: 0, to: 4, weight: 7 },
  { from: 1, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 5 },
  { from: 2, to: 3, weight: 2 },
  { from: 3, to: 4, weight: 1 },
  { from: 4, to: 0, weight: 2 },
  { from: 2, to: 0, weight: 6 },
];

const INF = 99999;

function getNodePosition(index: number, total: number): [number, number] {
  const radius = 3;
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle) + 2.5];
}

function computeFloydWarshallSteps(): FloydWarshallStep[] {
  // Initialize distance matrix
  const dist: number[][] = Array.from({ length: NODE_COUNT }, (_, i) =>
    Array.from({ length: NODE_COUNT }, (_, j) => (i === j ? 0 : INF))
  );

  for (const { from, to, weight } of PRESET_EDGES) {
    dist[from][to] = weight;
  }

  const steps: FloydWarshallStep[] = [];

  steps.push({
    i: -1,
    j: -1,
    k: -1,
    dist: dist.map((row) => [...row]),
    message: 'Initialize distance matrix from edge weights.',
    updated: false,
  });

  for (let k = 0; k < NODE_COUNT; k++) {
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        const newDist = dist[i][k] + dist[k][j];
        const updated = newDist < dist[i][j];

        if (updated) {
          dist[i][j] = newDist;
        }

        steps.push({
          i,
          j,
          k,
          dist: dist.map((row) => [...row]),
          message: updated
            ? `k=${k}, i=${i}, j=${j}: dist[${i}][${j}] updated to ${dist[i][j]} via node ${k}`
            : `k=${k}, i=${i}, j=${j}: no improvement (${dist[i][j]} <= ${dist[i][k]} + ${dist[k][j]})`,
          updated,
        });
      }
    }
  }

  steps.push({
    i: -1,
    j: -1,
    k: -1,
    dist: dist.map((row) => [...row]),
    message: 'Algorithm complete! All-pairs shortest paths found.',
    updated: false,
  });

  return steps;
}

const FloydWarshallCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<FloydWarshallStep | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const allStepsRef = useRef<FloydWarshallStep[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.z = 14;
      renderScene(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    renderScene(currentStep);
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
    const labelGeometry = new THREE.PlaneGeometry(1.0, 0.5);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, y, z);
    group.add(label);
  };

  const renderScene = (step: FloydWarshallStep | null): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions = Array.from({ length: NODE_COUNT }, (_, i) =>
      getNodePosition(i, NODE_COUNT)
    );

    // Draw edges with arrows
    for (const { from, to, weight } of PRESET_EDGES) {
      const [x1, y1] = positions[from];
      const [x2, y2] = positions[to];

      let edgeColor = 0x666666;
      if (step && step.i >= 0) {
        if (from === step.i && to === step.j) edgeColor = 0xef4444;
        else if (from === step.i && to === step.k) edgeColor = 0xeab308;
        else if (from === step.k && to === step.j) edgeColor = 0xeab308;
      }

      const dir = new THREE.Vector2(x2 - x1, y2 - y1);
      const len = dir.length();
      dir.normalize();

      const sx = x1 + dir.x * 0.5;
      const sy = y1 + dir.y * 0.5;
      const ex = x2 - dir.x * 0.5;
      const ey = y2 - dir.y * 0.5;

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

      // Weight label
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const perpX = (-(y2 - y1) / len) * 0.3;
      const perpY = ((x2 - x1) / len) * 0.3;
      addTextLabel(weight.toString(), mx + perpX, my + perpY, 0.3, group, '#ffcc00', 36);
    }

    // Draw nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      const [x, y] = positions[i];

      let color = 0x888888;
      if (step && step.i >= 0) {
        if (i === step.k) color = 0x3b82f6; // blue - intermediate
        else if (i === step.i) color = 0xef4444; // red - source
        else if (i === step.j) color = 0x22c55e; // green - destination
      }

      const nodeGeometry = new THREE.SphereGeometry(0.45, 32, 32);
      const nodeMaterial = new THREE.MeshStandardMaterial({ color });
      const nodeSphere = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeSphere.position.set(x, y, 0);
      group.add(nodeSphere);

      addTextLabel(i.toString(), x, y, 0.55, group, '#ffffff', 64);
    }

    // Draw distance matrix below the graph
    if (step) {
      const matrixStartX = -4.5;
      const matrixStartY = -2.0;
      const cellSize = 1.2;

      // Column headers
      for (let j = 0; j < NODE_COUNT; j++) {
        addTextLabel(
          j.toString(),
          matrixStartX + (j + 1) * cellSize,
          matrixStartY + 0.6,
          0.1,
          group,
          '#aaaaaa',
          40
        );
      }

      // Row headers + cells
      for (let i = 0; i < NODE_COUNT; i++) {
        addTextLabel(
          i.toString(),
          matrixStartX,
          matrixStartY - i * cellSize,
          0.1,
          group,
          '#aaaaaa',
          40
        );

        for (let j = 0; j < NODE_COUNT; j++) {
          const val = step.dist[i][j];
          const text = val >= INF ? 'INF' : val.toString();

          let cellColor = '#cccccc';
          if (step.i === i && step.j === j) {
            cellColor = step.updated ? '#22c55e' : '#ef4444';
          } else if (step.k >= 0 && (i === step.i || j === step.j)) {
            cellColor = '#eab308';
          }

          // Cell background
          const bgGeometry = new THREE.PlaneGeometry(cellSize - 0.1, cellSize - 0.1);
          const bgMaterial = new THREE.MeshBasicMaterial({
            color: step.i === i && step.j === j
              ? (step.updated ? 0x22c55e : 0x553333)
              : 0x222222,
            transparent: true,
            opacity: 0.4,
          });
          const bg = new THREE.Mesh(bgGeometry, bgMaterial);
          bg.position.set(
            matrixStartX + (j + 1) * cellSize,
            matrixStartY - i * cellSize,
            0
          );
          group.add(bg);

          addTextLabel(
            text,
            matrixStartX + (j + 1) * cellSize,
            matrixStartY - i * cellSize,
            0.1,
            group,
            cellColor,
            32
          );
        }
      }
    }

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const handleRun = (): void => {
    if (isRunning) return;
    setIsRunning(true);

    const steps = computeFloydWarshallSteps();
    allStepsRef.current = steps;

    // Skip steps that have no updates to keep animation at a reasonable pace
    const keySteps = steps.filter((s, idx) => idx === 0 || idx === steps.length - 1 || s.updated || s.i === -1);

    let idx = 0;

    intervalRef.current = setInterval(() => {
      if (idx < keySteps.length) {
        const realIdx = steps.indexOf(keySteps[idx]);
        setStepIndex(realIdx);
        setCurrentStep(keySteps[idx]);
        idx++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
      }
    }, 600);
  };

  const handleReset = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setCurrentStep(null);
    setStepIndex(0);
    allStepsRef.current = [];
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>Floyd-Warshall Algorithm</h3>

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
          <p className='font-semibold'>Complexity: O(V^3)</p>
          <p>All-pairs shortest paths.</p>
        </div>

        {/* Color Legend */}
        <div className='mt-2 text-xs space-y-1'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-gray-400' />
            Default
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-red-500' />
            Source (i)
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500' />
            Destination (j)
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded-full bg-blue-500' />
            Intermediate (k)
          </div>
        </div>
      </div>

      {/* Step Message */}
      {currentStep && (
        <div className='absolute bottom-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-lg'>
          <h4 className='text-sm font-bold mb-1'>Current Step</h4>
          <p className='text-sm'>{currentStep.message}</p>
          {currentStep.i >= 0 && (
            <p className='text-xs text-gray-500 mt-1'>
              (i={currentStep.i}, j={currentStep.j}, k={currentStep.k})
            </p>
          )}
        </div>
      )}

      {/* Matrix Display */}
      {currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow'>
          <h4 className='text-sm font-bold mb-2'>Distance Matrix</h4>
          <table className='text-xs border-collapse'>
            <thead>
              <tr>
                <th className='border px-2 py-1'></th>
                {Array.from({ length: NODE_COUNT }, (_, j) => (
                  <th
                    key={j}
                    className={`border px-2 py-1 ${currentStep.j === j ? 'bg-green-100' : ''}`}
                  >
                    {j}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentStep.dist.map((row, i) => (
                <tr key={i}>
                  <td
                    className={`border px-2 py-1 font-bold ${currentStep.i === i ? 'bg-red-100' : ''}`}
                  >
                    {i}
                  </td>
                  {row.map((val, j) => (
                    <td
                      key={j}
                      className={`border px-2 py-1 text-center ${
                        currentStep.i === i && currentStep.j === j
                          ? currentStep.updated
                            ? 'bg-green-200 font-bold'
                            : 'bg-red-100'
                          : currentStep.k === i || currentStep.k === j
                            ? 'bg-blue-50'
                            : ''
                      }`}
                    >
                      {val >= INF ? 'INF' : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* About Panel */}
      {!currentStep && (
        <div className='absolute top-4 right-4 bg-white bg-opacity-90 p-4 rounded shadow w-80'>
          <h3 className='text-lg font-bold mb-2'>About Floyd-Warshall</h3>
          <p className='text-sm'>
            The Floyd-Warshall algorithm finds shortest paths between all pairs of
            vertices in a weighted graph. It works by considering each vertex as a
            potential intermediate node and checking if a path through it offers a
            shorter route. The algorithm uses dynamic programming with the
            recurrence: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).
          </p>
        </div>
      )}
    </div>
  );
};

export default FloydWarshallCircus;
