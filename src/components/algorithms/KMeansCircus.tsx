import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

interface Point2D {
  x: number;
  y: number;
  cluster: number;
}

interface Centroid {
  x: number;
  y: number;
}

const CLUSTER_COLORS = [0xff4444, 0x44cc44, 0x4488ff];
const K = 3;

const KMeansCircus: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<Algorithm3DPreviewer | null>(null);
  const runningRef = useRef(false);
  const [points, setPoints] = useState<Point2D[]>([]);
  const [centroids, setCentroids] = useState<Centroid[]>([]);
  const [iteration, setIteration] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [converged, setConverged] = useState(false);
  const [message, setMessage] = useState('Generate points and run K-Means');

  useEffect(() => {
    try {
      if (canvasRef.current) {
        visualizerRef.current = new Algorithm3DPreviewer(canvasRef.current);
        visualizerRef.current.camera.position.set(0, 14, 8);
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
  }, [points, centroids]);

  const renderScene = (): void => {
    if (!visualizerRef.current) return;

    visualizerRef.current.disposeSceneChildren();
    const sceneGroup = new THREE.Group();

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(16, 16);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    sceneGroup.add(ground);

    // Draw points
    points.forEach((p) => {
      const color = p.cluster >= 0 ? CLUSTER_COLORS[p.cluster] : 0x888888;
      const sphereGeo = new THREE.SphereGeometry(0.15, 10, 10);
      const sphereMat = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(p.x, 0.15, p.y);
      sceneGroup.add(sphere);
    });

    // Draw centroids
    centroids.forEach((c, idx) => {
      // Larger diamond-shaped centroid
      const centroidGeo = new THREE.OctahedronGeometry(0.35);
      const centroidMat = new THREE.MeshStandardMaterial({
        color: CLUSTER_COLORS[idx],
        metalness: 0.7,
        roughness: 0.2,
      });
      const centroid = new THREE.Mesh(centroidGeo, centroidMat);
      centroid.position.set(c.x, 0.5, c.y);
      sceneGroup.add(centroid);

      // Label
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 64;
      labelCanvas.height = 32;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`C${idx + 1}`, 32, 16);
      }
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelGeo = new THREE.PlaneGeometry(0.6, 0.3);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex, transparent: true });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.position.set(c.x, 1.1, c.y);
      label.rotation.x = -Math.PI / 4;
      sceneGroup.add(label);

      // Lines from centroid to its cluster points
      points
        .filter((p) => p.cluster === idx)
        .forEach((p) => {
          const linePoints = [
            new THREE.Vector3(c.x, 0.05, c.y),
            new THREE.Vector3(p.x, 0.05, p.y),
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
          const lineMat = new THREE.LineBasicMaterial({
            color: CLUSTER_COLORS[idx],
            transparent: true,
            opacity: 0.3,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          sceneGroup.add(line);
        });
    });

    visualizerRef.current.scene.add(sceneGroup);
    visualizerRef.current.enableRender();
  };

  const generatePoints = (count: number = 30): void => {
    const pts: Point2D[] = [];
    // Generate 3 clusters of roughly equal size
    const clusterCenters = [
      { x: -3, y: -3 },
      { x: 3, y: -2 },
      { x: 0, y: 3 },
    ];
    for (let i = 0; i < count; i++) {
      const center = clusterCenters[i % 3];
      pts.push({
        x: center.x + (Math.random() - 0.5) * 4,
        y: center.y + (Math.random() - 0.5) * 4,
        cluster: -1,
      });
    }
    setPoints(pts);
    setCentroids([]);
    setIteration(0);
    setConverged(false);
    setMessage('Points generated. Press Run.');
  };

  const initCentroids = (pts: Point2D[]): Centroid[] => {
    // Pick K random points as initial centroids
    const shuffled = [...pts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, K).map((p) => ({ x: p.x, y: p.y }));
  };

  const assignClusters = (pts: Point2D[], cents: Centroid[]): Point2D[] => {
    return pts.map((p) => {
      let minDist = Infinity;
      let bestCluster = 0;
      cents.forEach((c, idx) => {
        const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = idx;
        }
      });
      return { ...p, cluster: bestCluster };
    });
  };

  const updateCentroids = (pts: Point2D[]): Centroid[] => {
    const newCentroids: Centroid[] = [];
    for (let k = 0; k < K; k++) {
      const clusterPts = pts.filter((p) => p.cluster === k);
      if (clusterPts.length === 0) {
        newCentroids.push({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 });
      } else {
        const avgX = clusterPts.reduce((s, p) => s + p.x, 0) / clusterPts.length;
        const avgY = clusterPts.reduce((s, p) => s + p.y, 0) / clusterPts.length;
        newCentroids.push({ x: avgX, y: avgY });
      }
    }
    return newCentroids;
  };

  const centroidsEqual = (a: Centroid[], b: Centroid[]): boolean => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i].x - b[i].x) > 0.001 || Math.abs(a[i].y - b[i].y) > 0.001) {
        return false;
      }
    }
    return true;
  };

  const runKMeans = async (): Promise<void> => {
    if (isRunning) return;
    setIsRunning(true);
    runningRef.current = true;
    setConverged(false);

    let currentCentroids = initCentroids(points);
    setCentroids(currentCentroids);
    setMessage('Initial centroids placed randomly.');
    await new Promise((r) => setTimeout(r, 800));

    let currentPoints = [...points];
    let iter = 0;
    const maxIter = 20;

    while (iter < maxIter && runningRef.current) {
      iter++;
      setIteration(iter);

      // Assign step
      currentPoints = assignClusters(currentPoints, currentCentroids);
      setPoints([...currentPoints]);
      setMessage(`Iteration ${iter}: Assigning points to nearest centroid...`);
      await new Promise((r) => setTimeout(r, 1000));

      // Update step
      const newCentroids = updateCentroids(currentPoints);

      if (centroidsEqual(currentCentroids, newCentroids)) {
        setCentroids(newCentroids);
        setConverged(true);
        setMessage(`Converged after ${iter} iterations!`);
        break;
      }

      currentCentroids = newCentroids;
      setCentroids([...currentCentroids]);
      setMessage(`Iteration ${iter}: Updating centroid positions...`);
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!converged && runningRef.current) {
      setMessage(`Stopped after ${maxIter} iterations.`);
    }

    setIsRunning(false);
    runningRef.current = false;
  };

  const reset = (): void => {
    runningRef.current = false;
    setIsRunning(false);
    generatePoints();
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow max-w-xs'>
        <h2 className='text-2xl font-bold mb-3'>K-Means Clustering</h2>

        <div className='mb-3 flex gap-2'>
          <button
            onClick={() => generatePoints()}
            className='bg-blue-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning}
          >
            Generate Points
          </button>
          <button
            onClick={runKMeans}
            className='bg-green-500 text-white px-4 py-2 rounded text-sm'
            disabled={isRunning || points.length === 0}
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={reset}
            className='bg-red-500 text-white px-4 py-2 rounded text-sm'
          >
            Reset
          </button>
        </div>

        <div className='text-sm space-y-1'>
          <div><strong>K:</strong> {K}</div>
          <div><strong>Points:</strong> {points.length}</div>
          <div><strong>Iteration:</strong> {iteration}</div>
          <div><strong>Converged:</strong> {converged ? 'Yes' : 'No'}</div>
          <div><strong>Status:</strong> {message}</div>
        </div>

        <div className='mt-3 pt-2 border-t text-xs text-gray-600'>
          <div><strong>Time Complexity:</strong> O(n * K * iterations)</div>
          <div><strong>Space Complexity:</strong> O(n + K)</div>
        </div>

        <div className='mt-2 text-xs text-gray-500'>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#ff4444' }}></span> Cluster 1
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#44cc44' }}></span> Cluster 2
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block w-3 h-3 rounded' style={{ backgroundColor: '#4488ff' }}></span> Cluster 3
          </div>
        </div>
      </div>
    </div>
  );
};

export default KMeansCircus;
