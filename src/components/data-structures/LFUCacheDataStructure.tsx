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

const CAPACITY = 5;

interface LFUEntry {
  key: number;
  value: string;
  frequency: number;
}

const LFUCacheDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [cache, setCache] = useState<LFUEntry[]>([]);
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('LFU Cache ready (capacity 5)');
  const [highlightKey, setHighlightKey] = useState<number | null>(null);
  const [highlightType, setHighlightType] = useState<'hit' | 'evict' | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 3, 10);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [cache, highlightKey, highlightType]);

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
    const spacing = 2.0;
    const totalSlots = Math.max(cache.length, CAPACITY);
    const startX = -((totalSlots - 1) * spacing) / 2;

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('LFU Cache', '#aaaaaa', 28));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), titleMat);
    titleLabel.position.set(0, 4.5, 0);
    group.add(titleLabel);

    // Max frequency for scaling
    const maxFreq = Math.max(1, ...cache.map((e) => e.frequency));

    // Draw cache entries as 3D boxes with height proportional to frequency
    for (let i = 0; i < cache.length; i++) {
      const entry = cache[i];
      const x = startX + i * spacing;
      const heightScale = 0.5 + (entry.frequency / maxFreq) * 2.0;

      let color = 0x4287f5;
      if (highlightKey === entry.key && highlightType === 'hit') {
        color = 0x44dd44;
      } else if (highlightKey === entry.key && highlightType === 'evict') {
        color = 0xff4444;
      }

      const geometry = new THREE.BoxGeometry(1.4, heightScale, 0.8);
      const material = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, heightScale / 2 - 0.5, 0);
      group.add(box);

      // Key label
      const keyTexture = new THREE.CanvasTexture(makeTextCanvas(`K:${entry.key}`, '#ffffff', 26));
      const keyMat = new THREE.MeshBasicMaterial({ map: keyTexture, transparent: true });
      const keyLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.35), keyMat);
      keyLabel.position.set(x, heightScale - 0.3, 0.41);
      group.add(keyLabel);

      // Value label
      const valTexture = new THREE.CanvasTexture(makeTextCanvas(`V:${entry.value}`, '#cccccc', 20));
      const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
      const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), valMat);
      valLabel.position.set(x, heightScale - 0.7, 0.41);
      group.add(valLabel);

      // Frequency label above
      const freqTexture = new THREE.CanvasTexture(makeTextCanvas(`f=${entry.frequency}`, '#ffcc00', 22));
      const freqMat = new THREE.MeshBasicMaterial({ map: freqTexture, transparent: true });
      const freqLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), freqMat);
      freqLabel.position.set(x, heightScale + 0.2, 0);
      group.add(freqLabel);
    }

    // Empty slots
    for (let i = cache.length; i < CAPACITY; i++) {
      const x = startX + i * spacing;
      const geometry = new THREE.BoxGeometry(1.4, 0.5, 0.8);
      const material = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, -0.25, 0);
      group.add(box);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const findLFUIndex = (): number => {
    let minFreq = Infinity;
    let minIdx = 0;
    for (let i = 0; i < cache.length; i++) {
      if (cache[i].frequency < minFreq) {
        minFreq = cache[i].frequency;
        minIdx = i;
      }
    }
    return minIdx;
  };

  const handleGet = () => {
    const key = parseInt(inputKey.trim());
    if (isNaN(key)) {
      setMessage('Enter a valid numeric key');
      return;
    }

    const idx = cache.findIndex((e) => e.key === key);
    if (idx === -1) {
      setMessage(`GET ${key}: Cache MISS`);
      setHighlightKey(null);
      setHighlightType(null);
    } else {
      const newCache = [...cache];
      newCache[idx] = { ...newCache[idx], frequency: newCache[idx].frequency + 1 };
      setCache(newCache);
      setHighlightKey(key);
      setHighlightType('hit');
      setMessage(`GET ${key}: Cache HIT -> value="${newCache[idx].value}", freq=${newCache[idx].frequency}`);
      setTimeout(() => { setHighlightKey(null); setHighlightType(null); }, 1500);
    }
    setInputKey('');
  };

  const handlePut = () => {
    const key = parseInt(inputKey.trim());
    const value = inputValue.trim();
    if (isNaN(key) || !value) {
      setMessage('Enter a valid key and value');
      return;
    }

    const idx = cache.findIndex((e) => e.key === key);
    let newCache: LFUEntry[];

    if (idx !== -1) {
      newCache = [...cache];
      newCache[idx] = { key, value, frequency: newCache[idx].frequency + 1 };
      setHighlightKey(key);
      setHighlightType('hit');
      setMessage(`PUT ${key}="${value}": Updated, freq=${newCache[idx].frequency}`);
    } else if (cache.length >= CAPACITY) {
      const lfuIdx = findLFUIndex();
      const evicted = cache[lfuIdx];
      setHighlightKey(evicted.key);
      setHighlightType('evict');
      setMessage(`PUT ${key}="${value}": Evicted LFU key=${evicted.key} (freq=${evicted.frequency})`);

      setTimeout(() => {
        const trimmed = cache.filter((_, i) => i !== lfuIdx);
        setCache([...trimmed, { key, value, frequency: 1 }]);
        setHighlightKey(key);
        setHighlightType('hit');
        setTimeout(() => { setHighlightKey(null); setHighlightType(null); }, 1000);
      }, 800);

      setInputKey('');
      setInputValue('');
      return;
    } else {
      newCache = [...cache, { key, value, frequency: 1 }];
      setHighlightKey(key);
      setHighlightType('hit');
      setMessage(`PUT ${key}="${value}": Added with freq=1`);
    }

    setCache(newCache);
    setTimeout(() => { setHighlightKey(null); setHighlightType(null); }, 1500);
    setInputKey('');
    setInputValue('');
  };

  const handleReset = () => {
    setCache([]);
    setHighlightKey(null);
    setHighlightType(null);
    setMessage('LFU Cache cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>LFU Cache</h2>
        <div className='mb-2 text-sm'>
          <strong>Capacity:</strong> {CAPACITY} | <strong>Size:</strong> {cache.length}
        </div>
        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>{message}</div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='get'>
            <AccordionTrigger>Get</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input type='text' placeholder='Key' value={inputKey} onChange={(e) => setInputKey(e.target.value)} className='border rounded px-2 py-1 w-20 text-sm' />
                <Button onClick={handleGet} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>Get</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='put'>
            <AccordionTrigger>Put</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input type='text' placeholder='Key' value={inputKey} onChange={(e) => setInputKey(e.target.value)} className='border rounded px-2 py-1 w-20 text-sm' />
                <input type='text' placeholder='Value' value={inputValue} onChange={(e) => setInputValue(e.target.value)} className='border rounded px-2 py-1 w-20 text-sm' />
                <Button onClick={handlePut} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>Put</Button>
              </div>
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
          <strong>Complexity:</strong> Get O(1) | Put O(1)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#44dd44' }}></span>Hit
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ff4444' }}></span>Evict
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#4287f5' }}></span>Cached
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About LFU Cache</h3>
        <p className='text-sm'>
          An LFU (Least Frequently Used) Cache evicts the item with the lowest access
          frequency when the cache reaches capacity. Each entry tracks how many times
          it has been accessed. The box height in the visualization represents the
          access frequency -- taller boxes have been accessed more often.
        </p>
      </div>
    </div>
  );
};

export default LFUCacheDataStructure;
