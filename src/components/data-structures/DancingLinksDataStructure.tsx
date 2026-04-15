import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
import * as THREE from 'three';

const ROWS = 6;
const COLS = 7;

const DancingLinksDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [matrix, setMatrix] = useState<boolean[][]>(() => {
    // Example exact cover matrix
    const m = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    [[0, 0, 3, 6], [1, 0, 3], [2, 3, 4, 6], [3, 2, 4, 5], [4, 1, 2, 5, 6], [5, 1, 6]].forEach((row, r) => {
      row.forEach((c) => { if (c < COLS) m[r][c] = true; });
    });
    return m;
  });
  const [coveredCols, setCoveredCols] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState('Click Cover to remove a column and its conflicting rows');

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.z = 7;
      updateVisualization();
    }
    return () => { viewerRef.current?.disposeCircus(); };
  }, []);

  useEffect(() => { updateVisualization(); }, [matrix, coveredCols, selectedRows]);

  const coverColumn = (col: number) => {
    if (coveredCols.has(col)) return;
    const newCovered = new Set(coveredCols);
    newCovered.add(col);
    // Find a row that has a 1 in this column and select it
    for (let r = 0; r < ROWS; r++) {
      if (matrix[r][col] && !selectedRows.has(r)) {
        const newSelected = new Set(selectedRows);
        newSelected.add(r);
        // Cover all columns in this row
        matrix[r].forEach((v, c) => { if (v) newCovered.add(c); });
        setSelectedRows(newSelected);
        break;
      }
    }
    setCoveredCols(newCovered);
    setMessage(`Covered column ${col}. ${newCovered.size}/${COLS} columns covered.`);
  };

  const uncoverAll = () => {
    setCoveredCols(new Set());
    setSelectedRows(new Set());
    setMessage('Uncovered all columns');
  };

  const generateRandom = () => {
    const m = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => Math.random() < 0.3)
    );
    setMatrix(m);
    setCoveredCols(new Set());
    setSelectedRows(new Set());
    setMessage('Generated random matrix');
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();
    const group = new THREE.Group();
    const offsetX = -(COLS * 0.7) / 2;
    const offsetY = (ROWS * 0.7) / 2;

    // Column headers
    for (let c = 0; c < COLS; c++) {
      const isCovered = coveredCols.has(c);
      const geo = new THREE.BoxGeometry(0.6, 0.3, 0.3);
      const mat = new THREE.MeshStandardMaterial({ color: isCovered ? 0x999999 : 0xf59e0b });
      const box = new THREE.Mesh(geo, mat);
      box.position.set(offsetX + c * 0.7, offsetY + 0.5, 0);
      group.add(box);

      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`C${c}`, 16, 8); }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), labelMat);
      label.position.set(offsetX + c * 0.7, offsetY + 0.5, 0.16);
      group.add(label);
    }

    // Matrix cells
    for (let r = 0; r < ROWS; r++) {
      const isSelected = selectedRows.has(r);
      for (let c = 0; c < COLS; c++) {
        const isCovered = coveredCols.has(c);
        if (matrix[r][c]) {
          const geo = new THREE.SphereGeometry(0.15, 12, 12);
          let color = 0x4287f5;
          if (isSelected) color = 0x10b981;
          else if (isCovered) color = 0x666666;
          const mat = new THREE.MeshStandardMaterial({ color, transparent: isCovered && !isSelected, opacity: isCovered && !isSelected ? 0.3 : 1 });
          const sphere = new THREE.Mesh(geo, mat);
          sphere.position.set(offsetX + c * 0.7, offsetY - r * 0.7, 0);
          group.add(sphere);

          // Vertical link
          if (r > 0 && matrix[r - 1]?.[c]) {
            const pts = [new THREE.Vector3(offsetX + c * 0.7, offsetY - (r - 1) * 0.7, 0), new THREE.Vector3(offsetX + c * 0.7, offsetY - r * 0.7, 0)];
            group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: isCovered ? 0x444444 : 0x999999 })));
          }
          // Horizontal link to next 1 in row
          for (let nc = c + 1; nc < COLS; nc++) {
            if (matrix[r][nc]) {
              const pts = [new THREE.Vector3(offsetX + c * 0.7, offsetY - r * 0.7, 0), new THREE.Vector3(offsetX + nc * 0.7, offsetY - r * 0.7, 0)];
              group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: isSelected ? 0x10b981 : 0xcccccc })));
              break;
            }
          }
        }
      }

      // Row label
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = isSelected ? '#10b981' : '#666'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(`R${r}`, 16, 8); }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.15), labelMat);
      label.position.set(offsetX - 0.6, offsetY - r * 0.7, 0);
      group.add(label);
    }

    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-lg max-w-sm">
        <h2 className="text-xl font-bold mb-3">Dancing Links (DLX)</h2>
        <div className="mb-2 text-sm">
          <strong>Matrix:</strong> {ROWS}x{COLS} |{' '}
          <strong>Covered:</strong> {coveredCols.size}/{COLS} |{' '}
          <strong>Selected rows:</strong> {[...selectedRows].join(', ') || 'none'}
        </div>
        {message && <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: COLS }, (_, i) => (
              <button key={i} onClick={() => coverColumn(i)} disabled={coveredCols.has(i)}
                className={`px-2 py-1 rounded text-xs ${coveredCols.has(i) ? 'bg-gray-300 text-gray-500' : 'bg-amber-500 text-white'}`}>
                Cover C{i}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={uncoverAll} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Uncover All</button>
            <button onClick={generateRandom} className="bg-purple-500 text-white px-3 py-1 rounded text-sm">Random</button>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Knuth's Algorithm X with Dancing Links. Cover operation removes a column and all conflicting rows. Used for exact cover problems (Sudoku, pentomino puzzles).
        </div>
      </div>
    </div>
  );
};

export default DancingLinksDataStructure;
