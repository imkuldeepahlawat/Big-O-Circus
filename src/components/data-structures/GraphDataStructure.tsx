import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Vertex {
  id: number;
  x: number;
  y: number;
}

interface Edge {
  from: number;
  to: number;
  weight?: number;
}

const GraphDataStructure = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nextId, setNextId] = useState(0);
  const [isDirected, setIsDirected] = useState(false);
  const [isWeighted, setIsWeighted] = useState(false);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [highlightedVertices, setHighlightedVertices] = useState<Set<number>>(
    new Set()
  );
  const [message, setMessage] = useState('Add vertices and edges to build a graph.');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 0, 10);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [vertices, edges, isDirected, isWeighted, selectedVertex, highlightedVertices]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;

    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    // Draw edges first (so they appear behind vertices)
    edges.forEach((edge) => {
      const fromVertex = vertices.find((v) => v.id === edge.from);
      const toVertex = vertices.find((v) => v.id === edge.to);
      if (!fromVertex || !toVertex) return;

      const fromPos = new THREE.Vector3(fromVertex.x, fromVertex.y, 0);
      const toPos = new THREE.Vector3(toVertex.x, toVertex.y, 0);

      // Edge line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        fromPos,
        toPos,
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      group.add(line);

      // Arrow for directed edges
      if (isDirected) {
        const dir = new THREE.Vector3()
          .subVectors(toPos, fromPos)
          .normalize();
        const midPoint = new THREE.Vector3()
          .addVectors(fromPos, toPos)
          .multiplyScalar(0.5);
        // Place arrow closer to target (75% along the edge, offset by vertex radius)
        const arrowPos = new THREE.Vector3().lerpVectors(fromPos, toPos, 0.72);

        const coneGeometry = new THREE.ConeGeometry(0.12, 0.35, 8);
        const coneMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.copy(arrowPos);

        // Orient cone along edge direction
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
        cone.setRotationFromQuaternion(quaternion);

        group.add(cone);
      }

      // Weight label
      if (isWeighted && edge.weight !== undefined) {
        const midPoint = new THREE.Vector3()
          .addVectors(fromPos, toPos)
          .multiplyScalar(0.5);

        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffcc00';
          ctx.font = 'bold 40px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.weight.toString(), 64, 32);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const labelGeo = new THREE.PlaneGeometry(0.6, 0.3);
        const labelMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(midPoint.x, midPoint.y + 0.3, 0.1);
        group.add(label);
      }
    });

    // Draw vertices
    vertices.forEach((vertex) => {
      let color = 0x4287f5; // blue default
      if (selectedVertex === vertex.id) {
        color = 0x00cc00; // green for selected
      }
      if (highlightedVertices.has(vertex.id)) {
        color = 0xff3333; // red for highlighted
      }

      const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(vertex.x, vertex.y, 0);
      group.add(sphere);

      // ID label
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(vertex.id.toString(), 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelGeo = new THREE.PlaneGeometry(0.5, 0.5);
      const labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(vertex.x, vertex.y, 0.35);
      group.add(label);
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const addVertex = () => {
    const count = vertices.length;
    const radius = 3;
    const angle = (2 * Math.PI * count) / Math.max(count + 1, 6);
    const x = radius * Math.cos(angle) + (Math.random() - 0.5) * 0.5;
    const y = radius * Math.sin(angle) + (Math.random() - 0.5) * 0.5;

    const newVertex: Vertex = { id: nextId, x, y };
    setVertices((prev) => [...prev, newVertex]);
    setNextId((prev) => prev + 1);
    setMessage(`Added vertex ${nextId}.`);
  };

  const addEdge = () => {
    const from = parseInt(fromInput);
    const to = parseInt(toInput);
    const weight = weightInput ? parseInt(weightInput) : undefined;

    if (isNaN(from) || isNaN(to)) {
      setMessage('Please enter valid vertex IDs for From and To.');
      return;
    }

    if (from === to) {
      setMessage('Self-loops are not supported.');
      return;
    }

    if (!vertices.find((v) => v.id === from) || !vertices.find((v) => v.id === to)) {
      setMessage(`Vertex ${!vertices.find((v) => v.id === from) ? from : to} does not exist.`);
      return;
    }

    // Check for duplicate edge
    const duplicate = edges.find(
      (e) =>
        (e.from === from && e.to === to) ||
        (!isDirected && e.from === to && e.to === from)
    );
    if (duplicate) {
      setMessage(`Edge from ${from} to ${to} already exists.`);
      return;
    }

    const newEdge: Edge = { from, to, weight };
    setEdges((prev) => [...prev, newEdge]);
    setFromInput('');
    setToInput('');
    setWeightInput('');
    setMessage(`Added edge ${from} -> ${to}${weight !== undefined ? ` (weight: ${weight})` : ''}.`);
  };

  const removeVertex = () => {
    const id = parseInt(fromInput);
    if (isNaN(id)) {
      setMessage('Enter a vertex ID in the "From" field to remove.');
      return;
    }
    if (!vertices.find((v) => v.id === id)) {
      setMessage(`Vertex ${id} does not exist.`);
      return;
    }
    setVertices((prev) => prev.filter((v) => v.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedVertex === id) setSelectedVertex(null);
    setHighlightedVertices((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFromInput('');
    setMessage(`Removed vertex ${id} and its edges.`);
  };

  const removeEdge = () => {
    const from = parseInt(fromInput);
    const to = parseInt(toInput);

    if (isNaN(from) || isNaN(to)) {
      setMessage('Enter From and To vertex IDs to remove an edge.');
      return;
    }

    const edgeIndex = edges.findIndex(
      (e) =>
        (e.from === from && e.to === to) ||
        (!isDirected && e.from === to && e.to === from)
    );

    if (edgeIndex === -1) {
      setMessage(`Edge from ${from} to ${to} not found.`);
      return;
    }

    setEdges((prev) => prev.filter((_, i) => i !== edgeIndex));
    setFromInput('');
    setToInput('');
    setMessage(`Removed edge ${from} -> ${to}.`);
  };

  const generateRandomGraph = () => {
    const numVertices = 6;
    const radius = 3;
    const newVertices: Vertex[] = [];
    let id = 0;

    for (let i = 0; i < numVertices; i++) {
      const angle = (2 * Math.PI * i) / numVertices;
      newVertices.push({
        id,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      });
      id++;
    }

    const newEdges: Edge[] = [];
    // Create some random edges (roughly 1.5x vertices)
    const edgeCount = Math.floor(numVertices * 1.5);
    const edgeSet = new Set<string>();

    for (let i = 0; i < edgeCount; i++) {
      let from: number, to: number;
      let attempts = 0;
      do {
        from = Math.floor(Math.random() * numVertices);
        to = Math.floor(Math.random() * numVertices);
        attempts++;
      } while (
        (from === to || edgeSet.has(`${from}-${to}`) || (!isDirected && edgeSet.has(`${to}-${from}`))) &&
        attempts < 50
      );

      if (attempts < 50) {
        edgeSet.add(`${from}-${to}`);
        const weight = isWeighted ? Math.floor(Math.random() * 20) + 1 : undefined;
        newEdges.push({ from, to, weight });
      }
    }

    setVertices(newVertices);
    setEdges(newEdges);
    setNextId(id);
    setSelectedVertex(null);
    setHighlightedVertices(new Set());
    setMessage(`Generated random graph with ${numVertices} vertices and ${newEdges.length} edges.`);
  };

  const clearGraph = () => {
    setVertices([]);
    setEdges([]);
    setNextId(0);
    setSelectedVertex(null);
    setHighlightedVertices(new Set());
    setFromInput('');
    setToInput('');
    setWeightInput('');
    setMessage('Graph cleared.');
  };

  const getAdjacencyList = (): Map<number, { to: number; weight?: number }[]> => {
    const adjList = new Map<number, { to: number; weight?: number }[]>();
    vertices.forEach((v) => adjList.set(v.id, []));
    edges.forEach((e) => {
      adjList.get(e.from)?.push({ to: e.to, weight: e.weight });
      if (!isDirected) {
        adjList.get(e.to)?.push({ to: e.from, weight: e.weight });
      }
    });
    return adjList;
  };

  const adjList = getAdjacencyList();

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-h-[90vh] overflow-y-auto w-72'>
        <h3 className='text-lg font-bold mb-3'>Graph</h3>

        {/* Input fields */}
        <div className='space-y-2 mb-3'>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <label className='text-xs text-gray-600'>From</label>
              <input
                type='number'
                value={fromInput}
                onChange={(e) => setFromInput(e.target.value)}
                className='w-full border rounded px-2 py-1 text-sm'
                placeholder='ID'
              />
            </div>
            <div className='flex-1'>
              <label className='text-xs text-gray-600'>To</label>
              <input
                type='number'
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                className='w-full border rounded px-2 py-1 text-sm'
                placeholder='ID'
              />
            </div>
            {isWeighted && (
              <div className='flex-1'>
                <label className='text-xs text-gray-600'>Weight</label>
                <input
                  type='number'
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className='w-full border rounded px-2 py-1 text-sm'
                  placeholder='W'
                />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className='grid grid-cols-2 gap-2 mb-3'>
          <button
            onClick={addVertex}
            className='bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600'
          >
            Add Vertex
          </button>
          <button
            onClick={addEdge}
            className='bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600'
          >
            Add Edge
          </button>
          <button
            onClick={removeVertex}
            className='bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600'
          >
            Remove Vertex
          </button>
          <button
            onClick={removeEdge}
            className='bg-orange-500 text-white px-2 py-1 rounded text-sm hover:bg-orange-600'
          >
            Remove Edge
          </button>
        </div>

        {/* Toggles */}
        <div className='space-y-2 mb-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Directed</span>
            <button
              onClick={() => {
                setIsDirected((prev) => !prev);
                setMessage(
                  !isDirected ? 'Switched to directed mode.' : 'Switched to undirected mode.'
                );
              }}
              className={`px-3 py-1 rounded text-sm ${
                isDirected
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isDirected ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-sm'>Weighted</span>
            <button
              onClick={() => {
                setIsWeighted((prev) => !prev);
                setMessage(
                  !isWeighted ? 'Switched to weighted mode.' : 'Switched to unweighted mode.'
                );
              }}
              className={`px-3 py-1 rounded text-sm ${
                isWeighted
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isWeighted ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Generate / Clear */}
        <div className='grid grid-cols-2 gap-2 mb-3'>
          <button
            onClick={generateRandomGraph}
            className='bg-purple-500 text-white px-2 py-1 rounded text-sm hover:bg-purple-600'
          >
            Random Graph
          </button>
          <button
            onClick={clearGraph}
            className='bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600'
          >
            Clear
          </button>
        </div>

        {/* Stats */}
        <div className='text-sm mb-3 border-t pt-2'>
          <p>
            <strong>Vertices:</strong> {vertices.length} &nbsp;|&nbsp;{' '}
            <strong>Edges:</strong> {edges.length}
          </p>
        </div>

        {/* Adjacency List */}
        <div className='text-xs border-t pt-2 mb-3'>
          <p className='font-bold mb-1'>Adjacency List:</p>
          {vertices.length === 0 ? (
            <p className='text-gray-400'>Empty graph</p>
          ) : (
            <div className='max-h-32 overflow-y-auto'>
              {Array.from(adjList.entries()).map(([id, neighbors]) => (
                <div key={id}>
                  <span className='font-semibold'>{id}</span>
                  {' -> '}
                  {neighbors.length === 0
                    ? '(none)'
                    : neighbors
                        .map(
                          (n) =>
                            `${n.to}${n.weight !== undefined ? `(${n.weight})` : ''}`
                        )
                        .join(', ')}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        <div className='text-xs text-gray-600 border-t pt-2'>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default GraphDataStructure;
