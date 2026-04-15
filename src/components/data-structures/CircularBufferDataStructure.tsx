import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const CAPACITY = 8;

const CircularBufferDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [buffer, setBuffer] = useState<(string | null)[]>(new Array(CAPACITY).fill(null));
  const [head, setHead] = useState(0); // read pointer
  const [tail, setTail] = useState(0); // write pointer
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('Circular Buffer ready (capacity 8)');
  const [highlightSlot, setHighlightSlot] = useState<number | null>(null);
  const [highlightType, setHighlightType] = useState<'write' | 'read' | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 0, 10);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [buffer, head, tail, count, highlightSlot, highlightType]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);
    }
    return canvas;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const radius = 3.0;

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('Circular Buffer', '#aaaaaa', 24));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), titleMat);
    titleLabel.position.set(0, 4.5, 0);
    group.add(titleLabel);

    // Draw slots in a circle using cos/sin
    for (let i = 0; i < CAPACITY; i++) {
      const angle = (2 * Math.PI * i) / CAPACITY - Math.PI / 2;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      let color = 0x333333; // empty
      if (buffer[i] !== null) {
        color = 0x4287f5; // filled
      }
      if (highlightSlot === i && highlightType === 'write') {
        color = 0x44dd44;
      } else if (highlightSlot === i && highlightType === 'read') {
        color = 0xffaa00;
      }

      const geometry = new THREE.BoxGeometry(1.0, 1.0, 0.6);
      const material = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, y, 0);
      group.add(box);

      // Content label
      const content = buffer[i] !== null ? buffer[i]! : '';
      const contentTexture = new THREE.CanvasTexture(makeTextCanvas(content, '#ffffff', 28));
      const contentMat = new THREE.MeshBasicMaterial({ map: contentTexture, transparent: true });
      const contentLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.35), contentMat);
      contentLabel.position.set(x, y, 0.31);
      group.add(contentLabel);

      // Index label outside ring
      const outerR = radius + 1.0;
      const ix = outerR * Math.cos(angle);
      const iy = outerR * Math.sin(angle);
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`[${i}]`, '#888888', 20));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), idxMat);
      idxLabel.position.set(ix, iy, 0);
      group.add(idxLabel);

      // Head/Tail indicators
      if (i === head && count > 0) {
        const hTexture = new THREE.CanvasTexture(makeTextCanvas('R', '#ffaa00', 28));
        const hMat = new THREE.MeshBasicMaterial({ map: hTexture, transparent: true });
        const hLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), hMat);
        const innerR = radius - 0.9;
        hLabel.position.set(innerR * Math.cos(angle), innerR * Math.sin(angle), 0);
        group.add(hLabel);
      }
      if (i === tail) {
        const tTexture = new THREE.CanvasTexture(makeTextCanvas('W', '#44dd44', 28));
        const tMat = new THREE.MeshBasicMaterial({ map: tTexture, transparent: true });
        const tLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), tMat);
        const innerR = radius - 0.9;
        const offsetAngle = (count > 0 && i === head) ? angle + 0.15 : angle;
        tLabel.position.set(innerR * Math.cos(offsetAngle), innerR * Math.sin(offsetAngle), 0);
        group.add(tLabel);
      }
    }

    // Center info
    const infoTexture = new THREE.CanvasTexture(makeTextCanvas(`${count}/${CAPACITY}`, '#ffffff', 32));
    const infoMat = new THREE.MeshBasicMaterial({ map: infoTexture, transparent: true });
    const infoLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), infoMat);
    infoLabel.position.set(0, 0, 0);
    group.add(infoLabel);

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleWrite = () => {
    const value = inputValue.trim();
    if (!value) {
      setMessage('Enter a value to write');
      return;
    }
    if (count >= CAPACITY) {
      setMessage('Buffer is FULL! Read some data first.');
      return;
    }

    const newBuffer = [...buffer];
    newBuffer[tail] = value;
    setHighlightSlot(tail);
    setHighlightType('write');
    setBuffer(newBuffer);
    setTail((tail + 1) % CAPACITY);
    setCount(count + 1);
    setMessage(`WRITE "${value}" at position ${tail}`);
    setInputValue('');
    setTimeout(() => { setHighlightSlot(null); setHighlightType(null); }, 1200);
  };

  const handleRead = () => {
    if (count === 0) {
      setMessage('Buffer is EMPTY! Nothing to read.');
      return;
    }

    const value = buffer[head];
    setHighlightSlot(head);
    setHighlightType('read');
    setMessage(`READ "${value}" from position ${head}`);

    setTimeout(() => {
      const newBuffer = [...buffer];
      newBuffer[head] = null;
      setBuffer(newBuffer);
      setHead((head + 1) % CAPACITY);
      setCount(count - 1);
      setHighlightSlot(null);
      setHighlightType(null);
    }, 800);
  };

  const handleReset = () => {
    setBuffer(new Array(CAPACITY).fill(null));
    setHead(0);
    setTail(0);
    setCount(0);
    setHighlightSlot(null);
    setHighlightType(null);
    setMessage('Circular Buffer cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Circular Buffer</h2>
        <div className='mb-2 text-sm'>
          <strong>Capacity:</strong> {CAPACITY} | <strong>Count:</strong> {count} | <strong>Head:</strong> {head} | <strong>Tail:</strong> {tail}
        </div>
        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='write'>
            <AccordionTrigger>Write</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input type='text' placeholder='Value' value={inputValue} onChange={(e) => setInputValue(e.target.value)} className='border rounded px-2 py-1 w-28 text-sm' />
                <Button onClick={handleWrite} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>Write</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='read'>
            <AccordionTrigger>Read</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleRead} className='bg-orange-500 text-white px-3 py-1 rounded text-sm w-full'>Read Next</Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleReset} className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'>Reset</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Write O(1) | Read O(1)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#44dd44' }}></span>Write
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ffaa00' }}></span>Read
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>Filled
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#333333' }}></span>Empty
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Circular Buffer</h3>
        <p className='text-sm'>
          A Circular Buffer (Ring Buffer) is a fixed-size data structure that uses a
          single, fixed-size buffer as if it were connected end-to-end. It has two
          pointers: a write pointer (W) that advances when data is written, and a
          read pointer (R) that advances when data is consumed. When either pointer
          reaches the end, it wraps around to the beginning.
        </p>
      </div>
    </div>
  );
};

export default CircularBufferDataStructure;
