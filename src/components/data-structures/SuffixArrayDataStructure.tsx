import React, { useEffect, useRef, useState } from 'react';
import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface SuffixEntry {
  index: number;
  suffix: string;
}

const SuffixArrayDataStructure: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [text, setText] = useState('');
  const [suffixArray, setSuffixArray] = useState<SuffixEntry[]>([]);
  const [patternInput, setPatternInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [message, setMessage] = useState('Suffix Array ready');
  const [matchedIndices, setMatchedIndices] = useState<Set<number>>(new Set());
  const [searchRange, setSearchRange] = useState<{ low: number; high: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      viewerRef.current = new Algorithm3DPreviewer(canvasRef.current);
      viewerRef.current.camera.position.set(4, 3, 12);
      viewerRef.current.camera.lookAt(4, 0, 0);
      updateVisualization();
    }
    return () => {
      viewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [suffixArray, matchedIndices, searchRange]);

  const makeTextCanvas = (text: string, color: string, fontSize: number = 36): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
    }
    return canvas;
  };

  const buildSuffixArray = (s: string): SuffixEntry[] => {
    const entries: SuffixEntry[] = [];
    for (let i = 0; i < s.length; i++) {
      entries.push({ index: i, suffix: s.substring(i) });
    }
    entries.sort((a, b) => a.suffix.localeCompare(b.suffix));
    return entries;
  };

  const updateVisualization = () => {
    if (!viewerRef.current) return;
    viewerRef.current.disposeSceneChildren();

    const group = new THREE.Group();
    const spacing = 1.3;

    // Title: original text
    if (text) {
      const titleTexture = new THREE.CanvasTexture(makeTextCanvas(`"${text}"`, '#cccccc', 22));
      const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
      const titleLabel = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.4), titleMat);
      titleLabel.position.set(2, (suffixArray.length) * spacing * 0.5 + 1, 0);
      group.add(titleLabel);
    }

    suffixArray.forEach((entry, rank) => {
      const y = (suffixArray.length - 1 - rank) * spacing;
      const isMatched = matchedIndices.has(entry.index);
      const inRange = searchRange && rank >= searchRange.low && rank <= searchRange.high;

      // Index box
      const idxGeom = new THREE.BoxGeometry(0.7, 0.8, 0.4);
      const idxColor = isMatched ? 0x44ff44 : inRange ? 0xffaa44 : 0x4287f5;
      const idxMat = new THREE.MeshStandardMaterial({ color: idxColor });
      const idxBox = new THREE.Mesh(idxGeom, idxMat);
      idxBox.position.set(0, y, 0);
      group.add(idxBox);

      // Index label
      const idxTexture = new THREE.CanvasTexture(makeTextCanvas(entry.index.toString(), 'white', 28));
      const idxLabelMat = new THREE.MeshBasicMaterial({ map: idxTexture, transparent: true });
      const idxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), idxLabelMat);
      idxLabel.position.set(0, y, 0.21);
      group.add(idxLabel);

      // Rank label on left
      const rankTexture = new THREE.CanvasTexture(makeTextCanvas(`#${rank}`, '#888888', 18));
      const rankMat = new THREE.MeshBasicMaterial({ map: rankTexture, transparent: true });
      const rankLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), rankMat);
      rankLabel.position.set(-0.8, y, 0);
      group.add(rankLabel);

      // Suffix text on right
      const suffText = entry.suffix.length > 12 ? entry.suffix.substring(0, 12) + '..' : entry.suffix;
      const suffTexture = new THREE.CanvasTexture(makeTextCanvas(suffText, isMatched ? '#44ff44' : '#ffffff', 18));
      const suffMat = new THREE.MeshBasicMaterial({ map: suffTexture, transparent: true });
      const suffLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.3), suffMat);
      suffLabel.position.set(2.2, y, 0);
      group.add(suffLabel);

      // Arrow from index box to suffix label
      const linePoints = [
        new THREE.Vector3(0.35, y, 0.1),
        new THREE.Vector3(0.8, y, 0.1),
      ];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x666666 });
      group.add(new THREE.Line(lineGeom, lineMat));
    });

    // Column headers
    if (suffixArray.length > 0) {
      const topY = suffixArray.length * spacing * 0.5 + 0.3;
      const hdrs = [
        { text: 'Rank', x: -0.8 },
        { text: 'SA[i]', x: 0 },
        { text: 'Suffix', x: 2.2 },
      ];
      hdrs.forEach((h) => {
        const tex = new THREE.CanvasTexture(makeTextCanvas(h.text, '#aaaaaa', 20));
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
        const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), mat);
        lbl.position.set(h.x, topY, 0);
        group.add(lbl);
      });
    }

    group.position.x = -1;
    group.position.y = -((suffixArray.length - 1) * spacing) / 2;
    viewerRef.current.scene.add(group);
    viewerRef.current.enableRender();
  };

  const handleBuild = () => {
    const s = textInput.trim();
    if (!s) {
      setMessage('Enter text to build suffix array');
      return;
    }
    if (s.length > 15) {
      setMessage('Text too long (max 15 chars for visualization)');
      return;
    }
    const sa = buildSuffixArray(s);
    setText(s);
    setSuffixArray(sa);
    setMatchedIndices(new Set());
    setSearchRange(null);
    setMessage(`Built suffix array for "${s}" -- ${sa.length} suffixes sorted`);
    setTextInput('');
  };

  const handleSearch = async () => {
    const pattern = patternInput.trim();
    if (!pattern || suffixArray.length === 0) {
      setMessage('Build a suffix array first, then enter a pattern');
      return;
    }

    setMessage(`Searching for "${pattern}" using binary search...`);
    setMatchedIndices(new Set());

    // Binary search for lower bound
    let lo = 0;
    let hi = suffixArray.length - 1;
    let first = -1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      setSearchRange({ low: lo, high: hi });
      await new Promise((r) => setTimeout(r, 400));

      if (suffixArray[mid].suffix.startsWith(pattern)) {
        first = mid;
        hi = mid - 1;
      } else if (suffixArray[mid].suffix < pattern) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (first === -1) {
      setSearchRange(null);
      setMessage(`Pattern "${pattern}" not found`);
      setPatternInput('');
      return;
    }

    // Find last occurrence
    let last = first;
    for (let i = first + 1; i < suffixArray.length; i++) {
      if (suffixArray[i].suffix.startsWith(pattern)) {
        last = i;
      } else break;
    }

    const matched = new Set<number>();
    for (let i = first; i <= last; i++) {
      matched.add(suffixArray[i].index);
    }

    setMatchedIndices(matched);
    setSearchRange({ low: first, high: last });
    setMessage(`Found "${pattern}" at ${matched.size} position(s): [${[...matched].sort((a, b) => a - b).join(', ')}] -- O(m log n) search`);
    setPatternInput('');
  };

  const handleSample = () => {
    const samples = ['banana', 'abracadabra', 'mississippi', 'hello world'];
    const s = samples[Math.floor(Math.random() * samples.length)];
    const sa = buildSuffixArray(s);
    setText(s);
    setSuffixArray(sa);
    setMatchedIndices(new Set());
    setSearchRange(null);
    setMessage(`Built suffix array for "${s}"`);
  };

  const handleClear = () => {
    setText('');
    setSuffixArray([]);
    setMatchedIndices(new Set());
    setSearchRange(null);
    setMessage('Suffix Array cleared');
  };

  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <canvas ref={canvasRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-90 p-4 rounded shadow max-w-sm'>
        <h2 className='text-xl font-bold mb-2'>Suffix Array</h2>

        <div className='mb-2 text-sm'>
          <strong>Text:</strong> {text ? `"${text}"` : '(none)'}
          <br />
          <strong>Suffixes:</strong> {suffixArray.length}
          <br />
          <strong>SA:</strong> [{suffixArray.map((e) => e.index).join(', ')}]
        </div>

        {message && (
          <div className='mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800'>
            {message}
          </div>
        )}

        <Accordion type='single' collapsible className='w-full'>
          <AccordionItem value='build'>
            <AccordionTrigger>Build</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1 mb-2'>
                <input
                  type='text'
                  placeholder='Text (max 15)'
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className='border rounded px-2 py-1 w-32 text-sm'
                />
                <Button onClick={handleBuild} className='bg-green-500 text-white px-3 py-1 rounded text-sm'>
                  Build
                </Button>
              </div>
              <Button onClick={handleSample} className='bg-purple-500 text-white px-3 py-1 rounded text-sm w-full'>
                Random Sample
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='search'>
            <AccordionTrigger>Pattern Search</AccordionTrigger>
            <AccordionContent>
              <div className='flex gap-1'>
                <input
                  type='text'
                  placeholder='Pattern'
                  value={patternInput}
                  onChange={(e) => setPatternInput(e.target.value)}
                  className='border rounded px-2 py-1 w-32 text-sm'
                />
                <Button onClick={handleSearch} className='bg-blue-500 text-white px-3 py-1 rounded text-sm'>
                  Search
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value='actions'>
            <AccordionTrigger>Actions</AccordionTrigger>
            <AccordionContent>
              <Button onClick={handleClear} className='bg-gray-500 text-white px-3 py-1 rounded text-sm w-full'>
                Clear
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className='mt-3 text-xs text-gray-500'>
          <strong>Complexity:</strong> Build O(n log n) | Search O(m log n) | Space O(n)
        </div>
        <div className='mt-1 text-xs text-gray-400'>
          <span className='inline-block w-3 h-3 rounded mr-1' style={{ backgroundColor: '#4287f5' }}></span>Default
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#44ff44' }}></span>Match
          <span className='inline-block w-3 h-3 rounded mx-1 ml-2' style={{ backgroundColor: '#ffaa44' }}></span>Search range
        </div>
      </div>

      <div className='absolute w-[400px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Suffix Array</h3>
        <p className='text-sm'>
          A Suffix Array is a sorted array of all suffixes of a given string,
          represented by their starting indices. It enables efficient pattern matching
          using binary search in O(m log n) time, where m is the pattern length and
          n is the text length. Suffix arrays are a space-efficient alternative to
          suffix trees and are widely used in bioinformatics, text indexing, and
          data compression algorithms like BWT.
        </p>
      </div>
    </div>
  );
};

export default SuffixArrayDataStructure;
