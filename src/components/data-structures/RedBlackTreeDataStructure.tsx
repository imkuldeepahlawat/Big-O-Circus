import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

enum Color {
  RED,
  BLACK,
}

interface RBNode {
  value: number;
  color: Color;
  left: RBNode | null;
  right: RBNode | null;
  parent: RBNode | null;
}

type HighlightType = 'search' | 'found' | 'inserting';

const RedBlackTreeDataStructure = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const rootRef = useRef<RBNode | null>(null);
  const animatingRef = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState(
    'Welcome! Insert values to build your Red-Black Tree.'
  );
  const [nodeCount, setNodeCount] = useState(0);
  const [treeHeight, setTreeHeight] = useState(0);
  const [blackHeight, setBlackHeight] = useState(0);
  const [, forceUpdate] = useState(0);

  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Calculate tree height
  const getHeight = useCallback((node: RBNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }, []);

  // Calculate black height (count black nodes on leftmost path)
  const getBlackHeight = useCallback((node: RBNode | null): number => {
    if (!node) return 1; // NIL nodes count as black
    const leftBH = getBlackHeight(node.left);
    return node.color === Color.BLACK ? leftBH + 1 : leftBH;
  }, []);

  // Count nodes
  const countNodes = useCallback((node: RBNode | null): number => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  }, []);

  // Update stats
  const updateStats = useCallback(() => {
    setNodeCount(countNodes(rootRef.current));
    setTreeHeight(getHeight(rootRef.current));
    setBlackHeight(getBlackHeight(rootRef.current));
  }, [countNodes, getHeight, getBlackHeight]);

  // Visualization
  const updateVisualization = useCallback(
    (highlights: Map<number, HighlightType> = new Map()) => {
      if (!viewerRef.current) return;
      viewerRef.current.disposeSceneChildren();

      const group = new THREE.Group();
      if (rootRef.current) {
        visualizeNode(rootRef.current, 0, 0, 5, group, highlights);
      }

      viewerRef.current.scene.add(group);
      viewerRef.current.enableRender();
    },
    []
  );

  const visualizeNode = (
    node: RBNode,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group,
    highlights: Map<number, HighlightType>
  ) => {
    const highlight = highlights.get(node.value);

    // Determine node color for rendering
    let meshColor: number;
    if (highlight === 'found') {
      meshColor = 0x00ff00;
    } else if (highlight === 'search') {
      meshColor = 0xffff00;
    } else if (highlight === 'inserting') {
      meshColor = 0xff00ff;
    } else {
      meshColor = node.color === Color.RED ? 0xff0000 : 0x333333;
    }

    // Node sphere
    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: meshColor });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, -y, 0);
    group.add(sphere);

    // Ring outline to distinguish red/black when highlighted
    if (highlight) {
      const ringColor = node.color === Color.RED ? 0xff0000 : 0x333333;
      const ringGeo = new THREE.RingGeometry(0.42, 0.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, -y, 0.01);
      group.add(ring);
    }

    // Text label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.value.toString(), 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(0.7, 0.7);
    const labelMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(x, -y, 0.45);
    group.add(label);

    // Children
    if (node.left) {
      const childX = x - spread;
      const childY = y + 1.5;
      visualizeNode(node.left, childX, childY, spread / 2, group, highlights);

      const lineColor = node.left.color === Color.RED ? 0xff4444 : 0x888888;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(childX, -childY, 0),
        ]),
        new THREE.LineBasicMaterial({ color: lineColor })
      );
      group.add(line);
    }

    if (node.right) {
      const childX = x + spread;
      const childY = y + 1.5;
      visualizeNode(node.right, childX, childY, spread / 2, group, highlights);

      const lineColor = node.right.color === Color.RED ? 0xff4444 : 0x888888;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(childX, -childY, 0),
        ]),
        new THREE.LineBasicMaterial({ color: lineColor })
      );
      group.add(line);
    }
  };

  // Async delay helper
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // --- Red-Black Tree operations ---

  const rotateLeft = (node: RBNode) => {
    const rightChild = node.right!;
    node.right = rightChild.left;
    if (rightChild.left) {
      rightChild.left.parent = node;
    }
    rightChild.parent = node.parent;
    if (!node.parent) {
      rootRef.current = rightChild;
    } else if (node === node.parent.left) {
      node.parent.left = rightChild;
    } else {
      node.parent.right = rightChild;
    }
    rightChild.left = node;
    node.parent = rightChild;
  };

  const rotateRight = (node: RBNode) => {
    const leftChild = node.left!;
    node.left = leftChild.right;
    if (leftChild.right) {
      leftChild.right.parent = node;
    }
    leftChild.parent = node.parent;
    if (!node.parent) {
      rootRef.current = leftChild;
    } else if (node === node.parent.right) {
      node.parent.right = leftChild;
    } else {
      node.parent.left = leftChild;
    }
    leftChild.right = node;
    node.parent = leftChild;
  };

  const insertFixup = (node: RBNode) => {
    let z = node;
    while (z.parent && z.parent.color === Color.RED) {
      if (z.parent === z.parent.parent?.left) {
        const uncle = z.parent.parent.right;
        if (uncle && uncle.color === Color.RED) {
          // Case 1: Uncle is red
          z.parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          z.parent.parent.color = Color.RED;
          z = z.parent.parent;
        } else {
          if (z === z.parent.right) {
            // Case 2: Uncle is black, z is right child (inner)
            z = z.parent;
            rotateLeft(z);
          }
          // Case 3: Uncle is black, z is left child (outer)
          z.parent!.color = Color.BLACK;
          z.parent!.parent!.color = Color.RED;
          rotateRight(z.parent!.parent!);
        }
      } else {
        // Mirror cases
        const uncle = z.parent.parent?.left;
        if (uncle && uncle.color === Color.RED) {
          // Case 1: Uncle is red
          z.parent.color = Color.BLACK;
          uncle.color = Color.BLACK;
          z.parent.parent!.color = Color.RED;
          z = z.parent.parent!;
        } else {
          if (z === z.parent.left) {
            // Case 2: Uncle is black, z is left child (inner)
            z = z.parent;
            rotateRight(z);
          }
          // Case 3: Uncle is black, z is right child (outer)
          z.parent!.color = Color.BLACK;
          z.parent!.parent!.color = Color.RED;
          rotateLeft(z.parent!.parent!);
        }
      }
    }
    // Rule 2: Root is always black
    rootRef.current!.color = Color.BLACK;
  };

  const rbInsert = (value: number): RBNode | null => {
    const newNode: RBNode = {
      value,
      color: Color.RED,
      left: null,
      right: null,
      parent: null,
    };

    // Check for duplicate
    let current = rootRef.current;
    while (current) {
      if (value === current.value) return null; // duplicate
      current = value < current.value ? current.left : current.right;
    }

    // Standard BST insert
    let parent: RBNode | null = null;
    current = rootRef.current;
    while (current) {
      parent = current;
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    newNode.parent = parent;
    if (!parent) {
      rootRef.current = newNode;
    } else if (value < parent.value) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    // Fix Red-Black properties
    insertFixup(newNode);
    return newNode;
  };

  // Insert handler
  const handleInsert = useCallback(async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Please enter a valid number.');
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    // Animate search path
    const pathColors = new Map<number, HighlightType>();
    let current = rootRef.current;
    while (current) {
      pathColors.set(current.value, 'search');
      updateVisualization(new Map(pathColors));
      await delay(400);
      if (val === current.value) {
        pathColors.set(current.value, 'found');
        updateVisualization(new Map(pathColors));
        setMessage(`Value ${val} already exists in the tree.`);
        await delay(1000);
        updateVisualization();
        animatingRef.current = false;
        return;
      }
      current = val < current.value ? current.left : current.right;
    }

    const inserted = rbInsert(val);
    if (!inserted) {
      setMessage(`Value ${val} already exists.`);
      updateVisualization();
      animatingRef.current = false;
      return;
    }

    // Show the inserted node
    const insertColors = new Map<number, HighlightType>();
    insertColors.set(val, 'inserting');
    updateVisualization(insertColors);
    setMessage(
      `Inserted ${val} (red). Fix-up applied: root is black, no red-red violations.`
    );

    await delay(1200);
    updateVisualization();
    updateStats();
    animatingRef.current = false;
    setInputValue('');
    rerender();
  }, [inputValue, updateVisualization, updateStats, rerender]);

  // Search handler
  const handleSearch = useCallback(async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Please enter a valid number.');
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    const pathColors = new Map<number, HighlightType>();
    let current = rootRef.current;

    while (current) {
      pathColors.set(current.value, 'search');
      updateVisualization(new Map(pathColors));
      await delay(600);

      if (val === current.value) {
        pathColors.set(current.value, 'found');
        updateVisualization(new Map(pathColors));
        setMessage(
          `Found ${val}! Color: ${current.color === Color.RED ? 'RED' : 'BLACK'}`
        );
        await delay(1500);
        updateVisualization();
        animatingRef.current = false;
        return;
      }

      current = val < current.value ? current.left : current.right;
    }

    setMessage(`Value ${val} not found in the tree.`);
    await delay(1500);
    updateVisualization();
    animatingRef.current = false;
  }, [inputValue, updateVisualization]);

  // Generate random tree
  const handleGenerateRandom = useCallback(() => {
    if (animatingRef.current) return;
    rootRef.current = null;

    const count = 5 + Math.floor(Math.random() * 4); // 5-8 nodes
    const values = new Set<number>();
    while (values.size < count) {
      values.add(Math.floor(Math.random() * 99) + 1);
    }

    for (const val of values) {
      rbInsert(val);
    }

    updateVisualization();
    updateStats();
    setMessage(`Generated Red-Black Tree with ${count} nodes.`);
    rerender();
  }, [updateVisualization, updateStats, rerender]);

  // Clear tree
  const handleClear = useCallback(() => {
    if (animatingRef.current) return;
    rootRef.current = null;
    updateVisualization();
    updateStats();
    setMessage('Tree cleared.');
    setInputValue('');
    rerender();
  }, [updateVisualization, updateStats, rerender]);

  // Initialize Three.js
  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h3 className='text-lg font-bold mb-3'>Red-Black Tree</h3>

        {/* Input */}
        <div className='flex gap-2 mb-3'>
          <input
            type='number'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Enter value'
            className='border rounded px-2 py-1 w-24 text-sm'
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInsert();
            }}
          />
        </div>

        {/* Operation buttons */}
        <div className='grid grid-cols-2 gap-2 mb-3'>
          <button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600'
          >
            Insert
          </button>
          <button
            onClick={handleSearch}
            className='bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600'
          >
            Search
          </button>
        </div>

        {/* Utility buttons */}
        <div className='grid grid-cols-2 gap-2 mb-3'>
          <button
            onClick={handleGenerateRandom}
            className='bg-indigo-500 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-600'
          >
            Generate Random
          </button>
          <button
            onClick={handleClear}
            className='bg-gray-500 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-600'
          >
            Clear
          </button>
        </div>

        {/* Message area */}
        <div className='bg-gray-100 rounded p-2 mb-3 text-sm min-h-[40px]'>
          {message}
        </div>

        {/* Stats */}
        <div className='text-sm text-gray-700'>
          <p>
            Nodes: {nodeCount} | Height: {treeHeight} | Black Height:{' '}
            {blackHeight}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            All operations: O(log n)
          </p>
        </div>

        {/* Color legend */}
        <div className='flex flex-wrap gap-3 mt-2 text-xs'>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-red-600 inline-block' />
            Red Node
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-gray-800 inline-block' />
            Black Node
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-yellow-400 inline-block' />
            Searching
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-green-500 inline-block' />
            Found
          </span>
        </div>

        {/* RB Tree Rules */}
        <div className='mt-3 text-xs text-gray-500 border-t pt-2'>
          <p className='font-semibold mb-1'>Red-Black Tree Rules:</p>
          <ol className='list-decimal list-inside space-y-0.5'>
            <li>Every node is red or black</li>
            <li>Root is always black</li>
            <li>Red nodes have black children</li>
            <li>Equal black height on all paths</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RedBlackTreeDataStructure;
