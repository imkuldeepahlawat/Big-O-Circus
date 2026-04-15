import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface RopeNode {
  weight: number;
  value: string | null; // leaf only
  left: RopeNode | null;
  right: RopeNode | null;
}

const RopeDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<RopeNode | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [indexInput, setIndexInput] = useState('');
  const [splitInput, setSplitInput] = useState('');
  const [message, setMessage] = useState('Rope ready');
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2, 14);
      viewerRef.current.camera.lookAt(0, -1, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [root, highlightedNode]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 80, 32);
    }
    return canvas;
  };

  const createLeaf = (s: string): RopeNode => ({
    weight: s.length,
    value: s,
    left: null,
    right: null,
  });

  const concatRopes = (left: RopeNode | null, right: RopeNode | null): RopeNode | null => {
    if (!left) return right;
    if (!right) return left;
    return {
      weight: ropeLength(left),
      value: null,
      left,
      right,
    };
  };

  const ropeLength = (node: RopeNode | null): number => {
    if (!node) return 0;
    if (node.value !== null) return node.value.length;
    return node.weight + ropeLength(node.right);
  };

  const ropeToString = (node: RopeNode | null): string => {
    if (!node) return '';
    if (node.value !== null) return node.value;
    return ropeToString(node.left) + ropeToString(node.right);
  };

  const ropeIndex = (node: RopeNode | null, idx: number): string | null => {
    if (!node) return null;
    if (node.value !== null) {
      return idx < node.value.length ? node.value[idx] : null;
    }
    if (idx < node.weight) {
      return ropeIndex(node.left, idx);
    }
    return ropeIndex(node.right, idx - node.weight);
  };

  const splitRope = (node: RopeNode | null, idx: number): [RopeNode | null, RopeNode | null] => {
    if (!node) return [null, null];
    if (node.value !== null) {
      if (idx >= node.value.length) return [node, null];
      if (idx <= 0) return [null, node];
      return [createLeaf(node.value.substring(0, idx)), createLeaf(node.value.substring(idx))];
    }
    if (idx < node.weight) {
      const [leftL, leftR] = splitRope(node.left, idx);
      return [leftL, concatRopes(leftR, node.right)];
    }
    if (idx > node.weight) {
      const [rightL, rightR] = splitRope(node.right, idx - node.weight);
      return [concatRopes(node.left, rightL), rightR];
    }
    return [node.left, node.right];
  };

  const buildBalancedRope = (s: string): RopeNode | null => {
    if (s.length === 0) return null;
    if (s.length <= 4) return createLeaf(s);
    const mid = Math.floor(s.length / 2);
    const left = buildBalancedRope(s.substring(0, mid));
    const right = buildBalancedRope(s.substring(mid));
    return concatRopes(left, right);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    if (root) {
      drawNode(group, root, 0, 0, 6, 0);

      // Full string at bottom
      const fullStr = ropeToString(root);
      const displayStr = fullStr.length > 20 ? fullStr.substring(0, 20) + '..' : fullStr;
      const strTexture = new THREE.CanvasTexture(makeTextCanvas(`"${displayStr}"`, '#cccccc', 18));
      const strMat = new THREE.MeshBasicMaterial({ map: strTexture, transparent: true });
      const strLabel = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.3), strMat);
      const depth = getDepth(root);
      strLabel.position.set(0, -(depth + 1) * 1.8, 0);
      group.add(strLabel);

      const lenTexture = new THREE.CanvasTexture(makeTextCanvas(`Length: ${fullStr.length}`, '#aaaaaa', 18));
      const lenMat = new THREE.MeshBasicMaterial({ map: lenTexture, transparent: true });
      const lenLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.25), lenMat);
      lenLabel.position.set(0, -(depth + 1) * 1.8 - 0.4, 0);
      group.add(lenLabel);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const getDepth = (node: RopeNode | null): number => {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
  };

  const drawNode = (group: THREE.Group, node: RopeNode, x: number, y: number, spread: number, depth: number) => {
    const isLeaf = node.value !== null;
    const isHL = highlightedNode !== null && isLeaf && node.value === highlightedNode;

    // Node sphere/box
    if (isLeaf) {
      const geom = new THREE.BoxGeometry(1.2, 0.7, 0.4);
      const color = isHL ? 0xffdd44 : 0x44bb44;
      const mat = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, 0);
      group.add(mesh);

      // Leaf text
      const leafText = node.value!.length > 5 ? node.value!.substring(0, 5) + '..' : node.value!;
      const leafTexture = new THREE.CanvasTexture(makeTextCanvas(`"${leafText}"`, 'white', 20));
      const leafMat = new THREE.MeshBasicMaterial({ map: leafTexture, transparent: true });
      const leafLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.25), leafMat);
      leafLabel.position.set(x, y, 0.21);
      group.add(leafLabel);
    } else {
      const geom = new THREE.SphereGeometry(0.4, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4287f5 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, y, 0);
      group.add(mesh);

      // Weight label
      const wTexture = new THREE.CanvasTexture(makeTextCanvas(`w:${node.weight}`, 'white', 22));
      const wMat = new THREE.MeshBasicMaterial({ map: wTexture, transparent: true });
      const wLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.25), wMat);
      wLabel.position.set(x, y, 0.41);
      group.add(wLabel);
    }

    const childY = y - 1.8;
    const childSpread = spread * 0.5;

    if (node.left) {
      const childX = x - childSpread;
      // Line to child
      const points = [new THREE.Vector3(x, y - 0.4, 0), new THREE.Vector3(childX, childY + 0.4, 0)];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x666666 });
      group.add(new THREE.Line(lineGeom, lineMat));

      drawNode(group, node.left, childX, childY, childSpread, depth + 1);
    }

    if (node.right) {
      const childX = x + childSpread;
      const points = [new THREE.Vector3(x, y - 0.4, 0), new THREE.Vector3(childX, childY + 0.4, 0)];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x666666 });
      group.add(new THREE.Line(lineGeom, lineMat));

      drawNode(group, node.right, childX, childY, childSpread, depth + 1);
    }
  };

  const handleConcat = () => {
    const s = inputValue.trim();
    if (!s) {
      setMessage('Enter text to concatenate');
      return;
    }
    const newLeaf = buildBalancedRope(s);
    const newRoot = concatRopes(root, newLeaf);
    setRoot(newRoot);
    const fullStr = ropeToString(newRoot);
    setMessage(`Concatenated "${s}" -- total: "${fullStr.length > 20 ? fullStr.substring(0, 20) + '..' : fullStr}" (len ${fullStr.length})`);
    setInputValue('');
  };

  const handleIndex = () => {
    const idx = parseInt(indexInput);
    if (isNaN(idx) || !root) {
      setMessage('Enter a valid index');
      return;
    }
    const len = ropeLength(root);
    if (idx < 0 || idx >= len) {
      setMessage(`Index ${idx} out of range [0, ${len - 1}]`);
      return;
    }
    const ch = ropeIndex(root, idx);
    setMessage(`Character at index ${idx}: "${ch}" -- O(log n) traversal`);
    setIndexInput('');
  };

  const handleSplit = () => {
    const idx = parseInt(splitInput);
    if (isNaN(idx) || !root) {
      setMessage('Enter a valid split position');
      return;
    }
    const len = ropeLength(root);
    if (idx < 0 || idx > len) {
      setMessage(`Split index ${idx} out of range [0, ${len}]`);
      return;
    }
    const [left, _right] = splitRope(root, idx);
    setRoot(left);
    const leftStr = ropeToString(left);
    const rightStr = ropeToString(_right);
    setMessage(`Split at ${idx}: left="${leftStr}" right="${rightStr}" (kept left)`);
    setSplitInput('');
  };

  const handleSample = () => {
    const samples = ['Hello World', 'Data Structures', 'Rope Tree Demo', 'Big O Circus'];
    const s = samples[Math.floor(Math.random() * samples.length)];
    const newRoot = buildBalancedRope(s);
    setRoot(newRoot);
    setMessage(`Built rope for "${s}"`);
  };

  const handleClear = () => {
    setRoot(null);
    setHighlightedNode(null);
    setMessage('Rope cleared');
  };

  const fullString = root ? ropeToString(root) : '';
  const totalLen = root ? ropeLength(root) : 0;

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Rope</h2>

        <div className='mb-2 text-sm'>
          <strong>String:</strong> {fullString ? `"${fullString.length > 25 ? fullString.substring(0, 25) + '..' : fullString}"` : '(empty)'}
          <br />
          <strong>Length:</strong> {totalLen}
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='concat'>
            <AccordionTrigger>Concatenate</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input
                  type='text'
                  placeholder='Text'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className='border rounded px-2 py-1 w-32 text-sm'
                />
                <Button onClick={handleConcat} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>
                  Concat
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='index'>
            <AccordionTrigger>Index / Split</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='number'
                  placeholder='Index'
                  value={indexInput}
                  onChange={(e) => setIndexInput(e.target.value)}
                  className='border rounded px-2 py-1 w-20 text-sm'
                />
                <Button onClick={handleIndex} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>
                  Index
                </Button>
              </div>
              <div className='flex gap-1'>
                <input
                  type='number'
                  placeholder='Split at'
                  value={splitInput}
                  onChange={(e) => setSplitInput(e.target.value)}
                  className='border rounded px-2 py-1 w-20 text-sm'
                />
                <Button onClick={handleSplit} className='bg-orange-500 text-white px-3 py-1 rounded text-sm'>
                  Split
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button onClick={handleSample} className='bg-purple-500 text-white px-3 py-1 rounded text-sm'>
                  Random Sample
                </Button>
                <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm'>
                  Clear
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Concat O(1) | Index O(log n) | Split O(log n) | Space O(n)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Internal (weight)
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44bb44' }}></span>Leaf (substring)
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Rope</h3>
        <p className='text-sm'>
          A Rope is a binary tree data structure for efficiently storing and
          manipulating very long strings. Each leaf node holds a short substring,
          while internal nodes store the total weight (length) of their left subtree.
          Ropes support O(log n) index access, O(log n) split, and O(1) concatenation,
          making them ideal for text editors handling large documents where insertions
          and deletions in the middle are frequent.
        </p>
      </div>
    </div>
  );
};

export default RopeDataStructure;
