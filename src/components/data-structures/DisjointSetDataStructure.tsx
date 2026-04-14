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

interface DSUState {
  parent: number[];
  rank: number[];
  size: number;
}

const INITIAL_SIZE = 8;

function createDSU(n: number): DSUState {
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = new Array(n).fill(0);
  return { parent, rank, size: n };
}

function find(dsu: DSUState, x: number): { root: number; path: number[] } {
  const path: number[] = [x];
  let current = x;
  while (dsu.parent[current] !== current) {
    current = dsu.parent[current];
    path.push(current);
  }
  return { root: current, path };
}

function union(dsu: DSUState, x: number, y: number): { merged: boolean; rootX: number; rootY: number } {
  const { root: rootX } = find(dsu, x);
  const { root: rootY } = find(dsu, y);

  if (rootX === rootY) {
    return { merged: false, rootX, rootY };
  }

  // Union by rank
  if (dsu.rank[rootX] < dsu.rank[rootY]) {
    dsu.parent[rootX] = rootY;
  } else if (dsu.rank[rootX] > dsu.rank[rootY]) {
    dsu.parent[rootY] = rootX;
  } else {
    dsu.parent[rootY] = rootX;
    dsu.rank[rootX]++;
  }

  return { merged: true, rootX, rootY };
}

function pathCompress(dsu: DSUState, x: number): void {
  const { root } = find(dsu, x);
  let current = x;
  while (dsu.parent[current] !== root) {
    const next = dsu.parent[current];
    dsu.parent[current] = root;
    current = next;
  }
}

function getComponents(dsu: DSUState): Map<number, number[]> {
  const components = new Map<number, number[]>();
  for (let i = 0; i < dsu.size; i++) {
    const { root } = find(dsu, i);
    if (!components.has(root)) {
      components.set(root, []);
    }
    components.get(root)!.push(i);
  }
  return components;
}

const COMPONENT_COLORS = [0x4287f5, 0x44bb44, 0xdd4444, 0xddcc00, 0xaa44dd, 0x44dddd, 0xff8844, 0xff44aa];

const DisjointSetDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [dsu, setDsu] = useState<DSUState>(createDSU(INITIAL_SIZE));
  const [message, setMessage] = useState('Disjoint Set (Union-Find) ready');
  const [unionX, setUnionX] = useState('');
  const [unionY, setUnionY] = useState('');
  const [findInput, setFindInput] = useState('');
  const [highlightedPath, setHighlightedPath] = useState<number[]>([]);
  const [highlightedRoot, setHighlightedRoot] = useState<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(4, 5, 10);
      viewerRef.current.camera.lookAt(4, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [dsu, highlightedPath, highlightedRoot]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    return canvas;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const components = getComponents(dsu);
    const componentList = Array.from(components.entries());

    // Position components as trees
    let xOffset = 0;
    const spacingX = 1.5;
    const spacingY = 1.8;

    componentList.forEach(([root, members], compIdx) => {
      const color = COMPONENT_COLORS[compIdx % COMPONENT_COLORS.length];

      // Build tree structure: root at top, children below
      const levels: number[][] = [];
      const visited = new Set<number>();
      let currentLevel = [root];
      visited.add(root);

      while (currentLevel.length > 0) {
        levels.push(currentLevel);
        const nextLevel: number[] = [];
        for (const node of currentLevel) {
          for (let i = 0; i < dsu.size; i++) {
            if (dsu.parent[i] === node && i !== node && !visited.has(i)) {
              nextLevel.push(i);
              visited.add(i);
            }
          }
        }
        currentLevel = nextLevel;
      }

      const treeWidth = Math.max(...levels.map((l) => l.length)) * spacingX;
      const treeStartX = xOffset;

      levels.forEach((levelNodes, levelIdx) => {
        const levelWidth = levelNodes.length * spacingX;
        const levelStartX = treeStartX + (treeWidth - levelWidth) / 2;

        levelNodes.forEach((nodeVal, nodeIdx) => {
          const x = levelStartX + nodeIdx * spacingX + spacingX / 2;
          const y = (levels.length - 1 - levelIdx) * spacingY;

          const isOnPath = highlightedPath.includes(nodeVal);
          const isRoot = highlightedRoot === nodeVal;

          const nodeColor = isRoot ? 0xff4444 : isOnPath ? 0xffaa00 : color;
          const geometry = new THREE.SphereGeometry(0.35);
          const material = new THREE.MeshStandardMaterial({ color: nodeColor });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(x, y, 0);
          group.add(sphere);

          // Node label
          const texture = new THREE.CanvasTexture(makeTextCanvas(nodeVal.toString(), 'white'));
          const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), labelMat);
          label.position.set(x, y, 0.36);
          group.add(label);

          // Rank label
          if (nodeVal === root) {
            const rankTexture = new THREE.CanvasTexture(makeTextCanvas(`r:${dsu.rank[nodeVal]}`, '#cccccc', 22));
            const rankMat = new THREE.MeshBasicMaterial({ map: rankTexture, transparent: true });
            const rankLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), rankMat);
            rankLabel.position.set(x, y + 0.5, 0);
            group.add(rankLabel);
          }

          // Edge to parent
          if (dsu.parent[nodeVal] !== nodeVal) {
            const parentNode = dsu.parent[nodeVal];
            // Find parent position
            for (let pLevelIdx = 0; pLevelIdx < levels.length; pLevelIdx++) {
              const pNodeIdx = levels[pLevelIdx].indexOf(parentNode);
              if (pNodeIdx !== -1) {
                const pLevelWidth = levels[pLevelIdx].length * spacingX;
                const pLevelStartX = treeStartX + (treeWidth - pLevelWidth) / 2;
                const px = pLevelStartX + pNodeIdx * spacingX + spacingX / 2;
                const py = (levels.length - 1 - pLevelIdx) * spacingY;

                const edgeOnPath = isOnPath && highlightedPath.includes(parentNode);
                const edgeColor = edgeOnPath ? 0xff4444 : 0xaaaaaa;

                const points = [
                  new THREE.Vector3(x, y + 0.35, 0),
                  new THREE.Vector3(px, py - 0.35, 0),
                ];
                const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({ color: edgeColor });
                const line = new THREE.Line(lineGeom, lineMat);
                group.add(line);
                break;
              }
            }
          }
        });
      });

      // Component label
      const compTexture = new THREE.CanvasTexture(
        makeTextCanvas(`Set ${compIdx}`, '#888888', 22)
      );
      const compMat = new THREE.MeshBasicMaterial({ map: compTexture, transparent: true });
      const compLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), compMat);
      compLabel.position.set(treeStartX + treeWidth / 2, -1, 0);
      group.add(compLabel);

      xOffset += treeWidth + 1.5;
    });

    // Center the group
    group.position.x = -(xOffset - 1.5) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleFind = async () => {
    const x = parseInt(findInput);
    if (isNaN(x) || x < 0 || x >= dsu.size) {
      setMessage(`Enter a valid element (0 to ${dsu.size - 1})`);
      return;
    }

    const { root, path } = find(dsu, x);
    setHighlightedPath(path);
    setHighlightedRoot(root);
    setMessage(`Find(${x}): traversing path to root...`);

    await new Promise((r) => setTimeout(r, 1000));
    setMessage(`Find(${x}) = ${root} -- path: [${path.join(' -> ')}] -- O(alpha(n)) amortized`);
    setFindInput('');

    setTimeout(() => {
      setHighlightedPath([]);
      setHighlightedRoot(null);
    }, 2000);
  };

  const handleUnion = async () => {
    const x = parseInt(unionX);
    const y = parseInt(unionY);
    if (isNaN(x) || isNaN(y) || x < 0 || x >= dsu.size || y < 0 || y >= dsu.size) {
      setMessage(`Enter valid elements (0 to ${dsu.size - 1})`);
      return;
    }

    const newDsu: DSUState = {
      parent: [...dsu.parent],
      rank: [...dsu.rank],
      size: dsu.size,
    };

    const { merged, rootX, rootY } = union(newDsu, x, y);

    if (!merged) {
      setMessage(`Union(${x}, ${y}): already in the same set (root: ${rootX})`);
    } else {
      setHighlightedPath([x, y, rootX, rootY]);
      setMessage(`Union(${x}, ${y}): merging sets with roots ${rootX} and ${rootY}...`);
      await new Promise((r) => setTimeout(r, 600));

      setDsu(newDsu);
      setMessage(`Union(${x}, ${y}) complete -- union by rank`);
    }

    setUnionX('');
    setUnionY('');
    setTimeout(() => setHighlightedPath([]), 1500);
  };

  const handlePathCompression = async () => {
    const x = parseInt(findInput);
    if (isNaN(x) || x < 0 || x >= dsu.size) {
      setMessage(`Enter a valid element (0 to ${dsu.size - 1})`);
      return;
    }

    const { path } = find(dsu, x);
    setHighlightedPath(path);
    setMessage(`Path compression on ${x}: flattening path...`);
    await new Promise((r) => setTimeout(r, 800));

    const newDsu: DSUState = {
      parent: [...dsu.parent],
      rank: [...dsu.rank],
      size: dsu.size,
    };
    pathCompress(newDsu, x);
    setDsu(newDsu);
    setMessage(`Path compression on ${x} complete -- all nodes now point to root`);
    setFindInput('');

    setTimeout(() => setHighlightedPath([]), 1500);
  };

  const handleReset = () => {
    setDsu(createDSU(INITIAL_SIZE));
    setHighlightedPath([]);
    setHighlightedRoot(null);
    setMessage('Reset to initial state');
    setUnionX('');
    setUnionY('');
    setFindInput('');
  };

  const handleRandomUnions = () => {
    const newDsu: DSUState = {
      parent: [...dsu.parent],
      rank: [...dsu.rank],
      size: dsu.size,
    };

    const numUnions = 3 + Math.floor(Math.random() * 3);
    const operations: string[] = [];

    for (let i = 0; i < numUnions; i++) {
      const x = Math.floor(Math.random() * dsu.size);
      const y = Math.floor(Math.random() * dsu.size);
      const { merged } = union(newDsu, x, y);
      if (merged) {
        operations.push(`Union(${x},${y})`);
      }
    }

    setDsu(newDsu);
    setMessage(`Performed ${operations.length} unions: ${operations.join(', ')}`);
  };

  const components = getComponents(dsu);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Disjoint Set (Union-Find)</h2>

        <div className='mb-2 text-sm'>
          <strong>Elements:</strong> {dsu.size} | <strong>Components:</strong> {components.size}
          <br />
          <strong>Parent:</strong> [{dsu.parent.join(', ')}]
          <br />
          <strong>Rank:</strong> [{dsu.rank.join(', ')}]
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='find'>
            <AccordionTrigger>Find / Path Compression</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='number'
                  placeholder='Element'
                  value={findInput}
                  onChange={(e) => setFindInput(e.target.value)}
                  className='border rounded px-2 py-1 w-24 text-sm'
                />
                <Button
                  onClick={handleFind}
                  className='bg-blue-500 text-white px-3 py-1 rounded text-sm'
                >
                  Find
                </Button>
                <Button
                  onClick={handlePathCompression}
                  className='bg-purple-500 text-white px-3 py-1 rounded text-sm'
                >
                  Compress
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='union'>
            <AccordionTrigger>Union</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input
                  type='number'
                  placeholder='X'
                  value={unionX}
                  onChange={(e) => setUnionX(e.target.value)}
                  className='border rounded px-2 py-1 w-16 text-sm'
                />
                <input
                  type='number'
                  placeholder='Y'
                  value={unionY}
                  onChange={(e) => setUnionY(e.target.value)}
                  className='border rounded px-2 py-1 w-16 text-sm'
                />
                <Button
                  onClick={handleUnion}
                  className='bg-green-500 text-white px-3 py-1 rounded text-sm'
                >
                  Union
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button
                  onClick={handleRandomUnions}
                  className='bg-yellow-500 text-white px-3 py-1 rounded text-sm'
                >
                  Random Unions
                </Button>
                <Button
                  onClick={handleReset}
                  className='bg-gray-500 text-white px-3 py-1 rounded text-sm'
                >
                  Reset
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Find O(alpha(n)) | Union O(alpha(n)) | alpha = inverse Ackermann
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Set 0
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44bb44' }}></span>Set 1
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ffaa00' }}></span>Path
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ff4444' }}></span>Root
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Disjoint Set</h3>
        <p className='text-sm'>
          A Disjoint Set (Union-Find) is a data structure that tracks a set of
          elements partitioned into non-overlapping subsets. It supports two key
          operations: Find (determine which set an element belongs to) and Union
          (merge two sets). With union by rank and path compression, both operations
          run in nearly O(1) amortized time -- specifically O(alpha(n)), where alpha
          is the inverse Ackermann function.
        </p>
      </div>
    </div>
  );
};

export default DisjointSetDataStructure;
