import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from '../App';
import LoadingComponent from '../components/LoadingComponent';
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
    path: '/ds-stack',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <StackDataStructure />
      </Suspense>
    ),
  },
  {
    path: '/ds-queue',
    element: (
      <Suspense fallback={<LoadingComponent />}>
        <QueueDataStructure />
      </Suspense>
    ),
  },
];

const rootRouteList = createBrowserRouter(routes);

export default rootRouteList;
