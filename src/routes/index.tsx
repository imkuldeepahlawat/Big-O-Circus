import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import LoadingComponent from '../components/LoadingComponent';

// Data Structures
const ArrayDataStructure = lazy(
  () => import('@/components/data-structures/ArrayDataStructure')
);
const LinkedListDataStructure = lazy(
  () => import('@/components/data-structures/LinkedlistDataStructure')
);
const StackDataStructure = lazy(
  () => import('@/components/data-structures/StackDataStructure')
);
const QueueDataStructure = lazy(
  () => import('@/components/data-structures/QueueDataStructure')
);
const BinaryTreeDataStructure = lazy(
  () => import('@/components/data-structures/BinaryTreeDataStructure')
);

const BinarySearchTree = lazy(
  () => import('@/components/data-structures/BinarySearchTree')
);

const RedBlackTreeDataStructure = lazy(
  () => import('@/components/data-structures/RedBlackTreeDataStructure')
);

const AVLTreeDataStructure = lazy(
  () => import('@/components/data-structures/AVLTreeDataStructure')
);

const PriorityQueueDataStructure = lazy(
  () => import('@/components/data-structures/PriorityQueueDataStructure')
);
const DequeDataStructure = lazy(
  () => import('@/components/data-structures/DequeDataStructure')
);
const CircularQueueDataStructure = lazy(
  () => import('@/components/data-structures/CircularQueueDataStructure')
);

// More Data Structures
const BinaryHeapDataStructure = lazy(
  () => import('@/components/data-structures/BinaryHeapDataStructure')
);
const KDTreeDataStructure = lazy(
  () => import('@/components/data-structures/KDTreeDataStructure')
);
const TrieDataStructure = lazy(
  () => import('@/components/data-structures/TrieDataStructure')
);
const HashtableDataStructure = lazy(
  () => import('@/components/data-structures/HashtableDataStructure')
);
const GraphDataStructure = lazy(
  () => import('@/components/data-structures/GraphDataStructure')
);
const SegmentTreeDataStructure = lazy(
  () => import('@/components/data-structures/SegmentTreeDataStructure')
);
const FenwickTreeDataStructure = lazy(
  () => import('@/components/data-structures/FenwickTreeDataStructure')
);
const FibonacciHeapDataStructure = lazy(
  () => import('@/components/data-structures/FibonacciHeapDataStructure')
);
const PairingHeapDataStructure = lazy(
  () => import('@/components/data-structures/PairingHeapDataStructure')
);
const BinomialHeapDataStructure = lazy(
  () => import('@/components/data-structures/BinomialHeapDataStructure')
);
const BTreeDataStructure = lazy(
  () => import('@/components/data-structures/BTreeDataStructure')
);
const BPlusTreeDataStructure = lazy(
  () => import('@/components/data-structures/BPlusTreeDataStructure')
);
const SuffixTreeDataStructure = lazy(
  () => import('@/components/data-structures/SuffixTreeDataStructure')
);
const SkipListDataStructure = lazy(
  () => import('@/components/data-structures/SkipListDataStructure')
);
const DisjointSetDataStructure = lazy(
  () => import('@/components/data-structures/DisjointSetDataStructure')
);
const BloomFilterDataStructure = lazy(
  () => import('@/components/data-structures/BloomFilterDataStructure')
);
const CountMinSketchDataStructure = lazy(
  () => import('@/components/data-structures/CountMinSketchDataStructure')
);
const HyperLogLogDataStructure = lazy(
  () => import('@/components/data-structures/HyperLogLogDataStructure')
);
const RTreeDataStructure = lazy(
  () => import('@/components/data-structures/RTreeDataStructure')
);
const QuadTreeDataStructure = lazy(
  () => import('@/components/data-structures/QuadTreeDataStructure')
);
const OctreeDataStructure = lazy(
  () => import('@/components/data-structures/OctreeDataStructure')
);
const MerkleTreeDataStructure = lazy(
  () => import('@/components/data-structures/MerkleTreeDataStructure')
);
const CuckooFilterDataStructure = lazy(
  () => import('@/components/data-structures/CuckooFilterDataStructure')
);
const DancingLinksDataStructure = lazy(
  () => import('@/components/data-structures/DancingLinksDataStructure')
);
const SelfOrganizingListDataStructure = lazy(
  () => import('@/components/data-structures/SelfOrganizingListDataStructure')
);
const UnrolledLinkedListDataStructure = lazy(
  () => import('@/components/data-structures/UnrolledLinkedListDataStructure')
);
const XORLinkedListDataStructure = lazy(
  () => import('@/components/data-structures/XORLinkedListDataStructure')
);
const SparseMatrixDataStructure = lazy(
  () => import('@/components/data-structures/SparseMatrixDataStructure')
);
const SuffixArrayDataStructure = lazy(
  () => import('@/components/data-structures/SuffixArrayDataStructure')
);
const RopeDataStructure = lazy(
  () => import('@/components/data-structures/RopeDataStructure')
);
const LRUCacheDataStructure = lazy(
  () => import('@/components/data-structures/LRUCacheDataStructure')
);
const LFUCacheDataStructure = lazy(
  () => import('@/components/data-structures/LFUCacheDataStructure')
);
const CircularBufferDataStructure = lazy(
  () => import('@/components/data-structures/CircularBufferDataStructure')
);

