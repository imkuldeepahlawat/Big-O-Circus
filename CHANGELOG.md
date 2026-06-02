# Changelog

All notable changes to Big O Circus are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [Unreleased]

- Additional LeetCode problem visualizations planned
- Performance improvements for large graph animations

---

## [1.3.0] - 2026-06-02

### Added
- Contains Duplicate problem visualizer
- Valid Anagram problem visualizer
- Top K Frequent Elements problem visualizer
- Group Anagrams problem visualizer

### Fixed
- Missing algorithm and data structure component files causing Vercel build failures
- Dynamic year in footer (no longer hardcoded)

---

## [1.2.0] - 2026-04-16

### Added
- Probabilistic data structures: Bloom Filter, Skip List
- Spatial data structures: K-d Tree, Segment Tree, Fenwick Tree
- Miscellaneous data structures: Circular Buffer, Rope, Suffix Array, Sparse Matrix
- Advanced list structures: Skip List, Doubly Linked List variants
- Heap variants: Fibonacci Heap, Pairing Heap, Binomial Heap
- Tree variants: B-Tree, B+ Tree, Suffix Tree

### Fixed
- Missing lazy imports for LCS, Knapsack, LIS, KMP, Sieve, BucketSort
- Resolved merge conflict marker in routes file

---

## [1.1.0] - 2026-04-15

### Added
- **65+ total interactive visualizations** (28 data structures, 36 algorithms, 1+ problems)
- Problems dashboard with Two Sum — both brute-force O(n²) and hash-map O(n) approaches
- Search algorithms: Linear, Binary, Jump, Interpolation, Exponential Search
- Backtracking algorithms: N-Queens, Sudoku Solver
- Geometric algorithm: Graham Scan (Convex Hull)
- Numerical algorithm: Sieve of Eratosthenes
- Machine Learning: K-Means Clustering visualization
- Dynamic Programming: Fibonacci, LCS, 0/1 Knapsack, LIS
- String matching: KMP Pattern Matching
- Greedy algorithms: Huffman Coding
- Graph algorithms: Bellman-Ford, Floyd-Warshall, Topological Sort
- Cache structures: LRU Cache, LFU Cache
- Greedy/MST algorithms: Kruskal, Prim
- Community standards: Code of Conduct, Contributing guide, Security policy, issue and PR templates
- GitHub Actions workflow for automatic deployment to GitHub Pages on push to `main`

### Fixed
- Removed npm cache from CI pipeline
- Upgraded Vite to patch CVE-2026-39365
- Fixed Node.js deprecation warnings in CI

---

## [1.0.0] - 2026-04-14

### Added
- Initial release of Big O Circus
- Interactive 3D visualizations powered by Three.js
- Core data structures: Array, Linked List, Stack, Queue, Hash Table
- Tree structures: Binary Tree, BST, AVL Tree, Red-Black Tree, Trie
- Graph types: Undirected, Directed, Weighted, DAG
- Sorting algorithms: Bubble, Selection, Insertion, Merge, Quick, Heap, Radix, Counting, Bucket Sort
- Graph algorithms: BFS, DFS, Dijkstra
- Queue variants: Priority Queue, Deque, Circular Queue
- Set structures: Disjoint Set (Union-Find)
- Step-by-step animation with color-coded highlighting
- Big-O complexity display for every operation
- Docker support for containerized local development
- Orbit controls, lighting, and shading via Three.js

---

[Unreleased]: https://github.com/imkuldeepahlawat/Big-O-Circus/compare/HEAD...main
[1.3.0]: https://github.com/imkuldeepahlawat/Big-O-Circus/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/imkuldeepahlawat/Big-O-Circus/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/imkuldeepahlawat/Big-O-Circus/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/imkuldeepahlawat/Big-O-Circus/releases/tag/v1.0.0
