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
