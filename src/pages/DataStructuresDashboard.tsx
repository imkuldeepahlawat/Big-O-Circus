import React from 'react';
import {
  Link,
  Route,
  Routes,
  useLocation,
  useMatch,
  useResolvedPath,
} from 'react-router-dom';
import dsRoutesList from '../routes/ds-routes';
import RootLayout from '../components/RootLayout';
import Home from './Home';
import StackDataStructure from '../components/data-structures/StackDataStructure';

type Props = {};

const DataStructuresDashboard = (props: Props) => {
  return (
    <RootLayout>
      <Link to={`/ds-stack`}>
        <li className='rounded-md border  px-4 cursor-pointer'>Stack</li>
      </Link>
      <Link to={`/ds-queue`}>
        <li className='rounded-md border  px-4 cursor-pointer'>Queue</li>
      </Link>
    </RootLayout>
  );
};

export default DataStructuresDashboard;
