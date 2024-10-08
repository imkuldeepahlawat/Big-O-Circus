import { Algorithm3DPreviewer } from '@/lib/algorithm3DPreviewer';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

type Props = {};

const TrieDataStructure = (props: Props) => {
  const trieDomElementRef = useRef<HTMLCanvasElement | null>(null);
  const trieViewerRef = useRef<Algorithm3DPreviewer | null>(null);
  const [root, setRoot] = useState<TrieNode>(new TrieNode());
  const [words, setWords] = useState<string[]>([]);
  const [highlightedWord, setHighlightedWord] = useState<string>('');

  useEffect(() => {
    if (trieDomElementRef.current) {
      trieViewerRef.current = new Algorithm3DPreviewer(
        trieDomElementRef.current
      );
      updateTrieVisualization();
    }
  }, []);

  useEffect(() => {
    updateTrieVisualization();
  }, [root, highlightedWord]);

  const updateTrieVisualization = () => {
    if (trieViewerRef.current) {
      // Clear existing scene
      while (trieViewerRef.current.scene.children.length > 0) {
        trieViewerRef.current.scene.remove(
          trieViewerRef.current.scene.children[0]
        );
      }

      const trieGroup = new THREE.Group();

      visualizeNode(root, '', 0, 0, 5, trieGroup);

      trieViewerRef.current.scene.add(trieGroup);
      trieViewerRef.current.enableRender();
    }
  };

  const visualizeNode = (
    node: TrieNode,
    prefix: string,
    x: number,
    y: number,
    spread: number,
    group: THREE.Group
  ) => {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: highlightedWord.startsWith(prefix) ? 0xff0000 : 0x4287f5,
    });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(x, -y, 0);
    group.add(sphere);

    // Add text label
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.font = 'bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(prefix.slice(-1) || 'root', 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(0.8, 0.8);
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(x, -y, 0.5);
    group.add(label);

    if (node.isEndOfWord) {
      const endMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      );
      endMarker.position.set(x, -y - 0.7, 0);
      group.add(endMarker);
    }

    let i = 0;
    node.children.forEach((childNode, char) => {
      const childX = x - spread + (i * 2 * spread) / (node.children.size - 1);
      visualizeNode(childNode, prefix + char, childX, y + 2, spread / 2, group);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -y, 0),
          new THREE.Vector3(childX, -(y + 2), 0),
        ]),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
      );
      group.add(line);
      i++;
    });
  };

  const insertWord = (word: string) => {
    let current = root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    setRoot({ ...root }); // Trigger re-render
    setWords([...words, word]);
  };

  const handleInsert = () => {
    const newWord = prompt('Enter a word to insert into the Trie:');
    if (newWord) {
      insertWord(newWord.toLowerCase());
    }
  };

  const handleSearch = () => {
    const searchWord = prompt('Enter a word to search in the Trie:');
    if (searchWord) {
      setHighlightedWord(searchWord.toLowerCase());
      setTimeout(() => setHighlightedWord(''), 2000);
    }
  };

  const handleReset = () => {
    setRoot(new TrieNode());
    setWords([]);
    setHighlightedWord('');
    if (trieViewerRef.current) {
      // Clear existing scene
      while (trieViewerRef.current.scene.children.length > 0) {
        trieViewerRef.current.scene.remove(
          trieViewerRef.current.scene.children[0]
        );
      }
      trieViewerRef.current.enableRender();
    }
  };

  return (
    <div className='relative w-full h-full overflow-hidden'>
      <canvas ref={trieDomElementRef} className='w-full h-full' />
      <div className='absolute top-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Trie Controls</h3>
        <div className='grid grid-cols-3 gap-2'>
          <button
            onClick={handleInsert}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            Insert Word
          </button>
          <button
            onClick={handleSearch}
            className='bg-green-500 text-white px-4 py-2 rounded'
          >
            Search Word
          </button>
          <button
            onClick={handleReset}
            className='bg-red-500 text-white px-4 py-2 rounded'
          >
            Reset Trie
          </button>
        </div>
      </div>
      <div className='absolute bottom-4 left-4 bg-white bg-opacity-75 p-4 rounded shadow'>
        <h3 className='text-lg font-bold mb-2'>Words in Trie</h3>
        <p>{words.join(', ')}</p>
      </div>
      <div className='absolute top-4 right-4 bg-white bg-opacity-75 p-4 rounded shadow w-[200px]'>
        <h3 className='text-lg font-bold mb-2'>About Trie</h3>
        <p>
          A Trie, also called digital tree or prefix tree, is an efficient data
          structure for storing and searching strings. It's particularly useful
          for tasks like autocomplete and spell checking.
        </p>
      </div>
    </div>
  );
};

export default TrieDataStructure;
