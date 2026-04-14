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

interface SkipNode {
  value: number;
  forward: (SkipNode | null)[];
}

const MAX_LEVEL = 5;
const PROBABILITY = 0.5;

const SkipListDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [head, setHead] = useState<SkipNode>(createHead());
  const [level, setLevel] = useState(0);
  const [nodeCount, setNodeCount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [insertValue, setInsertValue] = useState('');
  const [message, setMessage] = useState('Skip List ready');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(new Set());
  const [searchPath, setSearchPath] = useState<{ value: number; level: number }[]>([]);

  function createHead(): SkipNode {
    return {
      value: -Infinity,
      forward: new Array(MAX_LEVEL + 1).fill(null),
    };
  }

  function randomLevel(): number {
    let lvl = 0;
    while (Math.random() < PROBABILITY && lvl < MAX_LEVEL) {
      lvl++;
    }
    return lvl;
  }

  function getAllNodes(headNode: SkipNode): number[] {
    const values: number[] = [];
    let current = headNode.forward[0];
    while (current) {
      values.push(current.value);
      current = current.forward[0];
    }
    return values;
  }

  function getNodeLevel(headNode: SkipNode, value: number): number {
    let current = headNode.forward[0];
    while (current) {
      if (current.value === value) {
        return current.forward.length - 1;
      }
      current = current.forward[0];
    }
    return 0;
  }

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 3, 10);
      viewerRef.current.camera.lookAt(5, 1, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [head, level, highlightedNodes, searchPath]);

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
    const nodes = getAllNodes(head);
    const spacingX = 1.5;
    const spacingY = 1.2;

    // Draw head node
    for (let lvl = 0; lvl <= level; lvl++) {
      const geometry = new THREE.BoxGeometry(0.9, 0.8, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0x666666 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, lvl * spacingY, 0);
      group.add(cube);

      const texture = new THREE.CanvasTexture(makeTextCanvas('H', 'white', 28));
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), labelMat);
      label.position.set(0, lvl * spacingY, 0.26);
      group.add(label);
    }

    // Draw each node at each level it participates in
    nodes.forEach((value, idx) => {
      const x = (idx + 1) * spacingX;
      const nodeLvl = getNodeLevel(head, value);
      const isHighlighted = highlightedNodes.has(value);
      const isOnSearchPath = searchPath.some((sp) => sp.value === value);

      for (let lvl = 0; lvl <= nodeLvl; lvl++) {
        const pathAtLevel = searchPath.some((sp) => sp.value === value && sp.level === lvl);
        const geometry = new THREE.BoxGeometry(0.9, 0.8, 0.5);
        const color = pathAtLevel
          ? 0xff4444
          : isHighlighted
            ? 0x44ff44
            : isOnSearchPath
              ? 0xffaa00
              : 0x4287f5;
        const material = new THREE.MeshStandardMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, lvl * spacingY, 0);
        group.add(cube);

        const texture = new THREE.CanvasTexture(makeTextCanvas(value.toString(), 'white'));
        const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), labelMat);
        label.position.set(x, lvl * spacingY, 0.26);
        group.add(label);
      }

      // Level label below
      const lvlTexture = new THREE.CanvasTexture(makeTextCanvas(`L${nodeLvl}`, '#aaaaaa', 24));
      const lvlMat = new THREE.MeshBasicMaterial({ map: lvlTexture, transparent: true });
      const lvlLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), lvlMat);
      lvlLabel.position.set(x, -0.6, 0);
      group.add(lvlLabel);
    });

    // Draw forward pointers (horizontal arrows) at each level
    for (let lvl = 0; lvl <= level; lvl++) {
      let current: SkipNode | null = head;
      let currentIdx = -1;

      while (current && current.forward[lvl]) {
        const nextNode = current.forward[lvl]!;
        const nextIdx = nodes.indexOf(nextNode.value);
        const startX = currentIdx === -1 ? 0 : (currentIdx + 1) * spacingX;
        const endX = (nextIdx + 1) * spacingX;
        const y = lvl * spacingY;

        const arrowColor = searchPath.some(
          (sp) =>
            (sp.value === current!.value || current!.value === -Infinity) &&
            sp.level === lvl
        )
          ? 0xff4444
          : 0xaaaaaa;

        const points = [
          new THREE.Vector3(startX + 0.45, y, 0.1),
          new THREE.Vector3(endX - 0.45, y, 0.1),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: arrowColor });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        // Arrowhead
        const arrowGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
        const arrowMat = new THREE.MeshStandardMaterial({ color: arrowColor });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.position.set(endX - 0.5, y, 0.1);
        arrow.rotation.z = -Math.PI / 2;
        group.add(arrow);

        current = nextNode;
        currentIdx = nextIdx;
      }
    }

    // Level labels on the left
    for (let lvl = 0; lvl <= level; lvl++) {
      const texture = new THREE.CanvasTexture(makeTextCanvas(`Level ${lvl}`, '#888888', 22));
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), mat);
      label.position.set(-1.2, lvl * spacingY, 0);
      group.add(label);
    }

    // Null terminators on the right
    const maxX = (nodes.length + 1) * spacingX;
    for (let lvl = 0; lvl <= level; lvl++) {
      const texture = new THREE.CanvasTexture(makeTextCanvas('null', '#ff6666', 22));
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), mat);
      label.position.set(maxX, lvl * spacingY, 0);
      group.add(label);
    }

    group.position.x = -((nodes.length) * spacingX) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = async () => {
    const val = parseInt(insertValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to insert');
      return;
    }

    const newLevel = randomLevel();
    const newNode: SkipNode = {
      value: val,
      forward: new Array(newLevel + 1).fill(null),
    };

    const update: (SkipNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
    let current: SkipNode = head;
    const path: { value: number; level: number }[] = [];

    // Traverse from top level down
    for (let i = level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < val) {
        path.push({ value: current.forward[i]!.value, level: i });
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    setSearchPath(path);
    setMessage(`Inserting ${val} at level ${newLevel}...`);
    await new Promise((r) => setTimeout(r, 600));

    // Update level if needed
    const newMaxLevel = Math.max(level, newLevel);

    // Link the new node
    const newHead = { ...head, forward: [...head.forward] };
    let curr: SkipNode = newHead;

    // Re-traverse to get fresh update array with the new head copy
    const freshUpdate: (SkipNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
    for (let i = newMaxLevel; i >= 0; i--) {
      while (curr.forward[i] && curr.forward[i]!.value < val) {
        curr = curr.forward[i]!;
      }
      freshUpdate[i] = curr;
    }

    for (let i = 0; i <= newLevel; i++) {
      if (freshUpdate[i]) {
        newNode.forward[i] = freshUpdate[i]!.forward[i];
        freshUpdate[i]!.forward[i] = newNode;
      } else {
        newHead.forward[i] = newNode;
      }
    }

    setHead(newHead);
    setLevel(newMaxLevel);
    setNodeCount((c) => c + 1);
    setHighlightedNodes(new Set([val]));
    setMessage(`Inserted ${val} at level ${newLevel}`);
    setInsertValue('');

    setTimeout(() => {
      setHighlightedNodes(new Set());
      setSearchPath([]);
    }, 1500);
  };

  const handleSearch = async () => {
    const val = parseInt(searchValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to search');
      return;
    }

    let current: SkipNode = head;
    const path: { value: number; level: number }[] = [];

    for (let i = level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < val) {
        path.push({ value: current.forward[i]!.value, level: i });
        current = current.forward[i]!;
      }
      path.push({ value: current.value, level: i });
    }

    setSearchPath(path);
    setMessage(`Searching for ${val}...`);
    await new Promise((r) => setTimeout(r, 800));

    const found = current.forward[0] && current.forward[0]!.value === val;
    if (found) {
      setHighlightedNodes(new Set([val]));
      setMessage(`Found ${val} -- traversed ${path.length} nodes -- O(log n) avg`);
    } else {
      setMessage(`${val} not found in skip list`);
    }

    setSearchValue('');
    setTimeout(() => {
      setHighlightedNodes(new Set());
      setSearchPath([]);
    }, 2000);
  };

  const handleDelete = async () => {
    const val = parseInt(searchValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to delete');
      return;
    }

    const update: (SkipNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
    let current: SkipNode = head;

    for (let i = level; i >= 0; i--) {
      while (current.forward[i] && current.forward[i]!.value < val) {
        current = current.forward[i]!;
      }
      update[i] = current;
    }

    const target = current.forward[0];
    if (!target || target.value !== val) {
      setMessage(`${val} not found -- cannot delete`);
      return;
    }

    setHighlightedNodes(new Set([val]));
    setMessage(`Deleting ${val}...`);
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i <= level; i++) {
      if (update[i] && update[i]!.forward[i] === target) {
        update[i]!.forward[i] = target.forward[i];
      }
    }

    // Reduce level if needed
    let newLevel = level;
    while (newLevel > 0 && !head.forward[newLevel]) {
      newLevel--;
    }

    setHead({ ...head, forward: [...head.forward] });
    setLevel(newLevel);
    setNodeCount((c) => c - 1);
    setHighlightedNodes(new Set());
    setMessage(`Deleted ${val}`);
    setSearchValue('');
  };

  const handleGenerateRandom = () => {
    const newHead = createHead();
    let maxLvl = 0;
    let count = 0;
    const values = Array.from({ length: 10 }, () => Math.floor(Math.random() * 50) + 1);
    const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

    for (const val of uniqueValues) {
      const newLevel = randomLevel();
      if (newLevel > maxLvl) maxLvl = newLevel;

      const newNode: SkipNode = {
        value: val,
        forward: new Array(newLevel + 1).fill(null),
      };

      const update: (SkipNode | null)[] = new Array(MAX_LEVEL + 1).fill(null);
      let current: SkipNode = newHead;

      for (let i = maxLvl; i >= 0; i--) {
        while (current.forward[i] && current.forward[i]!.value < val) {
          current = current.forward[i]!;
        }
        update[i] = current;
      }

      for (let i = 0; i <= newLevel; i++) {
        if (update[i]) {
          newNode.forward[i] = update[i]!.forward[i];
          update[i]!.forward[i] = newNode;
        }
      }
      count++;
    }

    setHead(newHead);
    setLevel(maxLvl);
    setNodeCount(count);
    setMessage(`Generated skip list with ${count} nodes, max level ${maxLvl}`);
  };

  const handleClear = () => {
    setHead(createHead());
    setLevel(0);
    setNodeCount(0);
    setHighlightedNodes(new Set());
    setSearchPath([]);
    setMessage('Skip List cleared');
  };

  const allNodes = getAllNodes(head);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Skip List</h2>

        <div className='mb-2 text-sm'>
          <strong>Nodes:</strong> {nodeCount} | <strong>Levels:</strong> {level + 1}
          <br />
          <strong>Values:</strong> [{allNodes.join(', ')}]
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Insert</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input
                  type='number'
                  placeholder='Value'
                  value={insertValue}
                  onChange={(e) => setInsertValue(e.target.value)}
                  className='border rounded px-2 py-1 w-24 text-sm'
                />
                <Button
                  onClick={handleInsert}
                  className='bg-green-500 text-white px-3 py-1 rounded text-sm'
                >
                  Insert
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='search-delete'>
            <AccordionTrigger>Search / Delete</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='number'
                  placeholder='Value'
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className='border rounded px-2 py-1 w-24 text-sm'
                />
                <Button
                  onClick={handleSearch}
                  className='bg-blue-500 text-white px-3 py-1 rounded text-sm'
                >
                  Search
                </Button>
                <Button
                  onClick={handleDelete}
                  className='bg-red-500 text-white px-3 py-1 rounded text-sm'
                >
                  Delete
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button
                  onClick={handleGenerateRandom}
                  className='bg-purple-500 text-white px-3 py-1 rounded text-sm'
                >
                  Generate Random List
                </Button>
                <Button
                  onClick={handleClear}
                  className='bg-gray-500 text-white px-3 py-1 rounded text-sm'
                >
                  Clear
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Search O(log n) avg | Insert O(log n) avg | Delete O(log n) avg
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44ff44' }}></span>Found
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ffaa00' }}></span>Path
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ff4444' }}></span>Current
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Skip List</h3>
        <p className='text-sm'>
          A Skip List is a probabilistic data structure that allows O(log n) average
          search, insertion, and deletion. It consists of multiple layers of linked
          lists where each higher layer acts as an &quot;express lane&quot; for the layers
          below. Elements are promoted to higher levels with a fixed probability,
          creating a balanced structure without the complexity of tree rotations.
        </p>
      </div>
    </div>
  );
};

export default SkipListDataStructure;
