import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const LEVEL_COLORS = [0x4287f5, 0x42c5f5, 0x42f5a7, 0xf5e642, 0xf5a442, 0xf542cb];
const COLOR_SWAP = 0xff0000;
const COLOR_FINAL = 0x00cc44;
const ANIMATION_DELAY = 400;

const BinaryHeapDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [heap, setHeap] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [highlightIndices, setHighlightIndices] = useState<Map<number, number>>(new Map());
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 2, 12);
      updateVisualization([], new Map());
    }
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization(heap, highlightIndices);
  }, [heap, highlightIndices]);

  const getNodeColor = useCallback((index: number, highlights: Map<number, number>): number => {
    if (highlights.has(index)) return highlights.get(index)!;
    const level = Math.floor(Math.log2(index + 1));
    return LEVEL_COLORS[level % LEVEL_COLORS.length];
  }, []);

  const createTextTexture = (text: string, bgColor?: string): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 128, 128);
    }
    ctx.fillStyle = 'white';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
    return new THREE.CanvasTexture(canvas);
  };

  const getTreePosition = (index: number, totalLevels: number): { x: number; y: number } => {
    const level = Math.floor(Math.log2(index + 1));
    const posInLevel = index - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.pow(2, level);
    const spread = Math.pow(2, totalLevels - level) * 0.8;
    const x = (posInLevel - (nodesInLevel - 1) / 2) * spread;
    const y = -level * 2;
    return { x, y };
  };

  const updateVisualization = (currentHeap: number[], highlights: Map<number, number>) => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const totalLevels = currentHeap.length > 0 ? Math.floor(Math.log2(currentHeap.length)) + 1 : 0;

    // --- Tree View ---
    for (let i = 0; i < currentHeap.length; i++) {
      const { x, y } = getTreePosition(i, totalLevels);
      const color = getNodeColor(i, highlights);

      // Node sphere
      const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, y, 0);
      group.add(sphere);

      // Value label
      const texture = createTextTexture(currentHeap[i].toString());
      const labelGeo = new THREE.PlaneGeometry(0.8, 0.8);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(x, y, 0.55);
      group.add(label);

      // Index label (small, above node)
      const idxTexture = createTextTexture(`[${i}]`);
      const idxGeo = new THREE.PlaneGeometry(0.5, 0.5);
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(idxGeo, idxMat);
      idxLabel.position.set(x, y + 0.7, 0.55);
      group.add(idxLabel);

      // Edge to parent
      if (i > 0) {
        const parentIndex = Math.floor((i - 1) / 2);
        const parentPos = getTreePosition(parentIndex, totalLevels);
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(parentPos.x, parentPos.y, 0),
          new THREE.Vector3(x, y, 0),
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);
      }
    }

    // --- Array View (bottom row) ---
    const arrayY = -totalLevels * 2 - 3;
    const boxSize = 1.2;
    const arrayStartX = -((currentHeap.length - 1) * boxSize) / 2;

    for (let i = 0; i < currentHeap.length; i++) {
      const ax = arrayStartX + i * boxSize;
      const color = getNodeColor(i, highlights);

      // Box
      const boxGeo = new THREE.BoxGeometry(1, 1, 0.3);
      const boxMat = new THREE.MeshStandardMaterial({ color });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(ax, arrayY, 0);
      group.add(box);

      // Value label on box
      const valTexture = createTextTexture(currentHeap[i].toString());
      const valGeo = new THREE.PlaneGeometry(0.8, 0.8);
      const valMat = new THREE.MeshBasicMaterial({ map: valTexture, transparent: true });
      const valLabel = new THREE.Mesh(valGeo, valMat);
      valLabel.position.set(ax, arrayY, 0.2);
      group.add(valLabel);

      // Index label below box
      const idxTexture = createTextTexture(`${i}`);
      const idxGeo = new THREE.PlaneGeometry(0.5, 0.5);
      const idxMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(idxGeo, idxMat);
      idxLabel.position.set(ax, arrayY - 0.8, 0.2);
      group.add(idxLabel);
    }

    // Array label
    if (currentHeap.length > 0) {
      const labelTexture = createTextTexture('Array View');
      const labelGeo = new THREE.PlaneGeometry(2, 0.6);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
      const arrayLabel = new THREE.Mesh(labelGeo, labelMat);
      arrayLabel.position.set(0, arrayY + 1.2, 0);
      group.add(arrayLabel);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const animateSwaps = async (
    arr: number[],
    swaps: [number, number][],
    finalIndex?: number
  ) => {
    setIsAnimating(true);
    let current = [...arr];

    for (const [i, j] of swaps) {
      // Highlight swapping nodes
      const swapHighlight = new Map<number, number>();
      swapHighlight.set(i, COLOR_SWAP);
      swapHighlight.set(j, COLOR_SWAP);
      setHeap([...current]);
      setHighlightIndices(swapHighlight);

      await new Promise<void>((resolve) => {
        animationRef.current = window.setTimeout(resolve, ANIMATION_DELAY);
      });

      // Perform swap
      [current[i], current[j]] = [current[j], current[i]];
      setHeap([...current]);
      setHighlightIndices(swapHighlight);

      await new Promise<void>((resolve) => {
        animationRef.current = window.setTimeout(resolve, ANIMATION_DELAY);
      });
    }

    // Highlight final position
    if (finalIndex !== undefined) {
      const finalHighlight = new Map<number, number>();
      finalHighlight.set(finalIndex, COLOR_FINAL);
      setHighlightIndices(finalHighlight);

      await new Promise<void>((resolve) => {
        animationRef.current = window.setTimeout(resolve, ANIMATION_DELAY);
      });
    }

    setHighlightIndices(new Map());
    setHeap([...current]);
    setIsAnimating(false);
  };

  const handleInsert = () => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || isAnimating) return;
    setInputValue('');

    const newHeap = [...heap, val];
    const swaps: [number, number][] = [];

    // Sift up
    let idx = newHeap.length - 1;
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (newHeap[parentIdx] > newHeap[idx]) {
        swaps.push([parentIdx, idx]);
        [newHeap[parentIdx], newHeap[idx]] = [newHeap[idx], newHeap[parentIdx]];
        idx = parentIdx;
      } else {
        break;
      }
    }

    // Reset newHeap to pre-swap state for animation
    const insertHeap = [...heap, val];
    animateSwaps(insertHeap, swaps, idx);
  };

  const handleExtractMin = () => {
    if (heap.length === 0 || isAnimating) return;

    if (heap.length === 1) {
      setHeap([]);
      return;
    }

    const newHeap = [...heap];
    newHeap[0] = newHeap[newHeap.length - 1];
    newHeap.pop();
    const swaps: [number, number][] = [];

    // Sift down
    const workHeap = [...newHeap];
    let idx = 0;
    while (true) {
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      let smallest = idx;
      if (left < workHeap.length && workHeap[left] < workHeap[smallest]) smallest = left;
      if (right < workHeap.length && workHeap[right] < workHeap[smallest]) smallest = right;
      if (smallest !== idx) {
        swaps.push([idx, smallest]);
        [workHeap[idx], workHeap[smallest]] = [workHeap[smallest], workHeap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }

    // Animate from the state after removing last and placing at root
    const startHeap = [...heap];
    startHeap[0] = startHeap[startHeap.length - 1];
    startHeap.pop();
    animateSwaps(startHeap, swaps, idx);
  };

  const handleGenerateRandom = () => {
    if (isAnimating) return;
    const size = 7 + Math.floor(Math.random() * 6);
    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      const val = Math.floor(Math.random() * 99) + 1;
      arr.push(val);
      // Sift up
      let idx = arr.length - 1;
      while (idx > 0) {
        const p = Math.floor((idx - 1) / 2);
        if (arr[p] > arr[idx]) {
          [arr[p], arr[idx]] = [arr[idx], arr[p]];
          idx = p;
        } else break;
      }
    }
    setHighlightIndices(new Map());
    setHeap(arr);
  };

  const handleClear = () => {
    if (isAnimating) return;
    setHeap([]);
    setHighlightIndices(new Map());
  };

  return (
    <div className='relative w-full h-screen'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 text-white p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-2'>Binary Heap (Min-Heap)</h3>

        <div className='mb-2'>
          <p>Heap Size: {heap.length}</p>
          <p>Min Element: {heap.length > 0 ? heap[0] : 'N/A'}</p>
        </div>

        <div className='flex gap-2 mb-2'>
          <Input
            type='number'
            placeholder='Value'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
            className='w-24 text-white'
            disabled={isAnimating}
          />
          <Button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-3 py-1 rounded'
            disabled={isAnimating}
          >
            Insert
          </Button>
        </div>

        <div className='flex flex-col gap-2 mb-2'>
          <Button
            onClick={handleExtractMin}
            className='bg-orange-500 text-white px-4 py-2 rounded'
            disabled={isAnimating || heap.length === 0}
          >
            Extract Min
          </Button>
          <Button
            onClick={handleGenerateRandom}
            className='bg-purple-500 text-white px-4 py-2 rounded'
            disabled={isAnimating}
          >
            Generate Random
          </Button>
          <Button
            onClick={handleClear}
            className='bg-red-500 text-white px-4 py-2 rounded'
            disabled={isAnimating}
          >
            Clear
          </Button>
        </div>

        {heap.length > 0 && (
          <div className='mt-2 text-sm'>
            <p className='font-bold mb-1'>Array: [{heap.join(', ')}]</p>
          </div>
        )}

        <div className='mt-2 text-sm'>
          <p className='font-bold mb-1'>Index Relationships:</p>
          <p>Parent = floor((i-1)/2)</p>
          <p>Left Child = 2i + 1</p>
          <p>Right Child = 2i + 2</p>
        </div>

        <div className='mt-2 text-sm'>
          <p className='font-bold mb-1'>Complexity:</p>
          <p>Insert: O(log n)</p>
          <p>Extract Min: O(log n)</p>
          <p>Find Min: O(1)</p>
          <p>Build Heap: O(n)</p>
        </div>
      </div>

      {/* Info Panel */}
      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Binary Heap</h3>
        <p className='text-sm'>
          A Binary Heap is a complete binary tree where each parent node is
          smaller than or equal to its children (Min-Heap). It is commonly used
          to implement priority queues. The tree view shows the heap structure,
          while the array view below shows how it is stored in memory. Red
          highlights indicate nodes being swapped, and green marks the final
          position after an operation.
        </p>
      </div>
    </div>
  );
};

export default BinaryHeapDataStructure;
