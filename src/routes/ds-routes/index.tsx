import { lazy, Suspense } from 'react';

import StackDataStructure from '../../components/data-structures/StackDataStructure';
import QueueDataStructure from '../../components/data-structures/QueueDataStructure';
import Home from '../../pages/Home';
import DataStructuresDashboard from '../../pages/DataStructuresDashboard';

const routes = [
  {
    path: '/stack',
    element: <StackDataStructure />,
  },
  {
    path: '/queue',
    element: <QueueDataStructure />,
  },
];

export default routes;
