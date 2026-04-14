import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type Approach = 'brute-force' | 'hash-map';

const TwoSumProblem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [nums, setNums] = useState<number[]>([2, 7, 11, 15]);
  const [target, setTarget] = useState(9);
  const [result, setResult] = useState<number[] | null>(null);
  const [approach, setApproach] = useState<Approach>('brute-force');
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const [hashMap, setHashMap] = useState<Map<number, number>>(new Map());
  const [message, setMessage] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [numsInput, setNumsInput] = useState('2,7,11,15');
  const [step, setStep] = useState('');
  const [comparisons, setComparisons] = useState(0);

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
  }, [nums, highlightIndices, hashMap, result]);

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();

    // Draw array elements
    nums.forEach((value, index) => {
      const isHighlighted = highlightIndices.includes(index);
      const isResult =
        result !== null && (index === result[0] || index === result[1]);

      let color = 0x4287f5; // blue default
      if (isResult) color = 0x00cc44; // green for result
      else if (isHighlighted) color = 0xff4444; // red for current comparison

      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const material = new THREE.MeshStandardMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = index * 1.6;
      group.add(cube);

      // Value label
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
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.5),
        labelMat
      );
      label.position.set(index * 1.6, 0.9, 0);
      group.add(label);

      // Index label
      const idxCanvas = document.createElement('canvas');
      idxCanvas.width = 128;
      idxCanvas.height = 64;
      const idxCtx = idxCanvas.getContext('2d');
      if (idxCtx) {
        idxCtx.fillStyle = '#aaa';
        idxCtx.font = '32px Arial';
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
      idxLabel.position.set(index * 1.6, -0.9, 0);
      group.add(idxLabel);
    });

    // Draw hash map visualization (below array)
    if (approach === 'hash-map' && hashMap.size > 0) {
      const mapGroup = new THREE.Group();
      let col = 0;
      hashMap.forEach((idx, key) => {
        const boxGeo = new THREE.BoxGeometry(1, 0.6, 0.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(col * 1.6, -2.5, 0);
        mapGroup.add(box);

        // key->idx label
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 64;
        const cx = c.getContext('2d');
        if (cx) {
          cx.fillStyle = 'white';
          cx.font = 'bold 28px Arial';
          cx.textAlign = 'center';
          cx.textBaseline = 'middle';
          cx.fillText(`${key}→${idx}`, 64, 32);
        }
        const t = new THREE.CanvasTexture(c);
        const m = new THREE.MeshBasicMaterial({ map: t, transparent: true });
        const l = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), m);
        l.position.set(col * 1.6, -2.5, 0.31);
        mapGroup.add(l);
        col++;
      });

      // "HashMap" title label
      const titleCanvas = document.createElement('canvas');
      titleCanvas.width = 256;
      titleCanvas.height = 64;
      const titleCtx = titleCanvas.getContext('2d');
      if (titleCtx) {
        titleCtx.fillStyle = '#f59e0b';
        titleCtx.font = 'bold 32px Arial';
        titleCtx.textAlign = 'center';
        titleCtx.textBaseline = 'middle';
        titleCtx.fillText('HashMap {val → idx}', 128, 32);
      }
      const titleTex = new THREE.CanvasTexture(titleCanvas);
      const titleMat = new THREE.MeshBasicMaterial({
        map: titleTex,
        transparent: true,
      });
      const titleLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 0.5),
        titleMat
      );
      titleLabel.position.set(
        ((hashMap.size - 1) * 1.6) / 2,
        -1.8,
        0
      );
      mapGroup.add(titleLabel);

      mapGroup.position.x = -((nums.length - 1) * 1.6) / 2;
      group.add(mapGroup);
    }

    // Target label at top
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = 256;
    targetCanvas.height = 64;
    const targetCtx = targetCanvas.getContext('2d');
    if (targetCtx) {
      targetCtx.fillStyle = '#10b981';
      targetCtx.font = 'bold 36px Arial';
      targetCtx.textAlign = 'center';
      targetCtx.textBaseline = 'middle';
      targetCtx.fillText(`Target: ${target}`, 128, 32);
    }
    const targetTex = new THREE.CanvasTexture(targetCanvas);
    const targetMat = new THREE.MeshBasicMaterial({
      map: targetTex,
      transparent: true,
    });
    const targetLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      targetMat
    );
    targetLabel.position.set(0, 2.2, 0);
    group.add(targetLabel);

    group.position.x = -((nums.length - 1) * 1.6) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const solveBruteForce = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);
    setHashMap(new Map());
    setComparisons(0);
    let count = 0;

    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        count++;
        setComparisons(count);
        setHighlightIndices([i, j]);
        setStep(
          `Checking: nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]} = ${nums[i] + nums[j]}`
        );
        await new Promise((r) => setTimeout(r, 600));

        if (nums[i] + nums[j] === target) {
          setResult([i, j]);
          setHighlightIndices([]);
          setMessage(
            `Found! nums[${i}] + nums[${j}] = ${nums[i]} + ${nums[j]} = ${target}`
          );
          setStep('');
          setIsSolving(false);
          return;
        }
      }
    }
    setHighlightIndices([]);
    setMessage('No solution found');
    setStep('');
    setIsSolving(false);
  };

  const solveHashMap = async () => {
    if (isSolving) return;
    setIsSolving(true);
    setResult(null);
    const map = new Map<number, number>();
    setHashMap(new Map());
    setComparisons(0);
    let count = 0;

    for (let i = 0; i < nums.length; i++) {
      count++;
      setComparisons(count);
      const complement = target - nums[i];
      setHighlightIndices([i]);
      setStep(
        `Looking for complement: ${target} - ${nums[i]} = ${complement}`
      );
      await new Promise((r) => setTimeout(r, 800));

      if (map.has(complement)) {
        const j = map.get(complement)!;
        setResult([j, i]);
        setHighlightIndices([]);
        setMessage(
          `Found! nums[${j}] + nums[${i}] = ${nums[j]} + ${nums[i]} = ${target}`
        );
        setStep('');
        setIsSolving(false);
        return;
      }

      map.set(nums[i], i);
      setHashMap(new Map(map));
      setStep(`Added ${nums[i]} → index ${i} to HashMap`);
      await new Promise((r) => setTimeout(r, 400));
    }
    setHighlightIndices([]);
    setMessage('No solution found');
    setStep('');
    setIsSolving(false);
  };

  const solve = () => {
    if (approach === 'brute-force') solveBruteForce();
    else solveHashMap();
  };

  const reset = () => {
    setResult(null);
    setHighlightIndices([]);
    setHashMap(new Map());
    setMessage('');
    setStep('');
    setComparisons(0);
  };

  const applyInput = () => {
    const parsed = numsInput
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));
    if (parsed.length >= 2) {
      setNums(parsed);
      reset();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Left Panel - Problem + Controls */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            Easy
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            Array
          </span>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
            Hash Table
          </span>
        </div>
        <h2 className="text-xl font-bold mb-2">1. Two Sum</h2>
        <p className="text-sm text-gray-600 mb-3">
          Given an array of integers <code className="bg-gray-100 px-1 rounded">nums</code> and
          an integer <code className="bg-gray-100 px-1 rounded">target</code>, return indices of
          the two numbers such that they add up to target.
        </p>

        {/* Input */}
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Array (comma-separated)</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={numsInput}
                onChange={(e) => setNumsInput(e.target.value)}
                className="border rounded px-2 py-1 text-sm flex-1"
                disabled={isSolving}
              />
              <button
                onClick={applyInput}
                className="bg-gray-200 px-2 py-1 rounded text-sm"
                disabled={isSolving}
              >
                Set
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500">Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => {
                setTarget(parseInt(e.target.value) || 0);
                reset();
              }}
              className="border rounded px-2 py-1 text-sm w-full"
              disabled={isSolving}
            />
          </div>
        </div>

        {/* Approach Selection */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Approach
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setApproach('brute-force');
                reset();
              }}
              className={`flex-1 px-2 py-1 rounded text-sm border ${
                approach === 'brute-force'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-gray-300'
              }`}
              disabled={isSolving}
            >
              Brute Force
            </button>
            <button
              onClick={() => {
                setApproach('hash-map');
                reset();
              }}
              className={`flex-1 px-2 py-1 rounded text-sm border ${
                approach === 'hash-map'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-300'
              }`}
              disabled={isSolving}
            >
              Hash Map
            </button>
          </div>
        </div>

        {/* Solve / Reset */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={solve}
            className="flex-1 bg-emerald-500 text-white px-3 py-2 rounded text-sm font-semibold"
            disabled={isSolving}
          >
            {isSolving ? 'Solving...' : 'Solve'}
          </button>
          <button
            onClick={reset}
            className="bg-gray-300 px-3 py-2 rounded text-sm"
            disabled={isSolving}
          >
            Reset
          </button>
        </div>

        {/* Step display */}
        {step && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            {step}
          </div>
        )}

        {/* Result */}
        {message && (
          <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800 font-semibold">
            {message}
          </div>
        )}

        {result && (
          <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
            <strong>Output:</strong> [{result.join(', ')}]
          </div>
        )}

        {/* Stats */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>
            <strong>Comparisons:</strong> {comparisons}
          </div>
          <div>
            <strong>Complexity:</strong>{' '}
            {approach === 'brute-force' ? (
              <span>
                Time O(n<sup>2</sup>), Space O(1)
              </span>
            ) : (
              <span>Time O(n), Space O(n)</span>
            )}
          </div>
        </div>

        {/* Examples */}
        <div className="mt-3 border-t pt-2">
          <p className="text-xs font-semibold text-gray-500 mb-1">Examples:</p>
          <div className="space-y-1">
            {[
              { nums: '2,7,11,15', target: 9 },
              { nums: '3,2,4', target: 6 },
              { nums: '3,3', target: 6 },
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setNumsInput(ex.nums);
                  setTarget(ex.target);
                  const parsed = ex.nums.split(',').map(Number);
                  setNums(parsed);
                  reset();
                }}
                className="block w-full text-left text-xs p-1 rounded hover:bg-gray-100 border border-gray-100"
                disabled={isSolving}
              >
                nums=[{ex.nums}], target={ex.target}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoSumProblem;
