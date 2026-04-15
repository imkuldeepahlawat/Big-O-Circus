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

interface SOLNode {
  value: number;
  accessCount: number;
}

const SelfOrganizingListDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [list, setList] = useState<SOLNode[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('Self-Organizing List ready');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [movedIndex, setMovedIndex] = useState<number>(-1);

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
  }, [list, highlightedIndex, movedIndex]);

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
    const spacing = 2.0;

    // Head label
    const headTexture = new THREE.CanvasTexture(makeTextCanvas('HEAD', '#888888', 22));
    const headMat = new THREE.MeshBasicMaterial({ map: headTexture, transparent: true });
    const headLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), headMat);
    headLabel.position.set(-1.5, 0, 0);
    group.add(headLabel);

    list.forEach((node, idx) => {
      const x = idx * spacing;
      const isHighlighted = idx === highlightedIndex;
      const isMoved = idx === movedIndex;

      // Node box
      const geometry = new THREE.BoxGeometry(1.2, 0.8, 0.5);
      const color = isMoved ? 0x44ff44 : isHighlighted ? 0x44ff44 : 0x4287f5;
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, 0, 0);
      group.add(cube);

      // Value label
      const texture = new THREE.CanvasTexture(makeTextCanvas(node.value.toString(), 'white'));
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), labelMat);
      label.position.set(x, 0, 0.26);
      group.add(label);

      // Access count label below
      const countTexture = new THREE.CanvasTexture(makeTextCanvas(`x${node.accessCount}`, '#aaaaaa', 20));
      const countMat = new THREE.MeshBasicMaterial({ map: countTexture, transparent: true });
      const countLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), countMat);
      countLabel.position.set(x, -0.65, 0);
      group.add(countLabel);

      // Arrow to next node
      if (idx < list.length - 1) {
        const startX = x + 0.6;
        const endX = (idx + 1) * spacing - 0.6;
        const points = [
          new THREE.Vector3(startX, 0, 0.1),
          new THREE.Vector3(endX, 0, 0.1),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
        const line = new THREE.Line(lineGeom, lineMat);
        group.add(line);

        // Arrowhead
        const arrowGeom = new THREE.ConeGeometry(0.08, 0.2, 4);
        const arrowMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.position.set(endX - 0.05, 0, 0.1);
        arrow.rotation.z = -Math.PI / 2;
        group.add(arrow);
      }
    });

    // Null terminator
    if (list.length > 0) {
      const nullX = list.length * spacing - 0.5;
      const nullTexture = new THREE.CanvasTexture(makeTextCanvas('null', '#ff6666', 22));
      const nullMat = new THREE.MeshBasicMaterial({ map: nullTexture, transparent: true });
      const nullLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), nullMat);
      nullLabel.position.set(nullX, 0, 0);
      group.add(nullLabel);
    }

    // Index labels above
    list.forEach((_, idx) => {
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`[${idx}]`, '#888888', 20));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), idxMat);
      idxLabel.position.set(idx * spacing, 0.65, 0);
      group.add(idxLabel);
    });

    group.position.x = -((list.length - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number');
      return;
    }
    if (list.some((n) => n.value === val)) {
      setMessage(`${val} already exists`);
      return;
    }
    const newList = [...list, { value: val, accessCount: 0 }];
    setList(newList);
    setHighlightedIndex(newList.length - 1);
    setMessage(`Inserted ${val} at end`);
    setInputValue('');
    setTimeout(() => setHighlightedIndex(-1), 1200);
  };

  const handleSearch = async () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to search');
      return;
    }
    const idx = list.findIndex((n) => n.value === val);
    if (idx === -1) {
      setMessage(`${val} not found`);
      return;
    }

    setHighlightedIndex(idx);
    setMessage(`Found ${val} at index ${idx} -- moving to front...`);
    await new Promise((r) => setTimeout(r, 800));

    // Move to front
    const newList = [...list];
    newList[idx] = { ...newList[idx], accessCount: newList[idx].accessCount + 1 };
    const [node] = newList.splice(idx, 1);
    newList.unshift(node);

    setList(newList);
    setMovedIndex(0);
    setHighlightedIndex(-1);
    setMessage(`Moved ${val} to front (accessed ${node.accessCount} times) -- O(n) worst, amortized better`);
    setInputValue('');
    setTimeout(() => setMovedIndex(-1), 1500);
  };

  const handleDelete = () => {
    const val = parseInt(inputValue);
    if (isNaN(val)) {
      setMessage('Enter a valid number to delete');
      return;
    }
    const idx = list.findIndex((n) => n.value === val);
    if (idx === -1) {
      setMessage(`${val} not found`);
      return;
    }
    setHighlightedIndex(idx);
    setTimeout(() => {
      const newList = list.filter((n) => n.value !== val);
      setList(newList);
      setHighlightedIndex(-1);
      setMessage(`Deleted ${val}`);
    }, 600);
    setInputValue('');
  };

  const handleGenerate = () => {
    const values = Array.from({ length: 8 }, () => Math.floor(Math.random() * 50) + 1);
    const unique = [...new Set(values)];
    const newList = unique.map((v) => ({ value: v, accessCount: 0 }));
    setList(newList);
    setMessage(`Generated list with ${newList.length} elements`);
  };

  const handleClear = () => {
    setList([]);
    setHighlightedIndex(-1);
    setMovedIndex(-1);
    setMessage('List cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Self-Organizing List</h2>

        <div className='mb-2 text-sm'>
          <strong>Size:</strong> {list.length}
          <br />
          <strong>Values:</strong> [{list.map((n) => n.value).join(', ')}]
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
                  Search (MTF)
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
          <strong>Complexity:</strong> Search O(n) worst | Insert O(1) tail | Delete O(n) | Amortized search better with MTF
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44ff44' }}></span>Accessed/Moved
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Self-Organizing List</h3>
        <p className='text-sm'>
          A Self-Organizing List is a linked list that reorders its elements based on
          access patterns. The Move-to-Front (MTF) heuristic moves an accessed element
          to the head of the list, so frequently accessed elements stay near the front.
          This improves average search time for non-uniform access distributions,
          achieving amortized performance better than O(n) for skewed workloads.
        </p>
      </div>
    </div>
  );
};

export default SelfOrganizingListDataStructure;
