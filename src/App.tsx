import AlgorithmVisualizer from './components/AlgorithmVisualizer';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import { useEffect } from 'react';
import RootLayout from './components/RootLayout';
import { Outlet, RouterProvider, Routes, Route } from 'react-router-dom';
import dsRoutesList from './routes/ds-routes';
// import ArrayDataStructure from './components/data-structures/ArrayDataStructure';
import Home from './pages/Home';
import DataStructuresDashboard from './pages/DataStructuresDashboard';
import BfsAlgorithmCircus from './components/algorithms/BfsAlgorithmCircus';
import DfsAlgorithmCircus from './components/algorithms/DfsAlgorithmCircus';
import BubbleSortCircus from './components/algorithms/BubbleSortCircus';
import BinarySearchCircus from './components/algorithms/BinarySearchCircus';
import MergeSortCircus from './components/algorithms/MergeSortCircus';
import InsertionSortCircus from './components/algorithms/InsertionSortCircus';

const App = () => {
  useEffect(() => {
    //     toast('Welcome to Big O Circus');
  }, []);
  // <Suspense fallback={<div>Loading...</div>}>

  return (
    <RootLayout>
      <Routes>
        <Route path='/' element={<Home />}></Route>
      </Routes>
    </RootLayout>
  );
};

export default App;
