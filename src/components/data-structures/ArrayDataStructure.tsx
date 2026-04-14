import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const ArrayDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [array, setArray] = useState<number[]>([5, 12, 7, 3, 9, 15]);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputIndex, setInputIndex] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [array, highlightIndex]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    array.forEach((value, index) => {
      const isHighlighted = index === highlightIndex;

      // Create box for array element
      const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const material = new THREE.MeshStandardMaterial({
        color: isHighlighted ? 0xff4444 : 0x4287f5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = index * 1.1;
      group.add(cube);

      // Value label on top
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toString(), 64, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), labelMat);
      label.position.set(index * 1.1, 0.7, 0);
      group.add(label);

      // Index label below
      const idxCanvas = document.createElement('canvas');
      idxCanvas.width = 128;
      idxCanvas.height = 64;
      const idxCtx = idxCanvas.getContext('2d');
      if (idxCtx) {
        idxCtx.fillStyle = '#aaa';
        idxCtx.font = '36px Arial';
        idxCtx.textAlign = 'center';
        idxCtx.textBaseline = 'middle';
        idxCtx.fillText(`[${index}]`, 64, 32);
      }
      const idxTexture = new THREE.CanvasTexture(idxCanvas);
      const idxMat = new THREE.MeshBasicMaterial({
        map: idxTexture,
        transparent: true,
      });
      const idxLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.3),
        idxMat
      );
      idxLabel.position.set(index * 1.1, -0.7, 0);
      group.add(idxLabel);
    });

    // Center the group
    group.position.x = -((array.length - 1) * 1.1) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const insertAtIndex = () => {
    const value = parseInt(inputValue);
    const index = parseInt(inputIndex);
    if (isNaN(value)) {
      setMessage('Please enter a valid value');
      return;
    }
    const idx = isNaN(index)
      ? array.length
      : Math.max(0, Math.min(index, array.length));
    const newArr = [...array];
    newArr.splice(idx, 0, value);
    setHighlightIndex(idx);
    setArray(newArr);
    setMessage(`Inserted ${value} at index ${idx} - O(n)`);
    setInputValue('');
    setInputIndex('');
    setTimeout(() => setHighlightIndex(null), 1500);
  };

  const deleteAtIndex = () => {
    const index = parseInt(inputIndex);
    if (isNaN(index) || index < 0 || index >= array.length) {
      setMessage(
        'Please enter a valid index (0 to ' + (array.length - 1) + ')'
      );
      return;
    }
    const removed = array[index];
    const newArr = [...array];
    newArr.splice(index, 1);
    setArray(newArr);
    setMessage(`Deleted ${removed} from index ${index} - O(n)`);
    setInputIndex('');
  };

  const accessAtIndex = () => {
    const index = parseInt(inputIndex);
    if (isNaN(index) || index < 0 || index >= array.length) {
      setMessage('Invalid index');
      return;
    }
    setHighlightIndex(index);
    setMessage(`Value at index ${index}: ${array[index]} - O(1)`);
    setTimeout(() => setHighlightIndex(null), 1500);
  };

  const searchArray = async () => {
    const target = parseInt(searchValue);
    if (isNaN(target)) {
      setMessage('Enter a value to search');
      return;
    }
    setMessage(`Searching for ${target}...`);
    for (let i = 0; i < array.length; i++) {
      setHighlightIndex(i);
      await new Promise((r) => setTimeout(r, 400));
      if (array[i] === target) {
        setMessage(`Found ${target} at index ${i} - O(n)`);
        setTimeout(() => setHighlightIndex(null), 1500);
        return;
      }
    }
    setHighlightIndex(null);
    setMessage(`${target} not found in array - O(n)`);
  };

  const generateRandom = () => {
    const len = Math.floor(Math.random() * 6) + 4;
    const arr = Array.from(
      { length: len },
      () => Math.floor(Math.random() * 50) + 1
    );
    setArray(arr);
    setHighlightIndex(null);
    setMessage('Generated random array');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>Array Data Structure</h2>

        <div className='mb-3'>
          <strong>Current Array:</strong> [{array.join(', ')}]
          <br />
          <strong>Length:</strong> {array.length}
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <div className='space-y-2'>
          <div className='flex gap-1'>
            <input
              type='number'
              placeholder='Value'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className='border rounded px-2 py-1 w-20 text-sm'
            />
            <input
              type='number'
              placeholder='Index'
              value={inputIndex}
              onChange={(e) => setInputIndex(e.target.value)}
              className='border rounded px-2 py-1 w-20 text-sm'
            />
          </div>
          <div className='flex flex-wrap gap-1'>
            <button
              onClick={insertAtIndex}
              className='bg-green-500 text-white px-3 py-1 rounded text-sm'
            >
              Insert
            </button>
            <button
              onClick={deleteAtIndex}
              className='bg-red-500 text-white px-3 py-1 rounded text-sm'
            >
              Delete
            </button>
            <button
              onClick={accessAtIndex}
              className='bg-blue-500 text-white px-3 py-1 rounded text-sm'
            >
              Access
            </button>
          </div>
          <div className='flex gap-1'>
            <input
              type='number'
              placeholder='Search value'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className='border rounded px-2 py-1 w-28 text-sm'
            />
            <button
              onClick={searchArray}
              className='bg-yellow-500 text-white px-3 py-1 rounded text-sm'
            >
              Search
            </button>
          </div>
          <button
            onClick={generateRandom}
            className='bg-purple-500 text-white px-3 py-1 rounded text-sm w-full'
          >
            Generate Random
          </button>
        </div>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Access O(1) | Search O(n) | Insert O(n) |
          Delete O(n)
        </div>
      </div>
    </div>
  );
};

export default ArrayDataStructure;
