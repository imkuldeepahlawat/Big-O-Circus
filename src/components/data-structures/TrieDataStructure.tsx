import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';

interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  char: string;
}

interface VisualNode {
  node: TrieNode;
  x: number;
  y: number;
  z: number;
  parentX?: number;
  parentY?: number;
  parentZ?: number;
}

const PRESET_WORDS = ['cat', 'car', 'card', 'care', 'dog', 'do'];

const TrieDataStructure: React.FC = () => {
  const trieDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const trieViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const rootRef = useRef<TrieNode>(createTrieNode(''));
  const [words, setWords] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState('');
  const [message, setMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [highlightResult, setHighlightResult] = useState<
    'found' | 'not-found' | 'insert' | null
  >(null);

  function createTrieNode(char: string): TrieNode {
    return {
      children: new Map(),
      isEndOfWord: false,
      char,
    };
  }

  const getAllWords = useCallback((): string[] => {
    const result: string[] = [];
    const dfs = (node: TrieNode, prefix: string) => {
      if (node.isEndOfWord) {
        result.push(prefix);
      }
      for (const [char, child] of node.children) {
        dfs(child, prefix + char);
      }
    };
    dfs(rootRef.current, '');
    return result.sort();
  }, []);

  const computeLayout = useCallback((): VisualNode[] => {
    const visualNodes: VisualNode[] = [];
    const Y_SPACING = 2;
    const BASE_X_SPACING = 2.5;

    const countLeaves = (node: TrieNode): number => {
      if (node.children.size === 0) return 1;
      let count = 0;
      for (const child of node.children.values()) {
        count += countLeaves(child);
      }
      return count;
    };

    const layout = (
      node: TrieNode,
      depth: number,
      xOffset: number,
      parentX?: number,
      parentY?: number,
      parentZ?: number
    ) => {
      const totalLeaves = countLeaves(node);
      const width = totalLeaves * BASE_X_SPACING;
      const x = xOffset + width / 2;
      const y = -depth * Y_SPACING;
      const z = 0;

      visualNodes.push({
        node,
        x,
        y,
        z,
        parentX,
        parentY,
        parentZ,
      });

      let childOffset = xOffset;
      const children = Array.from(node.children.entries()).sort(([a], [b]) =>
        a.localeCompare(b)
      );

      for (const [, child] of children) {
        const childLeaves = countLeaves(child);
        const childWidth = childLeaves * BASE_X_SPACING;
        layout(child, depth + 1, childOffset, x, y, z);
        childOffset += childWidth;
      }
    };

    const totalLeaves = countLeaves(rootRef.current);
    const totalWidth = totalLeaves * BASE_X_SPACING;
    layout(rootRef.current, 0, -totalWidth / 2);

    return visualNodes;
  }, []);

  const updateVisualization = useCallback(() => {
    if (!trieViewerRef.current) return;

    trieViewerRef.current.disposeSceneChildren();

    const treeGroup = new THREE.Group();
    const visualNodes = computeLayout();

    for (const vn of visualNodes) {
      const isRoot = vn.node.char === '';
      const isOnPath = highlightPath.includes(getNodeId(vn));
      const isEndHighlight = vn.node.isEndOfWord;

      let color = 0x4488cc;
      if (isRoot) {
        color = 0x8888cc;
      } else if (isOnPath && highlightResult === 'found') {
        color = 0x44cc44;
      } else if (isOnPath && highlightResult === 'not-found') {
        color = 0xcc4444;
      } else if (isOnPath && highlightResult === 'insert') {
        color = 0xcccc44;
      } else if (isEndHighlight) {
        color = 0x44cc44;
      }

      const sphereGeometry = new THREE.SphereGeometry(0.35);
      const sphereMaterial = new THREE.MeshStandardMaterial({ color });
      const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphereMesh.position.set(vn.x, vn.y, vn.z);
      treeGroup.add(sphereMesh);

      // Character label
      const label = isRoot ? 'root' : vn.node.char;
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, 128, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 64, 32);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
      });
      const labelGeometry = new THREE.PlaneGeometry(0.8, 0.4);
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(vn.x, vn.y + 0.55, vn.z);
      treeGroup.add(labelMesh);

      // End-of-word indicator
      if (vn.node.isEndOfWord && !isRoot) {
        const ringGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0x44cc44,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.set(vn.x, vn.y, vn.z + 0.01);
        treeGroup.add(ringMesh);
      }

      // Connection line to parent
      if (
        vn.parentX !== undefined &&
        vn.parentY !== undefined &&
        vn.parentZ !== undefined
      ) {
        const linePoints = [
          new THREE.Vector3(vn.parentX, vn.parentY, vn.parentZ),
          new THREE.Vector3(vn.x, vn.y, vn.z),
        ];
        const lineGeometry =
          new THREE.BufferGeometry().setFromPoints(linePoints);

        let lineColor = 0xaaaaaa;
        if (isOnPath && highlightResult === 'found') lineColor = 0x44cc44;
        else if (isOnPath && highlightResult === 'not-found')
          lineColor = 0xcc4444;
        else if (isOnPath && highlightResult === 'insert')
          lineColor = 0xcccc44;

        const lineMaterial = new THREE.LineBasicMaterial({ color: lineColor });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        treeGroup.add(line);

        // Edge label (the character on the edge)
        if (!isRoot) {
          const edgeCanvas = document.createElement('canvas');
          edgeCanvas.width = 64;
          edgeCanvas.height = 64;
          const edgeCtx = edgeCanvas.getContext('2d');
          if (edgeCtx) {
            edgeCtx.fillStyle = 'transparent';
            edgeCtx.fillRect(0, 0, 64, 64);
            edgeCtx.fillStyle = '#ffcc00';
            edgeCtx.font = 'bold 36px Arial';
            edgeCtx.textAlign = 'center';
            edgeCtx.textBaseline = 'middle';
            edgeCtx.fillText(vn.node.char, 32, 32);
          }
          const edgeTexture = new THREE.CanvasTexture(edgeCanvas);
          const edgeLabelMaterial = new THREE.MeshBasicMaterial({
            map: edgeTexture,
            transparent: true,
            depthTest: false,
          });
          const edgeLabelGeometry = new THREE.PlaneGeometry(0.4, 0.4);
          const edgeLabelMesh = new THREE.Mesh(
            edgeLabelGeometry,
            edgeLabelMaterial
          );
          const midX = (vn.parentX + vn.x) / 2 + 0.3;
          const midY = (vn.parentY + vn.y) / 2;
          const midZ = (vn.parentZ + vn.z) / 2;
          edgeLabelMesh.position.set(midX, midY, midZ);
          treeGroup.add(edgeLabelMesh);
        }
      }
    }

    trieViewerRef.current.scene.add(treeGroup);
    trieViewerRef.current.enableRender();
  }, [computeLayout, highlightPath, highlightResult]);

  function getNodeId(vn: VisualNode): string {
    return `${vn.x.toFixed(3)}_${vn.y.toFixed(3)}`;
  }

  useEffect(() => {
    if (trieDomElementRef.current) {
      trieViewerRef.current = new Algorithm3DPreviewer(
        trieDomElementRef.current
      );
      trieViewerRef.current.camera.position.set(0, -3, 12);
      updateVisualization();
    }
    return () => {
      trieViewerRef.current?.disposeCircus();
    };
  }, []);

  useEffect(() => {
    updateVisualization();
  }, [words, highlightPath, highlightResult, updateVisualization]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const insertWord = async (word: string) => {
    if (!word || isAnimating) return;
    const w = word.toLowerCase().trim();
    if (!w) return;

    setIsAnimating(true);
    setMessage(`Inserting "${w}"...`);

    let current = rootRef.current;
    const pathIds: string[] = [];

    // Build path for animation
    const visualNodesBefore = computeLayout();
    const rootVn = visualNodesBefore.find((vn) => vn.node.char === '');
    if (rootVn) pathIds.push(getNodeId(rootVn));

    for (let i = 0; i < w.length; i++) {
      const char = w[i];
      if (!current.children.has(char)) {
        current.children.set(char, createTrieNode(char));
      }
      current = current.children.get(char)!;

      // Recompute layout after each character for animation
      const visualNodes = computeLayout();
      // Find the visual node for current
      const targetVn = findVisualNodeForTrieNode(visualNodes, current);
      if (targetVn) pathIds.push(getNodeId(targetVn));

      setHighlightPath([...pathIds]);
      setHighlightResult('insert');
      setMessage(`Inserting "${w}" - character '${char}' (${i + 1}/${w.length})`);
      // Force re-render
      setWords([...getAllWords()]);
      await sleep(500);
    }

    current.isEndOfWord = true;
    setWords([...getAllWords()]);
    setHighlightResult('found');
    setMessage(`Inserted "${w}" successfully`);

    await sleep(800);
    setHighlightPath([]);
    setHighlightResult(null);
    setIsAnimating(false);
  };

  const findVisualNodeForTrieNode = (
    visualNodes: VisualNode[],
    trieNode: TrieNode
  ): VisualNode | undefined => {
    return visualNodes.find((vn) => vn.node === trieNode);
  };

  const searchWord = async (word: string) => {
    if (!word || isAnimating) return;
    const w = word.toLowerCase().trim();
    if (!w) return;

    setIsAnimating(true);
    setMessage(`Searching for "${w}"...`);

    let current = rootRef.current;
    const visualNodes = computeLayout();
    const pathIds: string[] = [];

    const rootVn = visualNodes.find((vn) => vn.node.char === '');
    if (rootVn) pathIds.push(getNodeId(rootVn));

    for (let i = 0; i < w.length; i++) {
      const char = w[i];
      if (!current.children.has(char)) {
        setHighlightPath([...pathIds]);
        setHighlightResult('not-found');
        setMessage(`"${w}" not found - no path for '${char}'`);
        await sleep(1500);
        setHighlightPath([]);
        setHighlightResult(null);
        setIsAnimating(false);
        return;
      }
      current = current.children.get(char)!;
      const targetVn = findVisualNodeForTrieNode(visualNodes, current);
      if (targetVn) pathIds.push(getNodeId(targetVn));

      setHighlightPath([...pathIds]);
      setHighlightResult('insert');
      setMessage(`Searching "${w}" - checking '${char}' (${i + 1}/${w.length})`);
      await sleep(400);
    }

    if (current.isEndOfWord) {
      setHighlightResult('found');
      setMessage(`"${w}" found in the trie!`);
    } else {
      setHighlightResult('not-found');
      setMessage(`"${w}" is a prefix but not a complete word in the trie`);
    }

    await sleep(1500);
    setHighlightPath([]);
    setHighlightResult(null);
    setIsAnimating(false);
  };

  const deleteWord = async (word: string) => {
    if (!word || isAnimating) return;
    const w = word.toLowerCase().trim();
    if (!w) return;

    setIsAnimating(true);
    setMessage(`Deleting "${w}"...`);

    const deleteHelper = (
      node: TrieNode,
      wordStr: string,
      depth: number
    ): boolean => {
      if (depth === wordStr.length) {
        if (!node.isEndOfWord) return false;
        node.isEndOfWord = false;
        return node.children.size === 0;
      }

      const char = wordStr[depth];
      const child = node.children.get(char);
      if (!child) return false;

      const shouldDeleteChild = deleteHelper(child, wordStr, depth + 1);
      if (shouldDeleteChild) {
        node.children.delete(char);
        return !node.isEndOfWord && node.children.size === 0;
      }
      return false;
    };

    // Check if word exists first
    let current = rootRef.current;
    for (const char of w) {
      if (!current.children.has(char)) {
        setMessage(`"${w}" not found in the trie`);
        await sleep(1000);
        setIsAnimating(false);
        return;
      }
      current = current.children.get(char)!;
    }
    if (!current.isEndOfWord) {
      setMessage(`"${w}" is not a complete word in the trie`);
      await sleep(1000);
      setIsAnimating(false);
      return;
    }

    deleteHelper(rootRef.current, w, 0);
    setWords([...getAllWords()]);
    setMessage(`Deleted "${w}" from the trie`);
    await sleep(800);
    setIsAnimating(false);
  };

  const insertPresetWords = async () => {
    if (isAnimating) return;
    for (const word of PRESET_WORDS) {
      await insertWord(word);
    }
  };

  const clearTrie = () => {
    if (isAnimating) return;
    rootRef.current = createTrieNode('');
    setWords([]);
    setHighlightPath([]);
    setHighlightResult(null);
    setMessage('Trie cleared');
  };

  const handleInsert = () => {
    if (inputWord.trim()) {
      insertWord(inputWord.trim());
      setInputWord('');
    }
  };

  const handleSearch = () => {
    if (inputWord.trim()) {
      searchWord(inputWord.trim());
    }
  };

  const handleDelete = () => {
    if (inputWord.trim()) {
      deleteWord(inputWord.trim());
      setInputWord('');
    }
  };

  return (
    <div className='relative w-full h-screen'>
      <canvas ref={trieDomElementRef} className='w-full h-full' />

      {/* Control Panel */}
      <div className='absolute top-4 left-4 text-white p-4 rounded shadow max-w-xs'>
        <h3 className='text-lg font-bold mb-3'>Trie (Prefix Tree)</h3>

        <div className='mb-3'>
          <input
            type='text'
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInsert();
            }}
            placeholder='Enter a word...'
            className='w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-400'
            disabled={isAnimating}
          />
        </div>

        <div className='flex flex-col gap-2 mb-3'>
          <div className='flex gap-2'>
            <Button
              onClick={handleInsert}
              disabled={isAnimating || !inputWord.trim()}
              className='bg-blue-600 text-white px-3 py-1 rounded flex-1'
            >
              Insert
            </Button>
            <Button
              onClick={handleSearch}
              disabled={isAnimating || !inputWord.trim()}
              className='bg-purple-600 text-white px-3 py-1 rounded flex-1'
            >
              Search
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isAnimating || !inputWord.trim()}
              className='bg-red-600 text-white px-3 py-1 rounded flex-1'
            >
              Delete
            </Button>
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={insertPresetWords}
              disabled={isAnimating}
              className='bg-green-600 text-white px-3 py-1 rounded flex-1'
            >
              Insert Preset Words
            </Button>
            <Button
              onClick={clearTrie}
              disabled={isAnimating}
              className='bg-gray-600 text-white px-3 py-1 rounded flex-1'
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Message Area */}
        {message && (
          <div
            className={`mb-3 p-2 rounded text-sm ${
              highlightResult === 'found'
                ? 'bg-green-900 text-green-200'
                : highlightResult === 'not-found'
                  ? 'bg-red-900 text-red-200'
                  : 'bg-gray-800 text-gray-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* Words in Trie */}
        {words.length > 0 && (
          <div className='mb-3'>
            <h4 className='font-bold text-sm mb-1'>
              Words in Trie ({words.length}):
            </h4>
            <div className='flex flex-wrap gap-1'>
              {words.map((w, i) => (
                <span
                  key={i}
                  className='bg-gray-700 px-2 py-0.5 rounded text-xs'
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Complexity Info */}
        <div className='text-xs text-gray-400 border-t border-gray-700 pt-2'>
          <p>
            <strong>Time Complexity:</strong> O(m) where m = word length
          </p>
          <p>
            <strong>Space Complexity:</strong> O(ALPHABET_SIZE * m * n)
          </p>
          <p className='mt-1 text-gray-500'>
            Insert, Search, Delete are all O(m)
          </p>
        </div>
      </div>

      {/* Info Panel */}
      <div className='absolute w-[350px] top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>About Trie</h3>
        <p className='text-sm'>
          A Trie (prefix tree) is a tree-like data structure used to store a
          dynamic set of strings. Each node represents a character, and paths
          from root to marked nodes represent complete words. Tries enable
          efficient prefix-based searching and auto-completion.
        </p>
        <div className='mt-2 text-xs'>
          <p>
            <span className='inline-block w-3 h-3 rounded-full bg-green-500 mr-1'></span>{' '}
            End-of-word node
          </p>
          <p>
            <span className='inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1'></span>{' '}
            Insertion path
          </p>
          <p>
            <span className='inline-block w-3 h-3 rounded-full bg-red-500 mr-1'></span>{' '}
            Not found
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrieDataStructure;
