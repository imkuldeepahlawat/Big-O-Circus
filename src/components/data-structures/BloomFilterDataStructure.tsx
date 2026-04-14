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

const FILTER_SIZE = 32;
const NUM_HASH_FUNCTIONS = 3;

function hashFn1(str: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash);
}

function hashFn2(str: string, size: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash);
}

function hashFn3(str: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 37 + str.charCodeAt(i)) % size;
  }
  return Math.abs(hash) % size;
}

function getHashes(str: string, size: number): number[] {
  return [hashFn1(str, size), hashFn2(str, size), hashFn3(str, size)];
}

const BloomFilterDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [bitArray, setBitArray] = useState<boolean[]>(new Array(FILTER_SIZE).fill(false));
  const [insertedElements, setInsertedElements] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [checkValue, setCheckValue] = useState('');
  const [message, setMessage] = useState('Bloom Filter ready');
  const [highlightedBits, setHighlightedBits] = useState<Map<number, string>>(new Map());
  const [stats, setStats] = useState({ insertions: 0, checks: 0, falsePositives: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(8, 4, 12);
      viewerRef.current.camera.lookAt(8, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [bitArray, highlightedBits]);

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
    const cols = 8;
    const rows = Math.ceil(FILTER_SIZE / cols);
    const spacing = 1.2;

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('Bit Array', '#666666', 24));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), titleMat);
    titleLabel.position.set((cols - 1) * spacing / 2, rows * spacing + 0.5, 0);
    group.add(titleLabel);

    // Draw bit array as a grid
    for (let i = 0; i < FILTER_SIZE; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * spacing;
      const y = (rows - 1 - row) * spacing;

      const highlight = highlightedBits.get(i);
      let color: number;
      if (highlight === 'insert') {
        color = 0x44dd44;
      } else if (highlight === 'check-hit') {
        color = 0xffaa00;
      } else if (highlight === 'check-miss') {
        color = 0xff4444;
      } else if (bitArray[i]) {
        color = 0x4287f5;
      } else {
        color = 0x333333;
      }

      const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.4);
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, y, 0);
      group.add(cube);

      // Bit value label
      const bitText = bitArray[i] ? '1' : '0';
      const texture = new THREE.CanvasTexture(makeTextCanvas(bitText, 'white', 32));
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), labelMat);
      label.position.set(x, y, 0.21);
      group.add(label);

      // Index label
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(`${i}`, '#888888', 18));
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), idxMat);
      idxLabel.position.set(x, y - 0.55, 0);
      group.add(idxLabel);
    }

    // Hash function indicators on the right
    const hashLabels = ['H1: x*31', 'H2: djb2', 'H3: x*37'];
    const hashColors = [0x44dd44, 0xffaa00, 0xff6644];
    hashLabels.forEach((label, idx) => {
      const texture = new THREE.CanvasTexture(makeTextCanvas(label, '#ffffff', 20));
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), mat);
      mesh.position.set(cols * spacing + 1.5, (rows - 1) * spacing - idx * 0.8, 0);
      group.add(mesh);

      const dotGeom = new THREE.SphereGeometry(0.12);
      const dotMat = new THREE.MeshStandardMaterial({ color: hashColors[idx] });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.set(cols * spacing + 0.5, (rows - 1) * spacing - idx * 0.8, 0);
      group.add(dot);
    });

    // Inserted elements list on the right
    const listY = (rows - 1) * spacing - 3;
    const listTexture = new THREE.CanvasTexture(makeTextCanvas('Inserted:', '#aaaaaa', 20));
    const listMat = new THREE.MeshBasicMaterial({ map: listTexture, transparent: true });
    const listLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), listMat);
    listLabel.position.set(cols * spacing + 1.2, listY, 0);
    group.add(listLabel);

    insertedElements.slice(-8).forEach((elem, idx) => {
      const elemTexture = new THREE.CanvasTexture(makeTextCanvas(elem, '#cccccc', 18));
      const elemMat = new THREE.MeshBasicMaterial({ map: elemTexture, transparent: true });
      const elemLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), elemMat);
      elemLabel.position.set(cols * spacing + 1.2, listY - 0.5 - idx * 0.4, 0);
      group.add(elemLabel);
    });

    // Center
    group.position.x = -((cols - 1) * spacing) / 2;
    group.position.y = -((rows - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleInsert = async () => {
    const val = inputValue.trim();
    if (!val) {
      setMessage('Enter a value to insert');
      return;
    }

    const hashes = getHashes(val, FILTER_SIZE);
    const highlights = new Map<number, string>();
    hashes.forEach((h) => highlights.set(h, 'insert'));
    setHighlightedBits(highlights);
    setMessage(`Inserting "${val}": hash positions [${hashes.join(', ')}]`);

    await new Promise((r) => setTimeout(r, 800));

    const newBitArray = [...bitArray];
    hashes.forEach((h) => {
      newBitArray[h] = true;
    });

    setBitArray(newBitArray);
    setInsertedElements((prev) => [...prev, val]);
    setStats((prev) => ({ ...prev, insertions: prev.insertions + 1 }));
    setMessage(`Inserted "${val}" -- bits set at positions [${hashes.join(', ')}]`);
    setInputValue('');

    setTimeout(() => setHighlightedBits(new Map()), 1500);
  };

  const handleCheck = async () => {
    const val = checkValue.trim();
    if (!val) {
      setMessage('Enter a value to check');
      return;
    }

    const hashes = getHashes(val, FILTER_SIZE);
    const allSet = hashes.every((h) => bitArray[h]);

    const highlights = new Map<number, string>();
    hashes.forEach((h) => {
      highlights.set(h, bitArray[h] ? 'check-hit' : 'check-miss');
    });
    setHighlightedBits(highlights);

    setStats((prev) => ({ ...prev, checks: prev.checks + 1 }));

    if (allSet) {
      const actuallyInserted = insertedElements.includes(val);
      if (actuallyInserted) {
        setMessage(`"${val}" is PROBABLY in the set (true positive) -- positions [${hashes.join(', ')}] all set`);
      } else {
        setStats((prev) => ({ ...prev, falsePositives: prev.falsePositives + 1 }));
        setMessage(`"${val}" is PROBABLY in the set (FALSE POSITIVE!) -- positions [${hashes.join(', ')}] all set but never inserted`);
      }
    } else {
      const missingBits = hashes.filter((h) => !bitArray[h]);
      setMessage(`"${val}" is DEFINITELY NOT in the set -- bit(s) at position(s) [${missingBits.join(', ')}] not set`);
    }

    setCheckValue('');
    setTimeout(() => setHighlightedBits(new Map()), 2000);
  };

  const handleReset = () => {
    setBitArray(new Array(FILTER_SIZE).fill(false));
    setInsertedElements([]);
    setHighlightedBits(new Map());
    setStats({ insertions: 0, checks: 0, falsePositives: 0 });
    setMessage('Bloom Filter cleared');
    setInputValue('');
    setCheckValue('');
  };

  const handleInsertBatch = () => {
    const words = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape'];
    const newBitArray = [...bitArray];
    const newElements = [...insertedElements];

    words.forEach((word) => {
      const hashes = getHashes(word, FILTER_SIZE);
      hashes.forEach((h) => {
        newBitArray[h] = true;
      });
      newElements.push(word);
    });

    setBitArray(newBitArray);
    setInsertedElements(newElements);
    setStats((prev) => ({ ...prev, insertions: prev.insertions + words.length }));
    setMessage(`Inserted ${words.length} words: ${words.join(', ')}`);
  };

  const bitsSet = bitArray.filter(Boolean).length;
  const fillRatio = ((bitsSet / FILTER_SIZE) * 100).toFixed(1);
  const expectedFPRate = Math.pow(bitsSet / FILTER_SIZE, NUM_HASH_FUNCTIONS) * 100;

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Bloom Filter</h2>

        <div className='mb-2 text-sm'>
          <strong>Size:</strong> {FILTER_SIZE} bits | <strong>Hash fns:</strong> {NUM_HASH_FUNCTIONS}
          <br />
          <strong>Bits set:</strong> {bitsSet}/{FILTER_SIZE} ({fillRatio}%)
          <br />
          <strong>Est. FP rate:</strong> {expectedFPRate.toFixed(2)}%
          <br />
          <strong>Elements:</strong> {insertedElements.length} | <strong>Checks:</strong> {stats.checks} | <strong>False +:</strong> {stats.falsePositives}
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='insert'>
            <AccordionTrigger>Insert</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='text'
                  placeholder='Value'
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className='border rounded px-2 py-1 w-32 text-sm'
                />
                <Button
                  onClick={handleInsert}
                  className='bg-green-500 text-white px-3 py-1 rounded text-sm'
                >
                  Insert
                </Button>
              </div>
              <Button
                onClick={handleInsertBatch}
                className='bg-purple-500 text-white px-3 py-1 rounded text-sm w-full'
              >
                Insert Sample Words
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='check'>
            <AccordionTrigger>Membership Check</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input
                  type='text'
                  placeholder='Value'
                  value={checkValue}
                  onChange={(e) => setCheckValue(e.target.value)}
                  className='border rounded px-2 py-1 w-32 text-sm'
                />
                <Button
                  onClick={handleCheck}
                  className='bg-blue-500 text-white px-3 py-1 rounded text-sm'
                >
                  Check
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button
                onClick={handleReset}
                className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'
              >
                Reset Filter
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Insert O(k) | Check O(k) | k = number of hash functions
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#333333' }}></span>0 (unset)
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>1 (set)
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44dd44' }}></span>Insert
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ff4444' }}></span>Miss
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Bloom Filter</h3>
        <p className='text-sm'>
          A Bloom Filter is a space-efficient probabilistic data structure used to
          test whether an element is a member of a set. It can produce false
          positives (saying an element is in the set when it is not) but never
          false negatives. It uses multiple hash functions to map each element to
          several positions in a bit array. Membership is checked by verifying all
          hashed positions are set to 1.
        </p>
      </div>
    </div>
  );
};

export default BloomFilterDataStructure;
