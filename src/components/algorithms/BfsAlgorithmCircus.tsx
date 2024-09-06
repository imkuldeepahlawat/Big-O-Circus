import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BinaryTreeNode {
  value: number;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

interface BfsResult {
  visitedOrder: number[];
  levels: number[][];
  queueStates: number[][];
  processingStates: number[][];
}

const BfsAlgorithmCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [rootNode, setRootNode] = useState<BinaryTreeNode | null>(null);
  const [bfsTraversalOrder, setBfsTraversalOrder] = useState<number[]>([]);
  const [currentVisitedLevel, setCurrentVisitedLevel] = useState<number[]>([]);
  const [currentQueueState, setCurrentQueueState] = useState<number[]>([]);
  const [currentProcessingNode, setCurrentProcessingNode] = useState<number[]>(
    []
  );
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      updateVisualization();
    }
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [rootNode, currentVisitedLevel, currentQueueState, currentProcessingNode]);

  const updateVisualization = (): void => {
    if (visualizerRef.current) {
      clearScene();
      const sceneGroup = new THREE.Group();

      if (rootNode) {
        visualizeTree(rootNode, 0, 0, 5, sceneGroup);
      }

      visualizeQueue(sceneGroup);

      visualizerRef.current.scene.add(sceneGroup);
      visualizerRef.current.enableRender();
    }
  };

  const clearScene = (): void => {
    while (visualizerRef.current?.scene.children.length ?? 0 > 0) {
      visualizerRef.current?.scene.remove(
        visualizerRef.current.scene.children[0]
      );
    }
  };

  const visualizeTree = (
    node: BinaryTreeNode,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group
  ): void => {
    const nodeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: currentVisitedLevel.includes(node.value) ? 0xff0000 : 0x4287f5,
    });
    const nodeSphere = new THREE.Mesh(nodeGeometry, nodeMaterial);

    nodeSphere.position.set(x, -y, 0);
    group.add(nodeSphere);

    addTextLabel(node.value.toString(), x, -y, 0.5, group);

    if (node.left) {
      visualizeTree(node.left, x - spread, y + 2, spread / 2, group);
      addEdge(x, -y, x - spread, -(y + 2), group);
    }

    if (node.right) {
      visualizeTree(node.right, x + spread, y + 2, spread / 2, group);
      addEdge(x, -y, x + spread, -(y + 2), group);
    }
  };

  const addTextLabel = (
    text: string,
    x: number,
    y: number,
    z: number,
    group: THREE.Group
  ): void => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, y, z);
    group.add(label);
  };

  const addEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    group: THREE.Group
  ): void => {
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y1, 0),
      new THREE.Vector3(x2, y2, 0),
    ]);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const edge = new THREE.Line(edgeGeometry, edgeMaterial);
    group.add(edge);
  };

  const visualizeQueue = (group: THREE.Group): void => {
    const queueGroup = new THREE.Group();
    queueGroup.position.set(-5, 5, 0); // Position the queue above and to the left of the tree

    currentQueueState.forEach((value, index) => {
      const queueItemGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const queueItemMaterial = new THREE.MeshBasicMaterial({
        color: 0xffa500,
      });
      const queueItemCube = new THREE.Mesh(
        queueItemGeometry,
        queueItemMaterial
      );

      queueItemCube.position.set(index * 1, 0, 0);
      queueGroup.add(queueItemCube);

      addTextLabel(value.toString(), index * 1, 0, 0.41, queueGroup);
    });

    group.add(queueGroup);
  };

  const createTreeFromArray = (
    arr: (number | null)[]
  ): BinaryTreeNode | null => {
    if (arr.length === 0 || arr[0] === null) return null;
    const root: BinaryTreeNode = { value: arr[0], left: null, right: null };
    const queue: BinaryTreeNode[] = [root];
    let i = 1;

    while (queue.length > 0 && i < arr.length) {
      const node = queue.shift()!;
      if (i < arr.length && arr[i] !== null) {
        node.left = { value: arr[i]!, left: null, right: null };
        queue.push(node.left);
      }
      i++;
      if (i < arr.length && arr[i] !== null) {
        node.right = { value: arr[i]!, left: null, right: null };
        queue.push(node.right);
      }
      i++;
    }

    return root;
  };

  const handleCreateFromArray = (): void => {
    const input = prompt(
      "Enter comma-separated numbers for the binary tree (use 'null' for empty nodes):"
    );
    if (input) {
      const numbers = input
        .split(',')
        .map((num) =>
          num.trim().toLowerCase() === 'null' ? null : Number(num)
        );
      const newRoot = createTreeFromArray(numbers);
      setRootNode(newRoot);
      resetVisualizationStates();
    }
  };

  const generateRandomTree = (depth: number = 4): BinaryTreeNode => {
    const value = Math.floor(Math.random() * 100);
    const node: BinaryTreeNode = { value, left: null, right: null };

    if (depth > 0) {
      if (Math.random() > 0.3) {
        node.left = generateRandomTree(depth - 1);
      }
      if (Math.random() > 0.3) {
        node.right = generateRandomTree(depth - 1);
      }
    }

    return node;
  };

  const handleGenerateRandomTree = (): void => {
    const newRoot = generateRandomTree();
    setRootNode(newRoot);
    resetVisualizationStates();
  };

  const performBfs = (node: BinaryTreeNode | null): BfsResult => {
    if (!node)
      return {
        visitedOrder: [],
        levels: [],
        queueStates: [],
        processingStates: [],
      };
    const queue: BinaryTreeNode[] = [node];
    const result: BfsResult = {
      visitedOrder: [],
      levels: [],
      queueStates: [[node.value]],
      processingStates: [],
    };

    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel: number[] = [];

      for (let i = 0; i < levelSize; i++) {
        const currentNode = queue.shift()!;
        result.visitedOrder.push(currentNode.value);
        currentLevel.push(currentNode.value);
        result.processingStates.push([currentNode.value]);

        if (currentNode.left) {
          queue.push(currentNode.left);
          result.queueStates.push(queue.map((n) => n.value));
          result.processingStates.push([]);
        }
        if (currentNode.right) {
          queue.push(currentNode.right);
          result.queueStates.push(queue.map((n) => n.value));
          result.processingStates.push([]);
        }
      }

      result.levels.push(currentLevel);
      if (queue.length > 0) {
        result.queueStates.push(queue.map((n) => n.value));
        result.processingStates.push([]);
      }
    }

    return result;
  };

  const handleStartBfs = (): void => {
    if (!rootNode || isAnimationRunning) return;
    setIsAnimationRunning(true);
    const { visitedOrder, levels, queueStates, processingStates } =
      performBfs(rootNode);
    setBfsTraversalOrder(visitedOrder);
    animateBfs(levels, queueStates, processingStates);
  };

  const animateBfs = (
    levels: number[][],
    queueStates: number[][],
    processingStates: number[][]
  ): void => {
    let step = 0;
    const intervalId = setInterval(() => {
      if (step < queueStates.length) {
        setCurrentVisitedLevel(levels[Math.floor(step / 2)]);
        setCurrentQueueState(queueStates[step]);
        setCurrentProcessingNode(processingStates[step]);
        step++;
      } else {
        clearInterval(intervalId);
        resetVisualizationStates();
        setIsAnimationRunning(false);
      }
    }, 1000);
  };

  const handleGenerateAndStartBfs = (): void => {
    handleGenerateRandomTree();
    setTimeout(() => {
      handleStartBfs();
    }, 100); // Small delay to ensure the tree is generated before starting BFS
  };

  const resetVisualizationStates = (): void => {
    setBfsTraversalOrder([]);
    setCurrentVisitedLevel([]);
    setCurrentQueueState([]);
    setCurrentProcessingNode([]);
  };

  const handleReset = (): void => {
    setRootNode(null);
    resetVisualizationStates();
    setIsAnimationRunning(false);
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>BFS Algorithm Visualization</h3>
        <button
          onClick={handleGenerateRandomTree}
          className='bg-yellow-500 text-white px-4 py-2 rounded mr-2 mb-2'
        >
          Generate Random Tree
        </button>
        <button
          onClick={handleGenerateAndStartBfs}
          className='bg-purple-500 text-white px-4 py-2 rounded mr-2 mb-2'
          disabled={isAnimationRunning}
        >
          Generate and Start BFS
        </button>
        <button
          onClick={handleCreateFromArray}
          className='bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2'
        >
          Create Tree from Array
        </button>
        <button
          onClick={handleStartBfs}
          className='bg-blue-500 text-white px-4 py-2 rounded mr-2 mb-2'
          disabled={isAnimationRunning || !rootNode}
        >
          Start BFS
        </button>
        <button
          onClick={handleReset}
          className='bg-red-500 text-white px-4 py-2 rounded mr-2 mb-2'
        >
          Reset
        </button>
      </div>
      <div className='absolute bottom-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>BFS Traversal Order</h3>
        <p>{bfsTraversalOrder.join(' -> ')}</p>
      </div>
      <div className='absolute bottom-20 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Currently Processing Node</h3>
        <p>
          {currentProcessingNode.length > 0 ? currentProcessingNode[0] : 'None'}
        </p>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow w-[30rem]'>
        <h3 className='text-lg font-bold mb-2'>About BFS</h3>
        <p>
          Breadth-First Search (BFS) is an algorithm for traversing or searching
          tree or graph data structures. It starts at the tree root and explores
          all nodes at the present depth prior to moving on to the nodes at the
          next depth level. The algorithm uses a queue to keep track of the
          nodes to visit next. At each step, it processes the next node in the
          queue.
        </p>
      </div>
    </div>
  );
};

export default BfsAlgorithmCircus;
