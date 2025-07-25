import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

class TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;

  constructor(value: number) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

type Props = {};

const BinaryTreeDataStructure = (props: Props) => {
  const treeDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const treeViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (treeDomElementRef.current) {
      treeViewerRef.current = new Algorithm3DPreviewer(
        treeDomElementRef.current
      );
      updateTreeVisualization();
    }
  }, []);

  useEffect(() => {
    updateTreeVisualization();
  }, [root, highlightedNodes]);

  const updateTreeVisualization = () => {
    if (treeViewerRef.current) {
      // Clear existing scene
      while (treeViewerRef.current.scene.children.length > 0) {
        treeViewerRef.current.scene.remove(
          treeViewerRef.current.scene.children[0]
        );
      }

      const treeGroup = new THREE.Group();

      if (root) {
        visualizeNode(root, 0, 0, 5, treeGroup);
      }

      treeViewerRef.current.scene.add(treeGroup);
      treeViewerRef.current.enableRender();
    }
  };

  const visualizeNode = (
    node: TreeNode,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group
  ) => {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: highlightedNodes.has(node.value) ? 0xff0000 : 0x4287f5,
    });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(x, -y, 0);
    group.add(sphere);

    // Add text label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(node.value.toString(), 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, -y, 0.5);
    group.add(label);

    if (node.left) {
      visualizeNode(node.left, x - spread, y + 2, spread / 2, group);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(x - spread, -(y + 2), 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
      );
      group.add(line);
    }

    if (node.right) {
      visualizeNode(node.right, x + spread, y + 2, spread / 2, group);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(x + spread, -(y + 2), 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
      );
      group.add(line);
    }
  };

  const insertNode = (value: number) => {
    const newNode = new TreeNode(value);

    if (!root) {
      setRoot(newNode);
      return;
    }

    let current = root;
    while (true) {
      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          break;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = newNode;
          break;
        }
        current = current.right;
      }
    }

    setRoot({ ...root }); // Trigger re-render
  };

  const handleInsert = () => {
    const newValue = Math.floor(Math.random() * 100);
    insertNode(newValue);
  };

  const createTreeFromArray = (arr: number[]) => {
    if (arr.length === 0) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < arr.length) {
      const node = queue.shift()!;
      if (i < arr.length && arr[i] !== null) {
        node.left = new TreeNode(arr[i]);
        queue.push(node.left);
      }
      i++;
      if (i < arr.length && arr[i] !== null) {
        node.right = new TreeNode(arr[i]);
        queue.push(node.right);
      }
      i++;
    }
    return root;
  };
  const insertNodeAt = (
    parentValue: number,
    side: 'left' | 'right',
    newValue: number
  ) => {
    if (!root) {
      setRoot(new TreeNode(newValue));
      return;
    }

    const insertHelper = (node: TreeNode | null): boolean => {
      if (!node) return false;

      if (node.value === parentValue) {
        if (side === 'left' && !node.left) {
          node.left = new TreeNode(newValue);
          return true;
        } else if (side === 'right' && !node.right) {
          node.right = new TreeNode(newValue);
          return true;
        } else {
          alert(`The ${side} child of node ${parentValue} already exists!`);
          return false;
        }
      }

      return insertHelper(node.left) || insertHelper(node.right);
    };

    if (insertHelper(root)) {
      setRoot({ ...root }); // Trigger re-render
    } else {
      alert(`Node ${parentValue} not found in the tree!`);
    }
  };

  const handleInsertAt = () => {
    const parentValue = prompt('Enter the value of the parent node:');
    if (parentValue === null) return;

    const side = prompt(
      "Enter 'left' or 'right' to specify which child to insert:"
    );
    if (side !== 'left' && side !== 'right') {
      alert("Invalid input. Please enter 'left' or 'right'.");
      return;
    }

    const newValue = prompt('Enter the value for the new node:');
    if (newValue === null) return;

    insertNodeAt(
      Number(parentValue),
      side as 'left' | 'right',
      Number(newValue)
    );
  };

  const handleCreateFromArray = () => {
    const arr = prompt(
      "Enter comma-separated numbers for the binary tree (use 'null' for empty nodes):"
    );
    if (arr) {
      const numbers = arr
        .split(',')
        .map((num) =>
          num.trim().toLowerCase() === 'null' ? null : Number(num)
        );
      const newRoot = createTreeFromArray(numbers);
      setRoot(newRoot);
    }
  };

  const inOrderTraversal = (node: TreeNode | null, result: number[] = []) => {
    if (node) {
      inOrderTraversal(node.left, result);
      result.push(node.value);
      inOrderTraversal(node.right, result);
    }
    return result;
  };

  const preOrderTraversal = (node: TreeNode | null, result: number[] = []) => {
    if (node) {
      result.push(node.value);
      preOrderTraversal(node.left, result);
      preOrderTraversal(node.right, result);
    }
    return result;
  };

  const postOrderTraversal = (node: TreeNode | null, result: number[] = []) => {
    if (node) {
      postOrderTraversal(node.left, result);
      postOrderTraversal(node.right, result);
      result.push(node.value);
    }
    return result;
  };

  const handleTraversal = (type: 'in' | 'pre' | 'post') => {
    let result: number[];
    switch (type) {
      case 'in':
        result = inOrderTraversal(root);
        break;
      case 'pre':
        result = preOrderTraversal(root);
        break;
      case 'post':
        result = postOrderTraversal(root);
        break;
    }
    setTraversalOrder(result);
    animateTraversal(result);
  };

  const animateTraversal = (order: number[]) => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < order.length) {
        setHighlightedNodes(new Set([order[i]]));
        i++;
      } else {
        clearInterval(intervalId);
        setHighlightedNodes(new Set());
      }
    }, 1000);
  };
  const handleReset = () => {
    setRoot(null);
    setTraversalOrder([]);
    setHighlightedNodes(new Set());
    if (treeViewerRef.current) {
      // Clear existing scene
      while (treeViewerRef.current.scene.children.length > 0) {
        treeViewerRef.current.scene.remove(
          treeViewerRef.current.scene.children[0]
        );
      }
      treeViewerRef.current.enableRender();
    }
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={treeDomElementRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Binary Tree Controls</h3>
        <div className='grid grid-cols-4'>
          <button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Insert Random Node
          </button>
          <button
            onClick={handleInsertAt}
            className='bg-indigo-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Insert at Position
          </button>
          <button
            onClick={handleCreateFromArray}
            className='bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Create from Array
          </button>
          <button
            onClick={() => handleTraversal('in')}
            className='bg-yellow-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            In-Order Traversal
          </button>
          <button
            onClick={() => handleTraversal('pre')}
            className='bg-orange-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Pre-Order Traversal
          </button>
          <button
            onClick={() => handleTraversal('post')}
            className='bg-purple-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Post-Order Traversal
          </button>
          <button
            onClick={handleReset}
            className='bg-red-500 text-white px-4 py-2 rounded mr-2 mb-2'
          >
            Reset Tree
          </button>
        </div>
      </div>
      <div className='absolute bottom-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Traversal Order</h3>
        <p>{traversalOrder.join(' -> ')}</p>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Binary Tree</h3>
        <p>
          A binary tree is a tree data structure in which each node has at most
          two children, referred to as the left child and the right child.
        </p>
      </div>
    </div>
  );
};

export default BinaryTreeDataStructure;
