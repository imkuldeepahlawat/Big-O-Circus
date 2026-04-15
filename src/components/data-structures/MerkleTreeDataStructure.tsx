import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface MerkleNode { hash: string; left: MerkleNode | null; right: MerkleNode | null; data: string | null; tampered: boolean; }

const simpleHash = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 8).padStart(8, '0');
};

const MerkleTreeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [blocks, setBlocks] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [root, setRoot] = useState<MerkleNode | null>(null);
  const [inputBlocks, setInputBlocks] = useState('A,B,C,D');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 7;
      buildTree(['A', 'B', 'C', 'D']);
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [root]);

  const buildMerkle = (data: string[]): MerkleNode | null => {
    if (data.length === 0) return null;
    let nodes: MerkleNode[] = data.map((d) => ({ hash: simpleHash(d), left: null, right: null, data: d, tampered: false }));
    while (nodes.length > 1) {
      const next: MerkleNode[] = [];
      for (let i = 0; i < nodes.length; i += 2) {
        if (i + 1 < nodes.length) {
          const combined = nodes[i].hash + nodes[i + 1].hash;
          next.push({ hash: simpleHash(combined), left: nodes[i], right: nodes[i + 1], data: null, tampered: false });
        } else {
          next.push(nodes[i]);
        }
      }
      nodes = next;
    }
    return nodes[0];
  };

  const buildTree = (data: string[]) => {
    setBlocks(data);
    setRoot(buildMerkle(data));
    setMessage(`Built Merkle Tree with ${data.length} blocks. Root: ${simpleHash(data.join(''))}`);
  };

  const tamperBlock = () => {
    if (blocks.length === 0) return;
    const idx = Math.floor(Math.random() * blocks.length);
    const newBlocks = [...blocks];
    newBlocks[idx] = newBlocks[idx] + '*';
    const newRoot = buildMerkle(newBlocks);
    // Mark tampered path
    const markTampered = (node: MerkleNode | null, origNode: MerkleNode | null) => {
      if (!node || !origNode) return;
      if (node.hash !== origNode.hash) { node.tampered = true; }
      markTampered(node.left, origNode.left);
      markTampered(node.right, origNode.right);
    };
    markTampered(newRoot, root);
    setBlocks(newBlocks);
    setRoot(newRoot);
    setMessage(`Tampered block ${idx}! Hash mismatch detected.`);
  };

  const updateVisualization = () => {
    if (!viewerRef.current || !root) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();
    drawNode(group, root, 0, 2, 5);
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const drawNode = (group: THREE.Group, node: MerkleNode, x: number, y: number, spread: number) => {
    const isLeaf = !node.left && !node.right;
    const geo = isLeaf ? new THREE.BoxGeometry(0.5, 0.4, 0.4) : new THREE.SphereGeometry(0.2, 16, 16);
    const color = node.tampered ? 0xff4444 : isLeaf ? 0x10b981 : 0x4287f5;
    const mat = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, 0);
    group.add(mesh);

    // Hash label
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = node.tampered ? '#ff4444' : '#666';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.data ? `${node.data}:${node.hash.slice(0, 4)}` : node.hash.slice(0, 6), 64, 16);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.2), labelMat);
    label.position.set(x, y + 0.4, 0);
    group.add(label);

    if (node.left) {
      const lx = x - spread / 2, ly = y - 1.3;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, 0), new THREE.Vector3(lx, ly, 0)]), new THREE.LineBasicMaterial({ color: node.left.tampered ? 0xff4444 : 0x999999 })));
      drawNode(group, node.left, lx, ly, spread / 2);
    }
    if (node.right) {
      const rx = x + spread / 2, ry = y - 1.3;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, 0), new THREE.Vector3(rx, ry, 0)]), new THREE.LineBasicMaterial({ color: node.right.tampered ? 0xff4444 : 0x999999 })));
      drawNode(group, node.right, rx, ry, spread / 2);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Merkle Tree</h2>
        <div className="mb-2 text-sm"><strong>Blocks:</strong> [{blocks.join(', ')}]</div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <input type="text" placeholder="Blocks (comma-separated)" value={inputBlocks} onChange={(e) => setInputBlocks(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="flex flex-wrap gap-1">
            <button onClick={() => buildTree(inputBlocks.split(',').map((s) => s.trim()).filter(Boolean))} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Build</button>
            <button onClick={tamperBlock} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Tamper</button>
            <button onClick={() => { setRoot(null); setBlocks([]); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Legend:</strong> Blue=internal, Green=leaf, Red=tampered. Used in blockchain/git for data integrity verification.
        </div>
      </div>
    </div>
  );
};

export default MerkleTreeDataStructure;
