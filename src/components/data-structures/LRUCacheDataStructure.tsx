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

interface CacheEntry {
  key: number;
  value: string;
}

const LRUCacheDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);

  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('LRU Cache ready (capacity 5)');
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [highlightType, setHighlightType] = useState<'hit' | 'evict' | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2, 10);
      viewerRef.current.camera.lookAt(0, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [cache, highlightIndex, highlightType]);

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
    const startX = -((Math.max(cache.length, 1) - 1) * spacing) / 2;

    // Title
    const titleTexture = new THREE.CanvasTexture(makeTextCanvas('LRU Cache', '#aaaaaa', 28));
    const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
    const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), titleMat);
    titleLabel.position.set(0, 2.5, 0);
    group.add(titleLabel);

    // MRU / LRU labels
    if (cache.length > 0) {
      const mruTexture = new THREE.CanvasTexture(makeTextCanvas('MRU', '#44dd44', 22));
      const mruMat = new THREE.MeshBasicMaterial({ map: mruTexture, transparent: true });
      const mruLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), mruMat);
      mruLabel.position.set(startX, -1.5, 0);
      group.add(mruLabel);

      const lruTexture = new THREE.CanvasTexture(makeTextCanvas('LRU', '#ff4444', 22));
      const lruMat = new THREE.MeshBasicMaterial({ map: lruTexture, transparent: true });
      const lruLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), lruMat);
      lruLabel.position.set(startX + (cache.length - 1) * spacing, -1.5, 0);
      group.add(lruLabel);
    }

    // Draw cache entries as 3D boxes in a horizontal chain
    for (let i = 0; i < cache.length; i++) {
      const entry = cache[i];
      const x = startX + i * spacing;

      let color = 0x4287f5;
      if (highlightIndex === i && highlightType === 'hit') {
        color = 0x44dd44; // green hit
      } else if (highlightIndex === i && highlightType === 'evict') {
        color = 0xff4444; // red evict
      }

      const geometry = new THREE.BoxGeometry(1.4, 1.0, 0.8);
      const material = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, 0, 0);
      group.add(box);

      // Key label
      const keyTexture = new THREE.CanvasTexture(makeTextCanvas(`K:${entry.key}`, '#ffffff', 28));
      const keyMat = new THREE.MeshBasicMaterial({ map: keyTexture, transparent: true });
      const keyLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4), keyMat);
      keyLabel.position.set(x, 0.2, 0.41);
      group.add(keyLabel);

      // Value label
      const valTexture = new THREE.CanvasTexture(makeTextCanvas(`V:${entry.value}`, '#cccccc', 22));
      const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
      const valLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), valMat);
      valLabel.position.set(x, -0.25, 0.41);
      group.add(valLabel);

      // Arrow connecting to next box
      if (i < cache.length - 1) {
        const arrowGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x + 0.75, 0, 0),
          new THREE.Vector3(x + spacing - 0.75, 0, 0),
        ]);
        const arrowMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        const arrow = new THREE.Line(arrowGeom, arrowMat);
        group.add(arrow);
      }
    }

    // Empty slots
    for (let i = cache.length; i < CAPACITY; i++) {
      const x = startX + i * spacing;
      const geometry = new THREE.BoxGeometry(1.4, 1.0, 0.8);
      const material = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, 0, 0);
      group.add(box);

      const emptyTexture = new THREE.CanvasTexture(makeTextCanvas('empty', '#666666', 20));
      const emptyMat = new THREE.MeshBasicMaterial({ map: emptyTexture, transparent: true });
      const emptyLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), emptyMat);
      emptyLabel.position.set(x, 0, 0.41);
      group.add(emptyLabel);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
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
      setHighlightIndex(null);
      setHighlightType(null);
    } else {
      // Move to front (MRU)
      const entry = cache[idx];
      const newCache = [entry, ...cache.filter((_, i) => i !== idx)];
      setCache(newCache);
      setHighlightIndex(0);
      setHighlightType('hit');
      setMessage(`GET ${key}: Cache HIT -> value="${entry.value}", moved to MRU`);
      setTimeout(() => { setHighlightIndex(null); setHighlightType(null); }, 1500);
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
    let newCache: CacheEntry[];

    if (idx !== -1) {
      // Update existing, move to front
      newCache = [{ key, value }, ...cache.filter((_, i) => i !== idx)];
      setHighlightIndex(0);
      setHighlightType('hit');
      setMessage(`PUT ${key}="${value}": Updated existing, moved to MRU`);
    } else if (cache.length >= CAPACITY) {
      // Evict LRU (last), add to front
      const evicted = cache[cache.length - 1];
      setHighlightIndex(cache.length - 1);
      setHighlightType('evict');
      setMessage(`PUT ${key}="${value}": Evicted LRU key=${evicted.key}`);

      setTimeout(() => {
        const trimmed = cache.slice(0, CAPACITY - 1);
        setCache([{ key, value }, ...trimmed]);
        setHighlightIndex(0);
        setHighlightType('hit');
        setTimeout(() => { setHighlightIndex(null); setHighlightType(null); }, 1000);
      }, 800);

      setInputKey('');
      setInputValue('');
      return;
    } else {
      newCache = [{ key, value }, ...cache];
      setHighlightIndex(0);
      setHighlightType('hit');
      setMessage(`PUT ${key}="${value}": Added to cache`);
    }

    setCache(newCache);
    setTimeout(() => { setHighlightIndex(null); setHighlightType(null); }, 1500);
    setInputKey('');
    setInputValue('');
  };

  const handleReset = () => {
    setCache([]);
    setHighlightIndex(null);
    setHighlightType(null);
    setMessage('LRU Cache cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>LRU Cache</h2>
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
        <h3 className='text-lg font-bold mb-2'>About LRU Cache</h3>
        <p className='text-sm'>
          An LRU (Least Recently Used) Cache evicts the least recently accessed item
          when the cache reaches capacity. It combines a hash map for O(1) lookups
          with a doubly linked list to track access order. The most recently used item
          is at the front, and the least recently used is at the back.
        </p>
      </div>
    </div>
  );
};

export default LRUCacheDataStructure;
