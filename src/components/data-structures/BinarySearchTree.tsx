import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

type NodeColor = 'default' | 'highlighted' | 'found' | 'path';

const COLOR_MAP: Record<NodeColor, number> = {
  default: 0x4287f5,
  highlighted: 0xff0000,
  found: 0x00ff00,
  path: 0xffff00,
};

const BinarySearchTree = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const rootRef = useRef<BSTNode | null>(null);
  const animatingRef = useRef(false);

  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('Welcome! Insert values to build your BST.');
  const [nodeCount, setNodeCount] = useState(0);
  const [treeHeight, setTreeHeight] = useState(0);
  const [colorMap, setColorMap] = useState<Map<number, NodeColor>>(new Map());
  const [, forceUpdate] = useState(0);

  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  // Calculate tree height
  const getHeight = useCallback((node: BSTNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }, []);

  // Count nodes
  const countNodes = useCallback((node: BSTNode | null): number => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  }, []);

  // Update stats
  const updateStats = useCallback(() => {
    setNodeCount(countNodes(rootRef.current));
    setTreeHeight(getHeight(rootRef.current));
  }, [countNodes, getHeight]);

  // Clone tree for immutable updates
  const cloneTree = (node: BSTNode | null): BSTNode | null => {
    if (!node) return null;
    return {
      value: node.value,
      left: cloneTree(node.left),
      right: cloneTree(node.right),
    };
  };

  // Visualization
  const updateVisualization = useCallback(
    (colors: Map<number, NodeColor> = new Map()) => {
      if (!viewerRef.current) return;
      viewerRef.current.disposeSceneChildren();

      const group = new THREE.Group();
      if (rootRef.current) {
        visualizeNode(rootRef.current, 0, 0, 5, group, colors);
      }

      viewerRef.current.scene.add(group);
      viewerRef.current.enableRender();
    },
    []
  );

  const visualizeNode = (
    node: BSTNode,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group,
    colors: Map<number, NodeColor>
  ) => {
    const nodeColor = colors.get(node.value) || 'default';
    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: COLOR_MAP[nodeColor],
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, -y, 0);
    group.add(sphere);

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

    if (node.left) {
      const childX = x - spread;
      const childY = y + 1.5;
      visualizeNode(node.left, childX, childY, spread / 2, group, colors);

      const lineColor =
        colors.get(node.left.value) === 'path' ||
        colors.get(node.left.value) === 'highlighted'
          ? COLOR_MAP[colors.get(node.left.value)!]
          : 0x00ff00;
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
      visualizeNode(node.right, childX, childY, spread / 2, group, colors);

      const lineColor =
        colors.get(node.right.value) === 'path' ||
        colors.get(node.right.value) === 'highlighted'
          ? COLOR_MAP[colors.get(node.right.value)!]
          : 0x00ff00;
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

  // Insert
  const handleInsert = useCallback(async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Please enter a valid number.');
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    const newNode: BSTNode = { value: val, left: null, right: null };

    if (!rootRef.current) {
      rootRef.current = newNode;
      const colors = new Map<number, NodeColor>();
      colors.set(val, 'found');
      updateVisualization(colors);
      setMessage(`Inserted ${val} as root.`);
      updateStats();
      animatingRef.current = false;
      setInputValue('');
      rerender();
      return;
    }

    // Animate the path
    const pathColors = new Map<number, NodeColor>();
    let current: BSTNode | null = rootRef.current;

    while (current) {
      pathColors.set(current.value, 'path');
      updateVisualization(new Map(pathColors));
      await delay(500);

      if (val === current.value) {
        pathColors.set(current.value, 'highlighted');
        updateVisualization(new Map(pathColors));
        setMessage(`Value ${val} already exists in the BST.`);
        await delay(1000);
        updateVisualization();
        animatingRef.current = false;
        return;
      }

      if (val < current.value) {
        if (!current.left) {
          current.left = newNode;
          pathColors.set(val, 'found');
          updateVisualization(new Map(pathColors));
          setMessage(`Inserted ${val} to the left of ${current.value}.`);
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          pathColors.set(val, 'found');
          updateVisualization(new Map(pathColors));
          setMessage(`Inserted ${val} to the right of ${current.value}.`);
          break;
        }
        current = current.right;
      }
    }

    await delay(1000);
    updateVisualization();
    updateStats();
    animatingRef.current = false;
    setInputValue('');
    rerender();
  }, [inputValue, updateVisualization, updateStats, rerender]);

  // Find minimum node in subtree
  const findMin = (node: BSTNode): BSTNode => {
    let current = node;
    while (current.left) current = current.left;
    return current;
  };

  // Delete
  const handleDelete = useCallback(async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Please enter a valid number.');
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    // Animate search path
    const pathColors = new Map<number, NodeColor>();
    let found = false;
    let current: BSTNode | null = rootRef.current;

    while (current) {
      pathColors.set(current.value, 'path');
      updateVisualization(new Map(pathColors));
      await delay(500);

      if (val === current.value) {
        pathColors.set(current.value, 'highlighted');
        updateVisualization(new Map(pathColors));
        found = true;
        break;
      }
      current = val < current.value ? current.left : current.right;
    }

    if (!found) {
      setMessage(`Value ${val} not found in the BST.`);
      await delay(1000);
      updateVisualization();
      animatingRef.current = false;
      return;
    }

    await delay(800);

    // Perform actual deletion
    const deleteNode = (
      node: BSTNode | null,
      value: number
    ): BSTNode | null => {
      if (!node) return null;
      if (value < node.value) {
        node.left = deleteNode(node.left, value);
        return node;
      }
      if (value > node.value) {
        node.right = deleteNode(node.right, value);
        return node;
      }
      // Found the node to delete
      // Case 1: Leaf node
      if (!node.left && !node.right) return null;
      // Case 2: One child
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      // Case 3: Two children - find inorder successor
      const successor = findMin(node.right);
      node.value = successor.value;
      node.right = deleteNode(node.right, successor.value);
      return node;
    };

    rootRef.current = deleteNode(cloneTree(rootRef.current), val);
    updateVisualization();
    setMessage(`Deleted ${val} from the BST.`);
    updateStats();
    animatingRef.current = false;
    setInputValue('');
    rerender();
  }, [inputValue, updateVisualization, updateStats, rerender]);

  // Search
  const handleSearch = useCallback(async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Please enter a valid number.');
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;

    const pathColors = new Map<number, NodeColor>();
    let current: BSTNode | null = rootRef.current;

    while (current) {
      pathColors.set(current.value, 'path');
      updateVisualization(new Map(pathColors));
      await delay(600);

      if (val === current.value) {
        pathColors.set(current.value, 'found');
        updateVisualization(new Map(pathColors));
        setMessage(`Found ${val} in the BST!`);
        await delay(1500);
        updateVisualization();
        animatingRef.current = false;
        return;
      }

      current = val < current.value ? current.left : current.right;
    }

    setMessage(`Value ${val} not found in the BST.`);
    await delay(1500);
    updateVisualization();
    animatingRef.current = false;
  }, [inputValue, updateVisualization]);

  // Traversals
  const collectInorder = (node: BSTNode | null, result: number[]) => {
    if (!node) return;
    collectInorder(node.left, result);
    result.push(node.value);
    collectInorder(node.right, result);
  };

  const collectPreorder = (node: BSTNode | null, result: number[]) => {
    if (!node) return;
    result.push(node.value);
    collectPreorder(node.left, result);
    collectPreorder(node.right, result);
  };

  const collectPostorder = (node: BSTNode | null, result: number[]) => {
    if (!node) return;
    collectPostorder(node.left, result);
    collectPostorder(node.right, result);
    result.push(node.value);
  };

  const handleTraversal = useCallback(
    async (type: 'inorder' | 'preorder' | 'postorder') => {
      if (animatingRef.current) return;
      if (!rootRef.current) {
        setMessage('Tree is empty. Insert some values first.');
        return;
      }
      animatingRef.current = true;

      const result: number[] = [];
      if (type === 'inorder') collectInorder(rootRef.current, result);
      else if (type === 'preorder') collectPreorder(rootRef.current, result);
      else collectPostorder(rootRef.current, result);

      const labels: Record<string, string> = {
        inorder: 'In-order',
        preorder: 'Pre-order',
        postorder: 'Post-order',
      };

      const visited = new Map<number, NodeColor>();
      for (let i = 0; i < result.length; i++) {
        // Mark previously visited as path, current as highlighted
        for (const [key] of visited) {
          visited.set(key, 'path');
        }
        visited.set(result[i], 'highlighted');
        updateVisualization(new Map(visited));
        await delay(700);
      }

      // Mark all as found at the end
      for (const val of result) {
        visited.set(val, 'found');
      }
      updateVisualization(new Map(visited));
      setMessage(`${labels[type]} traversal: [${result.join(', ')}]`);
      await delay(2000);
      updateVisualization();
      animatingRef.current = false;
    },
    [updateVisualization]
  );

  // Generate random BST
  const handleGenerateRandom = useCallback(() => {
    if (animatingRef.current) return;
    rootRef.current = null;

    const count = 7 + Math.floor(Math.random() * 6); // 7-12 nodes
    const values = new Set<number>();
    while (values.size < count) {
      values.add(Math.floor(Math.random() * 99) + 1);
    }

    for (const val of values) {
      const newNode: BSTNode = { value: val, left: null, right: null };
      if (!rootRef.current) {
        rootRef.current = newNode;
        continue;
      }
      let current: BSTNode = rootRef.current;
      while (true) {
        if (val < current.value) {
          if (!current.left) {
            current.left = newNode;
            break;
          }
          current = current.left;
        } else {
          if (!current.right) {
            current.right = newNode;
            break;
          }
          current = current.right;
        }
      }
    }

    updateVisualization();
    updateStats();
    setMessage(`Generated random BST with ${count} nodes.`);
    rerender();
  }, [updateVisualization, updateStats, rerender]);

  // Clear
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
        <h3 className='text-lg font-bold mb-3'>Binary Search Tree</h3>

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
        <div className='grid grid-cols-3 gap-2 mb-3'>
          <button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600'
          >
            Insert
          </button>
          <button
            onClick={handleDelete}
            className='bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600'
          >
            Delete
          </button>
          <button
            onClick={handleSearch}
            className='bg-green-500 text-white px-3 py-1.5 rounded text-sm hover:bg-green-600'
          >
            Search
          </button>
        </div>

        {/* Traversal buttons */}
        <div className='grid grid-cols-3 gap-2 mb-3'>
          <button
            onClick={() => handleTraversal('inorder')}
            className='bg-yellow-500 text-white px-3 py-1.5 rounded text-xs hover:bg-yellow-600'
          >
            In-order
          </button>
          <button
            onClick={() => handleTraversal('preorder')}
            className='bg-orange-500 text-white px-3 py-1.5 rounded text-xs hover:bg-orange-600'
          >
            Pre-order
          </button>
          <button
            onClick={() => handleTraversal('postorder')}
            className='bg-purple-500 text-white px-3 py-1.5 rounded text-xs hover:bg-purple-600'
          >
            Post-order
          </button>
        </div>

        {/* Utility buttons */}
        <div className='grid grid-cols-2 gap-2 mb-3'>
          <button
            onClick={handleGenerateRandom}
            className='bg-indigo-500 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-600'
          >
            Generate Random BST
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
          <p>Nodes: {nodeCount} | Height: {treeHeight}</p>
          <p className='text-xs text-gray-500 mt-1'>
            Average: O(log n) | Worst: O(n)
          </p>
        </div>

        {/* Color legend */}
        <div className='flex gap-3 mt-2 text-xs'>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-blue-500 inline-block' />
            Default
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-red-500 inline-block' />
            Current
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-green-500 inline-block' />
            Found
          </span>
          <span className='flex items-center gap-1'>
            <span className='w-3 h-3 rounded-full bg-yellow-400 inline-block' />
            Path
          </span>
        </div>
      </div>
    </div>
  );
};

export default BinarySearchTree;
