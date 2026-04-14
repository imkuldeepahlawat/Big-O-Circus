import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SegmentNode {
  left: number;
  right: number;
  sum: number;
  index: number; // index in the flat tree array
}

const DEFAULT_ARRAY = [1, 3, 5, 7, 9, 11];

const SegmentTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [inputArray, setInputArray] = useState<number[]>([...DEFAULT_ARRAY]);
  const [tree, setTree] = useState<number[]>([]);
  const [message, setMessage] = useState<string>('Click "Build Tree" to start.');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(
    new Set()
  );
  const [highlightColor, setHighlightColor] = useState<string>('green');

  // Query inputs
  const [queryL, setQueryL] = useState<number>(1);
  const [queryR, setQueryR] = useState<number>(4);

  // Update inputs
  const [updateIdx, setUpdateIdx] = useState<number>(2);
  const [updateVal, setUpdateVal] = useState<number>(10);

  // Build segment tree from array
  const buildTree = useCallback((arr: number[]): number[] => {
    const n = arr.length;
    const t = new Array(4 * n).fill(0);

    const build = (node: number, start: number, end: number) => {
      if (start === end) {
        t[node] = arr[start];
      } else {
        const mid = Math.floor((start + end) / 2);
        build(2 * node, start, mid);
        build(2 * node + 1, mid + 1, end);
        t[node] = t[2 * node] + t[2 * node + 1];
      }
    };

    if (n > 0) build(1, 0, n - 1);
    return t;
  }, []);

  // Range sum query - returns { sum, visitedNodes }
  const rangeQuery = useCallback(
    (
      t: number[],
      node: number,
      start: number,
      end: number,
      l: number,
      r: number,
      visited: Set<number>
    ): number => {
      if (r < start || end < l) return 0;
      visited.add(node);
      if (l <= start && end <= r) return t[node];
      const mid = Math.floor((start + end) / 2);
      const leftSum = rangeQuery(t, 2 * node, start, mid, l, r, visited);
      const rightSum = rangeQuery(t, 2 * node + 1, mid + 1, end, l, r, visited);
      return leftSum + rightSum;
    },
    []
  );

  // Point update - returns visited nodes
  const pointUpdate = useCallback(
    (
      t: number[],
      node: number,
      start: number,
      end: number,
      idx: number,
      val: number,
      visited: Set<number>
    ): void => {
      visited.add(node);
      if (start === end) {
        t[node] = val;
      } else {
        const mid = Math.floor((start + end) / 2);
        if (idx <= mid) {
          pointUpdate(t, 2 * node, start, mid, idx, val, visited);
        } else {
          pointUpdate(t, 2 * node + 1, mid + 1, end, idx, val, visited);
        }
        t[node] = t[2 * node] + t[2 * node + 1];
      }
    },
    []
  );

  // Get node info for visualization
  const getNodes = useCallback(
    (
      t: number[],
      n: number
    ): SegmentNode[] => {
      const nodes: SegmentNode[] = [];
      const traverse = (node: number, start: number, end: number) => {
        if (node >= t.length || t[node] === undefined) return;
        nodes.push({ left: start, right: end, sum: t[node], index: node });
        if (start < end) {
          const mid = Math.floor((start + end) / 2);
          traverse(2 * node, start, mid);
          traverse(2 * node + 1, mid + 1, end);
        }
      };
      if (n > 0) traverse(1, 0, n - 1);
      return nodes;
    },
    []
  );

  // Calculate tree depth
  const getTreeDepth = useCallback(
    (node: number, start: number, end: number): number => {
      if (start === end) return 0;
      const mid = Math.floor((start + end) / 2);
      return (
        1 +
        Math.max(
          getTreeDepth(2 * node, start, mid),
          getTreeDepth(2 * node + 1, mid + 1, end)
        )
      );
    },
    []
  );

  // Position nodes in 3D space
  const getNodePosition = useCallback(
    (
      node: number,
      start: number,
      end: number,
      depth: number,
      n: number
    ): THREE.Vector3 => {
      const totalDepth = n > 1 ? getTreeDepth(1, 0, n - 1) : 0;
      const y = (totalDepth - depth) * 2.5;
      // Spread based on range midpoint
      const midpoint = (start + end) / 2;
      const x = (midpoint - (n - 1) / 2) * 2.5;
      return new THREE.Vector3(x, y, 0);
    },
    [getTreeDepth]
  );

  // Visualize the tree
  const visualize = useCallback(
    (
      currentTree: number[],
      arr: number[],
      highlighted: Set<number>,
      hlColor: string
    ) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      viewer.disposeSceneChildren();

      const n = arr.length;
      if (n === 0) {
        viewer.enableRender();
        return;
      }

      const nodes = getNodes(currentTree, n);

      // Create a map of node positions
      const posMap = new Map<number, THREE.Vector3>();
      const buildPosMap = (
        node: number,
        start: number,
        end: number,
        depth: number
      ) => {
        posMap.set(node, getNodePosition(node, start, end, depth, n));
        if (start < end) {
          const mid = Math.floor((start + end) / 2);
          buildPosMap(2 * node, start, mid, depth + 1);
          buildPosMap(2 * node + 1, mid + 1, end, depth + 1);
        }
      };
      buildPosMap(1, 0, n - 1, 0);

      // Draw lines first (parent-child connections)
      const drawLines = (node: number, start: number, end: number) => {
        if (start >= end) return;
        const mid = Math.floor((start + end) / 2);
        const parentPos = posMap.get(node);
        const leftPos = posMap.get(2 * node);
        const rightPos = posMap.get(2 * node + 1);

        if (parentPos && leftPos) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            parentPos,
            leftPos,
          ]);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
          viewer.scene.add(new THREE.Line(lineGeo, lineMat));
        }
        if (parentPos && rightPos) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            parentPos,
            rightPos,
          ]);
          const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
          viewer.scene.add(new THREE.Line(lineGeo, lineMat));
        }

        drawLines(2 * node, start, mid);
        drawLines(2 * node + 1, mid + 1, end);
      };
      drawLines(1, 0, n - 1);

      // Draw nodes
      for (const segNode of nodes) {
        const pos = posMap.get(segNode.index);
        if (!pos) continue;

        let color = 0x4488ff; // blue default
        if (highlighted.has(segNode.index)) {
          if (hlColor === 'green') color = 0x44cc44;
          else if (hlColor === 'yellow') color = 0xcccc00;
        }

        // Box for node
        const boxGeo = new THREE.BoxGeometry(1.8, 0.9, 0.4);
        const boxMat = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.85,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.copy(pos);
        viewer.scene.add(boxMesh);

        // Label: [l,r]:sum
        const label = `[${segNode.left},${segNode.right}]:${segNode.sum}`;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'transparent';
          ctx.fillRect(0, 0, 256, 64);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, 128, 32);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
        });
        const labelGeo = new THREE.PlaneGeometry(1.8, 0.45);
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.set(pos.x, pos.y, pos.z + 0.25);
        viewer.scene.add(labelMesh);
      }

      viewer.enableRender();
    },
    [getNodes, getNodePosition]
  );

  // Initialize viewer
  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 15);
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  // Re-render when tree or highlights change
  useEffect(() => {
    visualize(tree, inputArray, highlightedNodes, highlightColor);
  }, [tree, highlightedNodes, highlightColor, inputArray, visualize]);

  const handleBuild = () => {
    const newTree = buildTree(inputArray);
    setTree(newTree);
    setHighlightedNodes(new Set());
    setMessage(
      `Tree built from array [${inputArray.join(', ')}]. Root sum = ${newTree[1]}.`
    );
  };

  const handleQuery = () => {
    if (tree.length === 0) {
      setMessage('Build the tree first!');
      return;
    }
    const n = inputArray.length;
    const l = Math.max(0, Math.min(queryL, n - 1));
    const r = Math.max(l, Math.min(queryR, n - 1));
    const visited = new Set<number>();
    const sum = rangeQuery(tree, 1, 0, n - 1, l, r, visited);
    setHighlightedNodes(visited);
    setHighlightColor('green');
    setMessage(`Range sum query [${l}, ${r}] = ${sum}. Visited ${visited.size} nodes.`);
  };

  const handleUpdate = () => {
    if (tree.length === 0) {
      setMessage('Build the tree first!');
      return;
    }
    const n = inputArray.length;
    const idx = Math.max(0, Math.min(updateIdx, n - 1));
    const newTree = [...tree];
    const visited = new Set<number>();
    pointUpdate(newTree, 1, 0, n - 1, idx, updateVal, visited);
    const newArr = [...inputArray];
    newArr[idx] = updateVal;
    setInputArray(newArr);
    setTree(newTree);
    setHighlightedNodes(visited);
    setHighlightColor('yellow');
    setMessage(
      `Updated index ${idx} to ${updateVal}. New root sum = ${newTree[1]}. Propagated through ${visited.size} nodes.`
    );
  };

  const handleReset = () => {
    setInputArray([...DEFAULT_ARRAY]);
    setTree([]);
    setHighlightedNodes(new Set());
    setMessage('Reset. Click "Build Tree" to start.');
  };

  return (
    <div className='relative w-full h-screen'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Left Panel - Controls */}
      <div className='absolute top-4 left-4 text-white p-4 rounded shadow max-w-[320px]'>
        <h3 className='text-lg font-bold mb-2'>Segment Tree</h3>
        <p className='text-sm mb-2 bg-black bg-opacity-50 p-2 rounded'>
          {message}
        </p>
        <p className='text-sm mb-3'>
          Array: [{inputArray.join(', ')}]
        </p>

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='item-1'>
            <AccordionTrigger>Build & Reset</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button
                  onClick={handleBuild}
                  className='bg-blue-500 text-white px-4 py-2 rounded'
                >
                  Build Tree
                </Button>
                <Button
                  onClick={handleReset}
                  className='bg-gray-500 text-white px-4 py-2 rounded'
                >
                  Reset
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='item-2'>
            <AccordionTrigger>Range Sum Query</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <div className='flex gap-2 items-center'>
                  <label className='text-sm'>L:</label>
                  <input
                    type='number'
                    min={0}
                    max={inputArray.length - 1}
                    value={queryL}
                    onChange={(e) => setQueryL(parseInt(e.target.value) || 0)}
                    className='w-16 px-2 py-1 rounded text-black text-sm'
                  />
                  <label className='text-sm'>R:</label>
                  <input
                    type='number'
                    min={0}
                    max={inputArray.length - 1}
                    value={queryR}
                    onChange={(e) => setQueryR(parseInt(e.target.value) || 0)}
                    className='w-16 px-2 py-1 rounded text-black text-sm'
                  />
                </div>
                <Button
                  onClick={handleQuery}
                  className='bg-green-500 text-white px-4 py-2 rounded'
                  disabled={tree.length === 0}
                >
                  Query
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='item-3'>
            <AccordionTrigger>Point Update</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <div className='flex gap-2 items-center'>
                  <label className='text-sm'>Index:</label>
                  <input
                    type='number'
                    min={0}
                    max={inputArray.length - 1}
                    value={updateIdx}
                    onChange={(e) => setUpdateIdx(parseInt(e.target.value) || 0)}
                    className='w-16 px-2 py-1 rounded text-black text-sm'
                  />
                  <label className='text-sm'>Value:</label>
                  <input
                    type='number'
                    value={updateVal}
                    onChange={(e) => setUpdateVal(parseInt(e.target.value) || 0)}
                    className='w-16 px-2 py-1 rounded text-black text-sm'
                  />
                </div>
                <Button
                  onClick={handleUpdate}
                  className='bg-yellow-500 text-white px-4 py-2 rounded'
                  disabled={tree.length === 0}
                >
                  Update
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Right Panel - Info */}
      <div className='absolute w-[340px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow text-black'>
        <h3 className='text-lg font-bold mb-2'>About Segment Tree</h3>
        <p className='text-sm mb-2'>
          A Segment Tree is a binary tree used for storing intervals or segments.
          It allows querying which segments contain a given point, and supports
          efficient range queries and point updates.
        </p>
        <h4 className='font-bold text-sm mt-2'>Complexity</h4>
        <ul className='text-sm list-disc list-inside'>
          <li>Build: O(n)</li>
          <li>Range Query: O(log n)</li>
          <li>Point Update: O(log n)</li>
          <li>Space: O(4n)</li>
        </ul>
        <h4 className='font-bold text-sm mt-2'>Color Legend</h4>
        <ul className='text-sm list-disc list-inside'>
          <li><span className='text-blue-600 font-bold'>Blue</span> - Default node</li>
          <li><span className='text-green-600 font-bold'>Green</span> - Query visited</li>
          <li><span className='text-yellow-600 font-bold'>Yellow</span> - Update propagation</li>
        </ul>
      </div>
    </div>
  );
};

export default SegmentTreeDataStructure;
