import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';

interface HashEntry {
  key: number;
  value: string;
}

const TABLE_SIZE = 7;

const HashtableDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [table, setTable] = useState<HashEntry[][]>(
    () => Array.from({ length: TABLE_SIZE }, () => [])
  );
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [message, setMessage] = useState('');
  const [highlightBucket, setHighlightBucket] = useState<number | null>(null);
  const [highlightChainIndices, setHighlightChainIndices] = useState<number[]>(
    []
  );
  const [collisionCount, setCollisionCount] = useState(0);

  const hashFn = (key: number): number => {
    return ((key % TABLE_SIZE) + TABLE_SIZE) % TABLE_SIZE;
  };

  const totalEntries = table.reduce((sum, bucket) => sum + bucket.length, 0);
  const loadFactor = (totalEntries / TABLE_SIZE).toFixed(2);

  const createTextSprite = (
    text: string,
    color: string = '#ffffff',
    fontSize: number = 28
  ): THREE.Mesh => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 128, 64);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(0.6, 0.3);
    return new THREE.Mesh(geo, mat);
  };

  const updateVisualization = useCallback(() => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const bucketWidth = 0.8;
    const bucketDepth = 0.5;
    const bucketBaseHeight = 0.3;
    const entryHeight = 0.5;
    const spacing = 1.2;

    const totalWidth = TABLE_SIZE * spacing;
    const offsetX = -totalWidth / 2 + spacing / 2;

    for (let i = 0; i < TABLE_SIZE; i++) {
      const bucket = table[i];
      const x = offsetX + i * spacing;

      // Bucket base
      const isTarget = highlightBucket === i;
      const baseColor = isTarget ? 0x00cc66 : 0x3366cc;
      const baseGeo = new THREE.BoxGeometry(
        bucketWidth,
        bucketBaseHeight,
        bucketDepth
      );
      const baseMat = new THREE.MeshStandardMaterial({ color: baseColor });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(x, -0.5, 0);
      group.add(baseMesh);

      // Bucket index label
      const idxLabel = createTextSprite(`[${i}]`, '#aaaaaa', 24);
      idxLabel.position.set(x, -0.9, 0);
      group.add(idxLabel);

      // Chain entries stacked vertically
      bucket.forEach((entry, chainIdx) => {
        const y = chainIdx * entryHeight;
        const isChainHighlight =
          isTarget && highlightChainIndices.includes(chainIdx);
        const entryColor = isChainHighlight
          ? 0xffcc00
          : isTarget
            ? 0x00cc66
            : 0x3366cc;

        const entryGeo = new THREE.BoxGeometry(
          bucketWidth * 0.9,
          entryHeight * 0.8,
          bucketDepth * 0.9
        );
        const entryMat = new THREE.MeshStandardMaterial({
          color: entryColor,
        });
        const entryMesh = new THREE.Mesh(entryGeo, entryMat);
        entryMesh.position.set(x, y, 0);
        group.add(entryMesh);

        // Key:Value label on entry
        const label = createTextSprite(
          `${entry.key}:${entry.value}`,
          '#ffffff',
          20
        );
        label.position.set(x, y, bucketDepth * 0.46);
        group.add(label);

        // Chain link line
        if (chainIdx > 0) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, (chainIdx - 1) * entryHeight + entryHeight * 0.4, 0),
            new THREE.Vector3(x, chainIdx * entryHeight - entryHeight * 0.4, 0),
          ]);
          const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
          const line = new THREE.Line(lineGeo, lineMat);
          group.add(line);
        }
      });
    }

    // Title label
    const title = createTextSprite('Hash Table', '#ffffff', 28);
    title.position.set(0, -1.5, 0);
    title.scale.set(2, 1, 1);
    group.add(title);

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  }, [table, highlightBucket, highlightChainIndices]);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(0, 1, 8);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [updateVisualization]);

  const clearHighlights = () => {
    setHighlightBucket(null);
    setHighlightChainIndices([]);
  };

  const handleInsert = () => {
    const key = parseInt(keyInput);
    if (isNaN(key)) {
      setMessage('Please enter a valid numeric key.');
      return;
    }
    const value = valueInput || `v${key}`;
    const bucket = hashFn(key);

    setTable((prev) => {
      const newTable = prev.map((b) => [...b]);
      const existing = newTable[bucket].findIndex((e) => e.key === key);
      if (existing !== -1) {
        newTable[bucket][existing] = { key, value };
        setMessage(
          `Updated key ${key} in bucket ${bucket}. Hash: ${key} % ${TABLE_SIZE} = ${bucket}. O(1) avg.`
        );
      } else {
        if (newTable[bucket].length > 0) {
          setCollisionCount((c) => c + 1);
        }
        newTable[bucket].push({ key, value });
        setMessage(
          `Inserted (${key}, "${value}") into bucket ${bucket}. Hash: ${key} % ${TABLE_SIZE} = ${bucket}. O(1) avg.`
        );
      }
      return newTable;
    });

    setHighlightBucket(bucket);
    setHighlightChainIndices([]);
    setKeyInput('');
    setValueInput('');
    setTimeout(clearHighlights, 1500);
  };

  const handleDelete = () => {
    const key = parseInt(keyInput);
    if (isNaN(key)) {
      setMessage('Please enter a valid numeric key.');
      return;
    }
    const bucket = hashFn(key);

    setTable((prev) => {
      const newTable = prev.map((b) => [...b]);
      const idx = newTable[bucket].findIndex((e) => e.key === key);
      if (idx === -1) {
        setMessage(
          `Key ${key} not found in bucket ${bucket}. O(n) worst case.`
        );
        return newTable;
      }
      newTable[bucket].splice(idx, 1);
      setMessage(
        `Deleted key ${key} from bucket ${bucket}. Chain position: ${idx}. O(1) avg.`
      );
      return newTable;
    });

    setHighlightBucket(bucket);
    setHighlightChainIndices([]);
    setKeyInput('');
    setTimeout(clearHighlights, 1500);
  };

  const handleSearch = () => {
    const key = parseInt(keyInput);
    if (isNaN(key)) {
      setMessage('Please enter a valid numeric key.');
      return;
    }
    const bucket = hashFn(key);
    const chain = table[bucket];
    const traversed: number[] = [];

    let found = false;
    for (let i = 0; i < chain.length; i++) {
      traversed.push(i);
      if (chain[i].key === key) {
        found = true;
        setMessage(
          `Found key ${key} = "${chain[i].value}" in bucket ${bucket}, chain pos ${i}. O(1) avg.`
        );
        break;
      }
    }

    if (!found) {
      setMessage(
        `Key ${key} not found. Searched bucket ${bucket}, checked ${traversed.length} entries. O(n) worst.`
      );
    }

    setHighlightBucket(bucket);
    setHighlightChainIndices(traversed);
    setTimeout(clearHighlights, 2000);
  };

  const handleClear = () => {
    setTable(Array.from({ length: TABLE_SIZE }, () => []));
    setCollisionCount(0);
    setMessage('Hash table cleared.');
    clearHighlights();
  };

  const handleGenerateRandom = () => {
    handleClear();
    const newTable: HashEntry[][] = Array.from(
      { length: TABLE_SIZE },
      () => []
    );
    let collisions = 0;
    const count = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const key = Math.floor(Math.random() * 50);
      const value = `v${key}`;
      const bucket = hashFn(key);
      const existing = newTable[bucket].findIndex((e) => e.key === key);
      if (existing === -1) {
        if (newTable[bucket].length > 0) collisions++;
        newTable[bucket].push({ key, value });
      }
    }
    setTable(newTable);
    setCollisionCount(collisions);
    const total = newTable.reduce((s, b) => s + b.length, 0);
    setMessage(`Generated ${total} random entries with ${collisions} collisions.`);
  };

  return (
    <div className='relative w-full h-screen'>
      <canvas ref={canvasRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 text-white p-4 rounded shadow bg-black bg-opacity-70 w-[320px]'>
        <h3 className='text-lg font-bold mb-3'>Hash Table</h3>

        {/* Stats */}
        <div className='text-sm mb-3 space-y-1'>
          <p>Table Size: {TABLE_SIZE}</p>
          <p>Entries: {totalEntries}</p>
          <p>Load Factor: {loadFactor}</p>
          <p>Collisions: {collisionCount}</p>
        </div>

        {/* Inputs */}
        <div className='flex flex-col gap-2 mb-3'>
          <input
            type='number'
            placeholder='Key (number)'
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className='px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm'
          />
          <input
            type='text'
            placeholder='Value (optional)'
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            className='px-2 py-1 rounded bg-gray-800 text-white border border-gray-600 text-sm'
          />
        </div>

        {/* Buttons */}
        <div className='flex flex-col gap-2 mb-3'>
          <div className='flex gap-2'>
            <Button
              onClick={handleInsert}
              className='bg-green-600 text-white px-3 py-1 rounded text-sm flex-1'
            >
              Insert
            </Button>
            <Button
              onClick={handleDelete}
              className='bg-red-500 text-white px-3 py-1 rounded text-sm flex-1'
            >
              Delete
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={handleSearch}
              className='bg-yellow-500 text-white px-3 py-1 rounded text-sm flex-1'
            >
              Search
            </Button>
            <Button
              onClick={handleClear}
              className='bg-gray-500 text-white px-3 py-1 rounded text-sm flex-1'
            >
              Clear
            </Button>
          </div>
          <Button
            onClick={handleGenerateRandom}
            className='bg-blue-500 text-white px-3 py-1 rounded text-sm'
          >
            Generate Random
          </Button>
        </div>

        {/* Message Area */}
        {message && (
          <div className='text-xs bg-gray-900 p-2 rounded border border-gray-700 mb-3'>
            {message}
          </div>
        )}

        {/* Complexity Info */}
        <div className='text-xs text-gray-400 border-t border-gray-700 pt-2'>
          <p className='font-bold text-gray-300 mb-1'>Time Complexity</p>
          <p>Average: O(1) for insert, delete, search</p>
          <p>Worst: O(n) when all keys hash to same bucket</p>
          <p className='mt-1'>Hash: key % {TABLE_SIZE} (modulo)</p>
          <p>Collision Resolution: Chaining</p>
        </div>
      </div>
    </div>
  );
};

export default HashtableDataStructure;