// Algorithms
const BfsAlgorithmCircus = lazy(
  () => import('@/components/algorithms/BfsAlgorithmCircus')
);
const DfsAlgorithmCircus = lazy(
  () => import('@/components/algorithms/DfsAlgorithmCircus')
);
const BubbleSortCircus = lazy(
  () => import('@/components/algorithms/BubbleSortCircus')
);
const SelectionSortAlgorithmCircus = lazy(
  () => import('@/components/algorithms/SelectionSortAlgorithmCircus')
);
const InsertionSortCircus = lazy(
  () => import('@/components/algorithms/InsertionSortCircus')
);
const MergeSortCircus = lazy(
  () => import('@/components/algorithms/MergeSortCircus')
);
const QuickSortCircus = lazy(
  () => import('@/components/algorithms/QuickSortCircus')
);
const HeapSortCircus = lazy(
  () => import('@/components/algorithms/HeapSortCircus')
);
const CountingSortCircus = lazy(
  () => import('@/components/algorithms/CountingSortCircus')
);
const RadixSortCircus = lazy(
  () => import('@/components/algorithms/RadixSortCircus')
);
const BinarySearchCircus = lazy(
  () => import('@/components/algorithms/BinarySearchCircus')
);
const LinearSearchCircus = lazy(
  () => import('@/components/algorithms/LinearSearchCircus')
);
const DijkstraAlgorithm = lazy(
  () => import('@/components/algorithms/DijkstraAlgorithm')
);
const NQueensCircus = lazy(
  () => import('@/components/algorithms/NQueensCircus')
);
const FibonacciDPCircus = lazy(
  () => import('@/components/algorithms/FibonacciDPCircus')
);
const BellmanFordCircus = lazy(
  () => import('@/components/algorithms/BellmanFordCircus')
);
const FloydWarshallCircus = lazy(
  () => import('@/components/algorithms/FloydWarshallCircus')
);
const TopologicalSortCircus = lazy(
  () => import('@/components/algorithms/TopologicalSortCircus')
);
const KruskalCircus = lazy(
  () => import('@/components/algorithms/KruskalCircus')
);
const PrimCircus = lazy(
  () => import('@/components/algorithms/PrimCircus')
);
const HuffmanCodingCircus = lazy(
  () => import('@/components/algorithms/HuffmanCodingCircus')
);
const LCSCircus = lazy(
  () => import('@/components/algorithms/LCSCircus')
);
const KnapsackCircus = lazy(
  () => import('@/components/algorithms/KnapsackCircus')
);
const LISCircus = lazy(
  () => import('@/components/algorithms/LISCircus')
);
const KMPCircus = lazy(
  () => import('@/components/algorithms/KMPCircus')
);
const SieveCircus = lazy(
  () => import('@/components/algorithms/SieveCircus')
);
const BucketSortCircus = lazy(
  () => import('@/components/algorithms/BucketSortCircus')
);
const JumpSearchCircus = lazy(
  () => import('@/components/algorithms/JumpSearchCircus')
);
const InterpolationSearchCircus = lazy(
  () => import('@/components/algorithms/InterpolationSearchCircus')
);
const ExponentialSearchCircus = lazy(
  () => import('@/components/algorithms/ExponentialSearchCircus')
);
const SudokuSolverCircus = lazy(
  () => import('@/components/algorithms/SudokuSolverCircus')
);
const GrahamScanCircus = lazy(
  () => import('@/components/algorithms/GrahamScanCircus')
);
const KMeansCircus = lazy(
  () => import('@/components/algorithms/KMeansCircus')
);

// Problems
const TwoSumProblem = lazy(
  () => import('@/components/problems/TwoSumProblem')
);

