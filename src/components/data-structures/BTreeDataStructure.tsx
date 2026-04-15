import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BTreeNode {
  keys: number[];
  children: BTreeNode[];
  leaf: boolean;
}

const T = 2; // Minimum degree

const BTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<BTreeNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [highlightKeys, setHighlightKeys] = useState<number[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [root, highlightKeys]);

  const createNode = (leaf: boolean): BTreeNode => ({
    keys: [],
    children: [],
    leaf,
  });

  const splitChild = (parent: BTreeNode, i: number) => {
    const full = parent.children[i];
    const newNode = createNode(full.leaf);
    newNode.keys = full.keys.splice(T);
    const median = full.keys.pop()!;
    if (!full.leaf) {
      newNode.children = full.children.splice(T);
    }
    parent.keys.splice(i, 0, median);
    parent.children.splice(i + 1, 0, newNode);
  };

  const insertNonFull = (node: BTreeNode, key: number) => {
    let i = node.keys.length - 1;
    if (node.leaf) {
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      node.keys.splice(i + 1, 0, key);
    } else {
      while (i >= 0 && key < node.keys[i]) {
        i--;
      }
      i++;
      if (node.children[i].keys.length === 2 * T - 1) {
        splitChild(node, i);
        if (key > node.keys[i]) i++;
      }
      insertNonFull(node.children[i], key);
    }
  };

  const insertKey = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number');
      return;
    }

    let r = root ? JSON.parse(JSON.stringify(root)) : null;
    if (!r) {
      r = createNode(true);
      r.keys.push(val);
    } else if (r.keys.length === 2 * T - 1) {
      const s = createNode(false);
      s.children.push(r);
      splitChild(s, 0);
      insertNonFull(s, val);
      r = s;
    } else {
      insertNonFull(r, val);
    }

    setRoot(r);
    setHighlightKeys([val]);
    setMessage(`Inserted ${val} (min degree T=${T}, max keys=${2 * T - 1})`);
    setInputValue('');
    setTimeout(() => setHighlightKeys([]), 1500);
  };

  const searchKey = () => {
    const val = parseInt(inputValue);
    if (isNaN(val) || !root) {
      setMessage('Enter a valid number');
      return;
    }
    const found = searchNode(root, val);
    setHighlightKeys([val]);
    setMessage(found ? `Found ${val} in B-Tree` : `${val} not found`);
    setTimeout(() => setHighlightKeys([]), 1500);
  };

  const searchNode = (node: BTreeNode, key: number): boolean => {
    let i = 0;
    while (i < node.keys.length && key > node.keys[i]) i++;
    if (i < node.keys.length && node.keys[i] === key) return true;
    if (node.leaf) return false;
    return searchNode(node.children[i], key);
  };

  const countNodes = (node: BTreeNode | null): number => {
    if (!node) return 0;
    let count = 1;
    for (const child of node.children) count += countNodes(child);
    return count;
  };

  const getHeight = (node: BTreeNode | null): number => {
    if (!node) return 0;
    if (node.leaf) return 1;
    return 1 + getHeight(node.children[0]);
  };

  const generateRandom = () => {
    let r: BTreeNode | null = null;
    const values = Array.from({ length: 10 }, () =>
      Math.floor(Math.random() * 50) + 1
    );
    const unique = [...new Set(values)];
    for (const val of unique) {
      if (!r) {
        r = createNode(true);
        r.keys.push(val);
      } else if (r.keys.length === 2 * T - 1) {
        const s = createNode(false);
        s.children.push(r);
        splitChild(s, 0);
        insertNonFull(s, val);
        r = s;
      } else {
        insertNonFull(r, val);
      }
    }
    setRoot(r);
    setMessage(`Generated B-Tree with ${unique.length} keys`);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    if (!root) {
      viewerRef.current.enableRender();
      return;
    }

    const group = new THREE.Group();
    drawNode(group, root, 0, 0, 8);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawNode = (
    group: THREE.Group,
    node: BTreeNode,
    x: number,
    y: number,
    spread: number
  ) => {
    const nodeWidth = node.keys.length * 0.8;

    node.keys.forEach((key, i) => {
      const isHighlighted = highlightKeys.includes(key);
      const boxGeo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
      const boxMat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0xff4444 : 0x4287f5,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(x + i * 0.8 - (nodeWidth - 0.8) / 2, y, 0);
      group.add(box);

      // Key label
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key.toString(), 32, 16);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), labelMat);
      label.position.set(x + i * 0.8 - (nodeWidth - 0.8) / 2, y + 0.4, 0);
      group.add(label);
    });

    // Draw children
    if (!node.leaf) {
      const childSpread = spread / (node.children.length || 1);
      node.children.forEach((child, i) => {
        const childX =
          x + (i - (node.children.length - 1) / 2) * childSpread;
        const childY = y - 1.5;

        // Line from parent to child
        const points = [
          new THREE.Vector3(x, y - 0.25, 0),
          new THREE.Vector3(childX, childY + 0.25, 0),
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x999999 });
        group.add(new THREE.Line(lineGeo, lineMat));

        drawNode(group, child, childX, childY, childSpread);
      });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">B-Tree (T={T})</h2>

        <div className="mb-3 text-sm">
          <strong>Nodes:</strong> {countNodes(root)} |{' '}
          <strong>Height:</strong> {getHeight(root)} |{' '}
          <strong>Max keys/node:</strong> {2 * T - 1}
        </div>

        {message && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <input
            type="number"
            placeholder="Value"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border rounded px-2 py-1 text-sm w-full"
          />
          <div className="flex flex-wrap gap-1">
            <button
              onClick={insertKey}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              Insert
            </button>
            <button
              onClick={searchKey}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Search
            </button>
            <button
              onClick={generateRandom}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
            >
              Random
            </button>
            <button
              onClick={() => {
                setRoot(null);
                setMessage('Cleared');
              }}
              className="bg-gray-400 text-white px-3 py-1 rounded text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Search/Insert/Delete O(log n)
          <br />
          <strong>Properties:</strong> Every node has at most {2 * T - 1} keys.
          Root has at least 1 key. All leaves at same level.
        </div>
      </div>
    </div>
  );
};

export default BTreeDataStructure;
