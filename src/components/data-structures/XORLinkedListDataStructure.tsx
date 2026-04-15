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

interface XORNode {
  value: number;
  address: number;
  xorAddr: number; // conceptual XOR of prev ^ next addresses
}

let nextAddress = 0x1000;

const XORLinkedListDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [nodes, setNodes] = useState<XORNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('XOR Linked List ready');
  const [traversalIndex, setTraversalIndex] = useState<number>(-1);
  const [traversalDirection, setTraversalDirection] = useState<'forward' | 'backward' | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(4, 2, 10);
      viewerRef.current.camera.lookAt(4, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [nodes, traversalIndex, traversalDirection]);

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

  const computeXORAddresses = (nodeList: XORNode[]): XORNode[] => {
    return nodeList.map((node, idx) => {
      const prevAddr = idx > 0 ? nodeList[idx - 1].address : 0;
      const nextAddr = idx < nodeList.length - 1 ? nodeList[idx + 1].address : 0;
      return { ...node, xorAddr: prevAddr ^ nextAddr };
    });
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const spacing = 2.5;

    nodes.forEach((node, idx) => {
      const x = idx * spacing;
      const isTraversed = idx === traversalIndex;
      const isForward = traversalDirection === 'forward';

      // Node box
      const geometry = new THREE.BoxGeometry(1.4, 1.0, 0.5);
      const color = isTraversed ? 0xffdd44 : 0x4287f5;
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, 0, 0);
      group.add(cube);

      // Value label
      const valTexture = new THREE.CanvasTexture(makeTextCanvas(node.value.toString(), 'white', 30));
      const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
      const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), valMat);
      valLabel.position.set(x, 0.15, 0.26);
      group.add(valLabel);

      // Address label above
      const addrHex = '0x' + node.address.toString(16).toUpperCase();
      const addrTexture = new THREE.CanvasTexture(makeTextCanvas(addrHex, '#88ccff', 18));
      const addrMat = new THREE.MeshBasicMaterial({ map: addrTexture, transparent: true });
      const addrLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.25), addrMat);
      addrLabel.position.set(x, 0.8, 0);
      group.add(addrLabel);

      // XOR address label below node
      const xorHex = '0x' + node.xorAddr.toString(16).toUpperCase();
      const xorTexture = new THREE.CanvasTexture(makeTextCanvas(`XOR: ${xorHex}`, '#ffaa66', 16));
      const xorMat = new THREE.MeshBasicMaterial({ map: xorTexture, transparent: true });
      const xorLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.25), xorMat);
      xorLabel.position.set(x, -0.2, 0.26);
      group.add(xorLabel);

      // Prev/Next decode below
      const prevAddr = idx > 0 ? nodes[idx - 1].address : 0;
      const nextAddr = idx < nodes.length - 1 ? nodes[idx + 1].address : 0;
      const decodeText = `P:${prevAddr ? '0x' + prevAddr.toString(16).toUpperCase() : 'NULL'} N:${nextAddr ? '0x' + nextAddr.toString(16).toUpperCase() : 'NULL'}`;
      const decTexture = new THREE.CanvasTexture(makeTextCanvas(decodeText, '#aaaaaa', 12));
      const decMat = new THREE.MeshBasicMaterial({ map: decTexture, transparent: true });
      const decLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.2), decMat);
      decLabel.position.set(x, -0.75, 0);
      group.add(decLabel);

      // Bidirectional arrows
      if (idx < nodes.length - 1) {
        const startX = x + 0.7;
        const endX = (idx + 1) * spacing - 0.7;
        const arrowColor = isTraversed && isForward && idx === traversalIndex ? 0xffdd44
          : isTraversed && !isForward && idx + 1 === traversalIndex ? 0xffdd44
          : 0xaaaaaa;

        // Forward arrow (top)
        const fwdPoints = [
          new THREE.Vector3(startX, 0.2, 0.1),
          new THREE.Vector3(endX, 0.2, 0.1),
        ];
        const fwdGeom = new THREE.BufferGeometry().setFromPoints(fwdPoints);
        const fwdMat = new THREE.LineBasicMaterial({ color: arrowColor });
        group.add(new THREE.Line(fwdGeom, fwdMat));

        const fwdArrowGeom = new THREE.ConeGeometry(0.06, 0.15, 4);
        const fwdArrowMat = new THREE.MeshStandardMaterial({ color: arrowColor });
        const fwdArrow = new THREE.Mesh(fwdArrowGeom, fwdArrowMat);
        fwdArrow.position.set(endX - 0.05, 0.2, 0.1);
        fwdArrow.rotation.z = -Math.PI / 2;
        group.add(fwdArrow);

        // Backward arrow (bottom)
        const bwdPoints = [
          new THREE.Vector3(endX, -0.2, 0.1),
          new THREE.Vector3(startX, -0.2, 0.1),
        ];
        const bwdGeom = new THREE.BufferGeometry().setFromPoints(bwdPoints);
        const bwdMat = new THREE.LineBasicMaterial({ color: arrowColor });
        group.add(new THREE.Line(bwdGeom, bwdMat));

        const bwdArrowGeom = new THREE.ConeGeometry(0.06, 0.15, 4);
        const bwdArrowMat = new THREE.MeshStandardMaterial({ color: arrowColor });
        const bwdArrow = new THREE.Mesh(bwdArrowGeom, bwdArrowMat);
        bwdArrow.position.set(startX + 0.05, -0.2, 0.1);
        bwdArrow.rotation.z = Math.PI / 2;
        group.add(bwdArrow);
      }
    });

    group.position.x = -((nodes.length - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number');
      return;
    }
    const addr = nextAddress;
    nextAddress += 0x10;
    const newNode: XORNode = { value: val, address: addr, xorAddr: 0 };
    const newNodes = computeXORAddresses([...nodes, newNode]);
    setNodes(newNodes);
    setMessage(`Inserted ${val} at address 0x${addr.toString(16).toUpperCase()}`);
    setInputValue('');
  };

  const handleDelete = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to delete');
      return;
    }
    const idx = nodes.findIndex((n) => n.value === val);
    if (idx === -1) {
      setMessage(`${val} not found`);
      return;
    }
    const newNodes = nodes.filter((n) => n.value !== val);
    setNodes(computeXORAddresses(newNodes));
    setMessage(`Deleted ${val}`);
    setInputValue('');
  };

  const handleTraverseForward = async () => {
    if (nodes.length === 0) {
      setMessage('List is empty');
      return;
    }
    setTraversalDirection('forward');
    setMessage('Traversing forward...');
    for (let i = 0; i < nodes.length; i++) {
      setTraversalIndex(i);
      setMessage(`Forward: visiting ${nodes[i].value} at 0x${nodes[i].address.toString(16).toUpperCase()}`);
      await new Promise((r) => setTimeout(r, 600));
    }
    setMessage('Forward traversal complete');
    setTimeout(() => {
      setTraversalIndex(-1);
      setTraversalDirection(null);
    }, 800);
  };

  const handleTraverseBackward = async () => {
    if (nodes.length === 0) {
      setMessage('List is empty');
      return;
    }
    setTraversalDirection('backward');
    setMessage('Traversing backward...');
    for (let i = nodes.length - 1; i >= 0; i--) {
      setTraversalIndex(i);
      setMessage(`Backward: visiting ${nodes[i].value} at 0x${nodes[i].address.toString(16).toUpperCase()}`);
      await new Promise((r) => setTimeout(r, 600));
    }
    setMessage('Backward traversal complete');
    setTimeout(() => {
      setTraversalIndex(-1);
      setTraversalDirection(null);
    }, 800);
  };

  const handleGenerate = () => {
    const values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 50) + 1);
    const unique = [...new Set(values)];
    const newNodes: XORNode[] = unique.map((v) => {
      const addr = nextAddress;
      nextAddress += 0x10;
      return { value: v, address: addr, xorAddr: 0 };
    });
    setNodes(computeXORAddresses(newNodes));
    setMessage(`Generated ${newNodes.length} nodes`);
  };

  const handleClear = () => {
    setNodes([]);
    setTraversalIndex(-1);
    setTraversalDirection(null);
    setMessage('List cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>XOR Linked List</h2>

        <div className='mb-2 text-sm'>
          <strong>Size:</strong> {nodes.length}
          <br />
          <strong>Values:</strong> [{nodes.map((n) => n.value).join(', ')}]
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='operations'>
            <AccordionTrigger>Operations</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='number'
                  placeholder='Value'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className='border rounded px-2 py-1 w-24 text-sm'
                />
                <Button onClick={handleInsert} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>
                  Insert
                </Button>
                <Button onClick={handleDelete} className='bg-red-500 text-white px-3 py-1 rounded text-sm'>
                  Delete
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='traverse'>
            <AccordionTrigger>Traverse</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <Button onClick={handleTraverseForward} className='bg-yellow-500 text-white px-3 py-1 rounded text-sm'>
                  Forward
                </Button>
                <Button onClick={handleTraverseBackward} className='bg-yellow-600 text-white px-3 py-1 rounded text-sm'>
                  Backward
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <div className='flex flex-col gap-2'>
                <Button onClick={handleGenerate} className='bg-purple-500 text-white px-3 py-1 rounded text-sm'>
                  Generate Random
                </Button>
                <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm'>
                  Clear
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Insert O(1) | Delete O(n) | Traverse O(n) | Space: 1 pointer per node
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ffdd44' }}></span>Traversal
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About XOR Linked List</h3>
        <p className='text-sm'>
          An XOR Linked List is a memory-efficient doubly linked list that stores
          the XOR of the previous and next node addresses in a single pointer field.
          By XORing with the known previous address during forward traversal (or the
          known next address during backward traversal), the other address can be
          recovered. This halves the pointer overhead compared to a standard doubly
          linked list while still allowing bidirectional traversal.
        </p>
      </div>
    </div>
  );
};

export default XORLinkedListDataStructure;
