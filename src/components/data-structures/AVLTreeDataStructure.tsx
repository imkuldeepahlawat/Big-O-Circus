import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface AVLNode {
  value: number;
  height: number;
  left: AVLNode | null;
  right: AVLNode | null;
}

type HighlightType = 'search' | 'found' | 'inserting' | 'rotation';

const AVLTreeDataStructure = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const rootRef = useRef<AVLNode | null>(null);
  const animatingRef = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState(
    'Welcome! Insert values to build your AVL Tree.'
  );
  const [nodeCount, setNodeCount] = useState(0);
  const [treeHeight, setTreeHeight] = useState(0);
  const [, forceUpdate] = useState(0);

  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // --- AVL Helpers ---

  const getHeight = useCallback((node: AVLNode | null): number => {
    if (!node) return 0;
    return node.height;
  }, []);

  const getBalanceFactor = useCallback(
    (node: AVLNode | null): number => {
      if (!node) return 0;
      return getHeight(node.left) - getHeight(node.right);
    },
    [getHeight]
  );

  const updateHeight = useCallback(
    (node: AVLNode): void => {
      node.height =
        1 + Math.max(getHeight(node.left), getHeight(node.right));
    },
    [getHeight]
  );

  const countNodes = useCallback((node: AVLNode | null): number => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  }, []);

  const updateStats = useCallback(() => {
    setNodeCount(countNodes(rootRef.current));
    setTreeHeight(getHeight(rootRef.current));
  }, [countNodes, getHeight]);

  // --- Rotations ---

  // Right rotation (LL case)
  const rotateRight = (y: AVLNode): AVLNode => {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    updateHeight(y);
    updateHeight(x);

    return x;
  };

  // Left rotation (RR case)
  const rotateLeft = (x: AVLNode): AVLNode => {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    updateHeight(x);
    updateHeight(y);

    return y;
  };

  // --- Insert with auto-balancing ---

  const insertNode = (node: AVLNode | null, value: number): AVLNode | null => {
    // Standard BST insert
    if (!node) {
      return { value, height: 1, left: null, right: null };
    }

    if (value < node.value) {
      node.left = insertNode(node.left, value);
    } else if (value > node.value) {
      node.right = insertNode(node.right, value);
    } else {
      // Duplicate values not allowed
      return node;
    }

    // Update height
    updateHeight(node);

    // Get balance factor
    const balance = getBalanceFactor(node);

    // LL Case: Left-heavy, value inserted in left subtree's left
    if (balance > 1 && node.left && value < node.left.value) {
      return rotateRight(node);
    }

    // RR Case: Right-heavy, value inserted in right subtree's right
    if (balance < -1 && node.right && value > node.right.value) {
      return rotateLeft(node);
    }

    // LR Case: Left-heavy, value inserted in left subtree's right
    if (balance > 1 && node.left && value > node.left.value) {
      node.left = rotateLeft(node.left);
      return rotateRight(node);
    }

    // RL Case: Right-heavy, value inserted in right subtree's left
    if (balance < -1 && node.right && value < node.right.value) {
      node.right = rotateRight(node.right);
      return rotateLeft(node);
    }

    return node;
  };

  // --- Search ---

  const searchNode = (
    node: AVLNode | null,
    value: number
  ): AVLNode | null => {
    if (!node) return null;
    if (value === node.value) return node;
    if (value < node.value) return searchNode(node.left, value);
    return searchNode(node.right, value);
  };

  // --- Visualization ---

  const getNodeColor = (
    node: AVLNode,
    highlights: Map<number, HighlightType>
  ): number => {
    const highlight = highlights.get(node.value);
    if (highlight === 'found') return 0x00ff00;
    if (highlight === 'search') return 0xffff00;
    if (highlight === 'inserting') return 0xff00ff;
    if (highlight === 'rotation') return 0xff8800;

    // Color by balance factor
    const bf = getBalanceFactor(node);
    if (bf === 0) return 0x4488ff; // Perfectly balanced - blue
    if (Math.abs(bf) === 1) return 0x44bbff; // Slightly unbalanced - light blue
    return 0xff4444; // Should not happen in valid AVL - red
  };

  const visualizeNode = (
    node: AVLNode,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group,
    highlights: Map<number, HighlightType>
  ) => {
    const meshColor = getNodeColor(node, highlights);

    // Node sphere
    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: meshColor });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, -y, 0);
    group.add(sphere);

    // Balance factor indicator ring
    const bf = getBalanceFactor(node);
    if (Math.abs(bf) === 1) {
      const ringGeo = new THREE.RingGeometry(0.42, 0.48, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(x, -y, 0.01);
      group.add(ring);
    }

    // Text label (value + height)
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 56px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.value.toString(), 64, 50);
      // Show height in smaller text
      ctx.font = '28px Arial';
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`h:${node.height}`, 64, 95);
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

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(childX, -childY, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x888888 })
      );
      group.add(line);
    }

    if (node.right) {
      const childX = x + spread;
      const childY = y + 1.5;
      visualizeNode(node.right, childX, childY, spread / 2, group, highlights);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(childX, -childY, 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x888888 })
      );
      group.add(line);
    }
  };

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

  // Async delay helper
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // --- Collect path from root to value (for animation) ---

  const collectPath = (
    node: AVLNode | null,
    value: number,
    path: number[]
  ): boolean => {
    if (!node) return false;
    path.push(node.value);
    if (value === node.value) return true;
    if (value < node.value) return collectPath(node.left, value, path);
    return collectPath(node.right, value, path);
  };

  // Detect which rotation was applied
  const detectRotation = (
    oldRoot: AVLNode | null,
    value: number
  ): string | null => {
    if (!oldRoot) return null;
    const balance = getBalanceFactor(oldRoot);
    if (balance > 1 && oldRoot.left && value < oldRoot.left.value)
      return 'LL (Right Rotation)';
    if (balance < -1 && oldRoot.right && value > oldRoot.right.value)
      return 'RR (Left Rotation)';
    if (balance > 1 && oldRoot.left && value > oldRoot.left.value)
      return 'LR (Left-Right Rotation)';
    if (balance < -1 && oldRoot.right && value < oldRoot.right.value)
      return 'RL (Right-Left Rotation)';
    return null;
  };

  // --- Handlers ---

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

    // Check if rotation will occur (pre-check for message)
    // Clone-like approach: just note the old structure
    const oldRoot = rootRef.current;

    // Insert with balancing
    rootRef.current = insertNode(rootRef.current, val);

    // Determine if a rotation happened by checking if root changed or structure differs
    let rotationMsg = '';
    if (oldRoot && rootRef.current && oldRoot.value !== rootRef.current.value) {
      rotationMsg = ' Rotation applied to maintain balance.';
    }

    const insertColors = new Map<number, HighlightType>();
    insertColors.set(val, 'inserting');
    updateVisualization(insertColors);
    setMessage(
      `Inserted ${val}. Balance factor maintained.${rotationMsg}`
    );

    await delay(1200);
    updateVisualization();
    updateStats();
    animatingRef.current = false;
    setInputValue('');
    rerender();
  }, [inputValue, updateVisualization, updateStats, rerender]);

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
          `Found ${val}! Height: ${current.height}, Balance Factor: ${getBalanceFactor(current)}`
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
  }, [inputValue, updateVisualization, getBalanceFactor]);

  const handleGenerateRandom = useCallback(() => {
    if (animatingRef.current) return;
    rootRef.current = null;

    const count = 5 + Math.floor(Math.random() * 6); // 5-10 nodes
    const values = new Set<number>();
    while (values.size < count) {
      values.add(Math.floor(Math.random() * 99) + 1);
    }

    for (const val of values) {
      rootRef.current = insertNode(rootRef.current, val);
    }

    updateVisualization();
    updateStats();
    setMessage(
      `Generated AVL Tree with ${count} nodes. All balanced with |BF| <= 1.`
    );
    rerender();
  }, [updateVisualization, updateStats, rerender]);

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
        <h3 className='text-lg font-bold mb-3'>AVL Tree</h3>

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
            Nodes: {nodeCount} | Height: {treeHeight}
          </p>
          <p className='text-xs text-gray-500 mt-1'>
            All operations: O(log n) guaranteed
          </p>
        </div>

        {/* Color legend */}
        <div className='flex flex-wrap gap-3 mt-2 text-xs'>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-blue-500 inline-block' />
            Balanced (BF=0)
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-blue-300 inline-block' />
            BF=+/-1
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

        {/* AVL Tree Properties */}
        <div className='mt-3 text-xs text-gray-500 border-t pt-2'>
          <p className='font-semibold mb-1'>AVL Tree Properties:</p>
          <ol className='list-decimal list-inside space-y-0.5'>
            <li>Self-balancing Binary Search Tree</li>
            <li>Balance factor: |height(L) - height(R)| &lt;= 1</li>
            <li>Rotations: LL, RR, LR, RL</li>
            <li>Guaranteed O(log n) for all operations</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AVLTreeDataStructure;
