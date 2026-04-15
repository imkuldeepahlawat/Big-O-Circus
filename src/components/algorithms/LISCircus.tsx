import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

type BarState = 'default' | 'comparing' | 'updated' | 'final';

interface BarData {
  value: number;
  dpValue: number;
  state: BarState;
  inLIS: boolean;
}

const INPUT = [10, 9, 2, 5, 3, 7, 101, 18];

const LISCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [bars, setBars] = useState<BarData[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [currentI, setCurrentI] = useState(-1);
  const [currentJ, setCurrentJ] = useState(-1);
  const [lisLength, setLisLength] = useState<number | null>(null);
  const animationCancelled = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      visualizerRef.current.camera.position.set(0, 2, 12);
      visualizerRef.current.camera.lookAt(0, 2, 0);
      initBars();
    }
    return () => {
      animationCancelled.current = true;
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) updateVisualization();
  }, [bars, currentI, currentJ]);

  const createTextCanvas = (
    text: string,
    width = 128,
    height = 64,
    fontSize = 26,
    color = 'white'
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    }
    return canvas;
  };

  const getBarColor = (bar: BarData, index: number): number => {
    if (index === currentI) return 0xffd700;
    if (index === currentJ) return 0xff4444;
    if (bar.inLIS) return 0x22c55e;
    switch (bar.state) {
      case 'default':
        return 0x3b82f6;
      case 'comparing':
        return 0xff4444;
      case 'updated':
        return 0xffa500;
      case 'final':
        return 0x22c55e;
      default:
        return 0x3b82f6;
    }
  };

  const updateVisualization = (): void => {
    if (!visualizerRef.current) return;
    visualizerRef.current.disposeSceneChildren();
    const group = new THREE.Group();

    const barWidth = 1.0;
    const gap = 0.3;
    const totalWidth = bars.length * (barWidth + gap) - gap;
    const offsetX = -totalWidth / 2 + barWidth / 2;
    const maxVal = Math.max(...INPUT);
    const scale = 5.0 / maxVal;

    bars.forEach((bar, index) => {
      const height = bar.value * scale;
      const color = getBarColor(bar, index);

      // Bar
      const barGeo = new THREE.BoxGeometry(barWidth, height, 0.5);
      const barMat = new THREE.MeshStandardMaterial({ color });
      const barMesh = new THREE.Mesh(barGeo, barMat);
      barMesh.position.set(
        offsetX + index * (barWidth + gap),
        height / 2,
        0
      );
      group.add(barMesh);

      // Value label on top
      const valCanvas = createTextCanvas(bar.value.toString(), 64, 48, 24);
      const valTex = new THREE.CanvasTexture(valCanvas);
      const valMat = new THREE.MeshBasicMaterial({
        map: valTex,
        transparent: true,
      });
      const valPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.4),
        valMat
      );
      valPlane.position.set(
        offsetX + index * (barWidth + gap),
        height + 0.4,
        0
      );
      group.add(valPlane);

      // DP value overlay
      const dpCanvas = createTextCanvas(
        `dp=${bar.dpValue}`,
        128,
        48,
        20,
        '#ffcc00'
      );
      const dpTex = new THREE.CanvasTexture(dpCanvas);
      const dpMat = new THREE.MeshBasicMaterial({
        map: dpTex,
        transparent: true,
      });
      const dpPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.35),
        dpMat
      );
      dpPlane.position.set(
        offsetX + index * (barWidth + gap),
        -0.5,
        0
      );
      group.add(dpPlane);

      // Index label
      const idxCanvas = createTextCanvas(`[${index}]`, 64, 48, 18, '#888888');
      const idxTex = new THREE.CanvasTexture(idxCanvas);
      const idxMat = new THREE.MeshBasicMaterial({
        map: idxTex,
        transparent: true,
      });
      const idxPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.3),
        idxMat
      );
      idxPlane.position.set(
        offsetX + index * (barWidth + gap),
        -1.0,
        0
      );
      group.add(idxPlane);
    });

    // Title
    const titleCanvas = createTextCanvas(
      'Longest Increasing Subsequence',
      512,
      64,
      28
    );
    const titleTex = new THREE.CanvasTexture(titleCanvas);
    const titleMat = new THREE.MeshBasicMaterial({
      map: titleTex,
      transparent: true,
    });
    const titlePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 0.5),
      titleMat
    );
    titlePlane.position.set(0, 7, 0);
    group.add(titlePlane);

    visualizerRef.current.scene.add(group);
    visualizerRef.current.enableRender();
  };

  const initBars = (): void => {
    const data: BarData[] = INPUT.map((v) => ({
      value: v,
      dpValue: 1,
      state: 'default' as BarState,
      inLIS: false,
    }));
    setBars(data);
    setCurrentI(-1);
    setCurrentJ(-1);
    setLisLength(null);
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const computeLIS = async (): Promise<void> => {
    if (isComputing) return;
    setIsComputing(true);
    animationCancelled.current = false;

    const data: BarData[] = INPUT.map((v) => ({
      value: v,
      dpValue: 1,
      state: 'default' as BarState,
      inLIS: false,
    }));
    const dp = new Array(INPUT.length).fill(1);

    setBars([...data]);
    await sleep(300);

    for (let i = 1; i < INPUT.length; i++) {
      if (animationCancelled.current) return;
      setCurrentI(i);

      for (let j = 0; j < i; j++) {
        if (animationCancelled.current) return;
        setCurrentJ(j);
        data[j].state = 'comparing';
        setBars([...data]);
        await sleep(200);

        if (INPUT[j] < INPUT[i] && dp[j] + 1 > dp[i]) {
          dp[i] = dp[j] + 1;
          data[i].dpValue = dp[i];
          data[i].state = 'updated';
          setBars([...data]);
          await sleep(150);
        }

        data[j].state = 'default';
      }

      data[i].dpValue = dp[i];
      data[i].state = 'default';
      setBars([...data]);
      await sleep(100);
    }

    // Find LIS length and traceback
    const maxLen = Math.max(...dp);
    setLisLength(maxLen);

    // Mark LIS elements
    let target = maxLen;
    for (let i = INPUT.length - 1; i >= 0 && target > 0; i--) {
      if (dp[i] === target) {
        data[i].inLIS = true;
        data[i].state = 'final';
        target--;
      }
    }
    setBars([...data]);

    setCurrentI(-1);
    setCurrentJ(-1);
    setIsComputing(false);
  };

  const handleReset = (): void => {
    animationCancelled.current = true;
    setIsComputing(false);
    initBars();
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-3'>
          Longest Increasing Subsequence
        </h2>

        <div className='mb-2 text-sm'>
          <div>
            Input: <strong>[{INPUT.join(', ')}]</strong>
          </div>
        </div>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={computeLIS}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isComputing}
          >
            {isComputing ? 'Computing...' : 'Compute LIS'}
          </button>
          <button
            onClick={handleReset}
            className='bg-gray-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        {lisLength !== null && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm'>
            <div>
              <strong>LIS Length: {lisLength}</strong>
            </div>
          </div>
        )}

        <div className='text-xs text-gray-600 mb-2'>
          <div className='font-semibold mb-1'>Complexity:</div>
          <div>
            Time: <strong>O(n^2)</strong>
          </div>
          <div>
            Space: <strong>O(n)</strong>
          </div>
        </div>

        <div className='text-xs text-gray-500'>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#3b82f6' }}
            ></span>{' '}
            Default
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ffd700' }}
            ></span>{' '}
            Current (i)
          </div>
          <div className='flex items-center gap-1 mb-0.5'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#ff4444' }}
            ></span>{' '}
            Comparing (j)
          </div>
          <div className='flex items-center gap-1'>
            <span
              className='inline-block w-3 h-3 rounded'
              style={{ backgroundColor: '#22c55e' }}
            ></span>{' '}
            In LIS
          </div>
        </div>
      </div>
    </div>
  );
};

export default LISCircus;