// Pages
const Home = lazy(() => import('../pages/Home'));
const DataStructuresDashboard = lazy(
  () => import('../pages/DataStructuresDashboard')
);
const AlgorithmsDashboard = lazy(() => import('../pages/AlgorithmsDashboard'));
const ProblemsDashboard = lazy(() => import('../pages/ProblemsDashboard'));

// Wrap component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingComponent />}>
    <Component />
  </Suspense>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: withSuspense(Home),
      },
      // Data Structures routes
      {
        path: 'datastructure',
        element: withSuspense(DataStructuresDashboard),
      },
      {
        path: 'ds-array',
        element: withSuspense(ArrayDataStructure),
      },
      {
        path: 'ds-stack',
        element: withSuspense(StackDataStructure),
      },
      {
        path: 'ds-queue',
        element: withSuspense(QueueDataStructure),
      },
      {
        path: 'ds-linklist',
        element: withSuspense(LinkedListDataStructure),
      },
      {
        path: 'ds-binary-tree',
        element: withSuspense(BinaryTreeDataStructure),
      },
      {
        path: 'ds-bst',
        element: withSuspense(BinarySearchTree),
      },
      {
        path: 'ds-red-black-tree',
        element: withSuspense(RedBlackTreeDataStructure),
      },
      {
        path: 'ds-avl-tree',
        element: withSuspense(AVLTreeDataStructure),
      },
      {
        path: 'ds-kd-tree',
        element: withSuspense(KDTreeDataStructure),
      },
      {
        path: 'ds-hash-table',
        element: withSuspense(HashtableDataStructure),
      },
      {
        path: 'ds-graph',
        element: withSuspense(GraphDataStructure),
      },
      {
        path: 'ds-binary-heap',
        element: withSuspense(BinaryHeapDataStructure),
      },
      {
        path: 'ds-trie',
        element: withSuspense(TrieDataStructure),
      },
      {
        path: 'ds-segment-tree',
        element: withSuspense(SegmentTreeDataStructure),
      },
      {
        path: 'ds-fenwick-tree',
        element: withSuspense(FenwickTreeDataStructure),
      },
      {
        path: 'ds-fibonacci-heap',
        element: withSuspense(FibonacciHeapDataStructure),
      },
      {
        path: 'ds-pairing-heap',
        element: withSuspense(PairingHeapDataStructure),
      },
      {
        path: 'ds-binomial-heap',
        element: withSuspense(BinomialHeapDataStructure),
      },
      {
        path: 'ds-b-tree',
        element: withSuspense(BTreeDataStructure),
      },
      {
        path: 'ds-b-plus-tree',
        element: withSuspense(BPlusTreeDataStructure),
      },
      {
        path: 'ds-suffix-tree',
        element: withSuspense(SuffixTreeDataStructure),
      },
      {
        path: 'ds-priority-queue',
        element: withSuspense(PriorityQueueDataStructure),
      },
      {
        path: 'ds-deque',
        element: withSuspense(DequeDataStructure),
      },
      {
        path: 'ds-circular-queue',
        element: withSuspense(CircularQueueDataStructure),
      },
      {
        path: 'ds-skip-list',
        element: withSuspense(SkipListDataStructure),
      },
      {
        path: 'ds-disjoint-set',
        element: withSuspense(DisjointSetDataStructure),
      },
      {
        path: 'ds-bloom-filter',
        element: withSuspense(BloomFilterDataStructure),
      },
      {
        path: 'ds-count-min-sketch',
        element: withSuspense(CountMinSketchDataStructure),
      },
      {
        path: 'ds-hyperloglog',
        element: withSuspense(HyperLogLogDataStructure),
      },
      {
        path: 'ds-r-tree',
        element: withSuspense(RTreeDataStructure),
      },
      {
        path: 'ds-quad-tree',
        element: withSuspense(QuadTreeDataStructure),
      },
      {
        path: 'ds-octree',
        element: withSuspense(OctreeDataStructure),
      },
      {
        path: 'ds-merkle-tree',
        element: withSuspense(MerkleTreeDataStructure),
      },
      {
        path: 'ds-cuckoo-filter',
        element: withSuspense(CuckooFilterDataStructure),
      },
      {
        path: 'ds-dancing-links',
        element: withSuspense(DancingLinksDataStructure),
      },
      {
        path: 'ds-self-organizing-list',
        element: withSuspense(SelfOrganizingListDataStructure),
      },
      {
        path: 'ds-unrolled-linked-list',
        element: withSuspense(UnrolledLinkedListDataStructure),
      },
      {
        path: 'ds-xor-linked-list',
        element: withSuspense(XORLinkedListDataStructure),
      },
      {
        path: 'ds-sparse-matrix',
        element: withSuspense(SparseMatrixDataStructure),
      },
      {
        path: 'ds-suffix-array',
        element: withSuspense(SuffixArrayDataStructure),
      },
      {
        path: 'ds-rope',
        element: withSuspense(RopeDataStructure),
      },
      {
        path: 'ds-lru-cache',
        element: withSuspense(LRUCacheDataStructure),
      },
      {
        path: 'ds-lfu-cache',
        element: withSuspense(LFUCacheDataStructure),
      },
      {
        path: 'ds-circular-buffer',
        element: withSuspense(CircularBufferDataStructure),
      },

      // Algorithms routes
      {
        path: 'algorithms',
        element: withSuspense(AlgorithmsDashboard),
      },
      {
        path: 'algo-bfs',
        element: withSuspense(BfsAlgorithmCircus),
      },
      {
        path: 'algo-dfs',
        element: withSuspense(DfsAlgorithmCircus),
      },
      {
        path: 'algo-bubble-sort',
        element: withSuspense(BubbleSortCircus),
      },
      {
        path: 'algo-selection-sort',
        element: withSuspense(SelectionSortAlgorithmCircus),
      },
      {
        path: 'algo-insertion-sort',
        element: withSuspense(InsertionSortCircus),
      },
      {
        path: 'algo-merge-sort',
        element: withSuspense(MergeSortCircus),
      },
      {
        path: 'algo-quick-sort',
        element: withSuspense(QuickSortCircus),
      },
      {
        path: 'algo-heap-sort',
        element: withSuspense(HeapSortCircus),
      },
      {
        path: 'algo-counting-sort',
        element: withSuspense(CountingSortCircus),
      },
      {
        path: 'algo-radix-sort',
        element: withSuspense(RadixSortCircus),
      },
      {
        path: 'algo-binary-search',
        element: withSuspense(BinarySearchCircus),
      },
      {
        path: 'algo-linear-search',
        element: withSuspense(LinearSearchCircus),
      },
      {
        path: 'algo-dijkstra',
        element: withSuspense(DijkstraAlgorithm),
      },
      {
        path: 'algo-n-queens',
        element: withSuspense(NQueensCircus),
      },
      {
        path: 'algo-fibonacci',
        element: withSuspense(FibonacciDPCircus),
      },
      {
        path: 'algo-bellman-ford',
        element: withSuspense(BellmanFordCircus),
      },
      {
        path: 'algo-floyd-warshall',
        element: withSuspense(FloydWarshallCircus),
      },
      {
        path: 'algo-topological-sort',
        element: withSuspense(TopologicalSortCircus),
      },
      {
        path: 'algo-kruskal',
        element: withSuspense(KruskalCircus),
      },
      {
        path: 'algo-prim',
        element: withSuspense(PrimCircus),
      },
      {
        path: 'algo-huffman',
        element: withSuspense(HuffmanCodingCircus),
      },
      {
        path: 'algo-lcs',
        element: withSuspense(LCSCircus),
      },
      {
        path: 'algo-knapsack',
        element: withSuspense(KnapsackCircus),
      },
      {
        path: 'algo-lis',
        element: withSuspense(LISCircus),
      },
      {
        path: 'algo-kmp',
        element: withSuspense(KMPCircus),
      },
      {
        path: 'algo-sieve',
        element: withSuspense(SieveCircus),
      },
      {
        path: 'algo-bucket-sort',
        element: withSuspense(BucketSortCircus),
      },
      {
        path: 'algo-jump-search',
        element: withSuspense(JumpSearchCircus),
      },
      {
        path: 'algo-interpolation-search',
        element: withSuspense(InterpolationSearchCircus),
      },
      {
        path: 'algo-exponential-search',
        element: withSuspense(ExponentialSearchCircus),
      },
      {
        path: 'algo-sudoku',
        element: withSuspense(SudokuSolverCircus),
      },
      {
        path: 'algo-graham-scan',
        element: withSuspense(GrahamScanCircus),
      },
      {
        path: 'algo-k-means',
        element: withSuspense(KMeansCircus),
      },

      // Problems routes
      {
        path: 'problems',
        element: withSuspense(ProblemsDashboard),
      },
      {
        path: 'problem-two-sum',
        element: withSuspense(TwoSumProblem),
      },

      // Catch-all route for 404
      {
        path: '*',
        element: (
          <div className='flex h-full w-full items-center justify-center'>
            <div className='text-center'>
              <h2 className='text-2xl font-bold mb-4'>Page Not Found</h2>
              <p>
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
          </div>
        ),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export default router;
