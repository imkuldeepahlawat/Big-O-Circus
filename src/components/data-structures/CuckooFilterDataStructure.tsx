import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const BUCKET_SIZE = 4;
const NUM_BUCKETS = 8;

const CuckooFilterDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [buckets, setBuckets] = useState<(string | null)[][]>(() =>
    Array.from({ length: NUM_BUCKETS }, () => Array(BUCKET_SIZE).fill(null))
  );
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [highlightBuckets, setHighlightBuckets] = useState<number[]>([]);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 8;
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [buckets, highlightBuckets]);

  const fingerprint = (val: string): string => {
    let h = 0;
    for (let i = 0; i < val.length; i++) h = ((h << 5) - h + val.charCodeAt(i)) | 0;
    return Math.abs(h % 256).toString(16).padStart(2, '0');
  };

  const hash1 = (val: string): number => {
    let h = 0;
    for (let i = 0; i < val.length; i++) h = ((h << 3) + val.charCodeAt(i)) | 0;
    return Math.abs(h) % NUM_BUCKETS;
  };

  const hash2 = (b1: number, fp: string): number => {
    let h = 0;
    for (let i = 0; i < fp.length; i++) h = ((h << 5) + fp.charCodeAt(i)) | 0;
    return (b1 ^ (Math.abs(h) % NUM_BUCKETS)) % NUM_BUCKETS;
  };

  const insertValue = () => {
    if (!inputValue) { setMessage('Enter a value'); return; }
    const fp = fingerprint(inputValue);
    const b1 = hash1(inputValue);
    const b2 = hash2(b1, fp);
    setHighlightBuckets([b1, b2]);

    const newBuckets = buckets.map((b) => [...b]);
    const emptySlot1 = newBuckets[b1].indexOf(null);
    if (emptySlot1 !== -1) { newBuckets[b1][emptySlot1] = fp; setBuckets(newBuckets); setMessage(`Inserted "${inputValue}" (fp:${fp}) in bucket ${b1}`); setInputValue(''); setTimeout(() => setHighlightBuckets([]), 1500); return; }
    const emptySlot2 = newBuckets[b2].indexOf(null);
    if (emptySlot2 !== -1) { newBuckets[b2][emptySlot2] = fp; setBuckets(newBuckets); setMessage(`Inserted "${inputValue}" (fp:${fp}) in bucket ${b2}`); setInputValue(''); setTimeout(() => setHighlightBuckets([]), 1500); return; }
    setMessage(`Both buckets ${b1},${b2} full! Insert failed.`);
    setTimeout(() => setHighlightBuckets([]), 1500);
  };

  const lookupValue = () => {
    if (!inputValue) return;
    const fp = fingerprint(inputValue);
    const b1 = hash1(inputValue);
    const b2 = hash2(b1, fp);
    setHighlightBuckets([b1, b2]);
    const found = buckets[b1].includes(fp) || buckets[b2].includes(fp);
    setMessage(found ? `"${inputValue}" probably exists (fp:${fp})` : `"${inputValue}" definitely not present`);
    setTimeout(() => setHighlightBuckets([]), 1500);
  };

  const deleteValue = () => {
    if (!inputValue) return;
    const fp = fingerprint(inputValue);
    const b1 = hash1(inputValue);
    const b2 = hash2(b1, fp);
    const newBuckets = buckets.map((b) => [...b]);
    let deleted = false;
    const idx1 = newBuckets[b1].indexOf(fp);
    if (idx1 !== -1) { newBuckets[b1][idx1] = null; deleted = true; }
    else { const idx2 = newBuckets[b2].indexOf(fp); if (idx2 !== -1) { newBuckets[b2][idx2] = null; deleted = true; } }
    if (deleted) { setBuckets(newBuckets); setMessage(`Deleted "${inputValue}"`); }
    else setMessage(`"${inputValue}" not found to delete`);
  };

  const totalItems = buckets.reduce((s, b) => s + b.filter((v) => v !== null).length, 0);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    buckets.forEach((bucket, bi) => {
      const isHighlighted = highlightBuckets.includes(bi);
      bucket.forEach((slot, si) => {
        const geo = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        const color = isHighlighted ? (slot ? 0x10b981 : 0xf59e0b) : slot ? 0x4287f5 : 0x999999;
        const mat = new THREE.MeshStandardMaterial({ color });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(bi * 1.1 - (NUM_BUCKETS * 1.1) / 2, si * 0.6, 0);
        group.add(box);

        if (slot) {
          const canvas = document.createElement('canvas');
          canvas.width = 64; canvas.height = 32;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.fillStyle = 'white'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(slot, 32, 16); }
          const texture = new THREE.CanvasTexture(canvas);
          const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
          const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), labelMat);
          label.position.set(bi * 1.1 - (NUM_BUCKETS * 1.1) / 2, si * 0.6, 0.26);
          group.add(label);
        }
      });

      // Bucket index label
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = '#666'; ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`B${bi}`, 32, 16); }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), labelMat);
      label.position.set(bi * 1.1 - (NUM_BUCKETS * 1.1) / 2, -0.7, 0);
      group.add(label);
    });

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Cuckoo Filter</h2>
        <div className="mb-2 text-sm"><strong>Items:</strong> {totalItems}/{NUM_BUCKETS * BUCKET_SIZE} | <strong>Buckets:</strong> {NUM_BUCKETS} x {BUCKET_SIZE}</div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <input type="text" placeholder="Value" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
          <div className="flex flex-wrap gap-1">
            <button onClick={insertValue} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Insert</button>
            <button onClick={lookupValue} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Lookup</button>
            <button onClick={deleteValue} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Delete</button>
            <button onClick={() => { setBuckets(Array.from({ length: NUM_BUCKETS }, () => Array(BUCKET_SIZE).fill(null))); setMessage('Cleared'); }} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Clear</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">Like Bloom Filter but supports deletion. Stores fingerprints in two candidate buckets. O(1) insert/lookup/delete.</div>
      </div>
    </div>
  );
};

export default CuckooFilterDataStructure;
