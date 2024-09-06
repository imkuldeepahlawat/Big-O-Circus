import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import LoadingComponent from '../components/LoadingComponent';
import ArrayDataStructure from '@/components/data-structures/ArrayDataStructure';
import LinkedListDataStructure from '@/components/data-structures/LinkedlistDataStructure';
import BinaryTreeDataStructure from '@/components/data-structures/BinaryTreeDataStructure';
import BfsAlgorithmCircus from '@/components/algorithms/BfsAlgorithmCircus';
import DfsAlgorithmCircus from '@/components/algorithms/DfsAlgorithmCircus';
const QueueDataStructure = lazy(
  () => import('../components/data-structures/QueueDataStructure')
);
const StackDataStructure = lazy(
  () => import('../components/data-structures/StackDataStructure')
);

const DataStructuresDashboard = lazy(
  () => import('../pages/DataStructuresDashboard')
);
const AlgorithmsDashboard = lazy(() => import('../pages/AlgorithmsDashboard'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
  },
  ,
  {
    path: '/data-structure',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <DataStructuresDashboard />
      </Suspense>
    ),
  },
  {
    path: '/algorithms',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <AlgorithmsDashboard />
      </Suspense>
    ),
  },
  {
    path: '/ds-array',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <ArrayDataStructure />
      </Suspense>
    ),
  },
  {
    path: '/ds-stack',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <StackDataStructure />
      </Suspense>
    ),
  },
  // ArrayDataStructure
  {
    path: '/ds-queue',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <QueueDataStructure />
      </Suspense>
    ),
  },
  {
    path: '/ds-linklist',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <LinkedListDataStructure />
      </Suspense>
    ),
  },
  {
    path: '/ds-binarytree',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <BinaryTreeDataStructure />
      </Suspense>
    ),
  },
  {
    path: '/algo-bfs',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <BfsAlgorithmCircus />
      </Suspense>
    ),
  },
  {
    path: '/algo-dfs',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <DfsAlgorithmCircus />
      </Suspense>
    ),
  },
];

const rootRouteList = createBrowserRouter(routes);

export default rootRouteList;
