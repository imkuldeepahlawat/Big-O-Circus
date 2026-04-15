# Big O Circus 🎪

<div align="center">
  <p><i>Visualize and understand algorithms, data structures, and coding problems through interactive 3D animations</i></p>
  
  [![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge&logo=vercel)](https://circus.kuldeepahlawat.in/)
  [![GitHub Stars](https://img.shields.io/github/stars/imkuldeepahlawat/Big-O-Circus?style=for-the-badge&logo=github)](https://github.com/imkuldeepahlawat/Big-O-Circus/stargazers)
  [![License](https://img.shields.io/github/license/imkuldeepahlawat/Big-O-Circus?style=for-the-badge)](LICENSE)
</div>

## Overview

Big O Circus is an interactive web application that helps you understand algorithms, data structures, and coding problems through **3D visualizations** powered by Three.js. Watch sorting algorithms swap bars in real-time, see trees rotate during AVL balancing, trace Dijkstra's shortest path on a graph, or solve Two Sum step-by-step with both brute-force and hash-map approaches.

### Features

- **3D Visualizations** - Interactive Three.js scenes with orbit controls, lighting, and shading
- **65+ Implementations** - Data structures, algorithms, and coding problems with full interactivity
- **Step-by-Step Animation** - Watch each operation happen with color-coded highlighting
- **Multiple Approaches** - Compare brute-force vs optimized solutions (e.g., Two Sum)
- **Complexity Display** - See Big-O time and space complexity for every operation
- **Auto-Deploy** - Pushes to main automatically deploy to GitHub Pages

## Live Demo

Visit the live application: [https://circus.kuldeepahlawat.in/](https://circus.kuldeepahlawat.in/)

## What's Implemented

### Data Structures (28 interactive visualizations)

| Category | Implementations |
|----------|----------------|
| **Basic** | Array, Linked List, Stack, Queue, Hash Table |
| **Trees** | Binary Tree, BST, AVL Tree, Red-Black Tree, Trie, Segment Tree, Fenwick Tree |
| **Heaps** | Binary Heap |
| **Graphs** | Undirected Graph, Directed Graph, Weighted Graph, DAG |
| **Advanced Lists** | Skip List |
| **Queue Variants** | Priority Queue, Deque, Circular Queue |
| **Set Structures** | Disjoint Set (Union-Find), Bloom Filter |
| **Caches** | LRU Cache, LFU Cache |
| **Other** | Circular Buffer, K-d Tree |

### Algorithms (36 interactive visualizations)

| Category | Implementations |
|----------|----------------|
| **Sorting** | Bubble, Selection, Insertion, Merge, Quick, Heap, Radix, Counting, Bucket Sort |
| **Searching** | Linear, Binary, Jump, Interpolation, Exponential Search |
| **Graph** | BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Kruskal, Prim, Topological Sort |
| **Dynamic Programming** | Fibonacci, LCS, 0/1 Knapsack, LIS |
| **String** | KMP Pattern Matching |
| **Greedy** | Huffman Coding |
| **Backtracking** | N-Queens, Sudoku Solver |
| **Geometric** | Graham Scan (Convex Hull) |
| **Numerical** | Sieve of Eratosthenes |
| **Machine Learning** | K-Means Clustering |

### Problems (with solution visualizations)

| Problem | Difficulty | Topics | Approaches |
|---------|-----------|--------|------------|
| Two Sum | Easy | Array, Hash Table | Brute Force O(n^2), Hash Map O(n) |

## Tech Stack

- **Frontend**: React 18, TypeScript
- **3D Graphics**: Three.js with custom `Algorithm3DPreviewer` wrapper
- **Styling**: TailwindCSS, Shadcn UI
- **Animation**: Framer Motion, CSS Animations
- **Build**: Vite
- **Deploy**: GitHub Actions -> GitHub Pages
- **Icons**: React Icons, Lucide React

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm

### Setup

```bash
git clone https://github.com/imkuldeepahlawat/Big-O-Circus.git
cd Big-O-Circus
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Docker

```bash
docker build -t big-o-circus-app .
docker run --name big-o-circus-app -p 8080:80 -d big-o-circus-app
```

## Project Structure

```
Big-O-Circus/
├── src/
│   ├── components/
│   │   ├── algorithms/          # 36 algorithm visualizations
│   │   ├── data-structures/     # 28 data structure visualizations
│   │   ├── problems/            # Coding problem visualizations
│   │   └── ui/                  # Shadcn UI components
│   ├── lib/
│   │   └── algorithm3DPreviewer.ts  # Three.js wrapper (scene, camera, lighting, disposal)
│   ├── helpers/
│   │   └── contsant.ts          # Registry of all DS, algorithms, and problems
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── DataStructuresDashboard.tsx
│   │   ├── AlgorithmsDashboard.tsx
│   │   └── ProblemsDashboard.tsx
│   ├── routes/
│   │   └── index.tsx            # All routes (lazy-loaded)
│   └── types/
│       └── contantTypes.ts      # TypeScript interfaces
├── .github/workflows/
│   └── deploy.yml               # Auto-deploy on push to main
└── package.json
```

## Adding a New Visualization

1. Create a component in `src/components/algorithms/` or `src/components/data-structures/`
2. Follow the existing pattern:
   ```tsx
   import { Algorithm3DPreviewer } from '../../lib/algorithm3DPreviewer';
   import * as THREE from 'three';
   // useRef for canvas + viewer
   // useEffect with disposeCircus() cleanup
   // MeshStandardMaterial for solids, MeshBasicMaterial for labels
   // disposeSceneChildren() to clear scene before re-render
   ```
3. Add lazy import and route in `src/routes/index.tsx`
4. Add entry in `src/helpers/contsant.ts` with `color: 'green'`
5. Push to main - auto-deploys

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request to `main`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Kuldeep Ahlawat - [LinkedIn](https://www.linkedin.com/in/imkuldeepahlawat/)
- Project Link: [https://github.com/imkuldeepahlawat/Big-O-Circus](https://github.com/imkuldeepahlawat/Big-O-Circus)

---

<div align="center">
  <p>Made with ❤️ by Kuldeep Ahlawat</p>
  <p>If you found this project helpful, please consider giving it a ⭐</p>
</div>
