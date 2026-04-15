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

const M = 16; // number of registers
const P = 4;  // bits for bucket index (2^4 = 16)

function simpleHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) & 0xffffffff;
  }
  return hash >>> 0;
}

function countLeadingZeros(value: number, maxBits: number): number {
  let count = 0;
  for (let i = maxBits - 1; i >= 0; i--) {
    if ((value & (1 << i)) === 0) count++;
    else break;
  }
  return count + 1;
}

const HyperLogLogDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [registers, setRegisters] = useState<number[]>(new Array(M).fill(0));
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('HyperLogLog ready');
  const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
  const [insertedSet, setInsertedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(4, 6, 14);
      viewerRef.current.camera.lookAt(4, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [registers, highlightedIdx]);

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

  const estimateCardinality = (): number => {
    const alpha = 0.7213 / (1 + 1.079 / M);
    let harmonicSum = 0;
    let zeroCount = 0;
    for (let i = 0; i < M; i++) {
      harmonicSum += Math.pow(2, -registers[i]);
      if (registers[i] === 0) zeroCount++;
    }
    let estimate = alpha * M * M / harmonicSum;
    // Small range correction
    if (estimate <= 2.5 * M && zeroCount > 0) {
      estimate = M * Math.log(M / zeroCount);
    }
    return Math.round(estimate);
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const spacing = 1.3;
    const maxReg = Math.max(1, ...registers);

    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('HyperLogLog Registers', '#666666', 18));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.5), titleMat);
    titleLabel.position.set((M * spacing) / 2 - spacing / 2, maxReg + 2, 0);
    group.add(titleLabel);

    for (let i = 0; i < M; i++) {
      const val = registers[i];
      const isHighlighted = i === highlightedIdx;
      const height = Math.max(0.15, (val / maxReg) * 3);
      const color = isHighlighted ? 0x44dd44 : val > 0 ? 0x4287f5 : 0x333333;

      const geometry = new THREE.BoxGeometry(0.9, height, 0.9);
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(i * spacing, height / 2, 0);
      group.add(cube);

      // Value label
      const valTexture = new THREE.CanvasTexture(makeTextCanvas(`${val}`, 'white', 28));
      const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
      const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), valMat);
      valLabel.position.set(i * spacing, height + 0.3, 0);
      group.add(valLabel);

      // Index label
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`${i}`, '#888888', 18));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), idxMat);
      idxLabel.position.set(i * spacing, -0.3, 0);
      group.add(idxLabel);
    }

    group.position.x = -((M - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = () => {
    const val = inputValue.trim();
    if (!val) { setMessage('Enter a value to insert'); return; }

    const hash = simpleHash(val);
    const bucketIdx = hash & (M - 1);
    const remaining = hash >>> P;
    const rho = countLeadingZeros(remaining, 32 - P);

    const newRegisters = [...registers];
    newRegisters[bucketIdx] = Math.max(newRegisters[bucketIdx], rho);

    setRegisters(newRegisters);
    setHighlightedIdx(bucketIdx);
    setInsertedSet((prev) => new Set(prev).add(val));
    setMessage(`Inserted "${val}": bucket=${bucketIdx}, rho=${rho}, register=${newRegisters[bucketIdx]}`);
    setInputValue('');
    setTimeout(() => setHighlightedIdx(-1), 1500);
  };

  const handleEstimate = () => {
    const est = estimateCardinality();
    const trueCount = insertedSet.size;
    const error = trueCount > 0 ? Math.abs(est - trueCount) / trueCount * 100 : 0;
    setMessage(`Estimated cardinality: ${est} | True unique count: ${trueCount} | Error: ${error.toFixed(1)}%`);
  };

  const handleInsertBatch = () => {
    const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta',
      'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi'];
    const newRegisters = [...registers];
    const newSet = new Set(insertedSet);
    words.forEach((w) => {
      const hash = simpleHash(w);
      const bucketIdx = hash & (M - 1);
      const remaining = hash >>> P;
      const rho = countLeadingZeros(remaining, 32 - P);
      newRegisters[bucketIdx] = Math.max(newRegisters[bucketIdx], rho);
      newSet.add(w);
    });
    setRegisters(newRegisters);
    setInsertedSet(newSet);
    setMessage(`Inserted ${words.length} Greek letters`);
  };

  const handleClear = () => {
    setRegisters(new Array(M).fill(0));
    setInsertedSet(new Set());
    setHighlightedIdx(-1);
    setMessage('HyperLogLog cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>HyperLogLog</h2>
        <div className='mb-2 text-sm'>
          <strong>Registers:</strong> {M} | <strong>Unique inserted:</strong> {insertedSet.size}
          <br />
          <strong>Estimated cardinality:</strong> {estimateCardinality()}
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Insert</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input type='text' placeholder='Value' value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                  className='border rounded px-2 py-1 w-32 text-sm' />
                <Button onClick={handleInsert} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>Insert</Button>
              </div>
              <Button onClick={handleInsertBatch} className='bg-purple-500 text-white px-3 py-1 rounded text-sm w-full'>
                Insert Greek Letters
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='estimate'>
            <AccordionTrigger>Estimate</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleEstimate} className='bg-blue-500 text-white px-3 py-1 rounded text-sm w-full'>
                Estimate Cardinality
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'>Clear</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Insert O(1) | Estimate O(m) | Space O(m)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#333333' }}></span>Empty
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>Occupied
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44dd44' }}></span>Updated
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About HyperLogLog</h3>
        <p className='text-sm'>
          HyperLogLog is a probabilistic algorithm for estimating the cardinality
          (number of distinct elements) of a multiset. It uses a hash function to
          map elements to binary strings, counts leading zeros, and stores the maximum
          in one of m registers. The harmonic mean of the registers gives an estimate
          with typical error of ~1.04/sqrt(m).
        </p>
      </div>
    </div>
  );
};

export default HyperLogLogDataStructure;
