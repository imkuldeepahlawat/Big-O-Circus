import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
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

const DfsAlgorithmCircus: React.FC = () => {
  const treeDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const treeViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<TreeNode | null>(null);
  const [dfsOrder, setDfsOrder] = useState<number[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<number>>(
    new Set()
  );
  const [highlightedLinks, setHighlightedLinks] = useState<Set<string>>(
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
  }, [root, highlightedNodes, highlightedLinks]);

  const updateTreeVisualization = () => {
    if (treeViewerRef.current) {
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
      const linkId = `${node.value}-${node.left.value}`;
      const lineColor = highlightedLinks.has(linkId) ? 0xff0000 : 0x00ff00;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(x - spread, -(y + 2), 0),
        ]),
        new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 })
      );
      group.add(line);
    }

    if (node.right) {
      visualizeNode(node.right, x + spread, y + 2, spread / 2, group);
      const linkId = `${node.value}-${node.right.value}`;
      const lineColor = highlightedLinks.has(linkId) ? 0xff0000 : 0x00ff00;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(x + spread, -(y + 2), 0),
        ]),
        new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 })
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

    setRoot({ ...root });
  };

  const handleInsert = () => {
    const newValue = Math.floor(Math.random() * 100);
    insertNode(newValue);
  };

  const generateRandomTree = (depth: number): TreeNode | null => {
    if (depth === 0) return null;
    const value = Math.floor(Math.random() * 100);
    const node = new TreeNode(value);
    node.left = Math.random() < 0.7 ? generateRandomTree(depth - 1) : null;
    node.right = Math.random() < 0.7 ? generateRandomTree(depth - 1) : null;
    return node;
  };

  const handleGenerateRandomTree = () => {
    const randomTree = generateRandomTree(4); // Adjust depth as needed
    setRoot(randomTree);
    setDfsOrder([]);
    setHighlightedNodes(new Set());
    setHighlightedLinks(new Set());
  };

  const dfsTraversal = (
    node: TreeNode | null,
    result: number[] = [],
    links: string[] = []
  ) => {
    if (node) {
      result.push(node.value);
      if (node.left) {
        links.push(`${node.value}-${node.left.value}`);
        dfsTraversal(node.left, result, links);
      }
      if (node.right) {
        links.push(`${node.value}-${node.right.value}`);
        dfsTraversal(node.right, result, links);
      }
    }
    return { result, links };
  };

  const handleDFS = () => {
    if (!root) return;
    const { result, links } = dfsTraversal(root);
    setDfsOrder(result);
    animateDFS(result, links);
  };

  const animateDFS = (order: number[], links: string[]) => {
    let i = 0;
    const intervalId = setInterval(() => {
      if (i < order.length) {
        setHighlightedNodes(new Set([order[i]]));
        if (i > 0) {
          setHighlightedLinks(new Set([links[i - 1]]));
        }
        i++;
      } else {
        clearInterval(intervalId);
        setHighlightedNodes(new Set());
        setHighlightedLinks(new Set());
      }
    }, 1000);
  };

  const handleReset = () => {
    setRoot(null);
    setDfsOrder([]);
    setHighlightedNodes(new Set());
    setHighlightedLinks(new Set());
    if (treeViewerRef.current) {
      while (treeViewerRef.current.scene.children.length > 0) {
        treeViewerRef.current.scene.remove(
          treeViewerRef.current.scene.children[0]
        );
      }
      treeViewerRef.current.enableRender();
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={treeDomElementRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>DFS Algorithm Circus</h3>
        <div className='grid grid-cols-3 gap-2'>
          <button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            Insert Random Node
          </button>
          <button
            onClick={handleGenerateRandomTree}
            className='bg-purple-500 text-white px-4 py-2 rounded'
          >
            Generate Random Tree
          </button>
          <button
            onClick={handleDFS}
            className='bg-green-500 text-white px-4 py-2 rounded'
          >
            Run DFS
          </button>
          <button
            onClick={handleReset}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Reset Tree
          </button>
        </div>
      </div>
      <div className='absolute bottom-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>DFS Order</h3>
        <p>{dfsOrder.join(' -> ')}</p>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow w-[30rem]'>
        <h3 className='text-lg font-bold mb-2'>About DFS</h3>
        <p>
          Depth-First Search (DFS) is an algorithm for traversing or searching
          tree or graph data structures. It starts at the root and explores as
          far as possible along each branch before backtracking.
        </p>
      </div>
    </div>
  );
};

export default DfsAlgorithmCircus;
