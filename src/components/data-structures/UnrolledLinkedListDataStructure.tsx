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

const NODE_CAPACITY = 4;

interface ULLNode {
  elements: number[];
}

const UnrolledLinkedListDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [nodes, setNodes] = useState<ULLNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('Unrolled Linked List ready');
  const [highlightedElement, setHighlightedElement] = useState<number | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<number>(-1);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(5, 3, 12);
      viewerRef.current.camera.lookAt(5, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [nodes, highlightedElement, highlightedNode]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    return canvas;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const nodeSpacing = 4.0;
    const elemSpacing = 0.8;

    nodes.forEach((node, nodeIdx) => {
      const nodeX = nodeIdx * nodeSpacing;
      const isNodeHighlighted = nodeIdx === highlightedNode;

      // Outer node box
      const outerGeom = new THREE.BoxGeometry(3.2, 1.2, 0.3);
      const outerMat = new THREE.MeshStandardMaterial({
        color: isNodeHighlighted ? 0x2266aa : 0x334466,
        transparent: true,
        opacity: 0.5,
      });
      const outerBox = new THREE.Mesh(outerGeom, outerMat);
      outerBox.position.set(nodeX, 0, -0.1);
      group.add(outerBox);

      // Node label above
      const nodeTexture = new THREE.CanvasTexture(makeTextCanvas(`Node ${nodeIdx}`, '#888888', 20));
      const nodeLabelMat = new THREE.MeshBasicMaterial({ map: nodeTexture, transparent: true });
      const nodeLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), nodeLabelMat);
      nodeLabel.position.set(nodeX, 0.9, 0);
      group.add(nodeLabel);

      // Count label below
      const countTexture = new THREE.CanvasTexture(makeTextCanvas(`${node.elements.length}/${NODE_CAPACITY}`, '#aaaaaa', 18));
      const countMat = new THREE.MeshBasicMaterial({ map: countTexture, transparent: true });
      const countLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.25), countMat);
      countLabel.position.set(nodeX, -0.85, 0);
      group.add(countLabel);

      // Element boxes inside
      for (let i = 0; i < NODE_CAPACITY; i++) {
        const elX = nodeX + (i - (NODE_CAPACITY - 1) / 2) * elemSpacing;
        const hasElement = i < node.elements.length;
        const isElemHighlighted = hasElement && node.elements[i] === highlightedElement;

        const elemGeom = new THREE.BoxGeometry(0.6, 0.6, 0.4);
        const elemColor = isElemHighlighted ? 0x44ff44 : hasElement ? 0x4287f5 : 0x222222;
        const elemMat = new THREE.MeshStandardMaterial({
          color: elemColor,
          transparent: !hasElement,
          opacity: hasElement ? 1.0 : 0.3,
        });
        const elemBox = new THREE.Mesh(elemGeom, elemMat);
        elemBox.position.set(elX, 0, 0);
        group.add(elemBox);

        if (hasElement) {
          const valTexture = new THREE.CanvasTexture(makeTextCanvas(node.elements[i].toString(), 'white', 28));
          const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
          const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), valMat);
          valLabel.position.set(elX, 0, 0.21);
          group.add(valLabel);
        }
      }

      // Arrow to next node
      if (nodeIdx < nodes.length - 1) {
        const startX = nodeX + 1.6;
        const endX = (nodeIdx + 1) * nodeSpacing - 1.6;
        const points = [
          new THREE.Vector3(startX, 0, 0.1),
          new THREE.Vector3(endX, 0, 0.1),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        const arrowGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
        const arrowMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.position.set(endX - 0.05, 0, 0.1);
        arrow.rotation.z = -Math.PI / 2;
        group.add(arrow);
      }
    });

    // Null terminator
    if (nodes.length > 0) {
      const nullX = nodes.length * nodeSpacing - 2.0;
      const nullTexture = new THREE.CanvasTexture(makeTextCanvas('null', '#ff6666', 22));
      const nullMat = new THREE.MeshBasicMaterial({ map: nullTexture, transparent: true });
      const nullLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), nullMat);
      nullLabel.position.set(nullX, 0, 0);
      group.add(nullLabel);
    }

    group.position.x = -((nodes.length - 1) * nodeSpacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number');
      return;
    }

    const newNodes = nodes.map((n) => ({ elements: [...n.elements] }));

    if (newNodes.length === 0) {
      newNodes.push({ elements: [val] });
    } else {
      const lastNode = newNodes[newNodes.length - 1];
      if (lastNode.elements.length < NODE_CAPACITY) {
        lastNode.elements.push(val);
      } else {
        // Split: move half to new node
        newNodes.push({ elements: [val] });
      }
    }

    setNodes(newNodes);
    setHighlightedElement(val);
    setHighlightedNode(newNodes.length - 1);
    setMessage(`Inserted ${val} -- Nodes: ${newNodes.length}, Total elements: ${newNodes.reduce((s, n) => s + n.elements.length, 0)}`);
    setInputValue('');
    setTimeout(() => {
      setHighlightedElement(null);
      setHighlightedNode(-1);
    }, 1200);
  };

  const handleSearch = async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to search');
      return;
    }

    for (let ni = 0; ni < nodes.length; ni++) {
      setHighlightedNode(ni);
      setMessage(`Searching node ${ni}...`);
      await new Promise((r) => setTimeout(r, 500));

      const idx = nodes[ni].elements.indexOf(val);
      if (idx !== -1) {
        setHighlightedElement(val);
        setMessage(`Found ${val} in node ${ni}, position ${idx}`);
        setInputValue('');
        setTimeout(() => {
          setHighlightedElement(null);
          setHighlightedNode(-1);
        }, 1500);
        return;
      }
    }

    setHighlightedNode(-1);
    setMessage(`${val} not found`);
    setInputValue('');
  };

  const handleDelete = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to delete');
      return;
    }

    const newNodes = nodes.map((n) => ({ elements: [...n.elements] }));
    for (let ni = 0; ni < newNodes.length; ni++) {
      const idx = newNodes[ni].elements.indexOf(val);
      if (idx !== -1) {
        newNodes[ni].elements.splice(idx, 1);
        // Remove empty nodes
        const filtered = newNodes.filter((n) => n.elements.length > 0);
        setNodes(filtered);
        setMessage(`Deleted ${val} from node ${ni}`);
        setInputValue('');
        return;
      }
    }
    setMessage(`${val} not found`);
    setInputValue('');
  };

  const handleGenerate = () => {
    const values = Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 1);
    const unique = [...new Set(values)];
    const newNodes: ULLNode[] = [];
    for (let i = 0; i < unique.length; i += NODE_CAPACITY) {
      newNodes.push({ elements: unique.slice(i, i + NODE_CAPACITY) });
    }
    setNodes(newNodes);
    setMessage(`Generated ${newNodes.length} nodes with ${unique.length} elements`);
  };

  const handleClear = () => {
    setNodes([]);
    setHighlightedElement(null);
    setHighlightedNode(-1);
    setMessage('List cleared');
  };

  const totalElements = nodes.reduce((s, n) => s + n.elements.length, 0);

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Unrolled Linked List</h2>

        <div className='mb-2 text-sm'>
          <strong>Nodes:</strong> {nodes.length} | <strong>Elements:</strong> {totalElements} | <strong>Capacity:</strong> {NODE_CAPACITY}/node
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
              </div>
              <div className='flex gap-1 mb-2'>
                <Button onClick={handleSearch} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>
                  Search
                </Button>
                <Button onClick={handleDelete} className='bg-red-500 text-white px-3 py-1 rounded text-sm'>
                  Delete
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
          <strong>Complexity:</strong> Search O(n) | Insert O(1) amortized | Delete O(n) | Better cache than linked list
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44ff44' }}></span>Found
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#222222' }}></span>Empty slot
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Unrolled Linked List</h3>
        <p className='text-sm'>
          An Unrolled Linked List is a variation of linked lists where each node stores
          an array of elements instead of a single element. This improves cache locality
          since multiple elements are stored contiguously in memory. Each node has a
          fixed capacity (here {NODE_CAPACITY}). When a node overflows, it splits. This reduces
          pointer overhead and improves traversal performance compared to traditional
          linked lists.
        </p>
      </div>
    </div>
  );
};

export default UnrolledLinkedListDataStructure;
