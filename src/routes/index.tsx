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
const SkipListDataStructure = lazy(
  () => import('@/components/data-structures/SkipListDataStructure')
);
const DisjointSetDataStructure = lazy(
  () => import('@/components/data-structures/DisjointSetDataStructure')
);
const BloomFilterDataStructure = lazy(
  () => import('@/components/data-structures/BloomFilterDataStructure')
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

// Pages
const Home = lazy(() => import('../pages/Home'));
const DataStructuresDashboard = lazy(
  () => import('../pages/DataStructuresDashboard')
);
const AlgorithmsDashboard = lazy(() => import('../pages/AlgorithmsDashboard'));

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
