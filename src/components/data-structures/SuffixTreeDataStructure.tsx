import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface SuffixNode {
  children: Map<string, SuffixNode>;
  start: number;
  end: number;
  suffixIndex: number;
}

const SuffixTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [text, setText] = useState('banana$');
  const [inputText, setInputText] = useState('banana');
  const [searchPattern, setSearchPattern] = useState('');
  const [root, setRoot] = useState<SuffixNode | null>(null);
  const [message, setMessage] = useState('');
  const [highlightEdges, setHighlightEdges] = useState<string[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 8;
      buildTree('banana$');
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [root, highlightEdges]);

  const createNode = (
    start: number,
    end: number,
    suffixIndex: number = -1
  ): SuffixNode => ({
    children: new Map(),
    start,
    end,
    suffixIndex,
  });

  const buildTree = (str: string) => {
    const r = createNode(-1, -1);

    for (let i = 0; i < str.length; i++) {
      let current = r;
      let j = i;

      while (j < str.length) {
        const ch = str[j];
        if (current.children.has(ch)) {
          const child = current.children.get(ch)!;
          const edgeStr = str.substring(child.start, child.end + 1);
          let k = 0;
          while (k < edgeStr.length && j < str.length && str[j] === edgeStr[k]) {
            j++;
            k++;
          }
          if (k === edgeStr.length) {
            current = child;
          } else {
            // Split edge
            const splitNode = createNode(child.start, child.start + k - 1);
            current.children.set(ch, splitNode);

            child.start = child.start + k;
            splitNode.children.set(str[child.start], child);

            const newLeaf = createNode(j, str.length - 1, i);
            splitNode.children.set(str[j], newLeaf);
            j = str.length;
          }
        } else {
          const leaf = createNode(j, str.length - 1, i);
          current.children.set(ch, leaf);
          j = str.length;
        }
      }
    }

    setRoot(r);
    setText(str);
    setMessage(`Built suffix tree for "${str}" (${str.length} suffixes)`);
  };

  const handleBuild = () => {
    const str = inputText + (inputText.endsWith('$') ? '' : '$');
    buildTree(str);
    setHighlightEdges([]);
  };

  const handleSearch = () => {
    if (!root || !searchPattern) {
      setMessage('Enter a pattern to search');
      return;
    }

    let current = root;
    let i = 0;
    const path: string[] = [];

    while (i < searchPattern.length) {
      const ch = searchPattern[i];
      if (!current.children.has(ch)) {
        setMessage(`Pattern "${searchPattern}" NOT found`);
        setHighlightEdges([]);
        return;
      }
      const child = current.children.get(ch)!;
      const edgeStr = text.substring(child.start, child.end + 1);
      path.push(edgeStr);

      let k = 0;
      while (k < edgeStr.length && i < searchPattern.length) {
        if (searchPattern[i] !== edgeStr[k]) {
          setMessage(`Pattern "${searchPattern}" NOT found`);
          setHighlightEdges([]);
          return;
        }
        i++;
        k++;
      }
      current = child;
    }

    setHighlightEdges(path);
    setMessage(`Pattern "${searchPattern}" FOUND in text`);
    setTimeout(() => setHighlightEdges([]), 2000);
  };

  const updateVisualization = () => {
    if (!viewerRef.current || !root) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const positions: Map<SuffixNode, { x: number; y: number }> = new Map();

    // Count leaves for layout
    const countLeaves = (node: SuffixNode): number => {
      if (node.children.size === 0) return 1;
      let count = 0;
      node.children.forEach((child) => (count += countLeaves(child)));
      return count;
    };

    const totalLeaves = countLeaves(root);

    // Layout tree
    let leafIndex = 0;
    const layoutNode = (node: SuffixNode, depth: number) => {
      if (node.children.size === 0) {
        positions.set(node, {
          x: (leafIndex / totalLeaves) * 12 - 6,
          y: -depth * 1.5,
        });
        leafIndex++;
        return;
      }
      node.children.forEach((child) => layoutNode(child, depth + 1));
      let sumX = 0;
      let count = 0;
      node.children.forEach((child) => {
        const pos = positions.get(child);
        if (pos) {
          sumX += pos.x;
          count++;
        }
      });
      positions.set(node, { x: sumX / count, y: -depth * 1.5 });
    };

    layoutNode(root, 0);

    // Draw
    const drawNode = (node: SuffixNode, parent: SuffixNode | null) => {
      const pos = positions.get(node);
      if (!pos) return;

      // Node sphere
      const isLeaf = node.children.size === 0;
      const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: isLeaf ? 0x10b981 : 0x4287f5,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(pos.x, pos.y, 0);
      group.add(sphere);

      // Edge label from parent
      if (parent && node.start >= 0) {
        const parentPos = positions.get(parent);
        if (parentPos) {
          const edgeStr = text.substring(node.start, node.end + 1);
          const isHighlighted = highlightEdges.includes(edgeStr);

          // Line
          const points = [
            new THREE.Vector3(parentPos.x, parentPos.y, 0),
            new THREE.Vector3(pos.x, pos.y, 0),
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({
            color: isHighlighted ? 0xff4444 : 0x999999,
          });
          group.add(new THREE.Line(lineGeo, lineMat));

          // Edge label
          const midX = (parentPos.x + pos.x) / 2;
          const midY = (parentPos.y + pos.y) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = isHighlighted ? '#ff4444' : '#666';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edgeStr, 64, 16);
          }
          const texture = new THREE.CanvasTexture(canvas);
          const labelMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
          });
          const label = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.2),
            labelMat
          );
          label.position.set(midX + 0.2, midY, 0.1);
          group.add(label);
        }
      }

      // Suffix index for leaves
      if (isLeaf && node.suffixIndex >= 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#10b981';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`[${node.suffixIndex}]`, 32, 16);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const labelMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
        });
        const label = new THREE.Mesh(
          new THREE.PlaneGeometry(0.4, 0.2),
          labelMat
        );
        label.position.set(pos.x, pos.y - 0.3, 0);
        group.add(label);
      }

      node.children.forEach((child) => drawNode(child, node));
    };

    drawNode(root, null);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Suffix Tree</h2>

        <div className="mb-2 text-sm">
          <strong>Text:</strong> "{text}"
        </div>

        {message && (
          <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="space-y-2">
          <div>
            <input
              type="text"
              placeholder="Text (e.g. banana)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full"
            />
            <button
              onClick={handleBuild}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm w-full mt-1"
            >
              Build Tree
            </button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search pattern"
              value={searchPattern}
              onChange={(e) => setSearchPattern(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-full"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm w-full mt-1"
            >
              Search Pattern
            </button>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <strong>Complexity:</strong> Build O(n), Search O(m)
          <br />
          <strong>Legend:</strong> Blue = internal, Green = leaf [suffix index]
        </div>
      </div>
    </div>
  );
};

export default SuffixTreeDataStructure;
