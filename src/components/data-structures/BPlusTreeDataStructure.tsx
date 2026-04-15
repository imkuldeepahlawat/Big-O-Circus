import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface BPlusNode {
  keys: number[];
  children: BPlusNode[];
  leaf: boolean;
  next: BPlusNode | null;
}

const ORDER = 4; // Max keys per node

const BPlusTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<BPlusNode | null>(null);
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

  const createLeaf = (): BPlusNode => ({
    keys: [],
    children: [],
    leaf: true,
    next: null,
  });

  const createInternal = (): BPlusNode => ({
    keys: [],
    children: [],
    leaf: false,
    next: null,
  });

  const insertKey = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number');
      return;
    }

    let r = root ? JSON.parse(JSON.stringify(root)) : null;

    if (!r) {
      r = createLeaf();
      r.keys.push(val);
    } else {
      if (r.leaf) {
        r.keys.push(val);
        r.keys.sort((a: number, b: number) => a - b);
        if (r.keys.length > ORDER) {
          const mid = Math.ceil(r.keys.length / 2);
          const newLeaf = createLeaf();
          newLeaf.keys = r.keys.splice(mid);
          const newRoot = createInternal();
          newRoot.keys = [newLeaf.keys[0]];
          newRoot.children = [r, newLeaf];
          r = newRoot;
        }
      } else {
        insertIntoTree(r, val);
        if (r.keys.length > ORDER) {
          const mid = Math.floor(r.keys.length / 2);
          const promoteKey = r.keys[mid];
          const newInternal = createInternal();
          newInternal.keys = r.keys.splice(mid + 1);
          newInternal.children = r.children.splice(mid + 1);
          r.keys.pop();
          const newRoot = createInternal();
          newRoot.keys = [promoteKey];
          newRoot.children = [r, newInternal];
          r = newRoot;
        }
      }
    }

    setRoot(r);
    setHighlightKeys([val]);
    setMessage(`Inserted ${val} (Order ${ORDER})`);
    setInputValue('');
    setTimeout(() => setHighlightKeys([]), 1500);
  };

  const insertIntoTree = (node: BPlusNode, key: number) => {
    if (node.leaf) {
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);
      return;
    }

    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) i++;
    const child = node.children[i];

    insertIntoTree(child, key);

    if (child.keys.length > ORDER) {
      if (child.leaf) {
        const mid = Math.ceil(child.keys.length / 2);
        const newNode = createLeaf();
        newNode.keys = child.keys.splice(mid);
        node.keys.splice(i, 0, newNode.keys[0]);
        node.children.splice(i + 1, 0, newNode);
      } else {
        const mid = Math.floor(child.keys.length / 2);
        const promoteKey = child.keys[mid];
        const newNode = createInternal();
        newNode.keys = child.keys.splice(mid + 1);
        newNode.children = child.children.splice(mid + 1);
        child.keys.pop();
        node.keys.splice(i, 0, promoteKey);
        node.children.splice(i + 1, 0, newNode);
      }
    }
  };

  const getHeight = (node: BPlusNode | null): number => {
    if (!node) return 0;
    if (node.leaf) return 1;
    return 1 + getHeight(node.children[0]);
  };

  const countKeys = (node: BPlusNode | null): number => {
    if (!node) return 0;
    if (node.leaf) return node.keys.length;
    let count = 0;
    for (const child of node.children) count += countKeys(child);
    return count;
  };

  const generateRandom = () => {
    let r: BPlusNode | null = null;
    const values = Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 40) + 1
    );
    const unique = [...new Set(values)].sort((a, b) => a - b);

    for (const val of unique) {
      if (!r) {
        r = createLeaf();
        r.keys.push(val);
      } else {
        // Simplified: rebuild from scratch
        const allKeys = getAllKeys(r);
        allKeys.push(val);
        r = null;
        for (const k of [...new Set(allKeys)].sort((a, b) => a - b)) {
          if (!r) {
            r = createLeaf();
            r.keys.push(k);
          } else if (r.leaf) {
            r.keys.push(k);
            r.keys.sort((a, b) => a - b);
            if (r.keys.length > ORDER) {
              const mid = Math.ceil(r.keys.length / 2);
              const newLeaf = createLeaf();
              newLeaf.keys = r.keys.splice(mid);
              const newRoot = createInternal();
              newRoot.keys = [newLeaf.keys[0]];
              newRoot.children = [r, newLeaf];
              r = newRoot;
            }
          } else {
            insertIntoTree(r, k);
            if (r.keys.length > ORDER) {
              const mid = Math.floor(r.keys.length / 2);
              const promoteKey = r.keys[mid];
              const newInternal = createInternal();
              newInternal.keys = r.keys.splice(mid + 1);
              newInternal.children = r.children.splice(mid + 1);
              r.keys.pop();
              const newRoot = createInternal();
              newRoot.keys = [promoteKey];
              newRoot.children = [r, newInternal];
              r = newRoot;
            }
          }
        }
      }
    }

    setRoot(r);
    setMessage(`Generated B+ Tree with ${unique.length} keys`);
  };

  const getAllKeys = (node: BPlusNode): number[] => {
    if (node.leaf) return [...node.keys];
    let keys: number[] = [];
    for (const child of node.children) keys = keys.concat(getAllKeys(child));
    return keys;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    if (!root) {
      viewerRef.current.enableRender();
      return;
    }

    const group = new THREE.Group();
    drawNode(group, root, 0, 0, 10);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawNode = (
    group: THREE.Group,
    node: BPlusNode,
    x: number,
    y: number,
    spread: number
  ) => {
    const nodeColor = node.leaf ? 0x10b981 : 0x4287f5;

    node.keys.forEach((key, i) => {
      const isHighlighted = highlightKeys.includes(key);
      const boxGeo = new THREE.BoxGeometry(0.7, 0.5, 0.5);
      const boxMat = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0xff4444 : nodeColor,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      const nodeWidth = node.keys.length * 0.8;
      box.position.set(x + i * 0.8 - (nodeWidth - 0.8) / 2, y, 0);
      group.add(box);

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
      label.position.set(
        x + i * 0.8 - (nodeWidth - 0.8) / 2,
        y + 0.4,
        0
      );
      group.add(label);
    });

    if (!node.leaf && node.children.length > 0) {
      const childSpread = spread / (node.children.length || 1);
      node.children.forEach((child, i) => {
        const childX =
          x + (i - (node.children.length - 1) / 2) * childSpread;
        const childY = y - 1.5;

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
        <h2 className="text-xl font-bold mb-3">B+ Tree (Order {ORDER})</h2>

        <div className="mb-3 text-sm">
          <strong>Keys:</strong> {countKeys(root)} |{' '}
          <strong>Height:</strong> {getHeight(root)}
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
          <strong>Complexity:</strong> Search/Insert O(log n)
          <br />
          <strong>B+ Tree:</strong> All data in leaf nodes (green). Internal
          nodes (blue) are index only. Leaf nodes linked for range queries.
        </div>
      </div>
    </div>
  );
};

export default BPlusTreeDataStructure;
