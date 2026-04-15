import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface Point {
  x: number;
  y: number;
}

const GrahamScanCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [hull, setHull] = useState<Point[]>([]);
  const [currentEdge, setCurrentEdge] = useState<[Point, Point] | null>(null);
  const [candidatePoint, setCandidatePoint] = useState<Point | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('Generate points and run Graham Scan');

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        visualizerRef.current.camera.position.set(0, 12, 8);
        visualizerRef.current.camera.lookAt(0, 0, 0);
        generatePoints();
      }
    } catch (err) {
      console.error('Error in initial useEffect:', err);
    }
    return () => {
      visualizerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) {
      renderScene();
    }
  }, [points, hull, currentEdge, candidatePoint]);

  const renderScene = (): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    // Draw points
    points.forEach((p) => {
      const isInHull = hull.some((h) => h.x === p.x && h.y === p.y);
      const isCandidate = candidatePoint && candidatePoint.x === p.x && candidatePoint.y === p.y;

      const sphereGeo = new THREE.SphereGeometry(0.15, 12, 12);
      let color = 0x4287f5;
      if (isCandidate) {
        color = 0xff8800;
      } else if (isInHull) {
        color = 0x00ff00;
      }
      const sphereMat = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(p.x, 0.15, p.y);
      sceneGroup.add(sphere);

      // Label
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 64;
      labelCanvas.height = 32;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`(${p.x.toFixed(1)},${p.y.toFixed(1)})`, 32, 16);
      }
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelGeo = new THREE.PlaneGeometry(1.2, 0.4);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(p.x, 0.6, p.y);
      label.rotation.x = -Math.PI / 4;
      sceneGroup.add(label);
    });

    // Draw hull edges
    if (hull.length > 1) {
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i];
        const b = hull[(i + 1) % hull.length];
        addEdge(sceneGroup, a, b, 0x00ff00);
      }
    }

    // Draw current edge being evaluated
    if (currentEdge) {
      addEdge(sceneGroup, currentEdge[0], currentEdge[1], 0xff8800);
    }

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(14, 14);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      transparent: true,
      opacity: 0.5,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    sceneGroup.add(ground);

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const addEdge = (group: THREE.Group, a: Point, b: Point, color: number): void => {
    const points = [new THREE.Vector3(a.x, 0.1, a.y), new THREE.Vector3(b.x, 0.1, b.y)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    group.add(line);
  };

  const generatePoints = (count: number = 20): void => {
    const pts: Point[] = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
      });
    }
    setPoints(pts);
    setHull([]);
    setCurrentEdge(null);
    setCandidatePoint(null);
    setMessage('Points generated. Press Run.');
  };

  const cross = (o: Point, a: Point, b: Point): number => {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  };

  const grahamScan = async (): Promise<void> => {
    if (isRunning || points.length < 3) return;
    setIsRunning(true);
    setHull([]);
    setCurrentEdge(null);
    setCandidatePoint(null);

    // Find lowest point (and leftmost if tie)
    const sorted = [...points];
    let lowestIdx = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].y < sorted[lowestIdx].y || (sorted[i].y === sorted[lowestIdx].y && sorted[i].x < sorted[lowestIdx].x)) {
        lowestIdx = i;
      }
    }
    const pivot = sorted[lowestIdx];
    sorted.splice(lowestIdx, 1);

    // Sort by polar angle with pivot
    sorted.sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      if (angleA !== angleB) return angleA - angleB;
      const distA = (a.x - pivot.x) ** 2 + (a.y - pivot.y) ** 2;
      const distB = (b.x - pivot.x) ** 2 + (b.y - pivot.y) ** 2;
      return distA - distB;
    });

    setMessage('Sorted points by polar angle from pivot.');
    await new Promise((r) => setTimeout(r, 500));

    const stack: Point[] = [pivot];
    if (sorted.length > 0) stack.push(sorted[0]);

    setHull([...stack]);
    await new Promise((r) => setTimeout(r, 400));

    for (let i = 1; i < sorted.length; i++) {
      const candidate = sorted[i];
      setCandidatePoint(candidate);

      while (stack.length > 1) {
        const top = stack[stack.length - 1];
        const secondTop = stack[stack.length - 2];
        setCurrentEdge([secondTop, top]);
        setMessage(`Checking turn: (${secondTop.x.toFixed(1)},${secondTop.y.toFixed(1)}) -> (${top.x.toFixed(1)},${top.y.toFixed(1)}) -> candidate`);
        await new Promise((r) => setTimeout(r, 400));

        if (cross(secondTop, top, candidate) <= 0) {
          stack.pop();
          setHull([...stack]);
          setMessage('Clockwise turn detected, removing point from hull.');
          await new Promise((r) => setTimeout(r, 300));
        } else {
          break;
        }
      }

      stack.push(candidate);
      setHull([...stack]);
      setCurrentEdge(null);
      await new Promise((r) => setTimeout(r, 300));
    }

    setCandidatePoint(null);
    setCurrentEdge(null);
    setHull([...stack]);
    setMessage(`Convex hull found with ${stack.length} vertices.`);
    setIsRunning(false);
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h2 className='text-2xl font-bold mb-3'>Graham Scan</h2>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={() => generatePoints()}
            className='bg-blue-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning}
          >
            Generate Points
          </button>
          <button
            onClick={grahamScan}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning || points.length < 3}
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div><strong>Points:</strong> {points.length}</div>
          <div><strong>Hull vertices:</strong> {hull.length}</div>
          <div><strong>Status:</strong> {message}</div>
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div><strong>Time Complexity:</strong> O(n log n)</div>
          <div><strong>Space Complexity:</strong> O(n)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#4287f5' }}></span> Point
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#00ff00' }}></span> Hull vertex
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff8800' }}></span> Candidate
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrahamScanCircus;
